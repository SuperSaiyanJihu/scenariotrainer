import { test, expect } from "@playwright/test";

test.describe("Practice Lab authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("unauthenticated users redirect to login", async ({ page }) => {
    await page.goto("/practice-lab");
    await expect(page).toHaveURL(/login/);
  });

  test("employee can sign in and open Practice Lab", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("employee@goswimexcel.com");
    await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/practice-lab");
    await expect(page.getByRole("heading", { name: "Practice Lab" })).toBeVisible();
  });

  test("employee can open a scenario detail page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("employee@goswimexcel.com");
    await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/practice-lab");
    const link = page.getByRole("link", { name: "View" }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByText("Your Role")).toBeVisible();
    await expect(page.getByRole("button", { name: /Text practice/ })).toBeVisible();
  });

  test("unauthorized admin routes are blocked for employees", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("employee@goswimexcel.com");
    await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/admin/practice-lab");
    await expect(page).toHaveURL(/dashboard/);
  });

  test("supervisor can open team results", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("supervisor@goswimexcel.com");
    await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/supervisor/practice-lab");
    await expect(page.getByRole("heading", { name: "Team Practice Activity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assign Scenario" })).toBeVisible();
  });

  test("superadmin can open scenario manager", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("superadmin@goswimexcel.com");
    await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/admin/practice-lab");
    await expect(page.getByRole("heading", { name: "Manage Scenarios" })).toBeVisible();
  });
});
