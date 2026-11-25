import {
  Profile,
  Category,
  MonthlyBudget,
  CategoryLimit,
  BudgetTopup,
  Expense,
  CategoryBudgetStatus,
  BudgetSummary
} from '../types';
import { getTodayDateString, getMonthLaterDateString, calculateDaysRemaining } from '../utils/format';
import {
  CloudSnapshot,
  generateUuid,
  syncBudgetToCloud,
  syncCategoryLimitToCloud,
  syncExpenseToCloud,
  syncProfileToCloud,
  syncTopupToCloud,
} from './supabase';

const STORAGE_KEYS = {
  PROFILE: 'catatduit_profile_v1',
  CATEGORIES: 'catatduit_categories_v1',
  BUDGETS: 'catatduit_budgets_v1',
  CATEGORY_LIMITS: 'catatduit_limits_v1',
  TOPUPS: 'catatduit_topups_v1',
  EXPENSES: 'catatduit_expenses_v1',
  ONBOARDED: 'catatduit_has_onboarded_v1',
  SUPABASE_CONFIG: 'catatduit_supabase_config_v1',
};

const LEGACY_COLOR_UPGRADE: Record<string, string> = {
  '#f97316': '#C2410C',
  '#0ea5e9': '#0369A1',
  '#8b5cf6': '#6D28D9',
  '#eab308': '#92400E',
  '#ec4899': '#BE185D',
  '#06b6d4': '#0F766E',
  '#10b981': '#0F5132',
  '#64748b': '#3F3F46',
};

export const DEFAULT_CATEGORIES: Array<Omit<Category, 'id' | 'user_id'>> = [
  { name: 'Makan', icon: 'Utensils', color: '#C2410C', sort_order: 1, is_archived: false },
  { name: 'Transportasi', icon: 'Bike', color: '#0369A1', sort_order: 2, is_archived: false },
  { name: 'Kuota/Pulsa', icon: 'Wifi', color: '#6D28D9', sort_order: 3, is_archived: false },
  { name: 'Kos', icon: 'Home', color: '#92400E', sort_order: 4, is_archived: false },
  { name: 'Hiburan', icon: 'Gamepad2', color: '#BE185D', sort_order: 5, is_archived: false },
  { name: 'Kuliah', icon: 'GraduationCap', color: '#0F766E', sort_order: 6, is_archived: false },
  { name: 'Belanja', icon: 'ShoppingBag', color: '#0F5132', sort_order: 7, is_archived: false },
  { name: 'Lainnya', icon: 'CircleEllipsis', color: '#3F3F46', sort_order: 8, is_archived: false },
];

export class StorageService {
  private static instance: StorageService;
  private cloudUserId: string | null = null;
  private onSyncErrorCallback: ((message: string) => void) | null = null;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  setCloudUserId(userId: string | null): void {
    this.cloudUserId = userId;
  }

  getCloudUserId(): string | null {
    return this.cloudUserId;
  }

  setOnSyncError(cb: ((message: string) => void) | null): void {
    this.onSyncErrorCallback = cb;
  }

  private runCloudTask(task: () => Promise<void>): void {
    if (!this.cloudUserId) return;
    task().catch((err) => {
      console.error('Supabase sync error:', err);
      this.onSyncErrorCallback?.('Perubahan tersimpan lokal, namun gagal sinkron ke Supabase.');
    });
  }

