// Helper utilities for Indonesian formatting (Rupiah, WIB date, days count)

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp0';
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export function parseRupiahInput(value: string): number {
  const digitsOnly = value.replace(/\D/g, '');
  return parseInt(digitsOnly || '0', 10);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateIndoFull(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthLaterDateString(fromToday = new Date()): string {
  const nextMonth = new Date(fromToday);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates remaining days inclusive of today until period_end.
 * As per PRD 9 & 10.1:
 * "Hari tersisa dihitung termasuk hari ini (minimal 1)"
 */
export function calculateDaysRemaining(periodEndStr: string): {
  days: number;
  isOverdue: boolean;
} {
  const todayStr = getTodayDateString();
  const today = new Date(todayStr + 'T00:00:00');
  const periodEnd = new Date(periodEndStr + 'T00:00:00');

  const diffTime = periodEnd.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive today

  if (diffDays <= 0) {
    return { days: 1, isOverdue: true };
  }
  return { days: diffDays, isOverdue: false };
}
