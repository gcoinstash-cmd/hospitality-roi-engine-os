/**
 * Aura & Grid - Boutique Hospitality ROI Engine
 * Financial Calculation Formulas for Premium Property Developers
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
  paybackPeriod: number | null; // null if cashflow is zero or negative (cannot payback)
  fiveYearProjections: YearProjection[];
}

/**
 * Calculates the ROI metrics for a boutique hospitality development.
 * 
 * @param input HospitalityROIInput variables
 * @returns HospitalityROIResult typed metrics and projections
 */
export function calculateHospitalityROI(input: HospitalityROIInput): HospitalityROIResult {
  const { adr, occupancy, units, upsell, opex, capex } = input;

  // 1. Calculate booked nights per year
  // bookedNights = units * 365 * (occupancy/100)
  const occupancyFraction = Math.max(0, Math.min(100, occupancy)) / 100;
  const bookedNights = units * 365 * occupancyFraction;

  // 2. Calculate Gross Annual Revenue
  // grossAnnualRevenue = (units * 365 * (occupancy/100) * adr) + ((bookedNights / 2.5) * upsell) [avg stay 2.5 nights]
  const grossAnnualRevenue = (bookedNights * adr) + ((bookedNights / 2.5) * upsell);

  // 3. Calculate Net Annual Cashflow
  // netAnnualCashflow = grossAnnualRevenue - (opex * 12)
  const annualOpex = opex * 12;
  const netAnnualCashflow = grossAnnualRevenue - annualOpex;

  // 4. Calculate Payback Period
  // paybackPeriod = capex / netAnnualCashflow (gracefully handle division by <= 0)
  let paybackPeriod: number | null = null;
  if (netAnnualCashflow > 0) {
    paybackPeriod = parseFloat((capex / netAnnualCashflow).toFixed(2));
  }

  // 5. Calculate 5-year projections
  // Compounding the Gross Revenue by conservative 3% annual growth rate while keeping OpEx flat.
  const fiveYearProjections: YearProjection[] = [];
  let currentGross = grossAnnualRevenue;
  let cumulativeCashflow = -capex; // Initial state at Year 0 is -Capex, and cashflow offsets this

  for (let year = 1; year <= 5; year++) {
    // Year 1 uses the base year's annual gross, and compounds by 3% for each subsequent year.
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

export interface TaxExitInputs {
  capex: number;
  isAccelerated: boolean;
  effectiveTaxRate?: number; // User rate or standard 32% premium bracket
}

export interface TaxExitResult {
  annualDepreciationYear1: number;
  annualTaxShieldYear1: number; // depreciation * standard rate
  cumulativeDepreciation5Years: number;
  salePrice: number;
  sellingCosts: number;
  remainingBasis: number;
  projectedExitProceeds: number;
  depreciationSchedule: number[]; // 5 years
}

/**
 * Calculates straight-line/accelerated tax depreciation shields and 5-yr exit proceeds
 * assuming 15% appreciation and 6% commission.
 */
export function calculateTaxAdvantage(inputs: TaxExitInputs): TaxExitResult {
  const { capex, isAccelerated, effectiveTaxRate = 0.32 } = inputs;
  
  const depreciationSchedule: number[] = [];
  const baseYears = 27.5;
  
  if (isAccelerated) {
    // 20% of CapEx categorized as 15-year or 5-year property expensed upfront as bonus depreciation
    const bonusPortion = capex * 0.20;
    const remainingStraightLinePortion = capex * 0.80;
    const annualStraightLine = remainingStraightLinePortion / baseYears;
    
    // Year 1 gets the 20% bonus + straight line of the remaining portion
    depreciationSchedule.push(bonusPortion + annualStraightLine);
    
    // Years 2 to 5 get standard straight line of the remaining portion
    for (let i = 2; i <= 5; i++) {
      depreciationSchedule.push(annualStraightLine);
    }
  } else {
    // Standard straight-line over 27.5 years
    const annualStraightLine = capex / baseYears;
    for (let i = 1; i <= 5; i++) {
      depreciationSchedule.push(annualStraightLine);
    }
  }
  
  const annualDepreciationYear1 = depreciationSchedule[0];
  const annualTaxShieldYear1 = annualDepreciationYear1 * effectiveTaxRate;
  
  const cumulativeDepreciation5Years = depreciationSchedule.reduce((sum, val) => sum + val, 0);
  
  const salePrice = capex * 1.15; // 15% appreciation
  const sellingCosts = salePrice * 0.06; // 6% selling commission
  const remainingBasis = Math.max(0, capex - cumulativeDepreciation5Years);
  
  // Taxable capital gain / proceeds calculation: Sale Price - Selling Costs - Remaining Basis
  const projectedExitProceeds = salePrice - sellingCosts - remainingBasis;
  
  return {
    annualDepreciationYear1: Math.round(annualDepreciationYear1 * 100) / 100,
    annualTaxShieldYear1: Math.round(annualTaxShieldYear1 * 100) / 100,
    cumulativeDepreciation5Years: Math.round(cumulativeDepreciation5Years * 100) / 100,
    salePrice: Math.round(salePrice * 100) / 100,
    sellingCosts: Math.round(sellingCosts * 100) / 100,
    remainingBasis: Math.round(remainingBasis * 100) / 100,
    projectedExitProceeds: Math.round(projectedExitProceeds * 100) / 100,
    depreciationSchedule: depreciationSchedule.map(v => Math.round(v * 100) / 100)
  };
}

