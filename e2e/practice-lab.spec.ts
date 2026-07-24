import { test, expect } from "@playwright/test";

test.describe("Practice Lab", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Performance Pulse" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("unauthenticated users redirect to login", async ({ page }) => {
    await page.goto("/practice-lab");
    await expect(page).toHaveURL(/login/);
  });
});
