export interface Profile {
  id: string;
  display_name: string;
  timezone: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_archived: boolean;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  allowance_amount: number; // in Rupiah integer
  savings_target: number;   // in Rupiah integer
  created_at: string;
  updated_at: string;
}

export interface CategoryLimit {
  id: string;
  budget_id: string;
  category_id: string;
  limit_amount: number; // in Rupiah integer
}

export interface BudgetTopup {
  id: string;
  budget_id: string;
  amount: number; // in Rupiah integer
  received_on: string; // YYYY-MM-DD
  note?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number; // in Rupiah integer
  spent_on: string; // YYYY-MM-DD
  note?: string;
  merchant?: string;
  source: 'manual' | 'ocr';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OCRCandidate {
  amount: number;
  confidence: number;
  rawText: string;
  label?: string;
}

export interface OCRResult {
  merchant: string;
  date: string;
  amounts: OCRCandidate[];
  selectedAmount: number;
  rawText: string;
  previewUrl: string;
}

export interface CategoryBudgetStatus {
  category: Category;
  limitAmount?: number;
  spentAmount: number;
  percentage: number;
  isWarning: boolean; // >= 80%
  isExceeded: boolean; // >= 100%
  difference: number;
}

export interface BudgetSummary {
  hasBudget: boolean;
  budget: MonthlyBudget | null;
  spendableBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  dailyRemaining: number;
  daysRemaining: number;
  isOverdue: boolean;
  savingsTarget: number;
  topupsTotal: number;
  topups: BudgetTopup[];
  expenses: Expense[];
  largestCategory: { category: Category; amount: number } | null;
  categoryStatuses: CategoryBudgetStatus[];
}

