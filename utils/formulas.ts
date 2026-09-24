/**
 * Aura & Grid - Boutique Hospitality ROI Engine
 * Financial Calculation Formulas for Premium Property Developers
 * Pure Export Path: /utils/formulas.ts
 */

export interface HospitalityROIInput {
  adr: number;          // Average Daily Rate ($)
  occupancy: number;    // Percentage (e.g. 65)
  units: number;        // Number of active rental spaces
  upsell: number;       // Average ancillary spend per booking ($)
  opex: number;         // Monthly operating costs ($)
  capex: number;        // Initial investment setup cost ($)
}

export interface YearProjection {
  year: number;
  grossRevenue: number;
  opex: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface HospitalityROIResult {
  bookedNights: number;
  grossAnnualRevenue: number;
  netAnnualCashflow: number;
  paybackPeriod: number | null;
  fiveYearProjections: YearProjection[];
}

export function calculateHospitalityROI(input: HospitalityROIInput): HospitalityROIResult {
  const { adr, occupancy, units, upsell, opex, capex } = input;

  const occupancyFraction = Math.max(0, Math.min(100, occupancy)) / 100;
  const bookedNights = units * 365 * occupancyFraction;

  const grossAnnualRevenue = (bookedNights * adr) + ((bookedNights / 2.5) * upsell);
  const annualOpex = opex * 12;
  const netAnnualCashflow = grossAnnualRevenue - annualOpex;

  let paybackPeriod: number | null = null;
  if (netAnnualCashflow > 0) {
    paybackPeriod = parseFloat((capex / netAnnualCashflow).toFixed(2));
  }

  const fiveYearProjections: YearProjection[] = [];
  let currentGross = grossAnnualRevenue;
  let cumulativeCashflow = -capex;

  for (let year = 1; year <= 5; year++) {
    const yrGross = year === 1 ? grossAnnualRevenue : currentGross * 1.03;
    currentGross = yrGross;

    const yrNet = yrGross - annualOpex;
    cumulativeCashflow += yrNet;

    fiveYearProjections.push({
      year,
      grossRevenue: Math.round(yrGross * 100) / 100,
      opex: annualOpex,
      netCashflow: Math.round(yrNet * 100) / 100,
      cumulativeCashflow: Math.round(cumulativeCashflow * 100) / 100,
    });
  }

  return {
    bookedNights: parseFloat(bookedNights.toFixed(1)),
    grossAnnualRevenue: Math.round(grossAnnualRevenue * 100) / 100,
    netAnnualCashflow: Math.round(netAnnualCashflow * 100) / 100,
    paybackPeriod,
    fiveYearProjections,
  };
}
