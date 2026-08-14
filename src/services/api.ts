import { User, Category, Transaction, OverallBudgetStatus, MonthlyReport, SecurityStatus, PersonaConfig, UserSegment } from '../types';

const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('expense_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('expense_token', token);
  } else {
    localStorage.removeItem('expense_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear token and trigger event
    setAuthToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    const errorData = await response.json().catch(() => ({ error: 'Unauthorized session' }));
    throw new Error(errorData.error || 'Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unexpected server error occurred' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    segment: UserSegment;
    currency: string;
    monthlyIncome: number;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(res.token);
    return res;
  },

  async demoLogin(segment: UserSegment = 'professional'): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ segment }),
    });
    setAuthToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Personas
  async getPersonas(): Promise<Record<UserSegment, PersonaConfig>> {
    return request<Record<UserSegment, PersonaConfig>>('/personas');
  },

  async applyPersonaPreset(segment: UserSegment, month?: string): Promise<{ categories: Category[] }> {
    return request<{ categories: Category[] }>('/categories/reset-persona', {
      method: 'POST',
      body: JSON.stringify({ segment, month }),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  },

  async createCategory(category: { name: string; icon: string; color: string; type: 'expense' | 'income' }): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    return request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Transactions
  async getTransactions(params?: {
    month?: string;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    type?: 'expense' | 'income';
    paymentMethod?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<{ transactions: Transaction[]; totalCount: number; encryptedAtRest: boolean }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{ transactions: Transaction[]; totalCount: number; encryptedAtRest: boolean }>(`/transactions${queryString}`);
  },

  async createTransaction(tx: {
    date: string;
    categoryId: string;
    type: 'expense' | 'income';
    paymentMethod: Transaction['paymentMethod'];
    amount: number;
    title: string;
    notes?: string;
    tags?: string[];
    receiptUrl?: string;
    isRecurring?: boolean;
  }): Promise<{ transaction: Transaction; alert: { triggered: boolean; message: string } | null }> {
    return request<{ transaction: Transaction; alert: { triggered: boolean; message: string } | null }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  },

  async updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction> {
    return request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tx),
    });
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Budgets
  async getBudgetStatus(month?: string): Promise<OverallBudgetStatus> {
    const query = month ? `?month=${month}` : '';
    return request<OverallBudgetStatus>(`/budgets/status${query}`);
  },

  async upsertBudget(categoryId: string, limitAmount: number, month?: string): Promise<any> {
    return request('/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId, limitAmount, month }),
    });
  },

  // Reports
  async getMonthlyReport(month?: string): Promise<MonthlyReport> {
    const query = month ? `?month=${month}` : '';
    return request<MonthlyReport>(`/reports/monthly${query}`);
  },

  // Security Status
  async getSecurityStatus(): Promise<SecurityStatus> {
    return request<SecurityStatus>('/security/status');
  },

  // Export Download URL
  getExportUrl(format: 'csv' | 'json', month?: string): string {
    const token = getAuthToken();
    const query = new URLSearchParams({ format });
    if (month) query.append('month', month);
    if (token) query.append('token', token); // For browser direct download if needed
    return `${API_BASE}/export?${query.toString()}`;
  },

  async downloadExport(format: 'csv' | 'json', month?: string): Promise<void> {
    const token = getAuthToken();
    const query = new URLSearchParams({ format });
    if (month) query.append('month', month);

    const res = await fetch(`${API_BASE}/export?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Export download failed');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_tracker_${month || 'all'}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
