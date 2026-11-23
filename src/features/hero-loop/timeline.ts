import {
  clamp,
  easeInOutCubic,
  type Point,
  type SampledPath,
  samplePath,
} from "@/features/hero-loop/geometry";

export type LoopPhase =
  | "idle"
  | "stage1"
  | "stage2"
  | "stage3-fail"
  | "loopback"
  | "stage2-fix"
  | "stage3-pass"
  | "stage4"
  | "stage5"
  | "passed";

export type PlaybackSpeed = 0.5 | 1 | 2;

export interface PhaseWindow {
  phase: Exclude<LoopPhase, "idle">;
  startMs: number;
  endMs: number;
  stageNumber: number;
  iteration: 1 | 2;
  color: string;
  shortLabel: string;
}

/**
 * Node card geometry inside the 1240 x 470 SVG schematic canvas.
 * Each node card is 204 x 168 centered at (x, y = 188).
 */
export const HERO_CANVAS = {
  width: 1240,
  height: 470,
  nodeWidth: 204,
  nodeHeight: 168,
  nodeHalfW: 102,
  nodeHalfH: 84,
  nodeY: 188,
} as const;

export const HERO_NODE_CENTERS: readonly Point[] = [
  { x: 126, y: HERO_CANVAS.nodeY },
  { x: 373, y: HERO_CANVAS.nodeY },
  { x: 620, y: HERO_CANVAS.nodeY },
  { x: 867, y: HERO_CANVAS.nodeY },
  { x: 1114, y: HERO_CANVAS.nodeY },
] as const;

export const FORWARD_EDGE_LABELS = [
  "build123d.py",
  "part.step + 4x PNG",
  "mjcf.xml + mesh.inp",
  "manifold.3mf",
] as const;

/** Pre-sampled geometric paths for all forward conduits and feedback arcs. */
export const HERO_PATHS: {
  forward: readonly SampledPath[];
  loopback: SampledPath;
  telemetryReturn: SampledPath;
} = {
  forward: [0, 1, 2, 3].map((idx) =>
    samplePath(
      {
        kind: "line",
        from: {
          x: HERO_NODE_CENTERS[idx].x + HERO_CANVAS.nodeHalfW,
          y: HERO_CANVAS.nodeY,
        },
        to: {
          x: HERO_NODE_CENTERS[idx + 1].x - HERO_CANVAS.nodeHalfW,
          y: HERO_CANVAS.nodeY,
        },
      },
      48,
    ),
  ),
  loopback: samplePath(
    {
      kind: "cubic",
      p0: { x: HERO_NODE_CENTERS[2].x, y: HERO_CANVAS.nodeY + HERO_CANVAS.nodeHalfH },
      p1: { x: HERO_NODE_CENTERS[2].x, y: 408 },
      p2: { x: HERO_NODE_CENTERS[1].x, y: 408 },
      p3: { x: HERO_NODE_CENTERS[1].x, y: HERO_CANVAS.nodeY + HERO_CANVAS.nodeHalfH },
    },
    120,
  ),
  telemetryReturn: samplePath(
    {
      kind: "cubic",
      p0: { x: HERO_NODE_CENTERS[4].x, y: HERO_CANVAS.nodeY - HERO_CANVAS.nodeHalfH },
      p1: { x: HERO_NODE_CENTERS[4].x, y: 26 },
      p2: { x: HERO_NODE_CENTERS[0].x, y: 26 },
      p3: { x: HERO_NODE_CENTERS[0].x, y: HERO_CANVAS.nodeY - HERO_CANVAS.nodeHalfH },
    },
    120,
  ),
};

/**
 * Full 6.8-second closed-loop simulation schedule at 1x speed:
 * - Reaches stage3-fail at 1,500 ms (well inside 4,000 ms E2E assertion window)
 * - Completes passed at 6,800 ms (well inside 8,000 ms E2E assertion window)
 */
