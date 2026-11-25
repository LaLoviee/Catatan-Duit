import { createWorker } from 'tesseract.js';
import { OCRResult, OCRCandidate } from '../types';
import { getTodayDateString } from '../utils/format';

/**
 * Preprocesses image on an offscreen canvas:
 * - Resizes if excessively large (> 2000px) to speed up mobile OCR
 * - Grayscale conversion and high-contrast boost for receipt readability
 */
export async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension clamp
        const maxDim = 1800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw original
        ctx.drawImage(img, 0, 0, width, height);

        // Get pixel data for contrast adjustment
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Simple contrast & threshold boost
        for (let i = 0; i < data.length; i += 4) {
          // Luminance formula
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Slight contrast stretch
          const contrast = 1.2;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

          data[i] = adjusted;     // R
          data[i + 1] = adjusted; // G
          data[i + 2] = adjusted; // B
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts candidate amounts, merchant, and date from raw OCR text
 */
export function parseReceiptText(text: string): {
  merchant: string;
  date: string;
  amounts: OCRCandidate[];
  selectedAmount: number;
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Merchant Detection
  // Common keywords to detect merchant names or e-wallet transactions
  let merchant = '';
  const merchantRegex = /(indomaret|alfamart|starbucks|kfc|mcdonald|hokben|kopi kenangan|janji jiwa|solaria|kantin|warung|rm |gofood|shopeefood|grabfood|tokopedia|shopee|lazada|blibli)/i;
  
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    const match = line.match(merchantRegex);
    if (match) {
      merchant = line;
      break;
    }
  }

  // If not found in early lines, inspect first 2 non-empty lines
  if (!merchant && lines.length > 0) {
    const candidateLine = lines.find((l) => l.length > 3 && !/(\d{4}|total|rp|struk|nota|selamat|terima)/i.test(l));
    if (candidateLine) {
      merchant = candidateLine.slice(0, 35);
    }
  }

  // 2. Date Detection
  let date = getTodayDateString();
  // Regex for DD/MM/YYYY or DD-MM-YYYY or DD MMM YYYY
  const dateRegex = /(\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b)/;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const parts = dateMatch[1].split(/[./-]/);
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        // Swap if month/day reversed
        if (month > 12 && day <= 12) {
          const tmp = day;
          day = month;
          month = tmp;
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2035) {
          date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          break;
        }
      }
    }
  }

  // 3. Amount candidates extraction
  // Handles: "Rp 50.000", "Rp50.000,00", "Total: 35.000", "50000", "IDR 24.500"
  const candidatesMap = new Map<number, OCRCandidate>();

  lines.forEach((line) => {
    // Check line for context labels
    const isTotalLine = /(total|jumlah|pembayaran|nominal|grand total|bayar)/i.test(line);
    const isSubtotal = /(subtotal|item|harga)/i.test(line);
    const isKembalian = /(kembali|change)/i.test(line);

    // Look for numbers with dot thousand separators or Rp prefixes
    const numberMatches = line.matchAll(/(?:rp\.?|idr)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{4,9})/gi);

    for (const match of numberMatches) {
      const rawNumberStr = match[1];
      // Clean up punctuation
      let cleanStr = rawNumberStr.replace(/\s/g, '');
      
      // If ends with ,00 or .00 (cents), remove cents
      if (cleanStr.includes(',') && cleanStr.split(',')[1].length === 2) {
        cleanStr = cleanStr.split(',')[0];
      } else if (cleanStr.includes('.') && cleanStr.split('.')[1].length === 2 && cleanStr.indexOf('.') === cleanStr.lastIndexOf('.')) {
        cleanStr = cleanStr.split('.')[0];
      }

      // Remove dots and commas
      const digitsOnly = cleanStr.replace(/[^\d]/g, '');
      const parsedAmount = parseInt(digitsOnly, 10);

      // Filters: realistic student transaction between Rp 1.000 and Rp 50.000.000
      // Ignore years (e.g. 2024, 2025, 2026), phone numbers, or tiny amounts
      if (
        parsedAmount >= 1000 &&
        parsedAmount <= 50000000 &&
        parsedAmount !== 2024 &&
        parsedAmount !== 2025 &&
        parsedAmount !== 2026
      ) {
        let confidence = 50;
        let label = 'Nominal terdeteksi';

        if (isTotalLine) {
          confidence += 40;
          label = 'Total Pembayaran';
        } else if (isSubtotal) {
          confidence += 20;
          label = 'Subtotal';
        } else if (isKembalian) {
          confidence -= 30;
          label = 'Kembalian';
        }

        if (line.toLowerCase().includes('rp')) {
          confidence += 15;
        }

        // Avoid adding duplicate amounts
        if (!candidatesMap.has(parsedAmount) || (candidatesMap.get(parsedAmount)?.confidence || 0) < confidence) {
          candidatesMap.set(parsedAmount, {
            amount: parsedAmount,
            confidence,
            rawText: line,
            label,
          });
        }
      }
    }
  });

  const amounts = Array.from(candidatesMap.values()).sort((a, b) => b.confidence - a.confidence);

  // Default selected amount is the highest confidence candidate, or 0
  const selectedAmount = amounts.length > 0 ? amounts[0].amount : 0;

  return {
    merchant: merchant.trim(),
    date,
    amounts,
    selectedAmount,
  };
}

/**
 * Runs OCR on file in browser using Tesseract.js
 */
export async function processReceiptWithOCR(
  file: File,
  onProgress?: (progressText: string, percent: number) => void
): Promise<OCRResult> {
  onProgress?.('Menyiapkan gambar...', 10);
  const preprocessedUrl = await preprocessImage(file);

  onProgress?.('Memuat modul OCR Tesseract...', 25);
  const worker = await createWorker('ind+eng', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = 30 + Math.round((m.progress || 0) * 60);
        onProgress?.(`Membaca teks dari gambar... ${Math.round((m.progress || 0) * 100)}%`, pct);
      }
    },
  });

  onProgress?.('Menganalisis teks & nominal...', 90);
  const result = await worker.recognize(preprocessedUrl);
  await worker.terminate();

  const parsed = parseReceiptText(result.data.text);
  onProgress?.('Selesai! Konfirmasi data.', 100);

  return {
    ...parsed,
    rawText: result.data.text,
    previewUrl: preprocessedUrl,
  };
}
