import React from 'react';
import { Calendar, Plus, ScanLine, User } from 'lucide-react';
import { MonthlyBudget, Profile } from '../types';
import { formatDateIndo } from '../utils/format';
import { BrandMark } from './BrandMark';
import { TabType } from './Navigation';

interface Props {
  profile: Profile;
  activeBudget: MonthlyBudget | null;
  activeTab: TabType;
  onLogoClick: () => void;
  onQuickAdd: () => void;
  onOpenOCR: () => void;
  onNewPeriod: () => void;
  onProfileClick: () => void;
}

export const Navbar: React.FC<Props> = ({
  profile,
  activeBudget,
  activeTab,
  onLogoClick,
  onQuickAdd,
  onOpenOCR,
  onNewPeriod,
  onProfileClick,
}) => {
  const isAccountActive = activeTab === 'pengaturan';

  return (
    <header className="bg-[#FAF7F2] border-b border-[#E2DDD3] sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="CatatDuit, kembali ke Beranda"
            className="group flex items-center gap-2.5 min-w-0 min-h-[44px] rounded-xl pr-1 text-left"
          >
            <BrandMark className="w-9 h-9 flex-shrink-0 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105 group-active:scale-95" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-zinc-900 text-base sm:text-lg tracking-tight leading-none">
                  CatatDuit
                </span>
                <span className="hidden lg:inline text-xs font-semibold text-zinc-500 border-l border-[#D4CEC2] pl-2">
                  Buku Kas Uang Saku
                </span>
              </div>
              {activeBudget && (
                <p className="text-xs text-zinc-600 flex items-center gap-1.5 font-medium truncate mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0F5132] flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {formatDateIndo(activeBudget.period_start)} s/d {formatDateIndo(activeBudget.period_end)}
                  </span>
                </p>
              )}
            </div>
          </button>

          {!activeBudget && (
            <button
              type="button"
              onClick={onNewPeriod}
              className="text-xs text-[#0F5132] font-bold hover:underline min-h-[44px] inline-flex items-center flex-shrink-0"
            >
              + Mulai periode
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenOCR}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 bg-white hover:bg-[#F2EDE4] active:translate-y-[1px] rounded-xl transition-all duration-150 min-h-[44px] border border-[#D4CEC2]"
            title="Pindai struk atau screenshot transaksi e-wallet"
            aria-label="Pindai Struk atau Bukti Transfer"
          >
            <ScanLine className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
            <span className="hidden sm:inline">Pindai Struk</span>
          </button>

          <button
            type="button"
            onClick={onQuickAdd}
            className="group hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-[#C2410C] hover:bg-[#9A3412] active:translate-y-[1px] rounded-xl border border-zinc-900 transition-all duration-150 min-h-[44px]"
            aria-label="Catat Pengeluaran Baru"
          >
            <Plus
              className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90"
              aria-hidden="true"
            />
            <span>Catat Cepat</span>
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            aria-current={isAccountActive ? 'page' : undefined}
            className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 border ${
              isAccountActive
                ? 'bg-zinc-900 text-[#FAF7F2] border-zinc-900 font-bold'
                : 'bg-white hover:bg-[#F2EDE4] active:translate-y-[1px] text-zinc-800 border-[#D4CEC2] font-semibold'
            }`}
            title={`Akun: ${profile.display_name}`}
            aria-label="Buka Pengaturan Akun"
          >
            <User className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline text-xs">Akun</span>
          </button>
        </div>
      </div>
    </header>
  );
};
