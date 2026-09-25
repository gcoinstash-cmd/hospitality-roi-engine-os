import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
  calculateHospitalityROI, 
  calculateTaxAdvantage, 
  HospitalityROIInput, 
  HospitalityROIResult,
  TaxExitResult
} from '../utils/formulas';
import { 
  getSavedProjects, 
  saveProject, 
  deleteProject, 
  HospitalityProject 
} from '../utils/storage';
import benchmarksData from '../utils/benchmarks.json';
import compliancePresetsData from '../utils/compliancePresets.json';

interface GlobalStateContextType {
  // Sliders State
  inputs: HospitalityROIInput;
  setInputs: React.Dispatch<React.SetStateAction<HospitalityROIInput>>;
  activeInputs: HospitalityROIInput;
  handleSliderChange: (field: keyof HospitalityROIInput, value: number) => void;

  // Projects State
  savedProjects: HospitalityProject[];
  setSavedProjects: React.Dispatch<React.SetStateAction<HospitalityProject[]>>;
  activeProjectId: string | null;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  newProjectName: string;
  setNewProjectName: React.Dispatch<React.SetStateAction<string>>;
  saveSuccess: boolean;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveProject: (name: string) => void;
  handleDeleteProject: (id: string, e: React.MouseEvent) => void;
  handleSelectProject: (project: HospitalityProject) => void;

  // Stress State
  stressTestMode: boolean;
  setStressTestMode: React.Dispatch<React.SetStateAction<boolean>>;
  isAccelerated: boolean;
  setIsAccelerated: React.Dispatch<React.SetStateAction<boolean>>;

  // Benchmarks State
  activeBenchmarkId: string;
  setActiveBenchmarkId: React.Dispatch<React.SetStateAction<string>>;
  activeBenchmark: any;

  // Resolved Naming & Metadata State
  resolvedProjectName: string;
  resolvedLocationName: string;
  resolvedPropertyType: string;

  // Compliance State
  currentCompliancePreset: any;
  checkedHurdles: Record<string, boolean>;
  setCheckedHurdles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // Advisory Fields
  isArchitectModalOpen: boolean;
  setIsArchitectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leadName: string;
  setLeadName: React.Dispatch<React.SetStateAction<string>>;
  leadEmail: string;
  setLeadEmail: React.Dispatch<React.SetStateAction<string>>;
  leadSubmitted: boolean;
  setLeadSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  errors: { name?: string; email?: string };
  setErrors: React.Dispatch<React.SetStateAction<{ name?: string; email?: string }>>;

  // Loading / Transition State
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isGlowing: boolean;
  setIsGlowing: React.Dispatch<React.SetStateAction<boolean>>;
  triggerLoading: () => void;

  // Visual Layout State
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  showProcurement: boolean;
  setShowProcurement: React.Dispatch<React.SetStateAction<boolean>>;

  // Real-time computations
  metrics: HospitalityROIResult;
  baselineMetrics: HospitalityROIResult;
  taxExitMetrics: TaxExitResult;
  maxProjectedNet: number;

