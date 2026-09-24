-- HOSPITALITY ROI ENGINE OS — Mock Production Seed Records

INSERT INTO public.proforma_projects (id, project_name, asset_type, units, capex, adr, occupancy, fnb_per_guest, opex_margin, gross_annual_revenue, net_operating_income, irr_estimate, status) VALUES
('b1010000-0000-0000-0000-000000000001', 'Kyoto Sanctuary Boutique', 'boutique_hotel', 12, 4200000.00, 850.00, 84.00, 120.00, 42.00, 3128000.00, 1814240.00, 18.40, 'underwritten'),
('b1010000-0000-0000-0000-000000000002', 'Napa Valley Cellar Suites', 'cellar_suites', 8, 6500000.00, 1200.00, 78.00, 250.00, 38.00, 2733120.00, 1694534.00, 21.20, 'capital_secured'),
('b1010000-0000-0000-0000-000000000003', 'Big Sur Coastal Pavilions', 'private_villas', 16, 9800000.00, 1450.00, 88.00, 180.00, 35.00, 7447040.00, 4840576.00, 24.60, 'due_diligence');

INSERT INTO public.underwriting_scenarios (project_id, scenario_type, occupancy_shock, adr_shock, projected_payback_years, projected_irr, dscr_ratio) VALUES
('b1010000-0000-0000-0000-000000000001', 'base', 0.00, 0.00, 4.20, 22.40, 1.85),
('b1010000-0000-0000-0000-000000000001', 'bear', -25.00, -10.00, 6.80, 13.10, 1.35),
('b1010000-0000-0000-0000-000000000001', 'bull', 10.00, 15.00, 2.90, 31.80, 2.45);

INSERT INTO public.lp_inquiries (lp_name, institution, email, phone, target_allocation, preferred_vintage, status) VALUES
('Sebastian Sterling', 'Vanguard Heritage Capital LLC', 's.sterling@vanguard-heritage.com', '+1 (212) 555-0199', '$15M - $25M', 'Q1 2027 Vintage', 'dataroom_access');