export const PHASE_WINDOWS: readonly PhaseWindow[] = [
  {
    phase: "stage1",
    startMs: 0,
    endMs: 750,
    stageNumber: 1,
    iteration: 1,
    color: "#22D3EE",
    shortLabel: "01 · Harness AST",
  },
  {
    phase: "stage2",
    startMs: 750,
    endMs: 1500,
    stageNumber: 2,
    iteration: 1,
    color: "#22D3EE",
    shortLabel: "02 · OCCT Build #1",
  },
  {
    phase: "stage3-fail",
    startMs: 1500,
    endMs: 2750,
    stageNumber: 3,
    iteration: 1,
    color: "#EF4444",
    shortLabel: "03 · Gate 3 Collision",
  },
  {
    phase: "loopback",
    startMs: 2750,
    endMs: 3650,
    stageNumber: 2,
    iteration: 2,
    color: "#F59E0B",
    shortLabel: "↺ Auto-Patch Loop",
  },
  {
    phase: "stage2-fix",
    startMs: 3650,
    endMs: 4450,
    stageNumber: 2,
    iteration: 2,
    color: "#F59E0B",
    shortLabel: "02 · OCCT Build #2",
  },
  {
    phase: "stage3-pass",
    startMs: 4450,
    endMs: 5200,
    stageNumber: 3,
    iteration: 2,
    color: "#10B981",
    shortLabel: "03 · Gate 3 Pass",
  },
  {
    phase: "stage4",
    startMs: 5200,
    endMs: 6000,
    stageNumber: 4,
    iteration: 2,
    color: "#F59E0B",
    shortLabel: "04 · MuJoCo + FEA",
  },
  {
    phase: "stage5",
    startMs: 6000,
    endMs: 6800,
    stageNumber: 5,
    iteration: 2,
    color: "#10B981",
    shortLabel: "05 · CLI G-Code",
  },
  {
    phase: "passed",
    startMs: 6800,
    endMs: 6800,
    stageNumber: 5,
    iteration: 2,
    color: "#10B981",
    shortLabel: "✓ 05 · Converged",
  },
] as const;

export const TOTAL_LOOP_DURATION_MS = 6800;

export interface PacketSample {
  x: number;
  y: number;
  color: string;
  trail: { x: number; y: number; opacity: number; radius: number }[];
}

export type NodeVisualStatus = "idle" | "active" | "completed" | "failed" | "patching" | "passed";

export interface NodeVisualState {
  stageNumber: number;
  status: NodeVisualStatus;
  strokeColor: string;
  glowColor: string;
  badgeText: string;
  progress: number;
  liveMetricOverlay?: "fail" | "fixed" | "default";
}

export interface TimelineSnapshot {
  phase: LoopPhase;
  elapsedMs: number;
  overallProgress: number;
  phaseProgress: number;
  activeStageNumber: number;
  iteration: 1 | 2;
  packet: PacketSample | null;
  forwardEdgeFill: [number, number, number, number];
  loopbackFill: number;
  telemetryReturnFill: number;
  nodes: NodeVisualState[];
  kpis: {
    iterationLabel: string;
    clearanceMm: string;
    clearanceStatus: "idle" | "fail" | "patching" | "pass";
    safetyFactor: string;
    dfmStatus: string;
  };
}

export function getPhaseStartMs(phase: LoopPhase): number {
  if (phase === "idle") return 0;
  if (phase === "passed") return TOTAL_LOOP_DURATION_MS;
  const match = PHASE_WINDOWS.find((w) => w.phase === phase);
  return match ? match.startMs : 0;
}

/**
 * Samples a point + 7-particle comet trail along any SampledPath at a normalized progress [0..1].
 */
function buildPacketAlongPath(path: SampledPath, progress: number, color: string): PacketSample {
  const eased = easeInOutCubic(clamp(progress));
  const head = path.pointAt(eased);
  const trailCount = 7;
  const trail = Array.from({ length: trailCount }, (_, i) => {
    const lag = (i + 1) * 0.045;
    const sampleT = clamp(eased - lag);
    const pt = path.pointAt(sampleT);
    return {
      x: pt.x,
      y: pt.y,
      opacity: Math.max(0.08, 0.58 - i * 0.075),
      radius: Math.max(2.2, 6.2 - i * 0.6),
    };
  });
  return { x: head.x, y: head.y, color, trail };
}

/**
 * Samples a gentle orbital hover packet around a node center when the packet is dwelling inside a stage.
 */
