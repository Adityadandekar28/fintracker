import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Target,
  BarChart3,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount,
}) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'budgets',
      label: 'Budgets & Alerts',
      icon: Target,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount} alerts` : null,
      badgeType: activeAlertsCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'personas',
      label: 'Personas & Presets',
      icon: Layers,
      badge: null,
    },
    {
      id: 'security',
      label: 'Security & Deploy',
      icon: ShieldCheck,
      badge: 'PROD',
      badgeType: 'success',
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 p-4 lg:p-5 flex lg:flex-col justify-between shrink-0 overflow-x-auto lg:overflow-visible">
      <div className="flex lg:flex-col gap-1 w-full">
        {/* Brand header in sidebar for desktop */}
        <div className="hidden lg:flex items-center gap-2.5 pb-5 mb-2 border-b border-slate-100 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-base shadow-xs shadow-indigo-100">
            F
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              FinTrack<span className="text-indigo-600">.</span>
            </span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5 hidden lg:block">
          Navigation
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-indigo-200/70 text-indigo-800'
                      : item.badgeType === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : item.badgeType === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clean Minimalist Dark Persona Card in Sidebar */}
      <div className="hidden lg:block pt-4 border-t border-slate-100 mt-auto">
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Active Persona
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              AES-256
            </span>
          </div>
          <div className="text-sm font-semibold capitalize">
            {user?.segment ? `${user.segment} Plan` : 'Professional Plan'}
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Encrypted Ledger</span>
            <span>Cloud Sync OK</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

