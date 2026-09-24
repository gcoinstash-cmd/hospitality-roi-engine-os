-- HOSPITALITY ROI ENGINE OS — Production PostgreSQL Schema & Security Policies
-- Vertical: Private Wealth & Family Office Vault (Hospitality RevPASH & Capital Allocation OS)

CREATE TABLE IF NOT EXISTS public.proforma_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'boutique_hotel', -- boutique_hotel, glamping_resort, private_villas, cellar_suites
    units INT NOT NULL,
    capex NUMERIC(12,2) NOT NULL,
    adr NUMERIC(10,2) NOT NULL,
    occupancy NUMERIC(5,2) NOT NULL,
    fnb_per_guest NUMERIC(10,2) DEFAULT 0,
    opex_margin NUMERIC(5,2) NOT NULL,
    gross_annual_revenue NUMERIC(12,2) NOT NULL,
    net_operating_income NUMERIC(12,2) NOT NULL,
    irr_estimate NUMERIC(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'underwritten', -- underwritten, capital_secured, due_diligence, term_sheet
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.underwriting_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.proforma_projects(id) ON DELETE CASCADE,
    scenario_type TEXT NOT NULL, -- base, bear, bull, high_interest
    occupancy_shock NUMERIC(5,2) DEFAULT 0,
    adr_shock NUMERIC(5,2) DEFAULT 0,
    projected_payback_years NUMERIC(4,2) NOT NULL,
    projected_irr NUMERIC(5,2) NOT NULL,
    dscr_ratio NUMERIC(4,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lp_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lp_name TEXT NOT NULL,
    institution TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    target_allocation TEXT NOT NULL,
    preferred_vintage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'accredited', -- accredited, nda_signed, dataroom_access, term_sheet_issued
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.proforma_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underwriting_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_inquiries ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Allow public inserts for proforma projects" 
    ON public.proforma_projects FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated reads for proforma projects" 
    ON public.proforma_projects FOR SELECT 
    USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow public reads for underwriting scenarios" 
    ON public.underwriting_scenarios FOR SELECT 
    USING (true);

CREATE POLICY "Allow public inserts for LP inquiries" 
    ON public.lp_inquiries FOR INSERT 
    WITH CHECK (true);
