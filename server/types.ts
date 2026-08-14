export type UserSegment = 'student' | 'professional' | 'homemaker' | 'freelancer' | 'business';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  segment: UserSegment;
  currency: string;
  monthlyIncome: number;
  alertThresholdPercent: number; // e.g., 80 for 80%
  emailAlertsEnabled: boolean;
  inAppAlertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
}

export interface EncryptedTransactionRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  type: 'expense' | 'income';
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'upi' | 'crypto' | 'other';
  // Encrypted fields containing amount, title/merchant, notes, tags, receiptInfo
  encryptedPayload: string; 
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedTransaction {
  id: string;
  userId: string;
  date: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  type: 'expense' | 'income';
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'upi' | 'crypto' | 'other';
  amount: number;
  title: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  encrypted: boolean;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearThreshold: boolean; // >= alertThresholdPercent
  paceStatus: 'on_track' | 'warning' | 'critical';
}

export interface OverallBudgetStatus {
  totalBudgetLimit: number;
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  remainingBudget: number;
  overallPercentUsed: number;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  expectedSpendPace: number; // expected percent by current day
  paceDifference: number; // actual % - expected %
  categoryStatuses: BudgetStatus[];
  activeAlertsCount: number;
}
