import React, { useState, useEffect } from 'react';
import { Category, BudgetStatusItem } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { X, Target, CheckCircle2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryId: string, limitAmount: number) => Promise<void>;
  categories: Category[];
  budgetStatuses: BudgetStatusItem[];
  currency: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  budgetStatuses,
  currency,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [selectedCatId, setSelectedCatId] = useState(expenseCategories[0]?.id || '');
  const [limitAmount, setLimitAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCatId) {
      const existing = budgetStatuses.find((b) => b.categoryId === selectedCatId);
      setLimitAmount(existing ? String(existing.limitAmount) : '0');
    }
  }, [selectedCatId, budgetStatuses]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = parseFloat(limitAmount);
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid non-negative budget limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(selectedCatId, num);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update budget limit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const currentStatus = budgetStatuses.find((b) => b.categoryId === selectedCatId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Set Monthly Budget</h2>
              <p className="text-xs text-slate-500">Configure spend threshold limit per category</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Category
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {expenseCategories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                const status = budgetStatuses.find((b) => b.categoryId === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20` }}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className="w-3.5 h-3.5"
                        color={isSelected ? '#ffffff' : cat.color}
                      />
                    </div>
                    <div className="truncate">
                      <div className="truncate font-semibold">{cat.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {status ? `${currency}${status.limitAmount}/mo` : 'No budget'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCat && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Currently Spent This Month:</span>
                <span className="font-bold text-slate-900">
                  {currency}{(currentStatus?.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {currentStatus && currentStatus.limitAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Current Usage:</span>
                  <span
                    className={`font-bold ${
                      currentStatus.isOverBudget
                        ? 'text-rose-600'
                        : currentStatus.isNearThreshold
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {currentStatus.percentUsed}% ({currentStatus.remainingAmount >= 0 ? `${currency}${currentStatus.remainingAmount.toFixed(2)} remaining` : `${currency}${Math.abs(currentStatus.remainingAmount).toFixed(2)} over`})
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Monthly Budget Limit ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="10"
                min="0"
                required
                placeholder="e.g. 500"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[100, 250, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLimitAmount(String(preset))}
                  className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  +{currency}{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving Target...' : 'Save Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
