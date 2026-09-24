import { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles, TrendingUp, DollarSign, Award, Clock, Star, Building2, BarChart3, ArrowUpRight } from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSKEY = 'roi2026';

const mockPortfolios = [
  { id: 'PF-101', name: 'Kyoto Sanctuary Boutique (12 keys)', capex: '$4,200,000', adr: '$850', occ: '84%', netYield: '18.4%', status: 'underwritten' },
  { id: 'PF-102', name: 'Napa Valley Cellar Suites (8 keys)', capex: '$6,500,000', adr: '$1,200', occ: '78%', netYield: '21.2%', status: 'capital_secured' },
  { id: 'PF-103', name: 'Big Sur Coastal Pavilions (16 keys)', capex: '$9,800,000', adr: '$1,450', occ: '88%', netYield: '24.6%', status: 'due_diligence' },
  { id: 'PF-104', name: 'Joshua Tree Eco-Atelier (6 keys)', capex: '$1,800,000', adr: '$620', occ: '72%', netYield: '16.8%', status: 'term_sheet' },
];

const mockStressScenarios = [
  { name: 'Base Pro-Forma', occ: '80%', adr: '$1,000', irr: '22.4%', payback: '4.2 Years', rating: 'Target' },
  { name: 'Bear Shock (-25% Occupancy)', occ: '55%', adr: '$800', irr: '13.1%', payback: '6.8 Years', rating: 'Resilient' },
  { name: 'Bull Compression (+15% ADR)', occ: '92%', adr: '$1,250', irr: '31.8%', payback: '2.9 Years', rating: 'Outperform' },
];

const metrics = [
  { label: 'Underwritten Pipeline', value: '$22,300,000', icon: DollarSign, color: 'text-amber-400' },
  { label: 'Blended Net Yield', value: '20.25% IRR', icon: TrendingUp, color: 'text-emerald-400' },
  { label: 'Total Underwritten Keys', value: '42 Suites', icon: Building2, color: 'text-blue-400' },
  { label: 'Institutional Grade', value: 'Micro-PE Accredited', icon: Award, color: 'text-yellow-400' },
];

export default function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolios' | 'stress' | 'supabase'>('overview');
  const [passkey, setPasskey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAuthenticated(false);
      setPasskey('');
      setAuthError('');
      setActiveTab('overview');
    }
  }, [isOpen]);

  const handleAuth = () => {
    if (passkey === PASSKEY) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid passkey. Click the auto-fill button below.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#09090b] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-sm font-bold">
              ROI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">HOSPITALITY ROI ENGINE OS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">v1.0.0 VIP</span>
              </div>
              <p className="text-xs text-zinc-400">Institutional Pro-Forma &amp; RevPASH Capital Allocator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {!authenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-medium text-xl text-white">Institutional Terminal Authentication</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your administrative key to view asset purchase agreements, CapEx pro-formas, and LP underwriting ledgers.
              </p>
            </div>

            <div className="w-full space-y-3">
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter passkey (e.g. roi2026)"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-sm focus:outline-none focus:border-amber-400 placeholder-zinc-600"
              />
              {authError && <p className="text-xs text-rose-400 font-mono">{authError}</p>}
              <button
                onClick={handleAuth}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-all cursor-pointer"
              >
                Authenticate Terminal Gate
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasskey(PASSKEY);
                  setAuthenticated(true);
                  setAuthError('');
                }}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                [ AUTO-FILL DEMO PASS: roi2026 ]
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-zinc-800 bg-[#0c0c0e]/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-zinc-800/80 text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Capital Telemetry
              </button>
              <button
                onClick={() => setActiveTab('portfolios')}
                className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'portfolios'
                    ? 'bg-zinc-800/80 text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Asset Pipeline (4)
              </button>
              <button
                onClick={() => setActiveTab('stress')}
                className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'stress'
                    ? 'bg-zinc-800/80 text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Stress Modeling (3)
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-zinc-800/80 text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Supabase Engine
              </button>
            </div>

            {/* Tab Panels */}
            <div className="p-6 overflow-y-auto space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{m.label}</span>
                          <m.icon className={`w-4 h-4 ${m.color}`} />
                        </div>
                        <p className="text-xl font-bold font-mono text-white">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sanctuary Live Status Card */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/20 via-zinc-900 to-zinc-900 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-mono text-xs text-amber-400 font-semibold uppercase tracking-wider">UNDERWRITING ENGINE: VERIFIED</span>
                      </div>
                      <p className="text-xs text-zinc-300">All DCF cash flows discounted at 8.5% WACC. DSCR coverage ratio maintains a 1.82x margin.</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300">
                      DSCR: 1.82x (Secure)
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'portfolios' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Hospitality Asset Pipeline</h4>
                    <span className="text-xs text-amber-400 font-mono">4 Underwritten Deals</span>
                  </div>
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Asset</th>
                          <th className="p-3">CapEx</th>
                          <th className="p-3">ADR / Occ</th>
                          <th className="p-3">Net IRR</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                        {mockPortfolios.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-900/40">
                            <td className="p-3 text-amber-400">{p.id}</td>
                            <td className="p-3 font-semibold text-white">{p.name}</td>
                            <td className="p-3 text-zinc-400">{p.capex}</td>
                            <td className="p-3">{p.adr} ({p.occ})</td>
                            <td className="p-3 font-bold text-emerald-400">{p.netYield}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                p.status === 'capital_secured' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                p.status === 'underwritten' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'stress' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Multi-Variable Stress Testing</h4>
                    <span className="text-xs text-amber-400 font-mono">3 Scenarios</span>
                  </div>
                  <div className="space-y-3">
                    {mockStressScenarios.map((s, i) => (
                      <div key={i} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-white">{s.name}</p>
                          <p className="text-xs text-amber-400/90 font-mono">Occ: {s.occ} &bull; ADR: {s.adr}</p>
                          <p className="text-[11px] text-zinc-400">Payback: {s.payback}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold font-mono text-emerald-400">{s.irr}</span>
                          <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                            {s.rating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'supabase' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">PostgreSQL Schema &amp; Financial Ledgers</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Integrated tables for underwritten pro-formas, scenario variables, and private equity deal rooms.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                        <p className="text-[10px] font-mono text-zinc-500">TABLE 1</p>
                        <p className="text-xs font-mono font-bold text-white">proforma_projects</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                        <p className="text-[10px] font-mono text-zinc-500">TABLE 2</p>
                        <p className="text-xs font-mono font-bold text-white">underwriting_scenarios</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                        <p className="text-[10px] font-mono text-zinc-500">TABLE 3</p>
                        <p className="text-xs font-mono font-bold text-white">lp_inquiries</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
