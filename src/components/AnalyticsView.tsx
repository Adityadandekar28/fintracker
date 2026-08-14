import React, { useState, useEffect } from 'react';
import { MonthlyReport } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Printer,
  Calendar,
  CreditCard,
  AlertCircle,
  Lightbulb,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';

interface AnalyticsViewProps {
  currentMonth: string;
  currency: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentMonth, currency }) => {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      setIsLoading(true);
      try {
        const data = await api.getMonthlyReport(currentMonth);
        if (isMounted) setReport(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to generate report');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadReport();
    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-600">Computing Encrypted Financial Analytics...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="text-sm font-bold">Failed to load analytics: {error}</p>
      </div>
    );
  }

  // Budget vs Actual chart data
  const budgetVsActualData = (report.summary.categoryStatuses || []).map((cat) => ({
    name: cat.categoryName,
    Budget: cat.limitAmount,
    Spent: cat.spentAmount,
    color: cat.categoryColor,
  }));

  // Payment methods chart data
  const paymentData: Array<{ name: string; value: number }> = Object.entries(report.paymentMethodBreakdown || {}).map(([key, val]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value: Number(val),
  }));

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Print Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Monthly Spending Analytics & Trend Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Period: <span className="font-semibold text-slate-700">{report.month}</span> • Month-over-month shifts & predictive velocity
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print / PDF Export
        </button>
      </div>

      {/* AI / Smart Financial Insights */}
      {report.insights && report.insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                insight.type === 'positive'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : insight.type === 'warning'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {insight.type === 'positive' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                {insight.type !== 'positive' && insight.type !== 'warning' && <Lightbulb className="w-4 h-4 text-indigo-600" />}
                <h4 className="text-xs font-bold">{insight.title}</h4>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Executive Key Figures Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month-over-Month Shift */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            MoM Spending Shift
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-2xl font-black ${
                report.spendDiffPercent > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {report.spendDiffPercent > 0 ? '+' : ''}{report.spendDiffPercent}%
            </span>
            {report.spendDiffPercent > 0 ? (
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            vs. previous month ({formatCurrency(report.prevMonthSummary.totalSpent, currency)})
          </p>
        </div>

        {/* Daily Average Burn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Average Daily Burn
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(report.analytics.averageDailyBurn, currency)}/day
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Over {report.analytics.daysElapsed} days elapsed
          </p>
        </div>

        {/* Projected Month-End Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Projected Month-End
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(report.analytics.projectedMonthEndSpend, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Based on current daily pace
          </p>
        </div>

        {/* Inflow vs Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Net Cashflow Margin
          </span>
          <div
            className={`text-2xl font-black mt-2 ${
              report.summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {report.summary.netSavings >= 0 ? '+' : ''}{formatCurrency(report.summary.netSavings, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total inflows: {formatCurrency(report.summary.totalIncome, currency)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Budget vs Actual Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Budget Target vs. Actual Spending by Category
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Compare allocated thresholds against actual encrypted debits
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsActualData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="Budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Payment Method Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              UPI / Card / NetBanking / Cash channel distribution
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {paymentData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Spent']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {paymentData.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate text-slate-700 font-medium">{p.name}</span>
                <span className="ml-auto font-bold text-slate-900">{formatCurrency(p.value, currency, false)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cumulative Velocity Curve */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Cumulative Monthly Spending Curve & Daily Velocity
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Day-by-day burn line tracking cumulative financial outflows
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={report.dailyBreakdown}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val), currency), 'Cumulative']}
                labelFormatter={(label) => `Day ${label}`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeExpense"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 3, fill: '#6366F1' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Single Largest Purchases */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Top 5 Largest Purchases This Month
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Significant single outlays requiring monitoring
        </p>

        <div className="divide-y divide-slate-100">
          {(report.topExpenses || []).map((tx, idx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{tx.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tx.date} • {tx.categoryName} • {tx.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
