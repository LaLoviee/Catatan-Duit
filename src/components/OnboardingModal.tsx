import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  PiggyBank,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { BrandMark } from './BrandMark';
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
  onComplete: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const storage = StorageService.getInstance();

  const [allowanceStr, setAllowanceStr] = useState('2.000.000');
  const [periodStart, setPeriodStart] = useState(getTodayDateString());
  const [periodEnd, setPeriodEnd] = useState(getMonthLaterDateString(new Date()));
  const [categories] = useState<Category[]>(storage.getCategories());
  const [savingsTargetStr, setSavingsTargetStr] = useState('200.000');
  const [stepError, setStepError] = useState<string | null>(null);

  const allowance = parseRupiahInput(allowanceStr);
  const savings = parseRupiahInput(savingsTargetStr);
  const spendable = Math.max(0, allowance - savings);

  const handleFinish = () => {
    if (savings > allowance) {
      setStepError('Target tabungan tidak boleh melebihi uang saku.');
      return;
    }

    storage.createBudget(allowance, savings, periodStart, periodEnd);
    storage.saveCategories(categories);
    storage.setOnboarded(true);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      try {
        confetti({
          particleCount: 70,
          spread: 55,
          origin: { y: 0.6 },
          disableForReducedMotion: true,
        });
      } catch {
        // ignore
      }
    }

    onComplete();
  };

  const handleNext = () => {
    if (step === 1) {
      if (allowance <= 0) {
        setStepError('Masukkan nominal uang saku lebih dari Rp0.');
        return;
      }
      if (periodEnd < periodStart) {
        setStepError('Tanggal perkiraan selesai harus sama atau setelah mulai periode.');
        return;
      }
    }
    setStepError(null);
    setStep(step + 1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="onboarding-title"
      maxWidthClass="max-w-lg"
      closeOnBackdrop={false}
    >
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] bg-[#FAF7F2] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark className="w-8 h-8 flex-shrink-0" />
            <h2 id="onboarding-title" className="font-extrabold text-zinc-900 text-base truncate">
              Selamat Datang di CatatDuit
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-[#0F5132] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-emerald-200 tabular-nums">
              Langkah {step} dari 3
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Lewati pengaturan awal"
              className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="w-full bg-[#E2DDD3] h-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Langkah persiapan akun"
        >
          <div
            className="bg-[#0F5132] h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                Berapa Uang Sakumu Bulan Ini?
              </h3>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                CatatDuit menghitung sisa jatah harian yang aman dibelanjakan sampai periode berakhir.
              </p>
            </div>

            <div>
              <label htmlFor="onboard-allowance" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Uang Saku Diterima</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">
                  Rp
                </span>
                <input
                  id="onboard-allowance"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={allowanceStr}
                  onChange={(e) => {
                    const p = parseRupiahInput(e.target.value);
                    setAllowanceStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                    setStepError(null);
                  }}
                  className="w-full pl-14 pr-4 py-3 text-2xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[48px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="onboard-start" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Mulai Periode</span>
                </label>
                <input
                  id="onboard-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodStart(e.target.value);
                    setStepError(null);
                  }}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="onboard-end" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Uang Saku Berikutnya</span>
                </label>
                <input
                  id="onboard-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(e.target.value);
                    setStepError(null);
                  }}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                Kategori Pengeluaran Mahasiswa
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Kategori standar sudah disiapkan dan siap langsung dipakai untuk mencatat transaksi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2.5 p-2.5 bg-[#FAF7F2] border border-[#E2DDD3] rounded-xl"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 border border-zinc-900/15"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={15} />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                Ingin Menabung Bulan Ini?
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Target tabungan disisihkan di awal agar tidak terpakai secara tidak sengaja.
              </p>
            </div>

            <div className="p-4 bg-[#ECFDF5] border border-emerald-200 rounded-xl space-y-2.5">
              <label htmlFor="onboard-savings" className="flex items-center gap-2 text-xs font-bold text-[#0F5132]">
                <PiggyBank className="w-4 h-4" aria-hidden="true" />
                <span>Target Tabungan (Opsional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
                  Rp
                </span>
                <input
                  id="onboard-savings"
                  type="text"
                  inputMode="numeric"
                  value={savingsTargetStr}
                  onChange={(e) => {
                    const p = parseRupiahInput(e.target.value);
                    setSavingsTargetStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                    setStepError(null);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-white border border-[#D4CEC2] focus:border-[#C2410C] rounded-xl outline-none tabular-nums min-h-[44px]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border border-[#E2DDD3] rounded-xl text-xs space-y-2">
              <div className="flex justify-between text-zinc-700">
                <span>Uang Saku Diterima:</span>
                <span className="font-bold text-zinc-900 tabular-nums">{formatRupiah(allowance)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Target Tabungan:</span>
                <span className="font-bold text-[#0F5132] tabular-nums">-{formatRupiah(savings)}</span>
              </div>
              <div className="border-t border-[#E2DDD3] pt-2 flex justify-between font-extrabold text-zinc-900">
                <span>Dana Boleh Dibelanjakan:</span>
                <span className="text-[#0F5132] tabular-nums text-sm">{formatRupiah(spendable)}</span>
              </div>
            </div>
          </div>
        )}

        {stepError && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
            <span>{stepError}</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 border-t border-[#E2DDD3] bg-[#FAF7F2] flex justify-between items-center gap-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              setStep(step - 1);
            }}
            className="py-2.5 px-4 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
          >
            Kembali
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
          >
            Atur Nanti
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 py-2.5 px-5 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl min-h-[44px]"
          >
            <span>Lanjut</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-2 py-2.5 px-6 text-xs font-extrabold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-xl border border-zinc-900 min-h-[44px]"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Mulai Pakai CatatDuit</span>
          </button>
        )}
      </div>
    </Modal>
  );
};
