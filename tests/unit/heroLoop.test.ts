import { describe, expect, it } from "vitest";
import {
  clamp,
  easeInOutCubic,
  evaluatePath,
  lerp,
  pathToD,
  samplePath,
  smoothstep,
} from "@/features/hero-loop/geometry";
import {
  evaluateTimelineAt,
  getPhaseStartMs,
  getPhaseTelemetryLog,
  HERO_CANVAS,
  HERO_NODE_CENTERS,
  HERO_PATHS,
  type LoopPhase,
  PHASE_WINDOWS,
  TOTAL_LOOP_DURATION_MS,
} from "@/features/hero-loop/timeline";

describe("hero-loop geometry utilities", () => {
  it("clamps, lerps, eases, and smoothsteps accurately", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(5)).toBe(1);
    expect(clamp(0.4)).toBe(0.4);
    expect(lerp(10, 20, 0.5)).toBe(15);

    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 4);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 4);
    expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 4);
    expect(easeInOutCubic(1)).toBe(1);

    expect(smoothstep(0, 10, -2)).toBe(0);
    expect(smoothstep(0, 10, 5)).toBeCloseTo(0.5, 4);
    expect(smoothstep(0, 10, 12)).toBe(1);
    expect(smoothstep(5, 5, 3)).toBe(0);
    expect(smoothstep(5, 5, 5)).toBe(1);
  });

  it("formats SVG path strings and samples arc-length LUTs for lines and cubics", () => {
    const lineGeo = {
      kind: "line" as const,
      from: { x: 100, y: 188 },
      to: { x: 300, y: 188 },
    };
    expect(pathToD(lineGeo)).toBe("M 100 188 L 300 188");
    expect(evaluatePath(lineGeo, 0.5)).toEqual({ x: 200, y: 188 });

    const sampledLine = samplePath(lineGeo, 20);
    expect(sampledLine.length).toBeCloseTo(200, 3);
    expect(sampledLine.pointAt(0)).toEqual({ x: 100, y: 188 });
    expect(sampledLine.pointAt(0.5).x).toBeCloseTo(200, 1);
    expect(sampledLine.pointAt(1)).toEqual({ x: 300, y: 188 });

    // Degenerate zero-length path
    const zeroLine = samplePath({
      kind: "line",
      from: { x: 42, y: 42 },
      to: { x: 42, y: 42 },
    });
    expect(zeroLine.length).toBe(0);
    expect(zeroLine.pointAt(0.5)).toEqual({ x: 42, y: 42 });

    // Cubic Bézier path
    const cubicGeo = {
      kind: "cubic" as const,
      p0: { x: 620, y: 272 },
      p1: { x: 620, y: 408 },
      p2: { x: 373, y: 408 },
      p3: { x: 373, y: 272 },
    };
    expect(pathToD(cubicGeo)).toContain("C 620 408, 373 408, 373 272");
    const sampledCubic = samplePath(cubicGeo, 64);
    expect(sampledCubic.length).toBeGreaterThan(247);
    const midPt = sampledCubic.pointAt(0.5);
    expect(midPt.x).toBeCloseTo(496.5, 0);
    expect(midPt.y).toBeGreaterThan(350);
  });
});

describe("hero-loop timeline engine", () => {
  it("defines valid canvas dimensions, node centers, and pre-sampled paths", () => {
    expect(HERO_CANVAS.width).toBe(1240);
    expect(HERO_NODE_CENTERS).toHaveLength(5);
    expect(HERO_PATHS.forward).toHaveLength(4);
    expect(HERO_PATHS.loopback.length).toBeGreaterThan(300);
    expect(HERO_PATHS.telemetryReturn.length).toBeGreaterThan(900);
  });

  it("returns idle state when elapsedMs is null or negative", () => {
    const idleSnap = evaluateTimelineAt(null);
    expect(idleSnap.phase).toBe("idle");
    expect(idleSnap.packet).toBeNull();
    expect(idleSnap.forwardEdgeFill).toEqual([0, 0, 0, 0]);
    expect(idleSnap.kpis.clearanceStatus).toBe("idle");
    expect(getPhaseStartMs("idle")).toBe(0);
    expect(getPhaseStartMs("passed")).toBe(TOTAL_LOOP_DURATION_MS);
  });

  it("evaluates every active phase window with packet coordinates, comet trails, and node states", () => {
    const phases: Exclude<LoopPhase, "idle">[] = [
      "stage1",
      "stage2",
      "stage3-fail",
      "loopback",
      "stage2-fix",
      "stage3-pass",
      "stage4",
      "stage5",
      "passed",
    ];

    for (const phase of phases) {
      const startMs = getPhaseStartMs(phase);
      const win = PHASE_WINDOWS.find((w) => w.phase === phase);
      expect(win).toBeDefined();
      if (!win) continue;

      // Test both early in the phase (dwelling at node) and late in the phase (in transit)
      const earlyMs = phase === "passed" ? TOTAL_LOOP_DURATION_MS : startMs + 50;
      const lateMs = phase === "passed" ? TOTAL_LOOP_DURATION_MS : win.endMs - 50;

      const earlySnap = evaluateTimelineAt(earlyMs);
      const lateSnap = evaluateTimelineAt(lateMs);

      expect(earlySnap.phase).toBe(phase);
      expect(lateSnap.phase).toBe(phase);
      expect(earlySnap.packet).not.toBeNull();
      expect(lateSnap.packet?.trail.length).toBeGreaterThanOrEqual(5);

      const log = getPhaseTelemetryLog(phase);
      expect(log.phase).toBe(phase);
      expect(log.headline.length).toBeGreaterThan(10);
      expect(log.codeSnippet.length).toBeGreaterThan(10);
    }

    // Verify specific failure and self-correction semantics
    const failSnap = evaluateTimelineAt(2000);
    expect(failSnap.phase).toBe("stage3-fail");
    expect(failSnap.nodes[2].status).toBe("failed");
    expect(failSnap.kpis.clearanceStatus).toBe("fail");

    const loopbackSnap = evaluateTimelineAt(3200);
    expect(loopbackSnap.phase).toBe("loopback");
    expect(loopbackSnap.loopbackFill).toBeGreaterThan(0.3);
    expect(loopbackSnap.nodes[1].status).toBe("patching");

    const passedSnap = evaluateTimelineAt(TOTAL_LOOP_DURATION_MS + 500);
    expect(passedSnap.phase).toBe("passed");
    expect(passedSnap.overallProgress).toBe(1);
    expect(passedSnap.telemetryReturnFill).toBe(1);
    expect(passedSnap.nodes.every((n) => n.status === "passed")).toBe(true);
  });
});
