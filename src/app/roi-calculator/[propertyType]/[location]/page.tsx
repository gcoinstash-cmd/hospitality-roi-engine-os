// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

// Import our custom mockup JSON database structure
import pseoDatabase from '../../../../utils/pseoDatabase.json';

// Define the exact type representing a pSEO dynamic config record
export interface PSEORecord {
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

// Nextjs App Router Page signature
interface PageProps {
  params: {
    propertyType: string;
    location: string;
  };
}

/**
 * 1. Read Path Parameters and match to exact JSON record
 */
function getRecord(propertyType: string, location: string): PSEORecord | undefined {
  return (pseoDatabase as PSEORecord[]).find(
    (item) =>
      item.propertyType.toLowerCase() === propertyType.toLowerCase() &&
      item.location.toLowerCase() === location.toLowerCase()
  );
}

/**
 * 2. Next.js Metadata API for Dynamic Rich Semantic Headers
 * This injects custom titles, descriptions, and open graph layouts to ensure
 * perfect indexing of tail high-intent search queries.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const record = getRecord(params.propertyType, params.location);

  if (!record) {
    return {
      title: 'Boutique Hospitality ROI Engine | Aura & Grid',
      description: 'Analyze programmatic real-estate investment metrics and payback windows.',
    };
  }

  return {
    title: record.seoTitle,
    description: record.seoDescription,
    keywords: record.marketKeywords,
    alternates: {
      canonical: `https://aura-and-grid.com/roi-calculator/${record.propertyType}/${record.location}`,
    },
    openGraph: {
      title: record.seoTitle,
      description: record.seoDescription,
      type: 'website',
      url: `https://aura-and-grid.com/roi-calculator/${record.propertyType}/${record.location}`,
      siteName: 'Aura & Grid',
      images: [
        {
          url: `https://aura-and-grid.com/api/og?title=${encodeURIComponent(record.propertyName)}&location=${encodeURIComponent(record.regionName)}`,
          width: 1200,
          height: 630,
          alt: `${record.propertyName} Architectural Preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: record.seoTitle,
      description: record.seoDescription,
    },
  };
}

/**
 * 3. Static Site Generation (SSG) via generateStaticParams.
 * Emits static HTML paths during build time for blisters-speed rendering,
 * fulfilling top-tier performance expectations in modern pSEO tactics.
 */
export async function generateStaticParams() {
  return (pseoDatabase as PSEORecord[]).map((item) => ({
    propertyType: item.propertyType,
    location: item.location,
  }));
}

/**
 * 4. Dynamic Page Render Layer
 */
export default function Page({ params }: PageProps) {
  // Extract route metrics matching localized record
  const record = getRecord(params.propertyType, params.location);

  // Trigger fallback if slug combinations do not exist
  if (!record) {
    notFound();
  }

  // Create highly structured JSON-LD structural script to trigger Rich Snippets (Google Search Engine results pages)
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Aura & Grid Hospitality ROI Engine',
    'operatingSystem': 'All',
    'applicationCategory': 'BusinessApplication',
    'offers': {
      '@type': 'Offer',
      'price': '0.00',
      'priceCurrency': 'USD',
    },
    'description': record.seoDescription,
    'about': {
      '@type': 'Place',
      'name': record.regionName,
      'description': record.architecturalConcept,
    },
    'keywords': record.marketKeywords.join(', '),
  };

  return (
    <>
      {/* Dynamic Rich Structured JSON-LD injected seamlessly */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      <article className="min-h-screen bg-[#faf9f6] text-[#11100f] py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Ingress Rail */}
          <div className="flex items-center gap-1.5 text-xs font-semibold font-sans text-[#8c857b]">
            <span>Hospitality Calculator / Regional details</span>
            <span>/</span>
            <span className="text-[#11100f] font-medium">{record.propertyType}</span>
          </div>

          {/* Luxury Post Header */}
          <header className="space-y-4">
            <h1 className="font-serif text-3xl md:text-5xl font-light text-[#11100f] leading-tight">
              {record.propertyName} investment and payback analysis
            </h1>
            <p className="font-sans text-lg text-[#8c857b] italic max-w-2xl leading-relaxed">
              &ldquo;{record.architecturalConcept}&rdquo;
            </p>
          </header>

          {/* Metric Highlights */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-[#e6e4df]">
            <div className="space-y-1">
              <span className="font-sans text-xs font-semibold text-[#8c857b] font-medium">Matched location</span>
              <p className="font-serif text-lg font-light">{record.regionName}</p>
            </div>
            <div className="space-y-1">
              <span className="font-sans text-xs font-semibold text-[#8c857b] font-medium">Expected average rate</span>
              <p className="font-serif text-lg font-light">${record.default_adr} USD / night</p>
            </div>
            <div className="space-y-1">
              <span className="font-sans text-xs font-semibold text-[#8c857b] font-medium">Expected occupancy</span>
              <p className="font-serif text-lg font-light">{record.regional_occupancy}% average</p>
            </div>
          </section>

          {/* Regional Preset Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="font-sans text-xs font-semibold tracking-wider px-2.5 py-1 rounded bg-[#e6e4df]/50 text-[#11100f]/80 border border-[#e6e4df]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Educational Note concerning pre-populated inputs */}
          <div className="p-6 bg-white border border-[#e6e4df] rounded-xl space-y-4 shadow-sm">
            <h3 className="font-sans text-xs font-semibold text-[#11100f]">
              Direct calculator inputs
            </h3>
            <p className="text-sm text-[#8c857b] leading-relaxed">
              This layout matches local market conditions. You can quickly double check how these estimates shape up in your interactive plan:
            </p>
            <ul className="text-xs font-sans text-[#8c857b] space-y-2 list-disc pl-5">
              <li>Expected startup cost: <strong className="text-[#11100f]">${record.capex.toLocaleString()}</strong></li>
              <li>Expected running cost: <strong className="text-[#11100f]">${record.opex.toLocaleString()} / year</strong></li>
              <li>Planned rental units: <strong className="text-[#11100f]">{record.units} units</strong></li>
              <li>Ancillary per-booking spend: <strong className="text-[#11100f]">${record.upsell}</strong></li>
            </ul>
          </div>
        </div>
      </article>
    </>
  );
}
