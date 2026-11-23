import { type ArchitectureNodeData, architectureNodes } from "@/data/architectureNodes";
import { Badge } from "@/design-system/Badge";
import { Button } from "@/design-system/Button";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Drawer } from "@/design-system/Drawer";
import { useTranslation } from "@/i18n/I18nContext";
import { Activity, AlertTriangle, CheckCircle2, Play, RotateCcw, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LoopPhase =
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

const NODE_POSITIONS = [
  { x: 100, y: 120 },
  { x: 300, y: 120 },
  { x: 500, y: 120 },
  { x: 700, y: 120 },
  { x: 900, y: 120 },
];

export function HeroArchitectureMap() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<LoopPhase>("idle");
  const [selectedNode, setSelectedNode] = useState<ArchitectureNodeData | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleSimulate = () => {
    clearTimers();
    setPhase("stage1");

    const schedule: [LoopPhase, number][] = [
      ["stage2", 750],
      ["stage3-fail", 1600],
      ["loopback", 2900],
      ["stage2-fix", 3800],
      ["stage3-pass", 4700],
      ["stage4", 5500],
      ["stage5", 6300],
      ["passed", 7100],
    ];

    for (const [nextPhase, delay] of schedule) {
      const id = window.setTimeout(() => setPhase(nextPhase), delay);
      timersRef.current.push(id);
    }
  };

  const handleReset = () => {
    clearTimers();
    setPhase("idle");
  };

  const isRunning = phase !== "idle" && phase !== "passed";

  const getPacketCoords = (): { x: number; y: number; color: string } | null => {
    switch (phase) {
      case "stage1":
        return { x: NODE_POSITIONS[0].x, y: 120, color: "#22D3EE" };
      case "stage2":
      case "stage2-fix":
        return { x: NODE_POSITIONS[1].x, y: 120, color: "#22D3EE" };
      case "stage3-fail":
        return { x: NODE_POSITIONS[2].x, y: 120, color: "#EF4444" };
      case "loopback":
        return { x: 400, y: 215, color: "#F59E0B" };
      case "stage3-pass":
        return { x: NODE_POSITIONS[2].x, y: 120, color: "#10B981" };
      case "stage4":
        return { x: NODE_POSITIONS[3].x, y: 120, color: "#F59E0B" };
      case "stage5":
      case "passed":
        return { x: NODE_POSITIONS[4].x, y: 120, color: "#10B981" };
      default:
        return null;
    }
  };

  const packet = getPacketCoords();

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

  const getNodeStateColor = (stageNumber: number) => {
    if (phase === "idle") return "#1F2937";
    if (phase === "passed") return "#10B981";
    if (stageNumber === 3 && phase === "stage3-fail") return "#EF4444";
    if (stageNumber === 2 && (phase === "loopback" || phase === "stage2-fix")) return "#F59E0B";
    if (
      stageNumber === 1 ||
      (stageNumber === 2 && phase !== "stage1") ||
      (stageNumber === 3 && ["stage3-pass", "stage4", "stage5"].includes(phase)) ||
      (stageNumber === 4 && ["stage4", "stage5"].includes(phase)) ||
      (stageNumber === 5 && phase === "stage5")
    ) {
      return "#06B6D4";
    }
    return "#1F2937";
  };

  return (
    <section id="architecture" className="border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
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

        <Card className="mt-8 p-4 sm:p-6" accent={phase === "passed" ? "emerald" : "cyan"}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleSimulate}
                disabled={isRunning}
                aria-label={isRunning ? t.hero.simulatingBtn : t.hero.simulateBtn}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {isRunning ? t.hero.simulatingBtn : t.hero.simulateBtn}
              </Button>
              <Button variant="secondary" onClick={handleReset} aria-label={t.hero.resetBtn}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t.hero.resetBtn}
              </Button>
            </div>

            <Badge tone={statusBanner.tone} className="max-w-full">
              {phase === "stage3-fail" && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
              {phase === "passed" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{statusBanner.text}</span>
            </Badge>
          </div>

          {/* Animated SVG 5-Stage Closed-Loop Node Graph */}
          <div
            className="mt-6 overflow-x-auto pb-2"
            tabIndex={0}
            role="region"
            aria-label="5-stage hardware loop diagram"
          >
            <svg
              viewBox="0 0 1000 255"
              className="min-w-[780px] w-full"
            >
              <defs>
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4" />
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
              </defs>

              {/* Forward edges */}
              {[0, 1, 2, 3].map((idx) => (
                <line
                  key={idx}
                  x1={NODE_POSITIONS[idx].x + 74}
                  y1={120}
                  x2={NODE_POSITIONS[idx + 1].x - 78}
                  y2={120}
                  stroke={phase === "passed" ? "#10B981" : "#374151"}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow-cyan)"
                />
              ))}

              {/* Self-Correction Feedback Loop (Stage 3 -> Stage 2) */}
              <path
                d="M 500 162 C 500 222, 300 222, 300 165"
                fill="none"
                stroke={
                  phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                    ? "#F59E0B"
                    : "#374151"
                }
                strokeWidth={
                  phase === "stage3-fail" || phase === "loopback" || phase === "stage2-fix"
                    ? 3
                    : 1.75
                }
                strokeDasharray="6 4"
                markerEnd="url(#arrow-amber)"
              />
              <text
                x="400"
                y="238"
                textAnchor="middle"
                className="fill-[#FDE68A] font-mono text-[11px]"
              >
                Self-Correction Feedback Loop (Gate 3 → Stage 2)
              </text>

              {/* Failure Toast inside SVG */}
              {phase === "stage3-fail" && (
                <g transform="translate(500, 38)">
                  <rect
                    x="-155"
                    y="-18"
                    width="310"
                    height="30"
                    rx="6"
                    fill="#450A0A"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    className="fill-[#FCA5A5] font-mono text-[11px] font-semibold"
                  >
                    Gear Teeth Interference Detected (-0.42mm)
                  </text>
                </g>
              )}

              {/* 5 Stage Nodes */}
              {architectureNodes.map((node, idx) => {
                const pos = NODE_POSITIONS[idx];
                const strokeColor = getNodeStateColor(node.stageNumber);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(node)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedNode(node);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                  >
                    <rect
                      x="-74"
                      y="-40"
                      width="148"
                      height="80"
                      rx="10"
                      fill="#111827"
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="-14"
                      textAnchor="middle"
                      className="fill-[#67E8F9] font-mono text-[11px] font-bold"
                    >
                      STAGE 0{node.stageNumber}
                    </text>
                    <text
                      x="0"
                      y="8"
                      textAnchor="middle"
                      className="fill-[#F8FAFC] text-[13px] font-semibold"
                    >
                      {node.shortTitle}
                    </text>
                    <text
                      x="0"
                      y="26"
                      textAnchor="middle"
                      className="fill-[#94A3B8] font-mono text-[10px]"
                    >
                      Click for MCP/CLI
                    </text>
                  </g>
                );
              })}

              {/* Animated Telemetry Packet */}
              {packet && (
                <g
                  style={{
                    transform: `translate(${packet.x}px, ${packet.y}px)`,
                    transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <circle
                    r="14"
                    fill={packet.color}
                    opacity="0.25"
                    className="animate-pulse-ring"
                  />
                  <circle r="7" fill={packet.color} stroke="#F8FAFC" strokeWidth="2" />
                </g>
              )}
            </svg>
          </div>

          <p className="mt-2 flex items-center gap-2 font-mono text-xs text-[#CBD5E1]">
            <Terminal className="h-3.5 w-3.5 text-[#67E8F9]" aria-hidden="true" />
            {t.hero.clickNodeHint}
          </p>
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
