import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import {
  BudgetTopup,
  Category,
  CategoryLimit,
  Expense,
  MonthlyBudget,
  Profile,
} from '../types';

export const SB_STORAGE_KEYS = {
  URL: 'catatduit_sb_url',
  ANON: 'catatduit_sb_anon',
};

export interface SupabaseConfigInfo {
  url: string;
  anonKey: string;
  source: 'local' | 'env' | 'none';
}

export interface CloudSnapshot {
  profile: Profile | null;
  categories: Category[];
  budgets: MonthlyBudget[];
  limits: CategoryLimit[];
  topups: BudgetTopup[];
  expenses: Expense[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value?: string | null): boolean {
  return !!value && UUID_REGEX.test(value);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseConfig(): SupabaseConfigInfo {
  const localUrl =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem(SB_STORAGE_KEYS.URL) || '').trim()
      : '';
  const localAnon =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem(SB_STORAGE_KEYS.ANON) || '').trim()
      : '';

  if (localUrl && localAnon) {
    return { url: localUrl, anonKey: localAnon, source: 'local' };
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envAnon) {
    return { url: envUrl, anonKey: envAnon, source: 'env' };
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return /^https:\/\/.+\..+/.test(cfg.url) && cfg.anonKey.length > 10;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(SB_STORAGE_KEYS.URL, url.trim());
  localStorage.setItem(SB_STORAGE_KEYS.ANON, anonKey.trim());
  cachedClient = null;
  cachedKey = '';
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SB_STORAGE_KEYS.URL);
  localStorage.removeItem(SB_STORAGE_KEYS.ANON);
  cachedClient = null;
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!/^https:\/\/.+\..+/.test(cfg.url) || !cfg.anonKey) {
    return null;
  }
  const key = `${cfg.url}|${cfg.anonKey}`;
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }
  cachedClient = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cachedKey = key;
  return cachedClient;
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase belum dikonfigurasi. Isi URL dan Anon Key di Pengaturan terlebih dahulu.',
    };
  }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim() || email.split('@')[0],
      },
    },
  });

  if (error) {
    return { user: null, session: null, error: mapAuthError(error.message) };
  }

  return { user: data.user, session: data.session, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase belum dikonfigurasi. Isi URL dan Anon Key di Pengaturan terlebih dahulu.',
    };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { user: null, session: null, error: mapAuthError(error.message) };
  }

  return { user: data.user, session: data.session, error: null };
}

export async function signOutSupabase(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  const { error } = await client.auth.signOut();
  return { error: error ? error.message : null };
}

function mapAuthError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek kotak masuk atau folder spam emailmu.';
  }
  if (msg.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk dengan kata sandimu.';
  }
  if (msg.includes('password should be at least')) {
    return 'Kata sandi minimal 6 karakter.';
  }
  return raw;
}

export async function pullFromSupabase(userId: string): Promise<CloudSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Klien Supabase belum tersedia.');
  }

  const [
    profileRes,
    categoriesRes,
    budgetsRes,
    expensesRes,
  ] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('categories').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
    client.from('monthly_budgets').select('*').eq('user_id', userId).order('period_start', { ascending: false }),
    client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('spent_on', { ascending: false }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (budgetsRes.error) throw budgetsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const budgets = (budgetsRes.data || []) as MonthlyBudget[];
  const budgetIds = budgets.map((b) => b.id);

  let limits: CategoryLimit[] = [];
  let topups: BudgetTopup[] = [];

  if (budgetIds.length > 0) {
    const [limitsRes, topupsRes] = await Promise.all([
      client.from('category_limits').select('*').in('budget_id', budgetIds),
      client.from('budget_topups').select('*').in('budget_id', budgetIds),
    ]);
    if (limitsRes.error) throw limitsRes.error;
    if (topupsRes.error) throw topupsRes.error;
    limits = (limitsRes.data || []) as CategoryLimit[];
    topups = (topupsRes.data || []) as BudgetTopup[];
  }

  return {
    profile: (profileRes.data as Profile | null) || null,
    categories: (categoriesRes.data || []) as Category[],
    budgets,
    limits,
    topups,
    expenses: (expensesRes.data || []) as Expense[],
  };
}

