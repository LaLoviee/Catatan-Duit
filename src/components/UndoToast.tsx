import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Expense } from '../types';
import { formatRupiah } from '../utils/format';

interface Props {
  deletedExpense: Expense | null;
  countdown: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<Props> = ({
  deletedExpense,
  countdown,
  onUndo,
  onDismiss,
}) => {
  if (!deletedExpense) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-fade-in"
    >
      <div className="bg-zinc-900 text-[#FAF7F2] p-3.5 rounded-xl border-2 border-zinc-900 shadow-ledger flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-zinc-300">Transaksi dihapus ({countdown} detik)</p>
          <p className="text-sm font-bold truncate tabular-nums">
            {formatRupiah(deletedExpense.amount)}
            {deletedExpense.note ? ` / ${deletedExpense.note}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors min-h-[44px]"
            aria-label="Batalkan penghapusan transaksi"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Urungkan</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup notifikasi"
            className="text-zinc-300 hover:text-white p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
