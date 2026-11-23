import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroArchitectureMap } from "@/components/HeroArchitectureMap";
import { TOTAL_LOOP_DURATION_MS } from "@/features/hero-loop/timeline";
import { I18nProvider } from "@/i18n/I18nContext";

function renderHero() {
  return render(
    <I18nProvider>
      <HeroArchitectureMap />
    </I18nProvider>,
  );
}

describe("HeroArchitectureMap component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all 5 stage nodes, KPI pills, timeline controls, and opens/closes node drawer", () => {
    renderHero();

    expect(
      screen.getByRole("heading", {
        name: /Agentic Hardware Lab: Zero-GUI Mechanical CAD/i,
      }),
    ).toBeInTheDocument();

    // Click Stage 2 node inside SVG to open deep-dive drawer
    const stage2Node = screen.getByRole("button", { name: /STAGE 02 Code-CAD MCP/i });
    fireEvent.click(stage2Node);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/build123d-mcp@latest/i).length).toBeGreaterThan(0);

    // Close drawer via Close button
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open Stage 4 node via Keyboard Enter key
    const stage4Node = screen.getByRole("button", { name: /STAGE 04 Physics & FEA/i });
    fireEvent.mouseEnter(stage4Node);
    fireEvent.keyDown(stage4Node, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via Space key on Stage 5
    const stage5Node = screen.getByRole("button", { name: /STAGE 05 Headless Slicer/i });
    fireEvent.keyDown(stage5Node, { key: " " });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("drawer-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("runs the 60fps closed-loop simulation through failure, self-correction, pause/resume, and pass", () => {
    renderHero();

    const simulateBtn = screen.getByRole("button", { name: /Simulate Agent Loop/i });
    fireEvent.click(simulateBtn);

    expect(screen.getByRole("button", { name: /Running Closed Loop/i })).toBeDisabled();
    expect(screen.getByTestId("hero-telemetry-packet")).toBeInTheDocument();

    // Advance to Stage 3 Failure (1,600ms)
    act(() => {
      vi.advanceTimersByTime(1650);
    });
    expect(
      screen.getAllByText(/Gear Teeth Interference Detected \(-0\.42mm\)/i).length,
    ).toBeGreaterThan(0);

    // Pause and resume loop
    const pauseBtn = screen.getByRole("button", { name: /Pause Loop/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByRole("button", { name: /Resume Loop/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Resume Loop/i }));

    // Advance through loopback, stage2-fix, stage3-pass, stage4, stage5 to passed
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText(/ALL GATES PASS/i)).toBeInTheDocument();

    // Reset loop
    fireEvent.click(screen.getByRole("button", { name: /Reset Loop/i }));
    expect(screen.getByText(/IDLE — Click Simulate Agent Loop/i)).toBeInTheDocument();
  });

  it("supports timeline scrubbing, direct phase jumping, playback speed, auto-cycle, and stage inspector tabs", () => {
    renderHero();

    // Direct phase jump pills
    fireEvent.click(screen.getByRole("button", { name: /03 · Gate 3 Collision/i }));
    expect(
      screen.getAllByText(/Gear Teeth Interference Detected \(-0\.42mm\)/i).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /↺ Auto-Patch Loop/i }));
    expect(screen.getByText(/Δ patch: root_clearance \+0\.25mm/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /03 · Gate 3 Pass/i }));
    expect(screen.getByText(/Gate 3 Passed: 0\.00 mm³ Interference/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /✓ 05 · Converged/i }));
    expect(screen.getByText(/ALL GATES PASS/i)).toBeInTheDocument();

    // Scrub timeline slider directly
    const scrubber = screen.getByRole("slider", { name: /Timeline scrubber/i });
    fireEvent.change(scrubber, { target: { value: "1000" } });
    expect(screen.getByText(/Stage 2: Executing OpenCascade B-Rep kernel/i)).toBeInTheDocument();

    // Switch stage inspector mini-tabs and open drawer from inspector button
    fireEvent.click(screen.getByRole("button", { name: "01" }));
    fireEvent.click(screen.getByRole("button", { name: /Inspect \.mcp\.json & CLI Setup/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));

    // Enable Auto-Cycle and 2x speed, then run past total duration to verify wrap-around
    fireEvent.click(screen.getByRole("button", { name: /Auto-Cycle/i }));
    fireEvent.click(screen.getByRole("button", { name: "2x" }));
    fireEvent.click(screen.getByRole("button", { name: /Simulate Agent Loop/i }));

    act(() => {
      vi.advanceTimersByTime(TOTAL_LOOP_DURATION_MS);
    });
    // Because Auto-Cycle is enabled, it wraps back around and stays playing
    expect(screen.getByRole("button", { name: /Running Closed Loop/i })).toBeDisabled();
  });
});