export async function pushLocalSnapshotToSupabase(
  userId: string,
  local: {
    profile: Profile;
    categories: Category[];
    budgets: MonthlyBudget[];
    limits: CategoryLimit[];
    topups: BudgetTopup[];
    expenses: Expense[];
  }
): Promise<CloudSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Klien Supabase belum tersedia.');
  }

  const normalizedProfile: Profile = {
    ...local.profile,
    id: userId,
  };

  const { error: profileErr } = await client.from('profiles').upsert(
    {
      id: userId,
      display_name: normalizedProfile.display_name,
      timezone: normalizedProfile.timezone || 'Asia/Jakarta',
    },
    { onConflict: 'id' }
  );
  if (profileErr) throw profileErr;

  // Fetch existing remote categories to avoid duplicate (user_id, lower(name)) conflict
  const { data: existingCatRows, error: existingCatErr } = await client
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  if (existingCatErr) throw existingCatErr;

  const existingCats = (existingCatRows || []) as Category[];
  const catByLowerName = new Map<string, Category>();
  existingCats.forEach((c) => catByLowerName.set(c.name.toLowerCase(), c));

  const categoryIdMap = new Map<string, string>();
  const categoriesToUpsert: Category[] = [];

  for (const cat of local.categories) {
    const matched = catByLowerName.get(cat.name.toLowerCase());
    if (matched) {
      categoryIdMap.set(cat.id, matched.id);
    } else {
      const nextId = isValidUuid(cat.id) ? cat.id : generateUuid();
      categoryIdMap.set(cat.id, nextId);
      categoriesToUpsert.push({
        ...cat,
        id: nextId,
        user_id: userId,
      });
    }
  }

  if (categoriesToUpsert.length > 0) {
    const { error: catErr } = await client.from('categories').upsert(categoriesToUpsert, {
      onConflict: 'id',
    });
    if (catErr) throw catErr;
  }

  const budgetIdMap = new Map<string, string>();
  const normalizedBudgets: MonthlyBudget[] = local.budgets.map((b) => {
    const nextId = isValidUuid(b.id) ? b.id : generateUuid();
    budgetIdMap.set(b.id, nextId);
    return {
      ...b,
      id: nextId,
      user_id: userId,
    };
  });

  if (normalizedBudgets.length > 0) {
    const { error: budgetErr } = await client
      .from('monthly_budgets')
      .upsert(normalizedBudgets, { onConflict: 'id' });
    if (budgetErr) throw budgetErr;
  }

  const normalizedLimits: CategoryLimit[] = local.limits
    .filter((l) => l.limit_amount > 0)
    .map((l) => ({
      id: isValidUuid(l.id) ? l.id : generateUuid(),
      budget_id: budgetIdMap.get(l.budget_id) || l.budget_id,
      category_id: categoryIdMap.get(l.category_id) || l.category_id,
      limit_amount: l.limit_amount,
    }))
    .filter((l) => isValidUuid(l.budget_id) && isValidUuid(l.category_id));

  if (normalizedLimits.length > 0) {
    const { error: limErr } = await client
      .from('category_limits')
      .upsert(normalizedLimits, { onConflict: 'budget_id,category_id' });
    if (limErr) throw limErr;
  }

  const normalizedTopups: BudgetTopup[] = local.topups
    .map((t) => ({
      id: isValidUuid(t.id) ? t.id : generateUuid(),
      budget_id: budgetIdMap.get(t.budget_id) || t.budget_id,
      amount: t.amount,
      received_on: t.received_on,
      note: t.note || undefined,
    }))
    .filter((t) => isValidUuid(t.budget_id));

  if (normalizedTopups.length > 0) {
    const { error: topErr } = await client
      .from('budget_topups')
      .upsert(normalizedTopups, { onConflict: 'id' });
    if (topErr) throw topErr;
  }

  const normalizedExpenses: Expense[] = local.expenses
    .map((e) => ({
      ...e,
      id: isValidUuid(e.id) ? e.id : generateUuid(),
      user_id: userId,
      category_id: categoryIdMap.get(e.category_id) || e.category_id,
    }))
    .filter((e) => isValidUuid(e.category_id));

  if (normalizedExpenses.length > 0) {
    const { error: expErr } = await client
      .from('expenses')
      .upsert(normalizedExpenses, { onConflict: 'id' });
    if (expErr) throw expErr;
  }

  return pullFromSupabase(userId);
}

export async function syncProfileToCloud(userId: string, profile: Profile): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('profiles').upsert(
    {
      id: userId,
      display_name: profile.display_name,
      timezone: profile.timezone || 'Asia/Jakarta',
    },
    { onConflict: 'id' }
  );
}

export async function syncBudgetToCloud(userId: string, budget: MonthlyBudget): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isValidUuid(budget.id)) return;
  await client.from('monthly_budgets').upsert(
    {
      ...budget,
      user_id: userId,
    },
    { onConflict: 'id' }
  );
}

export async function syncCategoryLimitToCloud(
  budgetId: string,
  categoryId: string,
  limitAmount: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isValidUuid(budgetId) || !isValidUuid(categoryId)) return;

  if (limitAmount <= 0) {
    await client
      .from('category_limits')
      .delete()
      .eq('budget_id', budgetId)
      .eq('category_id', categoryId);
    return;
  }

  await client.from('category_limits').upsert(
    {
      budget_id: budgetId,
      category_id: categoryId,
      limit_amount: limitAmount,
    },
    { onConflict: 'budget_id,category_id' }
  );
}

export async function syncTopupToCloud(topup: BudgetTopup): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isValidUuid(topup.id) || !isValidUuid(topup.budget_id)) return;
  await client.from('budget_topups').upsert(topup, { onConflict: 'id' });
}

export async function syncExpenseToCloud(userId: string, expense: Expense): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isValidUuid(expense.id) || !isValidUuid(expense.category_id)) return;
  await client.from('expenses').upsert(
    {
      ...expense,
      user_id: userId,
      note: expense.note ?? null,
      merchant: expense.merchant ?? null,
      deleted_at: expense.deleted_at ?? null,
    },
    { onConflict: 'id' }
  );
}
