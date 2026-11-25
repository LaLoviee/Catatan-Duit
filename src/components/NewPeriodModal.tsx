import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, PiggyBank, CalendarPlus, AlertCircle } from 'lucide-react';
import { MonthlyBudget } from '../types';
import { Modal } from './Modal';
import {
  formatRupiah,
  getTodayDateString,
  getMonthLaterDateString,
  parseRupiahInput,
} from '../utils/format';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPeriodCreated: (budget: MonthlyBudget) => void;
  currentBudget?: MonthlyBudget | null;
}

export const NewPeriodModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPeriodCreated,
  currentBudget,
}) => {
  const [allowanceStr, setAllowanceStr] = useState('2.000.000');
  const [savingsTargetStr, setSavingsTargetStr] = useState('200.000');
  const [periodStart, setPeriodStart] = useState(getTodayDateString());
  const [periodEnd, setPeriodEnd] = useState(getMonthLaterDateString(new Date()));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAllowanceStr(
        currentBudget ? currentBudget.allowance_amount.toLocaleString('id-ID') : '2.000.000'
      );
      setSavingsTargetStr(
        currentBudget ? currentBudget.savings_target.toLocaleString('id-ID') : '200.000'
      );
      setPeriodStart(getTodayDateString());
      setPeriodEnd(getMonthLaterDateString(new Date()));
      setFormError(null);
    }
  }, [isOpen, currentBudget]);

  const allowance = parseRupiahInput(allowanceStr);
  const savingsTarget = parseRupiahInput(savingsTargetStr);
  const spendable = Math.max(0, allowance - savingsTarget);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allowance <= 0) {
      setFormError('Uang saku harus lebih dari Rp0.');
      return;
    }
    if (savingsTarget > allowance) {
      setFormError('Target tabungan tidak boleh melebihi uang saku.');
      return;
    }
    if (periodEnd < periodStart) {
      setFormError('Tanggal akhir periode harus sama atau setelah tanggal mulai.');
      return;
    }

    const storage = StorageService.getInstance();
    const newBudget = storage.createBudget(allowance, savingsTarget, periodStart, periodEnd);
    onPeriodCreated(newBudget);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="new-period-title" maxWidthClass="max-w-md">
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#0F5132] border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="new-period-title" className="text-base sm:text-lg font-extrabold text-zinc-900 truncate">
              Buka Periode Uang Saku Baru
            </h2>
            <p className="text-[11px] text-zinc-600">
              Mulai hitung saat uang saku bulanan diterima
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Tutup dialog periode baru"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
        <div>
          <label htmlFor="period-allowance" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Nominal Uang Saku Diterima</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
              Rp
            </span>
            <input
              id="period-allowance"
              type="text"
              inputMode="numeric"
              autoFocus
              value={allowanceStr}
              onChange={(e) => {
                const p = parseRupiahInput(e.target.value);
                setAllowanceStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                setFormError(null);
              }}
              className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="period-savings" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Target Tabungan Bulan Ini (Disisihkan di Awal)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
              Rp
            </span>
            <input
              id="period-savings"
              type="text"
              inputMode="numeric"
              value={savingsTargetStr}
              onChange={(e) => {
                const p = parseRupiahInput(e.target.value);
                setSavingsTargetStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                setFormError(null);
              }}
              className="w-full pl-11 pr-4 py-2.5 text-base font-bold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[44px]"
            />
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">
            Dana yang boleh dibelanjakan:{' '}
            <strong className="text-[#0F5132] tabular-nums">{formatRupiah(spendable)}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label htmlFor="period-start-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span>Mulai Periode</span>
            </label>
            <input
              id="period-start-date"
              type="date"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setFormError(null);
              }}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="period-end-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span>Perkiraan Selesai</span>
            </label>
            <input
              id="period-end-date"
              type="date"
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setFormError(null);
              }}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
            />
          </div>
        </div>

        <div className="p-3 bg-[#F2EDE4] border border-[#D4CEC2] rounded-xl text-xs text-zinc-700 leading-relaxed">
          Sisa uang saku periode sebelumnya tidak otomatis digabung agar evaluasi pengeluaran tiap bulan tetap bersih dan terukur.
        </div>

        {formError && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="pt-2 border-t border-[#E2DDD3] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl min-h-[44px]"
          >
            Simpan & Buka Periode
          </button>
        </div>
      </form>
    </Modal>
  );
};