  // Toast Notification State
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Saved scenarios achievements
  saveStreak: number;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ 
  children,
  presetInputs
}: { 
  children: React.ReactNode;
  presetInputs?: HospitalityROIInput;
}) {
  // 1. Initial inputs
  const [inputs, setInputs] = useState<HospitalityROIInput>({
    adr: 450,
    occupancy: 62,
    units: 8,
    upsell: 120,
    opex: 32000,
    capex: 1600000
  });

  // Storage and Projects
  const [savedProjects, setSavedProjects] = useState<HospitalityProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStreak, setSaveStreak] = useState<number>(0);

  // Sync saveStreak on savedProjects changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_grid_save_streak');
      setSaveStreak(stored ? Number(stored) : 0);
    }
  }, [savedProjects]);

  // Panels visibility
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProcurement, setShowProcurement] = useState(true);

  // Stress state and cost depreciation mode
  const [stressTestMode, setStressTestMode] = useState(false);
  const [isAccelerated, setIsAccelerated] = useState(false);

  // Regulatory Module
  const [isArchitectModalOpen, setIsArchitectModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [checkedHurdles, setCheckedHurdles] = useState<Record<string, boolean>>({});

  // Transition & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  // Benchmarks
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string>('california-glamping');

  // Toast State & Timer auto-clean
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Glow interaction effect on inputs alteration
  useEffect(() => {
    setIsGlowing(true);
    const glowTimer = setTimeout(() => {
      setIsGlowing(false);
    }, 405);
    return () => clearTimeout(glowTimer);
  }, [inputs]);

  // Load persistent projects on mount
  useEffect(() => {
    setSavedProjects(getSavedProjects());
  }, []);

  // Compute active variables factoring current stress regime
  const activeInputs = useMemo<HospitalityROIInput>(() => {
    if (!stressTestMode) return inputs;
    return {
      ...inputs,
      adr: Math.round(inputs.adr * 0.8),
      opex: Math.round(inputs.opex * 1.15)
    };
  }, [inputs, stressTestMode]);

  // Handle outside preset injections (pSEO triggers)
  useEffect(() => {
    if (presetInputs) {
      triggerLoading();
      setInputs(presetInputs);
      const typedPreset = presetInputs as any;
      if (typedPreset && typedPreset.propertyName) {
        showToast("Preset scenario applied.", "success");
        const match = savedProjects.find(p => p.name === typedPreset.propertyName);
        if (match) {
          setActiveProjectId(match.id);
        } else {
          setActiveProjectId(null);
        }

        const name = typedPreset.propertyName.toLowerCase();
        if (name.includes('reserve') || name.includes('canyon') || name.includes('nebula') || name.includes('dome') || name.includes('pods') || name.includes('california')) {
          setActiveBenchmarkId('california-glamping');
        } else if (name.includes('kamo') || name.includes('river') || name.includes('kyoto') || name.includes('wellness') || name.includes('japan')) {
          setActiveBenchmarkId('kyoto-wellness');
        } else if (name.includes('villa') || name.includes('sentiero') || name.includes('amalfi') || name.includes('coast') || name.includes('ravello')) {
          setActiveBenchmarkId('amalfi-estate');
        } else if (name.includes('saguaro') || name.includes('ridge') || name.includes('monolith') || name.includes('desert') || name.includes('arizona')) {
          setActiveBenchmarkId('arizona-villa');
        }
      } else {
        setActiveProjectId(null);
      }
    }
  }, [presetInputs, savedProjects]);

  // Resolved dynamic Metadata name parameters
  const resolvedProjectName = useMemo(() => {
    const activeProject = savedProjects.find(p => p.id === activeProjectId);
    if (activeProject) return activeProject.name;
    const typedPreset = presetInputs as any;
    if (typedPreset && typedPreset.propertyName) return typedPreset.propertyName;
    return "Standard Scenario";
  }, [savedProjects, activeProjectId, presetInputs]);

  // Resolve Active Benchmark item
  const activeBenchmark = useMemo(() => {
    if (activeBenchmarkId === 'none') return null;
    return benchmarksData.find(b => b.id === activeBenchmarkId) || null;
  }, [activeBenchmarkId]);

  const resolvedLocationName = useMemo(() => {
    const typedPreset = presetInputs as any;
    if (typedPreset && typedPreset.locationName) return typedPreset.locationName;
    if (activeBenchmark) return activeBenchmark.region;
    
    const nameLower = resolvedProjectName.toLowerCase();
    if (nameLower.includes('nebula') || nameLower.includes('canyon') || nameLower.includes('reserve') || nameLower.includes('california')) return 'California Coast';
    if (nameLower.includes('kamo') || nameLower.includes('kyoto') || nameLower.includes('wellness')) return 'Kyoto Basin, Japan';
    if (nameLower.includes('sentiero') || nameLower.includes('amalfi') || nameLower.includes('estate')) return 'Amalfi Coast, Italy';
    if (nameLower.includes('saguaro') || nameLower.includes('desert') || nameLower.includes('arizona')) return 'Sonoran Desert, Arizona';
    return 'Premium Hospitality Zone';
  }, [presetInputs, activeBenchmark, resolvedProjectName]);

  const resolvedPropertyType = useMemo(() => {
    const typedPreset = presetInputs as any;
    if (typedPreset && typedPreset.propertyType) return typedPreset.propertyType;
    if (activeBenchmark) return activeBenchmark.propertyType;

    const nameLower = resolvedProjectName.toLowerCase();
    if (nameLower.includes('canyon') || nameLower.includes('reserve')) return 'Luxury Glamping Dome';
    if (nameLower.includes('river') || nameLower.includes('wellness')) return 'Boutique Wellness Pavilion';
    if (nameLower.includes('estate') || nameLower.includes('villa')) return 'Historic Cliffside Estate';
    if (nameLower.includes('saguaro') || nameLower.includes('modernist')) return 'Modernist Desert Villa';
    return 'Boutique Hospitality Unit';
  }, [presetInputs, activeBenchmark, resolvedProjectName]);

  // Compliance snapshot parameters mapping
  const currentCompliancePreset = useMemo(() => {
    const loc = resolvedLocationName || '';
    const locLower = loc.toLowerCase();
    if (locLower.includes('california')) {
      return compliancePresetsData['California Coast'];
    } else if (locLower.includes('kyoto')) {
      return compliancePresetsData['Kyoto Basin'];
    } else if (locLower.includes('amalfi')) {
      return compliancePresetsData['Amalfi Coast'];
    } else if (locLower.includes('sonoran') || locLower.includes('desert') || locLower.includes('arizona')) {
      return compliancePresetsData['Sonoran Desert'];
    }
    return compliancePresetsData['California Coast'];
  }, [resolvedLocationName]);

  // Auto Reset checks on location updates
  useEffect(() => {
    setCheckedHurdles({});
    setLeadSubmitted(false);
    setLeadName('');
    setLeadEmail('');
    setErrors({});
  }, [resolvedLocationName]);

  // Mathematical core calculations
  const metrics = useMemo<HospitalityROIResult>(() => {
    return calculateHospitalityROI(activeInputs);
  }, [activeInputs]);

  const baselineMetrics = useMemo<HospitalityROIResult>(() => {
    return calculateHospitalityROI(inputs);
  }, [inputs]);

  const taxExitMetrics = useMemo<TaxExitResult>(() => {
    // If stressTestMode is true, our capex remains the same, but the overall project yield takes a hit.
    // However, the depreciation shields of capex remain based on total capex layout.
    return calculateTaxAdvantage({
      capex: activeInputs.capex,
      isAccelerated,
      effectiveTaxRate: 0.32
    });
  }, [activeInputs.capex, isAccelerated]);

  const maxProjectedNet = useMemo(() => {
    if (!metrics.fiveYearProjections.length) return 1;
    const values = metrics.fiveYearProjections.map(p => p.netCashflow);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    return Math.max(Math.abs(maxVal), Math.abs(minVal));
  }, [metrics]);

  // Slider State Modifier
  const handleSliderChange = (field: keyof HospitalityROIInput, value: number) => {
    setInputs(prev => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value
    }));
  };

  // Saved Projects modifiers
  const handleSaveProject = (name: string) => {
    if (!name.trim()) return;
    const updated = saveProject(name, inputs);
    setSavedProjects(updated);
    if (updated.length > 0) {
      setActiveProjectId(updated[0].id);
    }
    setNewProjectName('');
    setSaveSuccess(true);

    // Save & Increment saveStreak in localStorage
    const currentStreak = Number(localStorage.getItem('aura_grid_save_streak') || '0');
    const nextStreak = currentStreak + 1;
    localStorage.setItem('aura_grid_save_streak', nextStreak.toString());
    setSaveStreak(nextStreak);

    showToast(`Scenario saved successfully. Streak: ${nextStreak} scenario${nextStreak === 1 ? '' : 's'} 🔥`, "success");
    setTimeout(() => setSaveSuccess(false), 2050);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const match = savedProjects.find(p => p.id === id);
    const updated = deleteProject(id);
    setSavedProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
    if (match) {
      showToast("Scenario deleted.", "info");
    }
  };

  const handleSelectProject = (project: HospitalityProject) => {
    triggerLoading();
    setInputs(project.inputs);
    setActiveProjectId(project.id);
    showToast("Scenario loaded.", "success");
  };

  return (
    <GlobalStateContext.Provider value={{
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
      toast,
      showToast,
      saveStreak
    }}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] max-w-sm bg-neutral-900 text-neutral-100 border border-luxury-stone px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 font-mono text-xs">
          <span className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 ${toast.type === 'error' ? 'bg-rose-500' : toast.type === 'info' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
          <span className="flex-1 text-xs font-semibold leading-tight">{toast.message}</span>
          <button 
            type="button"
            onClick={() => setToast(null)} 
            className="text-neutral-400 hover:text-white transition duration-150 font-sans text-xs cursor-pointer pl-1"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
