import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ArchitectureNodeData, architectureNodes } from "@/data/architectureNodes";
import { Badge } from "@/design-system/Badge";
import { Button } from "@/design-system/Button";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Drawer } from "@/design-system/Drawer";
import {
  evaluateTimelineAt,
  FORWARD_EDGE_LABELS,
  getPhaseTelemetryLog,
  HERO_CANVAS,
  HERO_NODE_CENTERS,
  HERO_PATHS,
  type LoopPhase,
  PHASE_WINDOWS,
  type PlaybackSpeed,
  TOTAL_LOOP_DURATION_MS,
} from "@/features/hero-loop/timeline";
import { useTranslation } from "@/i18n/I18nContext";

const SPEED_OPTIONS: readonly PlaybackSpeed[] = [0.5, 1, 2] as const;

export function HeroArchitectureMap() {
  const { t } = useTranslation();
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [autoReplay, setAutoReplay] = useState(false);
  const [inspectedStage, setInspectedStage] = useState<number>(3);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNodeData | null>(null);

  const lastTickRef = useRef<number>(Date.now());
  const speedRef = useRef<PlaybackSpeed>(speed);
  speedRef.current = speed;
  const autoReplayRef = useRef<boolean>(autoReplay);
  autoReplayRef.current = autoReplay;

  const snapshot = useMemo(() => evaluateTimelineAt(elapsedMs), [elapsedMs]);
  const phase = snapshot.phase;
  const telemetryLog = useMemo(() => getPhaseTelemetryLog(phase), [phase]);

  // Keep the bottom Stage Inspector synchronized with the active simulation stage while running
  useEffect(() => {
    if (phase !== "idle") {
      setInspectedStage(snapshot.activeStageNumber);
    }
  }, [phase, snapshot.activeStageNumber]);

  // High-precision 60fps timeline driver
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    lastTickRef.current = Date.now();

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const rawDelta = now - lastTickRef.current;
      const delta = (rawDelta > 0 ? rawDelta : 16) * speedRef.current;
      lastTickRef.current = now;

      setElapsedMs((prev) => {
        const current = prev ?? 0;
        const next = current + delta;
        if (next >= TOTAL_LOOP_DURATION_MS) {
          if (autoReplayRef.current) {
            return 0;
          }
          setIsPlaying(false);
          setIsPaused(false);
          return TOTAL_LOOP_DURATION_MS;
        }
        return next;
      });
    }, 16);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, isPaused]);

  const handleSimulate = () => {
    lastTickRef.current = Date.now();
    setElapsedMs(0);
    setIsPaused(false);
    setIsPlaying(true);
  };

  const handleTogglePause = () => {
    if (!isPlaying) return;
    lastTickRef.current = Date.now();
    setIsPaused((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setElapsedMs(null);
  };

  const handleJumpToPhase = (targetPhase: Exclude<LoopPhase, "idle">) => {
    setIsPlaying(false);
    setIsPaused(false);
    if (targetPhase === "passed") {
      setElapsedMs(TOTAL_LOOP_DURATION_MS);
      return;
    }
    const win = PHASE_WINDOWS.find((w) => w.phase === targetPhase);
    if (win) {
      // Jump to the midpoint of the phase window so the packet & conduit state are clearly visible
      setElapsedMs(Math.round((win.startMs + win.endMs) / 2));
    }
  };

  const handleScrub = (nextMs: number) => {
    setIsPlaying(false);
    setIsPaused(false);
    setElapsedMs(nextMs);
  };

  const isRunning = isPlaying && !isPaused;

  const getStatusBanner = () => {
    if (phase === "idle") {
      return { tone: "neutral" as const, text: t.hero.loopStatusIdle };
    }
    if (phase === "stage3-fail") {
      return { tone: "red" as const, text: t.hero.loopStatusFailed };
    }
    if (phase === "loopback" || phase === "stage2-fix") {
      return { tone: "amber" as const, text: t.hero.loopStatusCorrecting };
    }
    if (phase === "passed") {
      return { tone: "emerald" as const, text: t.hero.loopStatusPassed };
    }
    return { tone: "cyan" as const, text: t.hero.loopStatusRunning };
  };

  const statusBanner = getStatusBanner();
  const activeInspectorNode =
    architectureNodes.find((n) => n.stageNumber === inspectedStage) ?? architectureNodes[0];

  const cardAccent =
    phase === "passed"
      ? "emerald"
      : phase === "stage3-fail"
        ? "red"
        : phase === "loopback" || phase === "stage2-fix"
          ? "amber"
          : "cyan";

  return (
    <section
      id="architecture"
      className="relative overflow-hidden border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16 lg:py-20"
    >
      {/* Subtle ambient radial engineering backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.14),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Header */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <Badge tone="cyan" className="mb-4">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {t.hero.badge}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl lg:text-5xl">
              {t.hero.heading}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#CBD5E1] sm:text-lg">
              {t.hero.subheading}
            </p>
          </div>

          {/* Live Telemetry Pill Summary */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[460px]">
            <div className="rounded-lg border border-[#1F2937] bg-[#111827]/90 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                {t.hero.kpiIteration}
              </p>
              <p className="mt-0.5 font-mono text-xs font-bold text-[#67E8F9]">
                {snapshot.kpis.iterationLabel}
              </p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#111827]/90 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                {t.hero.kpiClearance}
              </p>
              <p
                className={`mt-0.5 font-mono text-xs font-bold ${
                  snapshot.kpis.clearanceStatus === "fail"
                    ? "text-[#FCA5A5]"
                    : snapshot.kpis.clearanceStatus === "patching"
                      ? "text-[#FDE68A]"
                      : snapshot.kpis.clearanceStatus === "pass"
                        ? "text-[#6EE7B7]"
                        : "text-[#E2E8F0]"
                }`}
              >
                {snapshot.kpis.clearanceMm}
              </p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#111827]/90 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                {t.hero.kpiSafetyFactor}
              </p>
              <p className="mt-0.5 font-mono text-xs font-bold text-[#FDE68A]">
                {snapshot.kpis.safetyFactor}
              </p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#111827]/90 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                {t.hero.kpiPrintability}
              </p>
              <p className="mt-0.5 font-mono text-xs font-bold text-[#6EE7B7]">
                {snapshot.kpis.dfmStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Main Interactive Closed-Loop Schematic Card */}
        <Card className="mt-8 p-4 sm:p-6 lg:p-8" accent={cardAccent}>
          {/* Top Transport & Speed Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                onClick={handleSimulate}
                disabled={isRunning}
                aria-label={isRunning ? t.hero.simulatingBtn : t.hero.simulateBtn}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {isRunning ? t.hero.simulatingBtn : t.hero.simulateBtn}
              </Button>

              {isPlaying && (
                <Button
                  variant="amber"
                  onClick={handleTogglePause}
                  aria-label={isPaused ? t.hero.resumeBtn : t.hero.pauseBtn}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isPaused ? t.hero.resumeBtn : t.hero.pauseBtn}
                </Button>
              )}

              <Button variant="secondary" onClick={handleReset} aria-label={t.hero.resetBtn}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t.hero.resetBtn}
              </Button>

              <button
                type="button"
                aria-pressed={autoReplay}
                onClick={() => setAutoReplay((prev) => !prev)}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-colors ${
                  autoReplay
                    ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                    : "border-[#374151] bg-[#090D16] text-[#CBD5E1] hover:border-[#67E8F9]"
                }`}
              >
                <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
                {t.hero.autoReplayBtn}
              </button>

              {/* Playback Speed Multiplier Group */}
              <fieldset
                className="m-0 flex items-center gap-1 rounded-lg border border-[#1F2937] bg-[#090D16] p-1"
                aria-label={t.hero.speedLabel}
              >
                <Gauge className="mx-1.5 h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                {SPEED_OPTIONS.map((s) => {
                  const active = speed === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSpeed(s)}
                      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-2.5 font-mono text-xs font-semibold transition-colors ${
                        active
                          ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                          : "border-transparent bg-transparent text-[#CBD5E1] hover:bg-[#111827]"
                      }`}
                    >
                      {s}x
                    </button>
                  );
                })}
              </fieldset>
            </div>

            <Badge tone={statusBanner.tone} className="max-w-full">
              {phase === "stage3-fail" && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
              {phase === "passed" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{statusBanner.text}</span>
            </Badge>
          </div>

          {/* Enlarged Multi-Layer Animated SVG 5-Stage Closed-Loop Canvas */}
          <section
            className="mt-6 overflow-x-auto rounded-xl border border-[#1F2937] bg-[#070A12] p-2 sm:p-4"
            tabIndex={0}
            aria-label="5-stage hardware loop diagram"
          >
            <svg
              viewBox={`0 0 ${HERO_CANVAS.width} ${HERO_CANVAS.height}`}
              className="min-w-[980px] w-full select-none"
            >
              <title>
                Agentic Hardware Lab 5-Stage Closed-Loop Verification &amp; Self-Correction
                Architecture
              </title>
              <defs>
                {/* Engineering blueprint grid pattern */}
                <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111827" strokeWidth="1" />
                  <circle cx="40" cy="40" r="1" fill="#1E293B" />
                </pattern>

                <radialGradient id="packet-glow-cyan" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#06B6D4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="packet-glow-amber" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="packet-glow-red" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#EF4444" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="packet-glow-emerald" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>

                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#22D3EE" />
                </marker>
                <marker
                  id="arrow-amber"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
                </marker>
                <marker
                  id="arrow-muted"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>
              </defs>

              {/* Blueprint grid background */}
              <rect
                x="0"
                y="0"
                width={HERO_CANVAS.width}
                height={HERO_CANVAS.height}
                fill="url(#hero-grid)"
                rx="10"
              />

              {/* Top Telemetry Return Arc (Stage 5 -> Stage 1) */}
              <path
                d={HERO_PATHS.telemetryReturn.d}
                fill="none"
                stroke="#1E293B"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              {snapshot.telemetryReturnFill > 0 && (
                <path
                  d={HERO_PATHS.telemetryReturn.d}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.75"
                  strokeDasharray={HERO_PATHS.telemetryReturn.length}
                  strokeDashoffset={
                    HERO_PATHS.telemetryReturn.length * (1 - snapshot.telemetryReturnFill)
                  }
                  markerEnd="url(#arrow-emerald)"
                />
              )}
              <g transform="translate(620, 28)">
                <rect
                  x="-215"
                  y="-12"
                  width="430"
                  height="22"
                  rx="11"
                  fill="#090D16"
                  stroke={snapshot.telemetryReturnFill > 0 ? "#10B981" : "#1F2937"}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  className={`font-mono text-[10.5px] font-medium ${
                    snapshot.telemetryReturnFill > 0 ? "fill-[#6EE7B7]" : "fill-[#94A3B8]"
                  }`}
                >
                  {t.hero.telemetryReturnArc}
                </text>
              </g>

              {/* Forward Conduits between Stage 1 -> 2 -> 3 -> 4 -> 5 */}
              {HERO_PATHS.forward.map((edgePath, idx) => {
                const fillLevel = snapshot.forwardEdgeFill[idx];
                const isComplete = fillLevel >= 0.99;
                const isFlowing = fillLevel > 0 && fillLevel < 1;
                const midX = (HERO_NODE_CENTERS[idx].x + HERO_NODE_CENTERS[idx + 1].x) / 2;
                const strokeColor =
                  phase === "passed"
                    ? "#10B981"
                    : idx >= 2 && ["stage3-pass", "stage4", "stage5"].includes(phase)
                      ? "#10B981"
                      : "#22D3EE";

                return (
                  <g key={FORWARD_EDGE_LABELS[idx]}>
                    {/* Base conduit track */}
                    <path
                      d={edgePath.d}
                      fill="none"
                      stroke="#1F2937"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d={edgePath.d}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      markerEnd="url(#arrow-muted)"
                    />

                    {/* Progressive energized conduit overlay */}
                    {fillLevel > 0 && (
                      <path
                        d={edgePath.d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={edgePath.length}
                        strokeDashoffset={edgePath.length * (1 - fillLevel)}
                        markerEnd={
                          strokeColor === "#10B981" ? "url(#arrow-emerald)" : "url(#arrow-cyan)"
                        }
                      />
                    )}

                    {/* Animated streaming pulse dashes while active */}
                    {(isFlowing || (isComplete && isRunning)) && (
                      <path
                        d={edgePath.d}
                        fill="none"
                        stroke="#F8FAFC"
                        strokeOpacity="0.65"
                        strokeWidth="2"
                        strokeDasharray="6 10"
                        className="animate-conduit-flow"
                      />
                    )}

                    {/* Artifact payload pill above each conduit */}
                    <g transform={`translate(${midX}, ${HERO_CANVAS.nodeY - 26})`}>
                      <rect
                        x="-42"
                        y="-10"
                        width="84"
                        height="18"
                        rx="4"
                        fill="#0B1120"
                        stroke={fillLevel > 0 ? strokeColor : "#1E293B"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        className="fill-[#CBD5E1] font-mono text-[8.5px]"
                      >
                        {FORWARD_EDGE_LABELS[idx]}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Self-Correction Feedback Loop (Gate 3 -> Stage 2 Cubic Bézier) */}
              <g>
                {/* Outer ambient path track */}
                <path
                  d={HERO_PATHS.loopback.d}
                  fill="none"
                  stroke="#1F2937"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d={HERO_PATHS.loopback.d}
                  fill="none"
                  stroke={
                    phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                      ? "#F59E0B"
                      : snapshot.loopbackFill >= 1
                        ? "#10B981"
                        : "#475569"
                  }
                  strokeWidth={
                    phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                      ? 3.5
                      : 2
                  }
                  strokeDasharray="8 5"
                  className={
                    phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                      ? "animate-conduit-flow"
                      : ""
                  }
                  markerEnd="url(#arrow-amber)"
                />

                {/* Progressive fill along feedback curve */}
                {snapshot.loopbackFill > 0 && (
                  <path
                    d={HERO_PATHS.loopback.d}
                    fill="none"
                    stroke={phase === "loopback" || phase === "stage2-fix" ? "#FBBF24" : "#10B981"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={HERO_PATHS.loopback.length}
                    strokeDashoffset={HERO_PATHS.loopback.length * (1 - snapshot.loopbackFill)}
                    markerEnd="url(#arrow-amber)"
                  />
                )}

                {/* Feedback Loop Callout Pill at Bottom Apex */}
                <g transform="translate(496.5, 396)">
                  <rect
                    x="-178"
                    y="-15"
                    width="356"
                    height="28"
                    rx="14"
                    fill="#111827"
                    stroke={
                      phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                        ? "#F59E0B"
                        : "#374151"
                    }
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    className="fill-[#FDE68A] font-mono text-[11px] font-semibold"
                  >
                    Self-Correction Feedback Loop (Gate 3 → Stage 2)
                  </text>
                </g>

                {/* Auto-Patch Delta Tag on Loopback */}
                {(phase === "loopback" ||
                  phase === "stage2-fix" ||
                  phase === "stage3-pass" ||
                  phase === "stage4" ||
                  phase === "stage5" ||
                  phase === "passed") && (
                  <g transform="translate(496.5, 355)">
                    <rect
                      x="-128"
                      y="-12"
                      width="256"
                      height="22"
                      rx="6"
                      fill="#451A03"
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      className="fill-[#FDE68A] font-mono text-[10px] font-semibold"
                    >
                      Δ patch: root_clearance +0.25mm (v2)
                    </text>
                  </g>
                )}
              </g>

              {/* Failure Toast inside SVG above Stage 3 */}
              {phase === "stage3-fail" && (
                <g transform={`translate(${HERO_NODE_CENTERS[2].x}, 68)`}>
                  <rect
                    x="-170"
                    y="-20"
                    width="340"
                    height="34"
                    rx="8"
                    fill="#450A0A"
                    stroke="#EF4444"
                    strokeWidth="1.75"
                  />
                  <circle cx="-148" cy="-3" r="5" fill="#EF4444" className="animate-pulse-ring" />
                  <text
                    x="8"
                    y="1"
                    textAnchor="middle"
                    className="fill-[#FCA5A5] font-mono text-[11.5px] font-bold"
                  >
                    Gear Teeth Interference Detected (-0.42mm)
                  </text>
                </g>
              )}

              {/* Gate 3 Verified Toast when stage3-pass is active */}
              {phase === "stage3-pass" && (
                <g transform={`translate(${HERO_NODE_CENTERS[2].x}, 68)`}>
                  <rect
                    x="-160"
                    y="-20"
                    width="320"
                    height="34"
                    rx="8"
                    fill="#064E3B"
                    stroke="#10B981"
                    strokeWidth="1.75"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    className="fill-[#6EE7B7] font-mono text-[11.5px] font-bold"
                  >
                    ✓ Gate 3 Passed: 0.00 mm³ Interference (+0.25mm)
                  </text>
                </g>
              )}

              {/* 5 Enlarged Interactive Stage Node Cards */}
              {architectureNodes.map((node, idx) => {
                const pos = HERO_NODE_CENTERS[idx];
                const visual = snapshot.nodes[idx];
                const isInspected = inspectedStage === node.stageNumber;
                const isHighlighted =
                  visual.status === "active" ||
                  visual.status === "failed" ||
                  visual.status === "patching";

                const liveMetricText =
                  visual.liveMetricOverlay === "fail" && node.liveMetricFail
                    ? node.liveMetricFail
                    : visual.liveMetricOverlay === "fixed" && node.liveMetricFixed
                      ? node.liveMetricFixed
                      : node.liveMetricDefault;

                const statusDotColor =
                  visual.status === "failed"
                    ? "#EF4444"
                    : visual.status === "patching"
                      ? "#F59E0B"
                      : visual.status === "passed" || visual.status === "completed"
                        ? "#10B981"
                        : visual.status === "active"
                          ? "#22D3EE"
                          : "#475569";

                return (
                  // biome-ignore lint/a11y/useSemanticElements: SVG interactive node group requires role="button" inside <svg>
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => {
                      setInspectedStage(node.stageNumber);
                      setSelectedNode(node);
                    }}
                    onMouseEnter={() => setInspectedStage(node.stageNumber)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setInspectedStage(node.stageNumber);
                        setSelectedNode(node);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                  >
                    {/* Active ambient halo behind node card */}
                    {isHighlighted && (
                      <rect
                        x={-HERO_CANVAS.nodeHalfW - 5}
                        y={-HERO_CANVAS.nodeHalfH - 5}
                        width={HERO_CANVAS.nodeWidth + 10}
                        height={HERO_CANVAS.nodeHeight + 10}
                        rx="16"
                        fill="none"
                        stroke={visual.strokeColor}
                        strokeOpacity="0.45"
                        strokeWidth="3"
                        className="animate-pulse-ring"
                      />
                    )}
                    {/* Main Node Surface Card */}
                    <rect
                      x={-HERO_CANVAS.nodeHalfW}
                      y={-HERO_CANVAS.nodeHalfH}
                      width={HERO_CANVAS.nodeWidth}
                      height={HERO_CANVAS.nodeHeight}
                      rx="12"
                      fill="#111827"
                      stroke={isInspected && phase === "idle" ? "#22D3EE" : visual.strokeColor}
                      strokeWidth={isHighlighted || isInspected ? "2.5" : "1.75"}
                    />
                    {/* Top Header Band inside Node Card */}
                    <rect
                      x={-HERO_CANVAS.nodeHalfW + 1}
                      y={-HERO_CANVAS.nodeHalfH + 1}
                      width={HERO_CANVAS.nodeWidth - 2}
                      height="32"
                      rx="11"
                      fill="#0B1120"
                    />
                    {/* Status LED + Stage Number */}
                    <circle cx="-84" cy="-68" r="4.5" fill={statusDotColor} />
                    <text
                      x="-73"
                      y="-64"
                      textAnchor="start"
                      className="fill-[#67E8F9] font-mono text-[11px] font-bold"
                    >
                      STAGE 0{node.stageNumber}
                    </text>{" "}
                    {/* Stage Primary Title (placed immediately after STAGE 0X in DOM for accessible name "STAGE 0X Title") */}
                    <text
                      x="0"
                      y="-30"
                      textAnchor="middle"
                      className="fill-[#F8FAFC] text-[14.5px] font-bold"
                    >
                      {node.shortTitle}
                    </text>{" "}
                    {/* Live Stage Status Badge (top-right) */}
                    <text
                      x="88"
                      y="-64"
                      textAnchor="end"
                      className={`font-mono text-[9.5px] font-semibold ${
                        visual.status === "failed"
                          ? "fill-[#FCA5A5]"
                          : visual.status === "patching"
                            ? "fill-[#FDE68A]"
                            : visual.status === "passed" || visual.status === "completed"
                              ? "fill-[#6EE7B7]"
                              : "fill-[#94A3B8]"
                      }`}
                    >
                      {visual.badgeText}
                    </text>
                    {/* Engine / Stack Subtitle */}
                    <text
                      x="0"
                      y="-11"
                      textAnchor="middle"
                      className="fill-[#CBD5E1] font-mono text-[10px]"
                    >
                      {node.engineBadge}
                    </text>
                    {/* Live Telemetry Readout Pill inside Node */}
                    <rect
                      x="-86"
                      y="3"
                      width="172"
                      height="24"
                      rx="6"
                      fill={
                        visual.liveMetricOverlay === "fail"
                          ? "#450A0A"
                          : visual.liveMetricOverlay === "fixed"
                            ? "#064E3B"
                            : "#090D16"
                      }
                      stroke={
                        visual.liveMetricOverlay === "fail"
                          ? "#EF4444"
                          : visual.liveMetricOverlay === "fixed"
                            ? "#10B981"
                            : "#1F2937"
                      }
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="18.5"
                      textAnchor="middle"
                      className={`font-mono text-[10px] font-semibold ${
                        visual.liveMetricOverlay === "fail"
                          ? "fill-[#FCA5A5]"
                          : visual.liveMetricOverlay === "fixed"
                            ? "fill-[#6EE7B7]"
                            : "fill-[#67E8F9]"
                      }`}
                    >
                      {liveMetricText}
                    </text>
                    {/* Protocol + Latency Budget Footer */}
                    <text
                      x="-84"
                      y="46"
                      textAnchor="start"
                      className="fill-[#94A3B8] font-mono text-[9.5px]"
                    >
                      {node.protocol}
                    </text>
                    <text
                      x="84"
                      y="46"
                      textAnchor="end"
                      className="fill-[#CBD5E1] font-mono text-[9.5px] font-medium"
                    >
                      Click for MCP/CLI
                    </text>
                    {/* Bottom Execution Progress Track */}
                    <rect x="-86" y="58" width="172" height="6" rx="3" fill="#1E293B" />
                    {visual.progress > 0 && (
                      <rect
                        x="-86"
                        y="58"
                        width={Math.max(8, Math.round(172 * visual.progress))}
                        height="6"
                        rx="3"
                        fill={statusDotColor}
                      />
                    )}
                  </g>
                );
              })}

              {/* 60fps Continuous Animated Telemetry Packet + 7-Particle Comet Trail */}
              {snapshot.packet && (
                <g data-testid="hero-telemetry-packet" className="pointer-events-none">
                  {snapshot.packet.trail.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.radius}
                      fill={snapshot.packet?.color}
                      opacity={pt.opacity}
                    />
                  ))}
                  <circle
                    cx={snapshot.packet.x}
                    cy={snapshot.packet.y}
                    r="22"
                    fill={
                      snapshot.packet.color === "#EF4444"
                        ? "url(#packet-glow-red)"
                        : snapshot.packet.color === "#F59E0B"
                          ? "url(#packet-glow-amber)"
                          : snapshot.packet.color === "#10B981"
                            ? "url(#packet-glow-emerald)"
                            : "url(#packet-glow-cyan)"
                    }
                  />
                  <circle
                    cx={snapshot.packet.x}
                    cy={snapshot.packet.y}
                    r="8"
                    fill={snapshot.packet.color}
                    stroke="#F8FAFC"
                    strokeWidth="2.25"
                  />
                </g>
              )}
            </svg>
          </section>

          {/* Interactive Timeline Scrubber & Direct Phase Stepper Bar */}
          <div className="mt-5 rounded-xl border border-[#1F2937] bg-[#0B1120] p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="hero-loop-scrubber"
                className="flex items-center gap-2 font-mono text-xs font-semibold text-[#E2E8F0]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#67E8F9]" aria-hidden="true" />
                <span>{t.hero.scrubberLabel}</span>
                <span className="rounded bg-[#111827] px-2 py-0.5 text-[#67E8F9]">
                  {(snapshot.elapsedMs / 1000).toFixed(2)}s /{" "}
                  {(TOTAL_LOOP_DURATION_MS / 1000).toFixed(2)}s (
                  {Math.round(snapshot.overallProgress * 100)}%)
                </span>
              </label>

              <p className="flex items-center gap-2 font-mono text-xs text-[#CBD5E1]">
                <Terminal className="h-3.5 w-3.5 text-[#67E8F9]" aria-hidden="true" />
                {t.hero.clickNodeHint}
              </p>
            </div>

            <div className="mt-2 flex min-h-[44px] items-center">
              <input
                id="hero-loop-scrubber"
                type="range"
                min={0}
                max={TOTAL_LOOP_DURATION_MS}
                step={25}
                value={snapshot.elapsedMs}
                aria-label={t.hero.scrubberLabel}
                onChange={(e) => handleScrub(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#1F2937] accent-[#22D3EE]"
              />
            </div>

            {/* 9 Direct Phase Jump Pills */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-9">
              {PHASE_WINDOWS.map((win) => {
                const isActive = phase === win.phase;
                return (
                  <button
                    key={win.phase}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleJumpToPhase(win.phase)}
                    className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border px-2 py-1.5 text-center font-mono text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                        : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {win.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Split Deck: Live MCP JSON-RPC Stream + Active Stage Inspector */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 7 Cols: Live MCP JSON-RPC & Kernel Console */}
            <div className=" flex flex-col justify-between rounded-xl border border-[#1F2937] bg-[#090D16] p-4 sm:p-5 lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                      {t.hero.telemetryConsoleTitle}
                    </h2>
                  </div>
                  <Badge tone={telemetryLog.tone}>
                    <span>{telemetryLog.timestamp}</span>
                    <span>·</span>
                    <span>{telemetryLog.mcpTool}</span>
                  </Badge>
                </div>

                <p className="mt-3 text-sm font-semibold text-[#F1F5F9]">{telemetryLog.headline}</p>

                <pre className="mt-3 overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B1120] p-3.5 font-mono text-xs leading-relaxed text-[#E2E8F0]">
                  <code>{telemetryLog.codeSnippet}</code>
                </pre>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-[#1F2937] pt-3 font-mono text-xs">
                <div className="rounded-lg bg-[#111827] px-3 py-2">
                  <span className="block text-[10px] text-[#94A3B8]">INPUT ARTIFACT</span>
                  <span className="mt-0.5 block font-semibold text-[#E2E8F0]">
                    {activeInspectorNode.inputArtifact}
                  </span>
                </div>
                <div className="rounded-lg bg-[#111827] px-3 py-2">
                  <span className="block text-[10px] text-[#94A3B8]">OUTPUT ARTIFACT</span>
                  <span className="mt-0.5 block font-semibold text-[#67E8F9]">
                    {activeInspectorNode.outputArtifact}
                  </span>
                </div>
                <div className="rounded-lg bg-[#111827] px-3 py-2">
                  <span className="block text-[10px] text-[#94A3B8]">LATENCY BUDGET</span>
                  <span className="mt-0.5 block font-semibold text-[#6EE7B7]">
                    {activeInspectorNode.latencyBudget}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Active Stage Architecture & Deterministic Verification Gates */}
            <div className="flex flex-col justify-between rounded-xl border border-[#1F2937] bg-[#090D16] p-4 sm:p-5 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                      {t.hero.stageInspectorTitle}
                    </h2>
                  </div>
                  <Badge tone={activeInspectorNode.accent}>
                    STAGE 0{activeInspectorNode.stageNumber}
                  </Badge>
                </div>

                {/* Stage Selector Mini-Tabs for Quick Inspection */}
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {architectureNodes.map((n) => {
                    const active = n.stageNumber === activeInspectorNode.stageNumber;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setInspectedStage(n.stageNumber)}
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border font-mono text-xs font-bold transition-colors ${
                          active
                            ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                            : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151]"
                        }`}
                      >
                        0{n.stageNumber}
                      </button>
                    );
                  })}
                </div>

                <h3 className="mt-3 text-base font-bold text-[#F8FAFC]">
                  {activeInspectorNode.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">
                  {activeInspectorNode.summary}
                </p>

                <ul className="mt-3 space-y-2">
                  {activeInspectorNode.verificationChecks.map((check) => (
                    <li
                      key={check}
                      className="flex items-start gap-2 rounded-lg border border-[#1F2937] bg-[#111827]/70 px-3 py-2 text-xs text-[#E2E8F0]"
                    >
                      <ShieldCheck
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]"
                        aria-hidden="true"
                      />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setSelectedNode(activeInspectorNode)}
                >
                  <Layers className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
                  {t.hero.openDeepDiveBtn} (Stage 0{activeInspectorNode.stageNumber})
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Node Deep-Dive Drawer */}
      <Drawer
        open={selectedNode !== null}
        title={selectedNode?.title ?? ""}
        subtitle={selectedNode?.subtitle}
        closeLabel={t.hero.drawerClose}
        onClose={() => setSelectedNode(null)}
      >
        {selectedNode && (
          <>
            <p className="text-sm leading-relaxed text-[#E2E8F0]">{selectedNode.summary}</p>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-[#1F2937] bg-[#111827] p-3">
                <span className="block text-[10px] text-[#94A3B8]">PROTOCOL</span>
                <span className="mt-1 block font-semibold text-[#67E8F9]">
                  {selectedNode.protocol}
                </span>
              </div>
              <div className="rounded-lg border border-[#1F2937] bg-[#111827] p-3">
                <span className="block text-[10px] text-[#94A3B8]">ARTIFACT OUT</span>
                <span className="mt-1 block font-semibold text-[#F8FAFC]">
                  {selectedNode.outputArtifact}
                </span>
              </div>
              <div className="rounded-lg border border-[#1F2937] bg-[#111827] p-3">
                <span className="block text-[10px] text-[#94A3B8]">LATENCY BUDGET</span>
                <span className="mt-1 block font-semibold text-[#6EE7B7]">
                  {selectedNode.latencyBudget}
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                {t.hero.whyStageTitle}
              </h3>
              <p className="rounded-lg border border-[#1F2937] bg-[#111827] p-4 text-sm leading-relaxed text-[#CBD5E1]">
                {selectedNode.whyStageExists}
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                {t.hero.mcpConfigTitle}
              </h3>
              <CodeBlock code={selectedNode.mcpConfig} language="json" title=".mcp.json" />
            </div>

            <div>
              <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                {t.hero.cliSetupTitle}
              </h3>
              <CodeBlock code={selectedNode.cliSetup} language="bash" title="CLI Setup" />
            </div>

            <div>
              <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#FDE68A]">
                {t.hero.alternativesTitle}
              </h3>
              <div className="space-y-3">
                {selectedNode.alternatives.map((alt) => (
                  <div
                    key={alt.name}
                    className="rounded-lg border border-[#1F2937] bg-[#111827] p-3.5"
                  >
                    <p className="font-mono text-xs font-semibold text-[#F8FAFC]">{alt.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#CBD5E1]">{alt.tradeoff}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </section>
  );
}
