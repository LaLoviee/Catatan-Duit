import React, { useEffect, useState } from 'react';
import { X, ArrowDownToLine, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { formatRupiah, getTodayDateString, parseRupiahInput } from '../utils/format';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  onTopupAdded: () => void;
}

export const TopupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  budgetId,
  onTopupAdded,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [receivedOn, setReceivedOn] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReceivedOn(getTodayDateString());
      setFormError(null);
    }
  }, [isOpen]);

  const numericAmount = parseRupiahInput(amountStr);

  const handleClose = () => {
    setAmountStr('');
    setNote('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setFormError('Nominal pemasukan tambahan harus lebih dari Rp0.');
      return;
    }

    const storage = StorageService.getInstance();
    storage.addTopup(budgetId, numericAmount, receivedOn, note.trim() || undefined);
    onTopupAdded();
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} labelledBy="topup-modal-title" maxWidthClass="max-w-sm">
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#0F5132] border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="topup-modal-title" className="text-base font-extrabold text-zinc-900 truncate">
              Catat Pemasukan Tambahan
            </h2>
            <p className="text-[11px] text-zinc-600 truncate">
              Tambahan dari orang tua, bonus, atau beasiswa
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Tutup dialog pemasukan tambahan"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="topup-amount" className="block text-xs font-bold text-zinc-700 mb-1">
            Nominal Masuk
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
              Rp
            </span>
            <input
              id="topup-amount"
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={amountStr}
              onChange={(e) => {
                const p = parseRupiahInput(e.target.value);
                setAmountStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                setFormError(null);
              }}
              className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[44px]"
            />
          </div>
          {numericAmount > 0 && (
            <p className="text-xs font-semibold text-[#0F5132] mt-1.5 tabular-nums">
              +{formatRupiah(numericAmount)} akan menambah batas dana belanja periode ini.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="topup-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Tanggal Diterima</span>
          </label>
          <input
            id="topup-date"
            type="date"
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="topup-note" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Catatan / Dari Siapa</span>
          </label>
          <input
            id="topup-note"
            type="text"
            placeholder="Contoh: Tambahan uang buku dari ibu"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
          />
        </div>

        {formError && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={numericAmount <= 0}
            className="flex-1 py-2.5 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 rounded-xl min-h-[44px]"
          >
            Tambah Dana
          </button>
        </div>
      </form>
    </Modal>
  );
};