function buildPacketAtNode(center: Point, localProgress: number, color: string): PacketSample {
  const angle = localProgress * Math.PI * 2;
  const rx = 18;
  const ry = 8;
  const head = {
    x: center.x + Math.cos(angle) * rx * 0.25,
    y: center.y + Math.sin(angle) * ry * 0.25,
  };
  const trail = Array.from({ length: 5 }, (_, i) => {
    const a = angle - (i + 1) * 0.35;
    return {
      x: center.x + Math.cos(a) * rx * 0.25,
      y: center.y + Math.sin(a) * ry * 0.25,
      opacity: Math.max(0.1, 0.45 - i * 0.08),
      radius: Math.max(2.2, 5.5 - i * 0.65),
    };
  });
  return { x: head.x, y: head.y, color, trail };
}

/**
 * Computes the complete visual snapshot of the 5-stage loop at any elapsed millisecond timestamp.
 */
export function evaluateTimelineAt(elapsedMs: number | null): TimelineSnapshot {
  if (elapsedMs === null || elapsedMs < 0) {
    return {
      phase: "idle",
      elapsedMs: 0,
      overallProgress: 0,
      phaseProgress: 0,
      activeStageNumber: 1,
      iteration: 1,
      packet: null,
      forwardEdgeFill: [0, 0, 0, 0],
      loopbackFill: 0,
      telemetryReturnFill: 0,
      nodes: [1, 2, 3, 4, 5].map((stageNumber) => ({
        stageNumber,
        status: "idle",
        strokeColor: "#1F2937",
        glowColor: "rgba(6, 182, 212, 0)",
        badgeText: "READY",
        progress: 0,
        liveMetricOverlay: "default",
      })),
      kpis: {
        iterationLabel: "IDLE · 0 / 2",
        clearanceMm: "0.25 mm target",
        clearanceStatus: "idle",
        safetyFactor: "2.84x target",
        dfmStatus: "Awaiting mesh",
      },
    };
  }

  const clampedMs = clamp(elapsedMs, 0, TOTAL_LOOP_DURATION_MS);
  const overallProgress = clampedMs / TOTAL_LOOP_DURATION_MS;

  let activeWindow: PhaseWindow = PHASE_WINDOWS[PHASE_WINDOWS.length - 1];
  for (const w of PHASE_WINDOWS) {
    if (w.phase !== "passed" && clampedMs < w.endMs) {
      activeWindow = w;
      break;
    }
  }

  const phase: LoopPhase = clampedMs >= TOTAL_LOOP_DURATION_MS ? "passed" : activeWindow.phase;
  const span = Math.max(1, activeWindow.endMs - activeWindow.startMs);
  const phaseProgress = phase === "passed" ? 1 : clamp((clampedMs - activeWindow.startMs) / span);

  // Compute forward conduit fill levels [edge0: 1->2, edge1: 2->3, edge2: 3->4, edge3: 4->5]
  const forwardEdgeFill: [number, number, number, number] = [0, 0, 0, 0];
  let loopbackFill = 0;
  let telemetryReturnFill = 0;
  let packet: PacketSample | null = null;

  switch (phase) {
    case "stage1": {
      const transit = clamp((phaseProgress - 0.35) / 0.65);
      forwardEdgeFill[0] = transit;
      packet =
        phaseProgress < 0.35
          ? buildPacketAtNode(HERO_NODE_CENTERS[0], phaseProgress / 0.35, "#22D3EE")
          : buildPacketAlongPath(HERO_PATHS.forward[0], transit, "#22D3EE");
      break;
    }
    case "stage2": {
      forwardEdgeFill[0] = 1;
      const transit = clamp((phaseProgress - 0.35) / 0.65);
      forwardEdgeFill[1] = transit;
      packet =
        phaseProgress < 0.35
          ? buildPacketAtNode(HERO_NODE_CENTERS[1], phaseProgress / 0.35, "#22D3EE")
          : buildPacketAlongPath(HERO_PATHS.forward[1], transit, "#22D3EE");
      break;
    }
    case "stage3-fail": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 1;
      packet = buildPacketAtNode(HERO_NODE_CENTERS[2], phaseProgress, "#EF4444");
      break;
    }
    case "loopback": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 0.35;
      loopbackFill = phaseProgress;
      packet = buildPacketAlongPath(HERO_PATHS.loopback, phaseProgress, "#F59E0B");
      break;
    }
    case "stage2-fix": {
      forwardEdgeFill[0] = 1;
      loopbackFill = 1;
      const transit = clamp((phaseProgress - 0.35) / 0.65);
      forwardEdgeFill[1] = transit;
      packet =
        phaseProgress < 0.35
          ? buildPacketAtNode(HERO_NODE_CENTERS[1], phaseProgress / 0.35, "#F59E0B")
          : buildPacketAlongPath(HERO_PATHS.forward[1], transit, "#10B981");
      break;
    }
    case "stage3-pass": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 1;
      loopbackFill = 1;
      const transit = clamp((phaseProgress - 0.35) / 0.65);
      forwardEdgeFill[2] = transit;
      packet =
        phaseProgress < 0.35
          ? buildPacketAtNode(HERO_NODE_CENTERS[2], phaseProgress / 0.35, "#10B981")
          : buildPacketAlongPath(HERO_PATHS.forward[2], transit, "#10B981");
      break;
    }
    case "stage4": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 1;
      forwardEdgeFill[2] = 1;
      loopbackFill = 1;
      const transit = clamp((phaseProgress - 0.35) / 0.65);
      forwardEdgeFill[3] = transit;
      packet =
        phaseProgress < 0.35
          ? buildPacketAtNode(HERO_NODE_CENTERS[3], phaseProgress / 0.35, "#F59E0B")
          : buildPacketAlongPath(HERO_PATHS.forward[3], transit, "#10B981");
      break;
    }
    case "stage5": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 1;
      forwardEdgeFill[2] = 1;
      forwardEdgeFill[3] = 1;
      loopbackFill = 1;
      telemetryReturnFill = clamp((phaseProgress - 0.4) / 0.6);
      packet = buildPacketAtNode(HERO_NODE_CENTERS[4], phaseProgress, "#10B981");
      break;
    }
    case "passed": {
      forwardEdgeFill[0] = 1;
      forwardEdgeFill[1] = 1;
      forwardEdgeFill[2] = 1;
      forwardEdgeFill[3] = 1;
      loopbackFill = 1;
      telemetryReturnFill = 1;
      packet = buildPacketAtNode(HERO_NODE_CENTERS[4], 1, "#10B981");
      break;
    }
  }

  const nodes: NodeVisualState[] = [1, 2, 3, 4, 5].map((stageNumber) =>
    resolveNodeVisualState(stageNumber, phase, phaseProgress),
  );

  const kpis = resolveKpis(phase);

  return {
    phase,
    elapsedMs: clampedMs,
    overallProgress,
    phaseProgress,
    activeStageNumber: activeWindow.stageNumber,
    iteration: activeWindow.iteration,
    packet,
    forwardEdgeFill,
    loopbackFill,
    telemetryReturnFill,
    nodes,
    kpis,
  };
}

