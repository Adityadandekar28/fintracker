import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Category, PersonaConfig, UserSegment } from '../types';
import { api } from '../services/api';
import { CategoryIcon } from './CategoryIcon';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  User as UserIcon,
  HelpCircle,
  GraduationCap,
  Briefcase,
  Home,
  Laptop,
  Building,
  RotateCcw,
} from 'lucide-react';

interface PersonasViewProps {
  categories: Category[];
  currency: string;
  onRefreshData: () => Promise<void>;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  categories,
  currency,
  onRefreshData,
}) => {
  const { user, updateProfile } = useAuth();
  const [personas, setPersonas] = useState<Record<UserSegment, PersonaConfig> | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<UserSegment>(user?.segment || 'professional');
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // User Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currSymbol, setCurrSymbol] = useState(user?.currency || '₹');
  const [income, setIncome] = useState(String(user?.monthlyIncome || 75000));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const data = await api.getPersonas();
        setPersonas(data);
      } catch (err) {
        console.error('Failed to load personas', err);
      }
    }
    loadPersonas();
  }, []);

  const handleApplyPersona = async (segment: UserSegment) => {
    if (!confirm(`Apply the ${personas?.[segment]?.title} template? This will load preset category structures and standard budget limits.`)) {
      return;
    }

    setIsApplying(true);
    setSuccessMsg(null);
    try {
      await api.applyPersonaPreset(segment);
      await updateProfile({ segment });
      setSelectedSegment(segment);
      await onRefreshData();
      setSuccessMsg(`Preset template for "${personas?.[segment]?.title}" applied successfully!`);
    } catch (err) {
      alert('Failed to apply persona template');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
        type: newCatType,
      });
      setNewCatName('');
      await onRefreshData();
      setSuccessMsg(`Created custom category "${newCatName}"`);
    } catch (err) {
      alert('Failed to create category');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await api.deleteCategory(id);
      await onRefreshData();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        currency: currSymbol,
        monthlyIncome: Number(income) || 0,
      });
      await onRefreshData();
      setSuccessMsg('Profile preferences updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const personaIconMap: Record<UserSegment, any> = {
    student: GraduationCap,
    professional: Briefcase,
    homemaker: Home,
    freelancer: Laptop,
    business: Building,
  };

  const sampleIcons = [
    'Tag', 'ShoppingBag', 'Home', 'Utensils', 'Car', 'Zap', 'TrendingUp',
    'Activity', 'BookOpen', 'GraduationCap', 'PartyPopper', 'Laptop', 'Briefcase',
    'HeartPulse', 'DollarSign', 'Coffee', 'Plane', 'Package', 'Building', 'Sparkles'
  ];

  const sampleColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6', '#64748B'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            User Persona Presets & Category Architect
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Select a preset lifestyle persona tailored to your lifecycle stage, or manage customized categories and budget templates.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas &&
          (Object.values(personas) as PersonaConfig[]).map((p) => {
            const Icon = personaIconMap[p.id] || Sparkles;
            const isCurrent = user?.segment === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                  isCurrent
                    ? 'border-indigo-600 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        Active Persona
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">{p.tagline}</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Included Presets ({p.categories.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.categories.slice(0, 5).map((cat) => (
                        <span
                          key={cat.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium"
                        >
                          <CategoryIcon name={cat.icon} className="w-3 h-3" color={cat.color} />
                          {cat.name}
                        </span>
                      ))}
                      {p.categories.length > 5 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-semibold">
                          +{p.categories.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleApplyPersona(p.id)}
                    disabled={isApplying}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {isCurrent ? 'Re-Apply Default Preset' : 'Switch & Load Template'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Two Column Section: Category Manager & User Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Categories List & Add Category (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Category Architecture</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize or remove expense & income categories for your ledger
            </p>
          </div>

          {/* Existing Categories List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${c.color}20` }}
                  >
                    <CategoryIcon name={c.icon} className="w-4 h-4" color={c.color} />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 truncate block">{c.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{c.type}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Add Custom Category
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care, Photography, Solar Energy"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
                >
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </select>
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {sampleIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewCatIcon(ic)}
                    className={`p-1.5 rounded-lg transition-all ${
                      newCatIcon === ic
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryIcon name={ic} className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                {sampleColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewCatColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newCatColor === col ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingCat}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {isCreatingCat ? 'Creating...' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* User Profile & Currency Settings (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Account & Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial currency, base salary/income, and profile details
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <select
                value={currSymbol}
                onChange={(e) => setCurrSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-hidden cursor-pointer"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - United States Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="¥">¥ (JPY/CNY - Yen/Yuan)</option>
                <option value="C$">C$ (CAD - Canadian Dollar)</option>
                <option value="A$">A$ (AUD - Australian Dollar)</option>
                <option value="AED">AED (Emirati Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Monthly Inflow ({currSymbol})
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to compute recommended budget allocations and target savings rates.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">Encrypted Cloud Sync Status:</p>
            <p>• Account ID: {user?.id}</p>
            <p>• Auth: JWT HS256 Token Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};
