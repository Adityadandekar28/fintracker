import React from 'react';
import { OverallBudgetStatus, Transaction, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DashboardViewProps {
  budgetStatus: OverallBudgetStatus | null;
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onOpenAddModal: () => void;
  onOpenEditModal: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  budgetStatus,
  transactions,
  categories,
  currency,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTransaction,
  onNavigateToTab,
}) => {
  const recentTransactions = transactions.slice(0, 6);

  // Prepare chart data for category breakdown
  const categoryData = (budgetStatus?.categoryStatuses || [])
    .filter((c) => c.spentAmount > 0)
    .map((c) => ({
      name: c.categoryName,
      value: c.spentAmount,
      color: c.categoryColor,
      icon: c.categoryIcon,
    }));

  const totalSpent = budgetStatus?.totalSpent || 0;
  const totalIncome = budgetStatus?.totalIncome || 0;
  const netSavings = budgetStatus?.netSavings || 0;
  const totalBudget = budgetStatus?.totalBudgetLimit || 0;
  const percentUsed = budgetStatus?.overallPercentUsed || 0;
  const remainingBudget = budgetStatus?.remainingBudget || 0;
  const expectedPace = budgetStatus?.expectedSpendPace || 0;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Spent */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Total Spent</span>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">
              {formatCurrency(totalSpent, currency)}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
            <span className={`font-semibold ${percentUsed > 100 ? 'text-rose-600' : 'text-slate-600'}`}>
              {percentUsed}% of budget
            </span>
            <span className="text-slate-400">Day {budgetStatus?.dayOfMonth || 1}/{budgetStatus?.daysInMonth || 30}</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Monthly Inflows</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Verified Inflows & Salary
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Net Savings</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-3xl font-bold mt-1 tracking-tight ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings, currency)}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500">
            {totalIncome > 0 ? (
              <span className="font-medium text-slate-700">
                {Math.round((netSavings / totalIncome) * 100)}% net savings rate
              </span>
            ) : (
              'Income vs Expenses'
            )}
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Budget Remaining</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-3xl font-bold mt-1 tracking-tight ${remainingBudget >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(Math.abs(remainingBudget), currency)}
              {remainingBudget < 0 && <span className="text-xs font-bold text-rose-500 ml-1">over</span>}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500">
            Cap: {formatCurrency(totalBudget, currency, false)} • {budgetStatus?.daysRemaining || 0} days left
          </div>
        </div>
      </div>

      {/* Budget Pace & Velocity Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Monthly Budget Health</span>
              {percentUsed > expectedPace + 15 ? (
                <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Spending Faster Than Planned
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  On Track
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current month spending velocity vs. elapsed calendar days ({expectedPace}% of month elapsed)
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('budgets')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Adjust Budget Allocations →
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative pt-2">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 100
                  ? 'bg-rose-500'
                  : percentUsed >= (budgetStatus?.alertThresholdPercent || 80)
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>

          {/* Expected Pace Marker */}
          <div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${Math.min(100, Math.max(0, expectedPace))}%` }}
          >
            <div className="w-1.5 h-5 bg-slate-800 rounded-full shadow-xs"></div>
            <span className="text-[10px] font-semibold text-slate-600 mt-0.5 whitespace-nowrap">
              Day {budgetStatus?.dayOfMonth} ({expectedPace}%)
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 font-medium mt-4">
            <span>0%</span>
            <span>Alert Threshold ({budgetStatus?.alertThresholdPercent || 80}%)</span>
            <span>100% ({formatCurrency(totalBudget, currency, false)})</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Category Breakdown Donut + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Spending by Category */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Spending Breakdown</h3>
              <button
                onClick={() => onNavigateToTab('analytics')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Analytics
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time categorized expense distribution
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No expenses recorded yet for this period. Click Record Expense above.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), currency), 'Amount']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-50">
                {categoryData.map((cat) => {
                  const pct = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium text-slate-700 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 font-normal">{pct}%</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(cat.value, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Recent Transactions with clean minimalist list items */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('transactions')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All ({transactions.length}) →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Encrypted entries stored with AES-256 GCM authentication
            </p>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No transactions recorded yet.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onOpenEditModal(tx)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs">
                      <CategoryIcon
                        name={tx.categoryIcon || 'Tag'}
                        className="w-4 h-4"
                        color={tx.categoryColor || '#6366F1'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.categoryName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Encrypted
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-[11px] text-slate-400">
              Showing {recentTransactions.length} of {transactions.length} total entries
            </span>
            <button
              onClick={onOpenAddModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Quick Add Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