function resolveNodeVisualState(
  stageNumber: number,
  phase: LoopPhase,
  phaseProgress: number,
): NodeVisualState {
  if (phase === "passed") {
    return {
      stageNumber,
      status: "passed",
      strokeColor: "#10B981",
      glowColor: "rgba(16, 185, 129, 0.32)",
      badgeText: "VERIFIED",
      progress: 1,
      liveMetricOverlay: stageNumber === 2 || stageNumber === 3 ? "fixed" : "default",
    };
  }

  if (stageNumber === 1) {
    if (phase === "stage1") {
      return {
        stageNumber,
        status: "active",
        strokeColor: "#22D3EE",
        glowColor: "rgba(34, 211, 238, 0.38)",
        badgeText: "SYNTHESIZING",
        progress: phaseProgress,
        liveMetricOverlay: "default",
      };
    }
    return {
      stageNumber,
      status: "completed",
      strokeColor: "#06B6D4",
      glowColor: "rgba(6, 182, 212, 0.16)",
      badgeText: "AST READY",
      progress: 1,
      liveMetricOverlay: "default",
    };
  }

  if (stageNumber === 2) {
    if (phase === "stage1") {
      return {
        stageNumber,
        status: "idle",
        strokeColor: "#1F2937",
        glowColor: "rgba(6, 182, 212, 0)",
        badgeText: "QUEUED",
        progress: 0,
        liveMetricOverlay: "default",
      };
    }
    if (phase === "stage2") {
      return {
        stageNumber,
        status: "active",
        strokeColor: "#22D3EE",
        glowColor: "rgba(34, 211, 238, 0.38)",
        badgeText: "SOLVING B-REP",
        progress: phaseProgress,
        liveMetricOverlay: "default",
      };
    }
    if (phase === "loopback" || phase === "stage2-fix") {
      return {
        stageNumber,
        status: "patching",
        strokeColor: "#F59E0B",
        glowColor: "rgba(245, 158, 11, 0.42)",
        badgeText: "AUTO-PATCHING",
        progress: phase === "loopback" ? 0.4 : phaseProgress,
        liveMetricOverlay: "fixed",
      };
    }
    const isFixedIteration = ["stage3-pass", "stage4", "stage5"].includes(phase);
    return {
      stageNumber,
      status: "completed",
      strokeColor: isFixedIteration ? "#10B981" : "#06B6D4",
      glowColor: "rgba(6, 182, 212, 0.18)",
      badgeText: isFixedIteration ? "PATCHED v2" : "STEP BUILT",
      progress: 1,
      liveMetricOverlay: isFixedIteration ? "fixed" : "default",
    };
  }

  if (stageNumber === 3) {
    if (phase === "stage3-fail") {
      return {
        stageNumber,
        status: "failed",
        strokeColor: "#EF4444",
        glowColor: "rgba(239, 68, 68, 0.48)",
        badgeText: "GATE 3 FAIL",
        progress: 1,
        liveMetricOverlay: "fail",
      };
    }
    if (phase === "loopback" || phase === "stage2-fix") {
      return {
        stageNumber,
        status: "patching",
        strokeColor: "#F59E0B",
        glowColor: "rgba(245, 158, 11, 0.25)",
        badgeText: "RE-TESTING",
        progress: 0.5,
        liveMetricOverlay: "fail",
      };
    }
    if (phase === "stage3-pass") {
      return {
        stageNumber,
        status: "active",
        strokeColor: "#10B981",
        glowColor: "rgba(16, 185, 129, 0.42)",
        badgeText: "GATE 3 PASS",
        progress: phaseProgress,
        liveMetricOverlay: "fixed",
      };
    }
    if (phase === "stage4" || phase === "stage5") {
      return {
        stageNumber,
        status: "completed",
        strokeColor: "#10B981",
        glowColor: "rgba(16, 185, 129, 0.22)",
        badgeText: "GATE 3 PASS",
        progress: 1,
        liveMetricOverlay: "fixed",
      };
    }
    return {
      stageNumber,
      status: "idle",
      strokeColor: "#1F2937",
      glowColor: "rgba(6, 182, 212, 0)",
      badgeText: "QUEUED",
      progress: 0,
      liveMetricOverlay: "default",
    };
  }

  if (stageNumber === 4) {
    if (phase === "stage4") {
      return {
        stageNumber,
        status: "active",
        strokeColor: "#F59E0B",
        glowColor: "rgba(245, 158, 11, 0.42)",
        badgeText: "FEM + MUJOCO",
        progress: phaseProgress,
        liveMetricOverlay: "default",
      };
    }
    if (phase === "stage5") {
      return {
        stageNumber,
        status: "completed",
        strokeColor: "#10B981",
        glowColor: "rgba(16, 185, 129, 0.22)",
        badgeText: "SF 2.84 PASS",
        progress: 1,
        liveMetricOverlay: "default",
      };
    }
    return {
      stageNumber,
      status: "idle",
      strokeColor: "#1F2937",
      glowColor: "rgba(6, 182, 212, 0)",
      badgeText: "QUEUED",
      progress: 0,
      liveMetricOverlay: "default",
    };
  }

  // Stage 5
  if (phase === "stage5") {
    return {
      stageNumber,
      status: "active",
      strokeColor: "#10B981",
      glowColor: "rgba(16, 185, 129, 0.45)",
      badgeText: "SLICING G-CODE",
      progress: phaseProgress,
      liveMetricOverlay: "default",
    };
  }
  return {
    stageNumber,
    status: "idle",
    strokeColor: "#1F2937",
    glowColor: "rgba(6, 182, 212, 0)",
    badgeText: "QUEUED",
    progress: 0,
    liveMetricOverlay: "default",
  };
}

