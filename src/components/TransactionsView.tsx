import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
  FileJson,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../services/api';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  currentMonth: string;
  onOpenAddModal: () => void;
  onOpenEditModal: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  currency,
  currentMonth,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTransaction,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = tx.title.toLowerCase().includes(q);
          const notesMatch = tx.notes?.toLowerCase().includes(q);
          const tagMatch = tx.tags?.some((t) => t.toLowerCase().includes(q));
          const catMatch = tx.categoryName?.toLowerCase().includes(q);
          if (!titleMatch && !notesMatch && !tagMatch && !catMatch) return false;
        }

        // Category
        if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
          return false;
        }

        // Type
        if (selectedType !== 'all' && tx.type !== selectedType) {
          return false;
        }

        // Payment
        if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchQuery, selectedCategory, selectedType, selectedPayment, sortBy]);

  // Aggregate sums for current filter view
  const summaryTotals = useMemo(() => {
    let expenseSum = 0;
    let incomeSum = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') expenseSum += t.amount;
      if (t.type === 'income') incomeSum += t.amount;
    });
    return {
      expenseSum,
      incomeSum,
      net: incomeSum - expenseSum,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      await api.downloadExport(format, currentMonth);
    } catch (err) {
      alert('Failed to download export file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteTransaction(id);
      setShowDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedPayment('all');
    setSortBy('date_desc');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || selectedPayment !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AES-256 Encrypted Store
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, audit, and export your encrypted financial records
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Export Dropdown / Buttons */}
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            CSV Export
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
            title="Download JSON Encrypted Backup"
          >
            <FileJson className="w-4 h-4 text-indigo-600" />
            JSON Export
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant, note, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all cursor-pointer"
            >
              <option value="all">All Types (Income & Expenses)</option>
              <option value="expense">💸 Expenses Only</option>
              <option value="income">💰 Income Only</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all cursor-pointer"
            >
              <option value="all">All Payment Modes</option>
              <option value="upi">⚡ UPI / GPay / PhonePe</option>
              <option value="credit_card">💳 Credit Card</option>
              <option value="debit_card">🏧 Debit Card</option>
              <option value="bank_transfer">🏦 NetBanking / NEFT</option>
              <option value="cash">💵 Cash</option>
              <option value="crypto">🪙 Digital Assets</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Sorting Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{filteredTransactions.length}</strong> transactions
            </span>
            <span>•</span>
            <span>
              Expenses: <strong className="text-rose-600">{formatCurrency(summaryTotals.expenseSum, currency)}</strong>
            </span>
            <span>•</span>
            <span>
              Incomes: <strong className="text-emerald-600">{formatCurrency(summaryTotals.incomeSum, currency)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No transactions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, filter criteria, or record a new expense.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant / Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Tags & Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{tx.title}</span>
                        {tx.isRecurring && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${tx.categoryColor || '#6366F1'}15` }}
                        >
                          <CategoryIcon
                            name={tx.categoryIcon || 'Tag'}
                            className="w-3.5 h-3.5"
                            color={tx.categoryColor || '#6366F1'}
                          />
                        </div>
                        <span className="font-semibold text-slate-800">{tx.categoryName}</span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 capitalize">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>

                    {/* Tags & Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                      <div className="flex flex-wrap gap-1 items-center">
                        {tx.tags?.map((t) => (
                          <span
                            key={t}
                            className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                        {tx.notes && (
                          <span className="text-[11px] text-slate-400 italic truncate block">
                            {tx.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenEditModal(tx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Transaction?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              This encrypted transaction will be permanently removed from the ledger and budget calculations.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
