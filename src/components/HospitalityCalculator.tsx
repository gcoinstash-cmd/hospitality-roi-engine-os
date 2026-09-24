import React, { useState, useMemo, useEffect } from 'react';
import { 
  calculateHospitalityROI, 
  calculateTaxAdvantage,
  HospitalityROIInput, 
  HospitalityROIResult 
} from '../utils/formulas';
import { 
  getSavedProjects, 
  saveProject, 
  deleteProject, 
  HospitalityProject 
} from '../utils/storage';
import { 
  Sliders, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Code, 
  Copy, 
  Check, 
  HelpCircle,
  Info,
  FolderOpen,
  Save,
  Trash2,
  Briefcase,
  Clock,
  Plus,
  Sparkles,
  Bookmark,
  Printer,
  ShieldAlert,
  FileText,
  ArrowRight,
  ChevronRight,
  Loader2
} from 'lucide-react';
import benchmarksData from '../utils/benchmarks.json';
import compliancePresetsData from '../utils/compliancePresets.json';
import { useGlobalState } from '../context/GlobalStateContext';
import StressTestToggle from './StressTestToggle';
import PitchDeckGenerator from './PitchDeckGenerator';

// Lazy load the Procurement Sidebar
const ProcurementSidebar = React.lazy(() => import('./ProcurementSidebar'));

interface PremiumInputControlProps {
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
  id: string;
}

