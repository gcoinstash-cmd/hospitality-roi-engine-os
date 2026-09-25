import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Code, 
  FileJson, 
  Sparkles, 
  Check, 
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

import pseoDatabase from '../utils/pseoDatabase.json';

interface PSEORecord {
  propertyType: string;
  location: string;
  propertyName: string;
  regionName: string;
  default_adr: number;
  regional_occupancy: number;
  units: number;
  upsell: number;
  opex: number;
  capex: number;
  tags: string[];
  marketKeywords: string[];
  architecturalConcept: string;
  seoTitle: string;
  seoDescription: string;
}

interface PseoStudioProps {
  onApplyPreset: (metrics: {
    adr: number;
    occupancy: number;
    units: number;
    upsell: number;
    opex: number;
    capex: number;
    propertyName: string;
  }) => void;
  activePropertyName: string;
}

export default function PseoStudio({ onApplyPreset, activePropertyName }: PseoStudioProps) {
  // State for parameters mapping to the route: /roi-calculator/[propertyType]/[location]
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('luxury-glamping-dome');
  const [selectedLocation, setSelectedLocation] = useState<string>('california');
  
  // Tabs for the SEO preview debugger
  const [activeTab, setActiveTab] = useState<'serp' | 'tags' | 'jsonld'>('serp');
  const [applied, setApplied] = useState<boolean>(false);

  // Available options derived statically from our JSON database for absolute type safety
  const propertyTypes = useMemo(() => {
    const types = new Set<string>();
    (pseoDatabase as PSEORecord[]).forEach(item => types.add(item.propertyType));
    return Array.from(types);
  }, []);

  const locationsForCurrentType = useMemo(() => {
    return (pseoDatabase as PSEORecord[])
      .filter(item => item.propertyType === selectedPropertyType)
      .map(item => item.location);
  }, [selectedPropertyType]);

  // Handle case where location might become invalid during type switching
  React.useEffect(() => {
    if (!locationsForCurrentType.includes(selectedLocation) && locationsForCurrentType.length > 0) {
      setSelectedLocation(locationsForCurrentType[0]);
    }
  }, [selectedPropertyType, locationsForCurrentType, selectedLocation]);

  // Match active database record based on selected parameters
  const matchedRecord = useMemo<PSEORecord>(() => {
    const record = (pseoDatabase as PSEORecord[]).find(
      item => item.propertyType === selectedPropertyType && item.location === selectedLocation
    );
    // Fallback to avoid empty state during render-ticks
    return record || (pseoDatabase as PSEORecord[])[0];
  }, [selectedPropertyType, selectedLocation]);

  // Construct URL dynamically
  const dynamicUrl = `https://hospitality-calculator.com/roi-calculator/${selectedPropertyType}/${selectedLocation}`;

  // Dynamically synchronize head tags for the active pSEO selection to guarantee indexability
  React.useEffect(() => {
    if (!matchedRecord) return;

    // 1. Update Title
    document.title = matchedRecord.seoTitle;

    // 2. Set Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', matchedRecord.seoDescription);

    // 3. Set Canonical URL Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', dynamicUrl);

    // 4. Set Open Graph (OG) URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', dynamicUrl);
  }, [matchedRecord, dynamicUrl]);

  // Schema Markup representation
  const schemaMarkup = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Hospitality ROI Engine",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      },
      "description": matchedRecord.seoDescription,
      "about": {
        "@type": "Place",
        "name": matchedRecord.regionName,
        "description": matchedRecord.architecturalConcept
      },
      "keywords": matchedRecord.marketKeywords.join(", ")
    };
  }, [matchedRecord]);

  const handleApply = () => {
    onApplyPreset({
      adr: matchedRecord.default_adr,
      occupancy: matchedRecord.regional_occupancy,
      units: matchedRecord.units,
      upsell: matchedRecord.upsell,
      opex: matchedRecord.opex,
      capex: matchedRecord.capex,
      propertyName: matchedRecord.propertyName
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  // Human-readable titles for labels
  const formatCodeLabel = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div id="pseo-studio-root" className="bg-white border border-luxury-stone rounded-2xl overflow-hidden shadow-sm">
      
      {/* Element Header */}
      <div className="p-6 md:p-8 border-b border-luxury-stone bg-[#faf9f6]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 bg-transparent">
            <span className="w-1.5 h-1.5 bg-luxury-earth rounded-full"></span>
            <p className="font-sans text-xs text-luxury-earth font-semibold">
              Location presets
            </p>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-luxury-charcoal">
            Explore locations
          </h2>
          <p className="text-xs text-luxury-earth mt-1 max-w-2xl leading-relaxed">
            Quickly load typical nightly rates and expected occupancies for popular destinations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-sans bg-neutral-100 border border-neutral-200 text-neutral-550 px-2.5 py-1 rounded-full flex items-center gap-1 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-luxury-earth" /> Ready to apply
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-luxury-stone">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-5 p-6 md:p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-luxury-stone/60">
              <Database className="w-4 h-4 text-luxury-earth" />
              <h3 className="font-sans text-xs text-luxury-charcoal font-semibold">
                Select options
              </h3>
            </div>
            
            {/* Dynamic URL String Display */}
            <div className="p-4 bg-neutral-900 text-neutral-100 rounded-lg font-mono text-xs font-semibold space-y-1.5 overflow-hidden">
              <div className="flex justify-between text-xs font-semibold tracking-wider text-neutral-400 font-medium font-sans">
                <span>Web address preview</span>
                <span className="text-neutral-300 font-semibold">Active</span>
              </div>
              <div className="truncate text-medium text-neutral-200 select-all">
                <span className="text-neutral-500">https://</span>hospitality-calculator.com<span className="text-luxury-earth">/roi-calculator/</span>
                <span className="text-white font-semibold">{selectedPropertyType}</span>
                <span className="text-luxury-earth">/</span>
                <span className="text-neutral-300 font-semibold">{selectedLocation}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            {/* 1. Property Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-sans text-luxury-charcoal font-semibold">
                Property type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {propertyTypes.map((type) => {
                  const isActive = selectedPropertyType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedPropertyType(type)}
                      className={`text-xs font-mono px-3 py-1.5 rounded transition cursor-pointer border ${
                        isActive 
                          ? 'bg-luxury-charcoal text-luxury-cream border-luxury-charcoal' 
                          : 'bg-white text-luxury-earth border-luxury-stone hover:bg-neutral-50'
                      }`}
                    >
                      {formatCodeLabel(type)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Location Selector */}
            <div className="space-y-2">
              <label className="text-sm font-sans text-luxury-charcoal font-semibold">
                Location
              </label>
              <div className="flex flex-wrap gap-1.5">
                {locationsForCurrentType.map((loc) => {
                  const isActive = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={`text-xs font-mono px-3 py-1.5 rounded transition cursor-pointer border ${
                        isActive 
                          ? 'bg-luxury-charcoal text-luxury-cream border-luxury-charcoal' 
                          : 'bg-white text-luxury-earth border-luxury-stone hover:bg-neutral-50'
                      }`}
                    >
                      {formatCodeLabel(loc)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Record Details Summary */}
          <div className="p-5 bg-luxury-cream/40 border border-luxury-stone rounded-xl space-y-3.5">
            <div className="flex justify-between items-baseline border-b border-luxury-stone/50 pb-2">
              <span className="font-sans text-xs font-semibold text-luxury-earth font-semibold">Preset details</span>
              <span className="text-xs font-serif italic text-luxury-charcoal">{matchedRecord.regionName}</span>
            </div>
            
            <div className="space-y-1">
              <span className="font-sans text-xs font-semibold tracking-wider text-neutral-400 font-medium font-sans">Destination name</span>
              <p className="font-serif text-[15px] text-luxury-charcoal font-normal">
                {matchedRecord.propertyName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-sans text-xs font-semibold tracking-wider text-neutral-400 font-medium font-sans">Design style</span>
              <p className="text-xs text-luxury-earth leading-relaxed font-sans font-light">
                {matchedRecord.architecturalConcept}
              </p>
            </div>

            {/* Action Call for calculator integration */}
            <button
              onClick={handleApply}
              className={`w-full py-3 px-4 font-sans text-xs font-semibold rounded-lg border text-center transition flex items-center justify-center gap-2 cursor-pointer ${
                activePropertyName === matchedRecord.propertyName
                  ? 'bg-neutral-100 text-luxury-earth border-luxury-stone pointer-events-none'
                  : 'bg-luxury-charcoal text-white hover:bg-black border-luxury-charcoal shadow-sm'
              }`}
            >
              {activePropertyName === matchedRecord.propertyName ? (
                <>
                  <Check className="w-4 h-4 text-luxury-earth" />
                  Loaded in calculator
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-luxury-earth" />
                  Apply details to calculator
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Showcase */}
        <div className="lg:col-span-7 p-6 md:p-8 space-y-6 bg-[#faf9f6]/35 flex flex-col justify-between">
          
          <div className="space-y-4">
            
            {/* Headers / Tabs for Live SEO Inspection */}
            <div className="flex border-b border-luxury-stone/80 justify-between items-center bg-transparent">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('serp')}
                  className={`pb-3 font-sans text-xs focus:outline-none transition cursor-pointer relative ${
                    activeTab === 'serp' ? 'text-luxury-charcoal font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Google preview
                  {activeTab === 'serp' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-earth"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('tags')}
                  className={`pb-3 font-sans text-xs focus:outline-none transition cursor-pointer relative ${
                    activeTab === 'tags' ? 'text-luxury-charcoal font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Page tags
                  {activeTab === 'tags' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-earth"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('jsonld')}
                  className={`pb-3 font-sans text-xs focus:outline-none transition cursor-pointer relative ${
                    activeTab === 'jsonld' ? 'text-luxury-charcoal font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Schema details
                  {activeTab === 'jsonld' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-earth"></span>}
                </button>
              </div>
              <span className="font-sans text-xs font-semibold text-[#8c857b] hidden sm:inline">Search preview</span>
            </div>

            {/* TAB CONTAINER CONTENT */}
            <div className="min-h-[220px] bg-white border border-luxury-stone rounded-xl p-5 shadow-inner">
              
              {/* TAB 1: Real-life Google SERP Mockup */}
              {activeTab === 'serp' && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#202124]">
                    <span className="font-semibold">Hospitality Calculator</span>
                    <span className="text-[#5f6368] font-mono">› roi-calculator ›</span>
                    <span className="text-[#3c4043]">{selectedPropertyType}</span>
                    <span className="text-[#5f6368] font-mono">›</span>
                    <span className="text-[#3c4043]">{selectedLocation}</span>
                  </div>
                  <div>
                    <h4 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-normal leading-tight">
                      {matchedRecord.seoTitle}
                    </h4>
                  </div>
                  <p className="text-xs text-[#4d5156] leading-relaxed max-w-2xl">
                    <span className="text-[#5f6368] mr-1">Rating: 4.9 &bull; Review by Real-Estate Advisory &bull;</span>
                    {matchedRecord.seoDescription}
                  </p>
                  
                  {/* Dynamic Tags extracted below */}
                  <div className="flex gap-4.5 pt-3.5 border-t border-dotted border-neutral-150 text-xs font-semibold font-mono text-[#1a0dab]">
                    <span className="hover:underline cursor-pointer">Sitemap Tree index</span>
                    <span className="hover:underline cursor-pointer">Tax writeoffs & TOT</span>
                    <span className="hover:underline cursor-pointer">Amortization Table</span>
                  </div>
                </div>
              )}

              {/* TAB 2: Dynamic Page Metadata Tags served by generateMetadata() */}
              {activeTab === 'tags' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold font-mono text-[#8c857b] leading-tight-none border-b pb-2">
                    Injecting programmatic SEO head metadata back to the Layout Frame:
                  </p>
                  <pre className="text-xs font-semibold tracking-wider font-mono text-[#8c857b] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code>
{`<title>${matchedRecord.seoTitle}</title>
<meta name="description" content="${matchedRecord.seoDescription}" />
<link rel="canonical" href="${dynamicUrl}" />
<meta name="keywords" content="${matchedRecord.marketKeywords.join(', ')}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${matchedRecord.propertyName} Financial Model" />
<meta property="og:url" content="${dynamicUrl}" />
<meta property="og:description" content="${matchedRecord.seoDescription}" />
<meta name="twitter:card" content="summary_large_image" />`}
                    </code>
                  </pre>
                </div>
              )}

              {/* TAB 3: Semantic JSON-LD schema.org script block */}
              {activeTab === 'jsonld' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold font-mono text-[#8c857b] leading-none border-b pb-2">
                    Structured Data Markup injected to generate search result rich snippets:
                  </p>
                  <pre className="text-xs font-semibold tracking-wider font-mono text-[#d97706] leading-relaxed overflow-x-auto whitespace-pre-wrap bg-neutral-50 p-3.5 rounded border border-neutral-200">
                    <code>
                      {JSON.stringify(schemaMarkup, null, 2)}
                    </code>
                  </pre>
                </div>
              )}

            </div>
          </div>
          {/* Quick SSG performance metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 border border-luxury-stone rounded-lg space-y-1 shadow-sm text-center">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#8c857b]">Page speed</span>
              <p className="font-serif text-xl font-normal text-luxury-charcoal">100 / 100</p>
              <span className="font-sans text-[9px] text-neutral-400">Optimized layout</span>
            </div>
            
            <div className="bg-white p-4 border border-luxury-stone rounded-lg space-y-1 shadow-sm text-center">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#8c857b]">Search terms</span>
              <p className="font-serif text-xl font-normal text-luxury-charcoal">
                {matchedRecord.marketKeywords.length} terms
              </p>
              <div className="font-sans text-[9px] text-neutral-400 capitalize truncate select-none">
                {matchedRecord.marketKeywords[0]}
              </div>
            </div>

            <div className="bg-white p-4 border border-luxury-stone rounded-lg space-y-1 shadow-sm text-center select-none">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#8c857b]">Delivery status</span>
              <p className="font-serif text-xl font-normal text-luxury-charcoal">Active</p>
              <span className="font-sans text-[9px] text-neutral-400 font-light">Fast load times</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
