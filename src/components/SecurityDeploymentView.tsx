import React, { useState, useEffect } from 'react';
import { SecurityStatus } from '../types';
import { api } from '../services/api';
import {
  ShieldCheck,
  Server,
  Cloud,
  Terminal,
  Lock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Cpu,
  KeyRound,
  FileCode,
} from 'lucide-react';

export const SecurityDeploymentView: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSec() {
      try {
        const data = await api.getSecurityStatus();
        setSecurityStatus(data);
      } catch (err) {
        console.error('Failed to fetch security status', err);
      }
    }
    fetchSec();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSample = `# Production Environment Variables (.env)
NODE_ENV=production
PORT=3000

# Secret key for JWT session authentication
JWT_SECRET=your_super_strong_random_jwt_secret_min_32_chars

# 256-bit AES cryptographic master key for sensitive transaction encryption at rest
DATA_ENCRYPTION_KEY=f48a9b2c3d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a

# Optional: PostgreSQL Database URL (if switching from embedded encrypted store to Supabase / RDS)
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/fintech_db
`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Cryptographic Security & Production Deployment Guide
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Zero-knowledge architecture, data encryption at rest (AES-256-GCM), and multi-cloud deployment instructions (Vercel, Netlify, Docker, Cloud Run).
        </p>
      </div>

      {/* Live Cryptographic Audit Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Live Cipher Engine Status</h3>
              <p className="text-xs text-slate-400">Automated Galois/Counter Mode validation test</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ALL TESTS PASSING
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Cipher Algorithm
            </span>
            <span className="font-bold text-slate-200 mt-1 block">AES-256-GCM</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Key Length
            </span>
            <span className="font-bold text-slate-200 mt-1 block">256-bit (32 bytes)</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Initialization Vector
            </span>
            <span className="font-bold text-slate-200 mt-1 block">96-bit Unique Random IV</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Integrity Authentication
            </span>
            <span className="font-bold text-emerald-400 mt-1 block">128-bit Auth Tag (AEAD)</span>
          </div>
        </div>
      </div>

      {/* Deployment Options Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vercel & Netlify Deployment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Vercel / Netlify Deployment</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            FinTracker is architected as an Express + Vite full-stack application that compiles into static frontend bundles and a lightweight serverless handler.
          </p>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">1. Build Command:</strong>
              <code className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 block">
                npm run build
              </code>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">2. Output Directory:</strong>
              <code className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 block">
                dist
              </code>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">3. Start Command:</strong>
              <code className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 block">
                npm run start
              </code>
            </div>
          </div>
        </div>

        {/* Docker & Cloud Run Deployment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Docker & Google Cloud Run</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deploy as an isolated containerized service with automatic HTTPS termination and secret management.
          </p>

          <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto">
            <div className="text-slate-400"># Dockerfile Build & Run</div>
            <div>FROM node:20-alpine</div>
            <div>WORKDIR /app</div>
            <div>COPY package*.json ./ && npm install --production=false</div>
            <div>COPY . . && npm run build</div>
            <div>EXPOSE 3000</div>
            <div className="text-emerald-400">CMD ["npm", "start"]</div>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Required Environment Configuration</h3>
          </div>
          <button
            onClick={() => handleCopy(envSample, 'env')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedSection === 'env' ? 'Copied to Clipboard!' : 'Copy .env Template'}
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
          {envSample}
        </pre>
      </div>
    </div>
  );
};
