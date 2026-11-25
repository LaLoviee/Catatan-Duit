import React, { useEffect, useState } from 'react';
import { X, ScanLine, AlertTriangle, AlertCircle, Calendar, FileText, Store } from 'lucide-react';
import { Category, Expense } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Modal } from './Modal';
import { formatRupiah, getTodayDateString, parseRupiahInput } from '../utils/format';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeBudgetId?: string;
  onExpenseAdded: (expense: Expense) => void;
  onOpenOCR: () => void;
}

export const AddExpenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  activeBudgetId,
  onExpenseAdded,
  onOpenOCR,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [spentOn, setSpentOn] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHighAmountConfirm, setShowHighAmountConfirm] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSpentOn(getTodayDateString());
      setFormError(null);
      if (!categories.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(categories[0]?.id || '');
      }
    }
  }, [isOpen, categories, selectedCategoryId]);

  const numericAmount = parseRupiahInput(amountStr);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  let categoryLimitInfo: {
    limit: number;
    projectedTotal: number;
    isWarning: boolean;
    isExceeded: boolean;
  } | null = null;

  if (isOpen && activeBudgetId && selectedCategory) {
    const storage = StorageService.getInstance();
    const limits = storage.getCategoryLimits(activeBudgetId);
    const limitObj = limits.find((l) => l.category_id === selectedCategory.id);
    if (limitObj && limitObj.limit_amount > 0) {
      const allExpenses = storage.getExpenses();
      const currentSpent = allExpenses
        .filter((e) => e.category_id === selectedCategory.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const projected = currentSpent + numericAmount;
      const pct = (projected / limitObj.limit_amount) * 100;
      categoryLimitInfo = {
        limit: limitObj.limit_amount,
        projectedTotal: projected,
        isWarning: pct >= 80 && pct < 100,
        isExceeded: pct >= 100,
      };
    }
  }

  const updateDuplicateNotice = (amt: number, dateStr: string, merchStr: string) => {
    if (amt > 0) {
      const dup = StorageService.getInstance().checkPossibleDuplicate(amt, dateStr, merchStr);
      setDuplicateWarning(
        dup
          ? `Peringatan: Transaksi ${formatRupiah(amt)} pada tanggal ini sudah pernah dicatat.`
          : null
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseRupiahInput(e.target.value);
    if (parsed > 1000000000) return;
    setAmountStr(parsed === 0 ? '' : parsed.toLocaleString('id-ID'));
    setFormError(null);
    updateDuplicateNotice(parsed, spentOn, merchant);
  };

  const handleQuickAddChip = (addVal: number) => {
    const current = parseRupiahInput(amountStr);
    const total = Math.min(1000000000, current + addVal);
    setAmountStr(total.toLocaleString('id-ID'));
    setFormError(null);
    updateDuplicateNotice(total, spentOn, merchant);
  };

  const handleClose = () => {
    setAmountStr('');
    setNote('');
    setMerchant('');
    setShowHighAmountConfirm(false);
    setDuplicateWarning(null);
    setFormError(null);
    onClose();
  };

  const handleSubmit = (force = false) => {
    if (numericAmount <= 0) {
      setFormError('Masukkan nominal pengeluaran lebih dari Rp0.');
      return;
    }
    if (!selectedCategory) {
      setFormError('Pilih kategori pengeluaran terlebih dahulu.');
      return;
    }

    if (numericAmount > 5000000 && !force) {
      setShowHighAmountConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const storage = StorageService.getInstance();
      const newExp = storage.addExpense({
        category_id: selectedCategory.id,
        amount: numericAmount,
        spent_on: spentOn,
        note: note.trim() || undefined,
        merchant: merchant.trim() || undefined,
        source: 'manual',
      });

      onExpenseAdded(newExp);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={showHighAmountConfirm ? () => setShowHighAmountConfirm(false) : handleClose}
      labelledBy="add-expense-title"
      maxWidthClass="max-w-lg"
      alignBottomOnMobile
    >
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] flex items-center justify-center font-extrabold flex-shrink-0">
            +
          </div>
          <h2 id="add-expense-title" className="text-base sm:text-lg font-extrabold text-zinc-900 truncate">
            Catat Pengeluaran
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenOCR();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EDE4] text-zinc-800 rounded-xl transition-colors min-h-[44px] border border-[#D4CEC2]"
          >
            <ScanLine className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
            <span>Pindai Struk</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup dialog catat pengeluaran"
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label htmlFor="add-expense-amount" className="block text-xs font-bold text-zinc-700 mb-1.5">
              Nominal Pengeluaran
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500">
                Rp
              </span>
              <input
                id="add-expense-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                className="w-full pl-14 pr-4 py-3 text-3xl font-extrabold text-zinc-900 bg-[#FAF7F2] border border-[#D4CEC2] focus:border-[#C2410C] focus:bg-white rounded-xl outline-none transition-colors tabular-nums min-h-[56px]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[5000, 10000, 20000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddChip(val)}
                  className="px-3 py-2 text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EDE4] text-zinc-800 rounded-xl transition-colors border border-[#D4CEC2] min-h-[44px] tabular-nums"
                >
                  +{formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {categoryLimitInfo?.isExceeded && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-950 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-bold">Batas Kategori Terlampaui:</span> Pengeluaran untuk kategori{' '}
                {selectedCategory.name} melebihi batas {formatRupiah(categoryLimitInfo.limit)} sebesar{' '}
                {formatRupiah(categoryLimitInfo.projectedTotal - categoryLimitInfo.limit)}.
              </div>
            </div>
          )}

          {categoryLimitInfo?.isWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-950 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-bold">Mendekati Batas (80%+):</span> Kategori {selectedCategory.name} sudah
                mencapai {formatRupiah(categoryLimitInfo.projectedTotal)} dari batas{' '}
                {formatRupiah(categoryLimitInfo.limit)}.
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-800 mt-0.5" aria-hidden="true" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <fieldset>
            <legend className="block text-xs font-bold text-zinc-700 mb-2">Kategori</legend>
            <div className="grid grid-cols-4 gap-2">
              {categories
                .filter((c) => !c.is_archived)
                .map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-colors min-h-[60px] ${
                        isSelected
                          ? 'border-zinc-900 bg-[#F2EDE4] ring-1 ring-zinc-900'
                          : 'border-[#D4CEC2] bg-white hover:bg-[#FAF7F2] text-zinc-800'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 border border-zinc-900/15"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={15} />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-900 truncate w-full text-center">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-expense-date" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Tanggal</span>
              </label>
              <input
                id="add-expense-date"
                type="date"
                value={spentOn}
                onChange={(e) => {
                  setSpentOn(e.target.value);
                  updateDuplicateNotice(numericAmount, e.target.value, merchant);
                }}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm font-medium text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="add-expense-merchant" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Toko / Merchant (Opsional)</span>
              </label>
              <input
                id="add-expense-merchant"
                type="text"
                placeholder="Contoh: Kantin, Indomaret"
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  updateDuplicateNotice(numericAmount, spentOn, e.target.value);
                }}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-expense-note" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Catatan (Opsional)</span>
              </span>
              <span className="text-[11px] text-zinc-500 tabular-nums">{note.length}/200</span>
            </label>
            <input
              id="add-expense-note"
              type="text"
              maxLength={200}
              placeholder="Contoh: Makan siang + es teh"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-[#E2DDD3] bg-[#FAF7F2] flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl transition-colors min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={numericAmount <= 0 || isSubmitting}
            className="flex-[2] py-2.5 px-6 text-xs font-extrabold text-white bg-[#C2410C] hover:bg-[#9A3412] active:translate-y-[1px] disabled:opacity-50 rounded-xl border border-zinc-900 transition-all min-h-[44px] tabular-nums"
          >
            {isSubmitting
              ? 'Menyimpan...'
              : numericAmount > 0
              ? `Simpan ${formatRupiah(numericAmount)}`
              : 'Simpan Pengeluaran'}
          </button>
        </div>
      </form>

      {showHighAmountConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="high-amount-title"
          className="absolute inset-0 bg-zinc-950/75 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full text-center border-2 border-zinc-900 shadow-ledger animate-scale-in space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h3 id="high-amount-title" className="text-base font-extrabold text-zinc-900">
                Konfirmasi Nominal Besar
              </h3>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Kamu memasukkan nominal{' '}
                <strong className="text-[#0F5132] tabular-nums">{formatRupiah(numericAmount)}</strong>. Pastikan angka ini
                sudah benar dan bukan salah ketik.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowHighAmountConfirm(false)}
                className="flex-1 py-2.5 text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2EDE4] text-zinc-800 border border-[#D4CEC2] rounded-xl min-h-[44px]"
              >
                Ubah Angka
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHighAmountConfirm(false);
                  handleSubmit(true);
                }}
                className="flex-1 py-2.5 text-xs font-extrabold bg-[#0F5132] hover:bg-[#0B3D26] text-white rounded-xl min-h-[44px]"
              >
                Ya, Benar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
