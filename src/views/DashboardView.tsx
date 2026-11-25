import React from 'react';
import {
  Calendar,
  AlertTriangle,
  AlertCircle,
  Plus,
  TrendingDown,
  ScanLine,
  ChevronRight,
  ArrowDownToLine,
} from 'lucide-react';
import { Category, Expense } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/format';
import { StorageService } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';

interface Props {
  onQuickAdd: () => void;
  onOpenOCR: () => void;
  onNewPeriod: () => void;
  onOpenTopup: () => void;
  onViewAllTransactions: () => void;
  onEditExpense: (exp: Expense) => void;
  onGoToBudget: () => void;
}

export const DashboardView: React.FC<Props> = ({
  onQuickAdd,
  onOpenOCR,
  onNewPeriod,
  onOpenTopup,
  onViewAllTransactions,
  onEditExpense,
  onGoToBudget,
}) => {
  const storage = StorageService.getInstance();
  const summary = storage.getBudgetSummary();
  const {
    hasBudget,
    budget,
    spendableBudget,
    totalExpenses,
    remainingBudget,
    dailyRemaining,
    daysRemaining,
    isOverdue,
    savingsTarget,
    expenses,
    largestCategory,
    categoryStatuses,
  } = summary;

  const warningCategories = categoryStatuses.filter((s) => s.isWarning);
  const exceededCategories = categoryStatuses.filter((s) => s.isExceeded);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const categories = storage.getCategories();
  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  if (!hasBudget || !budget) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-zinc-900 shadow-ledger space-y-5">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F2EDE4] text-zinc-800 text-xs font-bold border border-[#D4CEC2]">
            Langkah pertama
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Mulai Catat Uang Sakumu
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Isi nominal uang saku periode ini supaya jatah belanja harianmu langsung terhitung otomatis dan aman sampai akhir bulan.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewPeriod}
            className="w-full py-3.5 px-6 bg-[#C2410C] hover:bg-[#9A3412] active:translate-y-[1px] text-white font-extrabold text-sm rounded-xl border-2 border-zinc-900 shadow-ledger-sm transition-all min-h-[48px]"
          >
            Isi Uang Saku Periode Ini
          </button>
        </div>
      </div>
    );
  }

  const isRemainingNegative = remainingBudget < 0;
  const percentSpent = spendableBudget > 0 ? Math.min(100, Math.round((totalExpenses / spendableBudget) * 100)) : 100;

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <h1 className="sr-only">Beranda Ringkasan Uang Saku</h1>
      {isOverdue && (
        <div className="p-4 bg-amber-50 border-2 border-amber-700 text-amber-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-800 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm">Periode uang saku sudah lewat tanggal perkiraan</p>
              <p className="text-xs text-amber-900 mt-0.5">
                Jika uang saku baru sudah masuk, buka periode baru agar hitungan harian kembali akurat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNewPeriod}
            className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0 min-h-[44px]"
          >
            Mulai Periode Baru
          </button>
        </div>
      )}

      {/* Asymmetric Top Split: Primary Decision (7 cols) + Action & Pulse Ledger (5 cols) */}
      <section aria-label="Ringkasan Saldo dan Aksi Cepat" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-stagger-1">
        <div className="lg:col-span-7 bg-zinc-900 text-[#FAF7F2] rounded-2xl p-5 sm:p-6 border-2 border-zinc-900 shadow-ledger flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
              <Calendar className="w-4 h-4 text-[#FB923C]" aria-hidden="true" />
              <span>
                {formatDateIndo(budget.period_start)} s/d {formatDateIndo(budget.period_end)}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                isRemainingNegative
                  ? 'bg-rose-950 text-rose-200 border-rose-700'
                  : 'bg-[#0F5132] text-[#ECFDF5] border-emerald-700'
              }`}
            >
              {isRemainingNegative ? 'Anggaran Terlampaui' : `${daysRemaining} hari tersisa`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
            <div className="sm:col-span-7 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-300">Sisa uang boleh dibelanjakan</p>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
                  isRemainingNegative ? 'text-rose-300' : 'text-[#FAF7F2]'
                }`}
              >
                {formatRupiah(remainingBudget)}
              </h2>
              <p className="text-xs text-zinc-400 tabular-nums">
                Dari dana belanja {formatRupiah(spendableBudget)}
              </p>
            </div>

            <div className="sm:col-span-5 bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-1">
              <p className="text-xs font-bold text-[#FB923C]">Jatah aman hari ini</p>
              <p className="text-2xl font-extrabold text-[#FAF7F2] tabular-nums leading-tight">
                {formatRupiah(dailyRemaining)}
                <span className="text-xs font-normal text-zinc-300"> / hari</span>
              </p>
              <p className="text-[11px] text-zinc-300 leading-snug pt-1">
                {isRemainingNegative
                  ? 'Saldo minus. Tahan pengeluaran dulu.'
                  : 'Batas harian agar cukup sampai akhir periode.'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-300 font-medium tabular-nums">
              <span>
                Terpakai <strong className="text-white">{formatRupiah(totalExpenses)}</strong> ({percentSpent}%)
              </span>
              <span>
                Disisihkan <strong className="text-emerald-300">{formatRupiah(savingsTarget)}</strong>
              </span>
            </div>
            <div
              className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={percentSpent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Persentase pemakaian uang saku"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentSpent >= 100
                    ? 'bg-rose-400'
                    : percentSpent >= 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F2EDE4] rounded-2xl p-5 border border-[#D4CEC2] flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-zinc-700">Catat atau tambah dana</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onQuickAdd}
                className="group col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] hover:-translate-y-0.5 active:translate-y-0.5 text-white font-extrabold text-sm rounded-xl border border-zinc-900 shadow-ledger-sm transition-all duration-200 min-h-[46px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" aria-hidden="true" />
                <span>Catat Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={onOpenOCR}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl border border-[#D4CEC2] transition-colors min-h-[44px]"
              >
                <ScanLine className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                <span>Pindai Struk</span>
              </button>
              <button
                type="button"
                onClick={onOpenTopup}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl border border-[#D4CEC2] transition-colors min-h-[44px]"
              >
                <ArrowDownToLine className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                <span>+ Pemasukan</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2DDD3] divide-y divide-[#E2DDD3]">
            <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600">Total keluar ({expenses.length} transaksi)</span>
              <span className="font-extrabold text-zinc-900 tabular-nums">{formatRupiah(totalExpenses)}</span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between text-xs gap-2">
              <span className="font-semibold text-zinc-600">Pos terbesar</span>
              <span className="font-extrabold text-zinc-900 tabular-nums truncate">
                {largestCategory
                  ? `${largestCategory.category.name} (${formatRupiah(largestCategory.amount)})`
                  : 'Belum ada'}
              </span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600">Tabungan disisihkan</span>
              <span className="font-extrabold text-[#0F5132] tabular-nums">{formatRupiah(savingsTarget)}</span>
            </div>
          </div>
        </div>
      </section>

      {(exceededCategories.length > 0 || warningCategories.length > 0) && (
        <section aria-label="Peringatan Anggaran Kategori" className="space-y-2.5">
          {exceededCategories.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 rounded-2xl space-y-2">
              {exceededCategories.map((s) => (
                <div key={s.category.id} className="flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold">Batas terlampaui di {s.category.name}:</span> terpakai{' '}
                    <span className="tabular-nums font-semibold">{formatRupiah(s.spentAmount)}</span> dari batas{' '}
                    <span className="tabular-nums font-semibold">{formatRupiah(s.limitAmount || 0)}</span> (lewat{' '}
                    <span className="tabular-nums font-semibold">{formatRupiah(s.difference)}</span>).
                  </div>
                </div>
              ))}
            </div>
          )}

          {warningCategories.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl space-y-2">
              {warningCategories.map((s) => (
                <div key={s.category.id} className="flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold">Mendekati batas di {s.category.name}:</span> sudah mencapai{' '}
                    {s.percentage}% dari batas anggaran.
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Asymmetric Bottom Split: Recent Transactions (7 cols) + Category Limits (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-stagger-2">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D4CEC2] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Transaksi Terakhir</h3>
              <p className="text-xs text-zinc-600">Ketuk baris mana pun untuk mengubah atau menghapus</p>
            </div>
            <button
              type="button"
              onClick={onViewAllTransactions}
              className="flex items-center gap-1 text-xs font-bold text-[#0F5132] hover:bg-[#ECFDF5] py-2 px-3 rounded-xl transition-colors min-h-[44px]"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F2EDE4] text-zinc-600 mx-auto flex items-center justify-center border border-[#D4CEC2]">
                <TrendingDown className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900">Belum ada pengeluaran periode ini</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                  Uang sakumu masih utuh. Catat pengeluaran pertama untuk melihat sisa harian terbaru.
                </p>
              </div>
              <button
                type="button"
                onClick={onQuickAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Catat Pengeluaran Pertama</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2DDD3]">
              {recentExpenses.map((exp) => {
                const cat = categoryMap.get(exp.category_id);
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => onEditExpense(exp)}
                    className="w-full text-left py-3 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] rounded-xl transition-colors min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 border border-zinc-900/15"
                        style={{ backgroundColor: cat?.color || '#0F5132' }}
                      >
                        <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-zinc-900 truncate">
                            {exp.merchant || cat?.name || 'Pengeluaran'}
                          </span>
                          {exp.source === 'ocr' && (
                            <span className="text-[10px] font-bold bg-[#F2EDE4] text-zinc-800 border border-[#D4CEC2] px-1.5 py-0.5 rounded-md flex-shrink-0">
                              Struk
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 truncate">
                          {formatDateIndo(exp.spent_on)}
                          {exp.note ? ` / ${exp.note}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-extrabold text-zinc-900 flex-shrink-0 tabular-nums">
                      -{formatRupiah(exp.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D4CEC2] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Batas Kategori</h3>
              <p className="text-xs text-zinc-600">Pos pengeluaran terbesar</p>
            </div>
            <button
              type="button"
              onClick={onGoToBudget}
              className="text-xs font-bold text-[#0F5132] hover:bg-[#ECFDF5] py-2 px-3 rounded-xl transition-colors min-h-[44px] flex items-center"
            >
              Atur Batas
            </button>
          </div>

          <div className="space-y-3.5">
            {categoryStatuses.slice(0, 5).map((item) => {
              const hasLimit = !!item.limitAmount && item.limitAmount > 0;
              const widthPct = hasLimit
                ? Math.min(100, item.percentage)
                : Math.min(100, (item.spentAmount / (spendableBudget || 1)) * 100);

              return (
                <div key={item.category.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="font-bold text-zinc-800 flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="truncate">{item.category.name}</span>
                    </span>
                    <span className="font-semibold text-zinc-600 tabular-nums flex-shrink-0">
                      {formatRupiah(item.spentAmount)}
                      {hasLimit ? ` / ${formatRupiah(item.limitAmount!)}` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-[#F2EDE4] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isExceeded
                          ? 'bg-rose-600'
                          : item.isWarning
                          ? 'bg-amber-600'
                          : 'bg-[#0F5132]'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