function resolveKpis(phase: LoopPhase): TimelineSnapshot["kpis"] {
  switch (phase) {
    case "idle":
      return {
        iterationLabel: "IDLE · Ready",
        clearanceMm: "+0.25 mm target",
        clearanceStatus: "idle",
        safetyFactor: "2.84x target",
        dfmStatus: "Standby",
      };
    case "stage1":
    case "stage2":
      return {
        iterationLabel: "ITER #1 · Attempt 1",
        clearanceMm: "Evaluating...",
        clearanceStatus: "idle",
        safetyFactor: "Pending Gate 3",
        dfmStatus: "Pending FEA",
      };
    case "stage3-fail":
      return {
        iterationLabel: "ITER #1 · Halted",
        clearanceMm: "-0.42 mm COLLISION",
        clearanceStatus: "fail",
        safetyFactor: "Blocked by Gate 3",
        dfmStatus: "Blocked by Gate 3",
      };
    case "loopback":
    case "stage2-fix":
      return {
        iterationLabel: "ITER #2 · Self-Healing",
        clearanceMm: "-0.42 → +0.25 mm",
        clearanceStatus: "patching",
        safetyFactor: "Re-queuing FEM",
        dfmStatus: "Pending FEA",
      };
    case "stage3-pass":
      return {
        iterationLabel: "ITER #2 · Gate 3 Pass",
        clearanceMm: "+0.25 mm MANIFOLD",
        clearanceStatus: "pass",
        safetyFactor: "Launching ccx...",
        dfmStatus: "Queued",
      };
    case "stage4":
      return {
        iterationLabel: "ITER #2 · Simulating",
        clearanceMm: "+0.25 mm MANIFOLD",
        clearanceStatus: "pass",
        safetyFactor: "2.84x · 29.0 MPa",
        dfmStatus: "Slicing next...",
      };
    case "stage5":
    case "passed":
      return {
        iterationLabel: "ITER #2 · Converged",
        clearanceMm: "+0.25 mm MANIFOLD",
        clearanceStatus: "pass",
        safetyFactor: "2.84x · 29.0 MPa",
        dfmStatus: "PASS · 38m · 19.4g",
      };
  }
}

