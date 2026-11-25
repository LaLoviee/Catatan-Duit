import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { StorageService } from './services/storage';
import {
  getCurrentSession,
  getSupabaseClient,
  pullFromSupabase,
  pushLocalSnapshotToSupabase,
  signOutSupabase,
} from './services/supabase';
import { Expense, Category, MonthlyBudget } from './types';
import { Navbar } from './components/Navbar';
import { Navigation, TabType } from './components/Navigation';
import { AddExpenseModal } from './components/AddExpenseModal';
import { OCRScannerModal } from './components/OCRScannerModal';
import { NewPeriodModal } from './components/NewPeriodModal';
import { TopupModal } from './components/TopupModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { UndoToast } from './components/UndoToast';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetView } from './views/BudgetView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const storage = StorageService.getInstance();
  const [activeTab, setActiveTab] = useState<TabType>('beranda');
  const [profile, setProfile] = useState(storage.getProfile());
  const [categories, setCategories] = useState<Category[]>(storage.getCategories());
  const [activeBudget, setActiveBudget] = useState<MonthlyBudget | null>(storage.getActiveBudget());

  const [showAddModal, setShowAddModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!storage.hasOnboarded());
  const [pendingEditExpense, setPendingEditExpense] = useState<Expense | null>(null);

  const [cloudSession, setCloudSession] = useState<Session | null>(null);
  const [supabaseConfigVersion, setSupabaseConfigVersion] = useState(0);
  const [syncStatus, setSyncStatus] = useState<{
    state: 'idle' | 'syncing' | 'synced' | 'error';
    message?: string | null;
  }>({ state: 'idle', message: null });

  const [deletedExpense, setDeletedExpense] = useState<Expense | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(5);
  const countdownIntervalRef = useRef<number | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setProfile(storage.getProfile());
    setCategories(storage.getCategories());
    setActiveBudget(storage.getActiveBudget());
  }, [refreshKey, storage]);

  const syncWithCloudUser = useCallback(
    async (user: User, pushLocalFirst = false) => {
      storage.setCloudUserId(user.id);
      setSyncStatus({ state: 'syncing', message: 'Menyinkronkan data dengan Supabase...' });
      try {
        if (pushLocalFirst) {
          const snapshot = await pushLocalSnapshotToSupabase(
            user.id,
            storage.exportLocalSnapshot()
          );
          storage.hydrateFromCloudSnapshot(snapshot, user.email);
        } else {
          const remote = await pullFromSupabase(user.id);
          const local = storage.exportLocalSnapshot();
          const remoteEmpty = remote.budgets.length === 0 && remote.expenses.length === 0;
          const localHasData = local.budgets.length > 0 || local.expenses.length > 0;
          if (remoteEmpty && localHasData) {
            const pushed = await pushLocalSnapshotToSupabase(user.id, local);
            storage.hydrateFromCloudSnapshot(pushed, user.email);
          } else {
            storage.hydrateFromCloudSnapshot(remote, user.email);
          }
        }
        setSyncStatus({ state: 'synced', message: 'Data sinkron dengan akun cloud.' });
        triggerRefresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal menyinkronkan data.';
        setSyncStatus({ state: 'error', message: msg });
      }
    },
    [storage, triggerRefresh]
  );

  useEffect(() => {
    storage.setOnSyncError((msg) => {
      setSyncStatus({ state: 'error', message: msg });
    });
    return () => storage.setOnSyncError(null);
  }, [storage]);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();
    if (!client) {
      setCloudSession(null);
      storage.setCloudUserId(null);
      return;
    }

    getCurrentSession().then((session) => {
      if (!active) return;
      setCloudSession(session);
      if (session?.user) {
        syncWithCloudUser(session.user);
      } else {
        storage.setCloudUserId(null);
      }
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setCloudSession(session);
      if (session?.user) {
        storage.setCloudUserId(session.user.id);
      } else {
        storage.setCloudUserId(null);
        setSyncStatus({ state: 'idle', message: null });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabaseConfigVersion, storage, syncWithCloudUser]);

  useEffect(() => {
    if (deletedExpense) {
      setUndoCountdown(5);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = window.setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setDeletedExpense(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [deletedExpense]);

  const handleUndoDelete = () => {
    if (deletedExpense) {
      storage.restoreExpense(deletedExpense.id);
      setDeletedExpense(null);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      triggerRefresh();
    }
  };

  const handleExpenseDeleted = (exp: Expense) => {
    setDeletedExpense(exp);
    triggerRefresh();
  };

  const handleExpenseAdded = () => {
    triggerRefresh();
  };

  const handleSignOut = async () => {
    await signOutSupabase();
    storage.setCloudUserId(null);
    setCloudSession(null);
    setSyncStatus({ state: 'idle', message: 'Kamu telah keluar. Data tetap aman tersimpan secara lokal.' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col md:flex-row antialiased selection:bg-orange-100 selection:text-zinc-900">
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0 });
        }}
        onQuickAdd={() => setShowAddModal(true)}
        cloudUserEmail={cloudSession?.user?.email || null}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Navbar
          profile={profile}
          activeBudget={activeBudget}
          activeTab={activeTab}
          onLogoClick={() => {
            setActiveTab('beranda');
            window.scrollTo({ top: 0 });
          }}
          onQuickAdd={() => setShowAddModal(true)}
          onOpenOCR={() => setShowOCRModal(true)}
          onNewPeriod={() => setShowNewPeriodModal(true)}
          onProfileClick={() => {
            setActiveTab('pengaturan');
            window.scrollTo({ top: 0 });
          }}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
          {activeTab === 'beranda' && (
            <DashboardView
              key={refreshKey}
              onQuickAdd={() => setShowAddModal(true)}
              onOpenOCR={() => setShowOCRModal(true)}
              onNewPeriod={() => setShowNewPeriodModal(true)}
              onOpenTopup={() => setShowTopupModal(true)}
              onViewAllTransactions={() => setActiveTab('transaksi')}
              onEditExpense={(exp) => {
                setPendingEditExpense(exp);
                setActiveTab('transaksi');
              }}
              onGoToBudget={() => setActiveTab('anggaran')}
            />
          )}

          {activeTab === 'transaksi' && (
            <TransactionsView
              key={refreshKey}
              onQuickAdd={() => setShowAddModal(true)}
              onExpenseDeleted={handleExpenseDeleted}
              onExpenseUpdated={triggerRefresh}
              initialEditExpense={pendingEditExpense}
              onInitialEditHandled={() => setPendingEditExpense(null)}
            />
          )}

          {activeTab === 'anggaran' && (
            <BudgetView
              key={refreshKey}
              onNewPeriod={() => setShowNewPeriodModal(true)}
              onOpenTopup={() => setShowTopupModal(true)}
              onBudgetChanged={triggerRefresh}
            />
          )}

          {activeTab === 'laporan' && (
            <ReportsView
              key={refreshKey}
              onQuickAdd={() => setShowAddModal(true)}
            />
          )}

          {activeTab === 'pengaturan' && (
            <SettingsView
              onDataChanged={triggerRefresh}
              cloudUserEmail={cloudSession?.user?.email || null}
              syncStatus={syncStatus}
              onOpenAuth={() => setShowAuthModal(true)}
              onSyncNow={async () => {
                if (cloudSession?.user) {
                  await syncWithCloudUser(cloudSession.user, true);
                }
              }}
              onSignOut={handleSignOut}
              onSupabaseConfigChanged={() => setSupabaseConfigVersion((v) => v + 1)}
            />
          )}
        </main>

        <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-24 md:pb-6 pt-2">
          <div className="border-t border-[#E2DDD3] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-600">
            <p className="font-medium">
              CatatDuit menyimpan catatan uang saku secara lokal dan mendukung sinkronisasi akun Supabase opsional.
            </p>
            <button
              type="button"
              onClick={() => {
                if (cloudSession?.user) {
                  setActiveTab('pengaturan');
                  window.scrollTo({ top: 0 });
                } else {
                  setShowAuthModal(true);
                }
              }}
              className="font-bold text-[#0F5132] hover:underline min-h-[44px] inline-flex items-center"
            >
              {cloudSession?.user ? `Cloud: ${cloudSession.user.email}` : 'Masuk / Sinkronkan Cloud'}
            </button>
          </div>
        </footer>
      </div>

      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        activeBudgetId={activeBudget?.id}
        onExpenseAdded={handleExpenseAdded}
        onOpenOCR={() => setShowOCRModal(true)}
      />

      <OCRScannerModal
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        categories={categories}
        onExpenseAdded={handleExpenseAdded}
      />

      <NewPeriodModal
        isOpen={showNewPeriodModal}
        onClose={() => setShowNewPeriodModal(false)}
        currentBudget={activeBudget}
        onPeriodCreated={() => triggerRefresh()}
      />

      {activeBudget && (
        <TopupModal
          isOpen={showTopupModal}
          onClose={() => setShowTopupModal(false)}
          budgetId={activeBudget.id}
          onTopupAdded={() => triggerRefresh()}
        />
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          storage.setOnboarded(true);
          setShowOnboarding(false);
        }}
        onComplete={() => {
          setShowOnboarding(false);
          triggerRefresh();
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setSyncStatus({ state: 'synced', message: `Terhubung sebagai ${user.email}` });
          triggerRefresh();
        }}
        onGoToSupabaseSettings={() => {
          setActiveTab('pengaturan');
          window.scrollTo({ top: 0 });
        }}
      />

      <UndoToast
        deletedExpense={deletedExpense}
        countdown={undoCountdown}
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedExpense(null)}
      />
    </div>
  );
};

export default App;
