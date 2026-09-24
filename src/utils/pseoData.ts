/**
 * Aura & Grid - Programmatic SEO (pSEO) Architecture and Layout Data
 * This showcases how dynamic route layouts can draw from structured schemas
 * for localized hospitality markets.
 */

import { HospitalityROIInput } from './formulas';

export interface PSEODestination {
  slug: string;
  propertyName: string;
  location: string;
  region: string;
  curatedConcept: string;
  architecturalPhilosophy: string;
  marketAnalysis: string;
  defaultInputs: HospitalityROIInput;
}

export const pseoDestinations: PSEODestination[] = [
  {
    slug: "kyoto-zen-retreat-japan",
    propertyName: "Hoshinowa Sanctuary",
    location: "Arashiyama, Kyoto",
    region: "Japan",
    curatedConcept: "Hyper-minimalist timber-framed pavilions built in pristine cedar woods, incorporating natural spring private onsen bathhouses.",
    architecturalPhilosophy: "Embraces the Japanese philosophy of Wabi-Sabi. Clean floor lines, sliding shoji screens, and natural clay finishes designed to bring light-play into negative space.",
    marketAnalysis: "Arashiyama experiences premium, high-intent travel. Average daily rates exceed standard metropolitan hotel metrics by 2.4x due to limited ultra-luxury inventory.",
    defaultInputs: {
      adr: 1150,
      occupancy: 78,
      units: 8,
      upsell: 280,
      opex: 18000,
      capex: 3800000
    }
  },
  {
    slug: "joshua-tree-pavilion-california",
    propertyName: "The Obsidian Pavilion",
    location: "Joshua Tree, California",
    region: "United States",
    curatedConcept: "Monolithic concrete architectural pavilions blending into Mojave's rugged boulder fields, featuring custom saltwater cold plunges.",
    architecturalPhilosophy: "Brutalist structures juxtaposed with gentle desert sands. Wide ceiling heights, raw poured-earth texture plates, and framing apertures highlighting native cholla cacti.",
    marketAnalysis: "Southern California's executive getaway hub. High occupancy spikes during star-gazing seasons and multi-day private wellness rental buyouts.",
    defaultInputs: {
      adr: 850,
      occupancy: 68,
      units: 6,
      upsell: 190,
      opex: 12500,
      capex: 1950000
    }
  },
  {
    slug: "amalfi-cliffside-suites-italy",
    propertyName: "Villa Terrazza Bianca",
    location: "Ravello, Amalfi Coast",
    region: "Italy",
    curatedConcept: "Reconstructed cliffside lemon-orchard estate spanning multiple levels, equipped with tiered freshwater infinity terraces.",
    architecturalPhilosophy: "Mediterranean classicism meets contemporary luxury. Limestone floor masonry, whitewashed plaster vaults, and soft earth-neutral linens framing the cobalt Tyrrhenian Sea.",
    marketAnalysis: "Inelastic European summer demand. Seasonal closures between November and March are completely offset by premium peak-tariff volumes and private wedding events.",
    defaultInputs: {
      adr: 1980,
      occupancy: 82,
      units: 12,
      upsell: 420,
      opex: 35000,
      capex: 7200000
    }
  },
  {
    slug: "patagonia-geodesic-domes-chile",
    propertyName: "Estancia Silvestre",
    location: "Torres del Paine",
    region: "Chile",
    curatedConcept: "Carbon-negative geodesic timber and glass domes elevated above high-altitude sub-antarctic prairies.",
    architecturalPhilosophy: "Low-impact design. Native lenga wood interiors, ultra-dense insulated double glazing, and passive solar chimneys that trace southern light patterns.",
    marketAnalysis: "Eco-conscious active-wellness demographic. Exceptional yield during summer trekking months, heavily buoyed by custom high-end guided expeditions and chef-curated organic dining.",
    defaultInputs: {
      adr: 620,
      occupancy: 58,
      units: 10,
      upsell: 150,
      opex: 9800,
      capex: 1400000
    }
  }
];

/**
 * Generates SEO Metadata for a folder structure simulator or actual SSR headers.
 */
export function getSEOMetadataForSlug(slug: string) {
  const dest = pseoDestinations.find(d => d.slug === slug);
  if (!dest) return null;
  return {
    title: `Boutique Hotel ROI Calculator: ${dest.propertyName} (${dest.location})`,
    description: `Analyze development costs, ADR metrics, operating cashflow, and estimated payback period for ${dest.propertyName} in our premium hospitality developer toolkit.`,
    canonical: `https://aura-and-grid.com/roi-calculator/${dest.slug}`
  };
}
