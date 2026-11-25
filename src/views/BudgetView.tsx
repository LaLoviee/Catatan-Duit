import React, { useState } from 'react';
import {
  PieChart,
  CalendarPlus,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  History,
  Edit2,
  X,
} from 'lucide-react';
import { Category } from '../types';
import { formatRupiah, formatDateIndo, parseRupiahInput } from '../utils/format';
import { StorageService } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

interface Props {
  onNewPeriod: () => void;
  onOpenTopup: () => void;
  onBudgetChanged?: () => void;
}

export const BudgetView: React.FC<Props> = ({ onNewPeriod, onOpenTopup, onBudgetChanged }) => {
  const storage = StorageService.getInstance();
  const summary = storage.getBudgetSummary();
  const {
    hasBudget,
    budget,
    spendableBudget,
    savingsTarget,
    topupsTotal,
    topups,
    categoryStatuses,
  } = summary;

  const allBudgets = storage.getBudgets();
  const [editingLimitCategory, setEditingLimitCategory] = useState<Category | null>(null);
  const [newLimitStr, setNewLimitStr] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);

  const currentTotalLimits = categoryStatuses.reduce((s, c) => s + (c.limitAmount || 0), 0);

  const startEditLimit = (cat: Category, currentLimit?: number) => {
    setEditingLimitCategory(cat);
    setNewLimitStr(currentLimit ? currentLimit.toLocaleString('id-ID') : '');
    setLimitError(null);
  };

  const saveCategoryLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !editingLimitCategory) return;
    const numericLimit = parseRupiahInput(newLimitStr);

    const currentCatLimit =
      categoryStatuses.find((c) => c.category.id === editingLimitCategory.id)?.limitAmount || 0;
    const projectedTotalLimits = currentTotalLimits - currentCatLimit + numericLimit;

    if (projectedTotalLimits > spendableBudget) {
      setLimitError(
        `Total batas kategori (${formatRupiah(projectedTotalLimits)}) melebihi dana boleh dibelanjakan (${formatRupiah(spendableBudget)}).`
      );
      return;
    }

    storage.saveCategoryLimit(budget.id, editingLimitCategory.id, numericLimit);
    setEditingLimitCategory(null);
    onBudgetChanged?.();
  };

  if (!hasBudget || !budget) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-zinc-900 shadow-ledger space-y-4 text-center">
          <div className="w-14 h-14 bg-[#ECFDF5] text-[#0F5132] rounded-2xl mx-auto flex items-center justify-center border border-emerald-200">
            <PieChart className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Belum Ada Anggaran Aktif</h1>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Buka periode uang saku terlebih dahulu untuk memisahkan target tabungan dan batas pengeluaran tiap kategori.
          </p>
          <button
            type="button"
            onClick={onNewPeriod}
            className="py-3 px-6 bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold text-sm rounded-xl border border-zinc-900 shadow-ledger-sm transition-all min-h-[44px]"
          >
            Mulai Periode Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Anggaran & Batas Kategori</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Atur dana aman dan batas per pos agar tidak kebablasan sebelum tanggal gajian/kiriman
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenTopup}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-white text-zinc-900 hover:bg-[#F2EDE4] font-bold text-xs rounded-xl border border-[#D4CEC2] transition-colors min-h-[44px]"
          >
            <ArrowUpRight className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
            <span>Pemasukan Tambahan</span>
          </button>
          <button
            type="button"
            onClick={onNewPeriod}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs rounded-xl transition-colors min-h-[44px]"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
            <span>Periode Baru</span>
          </button>
        </div>
      </div>

      {/* Horizontal Budget Equation Strip */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E2DDD3] pb-3">
          <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
            Periode aktif: {formatDateIndo(budget.period_start)} s/d {formatDateIndo(budget.period_end)}
          </span>
          <span className="text-xs font-bold text-[#0F5132] bg-[#ECFDF5] border border-emerald-200 px-2.5 py-0.5 rounded-md">
            Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-8 bg-[#FAF7F2] rounded-xl border border-[#E2DDD3] divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDD3] grid grid-cols-1 sm:grid-cols-3">
            <div className="p-3.5">
              <span className="text-xs font-semibold text-zinc-600 block">Uang saku pokok</span>
              <span className="text-base font-extrabold text-zinc-900 tabular-nums mt-0.5 block">
                {formatRupiah(budget.allowance_amount)}
              </span>
            </div>
            <div className="p-3.5">
              <span className="text-xs font-semibold text-zinc-600 block">+ Pemasukan</span>
              <span className="text-base font-extrabold text-[#0F5132] tabular-nums mt-0.5 block">
                +{formatRupiah(topupsTotal)}
              </span>
            </div>
            <div className="p-3.5">
              <span className="text-xs font-semibold text-zinc-600 block">- Target tabungan</span>
              <span className="text-base font-extrabold text-zinc-800 tabular-nums mt-0.5 block">
                -{formatRupiah(savingsTarget)}
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-zinc-900 text-[#FAF7F2] rounded-xl p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-zinc-300">Dana boleh dibelanjakan</span>
            <span className="text-xl font-extrabold text-[#FB923C] tabular-nums mt-0.5">
              {formatRupiah(spendableBudget)}
            </span>
          </div>
        </div>

        {topups.length > 0 && (
          <div className="pt-3 border-t border-[#E2DDD3]">
            <span className="text-xs font-bold text-zinc-800 block mb-2">Pemasukan tambahan periode ini</span>
            <div className="space-y-1.5">
              {topups.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-[#FAF7F2] rounded-xl flex items-center justify-between text-xs text-zinc-800 border border-[#E2DDD3]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0F5132] flex-shrink-0" aria-hidden="true" />
                    <span className="font-semibold truncate">{t.note || 'Pemasukan tambahan'}</span>
                    <span className="text-zinc-500 flex-shrink-0">({formatDateIndo(t.received_on)})</span>
                  </div>
                  <span className="font-extrabold text-[#0F5132] tabular-nums flex-shrink-0">
                    +{formatRupiah(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Limits List */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DDD3] pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Batas Pengeluaran per Kategori</h2>
            <p className="text-xs text-zinc-600">
              Peringatan kuning muncul di 80%, peringatan merah saat melewati 100%
            </p>
          </div>
          <div className="text-xs text-zinc-700 font-medium tabular-nums">
            Total alokasi: <strong className="text-zinc-900">{formatRupiah(currentTotalLimits)}</strong> /{' '}
            {formatRupiah(spendableBudget)}
          </div>
        </div>

        <div className="divide-y divide-[#E2DDD3]">
          {categoryStatuses.map((item) => {
            const hasLimit = !!item.limitAmount && item.limitAmount > 0;
            return (
              <div key={item.category.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 border border-zinc-900/15"
                      style={{ backgroundColor: item.category.color }}
                    >
                      <CategoryIcon name={item.category.icon} size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-zinc-900 block truncate">{item.category.name}</span>
                      <p className="text-xs text-zinc-600 tabular-nums">
                        Terpakai <strong className="text-zinc-900">{formatRupiah(item.spentAmount)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-900 block tabular-nums">
                        {hasLimit ? formatRupiah(item.limitAmount!) : 'Belum dibatasi'}
                      </span>
                      {hasLimit && (
                        <span
                          className={`text-[11px] font-bold ${
                            item.isExceeded
                              ? 'text-rose-700'
                              : item.isWarning
                              ? 'text-amber-700'
                              : 'text-[#0F5132]'
                          }`}
                        >
                          {item.percentage}% ({item.isExceeded ? 'Terlampaui' : item.isWarning ? 'Hati-hati' : 'Aman'})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditLimit(item.category, item.limitAmount)}
                      className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-[#F2EDE4] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-transparent hover:border-[#D4CEC2]"
                      title="Ubah batas kategori"
                      aria-label={`Ubah batas anggaran ${item.category.name}`}
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {hasLimit && (
                  <div className="w-full bg-[#F2EDE4] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isExceeded
                          ? 'bg-rose-600'
                          : item.isWarning
                          ? 'bg-amber-600'
                          : 'bg-[#0F5132]'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={!!editingLimitCategory}
        onClose={() => setEditingLimitCategory(null)}
        labelledBy="edit-limit-title"
        maxWidthClass="max-w-sm"
      >
        {editingLimitCategory && (
          <>
            <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: editingLimitCategory.color }}
                >
                  <CategoryIcon name={editingLimitCategory.icon} size={15} />
                </div>
                <h2 id="edit-limit-title" className="font-bold text-zinc-900 text-sm">
                  Batas Anggaran {editingLimitCategory.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingLimitCategory(null)}
                className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup dialog batas kategori"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveCategoryLimit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label htmlFor="category-limit-input" className="block text-xs font-bold text-zinc-700 mb-1">
                  Batas Pengeluaran Periode Ini
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
                    Rp
                  </span>
                  <input
                    id="category-limit-input"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="0 (tanpa batas)"
                    value={newLimitStr}
                    onChange={(e) => {
                      const p = parseRupiahInput(e.target.value);
                      setNewLimitStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                      setLimitError(null);
                    }}
                    className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[44px]"
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">
                  Kosongkan atau isi 0 jika kategori ini tidak perlu dibatasi.
                </p>
              </div>

              {limitError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
                  <span>{limitError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingLimitCategory(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl min-h-[44px]"
                >
                  Simpan Batas
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {allBudgets.length > 1 && (
        <div className="bg-white rounded-2xl p-5 border border-[#D4CEC2] space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-600" aria-hidden="true" />
            <h2 className="text-sm font-bold text-zinc-900">Riwayat Periode Sebelumnya</h2>
          </div>

          <div className="space-y-2">
            {allBudgets.slice(1).map((b) => (
              <div
                key={b.id}
                className="p-3 bg-[#FAF7F2] rounded-xl flex items-center justify-between text-xs text-zinc-800 border border-[#E2DDD3]"
              >
                <div>
                  <span className="font-bold text-zinc-900">
                    {formatDateIndo(b.period_start)} s/d {formatDateIndo(b.period_end)}
                  </span>
                  <p className="text-xs text-zinc-600 mt-0.5 tabular-nums">
                    Uang saku {formatRupiah(b.allowance_amount)} / Tabungan {formatRupiah(b.savings_target)}
                  </p>
                </div>
                <span className="text-[11px] bg-[#F2EDE4] text-zinc-800 border border-[#D4CEC2] px-2 py-0.5 rounded-md font-bold">
                  Selesai
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
