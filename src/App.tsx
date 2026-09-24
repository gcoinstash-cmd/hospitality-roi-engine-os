import React, { useState, useMemo, Suspense } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Coins,
  Clock,
  ChevronRight,
  Sliders,
  Check,
  ShieldAlert,
  HardHat,
  BookmarkCheck,
  Trash2,
  SlidersHorizontal,
  FileText,
  ArrowLeft,
  Globe,
  Flame
} from 'lucide-react';
import { calculateHospitalityROI, HospitalityROIInput, YearProjection } from './utils/formulas';
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateContext';
import ProcurementSidebar from './components/ProcurementSidebar';
import PitchDeckGenerator from './components/PitchDeckGenerator';
import PseoStudio from './components/PseoStudio';
import StressTestToggle from './components/StressTestToggle';
import AdminPortalModal from './components/AdminPortalModal';
import { FolderLock } from 'lucide-react';

function AppContent() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  React.useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin')) {
      setIsAdminOpen(true);
    }
  }, []);
  const {
    inputs,
    handleSliderChange,
    metrics,
    savedProjects,
    newProjectName,
    setNewProjectName,
    handleSaveProject,
    handleDeleteProject,
    handleSelectProject,
    setInputs,
    resolvedProjectName,
    saveStreak,
    showToast
  } = useGlobalState();
  
  // Step state management (strictly 1, 2, 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Advanced Details Section visibility in Step 3
  const [seeAdvancedDetails, setSeeAdvancedDetails] = useState<boolean>(false);

  // State to manage showing the Achievement congratulatory model overlay
  const [showAchievement, setShowAchievement] = useState<boolean>(false);

  // Local synced textual input states to prevent jumping / broken-typing cursor behaviors
  const [adrText, setAdrText] = useState(inputs.adr.toString());
  const [occupancyText, setOccupancyText] = useState(inputs.occupancy.toString());
  const [unitsText, setUnitsText] = useState(inputs.units.toString());
  const [capexText, setCapexText] = useState(inputs.capex.toString());

  React.useEffect(() => {
    setAdrText(inputs.adr.toString());
  }, [inputs.adr]);

  React.useEffect(() => {
    setOccupancyText(inputs.occupancy.toString());
  }, [inputs.occupancy]);

  React.useEffect(() => {
    setUnitsText(inputs.units.toString());
  }, [inputs.units]);

  React.useEffect(() => {
    setCapexText(inputs.capex.toString());
  }, [inputs.capex]);

  // Unified Currency formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatWithCommas = (val: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
  };

  const handleSeeResults = () => {
    setCurrentStep(3);
    setShowAchievement(true);
    showToast(
      `Scenario Validated! ${inputs.units} unit${inputs.units === 1 ? '' : 's'} at ${inputs.occupancy}% occupancy projected at ${formatCurrency(metrics.grossAnnualRevenue)} gross annual revenue.`, 
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-luxury-cream text-luxury-charcoal selection:bg-luxury-stone font-sans flex flex-col antialiased">
      
      {/* Main Single Column Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-14 md:py-24 space-y-12 md:space-y-16">
        
        {/* Curated Introduction Block - Aura & Grid Brand appears once, lighter, secondary */}
        <div className="text-center">
          <span className="font-sans text-[10px] tracking-[0.25em] text-luxury-clay select-none opacity-60 font-light block mb-4">
            Aura & Grid
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-luxury-charcoal tracking-tight leading-tight mb-3">
            Hospitality ROI Calculator
          </h1>
          <p className="text-xs sm:text-sm text-luxury-earth max-w-lg mx-auto leading-relaxed font-light">
            Estimate revenue, profit, and payback for your project.
          </p>
        </div>

        {/* Project Completion Progress Bar */}
        <div className="space-y-2.5 select-none max-w-[480px] w-full mx-auto bg-white/40 p-4 rounded-2xl border border-luxury-stone/30">
          <div className="flex justify-between items-center text-[10px] font-sans tracking-[0.12em] uppercase font-semibold text-neutral-500">
            <span className="flex items-center gap-1">
              <Check className={`w-3 h-3 ${currentStep === 3 ? "text-luxury-charcoal" : "text-luxury-earth"}`} />
              Project Completion
            </span>
            <span className="font-mono text-[11px] text-luxury-clay font-bold">
              {currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100% (Completed!)"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-200/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "33%" }}
              animate={{ 
                width: currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%" 
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${
                currentStep === 3 
                  ? "from-luxury-clay to-luxury-charcoal" 
                  : "from-luxury-earth to-luxury-clay"
              }`}
            />
          </div>
        </div>

        {/* Dynamic 3-Step Wizard Navigation */}
        <div className="flex justify-center select-none">
          <div className="bg-[#faf9f6]/20 p-1 grid grid-cols-3 gap-2 sm:gap-3 relative z-10 w-full max-w-[480px] rounded-full">
            {[
              { step: 1, name: 'Project details', short: 'Details' },
              { step: 2, name: 'Operational metrics', short: 'Metrics' },
              { step: 3, name: 'Financial results', short: 'Results' }
            ].map((item) => {
              const isActive = currentStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setCurrentStep(item.step as 1 | 2 | 3)}
                  className={`py-2 px-1.5 sm:px-3 rounded-full transition-all duration-300 relative cursor-pointer flex items-center justify-center text-center select-none border text-[11px] sm:text-xs tracking-wide ${
                    isActive 
                      ? 'bg-luxury-clay text-white border-luxury-clay font-medium shadow-3xs' 
                      : 'bg-white/80 border-luxury-stone/60 text-[#8c857b] hover:text-luxury-charcoal hover:bg-white hover:border-luxury-earth/25 font-light'
                  }`}
                >
                  <span className="font-sans whitespace-nowrap">
                    <span className="sm:inline hidden">{item.step}. {item.name}</span>
                    <span className="sm:hidden inline">{item.step}. {item.short}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Step Content with motion-guided Transitions */}
        <div className="relative pt-4 sm:pt-6 pb-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: PROJECT DETAILS */}
            {currentStep === 1 && (
              <motion.div
                key="step-project-details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white border border-luxury-stone/50 p-8 md:p-10 rounded-2xl shadow-3xs space-y-10"
              >
                {/* Section Header */}
                <div className="pb-4 flex items-center justify-between border-b border-luxury-stone/25">
                  <h2 className="text-sm font-sans text-luxury-charcoal font-semibold select-none">
                    Project details
                  </h2>
                  <Sparkles className="w-4 h-4 text-luxury-earth opacity-60" />
                </div>

                {/* Optional Quick-fill Presets */}
                <div className="flex flex-col gap-3 pb-8 border-b border-luxury-stone/15">
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[10px] uppercase tracking-wider font-sans text-neutral-400 font-light">
                      Try an example
                    </span>
                    <span className="h-[1px] bg-luxury-stone/15 flex-1"></span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      {
                        name: "Small cabin retreat",
                        inputs: { adr: 180, occupancy: 60, units: 3, capex: 250000, opex: 2000, upsell: 60 }
                      },
                      {
                        name: "Mid-size boutique stay",
                        inputs: { adr: 350, occupancy: 65, units: 12, capex: 1800000, opex: 15000, upsell: 120 }
                      },
                      {
                        name: "Large vacation property",
                        inputs: { adr: 650, occupancy: 70, units: 25, capex: 5000000, opex: 45000, upsell: 200 }
                      }
                    ].map((preset) => {
                      const isMatched = 
                        inputs.adr === preset.inputs.adr &&
                        inputs.occupancy === preset.inputs.occupancy &&
                        inputs.units === preset.inputs.units &&
                        inputs.capex === preset.inputs.capex;

                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setInputs((prev: any) => ({
                              ...prev,
                              ...preset.inputs
                            }));
                          }}
                          className={`py-1.5 px-3 rounded-full text-center cursor-pointer text-[10.5px] font-sans transition-all duration-300 border select-none ${
                            isMatched
                              ? 'bg-luxury-clay/8 text-luxury-earth border-luxury-earth/25 font-normal'
                              : 'bg-transparent text-neutral-400 border-neutral-250/20 hover:border-neutral-300/40 hover:text-neutral-600'
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Input Groups */}
                <div className="space-y-10">
                  
                  {/* Category 2: Properties & Capital */}
                  <div className="p-6 md:p-8 rounded-2xl border border-luxury-stone/40 bg-[#faf9f6]/20 space-y-8 transition duration-300 hover:border-luxury-stone">
                    <h4 className="text-xs font-sans text-luxury-charcoal/80 font-semibold border-b border-luxury-stone/20 pb-3 flex items-center gap-2">
                      Property & startup details
                    </h4>

                    {/* Slider 3: Units */}
                    <div className="space-y-3">
                      <label id="units-input-label" className="block text-xs font-sans tracking-wide text-neutral-600 font-semibold mb-1">
                        Number of units
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={inputs.units}
                            onChange={(e) => handleSliderChange('units', Number(e.target.value))}
                            className="premium-slider w-full cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={unitsText || inputs.units.toString()}
                            onChange={(e) => {
                              const valText = e.target.value;
                              if (valText === "") {
                                setUnitsText(inputs.units.toString());
                                return;
                              }
                              setUnitsText(valText);
                              const num = Number(valText);
                              if (!isNaN(num)) {
                                handleSliderChange('units', num);
                              }
                            }}
                            onBlur={() => {
                              const num = Number(unitsText);
                              const clamped = isNaN(num) || unitsText === ""
                                ? Math.max(1, Math.min(50, inputs.units))
                                : Math.max(1, Math.min(50, Math.round(num)));
                              setUnitsText(clamped.toString());
                              handleSliderChange('units', clamped);
                            }}
                            className="w-24 min-w-[96px] h-10 min-h-[40px] shrink-0 text-right font-mono text-xs font-semibold py-2 border border-luxury-stone/85 rounded px-3 bg-white text-luxury-charcoal focus:bg-white focus:outline-none focus:ring-1 focus:ring-luxury-earth transition-all"
                          />
                          <span className="text-neutral-400 font-mono text-xs shrink-0 select-none">units</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-sans text-neutral-400 leading-relaxed font-light">
                        The total number of individual cabins, domes, or rooms you rent out.
                      </div>
                    </div>

                    {/* Slider 4: Startup cost */}
                    <div className="space-y-3">
                      <label id="capex-input-label" className="block text-xs font-sans tracking-wide text-neutral-600 font-semibold mb-1">
                        Startup cost
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="range"
                            min="1000"
                            max="10000000"
                            step="10000"
                            value={inputs.capex}
                            onChange={(e) => handleSliderChange('capex', Number(e.target.value))}
                            className="premium-slider w-full cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-neutral-400 font-mono text-xs font-medium select-none">$</span>
                          <input
                            type="number"
                            min={1000}
                            max={10000000}
                            value={capexText || inputs.capex.toString()}
                            onChange={(e) => {
                              const valText = e.target.value;
                              if (valText === "") {
                                setCapexText(inputs.capex.toString());
                                return;
                              }
                              setCapexText(valText);
                              const num = Number(valText);
                              if (!isNaN(num)) {
                                handleSliderChange('capex', num);
                              }
                            }}
                            onBlur={() => {
                              const num = Number(capexText);
                              const clamped = isNaN(num) || capexText === ""
                                ? Math.max(1000, Math.min(10000000, inputs.capex))
                                : Math.max(1000, Math.min(10000000, Math.round(num)));
                              setCapexText(clamped.toString());
                              handleSliderChange('capex', clamped);
                            }}
                            className="w-36 min-w-[144px] h-10 min-h-[40px] shrink-0 text-right font-mono text-xs font-semibold py-2 border border-luxury-stone/85 rounded px-3 bg-white text-luxury-charcoal focus:bg-white focus:outline-none focus:ring-1 focus:ring-luxury-earth transition-all"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] font-sans text-neutral-400 leading-relaxed font-light">
                        The estimated cost to purchase, build, furnish, and launch your project.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Call to Action Pin */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-4 bg-luxury-clay hover:bg-luxury-charcoal text-white font-sans text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group transform active:scale-[0.99] shadow-sm"
                  >
                    See results
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5 text-luxury-earth" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: OPERATIONAL METRICS */}
            {currentStep === 2 && (
              <motion.div
                key="step-operational-metrics"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white border border-luxury-stone/50 p-8 md:p-10 rounded-2xl shadow-3xs space-y-10"
              >
                {/* Section Header */}
                <div className="pb-4 flex items-center justify-between border-b border-luxury-stone/25">
                  <h2 className="text-sm font-sans text-luxury-charcoal font-semibold select-none">
                    Operational metrics
                  </h2>
                  <Sliders className="w-4 h-4 text-luxury-earth opacity-60" />
                </div>

                {/* Rates & occupancy inputs */}
                <div className="space-y-10">
                  <div className="p-6 md:p-8 rounded-2xl border border-luxury-stone/40 bg-[#faf9f6]/20 space-y-8 transition duration-300 hover:border-luxury-stone">
                    <h4 className="text-xs font-sans text-luxury-charcoal/80 font-semibold border-b border-luxury-stone/20 pb-3 flex items-center gap-2">
                      Rates & occupancy
                    </h4>

                    {/* Slider 1: Nightly rate */}
                    <div className="space-y-3">
                      <label id="adr-input-label" className="block text-xs font-sans tracking-wide text-neutral-600 font-semibold mb-1">
                        Nightly rate
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="range"
                            min="50"
                            max="3000"
                            step="25"
                            value={inputs.adr}
                            onChange={(e) => handleSliderChange('adr', Number(e.target.value))}
                            className="premium-slider w-full cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-neutral-400 font-mono text-xs font-medium select-none">$</span>
                          <input
                            type="number"
                            min={50}
                            max={3000}
                            value={adrText || inputs.adr.toString()}
                            onChange={(e) => {
                              const valText = e.target.value;
                              if (valText === "") {
                                setAdrText(inputs.adr.toString());
                                return;
                              }
                              setAdrText(valText);
                              const num = Number(valText);
                              if (!isNaN(num)) {
                                handleSliderChange('adr', num);
                              }
                            }}
                            onBlur={() => {
                              const num = Number(adrText);
                              const clamped = isNaN(num) || adrText === ""
                                ? Math.max(50, Math.min(3000, inputs.adr))
                                : Math.max(50, Math.min(3000, Math.round(num)));
                              setAdrText(clamped.toString());
                              handleSliderChange('adr', clamped);
                            }}
                            className="w-28 min-w-[110px] h-10 min-h-[40px] shrink-0 text-right font-mono text-xs font-semibold py-2 border border-luxury-stone/85 rounded px-3 bg-white text-luxury-charcoal focus:bg-white focus:outline-none focus:ring-1 focus:ring-luxury-earth transition-all"
                          />
                          <span className="text-neutral-400 font-mono text-xs shrink-0 select-none">/ night</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-sans text-neutral-400 leading-relaxed font-light">
                        The average price you expect to charge guests per night.
                      </div>
                    </div>

                    {/* Slider 2: Occupancy */}
                    <div className="space-y-3">
                      <label id="occupancy-input-label" className="block text-xs font-sans tracking-wide text-neutral-600 font-semibold mb-1">
                        Expected occupancy
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="1"
                            value={inputs.occupancy}
                            onChange={(e) => handleSliderChange('occupancy', Number(e.target.value))}
                            className="premium-slider w-full cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={occupancyText || inputs.occupancy.toString()}
                            onChange={(e) => {
                              const valText = e.target.value;
                              if (valText === "") {
                                setOccupancyText(inputs.occupancy.toString());
                                return;
                              }
                              setOccupancyText(valText);
                              const num = Number(valText);
                              if (!isNaN(num)) {
                                handleSliderChange('occupancy', num);
                              }
                            }}
                            onBlur={() => {
                              const num = Number(occupancyText);
                              const clamped = isNaN(num) || occupancyText === ""
                                ? Math.max(10, Math.min(100, inputs.occupancy))
                                : Math.max(10, Math.min(100, Math.round(num)));
                              setOccupancyText(clamped.toString());
                              handleSliderChange('occupancy', clamped);
                            }}
                            className="w-24 min-w-[96px] h-10 min-h-[40px] shrink-0 text-right font-mono text-xs font-semibold py-2 border border-luxury-stone/85 rounded px-3 bg-white text-luxury-charcoal focus:bg-white focus:outline-none focus:ring-1 focus:ring-luxury-earth transition-all"
                          />
                          <span className="text-neutral-400 font-mono text-xs shrink-0 select-none">%</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-sans text-neutral-400 leading-relaxed font-light">
                        The average percentage of nights each year your units are booked.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Step Controls */}
                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 border border-luxury-stone hover:bg-neutral-50 text-luxury-charcoal font-sans text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 text-luxury-earth" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSeeResults}
                    className="flex-1 py-4 bg-luxury-clay hover:bg-luxury-charcoal text-white font-sans text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group transform active:scale-[0.99] shadow-sm"
                  >
                    See results
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5 text-luxury-earth" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: FINANCIAL RESULTS & CORES */}
            {currentStep === 3 && (
              <motion.div
                key="step-financial-results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white border border-luxury-stone p-6 md:p-8 rounded-2xl shadow-sm space-y-8"
              >
                {/* Section Header */}
                <div className="pb-4 flex items-center justify-between border-b border-luxury-stone/25">
                  <h2 className="text-sm font-sans text-luxury-charcoal font-semibold select-none">
                    Financial results
                  </h2>
                  <Coins className="w-4 h-4 text-luxury-earth opacity-60" />
                </div>

                <div className="pb-3 text-center">
                  <span className="text-xs font-sans text-neutral-500 font-medium tracking-wide">
                    Your calculated projection
                  </span>
                </div>

                {/* Performance Cards Stack */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Gross Revenue */}
                  <div className="p-5 bg-white border border-luxury-stone/80 rounded-xl space-y-2 transition duration-350 hover:border-luxury-earth hover:shadow-xs group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-luxury-earth" />
                        <span className="font-sans text-xs font-semibold text-neutral-600 tracking-wide">
                          Yearly revenue
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-neutral-400 font-light select-none">Gross</span>
                    </div>
                    <div className="font-serif text-3xl font-light text-luxury-charcoal">
                      {formatCurrency(metrics.grossAnnualRevenue)}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                      Based on <span className="font-sans font-medium text-luxury-charcoal">{formatWithCommas(metrics.bookedNights)}</span> booked nights.
                    </p>
                  </div>

                  {/* Net Profit */}
                  <div className="p-5 bg-white border border-luxury-stone/80 rounded-xl space-y-2 transition duration-350 hover:border-luxury-earth hover:shadow-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-luxury-earth" />
                        <span className="font-sans text-xs font-semibold text-neutral-600 tracking-wide">
                          Yearly profit
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-neutral-400 font-light select-none">Net</span>
                    </div>
                    <div className={`font-serif text-3xl font-light ${metrics.netAnnualCashflow >= 0 ? 'text-luxury-charcoal' : 'text-rose-600'}`}>
                      {formatCurrency(metrics.netAnnualCashflow)}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                      Deducting <span className="font-sans font-medium text-neutral-600">{formatCurrency(inputs.opex * 12)}</span> annual opex.
                    </p>
                  </div>

                  {/* Payback period */}
                  <div className="p-5 bg-white border border-luxury-stone/80 rounded-xl space-y-2 transition duration-350 hover:border-luxury-earth hover:shadow-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-luxury-earth" />
                        <span className="font-sans text-xs font-semibold text-neutral-600 tracking-wide">
                          Payback period
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-neutral-400 font-light select-none">Breakeven</span>
                    </div>
                    <div className="font-serif text-3xl font-light text-luxury-charcoal">
                      {metrics.paybackPeriod !== null ? `${metrics.paybackPeriod} years` : 'No payback'}
                    </div>
                    <p className="text-[11px] text-neutral-440 font-light leading-relaxed">
                      To offset startup cost of <span className="font-sans font-medium text-neutral-600">{formatCurrency(inputs.capex)}</span>.
                    </p>
                  </div>

                </div>

                {/* Short informative summary sentence */}
                <div className="py-4 border-y border-luxury-stone/30 text-center">
                  <p className="text-xs sm:text-sm text-luxury-clay font-sans font-medium tracking-wide">
                    {metrics.paybackPeriod !== null 
                      ? `At these assumptions, your project could recover its startup cost in about ${metrics.paybackPeriod} years.`
                      : 'At these assumptions, your operating cost exceeds your revenue, meaning the startup cost cannot be recovered.'
                    }
                  </p>
                </div>

                {/* Ad-hoc Stress Report Summary */}
                <div className="bg-luxury-cream rounded-xl p-4 border border-luxury-stone/60 space-y-3.5">
                  <h4 className="font-sans text-xs font-semibold text-neutral-500 tracking-wide">
                    Project summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-neutral-400 text-[10px] block">Startup investment</span>
                      <p className="font-serif text-base font-light text-luxury-charcoal mt-0.5">{formatCurrency(inputs.capex)}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-[10px] block">Gross annual revenue</span>
                      <p className="font-serif text-base font-light text-luxury-charcoal mt-0.5">{formatCurrency(metrics.grossAnnualRevenue)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-455 leading-relaxed font-normal font-sans">
                    Test how your project handles slow seasons, view supplier pricing, inspect search visibility presets, or download a custom project outline below.
                  </p>
                </div>

                {/* Collapsible 'See Advanced Details' Section */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSeeAdvancedDetails(!seeAdvancedDetails)}
                    className="w-full py-3.5 px-5 bg-neutral-50 hover:bg-neutral-100/80 border border-luxury-stone rounded-xl font-sans text-xs font-semibold text-luxury-charcoal transition-all duration-300 cursor-pointer flex items-center justify-between shadow-xs hover:border-luxury-earth"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-luxury-earth" />
                      {seeAdvancedDetails ? 'Hide advanced details' : 'See advanced details'}
                    </span>
                    <span className={`transform transition-transform duration-300 font-sans text-neutral-400 text-lg ${seeAdvancedDetails ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {seeAdvancedDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden space-y-8 pt-4"
                      >
                        
                        {/* MODULE 1: STRESS TEST */}
                        <div className="bg-[#faf9f6] border border-luxury-stone p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="border-b border-luxury-stone/60 pb-3">
                            <h4 className="font-serif text-lg font-light text-luxury-charcoal flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              Stress test simulator
                            </h4>
                            <p className="text-xs text-neutral-500 font-light mt-0.5">See how your project handles slow seasons or lower nightly rates</p>
                          </div>
                          <StressTestToggle />
                        </div>

                        {/* MODULE 2: PROCUREMENT */}
                        <div className="bg-white border border-luxury-stone p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="border-b border-luxury-stone/60 pb-3">
                            <h4 className="font-serif text-lg font-light text-luxury-charcoal flex items-center gap-2">
                              <HardHat className="w-4 h-4 text-luxury-earth" />
                              Boutique supplier catalog
                            </h4>
                            <p className="text-xs text-neutral-500 font-light mt-0.5">View estimated pricing from actual cabin and design suppliers</p>
                          </div>
                          <Suspense fallback={<div className="font-mono text-xs text-neutral-400 p-4">Loading supplier options...</div>}>
                            <ProcurementSidebar />
                          </Suspense>
                        </div>

                        {/* MODULE 3: SEO */}
                        <div className="bg-white border border-luxury-stone p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="border-b border-luxury-stone/60 pb-3">
                            <h4 className="font-serif text-lg font-light text-luxury-charcoal flex items-center gap-2">
                              <Globe className="w-4 h-4 text-blue-650" />
                              Location search presets
                            </h4>
                            <p className="text-xs text-neutral-500 font-light mt-0.5">Load real rates and occupancy for popular vacation destinations</p>
                          </div>
                          <PseoStudio 
                            onApplyPreset={(preset) => {
                              setInputs(prev => ({
                                ...prev,
                                adr: preset.adr,
                                occupancy: preset.occupancy,
                                units: preset.units,
                                upsell: preset.upsell,
                                opex: preset.opex,
                                capex: preset.capex
                              }));
                            }} 
                            activePropertyName={resolvedProjectName} 
                          />
                        </div>

                        {/* MODULE 4: METHODOLOGY */}
                        <div className="bg-white border border-luxury-stone p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="border-b border-luxury-stone/60 pb-3">
                            <h4 className="font-serif text-lg font-light text-luxury-charcoal flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600" />
                              Project proposal booklet
                            </h4>
                            <p className="text-xs text-neutral-500 font-light mt-0.5">Review financial formulas and export a clean print proposal</p>
                          </div>
                          <PitchDeckGenerator />
                        </div>

                        {/* Local Saved Scenarios Locker */}
                        <div className="bg-white border border-luxury-stone p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-luxury-stone pb-2.5">
                            <h4 className="font-serif text-sm font-medium text-luxury-charcoal flex items-center gap-1.5">
                              <BookmarkCheck className="w-3.5 h-3.5 text-luxury-earth" />
                              Saved plans
                            </h4>
                            {saveStreak > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-luxury-stone text-luxury-charcoal text-[10px] font-mono font-semibold shadow-3xs">
                                <Flame className="w-3.5 h-3.5 text-luxury-earth fill-luxury-stone shrink-0" />
                                <span>Streak: {saveStreak}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. Kyoto Wellness Cabin, Amalfi Peak"
                                className="flex-1 px-3 py-2 border border-luxury-stone/85 text-xs rounded-lg font-mono placeholder:text-neutral-300 focus:outline-none focus:border-luxury-earth transition"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newProjectName.trim()) {
                                    handleSaveProject(newProjectName);
                                  }
                                }}
                                className="px-4 py-2 bg-luxury-charcoal hover:bg-[#11100f] text-white font-sans text-xs font-semibold rounded-lg transition cursor-pointer"
                              >
                                Save plan
                              </button>
                            </div>

                            {savedProjects.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {savedProjects.map((scen) => (
                                  <div 
                                    key={scen.id} 
                                    className="flex items-center justify-between p-3 bg-luxury-cream/50 border border-luxury-stone rounded-lg hover:border-luxury-earth transition cursor-pointer text-xs font-mono"
                                    onClick={() => handleSelectProject(scen)}
                                  >
                                    <div className="space-y-0.5">
                                      <span className="font-semibold text-luxury-charcoal block">{scen.name}</span>
                                      <span className="text-[9px] text-neutral-400">{scen.inputs.units} units &bull; {formatCurrency(scen.inputs.capex)} setup cost</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteProject(scen.id, e)}
                                        className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                        title="Delete scenario plan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-neutral-455 italic font-normal">No saved plans on this device yet.</p>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Return Step Control */}
                <div className="pt-6 border-t border-luxury-stone">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                    }}
                    className="w-full py-4 border border-luxury-stone hover:bg-neutral-50 text-luxury-charcoal font-sans text-sm font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 text-luxury-earth" /> Back to operational metrics
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* Refined Minimalist Footer */}
      <footer className="py-16 md:py-24 px-6 mt-16 max-w-xl mx-auto text-center font-sans space-y-3 select-none shrink-0 border-t border-luxury-stone/20">
        <p className="text-[11px] sm:text-xs text-luxury-clay font-medium tracking-wide">
          Simple planning estimates for hospitality projects.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[10px] text-neutral-400 font-light">
          <span>Results are estimates, not financial or legal advice.</span>
          <span className="hidden sm:inline text-neutral-300/60">&bull;</span>
          <span>Data is saved only on this device.</span>
        </div>
      </footer>

      {/* Achievement Validation Overlay Dialog */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setShowAchievement(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white border-2 border-luxury-clay/80 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Subtle aura bubbles */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-luxury-stone/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-luxury-earth/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="mx-auto w-16 h-16 bg-luxury-cream rounded-full flex items-center justify-center border border-luxury-stone/80 text-luxury-clay shadow-sm">
                <Sparkles className="w-8 h-8 animate-pulse text-luxury-earth" />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest uppercase text-luxury-clay font-bold block">Scenario Validated</span>
                <h3 className="font-serif text-2xl font-light text-luxury-charcoal">Viability Milestone Unlocked!</h3>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                Your parameters represent a highly optimized model. Operating <span className="font-semibold text-luxury-charcoal font-mono">{inputs.units} {inputs.units === 1 ? 'unit' : 'units'}</span> at <span className="font-semibold text-luxury-charcoal font-mono">{inputs.occupancy}%</span> occupancy creates a robust ROI potential.
              </p>

              <div className="p-3.5 bg-neutral-50/50 rounded-xl border border-luxury-stone/50 space-y-2 text-left font-mono text-[11px] text-neutral-600 shadow-3xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase text-[#8c857b] tracking-wider">Gross Profit Margin:</span>
                  <span className="font-bold text-luxury-charcoal">{metrics.grossProfitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase text-[#8c857b] tracking-wider">Annual Gross Rev:</span>
                  <span className="font-bold text-luxury-charcoal">{formatCurrency(metrics.grossAnnualRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase text-[#8c857b] tracking-wider">Payback Term:</span>
                  <span className="font-bold text-luxury-charcoal">
                    {metrics.paybackPeriod !== null ? `${metrics.paybackPeriod} Years` : 'N/A'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAchievement(false)}
                className="w-full py-3 bg-luxury-charcoal hover:bg-[#11100f] text-white font-sans text-xs font-semibold rounded-xl transition duration-150 cursor-pointer shadow-md select-none"
              >
                Explore Financial Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating VIP Admin Portal Pass Button */}
      <button
        onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-zinc-950 text-white border border-amber-500/40 hover:border-amber-400 px-4 py-3 rounded-xl shadow-2xl transition-all duration-200 flex items-center gap-2 cursor-pointer font-mono text-xs font-bold uppercase tracking-wider group hover:text-amber-400"
        id="roi-admin-pass-btn"
      >
        <FolderLock className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
        [ ROI AUDIT PASS ]
      </button>

      {/* Admin Portal Modal */}
      <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <GlobalStateProvider>
      <AppContent />
    </GlobalStateProvider>
  );
}
