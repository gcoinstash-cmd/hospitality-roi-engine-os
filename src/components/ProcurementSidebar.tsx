import React, { useState } from 'react';
import { 
  Tent, 
  Home, 
  Laptop, 
  Cpu, 
  Feather, 
  Bed, 
  Compass, 
  Trees, 
  ArrowRight, 
  FileText, 
  X,
  ExternalLink,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  costEstimate: string;
  roiContribution: string;
}

interface ProcurementCategory {
  id: string;
  title: string;
  subtitle: string;
  partners: Partner[];
}

const PROCUREMENT_CATEGORIES: ProcurementCategory[] = [
  {
    id: 'luxury-structures',
    title: 'Luxury Structures',
    subtitle: 'Low-impact off-grid hardware solutions',
    partners: [
      {
        id: 'zenith-domes',
        name: 'Zenith Geodesic Domes',
        description: 'Weather-insulated thermo-glazed geodesic domes with micro-climate insulation and solar ventilation.',
        badge: 'Glamping Option',
        icon: Tent,
        costEstimate: '$45,000 / unit',
        roiContribution: 'May support elevated nightly rate potential.'
      },
      {
        id: 'ark-shelter',
        name: 'Ark Shelter Prefabs',
        description: 'Precision-timber modern cabins delivered fully assembled with off-grid rain collections.',
        badge: 'Premium Cabin',
        icon: Home,
        costEstimate: '$145,000 / unit',
        roiContribution: 'Enables high-tier structural positioning.'
      }
    ]
  },
  {
    id: 'retreat-software',
    title: 'Retreat Software',
    subtitle: 'Sensory automation & custom CRMs',
    partners: [
      {
        id: 'aura-os',
        name: 'AuraOS Hospitality',
        description: 'Mobile concierge platform with digital check-in and dynamic ambient lighting control.',
        badge: 'Guest Platform',
        icon: Laptop,
        costEstimate: '$8 / room / mo',
        roiContribution: 'Correlates with incremental guest spend.'
      },
      {
        id: 'gridflow-ai',
        name: 'GridFlow Yield Engine',
        description: 'Dynamic pricing router aimed at increasing percentage of direct reservations.',
        badge: 'Yield Tool',
        icon: Cpu,
        costEstimate: '1.2% net direct billing',
        roiContribution: 'May optimize third-party commission spreads.'
      }
    ]
  },
  {
    id: 'high-end-linens',
    title: 'High-End Linens & Sleep',
    subtitle: 'Tactile organic interior finishes',
    partners: [
      {
        id: 'soma-textiles',
        name: 'Soma Italian Textiles',
        description: '800-thread long-staple organic cotton bedding custom-milled in Lombardy.',
        badge: 'Premium Linens',
        icon: Feather,
        costEstimate: '$320 / bedding set',
        roiContribution: 'Assists with guest satisfaction sentiment.'
      },
      {
        id: 'eos-atelier',
        name: 'Eos Sleep Atelier',
        description: 'Hand-tufted organic latex and alpaca wool mattresses for premium sleep scores.',
        badge: 'Bedding Spec',
        icon: Bed,
        costEstimate: '$2,400 / bed setup',
        roiContribution: 'Reinforces positive reservation surveys.'
      }
    ]
  },
  {
    id: 'wilderness-amenities',
    title: 'Wilderness Amenities',
    subtitle: 'Ancillary natural-world wellness integration',
    partners: [
      {
        id: 'nectars-sage',
        name: 'Nectars Botanic Care',
        description: 'Single-batch juniper, moss, and sage wildcrafted body formulas in refillable stone jars.',
        badge: 'Refillable Amenity',
        icon: Compass,
        costEstimate: '$15 / guest stay',
        roiContribution: 'Contributes to boutique brand identity.'
      },
      {
        id: 'pyro-sauna',
        name: 'Pyro Cedar Hot Tubs',
        description: 'Deep fire-heated red cedar soaking tubs with passive solar warming panels.',
        badge: 'Wellness Feature',
        icon: Trees,
        costEstimate: '$8,500 / spa installation',
        roiContribution: 'May support shoulder-season occupancy capture.'
      }
    ]
  }
];

