import React from 'react';
import { Sparkles, Printer, Loader2, Check } from 'lucide-react';
import { useGlobalState } from '../context/GlobalStateContext';

export default function PitchDeckGenerator() {
  const {
    resolvedProjectName: projectName,
    resolvedLocationName: locationName,
    resolvedPropertyType: propertyType,
    inputs,
    activeInputs,
    metrics,
    taxExitMetrics,
    stressTestMode
  } = useGlobalState();

  const [isExporting, setIsExporting] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);

  const handleGenerateDeck = () => {
    if (isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
      // 1. Ingest values and format them beautifully
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(val);
    };

    const formatPercent = (val: number) => `${val}%`;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const maxProjectedNet = Math.max(
      ...metrics.fiveYearProjections.map(p => Math.abs(p.netCashflow)),
      1
    );

    // Compute dynamic width bars HTML
    const projectionBarsHTML = metrics.fiveYearProjections.map((p) => {
      const isNegative = p.netCashflow < 0;
      const ratio = Math.max(2, Math.min(100, Math.round((Math.abs(p.netCashflow) / maxProjectedNet) * 100)));
      const color = stressTestMode ? '#f43f5e' : '#706a60';
      const labelColor = isNegative ? '#e11d48' : '#1a1a1a';
      
      return `
        <div class="trajectory-line">
          <div class="line-meta">
            <span class="year-label">YEAR 0${p.year}</span>
            <span class="finance-vals">
              <span>Gross: ${formatCurrency(p.grossRevenue)}</span> 
              <span style="font-weight: 600; color: ${labelColor};">Net: ${formatCurrency(p.netCashflow)}</span>
            </span>
          </div>
          <div class="bar-track">
            ${isNegative ? `
              <div class="bar-align-right">
                <div class="bar-fill" style="width: ${ratio}%; background-color: #f43f5e; margin-left: auto;"></div>
              </div>
            ` : `
              <div class="bar-fill" style="width: ${ratio}%; background-color: ${color};"></div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Compute tabular projection entries HTML
    const projectionRowsHTML = metrics.fiveYearProjections.map((p) => {
      const isNegative = p.netCashflow < 0;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e6e4df;">Year 0${p.year}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e6e4df; text-align: right;">${formatPercent(activeInputs.occupancy)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e6e4df; text-align: right;">${formatCurrency(p.grossRevenue)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e6e4df; text-align: right; font-weight: 600; color: ${isNegative ? '#e11d48' : '#1a1a1a'};">
            ${formatCurrency(p.netCashflow)}
          </td>
        </tr>
      `;
    }).join('');

    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hospitality Calculator — Proposal Prospectus</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --color-paper: #faf9f6;
      --color-charcoal: #1a1a1a;
      --color-clay: #706a60;
      --color-earth: #c5a059;
      --color-stone: #e6e4df;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f1f0ee;
      color: var(--color-charcoal);
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Double landscape format */
    .page-container {
      width: 297mm;
      height: 210mm;
      background-color: var(--color-paper);
      margin: 30px auto;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--color-stone);
      padding: 22mm 24mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .page-break {
      page-break-after: always;
    }

    /* Typography */
    h1, h2, h3, h4, .serif-font {
      font-family: 'Cormorant Garamond', serif;
      margin: 0;
      font-weight: 300;
    }

    .mono-font {
      font-family: monospace;
      font-size: 8.5pt;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--color-earth);
    }

    /* Layout Elements */
    .slide-header {
      border-bottom: 1px solid var(--color-stone);
      padding-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .slide-title {
      font-size: 32pt;
      color: var(--color-charcoal);
      line-height: 1.1;
      margin-top: 4px;
    }

    .slide-footer {
      border-top: 1px solid var(--color-stone);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: var(--color-clay);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .watermark {
      font-size: 8.5pt;
      font-weight: 500;
      letter-spacing: 0.1em;
      color: var(--color-clay);
      text-transform: uppercase;
    }

    /* Page 1 Grid styling */
    .grid-deck {
      display: grid;
      grid-template-columns: 1.2fr 1.8fr;
      gap: 40px;
      margin: 30px 0;
      flex-grow: 1;
    }

    .meta-locker {
      border-right: 1px solid var(--color-stone);
      padding-right: 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .project-descriptor {
      font-size: 14pt;
      line-height: 1.5;
      font-family: 'Cormorant Garamond', serif;
      color: var(--color-clay);
      font-style: italic;
    }

    .meta-property-tag {
      font-size: 18pt;
      font-family: 'Cormorant Garamond', serif;
      font-weight: 400;
      color: var(--color-charcoal);
      border-bottom: 1px dashed var(--color-stone);
      padding: 10px 0;
    }

    .metrics-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
    }

    .metric-card-deck {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .deck-card {
      background: #ffffff;
      border: 1px solid var(--color-stone);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .deck-card-val {
      font-size: 26pt;
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      color: var(--color-charcoal);
      line-height: 1.1;
      margin-top: 10px;
    }

    /* Page 2 Grid Styling */
    .grid-deck-p2 {
      display: grid;
      grid-template-columns: 1.5fr 1.5fr;
      gap: 40px;
      margin: 30px 0;
      flex-grow: 1;
    }

    .trajectory-container {
      background: #ffffff;
      border: 1px solid var(--color-stone);
      padding: 25px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .trajectory-line {
      margin-bottom: 12px;
    }

    .trajectory-line:last-child {
      margin-bottom: 0;
    }

    .line-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8pt;
      font-family: monospace;
      margin-bottom: 4px;
    }

    .year-label {
      font-weight: 600;
      color: var(--color-clay);
    }

    .finance-vals {
      display: flex;
      gap: 12px;
      color: var(--color-clay);
    }

    .bar-track {
      height: 8px;
      width: 100%;
      background: #f1f0ee;
      border-radius: 2px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 2px;
    }

    /* Print utility controls */
    .control-hud {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 9999;
      background: var(--color-charcoal);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid var(--color-clay);
      transition: all 0.2s;
    }

    .control-hud:hover {
      background: #333333;
      transform: translateY(-2px);
    }

    @media print {
      body {
        background-color: #ffffff !important;
      }
      .page-container {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        width: 297mm !important;
        height: 210mm !important;
        page-break-after: always !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      .control-hud {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE PROSPECTUS -->
  <div class="page-container page-break">
    <div class="slide-header">
      <div>
        <div class="mono-font">Hospitality Calculator</div>
        <h2 class="slide-title">Project Summary Card</h2>
      </div>
      <div style="text-align: right; font-size: 9pt; font-family: monospace; color: var(--color-clay);">
        <div>DATE: ${currentDate}</div>
        <div>MARKET STRATEGY: INDEPENDENT RENTAL</div>
      </div>
    </div>

    <div class="grid-deck">
      <div class="meta-locker">
        <div>
          <div class="mono-font" style="margin-bottom: 8px;">Development Details</div>
          <div class="meta-property-tag">
            <span style="font-weight: 300;">Project:</span> 
            <strong style="font-weight: 600; display: block; margin-top: 4px;">${projectName}</strong>
          </div>
          <div class="meta-property-tag">
            <span style="font-weight: 300;">Location:</span> 
            <strong style="font-weight: 600; display: block; margin-top: 4px;">${locationName}</strong>
          </div>
          <div class="meta-property-tag">
            <span style="font-weight: 300;">Typology:</span> 
            <strong style="font-weight: 600; display: block; margin-top: 4px;">${propertyType}</strong>
          </div>
        </div>
        <p class="project-descriptor">
          "A custom financial overview designed to help visualize revenue, costs, and estimates over five years."
        </p>
      </div>

      <div class="metrics-col">
        <div class="mono-font">Estimated Five-Year Performance Review</div>
        
        <div class="metric-card-deck">
          <div class="deck-card">
            <span class="mono-font" style="font-size: 7.5pt;">Gross Annual Rev</span>
            <div class="deck-card-val">${formatCurrency(metrics.grossAnnualRevenue)}</div>
          </div>
          <div class="deck-card">
            <span class="mono-font" style="font-size: 7.5pt;">Payback Period</span>
            <div class="deck-card-val">${metrics.paybackPeriod ? `${metrics.paybackPeriod} Yrs` : 'Deficit'}</div>
          </div>
          <div class="deck-card">
            <span class="mono-font" style="font-size: 7.5pt;">Exit Proceeds</span>
            <div class="deck-card-val">${formatCurrency(taxExitMetrics.projectedExitProceeds)}</div>
          </div>
        </div>

        <div style="font-size: 9.5pt; line-height: 1.6; color: var(--color-clay); text-align: justify; border-top: 1px solid var(--color-stone); padding-top: 15px;">
          This proposal outlines your expected five-year project journey. By balancing setup expenses against estimated rental nightly rates and annual occupancy, this calculator estimates your annual gross revenues, net cashflows, and cumulative break-even trajectories dynamically.
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div class="watermark">Hospitality ROI Calculator</div>
      <div>Section 01 // Project Summary</div>
    </div>
  </div>


  <!-- PAGE 2: RESILIENCE & TRACK RECORD -->
  <div class="page-container font-sans">
    <div class="slide-header">
      <div>
        <div class="mono-font">Hospitality Calculator</div>
        <h2 class="slide-title">Financial Resilience & 5-Year Projections</h2>
      </div>
      <div style="text-align: right; font-size: 9pt; font-family: monospace; color: var(--color-clay);">
        <div>MACRO REGIME: ${stressTestMode ? 'STRESSED DEPRESSION' : 'NORMAL GROWTH'}</div>
        <div>CLASSIFICATION: SECURE ASSET</div>
      </div>
    </div>

    <div class="grid-deck-p2">
      <!-- Trajectory charts column -->
      <div class="trajectory-container">
        <div>
          <div class="mono-font" style="margin-bottom: 12px; font-weight: bold;">Five-Year Cumulative Rent Revenue Chart</div>
          <p style="font-size: 8.5pt; color: var(--color-clay); margin: 0 0 16px 0; font-style: italic;">
            ${stressTestMode ? 'Reflecting stress test parameters of -20% nightly rate and +15% running costs.' : 'Reflecting normal seasonal parameters.'}
          </p>
        </div>
        
        <div>
          ${projectionBarsHTML}
        </div>

        <div style="font-size: 8pt; color: var(--color-clay); text-align: left; border-top: 1px solid var(--color-stone); padding-top: 12px; margin-top: 12px;">
          Bars represent estimated cumulative net revenue. Projections assume consistent seasonal demand thresholds.
        </div>
      </div>

      <!-- Table Ledger column -->
      <div style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="mono-font" style="margin-bottom: 12px;">Five-Year Projections Table</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; font-family: monospace;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-charcoal); text-align: left;">
                <th style="padding: 10px 0; font-weight: 600;">Year</th>
                <th style="padding: 10px 0; text-align: right; font-weight: 600;">Occupancy</th>
                <th style="padding: 10px 0; text-align: right; font-weight: 600;">Gross Rev</th>
                <th style="padding: 10px 0; text-align: right; font-weight: 600;">Net Cashflow</th>
              </tr>
            </thead>
            <tbody>
              ${projectionRowsHTML}
            </tbody>
          </table>
        </div>

        <div style="font-size: 8.5pt; line-height: 1.5; color: var(--color-clay); background: #ffffff; border: 1px solid var(--color-stone); padding: 15px; border-radius: 4px;">
          <strong>Planning Notes:</strong> Projections assume standard 3.0% year-on-year organic market growth. Results are simple planning estimates, not legal or financial advice.
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div class="watermark">Hospitality ROI Calculator</div>
      <div>Section 02 // projections</div>
    </div>
  </div>

  <!-- Print Hud Button -->
  <div class="control-hud" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
    Save Proposal PDF
  </div>

  <script>
    // Automatically open print dialogue after small rendering delay
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
    `;

    // Open target window or tab and dump compiled stream
    const outputWindow = window.open('', '_blank');
    setIsExporting(false);
    if (outputWindow) {
      outputWindow.document.open();
      outputWindow.document.write(template);
      outputWindow.document.close();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } else {
      alert('The proposal popup was blocked by your browser. Please allow popups to open your proposal PDF.');
    }
  }, 1200);
};

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        onClick={handleGenerateDeck}
        disabled={isExporting}
        className={`w-full sm:w-auto px-5 py-2.5 font-sans text-xs font-semibold rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
          isExporting 
            ? 'bg-neutral-800 text-neutral-450 border border-neutral-700 cursor-wait'
            : exportSuccess
            ? 'bg-luxury-clay text-white border border-luxury-clay hover:bg-luxury-charcoal'
            : 'bg-neutral-900 border border-neutral-750 text-white hover:bg-[#1a1a1a] hover:border-neutral-600'
        }`}
        title="Download project proposal PDF"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        ) : exportSuccess ? (
          <Check className="w-3.5 h-3.5 text-white animate-pulse" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-luxury-earth shrink-0" />
        )}
        {isExporting 
          ? 'Compiling proposal...' 
          : exportSuccess 
          ? 'Proposal exported!' 
          : 'Export proposal PDF'}
      </button>
      {exportSuccess && (
        <span className="text-xs font-semibold tracking-wider font-mono text-luxury-earth flex items-center gap-1 animate-in fade-in duration-300 select-none">
          ✦ Project proposal booklet opened in a new tab.
        </span>
      )}
    </div>
  );
}
