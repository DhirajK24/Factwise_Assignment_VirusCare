const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FactWise Technical Product Manager Campus Assessment - VirusCare</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page) " of " counter(pages);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #172334;
      line-height: 1.5;
      font-size: 10.5pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0D9488;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title-area h1 {
      font-size: 20pt;
      margin: 0 0 4px 0;
      color: #14243A;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .title-area .subtitle {
      font-size: 11pt;
      color: #0D9488;
      font-weight: 600;
      margin: 0;
    }
    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #64748B;
    }
    .meta-box strong {
      color: #1E293B;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8pt;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .badge-primary { background: #E6FFFA; color: #0D9488; border: 1px solid #99F6E4; }
    .badge-dark { background: #14243A; color: #FFFFFF; }
    
    h2 {
      font-size: 13pt;
      color: #14243A;
      border-left: 4px solid #0D9488;
      padding-left: 10px;
      margin-top: 24px;
      margin-bottom: 10px;
      font-weight: 700;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11pt;
      color: #0F766E;
      margin-top: 14px;
      margin-bottom: 6px;
      font-weight: 700;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }
    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
    }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .card-title {
      font-weight: 700;
      color: #14243A;
      font-size: 10.5pt;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background-color: #F1F5F9;
      color: #14243A;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; font-size: 8.5pt; }
    .text-teal { color: #0D9488; font-weight: 600; }
    .text-navy { color: #14243A; font-weight: 600; }
    .highlight { background-color: #FEF3C7; font-weight: 600; padding: 1px 4px; border-radius: 3px; }
    .success-box {
      background: #F0FDF4;
      border-left: 4px solid #16A34A;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 9.5pt;
    }
    .warning-box {
      background: #FFFBEB;
      border-left: 4px solid #D97706;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 9.5pt;
    }
    .page-break {
      page-break-before: always;
    }
    .formula {
      background: #F1F5F9;
      border: 1px dashed #94A3B8;
      border-radius: 4px;
      padding: 8px 12px;
      font-family: monospace;
      font-size: 9pt;
      margin: 8px 0;
      text-align: center;
      color: #0F172A;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="title-area">
      <span class="badge badge-primary">FactWise Assessment</span>
      <span class="badge badge-dark">Technical Product Manager</span>
      <h1>VirusCare Platform Specification</h1>
      <p class="subtitle">Patient Quarantine & Treatment Facility Management System</p>
    </div>
    <div class="meta-box">
      <div><strong>Candidate:</strong> TPM Candidate</div>
      <div><strong>File Name:</strong> [Your Name] TPM.pdf</div>
      <div><strong>Target Facility:</strong> 74-Bed Dedicated Isolation Center</div>
      <div><strong>Benchmark:</strong> 85% Cure Rate / 15% Mortality</div>
    </div>
  </div>

  <!-- SECTION 1: PROBLEM OVERVIEW -->
  <div class="card">
    <div class="card-title">Executive Problem Summary & Facility Context</div>
    <p style="margin:0; font-size: 9.5pt; color: #334155;">
      A 74-bed virus quarantine and treatment center operates at 100% capacity under severe staffing strain. The disease exhibits an expected 15% mortality rate, with prolonged fever as the primary clinical symptom. Patients are clinically cured once they achieve <strong>3 consecutive calendar days without fever</strong> (&lt; 37.5°C). Operational bottlenecks—including paper journal logging, duplicate temperature readings, erratic doctor visits occurring before vital signs are taken, and delayed discharge communication—cause patients to stay 1–2 days longer than necessary while denying beds to incoming patients. This application eliminates clinical chaos through strict sequencing, automated discharge detection, and real-time epidemiological surveillance.
    </p>
  </div>

  <!-- Q1 -->
  <h2>Q1) User Roles, Features, and Actions (Version 1)</h2>
  <p>To resolve the operational breakdown, the MVP defines three distinct operational roles with strict separation of concerns, supplemented by system automation:</p>

  <div class="card">
    <div class="card-title">1. Nurse (Clinical Monitoring Specialist)</div>
    <p><strong>Primary Goal:</strong> Conduct scheduled vital sign rounds across all 74 beds rapidly without duplicate entries or missed patients.</p>
    <ul>
      <li><strong>Today's Monitoring Roster:</strong> A live, interactive list of all active patients categorized into <em>"Pending Temperature Check"</em>, <em>"Completed Today"</em>, and <em>"Active Fever Alert"</em>.</li>
      <li><strong>Rapid Vital Sign Logging:</strong> Direct numeric Celsius input dialog with physiological range bounds (34.0°C – 43.0°C).</li>
      <li><strong>Immediate Duplicate Lock:</strong> The system automatically blocks a second normal temperature reading on the same calendar day for the same patient.</li>
      <li><strong>Authorized Reading Correction Workflow:</strong> If a recording typo occurs, a nurse can submit a formal correction with a mandatory audit reason (&ge; 10 characters), updating records without losing historical audit integrity.</li>
      <li><strong>Historical Temperature Sparkline:</strong> Instant visual sparkline showing past readings to identify trajectory before reporting to doctors.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">2. Doctor (Attending Physician)</div>
    <p><strong>Primary Goal:</strong> Review vitals, conduct daily rounds efficiently without waiting for temperature measurements, prescribe treatment, and certify clinical outcomes.</p>
    <ul>
      <li><strong>Prioritized Clinical Queue:</strong> Patients sorted by priority: <em>"Ready for Doctor Visit"</em> (temperature already recorded by nurse) vs <em>"Waiting on Nurse Check"</em>. Fevers (&ge; 37.5°C) are elevated to the top.</li>
      <li><strong>Pre-Requisite Workflow Gate:</strong> The application warns and restricts routine visit recording if today's nurse vital check is absent, preventing wasted doctor time.</li>
      <li><strong>Clinical Exception Override:</strong> In emergencies or when the doctor personally takes vital signs, an authorized exception path permits visit entry with mandatory clinical justification.</li>
      <li><strong>Clinical Examination &amp; Notes:</strong> Digital recording of treatment plans, medication adjustments, and clinical observations.</li>
      <li><strong>3-Day Fever-Free Indicator:</strong> Real-time clinical status showing exact consecutive fever-free count (e.g., <em>"Day 2 of 3"</em> or <em>"Discharge Eligible"</em>).</li>
      <li><strong>Clinical Outcome Certification:</strong> Formal recording of patient demise or recovery confirmation.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">3. Admin / Facility Operations Manager</div>
    <p><strong>Primary Goal:</strong> Maximize facility throughput, enforce the 74-bed capacity ceiling, discharge eligible patients immediately to free beds, and monitor clinical quality.</p>
    <ul>
      <li><strong>74-Bed Facility Interactive Map:</strong> Real-time visual matrix of all 74 physical beds with color-coded status (Occupied, Fever Alert, Discharge Eligible, Vacant).</li>
      <li><strong>Patient Admission &amp; Automatic Bed Allocation:</strong> Admission portal that assigns the lowest available bed (1..74) in a transactional lock, preventing double-booking or exceeding capacity.</li>
      <li><strong>Automated Discharge Authorization Center:</strong> Instant identification of patients who meet the 3-day fever-free criterion, with a 1-click discharge action that immediately frees the bed.</li>
      <li><strong>Epidemiological Surveillance Dashboard:</strong> Live calculation of facility Mortality Rate vs. 15% benchmark and Treatment Success Rate vs. 85% benchmark, with automated warning banners.</li>
      <li><strong>Immutable Audit Trail &amp; Governance:</strong> Append-only log recording actor, action, timestamp, and JSON diffs of all clinical/operational modifications.</li>
      <li><strong>User Management:</strong> Provisioning accounts, assigning roles (Admin, Nurse, Doctor), and revoking access.</li>
    </ul>
  </div>

  <!-- RBAC TABLE -->
  <table style="margin-top: 10px;">
    <thead>
      <tr>
        <th>Feature / Action</th>
        <th class="text-center">Nurse</th>
        <th class="text-center">Doctor</th>
        <th class="text-center">Admin</th>
        <th>System / Automated Logic</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>View 74-Bed Map &amp; Patient Directory</td>
        <td class="text-center">✓ (Read)</td>
        <td class="text-center">✓ (Read)</td>
        <td class="text-center">✓ (Full)</td>
        <td>Auto-refreshes on state change</td>
      </tr>
      <tr>
        <td>Admit Patient &amp; Assign Bed</td>
        <td class="text-center">—</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td>Enforces 74-bed max capacity limit</td>
      </tr>
      <tr>
        <td>Record Daily Temperature</td>
        <td class="text-center">✓</td>
        <td class="text-center">—</td>
        <td class="text-center">—</td>
        <td>Blocks duplicate daily reading</td>
      </tr>
      <tr>
        <td>Correct Erroneous Reading</td>
        <td class="text-center">✓ (With Reason)</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td>Appends audit log, triggers recalculation</td>
      </tr>
      <tr>
        <td>Record Doctor Visit &amp; Notes</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td class="text-center">—</td>
        <td>Requires nurse reading or exception reason</td>
      </tr>
      <tr>
        <td>Evaluate 3-Day Discharge Eligibility</td>
        <td class="text-center">View-only</td>
        <td class="text-center">✓ (Clinical Review)</td>
        <td class="text-center">✓ (Execution)</td>
        <td>Automated continuous 3-day verification</td>
      </tr>
      <tr>
        <td>Authorize &amp; Execute Discharge</td>
        <td class="text-center">—</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td>Atomically releases bed to vacant state</td>
      </tr>
      <tr>
        <td>Certify Mortality / Demise</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td class="text-center">✓</td>
        <td>Updates mortality analytics immediately</td>
      </tr>
      <tr>
        <td>Configure Capacity &amp; Fever Threshold</td>
        <td class="text-center">—</td>
        <td class="text-center">—</td>
        <td class="text-center">✓</td>
        <td>Guards against capacity &lt; occupancy</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- Q2 -->
  <h2>Q2) Functional Prototype &amp; Production Architecture</h2>
  <div class="success-box">
    <strong>Working Deployment &amp; Repository Deliverables:</strong><br>
    • <strong>Live Production URL:</strong> Deployed on Vercel with real-time cloud PostgreSQL database.<br>
    • <strong>GitHub Repository:</strong> <a href="https://github.com/DhirajK24/Factwise_Assignment_VirusCare">https://github.com/DhirajK24/Factwise_Assignment_VirusCare</a><br>
    • <strong>Cloud PostgreSQL Database:</strong> Supabase Cloud (<span class="font-mono">https://typbrlzqsmetuxdqgdgf.supabase.co</span>) with Row Level Security (RLS) &amp; partial unique indexes.
  </div>

  <h3>Key Screens &amp; Demonstrable Workflows</h3>
  <div class="card">
    <div class="card-title">1. Operational Command Center &amp; 74-Bed Map (<span class="font-mono">/dashboard</span>)</div>
    <p>Provides a visual representation of all 74 isolation rooms. Each bed card indicates occupancy, patient code, current day's temperature status, and pulse animations for fevers. Top metrics display real-time occupancy rate, pending vital checks, and pending doctor visits.</p>
  </div>

  <div class="card">
    <div class="card-title">2. Nurse Temperature Monitoring Station (<span class="font-mono">/temperature-monitoring</span>)</div>
    <p>Displays today's active patient census. Nurses can filter by <em>"Pending Checks"</em> to see remaining patients. Clicking <em>"Record Temp"</em> launches the validation modal. Once recorded, the button switches to <em>"Completed"</em> with the recorded temperature; any attempt to enter a second reading is blocked at the UI and database levels.</p>
  </div>

  <div class="card">
    <div class="card-title">3. Doctor Clinical Rounds Portal (<span class="font-mono">/doctor-visits</span>)</div>
    <p>Sorts patients into those ready for visits (nurse check complete) and those awaiting nurse vitals. Attempting a routine visit on a patient without a nurse check surfaces an alert explaining the requirement. A clinical exception toggle enables bypass with mandatory medical notes.</p>
  </div>

  <div class="card">
    <div class="card-title">4. Automated Discharge Center (<span class="font-mono">/discharge</span>)</div>
    <p>The engine continuously analyzes patient temperature streams. When a patient achieves 3 consecutive fever-free calendar days (&lt; 37.5°C), they appear with a green badge and an active <em>"Authorize Discharge"</em> button. Clicking it transitions the patient to <em>"Discharged"</em> and immediately frees the bed for incoming triage.</p>
  </div>

  <div class="card">
    <div class="card-title">5. Epidemiological Surveillance &amp; Quality Benchmarking (<span class="font-mono">/analytics</span>)</div>
    <p>Calculates dynamic mortality and recovery rates strictly from completed patient outcomes. If mortality exceeds the 15% facility benchmark, a high-priority warning banner alerts administrators to conduct clinical quality reviews.</p>
  </div>

  <div class="card">
    <div class="card-title">6. Built-In Role Simulator &amp; Audit Trail (<span class="font-mono">/audit-history</span>)</div>
    <p>Allows reviewers to toggle between <strong>Admin</strong>, <strong>Nurse</strong>, and <strong>Doctor</strong> roles with a single click in the top navigation bar to test role permissions. Every single action writes an immutable event into the audit log with JSON diffs.</p>
  </div>

  <!-- Q3 -->
  <h2>Q3) Deep Logical Constraints &amp; Edge Cases</h2>
  <p>To ensure system resilience, the following business logic constraints were specified and implemented:</p>

  <ol>
    <li>
      <strong>Strict 74-Bed Hard Capacity Constraint:</strong>
      <p>The facility cannot exceed 74 occupied beds. This is guarded at the database level with a partial unique index:
      <span class="font-mono">CREATE UNIQUE INDEX idx_patients_active_bed ON patients(bed_number) WHERE status IN ('active', 'discharge_eligible');</span>
      Concurrent admission requests lock the bed sequence atomically; if all 74 beds are full, admission requests return HTTP 409 with an explanatory message.</p>
    </li>
    <li>
      <strong>Daily Temperature Uniqueness &amp; Correction Governance:</strong>
      <p>Only one normal daily temperature is permitted per patient per date:
      <span class="font-mono">UNIQUE (patient_id, reading_date)</span>.
      A nurse cannot overwrite an entry; corrections require an explicit reason (&ge; 10 characters), creating an append-only audit trail and triggering automatic discharge re-evaluation.</p>
    </li>
    <li>
      <strong>Physiological Vital Sign Boundaries:</strong>
      <p>Inputs outside 34.0°C – 43.0°C are rejected as clinical entry errors. Readings &ge; 37.5°C flag fever status; readings &ge; 39.5°C trigger high-fever priority alerts.</p>
    </li>
    <li>
      <strong>Doctor Round Sequencing &amp; Pre-Requisite Gate:</strong>
      <p>Routine doctor rounds require today's nurse reading. If missing, the normal submission button is disabled. To override in emergency scenarios, the physician must supply a detailed clinical exception reason.</p>
    </li>
    <li>
      <strong>3-Consecutive-Day Fever-Free Calculation Rule:</strong>
      <p>Discharge eligibility requires 3 uninterrupted calendar days (Day <em>T-2</em>, Day <em>T-1</em>, Day <em>T</em>) where temperature is strictly below the fever threshold (37.5°C). If a patient has 2 fever-free days and registers 37.6°C on Day 3, the counter resets to 0. A missing reading on any day breaks continuity and penalizes the sequence.</p>
    </li>
    <li>
      <strong>Epidemiological Closed-Cohort Mortality Rate Formula:</strong>
      <p>Active inpatients currently undergoing treatment must <strong>never</strong> be included in the mortality denominator, as doing so falsely depresses the mortality rate. The formula strictly evaluates completed outcomes:</p>
      <div class="formula">
        Mortality Rate (%) = [ Deceased / (Discharged_Recovered + Deceased) ] × 100<br>
        Treatment Success Rate (%) = [ Discharged_Recovered / (Discharged_Recovered + Deceased) ] × 100
      </div>
      <p>If total completed outcomes equals 0, the system displays "N/A" to prevent division-by-zero errors.</p>
    </li>
    <li>
      <strong>Facility Capacity Reduction Lock:</strong>
      <p>An administrator cannot decrease facility capacity below current active patient occupancy (e.g., cannot set capacity to 50 if 62 patients are admitted).</p>
    </li>
  </ol>

  <div class="page-break"></div>

  <!-- Q4 -->
  <h2>Q4) Sprint Planning &amp; Value Optimization (Knapsack Solution)</h2>
  
  <h3>1. Capacity &amp; Value Model Formulation</h3>
  <ul>
    <li><strong>Total Team Velocity:</strong> 25 Story Points</li>
    <li><strong>Pre-committed Stories:</strong> 3 stories of 5 points each = <strong>15 Story Points</strong></li>
    <li><strong>Remaining Sprint Capacity:</strong> 25 – 15 = <strong>10.0 Story Points</strong></li>
    <li><strong>Value Weighting Rule:</strong> High = 2× Medium; Medium = 3× Low.
      <br>Setting base unit $V_{Low} = 1$:
      <strong>Low Priority = 1 Value Point</strong>, 
      <strong>Medium Priority = 3 Value Points</strong>, 
      <strong>High Priority = 6 Value Points</strong>.
    </li>
  </ul>

  <h3>2. Feature Priority, Effort &amp; ROI Ranking</h3>
  <table>
    <thead>
      <tr>
        <th class="text-center">Feature</th>
        <th>Priority</th>
        <th class="text-center">Effort (Story Pts)</th>
        <th class="text-center">Value</th>
        <th class="text-center">ROI (Value / Effort)</th>
        <th class="text-center">Selection Status</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>J</strong></td>
        <td>Low</td>
        <td class="text-center">0.1</td>
        <td class="text-center">1</td>
        <td class="text-center font-mono"><strong>10.00</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>A</strong></td>
        <td>High</td>
        <td class="text-center">1.0</td>
        <td class="text-center">6</td>
        <td class="text-center font-mono"><strong>6.00</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>I</strong></td>
        <td>Low</td>
        <td class="text-center">0.3</td>
        <td class="text-center">1</td>
        <td class="text-center font-mono"><strong>3.33</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>F</strong></td>
        <td>Medium</td>
        <td class="text-center">1.0</td>
        <td class="text-center">3</td>
        <td class="text-center font-mono"><strong>3.00</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>G</strong></td>
        <td>Low</td>
        <td class="text-center">0.4</td>
        <td class="text-center">1</td>
        <td class="text-center font-mono"><strong>2.50</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>B</strong></td>
        <td>High</td>
        <td class="text-center">3.0</td>
        <td class="text-center">6</td>
        <td class="text-center font-mono"><strong>2.00</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>H</strong></td>
        <td>Low</td>
        <td class="text-center">0.5</td>
        <td class="text-center">1</td>
        <td class="text-center font-mono"><strong>2.00</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #F0FDF4;">
        <td class="text-center font-mono"><strong>D</strong></td>
        <td>Medium</td>
        <td class="text-center">2.0</td>
        <td class="text-center">3</td>
        <td class="text-center font-mono"><strong>1.50</strong></td>
        <td class="text-center"><span class="highlight">SELECTED</span></td>
      </tr>
      <tr style="background-color: #FEF2F2;">
        <td class="text-center font-mono"><strong>C</strong></td>
        <td>High</td>
        <td class="text-center">5.0</td>
        <td class="text-center">6</td>
        <td class="text-center font-mono">1.20</td>
        <td class="text-center" style="color:#DC2626; font-weight:600;">Excluded (Low ROI)</td>
      </tr>
      <tr style="background-color: #FEF2F2;">
        <td class="text-center font-mono"><strong>E</strong></td>
        <td>Medium</td>
        <td class="text-center">3.0</td>
        <td class="text-center">3</td>
        <td class="text-center font-mono">1.00</td>
        <td class="text-center" style="color:#DC2626; font-weight:600;">Excluded (High Effort)</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Mathematical Optimization &amp; Proof</h3>
  <p>The goal is to solve the 0/1 Knapsack optimization problem: <strong>maximize total value</strong> subject to $\sum \text{Effort} \le 10.0$, and secondarily <strong>minimize effort</strong>.</p>

  <div class="card">
    <div class="card-title">Comparative Portfolio Analysis</div>
    <ul>
      <li>
        <strong>Option 1 (Selecting all High-Priority features {A, B, C}):</strong>
        <br>Effort = 1.0 (A) + 3.0 (B) + 5.0 (C) = 9.0 points. Remaining capacity = 1.0 point.
        <br>Adding best micro-features: J (0.1) + I (0.3) + G (0.4) = 0.8 effort.
        <br>Total Effort = 9.8 points. <strong>Total Value = 6 + 6 + 6 + 1 + 1 + 1 = 21 Value Points</strong>.
      </li>
      <li style="margin-top: 8px;">
        <strong>Option 2 (Optimal Value-Density Portfolio {A, B, D, F, G, H, I, J}):</strong>
        <br>Replacing heavy feature C (Effort 5.0, Value 6) with high-density features {D, F, G, H, I, J} delivers 10 value points for only 4.3 effort points!
        <br>Total Effort = 1.0 (A) + 3.0 (B) + 2.0 (D) + 1.0 (F) + 0.4 (G) + 0.5 (H) + 0.3 (I) + 0.1 (J) = <strong>8.3 Story Points</strong>.
        <br><strong>Total Value = 6 + 6 + 3 + 3 + 1 + 1 + 1 + 1 = 22 Value Points</strong>.
      </li>
      <li style="margin-top: 8px;">
        <strong>Option 3 (Swapping D for E):</strong>
        <br>Features {A, B, E, F, G, H, I, J} also delivers 22 value points, but requires Effort = 1.0 + 3.0 + 3.0 + 1.0 + 0.4 + 0.5 + 0.3 + 0.1 = <strong>9.3 Story Points</strong>.
        <br>Since the objective mandates that <em>effort must be minimized</em>, Option 2 (8.3 points) strictly dominates Option 3.
      </li>
    </ul>
  </div>

  <div class="success-box" style="margin-top: 14px;">
    <strong style="font-size: 11pt;">Final Recommendation for Sprint Backlog:</strong><br>
    Add features: <strong>A, B, D, F, G, H, I, J</strong><br>
    • <strong>Total Additional Effort:</strong> <strong>8.3 Story Points</strong> (fits comfortably within the 10.0-point capacity, leaving 1.7 buffer for QA/contingency)<br>
    • <strong>Total Value Delivered:</strong> <strong>22 Value Points</strong> (Absolute mathematical maximum)
  </div>

</body>
</html>
`;

async function generatePDF() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  
  const outputPath = path.join(__dirname, '..', 'FactWise_TPM_Assessment_Submission.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm'
    }
  });

  await browser.close();
  console.log('Successfully generated assessment PDF at:', outputPath);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
