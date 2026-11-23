import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Agentic Hardware Lab E2E & Accessibility", () => {
  test("renders all core modules and passes Axe-Core WCAG AA/AAA audit", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Agentic Hardware Lab: Zero-GUI Mechanical CAD/i,
      }),
    ).toBeVisible();

    // Wait for lazy-loaded sections to settle before running full-page accessibility audit
    await expect(
      page.getByRole("heading", { name: /Live Parametric Code-CAD Studio/i }),
    ).toBeVisible();

    // Verify Axe-Core accessibility audit has 0 violations
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test("opens architecture node drawer, controls timeline scrubber/phases, and simulates closed-loop failure & recovery", async ({
    page,
  }) => {
    await page.goto("/");

    // Open Stage 2 node drawer via SVG node card
    await page.getByRole("button", { name: /STAGE 02 Code-CAD MCP/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/build123d-mcp@latest/i).first()).toBeVisible();
    await page.getByRole("button", { name: /Close/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // Jump directly to Gate 3 Collision and Auto-Patch Loop via phase pills
    await page.getByRole("button", { name: /03 · Gate 3 Collision/i }).click();
    await expect(
      page.getByText(/Gear Teeth Interference Detected \(-0\.42mm\)/i).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /↺ Auto-Patch Loop/i }).click();
    await expect(page.getByText(/Δ patch: root_clearance \+0\.25mm/i)).toBeVisible();

    // Inspect Stage 04 in the bottom Stage Inspector and open its drawer
    await page.getByRole("button", { name: "04", exact: true }).click();
    await page
      .getByRole("button", { name: /Inspect \.mcp\.json & CLI Setup \(Stage 04\)/i })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /Close/i }).click();

    // Select 2x speed and run full 60fps Simulate Agent Loop
    await page.getByRole("button", { name: "2x", exact: true }).click();
    await page.getByRole("button", { name: /Simulate Agent Loop/i }).click();
    await expect(
      page.getByText(/Gear Teeth Interference Detected \(-0\.42mm\)/i).first(),
    ).toBeVisible({
      timeout: 4000,
    });
    await expect(page.getByText(/ALL GATES PASS/i)).toBeVisible({ timeout: 8000 });
  });

  test("switches Physics/FEA modes and Technology Deep-Dive tabs", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: /Mode B: Structural Stress FEA/i }).click();
    await expect(page.getByText(/CalculiX \(ccx\) von Mises Stress Heatmap/i)).toBeVisible();
    await expect(page.getByText(/PA12-CF/i).first()).toBeVisible();

    await page.getByRole("tab", { name: /3\. Kinematics & Robotics Physics/i }).click();
    await expect(page.getByText(/MuJoCo \/ Genesis/i).first()).toBeVisible();
  });

  test("switches CAD orthographic views and navigates to 3D Examples page", async ({ page }) => {
    await page.goto("/");

    // Switch CAD 3D view modes
    await page.getByRole("button", { name: "Top", exact: true }).click();
    await expect(page.getByRole("button", { name: "Top", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Front", exact: true }).click();
    await expect(page.getByRole("button", { name: "Front", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Navigate to 3D Examples page
    await page
      .getByRole("button", { name: /3D Examples/i })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: /Everyday Parametric 3D Printing Gallery/i }),
    ).toBeVisible();

    // Switch through all 3 general examples
    await page.getByRole("tab", { name: /2\. Print-in-Place Articulated Hinge/i }).click();
    await expect(page.getByText(/Articulation Angle/i)).toBeVisible();

    await page.getByRole("tab", { name: /3\. Modular Desk Cable Organizer/i }).click();
    await expect(page.getByText(/Slot Count/i)).toBeVisible();
  });
});