import { useGlobalState } from '../context/GlobalStateContext';

export default function ProcurementSidebar() {
  const { 
    setInputs, 
    triggerLoading, 
    showToast: globalShowToast, 
    setShowProcurement 
  } = useGlobalState();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleRequestDossier = (partner: Partner) => {
    setSelectedPartner(partner);
  };

  const handleConfirmOrder = () => {
    if (!selectedPartner) return;
    setToastMessage(`Dossier initiated: Procurement specs for "${selectedPartner.name}" have been generated.`);
    setShowToast(true);
    setSelectedPartner(null);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div 
      id="procurement-sidebar-root" 
      className="p-6 space-y-6 bg-[#faf9f6]/95 border-l border-luxury-stone/80 flex flex-col justify-between h-full relative"
    >
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 left-4 right-4 z-50 p-3 bg-luxury-charcoal text-luxury-cream text-[11px] font-sans rounded-lg border border-luxury-earth flex items-start gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-[10px] text-luxury-earth">Supplier catalog</span>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-luxury-stone pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-luxury-earth" />
            <h3 className="font-sans text-xs text-luxury-charcoal font-semibold">
              Supplier catalog
            </h3>
          </div>
          <button 
            onClick={() => setShowProcurement(false)}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-luxury-charcoal transition cursor-pointer"
            title="Hide Supplier Catalog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-luxury-earth leading-relaxed font-sans">
          Explore curated supplier cost and benefit details. Click Apply preset to test their numbers in your calculator.
        </p>
      </div>

      {/* Curated Categories */}
      <div className="flex-1 overflow-y-auto space-y-5 max-h-[580px] pr-1 mt-2">
        {PROCUREMENT_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-2.5">
            <div className="space-y-0.5">
              <span className="font-sans text-[11px] text-luxury-earth font-bold block">
                {category.title}
              </span>
              <span className="text-[9.5px] text-neutral-400 block font-normal leading-tight">
                {category.subtitle}
              </span>
            </div>

            <div className="space-y-2">
              {category.partners.map((partner) => {
                const PartnerIcon = partner.icon;
                return (
                  <div 
                    key={partner.id}
                    className="p-3 bg-white border border-luxury-stone rounded-xl shadow-sm space-y-2 hover:border-luxury-earth transition duration-300"
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex gap-2 items-center">
                        <div className="p-1 px-1.5 rounded-md bg-luxury-cream/40 border border-luxury-stone text-luxury-earth shrink-0">
                          <PartnerIcon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-serif text-[12.5px] font-normal leading-snug text-luxury-charcoal">
                          {partner.name}
                        </h4>
                      </div>
                      <span className="text-[9px] font-sans text-luxury-earth bg-luxury-cream border border-luxury-stone px-1.5 py-0.5 rounded leading-none font-medium shrink-0">
                        {partner.badge}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-luxury-clay leading-relaxed font-sans">
                      {partner.description}
                    </p>

                    <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-neutral-100 text-[9px] font-mono text-neutral-400">
                      <span>Est: <strong className="text-luxury-charcoal font-medium">{partner.costEstimate}</strong></span>
                      <span className="text-[8.5px] text-luxury-clay bg-neutral-100 px-1.5 py-0.5 rounded font-normal">{partner.roiContribution}</span>
                    </div>

                    <div className="pt-2 flex gap-1.5">
                      <button
                        onClick={() => handleRequestDossier(partner)}
                        className="flex-1 py-1.5 px-2.5 font-sans text-[10.5px] rounded border border-luxury-stone text-luxury-charcoal bg-white hover:bg-neutral-50 transition text-center flex items-center justify-center gap-1 cursor-pointer font-medium"
                      >
                        <FileText className="w-3 h-3" />
                        View details
                      </button>
                      
                      <button
                        onClick={() => {
                          triggerLoading();
                          let preset: any = {};
                          let msg = '';
                          // High-end preset logic depending on partner
                          if (partner.id === 'zenith-domes') {
                            preset = { adr: 550, capex: 1000000, opex: 12000, upsell: 150 };
                            msg = "Applied 'Zenith Geodesic' benchmark inputs to calculator.";
                          } else if (partner.id === 'ark-shelter') {
                            preset = { adr: 1200, capex: 2400000, opex: 22000, upsell: 250 };
                            msg = "Applied 'Ark Shelter' upscale inputs to calculator.";
                          } else if (partner.id === 'aura-os') {
                            preset = { upsell: 350 };
                            msg = "Applied 'AuraOS high-tech upsell' presets to calculator.";
                          } else if (partner.id === 'gridflow-ai') {
                            preset = { adr: 950 };
                            msg = "Optimized 'GridFlow OTA direct adr' pricing baseline.";
                          } else if (partner.id === 'soma-textiles') {
                            preset = { adr: 900 };
                            msg = "Applied 'Soma Luxury Linen' branding baseline.";
                          } else if (partner.id === 'eos-atelier') {
                            preset = { adr: 1100 };
                            msg = "Applied 'Eos Master sleep prestige' baseline.";
                          } else if (partner.id === 'nectars-sage') {
                            preset = { upsell: 180 };
                            msg = "Optimized 'Nectars botanical amenities' revenue baseline.";
                          } else if (partner.id === 'pyro-sauna') {
                            preset = { occupancy: 78, capex: 1285000 };
                            msg = "Applied 'Pyro Outdoor Spa' shoulder-season occupancy lift.";
                          }

                          setInputs(prev => ({
                            ...prev,
                            ...preset
                          }));
                          globalShowToast(msg, 'success');
                        }}
                        className="py-1.5 px-3 font-sans text-[10.5px] rounded border border-neutral-200 text-neutral-600 bg-neutral-50 hover:bg-white hover:border-luxury-earth hover:text-luxury-earth transition cursor-pointer font-medium"
                        title="Apply partner parameters directly to sliders"
                      >
                        Apply preset
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Quote Drawer / Modal overlay */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-[#353331]/40 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-luxury-stone p-6 rounded-2xl max-w-sm md:max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              onClick={() => setSelectedPartner(null)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-luxury-charcoal transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="font-sans text-[10px] text-luxury-earth block font-medium">
              Supplier solutions catalog
            </span>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-normal text-luxury-charcoal">
                {selectedPartner.name}
              </h3>
              <p className="font-sans text-[10px] text-neutral-400">
                Partner supplier
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-luxury-clay leading-relaxed pt-2 font-sans">
              <p>
                We have configured estimated options and pricing plans based on your current calculator adjustments:
              </p>

              <div className="bg-[#faf9f6]/80 p-3 rounded-xl border border-luxury-stone space-y-1.5 font-sans text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Estimated cost:</span>
                  <span className="text-luxury-charcoal font-semibold">{selectedPartner.costEstimate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Projected impact:</span>
                  <span className="text-emerald-800 font-semibold">{selectedPartner.roiContribution}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setSelectedPartner(null)}
                className="flex-1 py-1.5 font-sans text-xs rounded border border-luxury-stone text-luxury-charcoal bg-white hover:bg-neutral-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-1.5 font-sans text-xs font-semibold rounded border border-luxury-charcoal text-white bg-luxury-charcoal hover:bg-black transition cursor-pointer flex items-center justify-center gap-1"
              >
                Request info pack
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-luxury-stone text-[9px] font-mono text-luxury-earth leading-relaxed space-y-1">
        <p>*Procurement quotes integrate general architectural planning specifications and logistics routing baselines.</p>
        <p className="text-neutral-400 font-sans font-light text-[8.5px] leading-tight mt-1">
          Scenario Disclosure: All estimated pricing potential, commission savings, and occupancy improvements are hypothetical models. Actual financial returns depend heavily on localized regulations, manager capability, and seasonal tourism market variants.
        </p>
      </div>
    </div>
  );
}
