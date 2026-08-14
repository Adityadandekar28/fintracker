import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserSegment } from '../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Home,
  Laptop,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, demoLogin, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [segment, setSegment] = useState<UserSegment>('professional');
  const [currency, setCurrency] = useState('₹');
  const [monthlyIncome, setMonthlyIncome] = useState('75000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({
          email,
          pass: password,
          name,
          segment,
          currency,
          monthlyIncome: Number(monthlyIncome) || 0,
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (demoSegment: UserSegment) => {
    setIsSubmitting(true);
    try {
      await demoLogin(demoSegment);
    } catch (err) {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/10">
        {/* Left Col: Brand & Feature Highlights (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30">
                ⚡
              </div>
              <span className="font-extrabold text-xl tracking-tight">FinTracker</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Encrypted Real-Time Financial Intelligence.
            </h1>
            <p className="text-xs text-indigo-200/80 mt-3 leading-relaxed">
              Track multi-category expenses, enforce automated budget thresholds, and gain predictive spending insights—safeguarded with AES-256 cryptographic encryption.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-indigo-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Knowledge AES-256-GCM Storage</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-indigo-100">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automated Pace & Over-Budget Alerts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Persona Presets: Students, Pros & Families</span>
              </div>
            </div>
          </div>

          {/* 1-Click Interactive Demo Logins */}
          <div className="mt-8 pt-6 border-t border-indigo-800/40">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-2">
              ⚡ Instant 1-Click Demo Profiles:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoClick('professional')}
                disabled={isSubmitting}
                className="p-2 bg-indigo-800/50 hover:bg-indigo-700/80 border border-indigo-700/50 rounded-xl text-center transition-all group cursor-pointer"
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1 text-indigo-300 group-hover:text-white" />
                <div className="text-[10px] font-bold text-white">Professional</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('student')}
                disabled={isSubmitting}
                className="p-2 bg-indigo-800/50 hover:bg-indigo-700/80 border border-indigo-700/50 rounded-xl text-center transition-all group cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 mx-auto mb-1 text-indigo-300 group-hover:text-white" />
                <div className="text-[10px] font-bold text-white">Student</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('homemaker')}
                disabled={isSubmitting}
                className="p-2 bg-indigo-800/50 hover:bg-indigo-700/80 border border-indigo-700/50 rounded-xl text-center transition-all group cursor-pointer"
              >
                <Home className="w-4 h-4 mx-auto mb-1 text-indigo-300 group-hover:text-white" />
                <div className="text-[10px] font-bold text-white">Homemaker</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Login / Register Form (7 Cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Toggle Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  clearError();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  clearError();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {isRegister ? 'Set Up Your Financial Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isRegister
                  ? 'Select your lifestyle persona to automatically configure category presets.'
                  : 'Enter your credentials to access your encrypted financial dashboard.'}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Persona Segment Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lifestyle Persona (Auto-configures categories & budgets)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'professional', label: 'Working Pro', icon: Briefcase },
                        { id: 'student', label: 'College Student', icon: GraduationCap },
                        { id: 'homemaker', label: 'Homemaker', icon: Home },
                        { id: 'freelancer', label: 'Freelancer', icon: Laptop },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = segment === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSegment(item.id as any)}
                            className={`p-2 rounded-xl text-left border text-xs font-bold flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden cursor-pointer"
                      >
                        <option value="₹">₹ (INR - Indian Rupee)</option>
                        <option value="$">$ (USD - US Dollar)</option>
                        <option value="€">€ (EUR - Euro)</option>
                        <option value="£">£ (GBP - British Pound)</option>
                        <option value="¥">¥ (JPY - Japanese Yen)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Inflow</label>
                      <input
                        type="number"
                        min="0"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{isRegister ? 'Complete Setup & Open App' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
