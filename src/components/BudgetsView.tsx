import React, { useState } from 'react';
import { OverallBudgetStatus, Category, BudgetStatusItem } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Edit3,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface BudgetsViewProps {
  budgetStatus: OverallBudgetStatus | null;
  categories: Category[];
  currency: string;
  onOpenBudgetModal: () => void;
  onSaveCategoryBudget: (categoryId: string, limitAmount: number) => Promise<void>;
  onUpdateAlertThreshold: (threshold: number) => Promise<void>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgetStatus,
  categories,
  currency,
  onOpenBudgetModal,
  onSaveCategoryBudget,
  onUpdateAlertThreshold,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLimitVal, setEditLimitVal] = useState<string>('');
  const [thresholdVal, setThresholdVal] = useState(budgetStatus?.alertThresholdPercent || 80);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);

  const categoryStatuses = budgetStatus?.categoryStatuses || [];

  const handleStartInlineEdit = (item: BudgetStatusItem) => {
    setEditingCatId(item.categoryId);
    setEditLimitVal(String(item.limitAmount));
  };

  const handleSaveInlineEdit = async (catId: string) => {
    const num = parseFloat(editLimitVal);
    if (!isNaN(num) && num >= 0) {
      await onSaveCategoryBudget(catId, num);
    }
    setEditingCatId(null);
  };

  const handleThresholdChange = async (newVal: number) => {
    setThresholdVal(newVal);
    setIsSavingThreshold(true);
    try {
      await onUpdateAlertThreshold(newVal);
    } finally {
      setIsSavingThreshold(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Alert Settings Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Budget Limits & Automated Alerts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Set custom spending limits for each category. FinTracker monitors velocity and triggers automated warnings when thresholds are approached or exceeded.
          </p>
        </div>

        {/* Global Alert Threshold Configurator */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full md:w-auto shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Alert Trigger Threshold:
            </span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
              {thresholdVal}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={thresholdVal}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>50% (Early Warning)</span>
            <span>80% (Standard)</span>
            <span>95% (Strict)</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Allocated Budget
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(budgetStatus?.totalBudgetLimit || 0, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all expense categories</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Spent This Month
          </span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(budgetStatus?.totalSpent || 0, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {budgetStatus?.overallPercentUsed || 0}% of overall budget consumed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Alerts
          </span>
          <div
            className={`text-2xl font-black mt-2 ${
              (budgetStatus?.activeAlertsCount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {budgetStatus?.activeAlertsCount || 0} Categories
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {(budgetStatus?.activeAlertsCount || 0) > 0 ? 'Action or adjustment advised' : 'All categories within target'}
          </p>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryStatuses.map((item) => {
          const isEditing = editingCatId === item.categoryId;

          return (
            <div
              key={item.categoryId}
              className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
                item.isOverBudget
                  ? 'border-rose-300 ring-1 ring-rose-100 bg-rose-50/20'
                  : item.isNearThreshold
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200/80 hover:border-indigo-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${item.categoryColor}18` }}
                  >
                    <CategoryIcon
                      name={item.categoryIcon}
                      className="w-5 h-5"
                      color={item.categoryColor}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.categoryName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.isOverBudget ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.2 rounded-md">
                          <ShieldAlert className="w-3 h-3" />
                          Over Budget ({item.percentUsed}%)
                        </span>
                      ) : item.isNearThreshold ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          Threshold Alert ({item.percentUsed}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          On Track ({item.percentUsed}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Edit Trigger */}
                <div>
                  {!isEditing ? (
                    <button
                      onClick={() => handleStartInlineEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Adjust Limit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={editLimitVal}
                        onChange={(e) => setEditLimitVal(e.target.value)}
                        className="w-24 px-2 py-1 bg-slate-50 border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveInlineEdit(item.categoryId)}
                        className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.isOverBudget
                        ? 'bg-rose-500'
                        : item.isNearThreshold
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                  />
                </div>
              </div>

              {/* Details row */}
              <div className="mt-3 flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
                <div className="text-slate-500">
                  Spent: <strong className="text-slate-900">{formatCurrency(item.spentAmount, currency)}</strong>
                </div>
                <div className="text-slate-500">
                  Limit: <strong className="text-slate-900">{formatCurrency(item.limitAmount, currency)}</strong>
                </div>
                <div className={item.remainingAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {item.remainingAmount >= 0 ? (
                    <span>{formatCurrency(item.remainingAmount, currency)} left</span>
                  ) : (
                    <span>{formatCurrency(Math.abs(item.remainingAmount), currency)} over</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
