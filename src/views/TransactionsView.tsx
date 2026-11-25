import React, { useEffect, useState } from 'react';
import {
  Search,
  Trash2,
  Edit3,
  Calendar,
  X,
  Plus,
  Store,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Category, Expense } from '../types';
import { formatRupiah, formatDateIndo, parseRupiahInput } from '../utils/format';
import { StorageService } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';
import { Modal } from '../components/Modal';

interface Props {
  onQuickAdd: () => void;
  onExpenseDeleted: (exp: Expense) => void;
  onExpenseUpdated: (exp: Expense) => void;
  initialEditExpense?: Expense | null;
  onInitialEditHandled?: () => void;
}

export const TransactionsView: React.FC<Props> = ({
  onQuickAdd,
  onExpenseDeleted,
  onExpenseUpdated,
  initialEditExpense,
  onInitialEditHandled,
}) => {
  const storage = StorageService.getInstance();
  const allExpenses = storage.getExpenses();
  const categories = storage.getCategories();
  const budgets = storage.getBudgets();
  const activeBudget = storage.getActiveBudget();

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [editAmountStr, setEditAmountStr] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSpentOn, setEditSpentOn] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditAmountStr(exp.amount.toLocaleString('id-ID'));
    setEditCategoryId(exp.category_id);
    setEditSpentOn(exp.spent_on);
    setEditMerchant(exp.merchant || '');
    setEditNote(exp.note || '');
    setEditError(null);
    setConfirmDeleteId(null);
  };

  useEffect(() => {
    if (initialEditExpense) {
      startEdit(initialEditExpense);
      onInitialEditHandled?.();
    }
  }, [initialEditExpense, onInitialEditHandled]);

  const selectedPeriod =
    selectedPeriodId === 'all'
      ? null
      : budgets.find((b) => b.id === selectedPeriodId) || activeBudget;

  const filteredExpenses = allExpenses.filter((e) => {
    if (selectedPeriod) {
      if (e.spent_on < selectedPeriod.period_start || e.spent_on > selectedPeriod.period_end) {
        return false;
      }
    }
    if (selectedCategoryFilter !== 'all' && e.category_id !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = categoryMap.get(e.category_id)?.name.toLowerCase() || '';
      const merch = (e.merchant || '').toLowerCase();
      const nt = (e.note || '').toLowerCase();
      const amtStr = e.amount.toString();
      if (!cat.includes(q) && !merch.includes(q) && !nt.includes(q) && !amtStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const groupedByDate: { [date: string]: Expense[] } = {};
  filteredExpenses.forEach((e) => {
    if (!groupedByDate[e.spent_on]) {
      groupedByDate[e.spent_on] = [];
    }
    groupedByDate[e.spent_on].push(e);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const finalAmount = parseRupiahInput(editAmountStr);
    if (finalAmount <= 0 || finalAmount > 1000000000) {
      setEditError('Nominal harus antara Rp1 sampai Rp1.000.000.000.');
      return;
    }
    if (!editSpentOn) {
      setEditError('Tanggal pengeluaran harus diisi.');
      return;
    }

    const updated: Expense = {
      ...editingExpense,
      amount: finalAmount,
      category_id: editCategoryId,
      spent_on: editSpentOn,
      merchant: editMerchant.trim() || undefined,
      note: editNote.trim() || undefined,
    };

    storage.updateExpense(updated);
    onExpenseUpdated(updated);
    setEditingExpense(null);
  };

  const confirmDelete = () => {
    if (!editingExpense) return;
    const deleted = storage.softDeleteExpense(editingExpense.id);
    if (deleted) {
      onExpenseDeleted(deleted);
    }
    setConfirmDeleteId(null);
    setEditingExpense(null);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategoryFilter !== 'all' || selectedPeriodId !== 'all';

  return (
    <div className="space-y-5 pb-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Daftar Transaksi</h1>
          <p className="text-xs text-zinc-600 mt-0.5 tabular-nums">
            {filteredExpenses.length} transaksi ditampilkan (total{' '}
            <strong className="text-zinc-900">{formatRupiah(totalFiltered)}</strong>)
          </p>
        </div>
        <button
          type="button"
          onClick={onQuickAdd}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-[#C2410C] hover:bg-[#9A3412] active:translate-y-[1px] text-white font-extrabold text-xs rounded-xl border border-zinc-900 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* Search, Period & Category Filter */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#D4CEC2] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="tx-search" className="sr-only">
              Cari transaksi
            </label>
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              id="tx-search"
              type="text"
              placeholder="Cari nama toko, kategori, catatan, atau nominal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {budgets.length > 0 && (
            <div className="sm:w-56">
              <label htmlFor="tx-period-filter" className="sr-only">
                Filter periode
              </label>
              <select
                id="tx-period-filter"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs sm:text-sm font-semibold text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
              >
                <option value="all">Semua Periode</option>
                {budgets.map((b, idx) => (
                  <option key={b.id} value={b.id}>
                    {idx === 0 ? 'Periode Aktif: ' : ''}
                    {formatDateIndo(b.period_start)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border min-h-[44px] ${
              selectedCategoryFilter === 'all'
                ? 'bg-zinc-900 text-[#FAF7F2] border-zinc-900'
                : 'bg-[#FAF7F2] text-zinc-700 border-[#D4CEC2] hover:bg-[#F2EDE4]'
            }`}
          >
            Semua Kategori
          </button>
          {categories
            .filter((c) => !c.is_archived)
            .map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border min-h-[44px] ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-zinc-900 text-[#FAF7F2] border-zinc-900'
                    : 'bg-[#FAF7F2] text-zinc-700 border-[#D4CEC2] hover:bg-[#F2EDE4]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-[#D4CEC2] space-y-3">
          <p className="text-base font-bold text-zinc-900">
            {allExpenses.length === 0 ? 'Belum ada transaksi tercatat' : 'Tidak ada transaksi yang cocok'}
          </p>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
            {allExpenses.length === 0
              ? 'Mulai catat pengeluaran pertamamu supaya riwayat uang keluar langsung tercatat di sini.'
              : 'Tidak ada catatan yang sesuai filter saat ini. Reset filter atau ubah kata kunci pencarian.'}
          </p>
          <div className="pt-1 flex justify-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('all');
                  setSelectedPeriodId('all');
                }}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl min-h-[44px]"
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={onQuickAdd}
                className="px-4 py-2.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold rounded-xl min-h-[44px]"
              >
                Catat Pengeluaran Pertama
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dayExpenses = groupedByDate[dateStr];
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);

            return (
              <div key={dateStr} className="bg-white rounded-2xl border border-[#D4CEC2] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F2EDE4] border-b border-[#D4CEC2] flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0F5132]" aria-hidden="true" />
                    {formatDateIndo(dateStr)}
                  </span>
                  <span className="font-extrabold text-zinc-900 tabular-nums">
                    Total {formatRupiah(dayTotal)}
                  </span>
                </div>

                <div className="divide-y divide-[#E2DDD3]">
                  {dayExpenses.map((exp) => {
                    const cat = categoryMap.get(exp.category_id);
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => startEdit(exp)}
                        className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] transition-colors min-h-[60px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 border border-zinc-900/15"
                            style={{ backgroundColor: cat?.color || '#0F5132' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
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
                              {cat?.name}
                              {exp.note ? ` / ${exp.note}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-extrabold text-zinc-900 block tabular-nums">
                            -{formatRupiah(exp.amount)}
                          </span>
                          <span className="text-[11px] text-zinc-600 font-semibold">Ubah</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        labelledBy="edit-tx-title"
      >
        <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#0F5132] flex items-center justify-center border border-emerald-200">
              <Edit3 className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="edit-tx-title" className="text-base font-bold text-zinc-900">
              Ubah Transaksi
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setEditingExpense(null)}
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup dialog ubah transaksi"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={saveEdit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
            <div>
              <label htmlFor="edit-amount" className="block text-xs font-bold text-zinc-700 mb-1">
                Nominal Pengeluaran
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
                  Rp
                </span>
                <input
                  id="edit-amount"
                  type="text"
                  inputMode="numeric"
                  value={editAmountStr}
                  onChange={(e) => {
                    const p = parseRupiahInput(e.target.value);
                    setEditAmountStr(p === 0 ? '' : p.toLocaleString('id-ID'));
                    setEditError(null);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 text-xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none tabular-nums min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-category" className="block text-xs font-bold text-zinc-700 mb-1">
                Kategori
              </label>
              <select
                id="edit-category"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm font-semibold text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Tanggal</span>
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editSpentOn}
                  onChange={(e) => {
                    setEditSpentOn(e.target.value);
                    setEditError(null);
                  }}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="edit-merchant" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Toko / Merchant</span>
                </label>
                <input
                  id="edit-merchant"
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  placeholder="Nama toko atau tempat"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-note" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Catatan</span>
              </label>
              <input
                id="edit-note"
                type="text"
                maxLength={200}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
              />
            </div>

            {editError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" aria-hidden="true" />
                <span>{editError}</span>
              </div>
            )}

            {editingExpense && confirmDeleteId === editingExpense.id && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2.5">
                <p className="text-xs font-bold text-rose-950">
                  Hapus transaksi {formatRupiah(editingExpense.amount)}? Kamu masih bisa mengurungkannya selama 5 detik setelah dihapus.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2 text-xs font-semibold text-zinc-700 bg-white border border-[#D4CEC2] rounded-lg min-h-[44px]"
                  >
                    Jangan Hapus
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg min-h-[44px]"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 border-t border-[#E2DDD3] bg-[#FAF7F2] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => editingExpense && setConfirmDeleteId(editingExpense.id)}
              className="flex items-center gap-1.5 py-2.5 px-3.5 text-xs font-bold text-rose-800 hover:bg-rose-100 rounded-xl border border-rose-300 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Hapus</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="py-2.5 px-3.5 text-xs font-semibold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl min-h-[44px]"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
