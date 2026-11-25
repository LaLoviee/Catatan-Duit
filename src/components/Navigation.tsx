import React from 'react';
import { Home, Receipt, Plus, PieChart, BarChart3, Settings } from 'lucide-react';
import { BrandMark } from './BrandMark';

export type TabType = 'beranda' | 'transaksi' | 'anggaran' | 'laporan' | 'pengaturan';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAdd: () => void;
  cloudUserEmail?: string | null;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onQuickAdd,
  cloudUserEmail,
}) => {
  const primaryTabs = [
    { id: 'beranda' as TabType, label: 'Beranda', icon: Home },
    { id: 'transaksi' as TabType, label: 'Transaksi', icon: Receipt },
    { id: 'anggaran' as TabType, label: 'Anggaran', icon: PieChart },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 },
  ];

  const utilityTabs = [
    { id: 'pengaturan' as TabType, label: 'Akun', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation: symmetric 5-column grid so Quick-Add '+' sits strictly at center */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-zinc-900 z-30 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1 relative">
          {primaryTabs.slice(0, 2).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
                  isActive ? 'text-zinc-900 font-extrabold' : 'text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 w-8 h-1 bg-[#C2410C] rounded-b-sm transition-all duration-200"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-5 h-5 stroke-[2.2] transition-transform duration-150 ${
                    isActive ? '-translate-y-0.5' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] mt-1 tracking-tight">{t.label}</span>
              </button>
            );
          })}

          <div className="relative -top-3.5 flex items-center justify-center justify-self-center">
            <button
              type="button"
              onClick={onQuickAdd}
              aria-label="Catat Pengeluaran Baru"
              className="group w-14 h-14 bg-[#C2410C] hover:bg-[#9A3412] hover:-translate-y-0.5 active:translate-y-0.5 text-white rounded-2xl flex items-center justify-center border-2 border-zinc-900 shadow-ledger-sm ring-4 ring-white transition-all duration-200 min-h-[48px] min-w-[48px]"
            >
              <Plus
                className="w-6 h-6 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90"
                aria-hidden="true"
              />
            </button>
          </div>

          {primaryTabs.slice(2, 4).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
                  isActive ? 'text-zinc-900 font-extrabold' : 'text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 w-8 h-1 bg-[#C2410C] rounded-b-sm transition-all duration-200"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-5 h-5 stroke-[2.2] transition-transform duration-150 ${
                    isActive ? '-translate-y-0.5' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] mt-1 tracking-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside
        aria-label="Navigasi Utama Desktop"
        className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2DDD3] h-screen sticky top-0 p-5 z-20 flex-shrink-0"
      >
        <button
          type="button"
          onClick={() => onTabChange('beranda')}
          className="group flex items-center gap-3 mb-7 text-left rounded-xl min-h-[44px]"
          aria-label="CatatDuit, buka Beranda"
        >
          <BrandMark className="w-10 h-10 flex-shrink-0 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
          <div>
            <span className="font-display block text-xl font-extrabold text-zinc-900 tracking-tight leading-none">
              CatatDuit
            </span>
            <p className="text-xs text-zinc-600 font-medium mt-1">Uang Saku Terkendali</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onQuickAdd}
          className="group w-full flex items-center justify-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] hover:-translate-y-0.5 active:translate-y-0.5 text-white py-3 px-4 rounded-xl font-extrabold text-sm border-2 border-zinc-900 shadow-ledger-sm transition-all duration-200 mb-7 min-h-[44px]"
        >
          <Plus
            className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90"
            aria-hidden="true"
          />
          <span>Catat Pengeluaran</span>
        </button>

        <nav className="flex-1 space-y-6" aria-label="Menu Halaman">
          <div>
            <p className="px-3 mb-2 text-xs font-bold text-zinc-500">Catatan Utama</p>
            <div className="space-y-1">
              {primaryTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTabChange(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 min-h-[44px] ${
                      isActive
                        ? 'bg-zinc-900 text-[#FAF7F2] font-bold translate-x-0.5'
                        : 'text-zinc-700 hover:bg-[#F2EDE4] hover:text-zinc-900 font-semibold'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${isActive ? 'text-[#FB923C]' : 'text-zinc-500'}`}
                        aria-hidden="true"
                      />
                      <span>{t.label}</span>
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-bold text-zinc-500">Preferensi</p>
            <div className="space-y-1">
              {utilityTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTabChange(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 min-h-[44px] ${
                      isActive
                        ? 'bg-zinc-900 text-[#FAF7F2] font-bold translate-x-0.5'
                        : 'text-zinc-700 hover:bg-[#F2EDE4] hover:text-zinc-900 font-semibold'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${isActive ? 'text-[#FB923C]' : 'text-zinc-500'}`}
                        aria-hidden="true"
                      />
                      <span>{t.label}</span>
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="pt-4 border-t border-[#E2DDD3] text-xs text-zinc-600 flex items-center justify-between gap-2">
          <span className="font-semibold truncate">
            {cloudUserEmail ? `Cloud: ${cloudUserEmail}` : 'Penyimpanan Lokal'}
          </span>
          <span className="text-[11px] font-bold text-[#0F5132] flex-shrink-0">
            {cloudUserEmail ? 'Terhubung' : 'Aktif'}
          </span>
        </div>
      </aside>
    </>
  );
};
