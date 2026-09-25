import React from 'react';
import { ShieldAlert, TrendingDown, RefreshCcw, ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { useGlobalState } from '../context/GlobalStateContext';

export default function StressTestToggle({ onToggle }: { onToggle?: (enabled: boolean) => void }) {
  const { 
    stressTestMode: enabled, 
    inputs,
    metrics,
    baselineMetrics,
    taxExitMetrics
  } = useGlobalState();

  const baseAdr = inputs.adr;
  const baseOpex = inputs.opex;

  // Stressed values for instant core operational comparison
  const stressedAdr = Math.round(baseAdr * 0.8);
  const stressedOpex = Math.round(baseOpex * 1.15);

  // Exit proceeds under standard (15% appreciation) vs downside downcycle (5% appreciation)
  const normalExitProceeds = taxExitMetrics?.projectedExitProceeds ?? 0;
  
  const stressedSalePrice = inputs.capex * 1.05;
  const stressedSellingCosts = stressedSalePrice * 0.06;
  const stressedRemainingBasis = taxExitMetrics?.remainingBasis ?? (inputs.capex * 0.8);
  const stressedExitProceeds = Math.max(0, stressedSalePrice - stressedSellingCosts - stressedRemainingBasis);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercent = (val: number) => {
    return (val > 0 ? '+' : '') + Math.round(val) + '%';
  };

  const renderDelta = (normal: number, stressed: number, isLowerBetter: boolean = false) => {
    const diff = stressed - normal;
    if (Math.abs(diff) < 0.1) return <span className="text-neutral-400 text-xs font-semibold tracking-wider">0%</span>;
    const pct = (diff / (normal || 1)) * 100;
    const isWorse = isLowerBetter ? diff > 0 : diff < 0;
    
    return (
      <span className={`inline-flex items-center gap-0.5 text-[9.5px] font-mono font-semibold text-luxury-charcoal`}>
        {isWorse ? <ArrowDownRight className="w-2.5 h-2.5 shrink-0" /> : <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />}
        {formatPercent(pct)}
      </span>
    );
  };

  return (
    <div 
      id="stress-test-toggle-container"
      className={`p-5 rounded-2xl border transition-all duration-300 ${
        enabled 
          ? 'bg-neutral-100 border-luxury-charcoal shadow-xs' 
          : 'bg-white border-luxury-stone hover:border-luxury-clay hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert 
                className={`w-4 h-4 transition-all duration-300 ${
                  enabled ? 'text-luxury-charcoal' : 'text-luxury-earth'
                }`} 
              />
              <span className="font-sans text-xs font-semibold text-luxury-charcoal">
                Stress test mode
              </span>
            </div>
            {enabled && (
              <span className="text-[9px] font-sans bg-luxury-clay text-white px-2.5 py-0.5 rounded-full font-medium tracking-wide border border-luxury-clay select-none">
                Active stress scenario
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-neutral-550 leading-relaxed font-sans font-normal">
            See how your project would perform in a downside scenario. This model simulates a 20% drop in nightly rate and a 15% increase in running costs.
          </p>
        </div>

        {/* Custom iOS-style toggle */}
        <button
          onClick={() => onToggle?.(!enabled)}
          id="stress-test-toggle-button"
          type="button"
          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            enabled ? 'bg-luxury-charcoal' : 'bg-neutral-200'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-4.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Dynamic Analytical comparison table panel showing baseline vs stress deltas */}
      {enabled ? (
        <div className="mt-4.5 pt-4.5 border-t border-luxury-stone space-y-4 animate-in fadeIn duration-250">
          <span className="font-sans text-xs font-semibold font-semibold text-luxury-charcoal block select-none">
            Parameters under stress
          </span>
          
          <div className="overflow-x-auto border border-luxury-stone rounded-xl bg-white/70 overflow-hidden">
            <table className="w-full text-left font-sans text-xs font-semibold border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-luxury-stone text-luxury-charcoal font-medium text-xs font-semibold tracking-wider select-none">
                  <th className="py-2.5 px-3 font-semibold">Financial metric</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Expected plan</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Stress scenario</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-stone/50 text-neutral-750">
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">Gross annual revenue</td>
                  <td className="py-2.5 px-2 text-right text-neutral-500 font-mono">{formatCurrency(baselineMetrics.grossAnnualRevenue)}</td>
                  <td className="py-2.5 px-2 text-right text-luxury-charcoal font-semibold font-mono">{formatCurrency(metrics.grossAnnualRevenue)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {renderDelta(baselineMetrics.grossAnnualRevenue, metrics.grossAnnualRevenue)}
                  </td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">Net annual profit</td>
                  <td className="py-2.5 px-2 text-right text-neutral-500 font-mono">{formatCurrency(baselineMetrics.netAnnualCashflow)}</td>
                  <td className="py-2.5 px-2 text-right text-luxury-charcoal font-semibold font-mono">{formatCurrency(metrics.netAnnualCashflow)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {renderDelta(baselineMetrics.netAnnualCashflow, metrics.netAnnualCashflow)}
                  </td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">Expected payback period</td>
                  <td className="py-2.5 px-2 text-right text-neutral-500 font-mono">
                    {baselineMetrics.paybackPeriod ? `${baselineMetrics.paybackPeriod} years` : 'No payback'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-luxury-charcoal font-semibold font-mono">
                    {metrics.paybackPeriod ? `${metrics.paybackPeriod} years` : 'No payback'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-mono">
                    {(() => {
                      const baseP = baselineMetrics.paybackPeriod;
                      const stressP = metrics.paybackPeriod;
                      if (!baseP) return <span className="text-neutral-400 font-medium font-mono text-[9.5px]">N/A</span>;
                      if (!stressP) return <span className="text-luxury-clay font-bold font-mono text-[9px] tracking-wide">✦ No payback yet</span>;
                      const diff = stressP - baseP;
                      const pct = (diff / baseP) * 100;
                      return (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-mono text-luxury-charcoal font-semibold">
                          <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                          +{Math.round(pct)}%
                        </span>
                      );
                    })()}
                  </td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">5-year property value growth</td>
                  <td className="py-2.5 px-2 text-right text-neutral-500 font-mono">{formatCurrency(normalExitProceeds)}</td>
                  <td className="py-2.5 px-2 text-right text-luxury-charcoal font-semibold font-mono">{formatCurrency(stressedExitProceeds)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {renderDelta(normalExitProceeds, stressedExitProceeds)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analytical downmarket impact insights list */}
          <div className="bg-[#faf9f6]/80 p-3.5 rounded-xl border border-luxury-stone/80 flex items-start gap-2.5 text-[10.5px]">
            <TrendingDown className="w-3.5 h-3.5 text-luxury-earth shrink-0 mt-0.5" />
            <div className="space-y-1 font-sans text-neutral-600 leading-normal font-light">
              <span className="font-sans text-xs font-semibold tracking-wider font-semibold text-luxury-charcoal block mb-0.5">Note on resilience</span>
              <p className="text-[11.5px] text-neutral-500 leading-relaxed font-light">
                A drop in nightly rates increases the time required to break even. It is always wise to keep cash reserves for unexpected slow seasons.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3.5 text-xs font-semibold tracking-wider font-sans text-neutral-400 flex items-center gap-1.5 justify-end select-none">
          <RefreshCcw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Simulating normal seasonal parameters</span>
        </div>
      )}
    </div>
  );
}
