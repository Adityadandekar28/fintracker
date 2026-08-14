import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { OverallBudgetStatus } from '../types';
import {
  ShieldCheck,
  Bell,
  Plus,
  LogOut,
  Calendar,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  Layers,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenQuickAdd: () => void;
  budgetStatus: OverallBudgetStatus | null;
  onNavigateToTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  onOpenQuickAdd,
  budgetStatus,
  onNavigateToTab,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  // Generate month options (current month + 5 previous months)
  const monthOptions = React.useMemo(() => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ val, label });
    }
    return options;
  }, []);

  const activeAlerts = budgetStatus?.categoryStatuses.filter((c) => c.isNearThreshold || c.isOverBudget) || [];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Mobile Brand & Encrypted Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs shadow-indigo-100">
            F
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base">
            FinTrack<span className="text-indigo-600">.</span>
          </span>
        </div>
        
        {/* Month Selector in Header */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.val} value={opt.val}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Actions: Quick Add, Alerts Bell, Persona badge & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-xs shadow-indigo-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Record Expense</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Alerts Bell with Clean Indicator */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlertMenu(!showAlertMenu);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors relative"
            title="Budget Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Alerts Dropdown Menu */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-3 px-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2">
                <span className="text-xs font-bold text-slate-900">Budget Alerts ({activeAlerts.length})</span>
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    onNavigateToTab('budgets');
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 mt-1">
                {activeAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    All categories within budget targets
                  </div>
                ) : (
                  activeAlerts.map((cat) => (
                    <div
                      key={cat.categoryId}
                      onClick={() => {
                        setShowAlertMenu(false);
                        onNavigateToTab('budgets');
                      }}
                      className="py-2.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{cat.categoryName}</span>
                        <span className={cat.isOverBudget ? 'text-rose-600' : 'text-amber-600'}>
                          {cat.percentUsed}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cat.isOverBudget
                          ? `Over budget by ${user?.currency || '$'}${Math.abs(cat.remainingAmount).toFixed(2)}`
                          : `${user?.currency || '$'}${cat.remainingAmount.toFixed(2)} remaining`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section with Border Left */}
        <div className="relative pl-3 border-l border-slate-200">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowAlertMenu(false);
            }}
            className="flex items-center gap-3 rounded-lg hover:bg-slate-50 transition-colors p-1"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || 'Jane Doe'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium capitalize leading-tight">
                {user?.segment || 'User'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 uppercase">
              {user?.name?.charAt(0) || 'J'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md capitalize">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {user?.segment} Profile
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigateToTab('personas');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  Manage Persona & Templates
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigateToTab('security');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Encryption & Deployment Guide
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