export interface PhaseTelemetryEntry {
  phase: LoopPhase;
  timestamp: string;
  mcpTool: string;
  headline: string;
  codeSnippet: string;
  tone: "cyan" | "amber" | "red" | "emerald" | "neutral";
}

const TELEMETRY_BY_PHASE: Record<LoopPhase, PhaseTelemetryEntry> = {
  idle: {
    phase: "idle",
    timestamp: "00.00s",
    mcpTool: "mcp://hardware-lab/orchestrator",
    headline: "Autonomous 5-Stage Loop Standby — Click Simulate Agent Loop or scrub timeline",
    codeSnippet: `$ uv tool run --python 3.12 build123d-mcp@latest --check
✓ OCCT 7.8.1 B-Rep kernel ready · MuJoCo 3.2.6 ready · CalculiX ccx 2.21 ready`,
    tone: "neutral",
  },
  stage1: {
    phase: "stage1",
    timestamp: "00.42s",
    mcpTool: "agent/synthesize_parametric_ast",
    headline: "Stage 1: Synthesizing parametric build123d Python AST from torque & envelope spec",
    codeSnippet: `# Generated by AI Coding Harness (Stage 01)
TOOTH_COUNT, MODULE_MM, PRESSURE_DEG = 24, 1.6, 20.0
ROOT_CLEARANCE_MM = 0.00  # Initial attempt before Gate 3 feedback`,
    tone: "cyan",
  },
  stage2: {
    phase: "stage2",
    timestamp: "01.18s",
    mcpTool: "tools/call → build123d_evaluate",
    headline: "Stage 2: Executing OpenCascade B-Rep kernel & exporting ISO-10303 STEP solid",
    codeSnippet: `{"method":"tools/call","params":{"name":"build123d_evaluate","arguments":{
  "script":"planetary_gear.py","export":["step","stl","ortho_png_4x"]}}}`,
    tone: "cyan",
  },
  "stage3-fail": {
    phase: "stage3-fail",
    timestamp: "02.05s",
    mcpTool: "tools/call → brep_topology_gate",
    headline:
      "Stage 3 FAILED: Boolean interference detected between sun & planet gear teeth (-0.42mm)",
    codeSnippet: `AssertionError: Gate 3 B-Rep Boolean Check Failed!
  sun_planet_intersection_vol = 18.42 mm³ (expected 0.00 mm³)
  penetration_depth = -0.42 mm at involute flank (root_clearance < 0.20 mm)`,
    tone: "red",
  },
  loopback: {
    phase: "loopback",
    timestamp: "03.10s",
    mcpTool: "agent/self_correction_feedback",
    headline:
      "Self-Correction Loop (Gate 3 → Stage 2): Agent inspects 4-view PNGs & patches addendum/root",
    codeSnippet: `--- a/planetary_gear.py (Iteration #1)
+++ b/planetary_gear.py (Iteration #2 - Auto-Patched)
-ROOT_CLEARANCE_MM = 0.00
+ROOT_CLEARANCE_MM = 0.25  # +0.67mm radial shift resolves -0.42mm collision`,
    tone: "amber",
  },
  "stage2-fix": {
    phase: "stage2-fix",
    timestamp: "04.02s",
    mcpTool: "tools/call → build123d_evaluate (iter #2)",
    headline:
      "Stage 2 Re-Execution: Rebuilding watertight OCCT B-Rep solid with patched +0.25mm clearance",
    codeSnippet: `✓ OCCT B-Rep regenerate: solid.is_valid() == True · volume = 14.82 cm³
✓ Exported build/planetary_carrier_v2.step & 4 orthographic VLM sheets`,
    tone: "amber",
  },
  "stage3-pass": {
    phase: "stage3-pass",
    timestamp: "04.85s",
    mcpTool: "tools/call → brep_topology_gate (iter #2)",
    headline:
      "Stage 3 PASSED: Zero boolean interference (0.00 mm³) & watertight manifold confirmed",
    codeSnippet: `✓ assert solid.is_valid() == True
✓ assert boolean_interference_mm3 == 0.00  (measured clearance: +0.25 mm)
✓ VLM 4-View Ortho Check: teeth profile & bore concentricity OK`,
    tone: "emerald",
  },
  stage4: {
    phase: "stage4",
    timestamp: "05.60s",
    mcpTool: "tools/call → mujoco_kinematics + calculix_fea",
    headline:
      "Stage 4 PASSED: MuJoCo 500Hz kinematics & CalculiX tetrahedral FEM stress under 200 N load",
    codeSnippet: `✓ MuJoCo 3: ω_out = 10.67 rad/s · backlash = 0.14° (< 0.25° max)
✓ CalculiX ccx: peak von Mises = 29.0 MPa · PA12-CF Safety Factor = 2.84x`,
    tone: "amber",
  },
  stage5: {
    phase: "stage5",
    timestamp: "06.35s",
    mcpTool: "tools/call → prusaslicer_headless_dfm",
    headline:
      "Stage 5: Headless PrusaSlicer CLI generating 25% gyroid G-code & parsing overhang telemetry",
    codeSnippet: `$ prusa-slicer --export-gcode --layer-height 0.20 --fill-pattern gyroid
✓ 240 layers sliced · 19.4g filament · 38m 12s · 0 unsupported overhangs >45°`,
    tone: "emerald",
  },
  passed: {
    phase: "passed",
    timestamp: "06.80s",
    mcpTool: "mcp://hardware-lab/complete",
    headline:
      "ALL 5 GATES PASSED — Verified STEP, URDF/MJCF, CalculiX report & production G-code ready",
    codeSnippet: `✓ Closed-Loop Converged in 2 iterations (6.80s wall time, 0 GUI clicks)
✓ Artifacts: planetary_v2.step · assembly.xml · stress.frd · planetary_v2.gcode`,
    tone: "emerald",
  },
};

export function getPhaseTelemetryLog(phase: LoopPhase): PhaseTelemetryEntry {
  return TELEMETRY_BY_PHASE[phase];
}
