export type UserSegment = 'student' | 'professional' | 'homemaker' | 'freelancer' | 'business';

export interface User {
  id: string;
  email: string;
  name: string;
  segment: UserSegment;
  currency: string;
  monthlyIncome: number;
  alertThresholdPercent: number;
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

export interface Transaction {
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
  encrypted?: boolean;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  categoryId: string;
  month: string;
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatusItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
  paceStatus: 'on_track' | 'warning' | 'critical';
}

export interface OverallBudgetStatus {
  month: string;
  totalBudgetLimit: number;
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  remainingBudget: number;
  overallPercentUsed: number;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  expectedSpendPace: number;
  paceDifference: number;
  categoryStatuses: BudgetStatusItem[];
  activeAlertsCount: number;
  alertThresholdPercent: number;
}

export interface MonthlyReport {
  month: string;
  currency: string;
  summary: OverallBudgetStatus;
  prevMonthSummary: {
    month: string;
    totalSpent: number;
    totalIncome: number;
    netSavings: number;
  };
  spendDiffPercent: number;
  dailyBreakdown: Array<{
    day: number;
    date: string;
    expense: number;
    income: number;
    cumulativeExpense: number;
  }>;
  paymentMethodBreakdown: Record<string, number>;
  topExpenses: Transaction[];
  analytics: {
    averageDailyBurn: number;
    projectedMonthEndSpend: number;
    daysElapsed: number;
    daysInMonth: number;
  };
  insights: Array<{
    type: 'positive' | 'warning' | 'neutral' | 'info';
    title: string;
    message: string;
  }>;
}

export interface PersonaConfig {
  id: UserSegment;
  title: string;
  tagline: string;
  description: string;
  suggestedIncome: number;
  currency: string;
  categories: Array<{
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
    defaultBudget: number;
  }>;
}

export interface SecurityStatus {
  status: string;
  algorithm: string;
  keyLengthBits: number;
  testPassed: boolean;
  sampleIvLength: number;
  storageType: string;
  jwtAlgorithm: string;
  tlsEnforced: boolean;
  timestamp: string;
}