  exportLocalSnapshot(): {
    profile: Profile;
    categories: Category[];
    budgets: MonthlyBudget[];
    limits: CategoryLimit[];
    topups: BudgetTopup[];
    expenses: Expense[];
  } {
    const rawLimits = localStorage.getItem(STORAGE_KEYS.CATEGORY_LIMITS);
    const rawTopups = localStorage.getItem(STORAGE_KEYS.TOPUPS);
    let limits: CategoryLimit[] = [];
    let topups: BudgetTopup[] = [];
    try {
      limits = rawLimits ? JSON.parse(rawLimits) : [];
    } catch {
      limits = [];
    }
    try {
      topups = rawTopups ? JSON.parse(rawTopups) : [];
    } catch {
      topups = [];
    }

    return {
      profile: this.getProfile(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      limits,
      topups,
      expenses: this.getExpenses(true),
    };
  }

  hydrateFromCloudSnapshot(snapshot: CloudSnapshot, fallbackEmail?: string): void {
    if (snapshot.profile) {
      this.saveProfile(snapshot.profile, false);
    } else if (this.cloudUserId) {
      const current = this.getProfile();
      this.saveProfile(
        {
          ...current,
          id: this.cloudUserId,
          display_name: current.display_name || fallbackEmail?.split('@')[0] || 'Mahasiswa CatatDuit',
        },
        false
      );
    }

    if (snapshot.categories.length > 0) {
      const upgraded = snapshot.categories.map((c) => {
        const nextColor = LEGACY_COLOR_UPGRADE[c.color.toLowerCase()];
        return nextColor ? { ...c, color: nextColor } : c;
      });
      this.saveCategories(upgraded);
    }

    this.saveBudgets(snapshot.budgets);
    localStorage.setItem(STORAGE_KEYS.CATEGORY_LIMITS, JSON.stringify(snapshot.limits));
    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(snapshot.topups));
    this.saveExpenses(snapshot.expenses);

    if (snapshot.budgets.length > 0 || snapshot.expenses.length > 0) {
      this.setOnboarded(true);
    }
  }

