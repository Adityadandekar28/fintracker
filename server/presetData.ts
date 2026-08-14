import { UserSegment } from './types.js';

export interface CategoryTemplate {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  defaultBudget: number; // default monthly budget allocation
}

export interface PersonaConfig {
  id: UserSegment;
  title: string;
  tagline: string;
  description: string;
  suggestedIncome: number;
  currency: string;
  categories: CategoryTemplate[];
}

export const PERSONA_CONFIGS: Record<UserSegment, PersonaConfig> = {
  student: {
    id: 'student',
    title: 'College / University Student',
    tagline: 'Campus living, books, tuition & smart budget discipline',
    description: 'Tailored for students managing allowances, campus meal plans, textbooks, shared housing, and budget-friendly entertainment.',
    suggestedIncome: 25000,
    currency: '₹',
    categories: [
      { name: 'Tuition & Semester Fees', icon: 'GraduationCap', color: '#6366F1', type: 'expense', defaultBudget: 7500 },
      { name: 'Books & Course Materials', icon: 'BookOpen', color: '#8B5CF6', type: 'expense', defaultBudget: 2500 },
      { name: 'Hostel / PG & Accommodation', icon: 'Home', color: '#3B82F6', type: 'expense', defaultBudget: 8000 },
      { name: 'Campus Canteen & Dining', icon: 'Utensils', color: '#EC4899', type: 'expense', defaultBudget: 4500 },
      { name: 'Metro & Local Commute', icon: 'Bus', color: '#10B981', type: 'expense', defaultBudget: 1500 },
      { name: 'Weekend Outings & Friends', icon: 'PartyPopper', color: '#F59E0B', type: 'expense', defaultBudget: 2000 },
      { name: 'Mobile Data & OTT Subscriptions', icon: 'Laptop', color: '#14B8A6', type: 'expense', defaultBudget: 800 },
      { name: 'Internship Stipend / Part-Time', icon: 'Briefcase', color: '#22C55E', type: 'income', defaultBudget: 0 },
      { name: 'Scholarship / Parent Allowance', icon: 'Award', color: '#10B981', type: 'income', defaultBudget: 0 },
    ],
  },
  professional: {
    id: 'professional',
    title: 'Working Professional',
    tagline: 'Career growth, wealth building, housing & lifestyle balance',
    description: 'Optimized for salaried corporate professionals with mortgages/rent, investments, dining out, commute, and wellness priorities.',
    suggestedIncome: 120000,
    currency: '₹',
    categories: [
      { name: 'Housing Rent / Home Loan EMI', icon: 'Home', color: '#3B82F6', type: 'expense', defaultBudget: 35000 },
      { name: 'Groceries & Quick Commerce (Blinkit/Zepto)', icon: 'ShoppingBag', color: '#10B981', type: 'expense', defaultBudget: 14000 },
      { name: 'Utilities, Electricity & High-Speed Wi-Fi', icon: 'Zap', color: '#F59E0B', type: 'expense', defaultBudget: 4500 },
      { name: 'Dining Out, Cafes & Swiggy/Zomato', icon: 'Utensils', color: '#EC4899', type: 'expense', defaultBudget: 10000 },
      { name: 'Fuel, Car EMI & Metro/Cabs', icon: 'Car', color: '#6366F1', type: 'expense', defaultBudget: 7500 },
      { name: 'Mutual Funds SIP & Stock Portfolio', icon: 'TrendingUp', color: '#059669', type: 'expense', defaultBudget: 25000 },
      { name: 'Gym, Cult.fit & Health Wellness', icon: 'Activity', color: '#06B6D4', type: 'expense', defaultBudget: 3500 },
      { name: 'Shopping, Apparel & Gadgets', icon: 'Shirt', color: '#8B5CF6', type: 'expense', defaultBudget: 6000 },
      { name: 'Primary Corporate Salary', icon: 'Wallet', color: '#22C55E', type: 'income', defaultBudget: 0 },
      { name: 'Performance Bonus & Dividends', icon: 'Coins', color: '#10B981', type: 'income', defaultBudget: 0 },
    ],
  },
  homemaker: {
    id: 'homemaker',
    title: 'Homemaker & Family Manager',
    tagline: 'Family household management, groceries, childcare & home savings',
    description: 'Built for family managers balancing supermarket supplies, household maintenance, children’s schooling, medical care, and family activities.',
    suggestedIncome: 75000,
    currency: '₹',
    categories: [
      { name: 'Supermarket & Bulk Monthly Groceries', icon: 'ShoppingBasket', color: '#10B981', type: 'expense', defaultBudget: 22000 },
      { name: 'Home Maintenance, Society & Repairs', icon: 'Wrench', color: '#64748B', type: 'expense', defaultBudget: 6000 },
      { name: 'Children School Fees & Tuition', icon: 'GraduationCap', color: '#F43F5E', type: 'expense', defaultBudget: 18000 },
      { name: 'Family Healthcare & Medical Pharmacy', icon: 'HeartPulse', color: '#EF4444', type: 'expense', defaultBudget: 5500 },
      { name: 'Electricity, LPG Gas & Water', icon: 'Flame', color: '#F59E0B', type: 'expense', defaultBudget: 6000 },
      { name: 'Family Dining & Weekend Outings', icon: 'Palmtree', color: '#8B5CF6', type: 'expense', defaultBudget: 6500 },
      { name: 'Emergency Family Reserve Fund', icon: 'ShieldCheck', color: '#0D9488', type: 'expense', defaultBudget: 10000 },
      { name: 'Monthly Household Fund Transfer', icon: 'DollarSign', color: '#22C55E', type: 'income', defaultBudget: 0 },
      { name: 'Boutique Business / Home Crafts', icon: 'Sparkles', color: '#EC4899', type: 'income', defaultBudget: 0 },
    ],
  },
  freelancer: {
    id: 'freelancer',
    title: 'Freelancer & Digital Consultant',
    tagline: 'Client billings, tax reserves, SaaS tools & flexible travel',
    description: 'Designed for independent contractors, consultants, and remote creators managing irregular cash flow, client expenses, and taxes.',
    suggestedIncome: 95000,
    currency: '₹',
    categories: [
      { name: 'Software, Cloud, AI & SaaS Tools', icon: 'Cpu', color: '#6366F1', type: 'expense', defaultBudget: 5000 },
      { name: 'Co-working Desk & Cafe Workspaces', icon: 'Coffee', color: '#F59E0B', type: 'expense', defaultBudget: 6500 },
      { name: 'Hardware, Laptop & Electronics', icon: 'Monitor', color: '#3B82F6', type: 'expense', defaultBudget: 8000 },
      { name: 'Advance Tax & GST Reserve', icon: 'FileText', color: '#DC2626', type: 'expense', defaultBudget: 20000 },
      { name: 'Travel, Stays & Client Meetings', icon: 'Plane', color: '#06B6D4', type: 'expense', defaultBudget: 15000 },
      { name: 'Personal & Health Insurance (Mediclaim)', icon: 'Shield', color: '#10B981', type: 'expense', defaultBudget: 6000 },
      { name: 'Client Invoices & Retainer Fees', icon: 'Briefcase', color: '#22C55E', type: 'income', defaultBudget: 0 },
      { name: 'Digital Asset & Template Sales', icon: 'Layers', color: '#8B5CF6', type: 'income', defaultBudget: 0 },
    ],
  },
  business: {
    id: 'business',
    title: 'Small Business & Startup Owner',
    tagline: 'Operational overhead, payroll, inventory, marketing & compliance',
    description: 'Formulated for store owners, agencies, and founders tracking gross revenues, inventory procurement, commercial space, and ads.',
    suggestedIncome: 350000,
    currency: '₹',
    categories: [
      { name: 'Inventory & Raw Material Procurement', icon: 'Package', color: '#3B82F6', type: 'expense', defaultBudget: 90000 },
      { name: 'Commercial Office & Warehouse Rent', icon: 'Building', color: '#6366F1', type: 'expense', defaultBudget: 55000 },
      { name: 'Digital Marketing & Google/Meta Ads', icon: 'Megaphone', color: '#EC4899', type: 'expense', defaultBudget: 35000 },
      { name: 'Contractors & Team Payroll Support', icon: 'Users', color: '#10B981', type: 'expense', defaultBudget: 70000 },
      { name: 'Shipping, Courier & Logistics', icon: 'Truck', color: '#F59E0B', type: 'expense', defaultBudget: 18000 },
      { name: 'CA, Legal Audits & Trade Licenses', icon: 'Scale', color: '#64748B', type: 'expense', defaultBudget: 12000 },
      { name: 'Client B2B Invoices Cleared', icon: 'Receipt', color: '#22C55E', type: 'income', defaultBudget: 0 },
      { name: 'Online Store & POS Sales Collections', icon: 'CreditCard', color: '#06B6D4', type: 'income', defaultBudget: 0 },
    ],
  },
};
