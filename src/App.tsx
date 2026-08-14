import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Transaction, Category, OverallBudgetStatus } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AlertsBanner } from './components/AlertsBanner';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { AnalyticsView } from './components/AnalyticsView';
import { PersonasView } from './components/PersonasView';
import { SecurityDeploymentView } from './components/SecurityDeploymentView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { AuthScreen } from './components/AuthScreen';
import { ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';

function MainApp() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Active month state (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<OverallBudgetStatus | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch all primary datasets for the active month
  const refreshAppData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const [txRes, catRes, budgetRes] = await Promise.all([
        api.getTransactions({ month: currentMonth }),
        api.getCategories(),
        api.getBudgetStatus(currentMonth),
      ]);
      setTransactions(txRes.transactions);
      setCategories(catRes);
      setBudgetStatus(budgetRes);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    if (user) {
      refreshAppData();
    }
  }, [user, currentMonth, refreshAppData]);

  // Transaction Actions
  const handleSaveTransaction = async (txData: {
    date: string;
    categoryId: string;
    type: 'expense' | 'income';
    paymentMethod: Transaction['paymentMethod'];
    amount: number;
    title: string;
    notes?: string;
    tags?: string[];
    isRecurring?: boolean;
  }) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, txData);
      showToast(`Updated "${txData.title}"`);
    } else {
      const res = await api.createTransaction(txData);
      if (res.alert && res.alert.triggered) {
        showToast(res.alert.message, 'warning');
      } else {
        showToast(`Saved and encrypted "${txData.title}"`);
      }
    }
    setEditingTransaction(null);
    await refreshAppData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    showToast('Transaction deleted from ledger', 'info');
    await refreshAppData();
  };

  // Budget Actions
  const handleSaveCategoryBudget = async (categoryId: string, limitAmount: number) => {
    await api.upsertBudget(categoryId, limitAmount, currentMonth);
    showToast('Budget target updated');
    await refreshAppData();
  };

  const handleUpdateAlertThreshold = async (threshold: number) => {
    await api.updateProfile({ alertThresholdPercent: threshold });
    showToast(`Alert threshold set to ${threshold}%`);
    await refreshAppData();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-indigo-200 font-semibold">Initializing Secure FinTracker Environment...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const currency = user.currency || '₹';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenQuickAdd={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        budgetStatus={budgetStatus}
        onNavigateToTab={setActiveTab}
      />

      {/* Main Layout (Sidebar + Content Stage) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlertsCount={budgetStatus?.activeAlertsCount || 0}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Active Budget Threshold Alerts Banner */}
          <AlertsBanner
            budgetStatus={budgetStatus}
            currency={currency}
            onNavigateToBudgets={() => setActiveTab('budgets')}
          />

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <DashboardView
              budgetStatus={budgetStatus}
              transactions={transactions}
              categories={categories}
              currency={currency}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
              onOpenEditModal={(tx) => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              currency={currency}
              currentMonth={currentMonth}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
              onOpenEditModal={(tx) => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onRefreshData={refreshAppData}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgetStatus={budgetStatus}
              categories={categories}
              currency={currency}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              onSaveCategoryBudget={handleSaveCategoryBudget}
              onUpdateAlertThreshold={handleUpdateAlertThreshold}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView currentMonth={currentMonth} currency={currency} />
          )}

          {activeTab === 'personas' && (
            <PersonasView
              categories={categories}
              currency={currency}
              onRefreshData={refreshAppData}
            />
          )}

          {activeTab === 'security' && <SecurityDeploymentView />}
        </main>
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
        currency={currency}
      />

      {/* Budget Limit Setup Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveCategoryBudget}
        categories={categories}
        budgetStatuses={budgetStatus?.categoryStatuses || []}
        currency={currency}
      />

      {/* Toast Alert / Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-800'
              : toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-900 text-white border-emerald-800'
          }`}
        >
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
