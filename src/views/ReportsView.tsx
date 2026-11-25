import React, { useMemo, useState } from 'react';
import {
  Download,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Category } from '../types';
import { formatRupiah, formatDateIndo, getTodayDateString } from '../utils/format';
import { StorageService } from '../services/storage';

type ReportScope = 'bulanan' | 'mingguan' | 'harian';

interface Props {
  onQuickAdd: () => void;
}

export const ReportsView: React.FC<Props> = ({ onQuickAdd }) => {
  const storage = StorageService.getInstance();
  const summary = storage.getBudgetSummary();
  const categories = storage.getCategories();
  const {
    budget,
    remainingBudget,
    savingsTarget,
    expenses: periodExpenses,
  } = summary;

  const [reportType, setReportType] = useState<ReportScope>('bulanan');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const allExpenses = storage.getExpenses();

  const scopedExpenses = useMemo(() => {
    if (reportType === 'harian') {
      return allExpenses.filter((e) => e.spent_on === todayStr);
    }
    if (reportType === 'mingguan') {
      const todayDate = new Date(todayStr + 'T00:00:00');
      const weekAgo = new Date(todayDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(
        weekAgo.getDate()
      ).padStart(2, '0')}`;
      return allExpenses.filter((e) => e.spent_on >= weekAgoStr && e.spent_on <= todayStr);
    }
    return budget ? periodExpenses : allExpenses;
  }, [allExpenses, budget, periodExpenses, reportType, todayStr]);

  const scopedTotal = scopedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const daysDivisor = useMemo(() => {
    if (reportType === 'harian') return 1;
    if (reportType === 'mingguan') return 7;
    if (!budget) {
      const distinctDays = new Set(scopedExpenses.map((e) => e.spent_on)).size;
      return Math.max(1, distinctDays);
    }
    const start = new Date(budget.period_start + 'T00:00:00');
    const end = new Date(budget.period_end + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const clampedEnd = today < end ? today : end;
    const elapsed = Math.floor((clampedEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, elapsed);
  }, [budget, reportType, scopedExpenses, todayStr]);

  const dailyAverage = scopedTotal > 0 ? Math.round(scopedTotal / daysDivisor) : 0;
  const maxExpenseObj = scopedExpenses.reduce(
    (best, e) => (e.amount > (best?.amount || 0) ? e : best),
    null as (typeof scopedExpenses)[number] | null
  );

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, { amount: number; count: number }>();
    scopedExpenses.forEach((e) => {
      const prev = totals.get(e.category_id) || { amount: 0, count: 0 };
      totals.set(e.category_id, { amount: prev.amount + e.amount, count: prev.count + 1 });
    });

    return Array.from(totals.entries())
      .map(([catId, data]) => {
        const cat = categoryMap.get(catId);
        return cat
          ? {
              category: cat,
              spentAmount: data.amount,
              txCount: data.count,
            }
          : null;
      })
      .filter((x): x is { category: Category; spentAmount: number; txCount: number } => x !== null)
      .sort((a, b) => b.spentAmount - a.spentAmount);
  }, [scopedExpenses, categories]);

  let cumulativePercent = 0;
  const donutSlices = categoryBreakdown.map((item) => {
    const rawPercent = scopedTotal > 0 ? (item.spentAmount / scopedTotal) * 100 : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += rawPercent;

    return {
      category: item.category,
      amount: item.spentAmount,
      txCount: item.txCount,
      percent: Math.round(rawPercent),
      rawPercent,
      startPercent,
      color: item.category.color,
    };
  });

  const activeSlice = donutSlices.find((s) => s.category.id === selectedSliceId) || null;

  const dailyBuckets = useMemo(() => {
    const dates = Array.from(new Set(scopedExpenses.map((e) => e.spent_on)))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7);

    const rows = dates.map((dateStr) => ({
      dateStr,
      sum: scopedExpenses
        .filter((e) => e.spent_on === dateStr)
        .reduce((s, e) => s + e.amount, 0),
    }));
    const maxDaySum = rows.reduce((m, r) => Math.max(m, r.sum), 0);
    return { rows, maxDaySum };
  }, [scopedExpenses]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Kategori', 'Toko/Merchant', 'Catatan', 'Nominal (Rp)', 'Sumber'];
    const rows = scopedExpenses.map((e) => [
      e.id,
      e.spent_on,
      `"${(categoryMap.get(e.category_id)?.name || 'Lainnya').replace(/"/g, '""')}"`,
      `"${(e.merchant || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
      e.amount,
      e.source,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CatatDuit_${reportType}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scopeLabel =
    reportType === 'harian' ? 'hari ini' : reportType === 'mingguan' ? '7 hari terakhir' : 'periode ini';

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Laporan Pengeluaran</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Ringkasan pengeluaran untuk {scopeLabel} ({scopedExpenses.length} transaksi)
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={scopedExpenses.length === 0}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-white text-zinc-900 hover:bg-[#F2EDE4] disabled:opacity-50 font-bold text-xs rounded-xl border border-[#D4CEC2] transition-colors self-start sm:self-auto min-h-[44px]"
        >
          <Download className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
          <span>Ekspor CSV ({reportType})</span>
        </button>
      </div>

      {/* Scope Tabs + Asymmetric Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#D4CEC2] flex flex-col justify-between gap-4">
          <div className="flex bg-[#F2EDE4] p-1 rounded-xl border border-[#E2DDD3]" role="tablist" aria-label="Rentang laporan">
            {(
              [
                { id: 'bulanan', label: 'Periode' },
                { id: 'mingguan', label: '7 Hari' },
                { id: 'harian', label: 'Hari Ini' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={reportType === t.id}
                onClick={() => {
                  setReportType(t.id);
                  setSelectedSliceId(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
                  reportType === t.id
                    ? 'bg-zinc-900 text-[#FAF7F2]'
                    : 'text-zinc-700 hover:text-zinc-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-600">Total keluar {scopeLabel}</p>
            <p className="text-3xl font-extrabold text-zinc-900 tabular-nums">{formatRupiah(scopedTotal)}</p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D4CEC2] divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDD3] grid grid-cols-1 sm:grid-cols-3">
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
            <span className="text-xs font-bold text-zinc-600">Rata-rata harian</span>
            <p className="text-xl font-extrabold text-zinc-900 tabular-nums">{formatRupiah(dailyAverage)}</p>
            <span className="text-xs text-zinc-600">Dihitung dari {daysDivisor} hari berjalan</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
            <span className="text-xs font-bold text-zinc-600">Transaksi terbesar</span>
            <p className="text-xl font-extrabold text-zinc-900 tabular-nums">
              {formatRupiah(maxExpenseObj?.amount || 0)}
            </p>
            <span className="text-xs text-zinc-600 truncate">
              {maxExpenseObj ? maxExpenseObj.merchant || categoryMap.get(maxExpenseObj.category_id)?.name : 'Belum ada'}
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
            <span className="text-xs font-bold text-zinc-600">Status tabungan</span>
            <p className="text-xl font-extrabold text-[#0F5132] tabular-nums">{formatRupiah(savingsTarget)}</p>
            <div className="flex items-center gap-1.5 text-xs">
              {remainingBudget >= 0 ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132] flex-shrink-0" aria-hidden="true" />
                  <span className="text-[#0F5132] font-bold">Target aman</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" aria-hidden="true" />
                  <span className="text-rose-700 font-bold">Saldo periode minus</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts: Asymmetric 7 / 5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-4">
          <div className="border-b border-[#E2DDD3] pb-3">
            <h2 className="text-base font-bold text-zinc-900">
              Ke mana uang {scopeLabel} paling banyak keluar?
            </h2>
            <p className="text-xs text-zinc-600">Ketuk kategori di grafik atau daftar untuk melihat rinciannya</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-zinc-600">
                Belum ada pengeluaran tercatat untuk {scopeLabel}.
              </p>
              <div className="flex justify-center gap-2">
                {reportType !== 'bulanan' && (
                  <button
                    type="button"
                    onClick={() => setReportType('bulanan')}
                    className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2EDE4] text-zinc-900 font-bold text-xs rounded-xl border border-[#D4CEC2] min-h-[44px]"
                  >
                    Lihat Periode Penuh
                  </button>
                )}
                <button
                  type="button"
                  onClick={onQuickAdd}
                  className="px-4 py-2.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs rounded-xl min-h-[44px]"
                >
                  Catat Pengeluaran
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
              <div className="relative w-44 h-44 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label="Diagram donat komposisi kategori">
                  {donutSlices.map((slice) => {
                    const isSelected = selectedSliceId === slice.category.id;
                    const visibleArc =
                      donutSlices.length > 1 ? Math.max(0.5, slice.rawPercent - 0.6) : slice.rawPercent;
                    const strokeDasharray = `${visibleArc} ${100 - visibleArc}`;
                    const strokeDashoffset = -slice.startPercent;
                    const toggleSlice = () =>
                      setSelectedSliceId((prev) =>
                        prev === slice.category.id ? null : slice.category.id
                      );
                    return (
                      <circle
                        key={slice.category.id}
                        cx="50"
                        cy="50"
                        r="15.915"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isSelected ? '12' : '9'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        opacity={selectedSliceId && !isSelected ? 0.35 : 1}
                        className="cursor-pointer transition-opacity duration-150"
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${slice.category.name}: ${formatRupiah(slice.amount)} (${slice.percent}%)`}
                        onClick={toggleSlice}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSlice();
                          }
                        }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[11px] font-bold text-zinc-600 truncate max-w-full">
                    {activeSlice ? activeSlice.category.name : 'Total'}
                  </span>
                  <span className="text-sm font-extrabold text-zinc-900 tabular-nums">
                    {formatRupiah(activeSlice ? activeSlice.amount : scopedTotal)}
                  </span>
                  {activeSlice && (
                    <span className="text-[11px] font-bold text-[#0F5132]">{activeSlice.percent}%</span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                {donutSlices.map((slice) => {
                  const isSelected = selectedSliceId === slice.category.id;
                  return (
                    <button
                      key={slice.category.id}
                      type="button"
                      onClick={() =>
                        setSelectedSliceId((prev) =>
                          prev === slice.category.id ? null : slice.category.id
                        )
                      }
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors border min-h-[44px] ${
                        isSelected
                          ? 'bg-zinc-900 text-[#FAF7F2] border-zinc-900'
                          : 'bg-[#FAF7F2] text-zinc-800 border-[#E2DDD3] hover:bg-[#F2EDE4]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-bold truncate">{slice.category.name}</span>
                        <span className={`text-[11px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          ({slice.txCount}x)
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 tabular-nums">
                        <span className="font-extrabold">{formatRupiah(slice.amount)}</span>
                        <span className={`ml-1.5 font-semibold ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          {slice.percent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-4">
          <div className="border-b border-[#E2DDD3] pb-3">
            <h2 className="text-base font-bold text-zinc-900">
              Bagaimana ritme belanja harianmu?
            </h2>
            <p className="text-xs text-zinc-600">
              {dailyBuckets.rows.length > 0
                ? `${dailyBuckets.rows.length} hari terakhir dengan catatan`
                : 'Menunggu catatan pengeluaran'}
            </p>
          </div>

          {dailyBuckets.rows.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-zinc-600">
                Belum ada transaksi harian untuk dibandingkan.
              </p>
              <button
                type="button"
                onClick={onQuickAdd}
                className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2EDE4] text-zinc-900 font-bold text-xs rounded-xl border border-[#D4CEC2] min-h-[44px]"
              >
                Catat Transaksi Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {dailyBuckets.rows.map(({ dateStr, sum }) => {
                const barWidthPct =
                  dailyBuckets.maxDaySum > 0 ? Math.max(4, Math.round((sum / dailyBuckets.maxDaySum) * 100)) : 0;

                return (
                  <div key={dateStr} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-700">{formatDateIndo(dateStr)}</span>
                      <span className="font-bold text-zinc-900 tabular-nums">{formatRupiah(sum)}</span>
                    </div>
                    <div className="w-full bg-[#F2EDE4] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0F5132] h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
