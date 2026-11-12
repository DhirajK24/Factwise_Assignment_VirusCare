# VirusCare — Patient Quarantine & Treatment Management System

> **Better Coordination. Faster Recovery.**

VirusCare is a production-grade, full-stack healthcare SaaS platform designed for epidemic quarantine facilities, isolation centers, and inpatient infectious disease treatment units.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**, VirusCare enforces strict hospital operational protocols, transactional bed capacity allocation, automated 3-day fever-free discharge eligibility certification, and real-time epidemiological mortality surveillance.

---

## 🏥 Key Clinical & Operational Workflows

### 1. Inpatient Bed Allocation & 74-Capacity Lock
- **Maximum Capacity**: 74 isolation beds (configurable by Facility Administrator).
- **Concurrency Protection**: Admission is guarded by an atomic database transaction. If 74 beds are occupied, admissions are strictly locked with a clinical capacity warning.
- **Dynamic Bed Pool**: Beds 1 to 74 are tracked with a partial PostgreSQL unique index (`WHERE status IN ('active', 'discharge_eligible')`). Discharging a patient immediately frees their bed back into the available pool.

### 2. Nurse Temperature Monitoring Station
- **Shift Routine**: Nurses record daily body temperatures in Celsius for active inpatients.
- **Duplicate Prevention**: Enforced via a database unique constraint on `(patient_id, reading_date)`. One normal reading per calendar day.
- **Fever Detection**: Temperatures $\ge 37.5^\circ\text{C}$ (configurable) trigger immediate visual fever warnings.
- **Authorized Corrections**: Existing records cannot be silently overwritten. Adjustments require an explicit clinical justification reason (minimum 10 characters) and are permanently recorded in the append-only audit log with original and new readings.

### 3. Doctor Clinical Rounds & Exception Handling
- **Protocol Gate**: A routine physician visit requires a preceding daily nurse temperature check.
- **Missing Reading Guard**: If today's nurse reading has not been taken, normal visit completion is blocked.
- **Clinical Exceptions**: In emergency or urgent triage situations, doctors can authorize a clinical exception with mandatory documentation (minimum 10 characters), logged directly to the facility audit history.
- **Outcomes**: Physicians can record detailed examination notes and document clinical outcomes (including deceased declarations when required).

### 4. Automated Discharge Eligibility Engine (3-Day Fever-Free Rule)
- **Standard of Cure**: A patient is certified cured and eligible for discharge only after **three full consecutive calendar days without fever** ($< 37.5^\circ\text{C}$).
- **Missing Day Enforcement**: Days with missing readings do **not** count toward the fever-free sequence.
- **Fever Reset**: A single febrile reading resets the consecutive count to 0.
- **Zero Client Trust**: When an Administrator confirms discharge, the server independently re-evaluates the patient's database temperature history.
- **Atomic Discharge**: Sets status to `discharged`, outcome to `recovered`, frees the assigned bed, and writes an audit event.

### 5. Epidemiological Mortality & Treatment Analytics
- **Formula Accuracy**:
  $$\text{Mortality Rate} = \frac{\text{Deaths}}{\text{Deaths} + \text{Recovered}} \times 100$$
  $$\text{Treatment Success Rate} = \frac{\text{Recovered}}{\text{Deaths} + \text{Recovered}} \times 100$$
- **Denominator Hygiene**: Active inpatients under ongoing treatment are explicitly excluded from completed outcome denominators. If zero outcomes exist, metric displays `N/A`.
- **Epidemiological Benchmarks**:
  - Expected Mortality: **15.0%**
  - Expected Success: **85.0%**
- **Surveillance Alerts**: If facility mortality exceeds 15.0%, a prominent clinical warning displays actual mortality percentage, benchmark (15.0%), and exact difference ($+X\%$).

### 6. Append-Only Operational Audit Trail
- Tracks admissions, patient updates, temperature recordings, authorized corrections, doctor visits, clinical exceptions, discharges, deceased declarations, and settings changes.
- Stores actor ID, role, action timestamp, previous JSON state, and new committed payload.
- Read-only for regular users; immutable in PostgreSQL.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.2.0 (App Router, Server Actions, Route Handlers) |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Radix UI Primitives, Lucide Icons |
| **Visual Charts** | Recharts (14-day inpatient flow, thermal stratification, outcome breakdown) |
| **Database** | Supabase PostgreSQL with Row Level Security (RLS) & Stored Functions |
| **Auth** | Supabase Auth (`@supabase/ssr`) with multi-role RBAC (Admin, Nurse, Doctor) |
| **Testing** | Vitest (Unit & Service logic), React Testing Library, Playwright (E2E) |
| **Deployment** | Vercel (Edge-optimized Next.js) & GitHub |

