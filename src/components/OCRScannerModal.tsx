import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Store,
  DollarSign,
  ShieldCheck,
  ScanLine,
} from 'lucide-react';
import { Category, Expense, OCRResult } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Modal } from './Modal';
import { formatRupiah, getTodayDateString, parseRupiahInput } from '../utils/format';
import { processReceiptWithOCR } from '../services/ocr';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onExpenseAdded: (expense: Expense) => void;
}

export const OCRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onExpenseAdded,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [confirmedAmountStr, setConfirmedAmountStr] = useState('');
  const [confirmedMerchant, setConfirmedMerchant] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id || '');
    }
  }, [isOpen, categories, selectedCategoryId]);

  const handleReset = () => {
    setOcrResult(null);
    setIsProcessing(false);
    setProgressStatus('');
    setProgressPercent(0);
    setConfirmedAmountStr('');
    setConfirmedMerchant('');
    setConfirmedDate('');
    setNote('');
    setDuplicateWarning(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileSelected = async (selectedFile: File) => {
    setErrorMsg(null);
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Pilih file gambar dengan format JPG, PNG, atau WebP.');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 15 MB.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStatus('Membaca file gambar...');

    try {
      const result = await processReceiptWithOCR(selectedFile, (status, pct) => {
        setProgressStatus(status);
        setProgressPercent(pct);
      });

      setOcrResult(result);
      setConfirmedAmountStr(result.selectedAmount ? result.selectedAmount.toLocaleString('id-ID') : '');
      setConfirmedMerchant(result.merchant || '');
      setConfirmedDate(result.date);

      if (result.merchant) {
        const m = result.merchant.toLowerCase();
        if (/kantin|makan|kfc|mcdonald|resto|warung|padang|kopi|bakso/i.test(m)) {
          const makanCat = categories.find((c) => /makan/i.test(c.name));
          if (makanCat) setSelectedCategoryId(makanCat.id);
        } else if (/gojek|grab|maxim|bensin|pertamina|parkir/i.test(m)) {
          const transCat = categories.find((c) => /trans/i.test(c.name));
          if (transCat) setSelectedCategoryId(transCat.id);
        } else if (/telkomsel|indosat|xl|smartfren|pulsa|kuota/i.test(m)) {
          const pulsaCat = categories.find((c) => /kuota|pulsa/i.test(c.name));
          if (pulsaCat) setSelectedCategoryId(pulsaCat.id);
        } else if (/indomaret|alfamart|shopee|tokopedia|supermarket/i.test(m)) {
          const belanjaCat = categories.find((c) => /belanja/i.test(c.name));
          if (belanjaCat) setSelectedCategoryId(belanjaCat.id);
        }
      }

      if (result.selectedAmount > 0) {
        const dup = StorageService.getInstance().checkPossibleDuplicate(
          result.selectedAmount,
          result.date,
          result.merchant
        );
        setDuplicateWarning(
          dup
            ? 'Kemungkinan duplikat: Struk dengan nominal dan toko ini sudah pernah dicatat.'
            : null
        );
      }
    } catch {
      const fallbackDate = getTodayDateString();
      setErrorMsg('Gambar tidak terbaca otomatis. Kamu tetap bisa mengisi nominal secara manual di bawah.');
      setOcrResult({
        merchant: '',
        date: fallbackDate,
        amounts: [],
        selectedAmount: 0,
        rawText: '',
        previewUrl: URL.createObjectURL(selectedFile),
      });
      setConfirmedDate(fallbackDate);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveConfirmed = () => {
    const finalAmount = parseRupiahInput(confirmedAmountStr);
    if (finalAmount <= 0) {
      setErrorMsg('Nominal harus lebih dari Rp0.');
      return;
    }

    const storage = StorageService.getInstance();
    const newExp = storage.addExpense({
      category_id: selectedCategoryId || categories[0]?.id || '',
      amount: finalAmount,
      spent_on: confirmedDate || getTodayDateString(),
      merchant: confirmedMerchant.trim() || undefined,
      note: note.trim() || undefined,
      source: 'ocr',
    });

    onExpenseAdded(newExp);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="ocr-modal-title"
      maxWidthClass="max-w-xl"
    >
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#0F5132] border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <ScanLine className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="ocr-modal-title" className="text-base sm:text-lg font-extrabold text-zinc-900 truncate">
              Pindai Struk & Bukti Transfer
            </h2>
            <p className="text-[11px] text-zinc-600">
              Diproses 100% di browser perangkatmu
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Tutup dialog pindai struk"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
        <div className="p-3 bg-[#ECFDF5] border border-emerald-200 rounded-xl flex items-start gap-2 text-[#0F5132] text-xs">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Privasi terjaga:</strong> Gambar bukti transaksi dibaca secara lokal dan tidak diunggah ke server eksternal.
          </span>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!ocrResult && !isProcessing && (
          <div>
            <input
              id="ocr-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#D4CEC2] hover:border-[#0F5132] hover:bg-[#FAF7F2] transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center group min-h-[200px]"
            >
              <span className="w-14 h-14 rounded-xl bg-[#F2EDE4] group-hover:bg-[#ECFDF5] text-zinc-700 group-hover:text-[#0F5132] border border-[#D4CEC2] flex items-center justify-center transition-colors mb-3">
                <UploadCloud className="w-7 h-7" aria-hidden="true" />
              </span>
              <span className="font-extrabold text-zinc-900 text-sm sm:text-base mb-1">
                Pilih Screenshot Bukti Transfer atau Foto Struk
              </span>
              <span className="text-xs text-zinc-600 max-w-sm mb-4">
                Mendukung struk belanja dan screenshot e-wallet (GoPay, OVO, Dana, QRIS, BCA).
              </span>
              <span className="px-4 py-2.5 bg-[#0F5132] text-white font-bold text-xs rounded-xl">
                Pilih File Gambar
              </span>
            </button>
          </div>
        )}

        {isProcessing && (
          <div role="status" aria-live="polite" className="py-10 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-xl bg-[#ECFDF5] text-[#0F5132] border border-emerald-200 mx-auto flex items-center justify-center animate-spin">
              <RefreshCw className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-base">{progressStatus}</p>
              <p className="text-xs text-zinc-600 mt-1">
                Mendeteksi nominal Rupiah, tanggal, dan nama toko...
              </p>
            </div>
            <div
              className="w-full max-w-xs mx-auto bg-[#F2EDE4] h-2.5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres pemindaian struk"
            >
              <div
                className="bg-[#0F5132] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs font-mono text-zinc-600 tabular-nums">{progressPercent}%</p>
          </div>
        )}

        {ocrResult && (
          <div className="space-y-4 animate-fade-in">
            {duplicateWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-800 mt-0.5" aria-hidden="true" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start bg-[#FAF7F2] p-4 rounded-xl border border-[#E2DDD3]">
              {ocrResult.previewUrl && (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#F2EDE4] flex-shrink-0 border border-[#D4CEC2]">
                  <img
                    src={ocrResult.previewUrl}
                    alt="Pratinjau foto struk yang dipindai"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 w-full">
                <span className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Kandidat Nominal Terbaca:
                </span>
                {ocrResult.amounts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ocrResult.amounts.map((cand, idx) => {
                      const isCurrent = parseRupiahInput(confirmedAmountStr) === cand.amount;
                      return (
                        <button
                          key={idx}
                          type="button"
                          aria-pressed={isCurrent}
                          onClick={() => {
                            setConfirmedAmountStr(cand.amount.toLocaleString('id-ID'));
                            setErrorMsg(null);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border tabular-nums min-h-[44px] ${
                            isCurrent
                              ? 'bg-zinc-900 text-[#FAF7F2] border-zinc-900'
                              : 'bg-white text-zinc-800 border-[#D4CEC2] hover:bg-[#F2EDE4]'
                          }`}
                        >
                          {formatRupiah(cand.amount)}
                          {cand.label && (
                            <span className="ml-1 opacity-80 font-normal text-[11px]">
                              ({cand.label})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-950 bg-amber-50 p-2.5 rounded-xl border border-amber-300">
                    Nominal otomatis tidak terbaca jelas. Silakan ketik angka pada formulir di bawah.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="ocr-amount" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Nominal Akhir (Wajib Dikonfirmasi)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
                    Rp
                  </span>
                  <input
                    id="ocr-amount"
                    type="text"
                    inputMode="numeric"
                    value={confirmedAmountStr}
                    onChange={(e) => {
                      const parsed = parseRupiahInput(e.target.value);
                      setConfirmedAmountStr(parsed === 0 ? '' : parsed.toLocaleString('id-ID'));
                      setErrorMsg(null);
                    }}
                    className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-white border border-[#D4CEC2] focus:border-[#C2410C] rounded-xl outline-none tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ocr-merchant" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    <span>Nama Toko / Merchant</span>
                  </label>
                  <input
                    id="ocr-merchant"
                    type="text"
                    value={confirmedMerchant}
                    placeholder="Contoh: Indomaret, Kantin"
                    onChange={(e) => setConfirmedMerchant(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="ocr-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    <span>Tanggal Transaksi</span>
                  </label>
                  <input
                    id="ocr-date"
                    type="date"
                    value={confirmedDate}
                    onChange={(e) => setConfirmedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Kategori Pengeluaran
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {categories
                    .filter((c) => !c.is_archived)
                    .map((cat) => {
                      const isSelected = cat.id === selectedCategoryId;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`flex flex-col items-center p-2 rounded-xl border transition-colors min-h-[58px] ${
                            isSelected
                              ? 'border-zinc-900 bg-[#F2EDE4] ring-1 ring-zinc-900'
                              : 'border-[#D4CEC2] bg-white hover:bg-[#FAF7F2] text-zinc-800'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 border border-zinc-900/15"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={14} />
                          </div>
                          <span className="text-[11px] font-bold truncate w-full text-center text-zinc-900">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="ocr-note" className="block text-xs font-bold text-zinc-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  id="ocr-note"
                  type="text"
                  maxLength={200}
                  placeholder="Contoh: Belanja bulanan kos"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 border-t border-[#E2DDD3] bg-[#FAF7F2] flex items-center justify-between gap-3">
        {ocrResult ? (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-4 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
            >
              Ganti Gambar
            </button>
            <button
              type="button"
              disabled={parseRupiahInput(confirmedAmountStr) <= 0}
              onClick={handleSaveConfirmed}
              className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 rounded-xl min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Konfirmasi & Simpan</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 px-4 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
          >
            Tutup
          </button>
        )}
      </div>
    </Modal>
  );
};