const PremiumInputControl: React.FC<PremiumInputControlProps> = ({
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
  id
}) => {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  useEffect(() => {
    // Only update local from external if it's different and not currently active
    if (document.activeElement?.id !== `${id}-input-text`) {
      setLocalVal(value.toString());
    }
  }, [value, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    const parsed = Number(raw);
    if (!isNaN(parsed) && raw.trim() !== '') {
      const safeVal = Math.max(0, Math.min(10000000, parsed));
      onChange(safeVal);
    }
  };

  const handleBlur = () => {
    let parsed = Number(localVal);
    if (isNaN(parsed) || localVal.trim() === '') {
      parsed = value;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="relative flex items-center shadow-inner">
      {prefix && (
        <span className="absolute left-2.5 text-neutral-400 font-mono text-[10px] select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        id={`${id}-input-text`}
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-24 text-right font-mono text-xs font-semibold py-1 border border-luxury-stone/80 rounded focus:outline-none focus:ring-1 focus:ring-luxury-earth bg-[#faf9f6]/40 text-luxury-charcoal focus:bg-white transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          prefix ? 'pl-5.5' : 'pl-2'
        } ${suffix ? 'pr-7' : 'pr-2'}`}
      />
      {suffix && (
        <span className="absolute right-2 text-neutral-400 font-mono text-[9px] select-none pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

interface HospitalityCalculatorProps {
  presetInputs?: HospitalityROIInput;
}

export default function HospitalityCalculator({ presetInputs }: HospitalityCalculatorProps) {
  const {
    inputs,
    setInputs,
    activeInputs,
    handleSliderChange,

    savedProjects,
    setSavedProjects,
    activeProjectId,
    setActiveProjectId,
    newProjectName,
    setNewProjectName,
    saveSuccess,
    setSaveSuccess,
    handleSaveProject,
    handleDeleteProject,
    handleSelectProject,

    stressTestMode,
    setStressTestMode,
    isAccelerated,
    setIsAccelerated,

    activeBenchmarkId,
    setActiveBenchmarkId,
    activeBenchmark,

    resolvedProjectName,
    resolvedLocationName,
    resolvedPropertyType,

    currentCompliancePreset,
    checkedHurdles,
    setCheckedHurdles,

    isArchitectModalOpen,
    setIsArchitectModalOpen,
    leadName,
    setLeadName,
    leadEmail,
    setLeadEmail,
    leadSubmitted,
    setLeadSubmitted,
    errors,
    setErrors,

    isLoading,
    setIsLoading,
    isGlowing,
    setIsGlowing,
    triggerLoading,

    showSidebar,
    setShowSidebar,
    showProcurement,
    setShowProcurement,

    metrics,
    baselineMetrics,
    taxExitMetrics,
    maxProjectedNet,
    showToast
  } = useGlobalState();

  // Stress flash animation states
  const [isStressFlashing, setIsStressFlashing] = useState(false);
  const [stressFlashType, setStressFlashType] = useState<'red' | 'green' | null>(null);
  const [beforeMetrics, setBeforeMetrics] = useState<{
    netAnnualCashflow: number;
    paybackPeriod: number | null;
    grossAnnualRevenue: number;
  } | null>(null);
  const stressFlashTimeoutRef = React.useRef<any>(null);

  const handleStressTestToggle = (enabled: boolean) => {
    if (stressFlashTimeoutRef.current) {
      clearTimeout(stressFlashTimeoutRef.current);
    }
    
    // Store current values for before-and-after comparison delta
    setBeforeMetrics({
      netAnnualCashflow: metrics.netAnnualCashflow,
      paybackPeriod: metrics.paybackPeriod,
      grossAnnualRevenue: metrics.grossAnnualRevenue,
    });

    setStressTestMode(enabled);
    setStressFlashType(enabled ? 'red' : 'green');
    setIsStressFlashing(true);
    setIsGlowing(true);

    stressFlashTimeoutRef.current = setTimeout(() => {
      setIsStressFlashing(false);
      setStressFlashType(null);
    }, 2800);
  };

  // Methodology state & notes
  const [activeMethodologyKey, setActiveMethodologyKey] = useState<string | null>(null);

  // SaaS interactive state trackers
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingWidget, setIsGeneratingWidget] = useState(false);
  const [widgetSuccess, setWidgetSuccess] = useState(false);
  const [compareAgainstCurrent, setCompareAgainstCurrent] = useState(true);

  // User journey selection state (Architects, Developers, Investors)
  const [activeUserJourney, setActiveUserJourney] = useState<string | null>('developers');

  const getTrustBadgeInfo = (id: string | null) => {
    if (!id || id === 'none') {
      return {
        label: 'Illustrative',
        style: 'text-neutral-500 bg-neutral-100 border-neutral-300',
        description: 'Custom self-directed model, ideal for exploratory underwritings.',
        reliability: 'Baseline sensitivity modeling'
      };
    }
    
    if (id === 'california-glamping') {
      return {
        label: 'Market-backed',
        style: 'text-emerald-800 bg-emerald-50 border-emerald-200/80',
        description: 'Cross-referenced with regional TOT sales-tax logs and state park wilderness occupancy indexes.',
        reliability: 'Verified municipal tourism audits'
      };
    }
    if (id === 'kyoto-wellness') {
      return {
        label: 'Regional',
        style: 'text-blue-800 bg-blue-50 border-blue-200',
        description: 'Standard baseline derived from historical municipal hospitality registries and Kyoto Association archives.',
        reliability: 'Standard trade association indices'
      };
    }
    if (id === 'amalfi-estate') {
      return {
        label: 'Regional',
        style: 'text-blue-800 bg-blue-50 border-blue-200',
        description: 'Model factors in Sorrento-Campania seasonal accommodation logs and Soprintendenza archeological clearances.',
        reliability: 'Historical peak-season operator surveys'
      };
    }
    if (id === 'arizona-villa') {
      return {
        label: 'Market-backed',
        style: 'text-emerald-800 bg-emerald-50 border-emerald-250',
        description: 'Underwritten with local building material index guides and off-grid desert estate pilot project statistics.',
        reliability: 'Developer custom feasibility surveys'
      };
    }

    // Active user journey stakeholder presets
    if (id === 'architects' || id === 'developers' || id === 'consultants') {
      return {
        label: 'Preset',
        style: 'text-amber-800 bg-amber-50 border-amber-250',
        description: 'Standard preconfigured workflow parameters for structural and density exploration.',
        reliability: 'Professional stakeholder templates'
      };
    }
    if (id === 'investors') {
      return {
        label: 'Illustrative',
        style: 'text-rose-800 bg-rose-50 border-rose-250',
        description: 'Speculative high-end capital scenario tailored for tier-one global wellness sanctuaries.',
        reliability: 'Stress-test sensitivity matrix'
      };
    }

    return {
      label: 'Preset',
      style: 'text-amber-800 bg-amber-50 border-amber-250',
      description: 'Preconfigured scenario baseline.',
      reliability: 'Aura & Grid standards'
    };
  };

  const getMethodologyDetails = (key: string) => {
    let sourceLabel = "User-defined illustrative value";
    let explanation = "";
    let isMarketBacked = false;
    let baselineValueStr = "";
    let authorityNote = "";

    const region = resolvedLocationName || "California Coast";

    // Output key specifications for comprehensive trust layer
    if (key === 'grossAnnualRevenue' || key === 'netAnnualCashflow' || key === 'paybackPeriod' || key === 'depreciationShield' || key === 'exitProceeds') {
      isMarketBacked = false;
      
      if (key === 'grossAnnualRevenue') {
        sourceLabel = "Data Source: Derived Calculation (Regional Proxy)";
        baselineValueStr = `Based on: ${inputs.units} Units at ${inputs.occupancy}% Occupancy`;
        explanation = "Gross Annual Revenue represents the total generated revenue from accommodations and ancillary spends before subtracting operating costs. It is calculated as: (Units × Occupancy % × 365 days × ADR) + (Units × Occupancy % × 365 days × Ancillary Spend). Under stress testing, this value assumes a severe -20% daily tariff downcycle.";
        authorityNote = "Computed by compounding local boutique lodging capacities against regional seasonal rate audits.";
      } else if (key === 'netAnnualCashflow') {
        sourceLabel = "Data Source: Regional proxy & cost model";
        baselineValueStr = `Based on: Gross Revenue - ${formatCurrency(inputs.opex * 12)} annual expenses`;
        explanation = "Net Annual Cash Flow represents the leftover liquid cash generated by the property each year after accounting for standard operational expenses. Calculated as: Gross Annual Revenue - (Monthly OpEx × 12). Under stress testing, this factors in a +15% regional operational expense inflation premium.";
        authorityNote = "Cross-referenced with regional hospitality trade records, accounting for regulatory overheads and resource security costs.";
      } else if (key === 'paybackPeriod') {
        sourceLabel = "Data Source: Investment Scenario Proxy";
        baselineValueStr = `Based on: Capital Expenditure of ${formatCurrency(inputs.capex)}`;
        explanation = "Setup Payback Period is the time (in years) required to fully recover the initial capital expenditure (CapEx) out of annual net cash flows. Calculated as: CapEx Setup Capital ÷ Net Annual Cash Flow. If net cash flow is negative, the model displays a perpetual deficit indicator.";
        authorityNote = "Underwritten using standard commercial amortizing rules. Lengthy recovery periods generally require secondary equity injections or structural cost optimization.";
      } else if (key === 'depreciationShield') {
        sourceLabel = "Data Source: Presets & Tax Code Projections";
        baselineValueStr = "Based on: 85% Depreciable Property Basis over 5-Yr Hold";
        explanation = "The Annual Tax Shield measures the immediate reduction in income taxes resulting from allowable non-cash asset depreciation. Calculated as: Year 1 Depreciation (Straight-Line or Accelerated Bonus) × active tax bracket of 32%. This highlights the preservation of cash through cost segregation audits.";
        authorityNote = "Modeled using federal and state capital investment guidelines. Accelerated schedules allow writing off modular properties much faster under MACRS provisions.";
      } else if (key === 'exitProceeds') {
        sourceLabel = "Data Source: Presets & Market-Backed Appreciation";
        baselineValueStr = "Based on: 15% Hold Period Appreciation (cumulative)";
        explanation = "Projected Exit Proceeds estimate the net cash realized upon a hypothetical property sale at the end of a five-year holding period. Calculated as: sale price (appreciated at 15% cumulative based on standard assets appreciation factor) minus outstanding book basis and minus 6% brokerage/transaction fees.";
        authorityNote = "Sourced from historical regional asset appraisal curves. Subject to localized zoning permanence, property security rules, and macroeconomic interest rate environments.";
      }
      return { sourceLabel, explanation, isMarketBacked, baselineValueStr, authorityNote };
    }

    if (activeBenchmark && (key === 'adr' || key === 'occupancy' || key === 'opex' || key === 'capex' || key === 'units' || key === 'upsell')) {
      const bValue = (activeBenchmark as any)[key] as number;
      const uValue = (inputs as any)[key] as number;
      isMarketBacked = uValue === bValue;
      
      const formattedBVal = key === 'occupancy' ? `${bValue}%` : key === 'units' ? `${bValue} keys` : `$${bValue.toLocaleString()}`;
      const formattedUVal = key === 'occupancy' ? `${uValue}%` : key === 'units' ? `${uValue} keys` : `$${uValue.toLocaleString()}`;

      if (isMarketBacked) {
        sourceLabel = `Market-Backed Baseline (${region})`;
        if (key === 'adr') {
          explanation = `This value matches the regional average of ${formattedBVal} based on actual hospitality data for ${activeBenchmark.propertyType} ventures in the ${region}. It accounts for local seasonal demand caps and strict environmental permitting limits.`;
        } else if (key === 'occupancy') {
          explanation = `This value matches the regional occupancy baseline of ${formattedBVal} for ${region}. Demands are modeled based on year-round tourist inflows, high-season spikes, and normal winter cycles.`;
        } else if (key === 'opex') {
          explanation = `This value matches the regional operating expense baseline of ${formattedBVal} per month for ${region}, covering standard off-grid setup services, local safety/code compliance, and regular upkeep.`;
        } else if (key === 'capex') {
          explanation = `This value matches the typical capital expenditure baseline of ${formattedBVal} for ${activeBenchmark.propertyType} ventures in ${region}. It covers initial land prep, design drafts, and physical structures.`;
        } else if (key === 'units') {
          explanation = `Matches the optimal regional scale of ${formattedBVal} for managing localized ecological impact and high-value customer service standards in ${region}.`;
        } else if (key === 'upsell') {
          explanation = `Matches the baseline ancillary guest spend of ${formattedBVal} typical for premium wellness packages, local excursions, or organic culinary programs in ${region}.`;
        }
      } else {
        sourceLabel = `User-Defined Illustrative Value (with ${region} base)`;
        if (key === 'adr') {
          explanation = `You have customized the ADR to ${formattedUVal} (default baseline was ${formattedBVal}). This lets you model premium amenities or custom guest upgrades. Coastal visual impact guidelines and historical averages tend to center near the baseline.`;
        } else if (key === 'occupancy') {
          explanation = `You have overridden the occupancy rate to ${formattedUVal} (default baseline was ${formattedBVal}). Modifying this allows you to test optimistic operating targets or highly localized marketing advantages.`;
        } else if (key === 'opex') {
          explanation = `You have set OpEx to ${formattedUVal}/mo (default baseline was ${formattedBVal}/mo). This is helpful for testing streamlined remote management or, conversely, highly elevated service staff overheads.`;
        } else if (key === 'capex') {
          explanation = `You have adjusted the CapEx setup capital to ${formattedUVal} (regional baseline is ${formattedBVal}). Modifying this lets you run simulations on scaled structures or modular manufacturing efficiency.`;
        } else if (key === 'units') {
          explanation = `You are modeling ${formattedUVal} active spaces (regional baseline is ${formattedBVal}). This calculates the return curves for alternative layouts or modular expansions.`;
        } else if (key === 'upsell') {
          explanation = `Ancillary spend is changed to ${formattedUVal} per guest. Ideal for projecting higher yield programs (e.g. customized wellness add-ons, heli-tours, private dining).`;
        }
      }
      baselineValueStr = `Baseline: ${formattedBVal}`;
    } else {
      // No active benchmark
      const val = (inputs as any)[key] as number;
      const formattedUVal = key === 'occupancy' ? `${val}%` : key === 'units' ? `${val} keys` : `$${val.toLocaleString()}`;
      sourceLabel = "User-Defined Illustrative Value";
      if (key === 'adr') {
        explanation = `Average Daily Rate is set to ${formattedUVal}. This is currently modeled as a user preference. Select a benchmark in the scenario locker to overlay market-backed data automatically.`;
      } else if (key === 'occupancy') {
        explanation = `Occupancy rate is set to ${formattedUVal}. Toggle different location profiles in the sidebar to overlay regional historic occupancy limits.`;
      } else if (key === 'opex') {
        explanation = `Operating cost is set to ${formattedUVal}/mo. This is user-defined. Real-world operating costs depend heavily on sewage/power access, local staffing constraints, and conservation rules.`;
      } else if (key === 'capex') {
        explanation = `Initial Setup Capital is set to ${formattedUVal}. This tracks the total physical CapEx. Expand a regional benchmark in the sidebar to compare average construction indexes.`;
      } else if (key === 'units') {
        explanation = `You have configured ${formattedUVal} active keys. This scales the structural model up or down.`;
      } else if (key === 'upsell') {
        explanation = `Ancillary spend is set to ${formattedUVal}. This measures secondary revenue sources beyond lodging fees.`;
      }
    }

    // Add specific regional authority notes for authenticity and high trust
    authorityNote = authorityNote || "";
    const locLower = region.toLowerCase();
    if (locLower.includes('california')) {
      if (key === 'adr') {
        authorityNote = "Regional data is sourced from Coastal Commission hospitality audits and local zoning board records (California Coastal Commission benchmarks).";
      } else if (key === 'occupancy') {
        authorityNote = "Based on seasonal hotel tax receipts (TOT) and public state park overnight capacity statistics.";
      } else if (key === 'opex') {
        authorityNote = "Computed based on standard California high-hazard conservation land maintenance overheads and regulatory compliance filings.";
      } else if (key === 'capex') {
        authorityNote = "Computed factoring in California seismic loading standards, state agency structural rules, and native habitat protection offsets.";
      } else if (key === 'units') {
        authorityNote = "Guided by regional coastal land zoning caps limiting standard boutique layouts to a safe preservation density profile.";
      } else if (key === 'upsell') {
        authorityNote = "Cross-referenced with Yosemite & Big Sur luxury hospitality ancillary services audit metrics.";
      }
    } else if (locLower.includes('kyoto')) {
      if (key === 'adr') {
        authorityNote = "Sourced from Kyoto Municipal Lodging registries and century-old Machiya timber revitalization trade indexes.";
      } else if (key === 'occupancy') {
        authorityNote = "Compiled by the Kyoto Tourism Association archives accounting for cherry blossom and autumn foliage peaks.";
      } else if (key === 'opex') {
        authorityNote = "Modeled using timber structure preventive maintenance guidelines and city-mandated garbage-management premiums.";
      } else if (key === 'capex') {
        authorityNote = "Incorporating heritage Miyadaiku carpenters preservation wage indices and traditional lime plastering guidelines.";
      } else if (key === 'units') {
        authorityNote = "Subject to Kyoto city center historic district preservation guidelines safeguarding municipal density ratios.";
      } else if (key === 'upsell') {
        authorityNote = "Reflecting traditional tea ceremony, private Zen garden tour curation and Kaiseki culinary affiliate indexes.";
      }
    } else if (locLower.includes('amalfi')) {
      if (key === 'adr') {
        authorityNote = "Sourced from peak summer room-index logs from the Campania regional tourist authority.";
      } else if (key === 'occupancy') {
        authorityNote = "Adjusted for full resort hibernation periods between November and late March based on Sorrento-Amalfi traffic logs.";
      } else if (key === 'opex') {
        authorityNote = "Factoring in specialized cliffside hoist-transport logistics and historic Soprintendenza preservation rules.";
      } else if (key === 'capex') {
        authorityNote = "Covering marine-grade structural piles, local stone masonry craftsmanship, and Soprintendenza archeological clearance permits.";
      } else if (key === 'units') {
        authorityNote = "Subject to coastal cliff slope safety standards limiting multi-tiered villa units in Campania.";
      } else if (key === 'upsell') {
        authorityNote = "Factoring in luxury private yacht charter commissions and Sorrento culinary experience partnership standard ratios.";
      }
    } else {
      if (key === 'adr') {
        authorityNote = "Zoning board accommodation audits and local Chamber of Commerce glamping indices.";
      } else if (key === 'occupancy') {
        authorityNote = "Derived from tourist tracking reports for modern off-grid retreats in wilderness conservation zones.";
      } else if (key === 'opex') {
        authorityNote = "Factoring in dry-arid micro-utility operating fees, saguaro-preservation landscaping, and water-hauling costs.";
      } else if (key === 'capex') {
        authorityNote = "Standard construction assembly estimates and modular unit delivery shipping indices.";
      } else if (key === 'units') {
        authorityNote = "Local master plan density allocations for eco-tourism pilot projects.";
      } else if (key === 'upsell') {
        authorityNote = "Ancillary boutique service margins as reported across high-end rural glamping estates.";
      }
    }

    return { sourceLabel, explanation, isMarketBacked, baselineValueStr, authorityNote };
  };

  const handleSaveProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isSaving) return;
    setIsSaving(true);
    setTimeout(() => {
      handleSaveProject(newProjectName);
      setIsSaving(false);
    }, 800);
  };

  // Benchmark comparison helpers
  const getDifferenceTag = (field: 'adr' | 'occupancy' | 'units' | 'upsell' | 'opex' | 'capex') => {
    if (!activeBenchmark) return null;
    const benchmarkVal = activeBenchmark[field];
    const userVal = activeInputs[field];
    const diff = userVal - benchmarkVal;

    if (diff === 0) return { text: 'On avg baseline', color: 'text-neutral-500 bg-neutral-50 border-neutral-200', type: 'neutral' };

    const isPositiveOrGainMetric = ['adr', 'occupancy', 'units', 'upsell'].includes(field);

    if (isPositiveOrGainMetric) {
      if (diff > 0) {
        const formatted = field === 'occupancy' ? `+${diff}%` : `+$${Math.abs(diff).toLocaleString()}`;
        return {
          text: `${formatted} above avg`,
          color: 'text-[#3c513e] bg-emerald-50 border-emerald-200/60',
          type: 'positive'
        };
      } else {
        const formatted = field === 'occupancy' ? `-${Math.abs(diff)}%` : `-$${Math.abs(diff).toLocaleString()}`;
        return {
          text: `${formatted} below avg`,
          color: 'text-rose-700 bg-rose-50 border-rose-200/60',
          type: 'negative'
        };
      }
    } else {
      // Expenses like opex or capex: being below is good, above is higher outlay
      if (diff > 0) {
        const formatted = `+$${Math.abs(diff).toLocaleString()}`;
        return {
          text: `${formatted} higher outlays`,
          color: 'text-amber-800 bg-amber-50 border-amber-200/60',
          type: 'negative'
        };
      } else {
        const formatted = `-$${Math.abs(diff).toLocaleString()}`;
        return {
          text: `${formatted} lower outlays`,
          color: 'text-[#3c513e] bg-emerald-50 border-emerald-200/60',
          type: 'positive'
        };
      }
    }
  };

  const getDeviationExplanation = (field: 'adr' | 'occupancy' | 'capex') => {
    if (!activeBenchmark) return null;
    const benchmarkVal = activeBenchmark[field];
    const userVal = activeInputs[field];

    let isSignificant = false;
    if (field === 'occupancy') {
      isSignificant = Math.abs(userVal - benchmarkVal) >= 10;
    } else {
      isSignificant = Math.abs(userVal - benchmarkVal) / benchmarkVal >= 0.15;
    }

    if (!isSignificant) return null;

    return activeBenchmark.insights[field];
  };

  // Formatter Helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatWithCommas = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  // Embed Toggle and Iframe copy state
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = useMemo(() => {
    return `<iframe src="https://aura-and-grid.com/embed/hospitality-roi" width="100%" height="800" style="border:none; border-radius:12px; background:#faf9f6;" allow="autoplay"></iframe>`;
  }, []);

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateWidget = () => {
    if (showEmbed) {
      setShowEmbed(false);
      setWidgetSuccess(false);
      return;
    }
    
    setIsGeneratingWidget(true);
    setTimeout(() => {
      setIsGeneratingWidget(false);
      setShowEmbed(true);
      setWidgetSuccess(true);
      showToast("Calculator responsive widget generated.", "success");
      setTimeout(() => setWidgetSuccess(false), 3000);
    }, 750);
  };

  // Rich Snippet Structured Schema Code for SoftwareApplication & HowTo
  const calculatorSchemaMarkup = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "@id": "https://aura-and-grid.com/#hospitality-roi-engine",
          "name": "Aura & Grid Hospitality ROI Engine",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "description": "An interactive digital simulation workspace for landscape architects and real estate developers to determine Hospitality Development ROI, analyze property net cashflows, and forecast investment payback periods.",
          "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "HowTo",
          "@id": "https://aura-and-grid.com/#how-to-hospitality-roi-calculation",
          "name": "How to Calculate Hospitality Development ROI and Investment Payback Period",
          "description": "Use the Aura & Grid Hospitality ROI Engine to run property scenarios, test stress scenario resilience, and forecast five-year capital structure payback timelines.",
          "step": [
            {
              "@type": "HowToStep",
              "name": "Configure Real Estate Parameters",
              "text": "Navigate to the range controls to set average daily rate, target unit inventory, capital expenditure setup budget, and ongoing operating cost limits.",
              "url": "https://aura-and-grid.com/#step-configure"
            },
            {
              "@type": "HowToStep",
              "name": "Simulate Macro Stress Cycles",
              "text": "Engage the simulation toggles to observe investment payback periods and annual cash flow drops under simulated contraction states.",
              "url": "https://aura-and-grid.com/#step-stress"
            },
            {
              "@type": "HowToStep",
              "name": "Analyze Yield Projections and Payback Period",
              "text": "Review live computed metrics including net annual return, amortized setups, and 5-year trajectories before exporting developer reports.",
              "url": "https://aura-and-grid.com/#step-analyze"
            }
          ]
        }
      ]
    };
  }, []);

  const sliderColSpan = showSidebar && showProcurement 
    ? 'lg:col-span-3' 
    : (showSidebar || showProcurement ? 'lg:col-span-4' : 'lg:col-span-5');

  const yieldColSpan = showSidebar && showProcurement 
    ? 'lg:col-span-3' 
    : (showSidebar || showProcurement ? 'lg:col-span-5' : 'lg:col-span-7');

  return (
    <>
      {/* Hidden JSON-LD block for maximum search console "Rich Snippet" indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorSchemaMarkup) }}
      />
      <div id="hospitality-calculator-root" className="bg-white border border-luxury-stone rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none">
      {/* Executive Stress Test Report Header - PDF Print Only */}
      <div className="hidden print:block p-8 border-b-2 border-luxury-stone/80 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-luxury-earth font-extrabold block">AURA & GRID SYSTEMS</span>
            <h1 className="font-serif text-3xl text-luxury-charcoal mt-1">Aura & Grid Executive Summary</h1>
            <p className="text-xs text-luxury-clay font-serif italic mt-0.5">Asset Stress Test and Downside Yield Projections</p>
          </div>
          <div className="text-right font-mono text-[10px] text-neutral-500">
            <div>Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>Status: <span className="text-rose-600 font-bold font-mono uppercase">{stressTestMode ? 'STRESSED REGIME' : 'NORMAL RANGE'}</span></div>
            <div>Scenario: {activeProjectId ? `SAVED-PROJ-${activeProjectId.substring(0, 8).toUpperCase()}` : 'ADHOC-STRESS-MODEL'}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-rose-50/20 rounded-xl border border-rose-100 text-xs font-mono">
          <div>
            <span className="text-neutral-400 block text-[9px] uppercase">Base ADR</span>
            <span className="text-luxury-charcoal font-medium line-through">{formatCurrency(inputs.adr)}</span>
          </div>
          <div>
            <span className="text-rose-700 block text-[9px] uppercase font-bold">Effective ADR</span>
            <span className="text-rose-600 font-extrabold">{formatCurrency(activeInputs.adr)} {stressTestMode && "(-20%)"}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[9px] uppercase">Base OpEx</span>
            <span className="text-luxury-charcoal font-medium line-through">{formatCurrency(inputs.opex)}</span>
          </div>
          <div>
            <span className="text-rose-700 block text-[9px] uppercase font-bold">Effective OpEx</span>
            <span className="text-rose-600 font-extrabold">{formatCurrency(activeInputs.opex)}/mo {stressTestMode && "(+15%)"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
          <div className="border border-luxury-stone p-2 rounded">
            <span className="text-neutral-400 block text-[8px] uppercase">Annual Revenue (Stressed)</span>
            <span className="text-luxury-charcoal font-bold">{formatCurrency(metrics.grossAnnualRevenue)}</span>
          </div>
          <div className="border border-luxury-stone p-2 rounded">
            <span className="text-neutral-400 block text-[8px] uppercase">Annual Net Cashflow</span>
            <span className={`font-bold ${metrics.netAnnualCashflow >= 0 ? "text-luxury-charcoal" : "text-rose-600"}`}>
              {formatCurrency(metrics.netAnnualCashflow)}
            </span>
          </div>
          <div className="border border-luxury-stone p-2 rounded">
            <span className="text-neutral-400 block text-[8px] uppercase">Setup Payback Period</span>
            <span className="text-luxury-charcoal font-bold">{metrics.paybackPeriod ? `${metrics.paybackPeriod} Years` : 'Deficit'}</span>
          </div>
        </div>
      </div>

      {/* Premium Launch-Ready Hero Section */}
      <div className="relative overflow-hidden border-b border-luxury-stone bg-[#171614] text-neutral-100 p-8 md:p-12 lg:p-16 print:hidden">
        {/* Subtle geometric grid accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#2a2824_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        
        {/* Delicate aesthetic gradient flares */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#8c7a6b]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e5b95d] animate-pulse" />
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold">
                AURA & GRID SYSTEMS / PRO-FORMA SIMULATOR
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded border border-neutral-800 text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Access saved project scenarios"
              >
                <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                {showSidebar ? 'Hide Saved Projects' : 'Show Saved Projects'}
              </button>
              <button
                type="button"
                onClick={() => setShowProcurement(!showProcurement)}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded border border-neutral-800 text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Curated brand affiliate vendor solutions"
              >
                <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                {showProcurement ? 'Hide Procurement Hub' : 'Show Procurement Hub'}
              </button>
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded font-extrabold">
                AUDITED ROI SYSTEM V1.20
              </span>
            </div>
          </div>

          <div className="space-y-5 max-w-4xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono tracking-wider text-amber-400 uppercase font-semibold">
              ✦ Hospitality Feasibility & ROI Modeling
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.12]">
              Professional Hospitality Feasibility & ROI Simulator
            </h1>
            <p className="font-sans text-xs md:text-base text-neutral-300 leading-relaxed max-w-3xl font-light">
              Underwrite premium lodging scenarios with confidence. Formulate institutional-grade investment models, estimate equipment procurement costs, simulate severe downside stress cycles, and produce investor-ready financial performance summary decks in seconds.
            </p>

            {/* Prominent, Unmistakable Primary CTA & Built For list */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('modeling-workspace-parameters')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-[#cfa54a] hover:from-amber-600 hover:to-[#bfa040] text-neutral-950 font-bold font-mono text-[11px] uppercase tracking-wider rounded-lg shadow-xl cursor-pointer hover:scale-102 transition-all duration-300 flex items-center justify-center gap-2 group border border-amber-400/20 focus:outline-none shrink-0"
              >
                <span>Begin Modeling Scenario</span>
                <ArrowRight className="w-4 h-4 text-neutral-950 transition-transform group-hover:translate-x-1" />
              </button>
              
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-[#9c958b] font-bold">
                  Designed & Built For:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-neutral-300 font-sans">
                  {['Architects', 'Developers', 'Investors', 'Consultants'].map((stakeholder, sIdx) => {
                    // Clicking on any stakeholder selects the corresponding activeUserJourney
                    let targetJourney = stakeholder.toLowerCase();
                    if (stakeholder === 'Investors') targetJourney = 'investors';
                    if (stakeholder === 'Consultants') targetJourney = 'developers'; // consultants aligns with developers
                    
                    return (
                      <button 
                        key={sIdx} 
                        type="button"
                        onClick={() => {
                          const journeyMap: Record<string, string> = {
                            'architects': 'architects',
                            'developers': 'developers',
                            'investors': 'investors',
                            'consultants': 'developers'
                          };
                          const selectedKey = journeyMap[targetJourney];
                          setActiveUserJourney(selectedKey);
                          triggerLoading();
                          // Load appropriate preset mapping
                          const presets: Record<string, any> = {
                            'architects': { adr: 680, occupancy: 68, units: 12, upsell: 180, opex: 52000, capex: 3400000, propertyName: "Kamo River Wellness Pavilion" },
                            'developers': { adr: 450, occupancy: 62, units: 8, upsell: 120, opex: 32000, capex: 1600000, propertyName: "California Canyon Glamping Reserve" },
                            'investors': { adr: 1250, occupancy: 75, units: 10, upsell: 350, opex: 95000, capex: 6500000, propertyName: "Saguaro Desert Modernist Estate (Illustrative premium scenario)" }
                          };
                          setInputs(presets[selectedKey]);
                          showToast("Workspace preset applied.", "success");
                          document.getElementById('modeling-workspace-parameters')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-amber-500/50 font-medium font-mono text-[10px] text-neutral-200 transition-all duration-200 cursor-pointer"
                        title={`Click to initialize ${stakeholder} preset profile`}
                      >
                        ✦ {stakeholder}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic "How It Works" Progress Strip */}
      <div className="border-b border-luxury-stone bg-[#faf9f6]/95 p-5 md:p-6 print:hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:divide-x divide-luxury-stone/80">
          {[
            {
              num: "01",
              title: "Set Assumptions",
              desc: "Adjust regional real estate keys, daily accommodation rates (ADR), targeted seasonal occupancy levels, and setup capital expenditure budgets."
            },
            {
              num: "02",
              title: "Stress Test",
              desc: "Apply server-backed downcycle stress indicators to observe simulated room tariff decreases and operational expenditure spikes."
            },
            {
              num: "03",
              title: "Export Summary",
              desc: "Compile custom investor-ready pitch presentations, save localization files, or export clean responsive iframe configurations."
            }
          ].map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start pl-0 md:pl-6 first:pl-0">
              <span className="font-mono text-[10px] font-bold text-luxury-earth bg-luxury-cream border border-luxury-stone/80 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                {step.num}
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-xs font-bold text-luxury-charcoal uppercase tracking-wider">
                  {step.title}
                </h4>
                <p className="text-[11px] text-luxury-clay leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Who is this for?" Interactive Customer Journey Section */}
      <div className="px-6 md:px-8 py-5 bg-luxury-cream/10 border-b border-luxury-stone flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4.5 h-4.5 text-luxury-earth shrink-0" />
          <div className="space-y-0.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-luxury-earth font-bold">WHO IS THIS FOR?</span>
            <p className="font-serif text-sm text-luxury-charcoal font-medium">Select your stakeholder profile to customize recommendations</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              id: 'architects',
              label: 'Architects',
              preset: {
                adr: 680,
                occupancy: 68,
                units: 12,
                upsell: 180,
                opex: 52000,
                capex: 3400000,
                propertyName: "Kamo River Wellness Pavilion"
              }
            },
            {
              id: 'developers',
              label: 'Developers',
              preset: {
                adr: 450,
                occupancy: 62,
                units: 8,
                upsell: 120,
                opex: 32000,
                capex: 1600000,
                propertyName: "California Canyon Glamping Reserve"
              }
            },
            {
              id: 'investors',
              label: 'Investors (Premium)',
              preset: {
                adr: 1250,
                occupancy: 75,
                units: 10,
                upsell: 350,
                opex: 95000,
                capex: 6500000,
                propertyName: "Saguaro Desert Modernist Estate (Illustrative premium scenario)"
              }
            }
          ].map(tag => {
            const isActive = activeUserJourney === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  setActiveUserJourney(tag.id);
                  triggerLoading();
                  setInputs(tag.preset);
                  showToast("Workspace preset applied.", "success");
                }}
                className={`px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-[#1c1a17] text-white border-[#1c1a17] shadow-md scale-102 ring-1 ring-amber-500/50 font-bold' 
                    : 'bg-white hover:bg-[#faf9f6]/95 text-luxury-clay border-luxury-stone hover:border-luxury-earth/80'
                }`}
              >
                ✦ {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeUserJourney && (() => {
        let text = "";
        let role = "";
        if (activeUserJourney === 'architects') {
          role = "Design & Compliance Suite Profile";
          text = "As an Architect, focus on site feasibility, ecological footprint, and strict structural code approvals. Leverage our benchmark integration tool to match real-world site variables directly with the regional averages of California or Kyoto.";
        } else if (activeUserJourney === 'developers') {
          role = "Operational Scale & Development Velocity";
          text = "As a Developer, inspect payback curves, explore room density scenarios, and tweak dynamic OpEx boundaries. Utilize the Procurement Hub on the right to estimate furniture, fixtures, and off-grid utility setup costs.";
        } else if (activeUserJourney === 'investors') {
          role = "Equity Preservation & Defensive Cashflow Yields (Illustrative Premium Scenario)";
          text = "As an Investor, focus on long-term macro yield security, accelerated asset cost segregations, and maximum enterprise value. Note: This high-end profile models an Illustrative premium scenario tailored for tier-one global wellness sanctuaries. We strongly recommend keeping 'Stress Test' enabled to stress-test your debt-service coverage spreads under extreme downside scenarios.";
        }
        return (
          <div className="px-6 md:px-8 py-3.5 bg-[#faf9f6]/40 border-b border-luxury-stone font-sans text-xs text-neutral-600 flex flex-col md:flex-row md:items-baseline justify-between gap-2.5 animate-in slide-in-from-top-1.5 duration-200">
            <p className="leading-relaxed">
              <strong className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth block mb-0.5">{role}</strong>
              {text}
            </p>
            <span className="font-mono text-[9px] text-luxury-earth uppercase shrink-0 bg-white border border-luxury-stone px-2 py-0.5 rounded font-bold">
              ACTIVE GUIDANCE ENGINE
            </span>
          </div>
        );
      })()}

      {/* Main Multi-Column Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-luxury-stone print:block">
        
        {/* Dynamic Left Column: Saved Projects Sidebar */}
        {showSidebar && (
          <div className="lg:col-span-3 p-6 space-y-6 bg-[#faf9f6]/60 flex flex-col justify-between print:hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-luxury-stone">
                <FolderOpen className="w-4 h-4 text-luxury-earth" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-luxury-charcoal font-semibold">
                  Projects Locker ({savedProjects.length})
                </h3>
              </div>
              <p className="text-[11px] text-luxury-clay leading-normal">
                Commit active modeling scenarios to localized browser memory to compare multiple development scales.
              </p>

              {/* Quick Save Scenario Form */}
              <form onSubmit={handleSaveProjectForm} className={`space-y-3 p-4 bg-white border rounded-xl shadow-sm transition-all duration-300 ${
                isSaving 
                  ? 'border-neutral-300 opacity-80' 
                  : saveSuccess 
                  ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' 
                  : 'border-luxury-stone'
              }`}>
                <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth block">
                  Lock Current Configuration
                </span>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    maxLength={35}
                    placeholder="E.g., Tahoe Ridge Cabin"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-luxury-stone rounded focus:outline-none focus:ring-1 focus:ring-luxury-earth bg-[#faf9f6]/40 placeholder-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isSaving}
                  className={`w-full py-2.5 px-3 font-mono text-[10px] uppercase tracking-wider rounded border text-center transition-all duration-205 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSaving
                      ? 'border-neutral-300 text-neutral-400 bg-neutral-50 cursor-wait'
                      : saveSuccess
                      ? 'border-emerald-600 text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                      : newProjectName.trim()
                      ? 'border-luxury-earth text-white bg-luxury-earth hover:bg-luxury-clay shadow-sm'
                      : 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-neutral-50'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving Scenario...' : saveSuccess ? 'Scenario Locked!' : 'Save Current State'}
                </button>
              </form>
            </div>

            {/* Saved Projects Scroll Locker */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1 mt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8c857b] block pb-1 border-b border-dotted border-luxury-stone">
                Saved Configurations
              </span>

              {savedProjects.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-luxury-stone/80 rounded-xl bg-white/70 space-y-3 mt-2 animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-full bg-[#faf9f6]/80 flex items-center justify-center mx-auto border border-luxury-stone/60 shadow-sm">
                    <Briefcase className="w-4 h-4 text-luxury-earth" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-medium text-luxury-charcoal">
                      No Saved Configurations
                    </p>
                    <p className="text-[10px] font-sans text-neutral-400 leading-normal max-w-[180px] mx-auto">
                      Lock your active architectural parameters above to create comparative baselines.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {savedProjects.map((project) => {
                    const isActive = activeProjectId === project.id;
                    const dateFormatted = new Date(project.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-1.5 ${
                          isActive 
                            ? 'bg-luxury-charcoal text-luxury-cream border-luxury-charcoal shadow-sm' 
                            : 'bg-white hover:bg-[#faf9f6]/40 text-luxury-charcoal border-luxury-stone hover:border-luxury-earth'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-serif text-sm font-normal leading-tight break-words flex-1 pr-1">
                            {project.name}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className={`p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer md:opacity-0 group-hover:opacity-100 ${
                              isActive ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-rose-450' : ''
                            }`}
                            title="Delete scenario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick metric tags */}
                        <div className="flex flex-wrap gap-x-2 text-[9px] font-mono text-neutral-400 shrink-0">
                          <span className={isActive ? 'text-neutral-300' : 'text-luxury-earth'}>
                            ADR: ${project.inputs.adr}
                          </span>
                          <span>•</span>
                          <span className={isActive ? 'text-neutral-300' : 'text-luxury-earth'}>
                            {project.inputs.units} Keys
                          </span>
                          <span>•</span>
                          <span className={isActive ? 'text-neutral-300' : 'text-luxury-earth'}>
                            Occ: {project.inputs.occupancy}%
                          </span>
                        </div>

                        {/* Saved timestamp */}
                        <div className="flex items-center gap-1 text-[8px] font-mono justify-end text-neutral-400 mt-1">
                          <Clock className="w-2.5 h-2.5 text-neutral-350" />
                          <span>{dateFormatted}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-luxury-stone text-[9px] font-mono text-luxury-earth leading-relaxed">
              *All configurations are isolated locally within your active browser runtime workspace.
            </div>
          </div>
        )}
        
        {/* Left Column: Interactive Range Sliders */}
        <div id="modeling-workspace-parameters" className={`${sliderColSpan} p-6 md:p-8 space-y-8 bg-white transition-all duration-300 print:hidden scroll-mt-6`}>
          <div className="flex items-center gap-2 pb-4 border-b border-luxury-stone/60 font-semibold text-luxury-charcoal">
            <Sliders className="w-4 h-4 text-luxury-earth shrink-0" />
            <h3 className="font-mono text-xs uppercase tracking-wider">
              Operational & Investment inputs
            </h3>
          </div>

          {/* Benchmarking Comparison Suite Selector */}
          <div className="p-5 bg-neutral-50/50 rounded-2xl border border-luxury-stone space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-luxury-stone/60">
              <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-luxury-earth animate-pulse shrink-0" />
                Benchmark Comparison Engine
              </span>
              <span className="text-[8px] font-mono text-neutral-400 bg-[#dfdbd7]/30 border border-neutral-300 px-1.5 py-0.5 rounded uppercase">
                Underwriting Core
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10.5px] font-sans text-neutral-500 leading-relaxed font-light">
                  This comparison system cross-references your design choices against commercial tax registers, regional zoning profiles, and lodging performance surveys. Leverage verified benchmarks to back stress-test metrics with regional precision.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-luxury-charcoal uppercase tracking-wider block">
                  Select Comparative Profile:
                </label>
                <select
                  value={activeBenchmarkId}
                  onChange={(e) => {
                    triggerLoading();
                    setActiveBenchmarkId(e.target.value);
                    if (e.target.value === 'none') {
                      setCompareAgainstCurrent(false);
                      showToast("Benchmark overlays disabled.", "info");
                    } else {
                      setCompareAgainstCurrent(true);
                      showToast("Regional industry baseline loaded.", "success");
                    }
                  }}
                  className="w-full text-xs font-mono py-2 px-2.5 border border-luxury-stone rounded bg-white text-luxury-charcoal focus:outline-none focus:ring-1 focus:ring-luxury-earth cursor-pointer"
                >
                  <optgroup label="Regional Industry Baselines (Market-Backed)">
                    {benchmarksData.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.region} — {b.propertyType}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Locker Controls">
                    <option value="none">Disable Comparisons (Raw Sliders Only)</option>
                  </optgroup>
                </select>
              </div>

              {/* Dynamic Profile Trust & Reliability Card */}
              {(() => {
                const isNoBenchmark = !activeBenchmark || activeBenchmarkId === 'none';
                const profileId = isNoBenchmark ? (activeUserJourney || 'none') : activeBenchmarkId;
                const activeName = isNoBenchmark 
                  ? (activeUserJourney === 'architects' 
                      ? 'Kamo River Wellness Pavilion Preset' 
                      : activeUserJourney === 'developers' 
                      ? 'California Canyon Glamping Reserve Preset'
                      : activeUserJourney === 'investors'
                      ? 'Saguaro Desert Modernist Estate Preset'
                      : 'Self-Customized Illustrative Scenario')
                  : `${activeBenchmark.region} — ${activeBenchmark.propertyType}`;
                
                const badge = getTrustBadgeInfo(profileId);
                
                return (
                  <div className="p-3 bg-white border border-luxury-stone rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-serif text-[12px] font-medium text-luxury-charcoal leading-none block">
                        {activeName}
                      </span>
                      {/* Visible Trust Badge */}
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase font-semibold px-2 py-0.5 rounded border leading-tight shrink-0 transition-colors duration-300 ${badge.style}`}>
                        ✦ {badge.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-neutral-500 leading-normal font-sans">
                      {badge.description}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-dotted border-luxury-stone">
                      <span className="font-mono text-[8.5px] uppercase text-luxury-earth font-bold">Reliability:</span>
                      <span className="text-[9.5px] font-sans text-neutral-600 font-medium">{badge.reliability}</span>
                    </div>

                    {/* Integrated Control Panel (Reset to Benchmark, Compare Live, Disable) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 pt-2">
                      {/* Reset to Benchmark (ONLY if a matching benchmark is selected, or if user is on a preset/user journey we can reset sliders to preset value) */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerLoading();
                          if (activeBenchmark) {
                            // Reset inputs to exactly the benchmark
                            setInputs({
                              adr: activeBenchmark.adr,
                              occupancy: activeBenchmark.occupancy,
                              units: activeBenchmark.units,
                              upsell: activeBenchmark.upsell,
                              opex: activeBenchmark.opex,
                              capex: activeBenchmark.capex,
                              propertyName: activeBenchmark.region + " " + activeBenchmark.propertyType
                            });
                            showToast("Sliders reset to benchmark standard.", "success");
                          } else {
                            // If no benchmark, reset to current stakeholder preset values
                            const presets: Record<string, any> = {
                              'architects': { adr: 680, occupancy: 68, units: 12, upsell: 180, opex: 52000, capex: 3400000, propertyName: "Kamo River Wellness Pavilion" },
                              'developers': { adr: 450, occupancy: 62, units: 8, upsell: 120, opex: 32000, capex: 1600000, propertyName: "California Canyon Glamping Reserve" },
                              'investors': { adr: 1250, occupancy: 75, units: 10, upsell: 350, opex: 95000, capex: 6500000, propertyName: "Saguaro Desert Modernist Estate (Illustrative premium scenario)" }
                            };
                            const selectedPreset = presets[activeUserJourney || 'developers'];
                            if (selectedPreset) {
                              setInputs(selectedPreset);
                              showToast("Sliders reset to preset scenario.", "success");
                            }
                          }
                        }}
                        className="py-1 px-2 border border-neutral-205 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 rounded text-[9.5px] font-mono text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center gap-1 cursor-pointer select-none leading-none"
                        title="Revert all sliders back to standard configuration"
                      >
                        Reset Sliders
                      </button>

                      {/* Compare Against Current Toggle */}
                      <button
                        type="button"
                        disabled={activeBenchmarkId === 'none'}
                        onClick={() => {
                          setCompareAgainstCurrent(!compareAgainstCurrent);
                          showToast(
                            !compareAgainstCurrent 
                              ? "Live average comparisons enabled." 
                              : "Live average comparisons hidden.", 
                            "info"
                          );
                        }}
                        className={`py-1 px-2 border rounded text-[9.5px] font-mono transition flex items-center justify-center gap-1 cursor-pointer select-none leading-none ${
                          activeBenchmarkId === 'none'
                            ? 'border-neutral-100 text-neutral-300 bg-neutral-50 cursor-not-allowed'
                            : compareAgainstCurrent
                            ? 'border-emerald-250 bg-emerald-50/50 text-emerald-800 font-medium'
                            : 'border-neutral-205 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                        }`}
                        title="Toggle comparison overlays and deviation metrics below"
                      >
                        {compareAgainstCurrent ? 'Compare On' : 'Compare Off'}
                      </button>

                      {/* Disable Comparisons entirely button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerLoading();
                          setActiveBenchmarkId('none');
                          setCompareAgainstCurrent(false);
                          showToast("Comparison overlays deactivated.", "info");
                        }}
                        className="py-1 px-2 border border-rose-200/50 hover:border-rose-400 text-rose-750 hover:text-rose-900 bg-rose-50/20 hover:bg-rose-50 rounded text-[9.5px] font-mono transition flex items-center justify-center gap-1 cursor-pointer select-none leading-none col-span-2 md:col-span-1"
                        title="Turn off benchmark mode and hide differences"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Stress Test Controller Panel */}
          <div id="stress-test-panel" className="print:hidden">
            <StressTestToggle 
              onToggle={handleStressTestToggle} 
            />
          </div>

          <div className="space-y-6">
            {/* Slider 1: Average Daily Rate (ADR) - Range $150 to $2500 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Average Daily Rate (ADR)</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('adr')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View ADR Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="The nightly tariff generated per rented space." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('adr');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="adr" 
                  value={inputs.adr} 
                  min={150} 
                  max={2500} 
                  step={25} 
                  prefix="$" 
                  onChange={(val) => handleSliderChange('adr', val)} 
                />
              </div>
              <input 
                type="range"
                min="150"
                max="2500"
                step="25"
                value={inputs.adr}
                onChange={(e) => handleSliderChange('adr', Number(e.target.value))}
                className="premium-slider"
                id="adr-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$150 premium base</span>
                <span>$2,500 flagship rate</span>
              </div>
              {/* Regional Insight */}
              {activeBenchmark && compareAgainstCurrent && (() => {
                const insight = getDeviationExplanation('adr');
                return insight ? (
                  <div className="p-3 bg-luxury-cream/40 border border-luxury-stone/80 rounded-lg text-[10.5px] text-luxury-clay leading-relaxed flex items-start gap-2 mt-1 shadow-sm transition-all duration-300">
                    <Sparkles className="w-3.5 h-3.5 text-luxury-earth shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-mono uppercase text-[9px] tracking-wider text-luxury-earth block mb-0.5">Regional ADR Insight</strong>
                      {insight}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Slider 2: Occupancy Rate - Range 20% to 100% */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Yearly Occupancy Rate</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('occupancy')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View Occupancy Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="The percentage of booked nights over the fiscal year." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('occupancy');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="occupancy" 
                  value={inputs.occupancy} 
                  min={20} 
                  max={100} 
                  step={1} 
                  suffix="%" 
                  onChange={(val) => handleSliderChange('occupancy', val)} 
                />
              </div>
              <input 
                type="range"
                min="20"
                max="100"
                step="1"
                value={inputs.occupancy}
                onChange={(e) => handleSliderChange('occupancy', Number(e.target.value))}
                className="premium-slider"
                id="occupancy-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>20% conservative</span>
                <span>100% capacity cap</span>
              </div>
              {/* Regional Insight */}
              {activeBenchmark && compareAgainstCurrent && (() => {
                const insight = getDeviationExplanation('occupancy');
                return insight ? (
                  <div className="p-3 bg-luxury-cream/40 border border-luxury-stone/80 rounded-lg text-[10.5px] text-luxury-clay leading-relaxed flex items-start gap-2 mt-1 shadow-sm transition-all duration-300">
                    <Sparkles className="w-3.5 h-3.5 text-luxury-earth shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-mono uppercase text-[9px] tracking-wider text-luxury-earth block mb-0.5">Regional Occupancy Insight</strong>
                      {insight}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Slider 3: Rental Units - Range 1 to 25 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Active Rental Spaces (Units)</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('units')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View Units Scale Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="The total capacity of boutique hotel keys or cabins active." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('units');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="units" 
                  value={inputs.units} 
                  min={1} 
                  max={25} 
                  step={1} 
                  suffix="keys" 
                  onChange={(val) => handleSliderChange('units', val)} 
                />
              </div>
              <input 
                type="range"
                min="1"
                max="25"
                step="1"
                value={inputs.units}
                onChange={(e) => handleSliderChange('units', Number(e.target.value))}
                className="premium-slider"
                id="units-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>1 key cabin</span>
                <span>25 keys estate limit</span>
              </div>
            </div>

            {/* Slider 4: Ancillary Spend per stay (Upsells) - Range $0 to $1000 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Ancillary spend (Upsell)</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('upsell')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View Upsell Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="Additional revenue generated from experiences, spa, dining etc." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('upsell');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="upsell" 
                  value={inputs.upsell} 
                  min={0} 
                  max={1000} 
                  step={10} 
                  prefix="$" 
                  onChange={(val) => handleSliderChange('upsell', val)} 
                />
              </div>
              <input 
                type="range"
                min="0"
                max="1000"
                step="10"
                value={inputs.upsell}
                onChange={(e) => handleSliderChange('upsell', Number(e.target.value))}
                className="premium-slider"
                id="upsell-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$0 standard lodging</span>
                <span>$1,000 extreme wellness add-on</span>
              </div>
            </div>

            {/* Slider 5: Monthly operating costs (OpEx) - Range $1,000 to $50,000 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Monthly Operating Expenses (OpEx)</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('opex')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View OpEx Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="Routine operating costs like sewage, housekeeping, staff & marketing." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('opex');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="opex" 
                  value={inputs.opex} 
                  min={1000} 
                  max={50000} 
                  step={500} 
                  prefix="$" 
                  suffix="/mo" 
                  onChange={(val) => handleSliderChange('opex', val)} 
                />
              </div>
              <input 
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={inputs.opex}
                onChange={(e) => handleSliderChange('opex', Number(e.target.value))}
                className="premium-slider"
                id="opex-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$1,000 / month</span>
                <span>$50,000 / month team overhead</span>
              </div>
            </div>

            {/* Slider 6: Initial setup cost (CapEx) - Range $2,500 to $2.5M */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-mono text-luxury-charcoal font-medium flex items-center gap-1 flex-wrap">
                    <span>Initial Setup Capital (CapEx)</span>
                    <button
                      type="button"
                      onClick={() => setActiveMethodologyKey('capex')}
                      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-luxury-earth uppercase tracking-widest pl-2 hover:text-[#3c513e] transition cursor-pointer"
                      title="View CapEx Methodology Profile"
                    >
                      <Info className="w-2.5 h-2.5 text-luxury-earth" />
                      <span className="underline decoration-dotted font-bold">Methodology</span>
                    </button>
                    <HelpCircle className="w-3 h-3 text-neutral-300 shrink-0" title="Total land acquisition, design draft, structural assembly & hookups." />
                  </label>
                  {activeBenchmark && compareAgainstCurrent && (() => {
                    const tag = getDifferenceTag('capex');
                    return tag ? (
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tag.color}`}>
                        {tag.text}
                      </span>
                    ) : null;
                  })()}
                </div>
                <PremiumInputControl 
                  id="capex" 
                  value={inputs.capex} 
                  min={2500} 
                  max={2500000} 
                  step={25000} 
                  prefix="$" 
                  onChange={(val) => handleSliderChange('capex', val)} 
                />
              </div>
              <input 
                type="range"
                min="2500" // Support setting slider bounds matching user request
                max="2500000"
                step="25000"
                value={inputs.capex}
                onChange={(e) => handleSliderChange('capex', Number(e.target.value))}
                className="premium-slider"
                id="capex-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$2,500 micro retrofit</span>
                <span>$2,500,000 grand villa launch</span>
              </div>
              {/* Regional Insight */}
              {activeBenchmark && compareAgainstCurrent && (() => {
                const insight = getDeviationExplanation('capex');
                return insight ? (
                  <div className="p-3 bg-luxury-cream/40 border border-luxury-stone/80 rounded-lg text-[10.5px] text-luxury-clay leading-relaxed flex items-start gap-2 mt-1 shadow-sm transition-all duration-300">
                    <Sparkles className="w-3.5 h-3.5 text-luxury-earth shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-mono uppercase text-[9px] tracking-wider text-luxury-earth block mb-0.5">Regional CapEx Insight</strong>
                      {insight}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Yield & Dynamic Visualizations */}
        <div className={`${yieldColSpan} p-6 md:p-8 space-y-8 bg-[#faf9f6]/30 flex flex-col justify-between transition-all duration-300 print:w-full print:bg-white print:p-8`}>
          
          <div className="space-y-6">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-luxury-earth font-semibold pb-4 border-b border-luxury-stone/60 flex items-center justify-between">
              <span>01. Real-time Yield analysis metrics</span>
              <span className="text-neutral-450 font-normal">RE-CALCULATING LIVE</span>
            </h3>

            {/* Metrics KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card A: Gross Revenue */}
              <div className={`bg-white border p-5 rounded-xl transition-all duration-500 ${
                isGlowing 
                  ? (stressTestMode ? 'shadow-[0_0_15px_rgba(244,63,94,0.3)] border-rose-400' : 'shadow-[0_0_15px_rgba(197,160,89,0.35)] border-luxury-earth') 
                  : 'border-luxury-stone shadow-sm'
              } ${
                isStressFlashing 
                  ? (stressFlashType === 'red' ? 'animate-flash-stress-red ring-2 ring-rose-200' : 'animate-flash-stress-green ring-2 ring-emerald-200') 
                  : ''
              } space-y-2`}>
                <div className="flex justify-between items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveMethodologyKey('grossAnnualRevenue')}
                    className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-luxury-earth hover:text-luxury-charcoal transition cursor-pointer text-left focus:outline-none"
                    title="Click to view definition, calculations & sources"
                  >
                    <span>Gross Annual Revenue</span>
                    <HelpCircle className="w-3 h-3 text-neutral-350 shrink-0" />
                  </button>
                  {isStressFlashing && (
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider animate-label-pop ${
                      stressFlashType === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {stressFlashType === 'red' ? 'Stressed' : 'Restored'}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-7 w-28 bg-neutral-200/60 rounded" />
                    <div className="h-3 w-16 bg-neutral-100 rounded" />
                  </div>
                ) : isStressFlashing && beforeMetrics ? (
                  <div className="space-y-2 animate-label-pop select-none">
                    <div className="flex items-center justify-between gap-1 border-b border-dashed border-neutral-200 pb-1.5">
                      <div className="text-left">
                        <span className="block text-[8px] font-mono uppercase text-neutral-400 font-extrabold tracking-wider">Before</span>
                        <span className="text-[11px] font-serif font-light text-neutral-500 line-through">
                          {formatCurrency(beforeMetrics.grossAnnualRevenue)}
                        </span>
                      </div>
                      <div className="text-neutral-450 font-mono text-xs">➔</div>
                      <div className="text-right">
                        <span className="block text-[8px] font-mono uppercase text-luxury-earth font-extrabold tracking-wider">After</span>
                        <span className="text-[13px] font-serif font-semibold text-luxury-charcoal">
                          {formatCurrency(metrics.grossAnnualRevenue)}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const delta = metrics.grossAnnualRevenue - beforeMetrics.grossAnnualRevenue;
                      const pctChange = beforeMetrics.grossAnnualRevenue !== 0 
                        ? Math.round((delta / beforeMetrics.grossAnnualRevenue) * 100)
                        : 0;
                      const isNegativeDelta = delta < 0;
                      return (
                        <div className={`p-1.5 rounded-lg flex items-center justify-between ${
                          isNegativeDelta ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'
                        }`}>
                          <span className="text-[8px] font-mono uppercase font-bold text-neutral-500 shrink-0">Model Shift</span>
                          <span className={`text-[9.5px] font-mono font-extrabold ${isNegativeDelta ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isNegativeDelta ? '' : '+'}{formatCurrency(delta)} ({pctChange >= 0 ? '+' : ''}{pctChange}%)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <div className="font-serif text-2xl text-luxury-charcoal font-light leading-none">
                      {formatCurrency(metrics.grossAnnualRevenue)}
                    </div>
                    <div className="font-mono text-[9px] text-neutral-400 shrink-0">
                      {formatWithCommas(metrics.bookedNights)} booked nights/yr
                    </div>
                  </>
                )}
              </div>

              {/* Card B: Net Cashflow */}
              <div className={`bg-white border p-5 rounded-xl transition-all duration-500 ${
                isGlowing 
                  ? (stressTestMode ? 'shadow-[0_0_15px_rgba(244,63,94,0.3)] border-rose-400' : 'shadow-[0_0_15px_rgba(197,160,89,0.35)] border-luxury-earth') 
                  : 'border-luxury-stone shadow-sm'
              } ${
                isStressFlashing 
                  ? (stressFlashType === 'red' ? 'animate-flash-stress-red ring-2 ring-rose-200' : 'animate-flash-stress-green ring-2 ring-emerald-200') 
                  : ''
              } space-y-2`}>
                <div className="flex justify-between items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveMethodologyKey('netAnnualCashflow')}
                    className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-luxury-earth hover:text-luxury-charcoal transition cursor-pointer text-left focus:outline-none"
                    title="Click to view definition, calculations & sources"
                  >
                    <span>Net Annual Cash Flow</span>
                    <HelpCircle className="w-3 h-3 text-neutral-350 shrink-0" />
                  </button>
                  {isStressFlashing && (
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider animate-label-pop ${
                      stressFlashType === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {stressFlashType === 'red' ? 'Stressed' : 'Restored'}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-7 w-24 bg-neutral-200/60 rounded" />
                    <div className="h-3 w-20 bg-neutral-100 rounded" />
                  </div>
                ) : isStressFlashing && beforeMetrics ? (
                  <div className="space-y-2 animate-label-pop select-none">
                    <div className="flex items-center justify-between gap-1 border-b border-dashed border-neutral-200 pb-1.5">
                      <div className="text-left">
                        <span className="block text-[8px] font-mono uppercase text-neutral-400 font-extrabold tracking-wider">Before</span>
                        <span className="text-[11px] font-serif font-light text-neutral-500 line-through">
                          {formatCurrency(beforeMetrics.netAnnualCashflow)}
                        </span>
                      </div>
                      <div className="text-neutral-450 font-mono text-xs">➔</div>
                      <div className="text-right">
                        <span className="block text-[8px] font-mono uppercase text-luxury-earth font-extrabold tracking-wider">After</span>
                        <span className={`text-[13px] font-serif font-semibold ${
                          metrics.netAnnualCashflow >= 0 ? 'text-luxury-charcoal' : 'text-rose-700'
                        }`}>
                          {formatCurrency(metrics.netAnnualCashflow)}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const delta = metrics.netAnnualCashflow - beforeMetrics.netAnnualCashflow;
                      const pctChange = beforeMetrics.netAnnualCashflow !== 0 
                        ? Math.round((delta / Math.abs(beforeMetrics.netAnnualCashflow)) * 100)
                        : 0;
                      const isNegativeDelta = delta < 0;
                      return (
                        <div className={`p-1.5 rounded-lg flex items-center justify-between ${
                          isNegativeDelta ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'
                        }`}>
                          <span className="text-[8px] font-mono uppercase font-bold text-neutral-500 shrink-0">Cash delta</span>
                          <span className={`text-[9.5px] font-mono font-extrabold ${isNegativeDelta ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isNegativeDelta ? '' : '+'}{formatCurrency(delta)} ({pctChange >= 0 ? '+' : ''}{pctChange}%)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <div className={`font-serif text-2xl font-light leading-none ${
                      metrics.netAnnualCashflow >= 0 ? 'text-luxury-charcoal' : 'text-rose-700'
                    }`}>
                      {formatCurrency(metrics.netAnnualCashflow)}
                    </div>
                    <div className="font-mono text-[9px] text-neutral-400">
                      -{formatCurrency(activeInputs.opex * 12)} operating costs
                    </div>
                  </>
                )}
              </div>

              {/* Card C: Payback Period */}
              <div className={`bg-white border p-5 rounded-xl transition-all duration-500 ${
                isGlowing 
                  ? (stressTestMode ? 'shadow-[0_0_15px_rgba(244,63,94,0.2)] border-rose-300' : 'shadow-[0_0_15px_rgba(197,160,89,0.25)] border-[#dcdcdc]') 
                  : 'border-luxury-stone shadow-sm'
              } ${
                isStressFlashing 
                  ? (stressFlashType === 'red' ? 'animate-flash-stress-red ring-2 ring-rose-200' : 'animate-flash-stress-green ring-2 ring-emerald-200') 
                  : ''
              } space-y-2`}>
                <div className="flex justify-between items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveMethodologyKey('paybackPeriod')}
                    className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-luxury-earth hover:text-luxury-charcoal transition cursor-pointer text-left focus:outline-none"
                    title="Click to view definition, calculations & sources"
                  >
                    <span>Setup Payback Period</span>
                    <HelpCircle className="w-3 h-3 text-neutral-350 shrink-0" />
                  </button>
                  {isStressFlashing && (
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider animate-label-pop ${
                      stressFlashType === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {stressFlashType === 'red' ? 'Stressed' : 'Restored'}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-7 w-20 bg-neutral-200/60 rounded" />
                    <div className="h-3 w-24 bg-neutral-100 rounded" />
                  </div>
                ) : isStressFlashing && beforeMetrics ? (
                  <div className="space-y-2 animate-label-pop select-none">
                    <div className="flex items-center justify-between gap-1 border-b border-dashed border-neutral-200 pb-1.5">
                      <div className="text-left">
                        <span className="block text-[8px] font-mono uppercase text-neutral-400 font-extrabold tracking-wider">Before</span>
                        <span className="text-[11px] font-serif font-light text-neutral-500">
                          {beforeMetrics.paybackPeriod !== null ? `${beforeMetrics.paybackPeriod} Yrs` : 'Deficit'}
                        </span>
                      </div>
                      <div className="text-neutral-450 font-mono text-xs">➔</div>
                      <div className="text-right">
                        <span className="block text-[8px] font-mono uppercase text-luxury-earth font-extrabold tracking-wider">After</span>
                        <span className={`text-[12px] font-serif font-semibold ${
                          metrics.paybackPeriod !== null ? 'text-luxury-charcoal' : 'text-rose-700'
                        }`}>
                          {metrics.paybackPeriod !== null ? `${metrics.paybackPeriod} Yrs` : 'Deficit'}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const beforeVal = beforeMetrics.paybackPeriod;
                      const afterVal = metrics.paybackPeriod;
                      let deltaText = '';
                      let badgeStyle = '';
                      let textStyle = '';

                      if (beforeVal !== null && afterVal !== null) {
                        const diff = parseFloat((afterVal - beforeVal).toFixed(1));
                        if (diff > 0) {
                          deltaText = `+${diff} Yrs Delay`;
                          badgeStyle = 'bg-rose-50 border border-rose-100';
                          textStyle = 'text-rose-600';
                        } else if (diff < 0) {
                          deltaText = `${diff} Yrs Saved`;
                          badgeStyle = 'bg-emerald-50 border border-emerald-100';
                          textStyle = 'text-emerald-600';
                        } else {
                          deltaText = 'Unchanged';
                          badgeStyle = 'bg-neutral-50 border border-neutral-200';
                          textStyle = 'text-neutral-500';
                        }
                      } else if (beforeVal !== null && afterVal === null) {
                        deltaText = 'Shift to Deficit';
                        badgeStyle = 'bg-rose-50 border border-rose-100';
                        textStyle = 'text-rose-700 font-extrabold';
                      } else if (beforeVal === null && afterVal !== null) {
                        deltaText = `Payback: ${afterVal} Yrs`;
                        badgeStyle = 'bg-emerald-50 border border-emerald-100';
                        textStyle = 'text-emerald-700 font-extrabold';
                      } else {
                        deltaText = 'Remains Deficit';
                        badgeStyle = 'bg-rose-50/70 border border-rose-100/60';
                        textStyle = 'text-rose-600';
                      }
                      return (
                        <div className={`p-1.5 rounded-lg flex items-center justify-between ${badgeStyle}`}>
                          <span className="text-[8px] font-mono uppercase font-bold text-neutral-500 shrink-0">Scale drift</span>
                          <span className={`text-[9.5px] font-mono font-extrabold ${textStyle}`}>{deltaText}</span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    {metrics.paybackPeriod !== null ? (
                      <div className="space-y-0.5">
                        <div className="font-serif text-2xl text-luxury-charcoal font-light leading-none">
                          {metrics.paybackPeriod} <span className="text-xs font-sans text-luxury-earth">Years</span>
                        </div>
                        <div className="font-mono text-[9px] text-[#3c513e]">
                          Amortizing {formatCurrency(activeInputs.capex)} setup
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="font-serif text-2xl font-light text-rose-700 leading-none">Deficit</div>
                        <div className="font-mono text-[9px] text-rose-600 leading-tight">
                          OpEx dwarfs gross revenue
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* KPI Cards Grid Disclaimer for Institutional trust */}
            <div className="flex items-start gap-2.5 p-3.5 bg-neutral-50/80 border border-neutral-200/80 rounded-xl text-[10.5px] text-neutral-500 leading-relaxed font-sans shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-neutral-700 font-semibold">Feasibility Modeling Disclaimer:</strong> These financial outputs are dynamic exploratory projections derived from high-level parameter estimates. They are intended for preliminary scenario assessment and planning purposes only and do not constitute an underwriting commitment, guaranteed investment return, or formal bank appraisal. Real-world returns will vary based on physical ground-breaking conditions, municipal approvals, seasonal weather limits, and local lodging tax rules.
              </p>
            </div>

            {/* Interactive Quantitative Analyst Stress Warning Banner & PDF Controller */}
            {stressTestMode && (
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300 print:hidden shadow-sm">
                <div className="space-y-1">
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-rose-800 font-bold flex items-center gap-1.5 bg-transparent">
                    <ShieldAlert className="w-4 h-4 text-rose-605 animate-pulse shrink-0" />
                    Quantitative Risk Protocol Active
                  </span>
                  <p className="text-[11px] text-rose-750 font-serif italic max-w-xl leading-normal">
                    Simulated downside scenario pressure contracts annual net cash flow by <strong className="text-rose-800 font-bold">{Math.round(((baselineMetrics.netAnnualCashflow - metrics.netAnnualCashflow) / (baselineMetrics.netAnnualCashflow || 1)) * 100)}%</strong>. Setup payback period is severely skewed.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  id="print-risk-report-btn"
                  className="px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded border border-rose-300 text-rose-700 bg-white hover:bg-rose-100 hover:text-rose-800 transition cursor-pointer flex items-center gap-2 shadow-sm shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Export Risk Report
                </button>
              </div>
            )}

            {/* Custom Horizontal Visualizations for Projections */}
            <div className="space-y-4 pt-4 border-t border-luxury-stone/60">
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
                  <h4 className="font-serif text-lg font-light text-luxury-charcoal">
                    5-Year Yield Trajectory {stressTestMode && <span className="font-mono text-xs uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-semibold ml-1 shrink-0">Stressed Mode</span>}
                  </h4>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth font-extrabold bg-[#faf9f6] border border-luxury-stone px-2 py-0.5 rounded shadow-xs">
                    Compounding Projection Model
                  </div>
                </div>
                
                {/* One brief, plain-English compounding logic explanation sentence */}
                <p className="text-[11.5px] font-sans text-luxury-clay leading-relaxed font-light">
                  Our calculations compound annual gross revenues by a conservative 3% each year while maintaining a flat operational expense structure to simulate your property's increasing operating leverage.
                </p>
              </div>

              <div className={`space-y-3 p-5 bg-[#faf9f6]/40 border rounded-xl transition-all duration-500 ${
                isStressFlashing 
                  ? (stressFlashType === 'red' ? 'animate-flash-stress-red ring-2 ring-rose-200 bg-rose-50/20' : 'animate-flash-stress-green ring-2 ring-emerald-200 bg-emerald-50/20') 
                  : 'border-luxury-stone bg-[#faf9f6]/20'
              }`}>
                {metrics.fiveYearProjections.map((projection) => {
                  // Calculate dynamic width fraction relative to max value
                  const isNegative = projection.netCashflow < 0;
                  const ratio = Math.max(2, Math.min(100, Math.round((Math.abs(projection.netCashflow) / maxProjectedNet) * 98)));

                  return (
                    <div key={projection.year} className="bg-white border border-luxury-stone/50 rounded-xl p-4 space-y-3.5 shadow-xs transition-shadow duration-300 hover:shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Primary Visual Anchor: Net Annual Cash Flow */}
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-luxury-earth font-extrabold block">
                            Year 0{projection.year} Net Cash Flow
                          </span>
                          <div className={`font-serif text-2xl font-light tracking-tight leading-none ${isNegative ? 'text-rose-600' : 'text-luxury-charcoal'}`}>
                            {isLoading ? (
                              <div className="h-7 w-28 bg-neutral-200 animate-pulse rounded" />
                            ) : (
                              formatCurrency(projection.netCashflow)
                            )}
                          </div>
                        </div>

                        {/* Secondary Metrics grouped in clearly labeled interactive cards */}
                        {!isLoading && (
                          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto shrink-0">
                            <div className="bg-[#faf9f6]/80 border border-luxury-stone/50 hover:border-luxury-earth/50 rounded-lg px-2.5 py-1.5 min-w-[105px] transition duration-200">
                              <span className="block text-[8px] font-mono uppercase text-neutral-400 font-extrabold tracking-wider mb-0.5">Gross Revenue</span>
                              <span className="text-[11px] font-mono font-bold text-luxury-charcoal">
                                {formatCurrency(projection.grossRevenue)}
                              </span>
                            </div>
                            <div className="bg-[#faf9f6]/80 border border-luxury-stone/50 hover:border-luxury-earth/50 rounded-lg px-2.5 py-1.5 min-w-[105px] transition duration-200">
                              <span className="block text-[8px] font-mono uppercase text-neutral-400 font-extrabold tracking-wider mb-0.5">Operating Cost</span>
                              <span className="text-[11px] font-mono font-medium text-luxury-clay">
                                {formatCurrency(projection.opex)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visual Bar gauge mapping to primary Net Cash Flow */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                          {isLoading ? (
                            <div className="h-full bg-neutral-200/60 animate-pulse rounded-full" style={{ width: `${20 + projection.year * 12}%` }} />
                          ) : isNegative ? (
                            <div className="w-full flex justify-end">
                              <div 
                                className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-in-out" 
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          ) : (
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-in-out ${
                                stressTestMode ? 'bg-rose-500/70' : 'bg-luxury-clay'
                              }`} 
                              style={{ width: `${ratio}%` }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-neutral-400 uppercase tracking-widest leading-none pt-0.5 select-none">
                          <span>{isNegative ? 'operating deficit ratio' : 'break-even margin ratio'}</span>
                          <span>{Math.round(ratio)}% of max potential</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t border-luxury-stone/50 flex justify-between text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                  <span>Investment state (Capex)</span>
                  <span>Compounded year yields</span>
                </div>
              </div>
            </div>

            {/* Section 02: Tax & Exit Estimates */}
            <div className="space-y-4 pt-5 mt-4 border-t border-luxury-stone/60 print:hidden" id="tax-exit-section">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
                <h4 className="font-serif text-lg font-normal text-luxury-charcoal">
                  Tax & Exit Estimates
                </h4>
                <div className="font-mono text-[10px] text-luxury-earth uppercase tracking-wider">
                  Feasibility Scenario Estimates
                </div>
              </div>
              
              <div className="space-y-3 font-sans">
                <p className="text-[11.5px] text-neutral-600 leading-relaxed font-light">
                  When underwriting boutique lodging properties, understanding first-year asset depreciation schedules and terminal resale valuations is essential to projecting comprehensive cash flows. Near-term tax shields created by depreciation can help offset prospective operating income, lowering net tax liabilities and enhancing early-phase investment yields. Over a multi-year horizon, modeling property appreciation and estimated disposition proceeds helps plan long-term capital recovery.
                </p>
                <div className="p-3.5 bg-neutral-50/70 border border-luxury-stone/60 rounded-xl text-[10.5px] text-neutral-500 leading-relaxed font-light">
                  <span className="font-mono text-[9px] uppercase font-bold text-luxury-earth block mb-1">
                    ✦ Advisory & Feasibility Disclaimer
                  </span>
                  All calculations, depreciation options (Straight-Line or Accelerated), tax brackets, and resale values modeled in this tool are preliminary feasibility estimates and hypothetical scenarios. Real-world tax liabilities, bonus depreciation qualification limits, capital gains taxation, and recovery rates depend heavily on regional state legislatures and unique corporate structures. <strong>This analysis does not constitute professional tax, financial, or legal advice.</strong> Always consult a certified public accountant (CPA) and specialized tax legal counsel before establishing project plans or making capital declarations.
                </div>
              </div>

              <div className="border border-luxury-stone rounded-xl p-5 bg-white space-y-4 shadow-sm">
                {/* Mode Selector and description */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-stone/40 pb-4">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-luxury-earth">Depreciation Strategy</span>
                    <p className="text-[11px] text-neutral-500 max-w-sm leading-normal">
                      Toggle bonus depreciation to simulate the Year 01 tax shield write-off.
                    </p>
                  </div>
                  <div className="flex bg-[#faf9f6] p-0.5 rounded-lg border border-luxury-stone font-medium w-full sm:w-auto shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsAccelerated(false)}
                      className={`flex-1 sm:flex-none py-1.5 px-3 text-[9.5px] font-mono uppercase tracking-wider rounded-md transition duration-200 cursor-pointer ${
                        !isAccelerated 
                          ? 'bg-luxury-charcoal text-white font-semibold shadow-sm' 
                          : 'text-neutral-500 hover:text-luxury-charcoal bg-transparent'
                      }`}
                    >
                      Straight-Line
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAccelerated(true)}
                      className={`flex-1 sm:flex-none py-1.5 px-3 text-[9.5px] font-mono uppercase tracking-wider rounded-md transition duration-200 cursor-pointer ${
                        isAccelerated 
                          ? 'bg-luxury-clay text-white font-semibold shadow-sm' 
                          : 'text-neutral-500 hover:text-luxury-charcoal bg-transparent'
                      }`}
                    >
                      Accelerated Bonus
                    </button>
                  </div>
                </div>

                {/* Sub KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#faf9f6]/40 p-4 rounded-lg border border-luxury-stone/40 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => setActiveMethodologyKey('depreciationShield')}
                        className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-luxury-earth hover:text-luxury-charcoal transition cursor-pointer text-left focus:outline-none"
                        title="Click to view definition, calculations & sources"
                      >
                        <span>Annual Tax Shield (Yr 1)</span>
                        <HelpCircle className="w-3 h-3 text-neutral-350 shrink-0" />
                      </button>
                      <span className="inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                        32% Tax Bracket
                      </span>
                    </div>
                    {isLoading ? (
                      <div className="space-y-1 animate-pulse">
                        <div className="h-6 w-24 bg-neutral-200/60 rounded" />
                        <div className="h-3 w-32 bg-neutral-100 rounded" />
                      </div>
                    ) : (
                      <>
                        <div className="font-serif text-xl font-light text-luxury-charcoal leading-none">
                          {formatCurrency(taxExitMetrics.annualTaxShieldYear1)}
                        </div>
                        <p className="text-[10px] font-mono text-neutral-400">
                          Based on {formatCurrency(taxExitMetrics.annualDepreciationYear1)} Year 1 deduction
                        </p>
                      </>
                    )}
                  </div>

                  <div className="bg-[#faf9f6]/40 p-4 rounded-lg border border-luxury-stone/40 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => setActiveMethodologyKey('exitProceeds')}
                        className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-luxury-earth hover:text-luxury-charcoal transition cursor-pointer text-left focus:outline-none"
                        title="Click to view definition, calculations & sources"
                      >
                        <span>Projected Exit Proceeds</span>
                        <HelpCircle className="w-3 h-3 text-neutral-350 shrink-0" />
                      </button>
                      <span className="inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                        5-Yr Appraisal
                      </span>
                    </div>
                    {isLoading ? (
                      <div className="space-y-1 animate-pulse">
                        <div className="h-6 w-24 bg-neutral-200/60 rounded" />
                        <div className="h-3 w-32 bg-neutral-100 rounded" />
                      </div>
                    ) : (
                      <>
                        <div className="font-serif text-xl font-light text-luxury-charcoal leading-none">
                          {formatCurrency(taxExitMetrics.projectedExitProceeds)}
                        </div>
                        <p className="text-[10px] font-mono text-neutral-400">
                          Assuming 15% holding appreciation
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabular Details */}
                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <div className="space-y-1">
                    <span className="font-mono text-[9.5px] uppercase font-bold tracking-wider text-luxury-earth block">
                      Estimated Depreciation & Resale Ledger
                    </span>
                    <p className="text-[10px] text-neutral-450 font-sans leading-relaxed">
                      Below is the mathematical breakdown of cost basis depreciation versus estimated property resale. 
                      <strong className="text-neutral-550 ml-1">Calculation Assumption:</strong> Terminal Proceeds are calculated under standard underwriting assumptions: Terminal Sale Revaluation (estimated at {formatCurrency(taxExitMetrics.salePrice)} via 15% cumulative 5-year appreciation) minus Brokerage & Transaction Sale Commissions (6% of Sale Price, or {formatCurrency(taxExitMetrics.sellingCosts)}) minus the Remaining Unrecovered Asset Book Basis ({formatCurrency(taxExitMetrics.remainingBasis)}).
                    </p>
                  </div>
                  
                  <div className="overflow-hidden border border-neutral-250 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="bg-neutral-50/70 border-b border-neutral-200 text-luxury-earth uppercase text-[8.5px] tracking-wider select-none">
                          <th className="py-2.5 px-4 font-bold text-[8.5px]">Financial Metric Component</th>
                          <th className="py-2.5 px-3 text-right font-bold text-[8.5px]">Calculation Factor</th>
                          <th className="py-2.5 px-4 text-right font-bold text-[8.5px]">Holding Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-luxury-charcoal">
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-medium text-neutral-800">Initial Property Cost Basis</td>
                          <td className="py-2.5 px-3 text-right text-neutral-450">Original CapEx Outlay</td>
                          <td className="py-2.5 px-4 text-right font-medium text-neutral-700">{formatCurrency(activeInputs.capex)}</td>
                        </tr>
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-medium text-neutral-800">5-Year Cumulative Depreciation</td>
                          <td className="py-2.5 px-3 text-right text-neutral-450">
                            {isAccelerated ? 'Year 1 Bonus (20%) + Straight-Line' : '27.5-Yr Straight-Line Recovery'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-rose-700 font-semibold">
                            -{formatCurrency(taxExitMetrics.cumulativeDepreciation5Years)}
                          </td>
                        </tr>
                        <tr className="bg-neutral-50/50 hover:bg-neutral-55 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-semibold text-neutral-900">Remaining Asset Book Basis</td>
                          <td className="py-2.5 px-3 text-right text-neutral-450">Initial Basis minus Write-offs</td>
                          <td className="py-2.5 px-4 text-right font-bold text-neutral-850">{formatCurrency(taxExitMetrics.remainingBasis)}</td>
                        </tr>
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-medium text-neutral-800">Estimated Sale Revaluation</td>
                          <td className="py-2.5 px-3 text-right text-neutral-450">15% Hold appreciation over 5 Yrs</td>
                          <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                            {formatCurrency(taxExitMetrics.salePrice)}
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-medium text-neutral-800">Brokerage & Transaction Costs</td>
                          <td className="py-2.5 px-3 text-right text-neutral-450">6% Standard exit commissions</td>
                          <td className="py-2.5 px-4 text-right text-rose-700 font-semibold">
                            -{formatCurrency(taxExitMetrics.sellingCosts)}
                          </td>
                        </tr>
                        <tr className="border-t-2 border-neutral-300 bg-emerald-50/20 font-semibold text-luxury-charcoal">
                          <td className="py-3 px-4 font-serif text-[12px] text-emerald-950">Scenario Net Exit Proceeds</td>
                          <td className="py-3 px-3 text-right text-neutral-500 font-normal text-[10px] font-sans">Sale Price - Fees - Basis</td>
                          <td className="py-3 px-4 text-right text-emerald-800 font-bold text-[12px] font-sans">
                            {formatCurrency(taxExitMetrics.projectedExitProceeds)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 03: Regulatory & Zoning Feasibility */}
            <div className="space-y-4 pt-5 mt-4 border-t border-luxury-stone/60 print:hidden" id="regulatory-feasibility-section">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
                <h4 className="font-serif text-lg font-normal text-luxury-charcoal">
                  Regulatory & Zoning Feasibility
                </h4>
                <div className="font-mono text-[10px] text-luxury-earth uppercase tracking-wider">
                  Planning and zoning checkpoints
                </div>
              </div>

              <div className="space-y-3 font-sans">
                <p className="text-[11.5px] text-neutral-600 leading-relaxed font-light">
                  Zoning regulations, structural code checks, and regional environmental overrides represent the most frequent timeline boundaries in boutique accommodation projects. Reviews of regional compliance blueprints early in the developer mapping layout highlight prospective zoning restrictions, municipal utility availability, or intensive habitat impact reports before committing project funds.
                </p>
                <div className="p-3.5 bg-[#faf9f6]/80 border border-luxury-stone rounded-xl text-[10.5px] text-neutral-550 leading-relaxed font-light">
                  <span className="font-mono text-[9px] uppercase font-bold text-luxury-earth block mb-1">
                    ✦ Zoning Disclosure & Planning Disclaimer
                  </span>
                  This permitting checklist represents subjective estimates of local zoning pathways based on historical regional records. It is intended solely as an interactive planning reference and timeline scoping aid. <strong>This checklist does not constitute professional engineering, architectural surveyor, or land-use legal advice.</strong> Real-world local municipal ordinances and environmental agency parameters are subject to frequent updates; always contract licensed regional design engineers and building specialists to perform full zoning audits on-site.
                </div>
              </div>

              <div className="border border-luxury-stone rounded-xl p-5 bg-white space-y-4 shadow-sm">
                
                {/* Feasibility Risk Score Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-luxury-earth">Zoning Complexity Indicator</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border leading-none font-semibold ${
                        currentCompliancePreset.riskScore >= 8 
                          ? 'bg-rose-50 text-rose-800 border-rose-100'
                          : currentCompliancePreset.riskScore >= 5
                            ? 'bg-amber-50 text-amber-800 border-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }`}>
                        {currentCompliancePreset.riskClassification}
                      </span>
                      <span className="font-serif text-base font-medium text-luxury-charcoal">
                        {currentCompliancePreset.riskScore} <span className="text-xs text-neutral-400">/ 10</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Gauge */}
                  <div className="h-2 w-full bg-[#f1f0ee] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentCompliancePreset.riskScore >= 8 
                          ? 'bg-rose-500'
                          : currentCompliancePreset.riskScore >= 5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${currentCompliancePreset.riskScore * 10}%` }}
                    />
                  </div>

                  <p className="text-[10.5px] text-neutral-500 leading-normal font-sans">
                    <span className="font-semibold text-luxury-charcoal">Pre-Permit Scope:</span> {currentCompliancePreset.permitCategories}
                  </p>
                </div>

                {/* Interactive Checklist list */}
                <div className="space-y-2.5 pt-2 border-t border-luxury-stone/40">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-luxury-earth block">
                    Regulatory & Planning Checkpoints
                  </span>

                  <div className="space-y-2">
                    {currentCompliancePreset.checklist.map((hurdle: any) => {
                      const isChecked = !!checkedHurdles[hurdle.id];
                      return (
                        <div 
                          key={hurdle.id}
                          onClick={() => setCheckedHurdles(prev => ({ ...prev, [hurdle.id]: !isChecked }))}
                          className={`p-3 rounded-lg border transition duration-200 cursor-pointer flex gap-3 items-start select-none ${
                            isChecked 
                              ? 'bg-neutral-50/50 border-neutral-300' 
                              : 'bg-white border-luxury-stone hover:border-luxury-earth/50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 transition duration-200 ${
                            isChecked 
                              ? 'bg-luxury-charcoal border-luxury-charcoal text-white' 
                              : 'border-luxury-stone bg-white text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex justify-between items-baseline gap-2">
                              <span className={`text-[11px] font-semibold text-luxury-charcoal ${isChecked ? 'line-through text-neutral-450' : ''}`}>
                                {hurdle.title}
                              </span>
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                hurdle.difficulty === 'Extreme'
                                  ? 'bg-red-50 text-red-700'
                                  : hurdle.difficulty === 'High'
                                    ? 'bg-orange-50 text-orange-700'
                                    : hurdle.difficulty === 'Medium'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {hurdle.difficulty}
                              </span>
                            </div>
                            <p className={`text-[10.5px] leading-relaxed text-neutral-500 ${isChecked ? 'text-neutral-400' : ''}`}>
                              {hurdle.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connect with regional expert trigger */}
                <div className="pt-3 border-t border-luxury-stone/40">
                  <button
                    type="button"
                    onClick={() => setIsArchitectModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded bg-luxury-charcoal hover:bg-neutral-800 text-white font-mono text-[9px] uppercase font-bold tracking-widest transition duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-luxury-earth" />
                    Connect with Regional Specialist Architect
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Micro Information Alert */}
          <div className="mt-6 flex gap-2 items-start text-[10px] text-luxury-earth font-mono leading-relaxed bg-[#faf9f6] p-4 border border-luxury-stone rounded-lg">
            <Info className="w-3.5 h-3.5 text-luxury-earth shrink-0" />
            <span>
              The 5-Year model compounds Year 1 metrics forward at 3% annually whilst keeping raw operating expenditure flat. Negative net values reflect structural deficit settings.
            </span>
          </div>

        </div>

        {showProcurement && (
          <div className="lg:col-span-3 print:hidden">
            <React.Suspense fallback={
              <div className="p-6 border border-luxury-stone bg-[#faf9f6]/40 rounded-xl space-y-3 font-mono text-[10px] text-luxury-earth uppercase tracking-widest animate-pulse h-[400px] flex flex-col justify-center items-center">
                <span>Loading Procurement System...</span>
              </div>
            }>
              <ProcurementSidebar />
            </React.Suspense>
          </div>
        )}
      </div>

      {/* "How This Model Works" Section for Methodological Transparency & Authoritative Trust */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 mt-6 border-t border-luxury-stone space-y-8 bg-white/20 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline gap-2 pb-4 border-b border-luxury-stone/60">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth font-extrabold block">
              Methodology & Architecture Roadmap
            </span>
            <h3 className="font-serif text-2xl font-light text-luxury-charcoal leading-tight">
              Accounting Infrastructure & Calculations
            </h3>
          </div>
          <div className="font-mono text-[9.5px] text-luxury-earth uppercase tracking-widest bg-luxury-cream/40 px-3 py-1 rounded border border-luxury-stone">
            Underwritten to Hospitality Standards
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {/* Factor 1 */}
          <div className="space-y-3 p-4 bg-white/55 border border-luxury-stone/80 rounded-xl shadow-xs hover:border-luxury-earth/50 transition duration-300">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-luxury-earth/10 text-luxury-earth font-mono text-[11px] font-bold">
                01
              </span>
              <h4 className="font-serif text-sm font-medium text-luxury-charcoal">
                Assumptions & Baseline
              </h4>
            </div>
            <p className="text-[11.5px] text-luxury-clay leading-relaxed">
              Users input property count, rates, occupancy, and development capital. Overlaid location benchmarks (Coast, Kyoto, Amalfi) adjust these dynamically based on real zoning audits, lodging tax records, and local construction indices.
            </p>
            <div className="text-[9.5px] font-mono text-neutral-400">
              Source: Illustrative or Preset Regional Proxy
            </div>
          </div>

          {/* Factor 2 */}
          <div className="space-y-3 p-4 bg-white/55 border border-luxury-stone/80 rounded-xl shadow-xs hover:border-luxury-earth/50 transition duration-300">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-luxury-earth/10 text-luxury-earth font-mono text-[11px] font-bold">
                02
              </span>
              <h4 className="font-serif text-sm font-medium text-luxury-charcoal">
                Core ROI Projections
              </h4>
            </div>
            <p className="text-[11.5px] text-luxury-clay leading-relaxed">
              Calculates daily accommodation yields and secondary guest spend. Gross Revenue compounds at 3% annually over a 5-Yr horizon, while Net Cashflow deducts fixed operating overheads to evaluate long-term payback feasibility.
            </p>
            <div className="text-[9.5px] font-mono text-neutral-400">
              Formula: Gross Revenue - Annual OpEx
            </div>
          </div>

          {/* Factor 3 */}
          <div className="space-y-3 p-4 bg-white/55 border border-luxury-stone/80 rounded-xl shadow-xs hover:border-luxury-earth/50 transition duration-300">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-luxury-earth/10 text-luxury-earth font-mono text-[11px] font-bold">
                03
              </span>
              <h4 className="font-serif text-sm font-medium text-luxury-charcoal">
                Decompression Stressing
              </h4>
            </div>
            <p className="text-[11.5px] text-luxury-clay leading-relaxed">
              Assesses capital resilience against simulated macro-economic downcycles. Activating this toggle automatically processes a severe 20% room-tariff contract accompanied by a 15% increase in baseline monthly operating expenses.
            </p>
            <div className="text-[9.5px] font-mono text-neutral-400">
              Risk modeling: Severe Downside Scenario
            </div>
          </div>

          {/* Factor 4 */}
          <div className="space-y-3 p-4 bg-[#fbfbf9]/60 border border-luxury-stone/80 rounded-xl shadow-xs hover:border-luxury-earth/50 transition duration-300">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-luxury-earth/10 text-luxury-earth font-mono text-[11px] font-bold">
                04
              </span>
              <h4 className="font-serif text-sm font-medium text-luxury-charcoal">
                Tax & Disposition Options
              </h4>
            </div>
            <p className="text-[11.5px] text-luxury-clay leading-relaxed">
              Integrates cost segregation asset write-off rules (such as straight-line vs. 5-year accelerated MACRS depreciation) alongside 5-Yr compounded property appreciation and sale proceed estimates upon final exit.
            </p>
            <div className="text-[9.5px] font-mono text-neutral-400">
              Audit level: IRS Tax & Brokerage Comms
            </div>
          </div>
        </div>

        {/* Micro audit notice */}
        <p className="text-[10.5px] font-mono text-neutral-400 italic text-center max-w-4xl mx-auto leading-relaxed pt-2 animate-pulse pb-2">
          Note: This feasibility calculations suite follows premium boutique real estate modeling and cost segregation auditing principles. Always consult certified financial advisors and landuse attorneys before underwriting active capital.
        </p>
      </div>

      {/* High-Contrast Pro Export Work Station Card */}
      <div className="border-t-2 border-luxury-stone bg-[#171717] p-6 md:p-8 text-neutral-100 print:hidden relative overflow-hidden">
        {/* Subtle decorative grid/accents for luxury tech feel */}
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        
        <div className="relative z-10 space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 font-bold">DEVELOPER CONSOLE</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-light text-white leading-tight">
                Corporate Feasibility & Distribution Suite
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                Save scenario states to browser memory, compile design packages, or extract clean embedding codes for external distribution.
              </p>
            </div>
            <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest border border-neutral-800 px-3 py-1 bg-neutral-900 rounded">
              AUDITED PRO-FORMA SUITE V1.2
            </div>
          </div>

          {/* Three-Column Professional Tool Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tool 1: Save pro-forma model scenario */}
            <div className="p-5 bg-neutral-900/60 border border-neutral-805 rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-500 font-mono">
                  <Save className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">01 / SAVE MODEL</span>
                </div>
                <h4 className="font-serif text-sm font-medium text-white">Save Model</h4>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Save your active custom parameters (ADR, Occupancy, and CapEx) directly to your local browser storage to reload them in future sessions.
                </p>
              </div>

              <form onSubmit={handleSaveProjectForm} className="space-y-2 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    maxLength={35}
                    placeholder="E.g., Tahoe Ridge Cabin"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-neutral-800 bg-neutral-950 text-white rounded focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-neutral-600 font-medium disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isSaving}
                  className={`w-full py-2.5 px-3 font-mono text-[10px] uppercase tracking-wider rounded border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSaving
                      ? 'border-neutral-800 text-neutral-500 bg-neutral-950 cursor-wait'
                      : saveSuccess
                      ? 'border-emerald-500 text-white bg-emerald-700 font-bold shadow-sm'
                      : newProjectName.trim()
                      ? 'border-amber-400 text-neutral-950 bg-[#e5b95d] hover:bg-[#d4a84c] font-bold shadow-sm'
                      : 'border-neutral-800 text-neutral-600 cursor-not-allowed bg-neutral-950'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : saveSuccess ? (
                    <Check className="w-3.5 h-3.5 text-white animate-pulse" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving Model...' : saveSuccess ? 'Model Saved!' : 'Save Model'}
                </button>
              </form>
            </div>

            {/* Tool 2: Investor Pitch Deck Generator */}
            <div className="p-5 bg-neutral-900/60 border border-neutral-805 rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-500 font-mono">
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">02 / EXPORT DECK</span>
                </div>
                <h4 className="font-serif text-sm font-medium text-white">Export Pitch Deck</h4>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Generate a styled two-page feasibility presentation summarizing structural margins, location offsets, and tax-depreciation models for potential stakeholders.
                </p>
              </div>

              <div className="pt-4 flex justify-start">
                <PitchDeckGenerator />
              </div>
            </div>

            {/* Tool 3: Distribution Embed Engine */}
            <div className="p-5 bg-neutral-900/60 border border-neutral-805 rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-500 font-mono">
                  <Code className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">03 / EMBED WIDGET</span>
                </div>
                <h4 className="font-serif text-sm font-medium text-white">Embed Widget</h4>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Generate a responsive iframe snippet to embed this calculator into external client portals, design proposals, or project website dashboards.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateWidget}
                  disabled={isGeneratingWidget}
                  className={`w-full py-2.5 px-3 font-mono text-[10px] uppercase tracking-wider rounded border transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isGeneratingWidget
                      ? 'border-neutral-850 text-neutral-500 bg-[#121212] cursor-wait'
                      : widgetSuccess || showEmbed
                      ? 'border-amber-400 text-amber-400 bg-[#1e1a11] font-bold shadow-md'
                      : 'border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800'
                  }`}
                >
                  {isGeneratingWidget ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : widgetSuccess || showEmbed ? (
                    <Check className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : (
                    <Code className="w-3.5 h-3.5 text-neutral-450" />
                  )}
                  {isGeneratingWidget 
                    ? 'Generating Embed Code...' 
                    : showEmbed 
                    ? 'Deactivate Embed' 
                    : 'Embed Widget'}
                </button>
              </div>
            </div>

          </div>

          {/* Conditional reveals of raw copy code block with transition styling */}
          {showEmbed && (
            <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-3 duration-250">
              <div className="flex justify-between items-center bg-transparent pb-1.5 border-b border-neutral-900">
                <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest font-bold">
                  IFRAME HTML EMBED INTEGRATION
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="font-mono text-[10px] text-amber-500 hover:text-white transition flex items-center gap-1 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'EMBED COPIED' : 'COPY RAW CODE'}
                </button>
              </div>
              <textarea
                readOnly
                value={embedCode}
                rows={2}
                className="w-full text-[11px] font-mono p-3 bg-neutral-900 border border-neutral-850 rounded text-neutral-350 focus:outline-none focus:ring-0 ring-0"
              />
              <p className="text-[10px] font-sans text-neutral-500 leading-normal">
                Supports responsive container scaling, inherits cross-origin sandbox parameters, and operates in zero-HMR workspace mode.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Lead Capture Modal for Specialist Architect Guidance */}
      {isArchitectModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsArchitectModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-[#faf9f6] border border-luxury-stone p-6 sm:p-8 rounded-xl max-w-md w-full shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-luxury-charcoal">
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setIsArchitectModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-luxury-charcoal transition cursor-pointer font-mono text-[11px]"
            >
              ✕ CLOSE
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth font-bold block">
                  Aura & Grid Advisory
                </span>
                <h3 className="font-serif text-xl font-light leading-tight">
                  Connect with Permit Specialist Architect
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Our regional consultants coordinate structural validation, native flora zoning, and local permit approval protocols for the <strong className="font-medium text-luxury-charcoal">{resolvedLocationName}</strong> sector.
                </p>
              </div>

              {leadSubmitted ? (
                <div className="py-6 space-y-3 text-center bg-white border border-luxury-stone p-4 rounded-lg animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base font-light text-luxury-charcoal">Professional Connection Requested</h4>
                    <p className="text-[10.5px] text-neutral-550 leading-relaxed max-w-xs mx-auto">
                      Thank you, {leadName}. A senior permit architect covering the {resolvedLocationName} region will review your parameters of {formatCurrency(activeInputs.capex)} capoutlay and reach out at <strong>{leadEmail}</strong> within 24 business hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsArchitectModalOpen(false);
                      setLeadSubmitted(false);
                      setLeadName('');
                      setLeadEmail('');
                    }}
                    className="mt-2 px-4 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider rounded border border-luxury-stone hover:bg-[#faf9f6]/55 transition cursor-pointer"
                  >
                    Return to calculations
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const nextErrors: { name?: string; email?: string } = {};
                    if (!leadName.trim()) nextErrors.name = "Full Name is required.";
                    if (!leadEmail.trim()) {
                      nextErrors.email = "Email is required.";
                    } else if (!/\S+@\S+\.\S+/.test(leadEmail)) {
                      nextErrors.email = "Please supply a valid professional email.";
                    }

                    if (Object.keys(nextErrors).length > 0) {
                      setErrors(nextErrors);
                      return;
                    }

                    setErrors({});
                    setLeadSubmitted(true);
                  }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-luxury-earth block font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lauren Vance"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-luxury-stone bg-white rounded focus:outline-none focus:ring-1 focus:ring-luxury-earth text-luxury-charcoal placeholder-neutral-400"
                    />
                    {errors.name && (
                      <p className="text-[10px] text-rose-500 font-mono mt-0.5">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-luxury-earth block font-semibold">
                      Professional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. lvance@vance-developments.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-luxury-stone bg-white rounded focus:outline-none focus:ring-1 focus:ring-luxury-earth text-luxury-charcoal placeholder-neutral-400"
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-500 font-mono mt-0.5">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-neutral-400 block">
                      Target Project Scope (Optional)
                    </label>
                    <textarea
                      rows={2}
                      readOnly
                      value={`${resolvedPropertyType} development project in ${resolvedLocationName} region with total capoutlay limit of ${formatCurrency(activeInputs.capex)}.`}
                      className="w-full text-[10.5px] font-mono py-2 px-3 border border-luxury-stone bg-[#faf9f6]/70 rounded text-neutral-500 focus:outline-none cursor-not-allowed resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded bg-luxury-charcoal hover:bg-neutral-800 text-white font-mono text-[9px] uppercase font-bold tracking-widest transition duration-150 cursor-pointer"
                    >
                      Submit Advisory Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Methodology Dialogue Overlay Popup */}
      {activeMethodologyKey && (() => {
        const details = getMethodologyDetails(activeMethodologyKey);
        return (
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setActiveMethodologyKey(null)}
            />
            
            {/* Modal Container */}
            <div className="relative bg-[#faf9f6]/95 border-2 border-luxury-stone p-6 sm:p-8 rounded-xl max-w-md w-full shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-luxury-charcoal backdrop-blur-xs">
              {/* Close button */}
              <button 
                type="button"
                onClick={() => setActiveMethodologyKey(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-luxury-charcoal transition cursor-pointer font-mono text-[11px]"
              >
                ✕ CLOSE
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-earth font-bold block">
                    Calculations Auditing
                  </span>
                  <p className="font-serif text-xs text-neutral-400 capitalize tracking-wide">
                    Parameter: {
                      activeMethodologyKey === 'adr' ? 'Average Daily Rate (ADR)' :
                      activeMethodologyKey === 'occupancy' ? 'Yearly Occupancy' :
                      activeMethodologyKey === 'units' ? 'Room Key Count' :
                      activeMethodologyKey === 'upsell' ? 'Ancillary Guest Spend' :
                      activeMethodologyKey === 'opex' ? 'Monthly Operating Expenses' :
                      activeMethodologyKey === 'capex' ? 'Capital Expenditures (CapEx)' :
                      activeMethodologyKey === 'grossAnnualRevenue' ? 'Gross Annual Revenue' :
                      activeMethodologyKey === 'netAnnualCashflow' ? 'Net Annual Cash Flow' :
                      activeMethodologyKey === 'paybackPeriod' ? 'Setup Payback Period' :
                      activeMethodologyKey === 'depreciationShield' ? 'Annual Tax Shield (Yr 1)' :
                      activeMethodologyKey === 'exitProceeds' ? 'Projected Net Exit Proceeds' :
                      activeMethodologyKey
                    }
                  </p>
                  <h3 className="font-serif text-xl font-light leading-tight">
                    Methodology Profile
                  </h3>
                </div>

                <div className="p-3 bg-white/60 border border-luxury-stone rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`w-2 h-2 rounded-full ${details.isMarketBacked ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span className={`font-semibold uppercase tracking-wider ${details.isMarketBacked ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {details.sourceLabel}
                    </span>
                  </div>
                  {details.baselineValueStr && (
                    <p className="font-mono text-[10px] text-neutral-400 leading-none">
                      {details.baselineValueStr}
                    </p>
                  )}
                </div>

                <div className="text-[11.5px] text-neutral-600 leading-relaxed bg-white/30 border border-neutral-100 p-3 rounded text-left">
                  {details.explanation}
                </div>

                {details.authorityNote && (
                  <div className="p-3 bg-luxury-cream/40 border border-luxury-stone/80 rounded-lg text-[9.5px] text-luxury-clay leading-relaxed font-mono text-left">
                    <p>
                      <strong className="text-luxury-earth uppercase tracking-wider block mb-1">REGULATORY COMPLIANCE / SOVEREIGN BACKING</strong>
                      {details.authorityNote}
                    </p>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveMethodologyKey(null)}
                    className="w-full py-2.5 px-4 rounded bg-luxury-charcoal hover:bg-neutral-800 text-white font-mono text-[9px] uppercase font-bold tracking-widest transition duration-150 cursor-pointer"
                  >
                    Confirm & Understood
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
    </>
  );
}
