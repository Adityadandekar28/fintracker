import React from 'react';
import { OverallBudgetStatus } from '../types';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface AlertsBannerProps {
  budgetStatus: OverallBudgetStatus | null;
  currency: string;
  onNavigateToBudgets: () => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  budgetStatus,
  currency,
  onNavigateToBudgets,
}) => {
  if (!budgetStatus || budgetStatus.activeAlertsCount === 0) return null;

  const criticalAlerts = budgetStatus.categoryStatuses.filter((c) => c.isOverBudget);
  const warningAlerts = budgetStatus.categoryStatuses.filter((c) => c.isNearThreshold && !c.isOverBudget);

  return (
    <div className="space-y-2 mb-6">
      {criticalAlerts.map((cat) => (
        <div
          key={`critical_${cat.categoryId}`}
          className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <span>Budget Exceeded</span>
                <span className="text-[11px] font-semibold bg-rose-200/80 px-2 py-0.2 rounded-md">
                  {cat.percentUsed}% Used
                </span>
              </div>
              <p className="text-sm font-semibold mt-0.5">
                Spending in <span className="underline decoration-rose-300 font-bold">{cat.categoryName}</span> ({currency}{cat.spentAmount.toFixed(2)}) has exceeded your {currency}{cat.limitAmount.toFixed(2)} monthly limit by {currency}{Math.abs(cat.remainingAmount).toFixed(2)}.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToBudgets}
            className="self-end sm:self-center shrink-0 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            Adjust Budget
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {warningAlerts.map((cat) => (
        <div
          key={`warning_${cat.categoryId}`}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700">
                Approaching Budget Threshold ({cat.percentUsed}%)
              </div>
              <p className="text-xs text-amber-900 mt-0.5">
                <span className="font-bold">{cat.categoryName}</span> is at {cat.percentUsed}% of budget with {currency}{cat.remainingAmount.toFixed(2)} left for this month.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToBudgets}
            className="self-end sm:self-center shrink-0 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
          >
            Review
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