  // Profile
  getProfile(): Profile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
    const defaultProfile: Profile = {
      id: this.cloudUserId || generateUuid(),
      display_name: 'Mahasiswa CatatDuit',
      timezone: 'Asia/Jakarta',
      created_at: new Date().toISOString(),
    };
    this.saveProfile(defaultProfile, false);
    return defaultProfile;
  }

  saveProfile(profile: Profile, syncCloud = true): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    if (syncCloud && this.cloudUserId) {
      const uid = this.cloudUserId;
      this.runCloudTask(() => syncProfileToCloud(uid, profile));
    }
  }

  hasOnboarded(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  }

  setOnboarded(value: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, value ? 'true' : 'false');
  }

  // Categories
  getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      try {
        const parsed: Category[] = JSON.parse(raw);
        if (parsed && parsed.length > 0) {
          let changed = false;
          const upgraded = parsed.map((c) => {
            const nextColor = LEGACY_COLOR_UPGRADE[c.color.toLowerCase()];
            if (nextColor && nextColor !== c.color) {
              changed = true;
              return { ...c, color: nextColor };
            }
            return c;
          });
          if (changed) this.saveCategories(upgraded);
          return upgraded;
        }
      } catch (e) {
        // fallback
      }
    }
    const profile = this.getProfile();
    const initCats: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: generateUuid(),
      user_id: profile.id,
    }));
    this.saveCategories(initCats);
    return initCats;
  }

  saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  addCategory(name: string, icon: string, color: string): Category {
    const categories = this.getCategories();
    const profile = this.getProfile();
    const newCat: Category = {
      id: generateUuid(),
      user_id: profile.id,
      name: name.trim(),
      icon,
      color,
      sort_order: categories.length + 1,
      is_archived: false,
    };
    categories.push(newCat);
    this.saveCategories(categories);
    return newCat;
  }

  updateCategory(category: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    if (index !== -1) {
      categories[index] = category;
      this.saveCategories(categories);
    }
  }

  archiveCategory(categoryId: string): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index !== -1) {
      categories[index].is_archived = true;
      this.saveCategories(categories);
    }
  }

  // Budgets
  getBudgets(): MonthlyBudget[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
    return [];
  }

  saveBudgets(budgets: MonthlyBudget[]): void {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }

  getActiveBudget(): MonthlyBudget | null {
    const budgets = this.getBudgets();
    if (budgets.length === 0) return null;
    const today = getTodayDateString();
    
    // Sort descending by period_start
    const sorted = [...budgets].sort(
      (a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime()
    );

    // Look for period enclosing today
    const current = sorted.find(
      (b) => b.period_start <= today && b.period_end >= today
    );
    if (current) return current;

    // Otherwise return latest period
    return sorted[0];
  }

  createBudget(allowanceAmount: number, savingsTarget = 0, periodStart?: string, periodEnd?: string): MonthlyBudget {
    const budgets = this.getBudgets();
    const profile = this.getProfile();
    const start = periodStart || getTodayDateString();
    const end = periodEnd || getMonthLaterDateString(new Date(start));

    // If there is a previous active budget, close it yesterday if needed
    if (budgets.length > 0) {
      const yesterday = new Date(new Date(start).getTime() - 24 * 60 * 60 * 1000);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      budgets.forEach((b) => {
        if (b.period_end >= start) {
          b.period_end = yStr;
          b.updated_at = new Date().toISOString();
        }
      });
    }

    const newBudget: MonthlyBudget = {
      id: generateUuid(),
      user_id: this.cloudUserId || profile.id,
      period_start: start,
      period_end: end,
      allowance_amount: allowanceAmount,
      savings_target: savingsTarget,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    budgets.unshift(newBudget);
    this.saveBudgets(budgets);
    if (this.cloudUserId) {
      const uid = this.cloudUserId;
      this.runCloudTask(async () => {
        for (const b of budgets) {
          await syncBudgetToCloud(uid, b);
        }
      });
    }
    return newBudget;
  }

  updateBudget(budget: MonthlyBudget): void {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex((b) => b.id === budget.id);
    if (idx !== -1) {
      const updated = { ...budget, updated_at: new Date().toISOString() };
      budgets[idx] = updated;
      this.saveBudgets(budgets);
      if (this.cloudUserId) {
        const uid = this.cloudUserId;
        this.runCloudTask(() => syncBudgetToCloud(uid, updated));
      }
    }
  }

  // Category Limits
  getCategoryLimits(budgetId: string): CategoryLimit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORY_LIMITS);
    if (!raw) return [];
    try {
      const all: CategoryLimit[] = JSON.parse(raw);
      return all.filter((l) => l.budget_id === budgetId);
    } catch (e) {
      return [];
    }
  }

  saveCategoryLimit(budgetId: string, categoryId: string, limitAmount: number): void {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORY_LIMITS);
    let all: CategoryLimit[] = raw ? JSON.parse(raw) : [];
    const existingIdx = all.findIndex((l) => l.budget_id === budgetId && l.category_id === categoryId);

    if (existingIdx !== -1) {
      if (limitAmount <= 0) {
        all.splice(existingIdx, 1);
      } else {
        all[existingIdx].limit_amount = limitAmount;
      }
    } else if (limitAmount > 0) {
      all.push({
        id: generateUuid(),
        budget_id: budgetId,
        category_id: categoryId,
        limit_amount: limitAmount,
      });
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORY_LIMITS, JSON.stringify(all));
    this.runCloudTask(() => syncCategoryLimitToCloud(budgetId, categoryId, limitAmount));
  }

  // Topups
  getTopups(budgetId: string): BudgetTopup[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPUPS);
    if (!raw) return [];
    try {
      const all: BudgetTopup[] = JSON.parse(raw);
      return all.filter((t) => t.budget_id === budgetId);
    } catch (e) {
      return [];
    }
  }

  addTopup(budgetId: string, amount: number, receivedOn: string, note?: string): BudgetTopup {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPUPS);
    let all: BudgetTopup[] = raw ? JSON.parse(raw) : [];
    const newTopup: BudgetTopup = {
      id: generateUuid(),
      budget_id: budgetId,
      amount,
      received_on: receivedOn,
      note,
    };
    all.push(newTopup);
    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(all));
    this.runCloudTask(() => syncTopupToCloud(newTopup));
    return newTopup;
  }

  // Expenses
  getExpenses(includeDeleted = false): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return [];
    try {
      const all: Expense[] = JSON.parse(raw);
      return includeDeleted ? all : all.filter((e) => !e.deleted_at);
    } catch (e) {
      return [];
    }
  }

  saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  addExpense(params: {
    category_id: string;
    amount: number;
    spent_on?: string;
    note?: string;
    merchant?: string;
    source?: 'manual' | 'ocr';
  }): Expense {
    const expenses = this.getExpenses(true);
    const profile = this.getProfile();
    const newExpense: Expense = {
      id: generateUuid(),
      user_id: this.cloudUserId || profile.id,
      category_id: params.category_id,
      amount: params.amount,
      spent_on: params.spent_on || getTodayDateString(),
      note: params.note ? params.note.slice(0, 200) : undefined,
      merchant: params.merchant,
      source: params.source || 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    if (this.cloudUserId) {
      const uid = this.cloudUserId;
      this.runCloudTask(() => syncExpenseToCloud(uid, newExpense));
    }
    return newExpense;
  }

  updateExpense(expense: Expense): void {
    const expenses = this.getExpenses(true);
    const idx = expenses.findIndex((e) => e.id === expense.id);
    if (idx !== -1) {
      const updated = {
        ...expense,
        updated_at: new Date().toISOString(),
      };
      expenses[idx] = updated;
      this.saveExpenses(expenses);
      if (this.cloudUserId) {
        const uid = this.cloudUserId;
        this.runCloudTask(() => syncExpenseToCloud(uid, updated));
      }
    }
  }

  softDeleteExpense(expenseId: string): Expense | null {
    const expenses = this.getExpenses(true);
    const idx = expenses.findIndex((e) => e.id === expenseId);
    if (idx !== -1) {
      const deletedItem = {
        ...expenses[idx],
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expenses[idx] = deletedItem;
      this.saveExpenses(expenses);
      if (this.cloudUserId) {
        const uid = this.cloudUserId;
        this.runCloudTask(() => syncExpenseToCloud(uid, deletedItem));
      }
      return deletedItem;
    }
    return null;
  }

  restoreExpense(expenseId: string): void {
    const expenses = this.getExpenses(true);
    const idx = expenses.findIndex((e) => e.id === expenseId);
    if (idx !== -1) {
      const restored = {
        ...expenses[idx],
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };
      expenses[idx] = restored;
      this.saveExpenses(expenses);
      if (this.cloudUserId) {
        const uid = this.cloudUserId;
        this.runCloudTask(() => syncExpenseToCloud(uid, restored));
      }
    }
  }

  // Duplicate checker as per PRD 10.1
  checkPossibleDuplicate(amount: number, spentOn: string, merchant?: string): Expense | null {
    const expenses = this.getExpenses();
    return (
      expenses.find(
        (e) =>
          e.amount === amount &&
          e.spent_on === spentOn &&
          (merchant && e.merchant ? e.merchant.toLowerCase() === merchant.toLowerCase() : true)
      ) || null
    );
  }

  // Financial Calculations according to PRD Section 9
  getBudgetSummary(budgetId?: string): BudgetSummary {
    const budget = budgetId
      ? this.getBudgets().find((b) => b.id === budgetId) || null
      : this.getActiveBudget();

    if (!budget) {
      return {
        hasBudget: false,
        budget: null,
        spendableBudget: 0,
        totalExpenses: 0,
        remainingBudget: 0,
        dailyRemaining: 0,
        daysRemaining: 1,
        isOverdue: false,
        savingsTarget: 0,
        topupsTotal: 0,
        topups: [],
        expenses: [],
        largestCategory: null,
        categoryStatuses: [],
      };
    }

    const topups = this.getTopups(budget.id);
    const topupsTotal = topups.reduce((sum, t) => sum + t.amount, 0);

    // Spendable = allowance + topups - savings_target
    const spendableBudget = budget.allowance_amount + topupsTotal - budget.savings_target;

    // Filter expenses within period dates: period_start <= spent_on <= period_end
    const allExpenses = this.getExpenses();
    const periodExpenses = allExpenses.filter(
      (e) => e.spent_on >= budget.period_start && e.spent_on <= budget.period_end
    );

    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = spendableBudget - totalExpenses;

    // Daily budget calculation
    const { days, isOverdue } = calculateDaysRemaining(budget.period_end);
    let dailyRemaining = 0;
    if (remainingBudget > 0 && days > 0) {
      dailyRemaining = Math.floor(remainingBudget / days);
    }

    // Category breakdown
    const categories = this.getCategories();
    const categoryMap = new Map<string, Category>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    const limits = this.getCategoryLimits(budget.id);
    const limitMap = new Map<string, number>();
    limits.forEach((l) => limitMap.set(l.category_id, l.limit_amount));

    const spentPerCategory = new Map<string, number>();
    periodExpenses.forEach((e) => {
      const prev = spentPerCategory.get(e.category_id) || 0;
      spentPerCategory.set(e.category_id, prev + e.amount);
    });

    // Largest category
    let largestCatObj: { category: Category; amount: number } | null = null;
    let maxSpent = 0;

    const categoryStatuses: CategoryBudgetStatus[] = categories
      .filter((c) => !c.is_archived || (spentPerCategory.get(c.id) || 0) > 0)
      .map((cat) => {
        const spentAmount = spentPerCategory.get(cat.id) || 0;
        const limitAmount = limitMap.get(cat.id);

        if (spentAmount > maxSpent) {
          maxSpent = spentAmount;
          largestCatObj = { category: cat, amount: spentAmount };
        }

        let percentage = 0;
        let isWarning = false;
        let isExceeded = false;
        let difference = 0;

        if (limitAmount && limitAmount > 0) {
          percentage = Math.round((spentAmount / limitAmount) * 100);
          isWarning = percentage >= 80 && percentage < 100;
          isExceeded = percentage >= 100;
          difference = spentAmount - limitAmount;
        }

        return {
          category: cat,
          limitAmount,
          spentAmount,
          percentage,
          isWarning,
          isExceeded,
          difference,
        };
      })
      .sort((a, b) => b.spentAmount - a.spentAmount);

    return {
      hasBudget: true,
      budget,
      spendableBudget,
      totalExpenses,
      remainingBudget,
      dailyRemaining,
      daysRemaining: days,
      isOverdue,
      savingsTarget: budget.savings_target,
      topupsTotal,
      topups,
      expenses: periodExpenses,
      largestCategory: largestCatObj,
      categoryStatuses,
    };
  }

  // Seed sample demo data (Raka's profile from PRD 4)
  seedDemoData(): void {
    this.clearAllData();
    const today = getTodayDateString();
    const profileId = this.cloudUserId || generateUuid();
    const profile: Profile = {
      id: profileId,
      display_name: 'Raka (Mahasiswa Perantau)',
      timezone: 'Asia/Jakarta',
      created_at: new Date().toISOString(),
    };
    this.saveProfile(profile, false);

    const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: generateUuid(),
      user_id: profile.id,
    }));
    this.saveCategories(categories);

    // Period: today to +25 days
    const budgetStart = today;
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 25);
    const budgetEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;

    const budgetId = generateUuid();
    const budget: MonthlyBudget = {
      id: budgetId,
      user_id: profile.id,
      period_start: budgetStart,
      period_end: budgetEnd,
      allowance_amount: 2000000, // Rp2.000.000
      savings_target: 200000,    // Target tabungan Rp200.000
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveBudgets([budget]);

    // Set category limits using real generated category IDs
    const makanId = categories[0].id;
    const transId = categories[1].id;
    const pulsaId = categories[2].id;
    const hiburanId = categories[4].id;
    const belanjaId = categories[6].id;

    localStorage.setItem(
      STORAGE_KEYS.CATEGORY_LIMITS,
      JSON.stringify([
        { id: generateUuid(), budget_id: budget.id, category_id: makanId, limit_amount: 800000 },
        { id: generateUuid(), budget_id: budget.id, category_id: transId, limit_amount: 200000 },
        { id: generateUuid(), budget_id: budget.id, category_id: pulsaId, limit_amount: 100000 },
        { id: generateUuid(), budget_id: budget.id, category_id: hiburanId, limit_amount: 250000 },
      ])
    );

    localStorage.setItem(
      STORAGE_KEYS.TOPUPS,
      JSON.stringify([
        {
          id: generateUuid(),
          budget_id: budget.id,
          amount: 100000,
          received_on: budgetStart,
          note: 'Tambahan transfer bapak',
        },
      ])
    );

    const sampleExpenses = [
      { category_id: makanId, amount: 25000, spent_on: today, note: 'Nasi Padang + Es Teh', merchant: 'RM Sederhana', source: 'manual' as const },
      { category_id: transId, amount: 14000, spent_on: today, note: 'Gojek ke kampus', merchant: 'Gojek', source: 'ocr' as const },
      { category_id: pulsaId, amount: 50000, spent_on: today, note: 'Paket Internet Bulanan', merchant: 'MyTelkomsel', source: 'ocr' as const },
      { category_id: makanId, amount: 18000, spent_on: today, note: 'Kantin Bu Agus', merchant: 'Kantin Teknik', source: 'manual' as const },
      { category_id: belanjaId, amount: 45000, spent_on: today, note: 'Sabun, sampo, pasta gigi', merchant: 'Indomaret', source: 'manual' as const },
    ];

    const builtExpenses: Expense[] = sampleExpenses.map((exp) => ({
      id: generateUuid(),
      user_id: profile.id,
      category_id: exp.category_id,
      amount: exp.amount,
      spent_on: exp.spent_on,
      note: exp.note,
      merchant: exp.merchant,
      source: exp.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }));
    this.saveExpenses(builtExpenses);

    this.setOnboarded(true);
  }

  // Reset all user data (PRD 10.3 Hak menghapus data)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORY_LIMITS);
    localStorage.removeItem(STORAGE_KEYS.TOPUPS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDED);
  }
}