---

## 🗄️ Database Schema & Migrations

The database schema is defined in [supabase/migrations/20261112000000_init_viruscare.sql](file:///d:/Engg.%20%20Project/FactWise_assisment/supabase/migrations/20261112000000_init_viruscare.sql):

- `profiles`: Mirrors `auth.users`, storing `full_name`, `email`, `role` (`admin` \| `nurse` \| `doctor`), `is_active`.
- `facility_settings`: `facility_name`, `facility_timezone`, `maximum_capacity` (default 74), `fever_threshold_celsius` (default 37.5).
- `patients`: `patient_code` (unique), `full_name`, `age`, `gender`, `bed_number`, `admission_date`, `status` (`active` \| `discharge_eligible` \| `discharged` \| `deceased`), `outcome` (`recovered` \| `deceased`).
- `temperature_readings`: `patient_id`, `temperature_celsius`, `reading_date`, `recorded_by`, `corrected_at`, `correction_reason`. Unique on `(patient_id, reading_date)`.
- `doctor_visits`: `patient_id`, `visit_date`, `doctor_id`, `clinical_notes`, `exception_reason`. Unique on `(patient_id, visit_date)`.
- `audit_logs`: Append-only ledger recording all actor events with JSON delta payloads.

---

## 👥 Verified Demo Personas & 1-Click Testing

VirusCare includes pre-seeded clinical personas for instant evaluation across all roles:

| Persona | Role | Email | Clearance |
|---|---|---|---|
| **Dr. Sarah Chen, MD** | `admin` | `admin@viruscare.health` | Full Facility Clearance, Bed Management, Discharge Approval, Settings |
| **Marcus Johnson, RN** | `nurse` | `nurse.marcus@viruscare.health` | Inpatient Temperature Monitoring, Authorized Corrections |
| **Dr. Arjun Mehta, MD** | `doctor` | `doctor.arjun@viruscare.health` | Inpatient Rounds, Clinical Notes, Exceptions, Deceased Declarations |

*On the `/login` screen or via the Top Navbar, click any persona button to instantly switch roles.*

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd FactWise_assisment
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Offline/Local Testing Mode**: If Supabase credentials are not provided or unreachable, VirusCare automatically operates with its internal high-performance, verified memory database, allowing full evaluation, unit testing, and UI workflows without an external network dependency.

### 3. Run Database Migrations & Seed (Supabase Cloud)
In your Supabase project SQL Editor, execute:
1. `supabase/migrations/20261112000000_init_viruscare.sql`
2. `supabase/seed.sql`

Or run the automated seeder:
```bash
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

VirusCare contains comprehensive automated test suites covering all core business rules:

```bash
# Run Vitest unit & integration test suite
npm test
```

### Test Coverage Highlights:
- **Discharge Eligibility**: Verifies 3 consecutive fever-free calendar days ($< 37.5^\circ\text{C}$), confirms missing days do not count, and tests sequence reset upon fever.
- **Analytics Service**: Confirms mortality rate ($33.3\%$) and treatment success rate ($66.7\%$) exclude active inpatients; tests $15\%$ mortality alert triggering.
- **Bed Allocation**: Tests bed assignment range (1–74), rejects duplicate active bed allocation, and validates capacity locking at 74 beds.
- **Clinical Workflows**: Enforces duplicate reading prevention, verifies audit log generation for corrections, and enforces doctor exception requirements when nurse checks are missing.
- **RBAC**: Validates admin, nurse, and doctor authorization boundaries.

---

## 🌐 Production Build & Vercel Deployment

1. **Verify Production Build Locally**:
   ```bash
   npm run build
   ```
2. **Deploy to Vercel**:
   - Push repository to GitHub.
   - Import repository into Vercel.
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_URL`
   - Deploy.

---

## 📄 License
Healthcare Operations SaaS — All rights reserved.

