import { test, expect } from "@playwright/test";

test.describe("VirusCare SaaS Critical Workflows", () => {
  test("loads the login page and presents verified 1-click persona shortcuts", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/VirusCare/);
    await expect(page.getByText("VirusCare", { exact: false })).toBeVisible();
    await expect(page.getByText("Quarantine Facility Access")).toBeVisible();

    // Verify 1-click persona shortcuts are visible
    await expect(page.getByText("Dr. Sarah Chen, MD")).toBeVisible();
    await expect(page.getByText("Marcus Johnson, RN")).toBeVisible();
    await expect(page.getByText("Dr. Arjun Mehta, MD")).toBeVisible();
  });

  test("signs in as Admin and accesses the main operational dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Dr. Sarah Chen, MD").click();

    await page.waitForURL("/dashboard");
    await expect(page.getByText("Facility Command Center")).toBeVisible();
    await expect(page.getByText("Quarantine Isolation Unit Bed Status (74 Beds)")).toBeVisible();

    // Check summary statistics
    await expect(page.getByText("Facility Occupancy")).toBeVisible();
    await expect(page.getByText("Discharge Eligible")).toBeVisible();
  });

  test("navigates to Nurse Monitoring workstation", async ({ page }) => {
    await page.goto("/temperature-monitoring");
    await expect(page.getByText("Nurse Station: Daily Temperature Monitoring")).toBeVisible();
    await expect(page.getByText("Shift Routine")).toBeVisible();
  });

  test("navigates to Doctor Clinical Rounds workstation", async ({ page }) => {
    await page.goto("/doctor-visits");
    await expect(page.getByText("Doctor Clinical Rounds & Inpatient Evaluations")).toBeVisible();
  });

  test("navigates to Discharge Center and inspects 3-day consecutive fever-free candidates", async ({ page }) => {
    await page.goto("/discharge");
    await expect(page.getByText("Discharge Eligibility Engine & Discharge Management")).toBeVisible();
    await expect(page.getByText("Eligible Candidates")).toBeVisible();
  });

  test("navigates to Analytics and checks statistical benchmarks", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByText("Mortality & Treatment Efficacy Analytics")).toBeVisible();
    await expect(page.getByText("Facility Mortality Rate")).toBeVisible();
    await expect(page.getByText("Treatment Success Rate")).toBeVisible();
  });
});

