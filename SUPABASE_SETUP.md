# HOSPITALITY ROI ENGINE OS — 3-Minute Turnkey Database Setup

Follow these simple steps to connect your production PostgreSQL database and unlock multi-property CapEx underwriting, pro-forma scenario comparisons, and LP capital allocation dealrooms.

---

### Step 1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **New Project**.
2. Name your project `hospitality-roi-engine-os` and select your nearest geographic region.

---

### Step 2: Run the Schema & Seed SQL
1. In the Supabase Dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Click **New Query**, open `supabase/schema.sql`, copy its contents, paste them into the editor, and click **Run**.
3. Create another query, paste `supabase/seed.sql`, and click **Run** to load initial pro-forma project models, stress-test scenario matrices, and institutional LP interest records.

---

### Step 3: Connect Your Environment Variables
1. Navigate to **Project Settings** > **API**.
2. Copy your **Project URL** and **anon public key**.
3. Create a `.env.local` file in your root directory:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
4. Restart your development server or trigger a fresh deployment:
```bash
npm run dev
```

---

### 1-Click Administrative Passkey
- **Route**: `https://<your-domain>/admin` (or click `[ ROI AUDIT PASS ]` on bottom-right)
- **Demo Passkey**: `roi2026`
