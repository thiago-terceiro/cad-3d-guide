import { Bot, CheckCircle2, Code2, FileJson, Terminal } from "lucide-react";
import { useState } from "react";
import { curriculumSteps, type HarnessId } from "@/data/curriculumSteps";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { useTranslation } from "@/i18n/I18nContext";

const HARNESSES: { id: HarnessId; label: string }[] = [
  { id: "claude", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex" },
  { id: "antigravity", label: "Antigravity" },
];

type ContentTab = "mcp" | "python" | "prompt";

export function CurriculumStepper() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(1);
  const [harness, setHarness] = useState<HarnessId>("claude");
  const [tab, setTab] = useState<ContentTab>("mcp");

  const current = curriculumSteps.find((s) => s.step === activeStep) ?? curriculumSteps[0];

  return (
    <section id="curriculum" className="bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            {t.curriculum.sectionTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
            {t.curriculum.sectionDesc}
          </p>
        </div>

        {/* 5-Step Horizontal Stepper */}
        <div
          role="tablist"
          aria-label="5-step agentic hardware curriculum"
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {curriculumSteps.map((step) => {
            const isActive = step.step === activeStep;
            return (
              <button
                key={step.step}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveStep(step.step)}
                className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-3.5 text-left transition-colors ${
                  isActive
                    ? "border-[#22D3EE] bg-[#083344]/80 text-[#F8FAFC]"
                    : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className={isActive ? "font-bold text-[#67E8F9]" : "text-[#94A3B8]"}>
                    STEP 0{step.step}
                  </span>
                  {isActive && (
                    <CheckCircle2 className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
                  )}
                </div>
                <span className="mt-1.5 text-xs font-semibold leading-snug">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Card */}
        <Card className="p-5 sm:p-6" accent="cyan">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1F2937] pb-5">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-semibold text-[#67E8F9]">
                STEP 0{current.step} · {current.subtitle}
              </span>
              <h3 className="mt-1 text-xl font-bold text-[#F8FAFC]">{current.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">{current.objective}</p>
            </div>

            {/* Harness Switcher */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium text-[#94A3B8]">
                {t.curriculum.harnessLabel}
              </span>
              <fieldset
                className="flex flex-wrap gap-1.5 border-0 p-0 m-0"
                aria-label={t.curriculum.harnessLabel}
              >
                {HARNESSES.map((h) => {
                  const selected = harness === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setHarness(h.id)}
                      className={`min-h-[44px] rounded-lg border px-3 font-mono text-xs font-semibold transition-colors ${
                        selected
                          ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                          : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1] hover:border-[#374151]"
                      }`}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </fieldset>
            </div>
          </div>

          {/* Sub-tabs: .mcp.json | Python Script | Agent Prompt */}
          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Step artifacts">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mcp"}
              onClick={() => setTab("mcp")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 font-mono text-xs font-semibold transition-colors ${
                tab === "mcp"
                  ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                  : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1] hover:border-[#374151]"
              }`}
            >
              <FileJson className="h-4 w-4" aria-hidden="true" />
              {t.curriculum.mcpConfigTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "python"}
              onClick={() => setTab("python")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 font-mono text-xs font-semibold transition-colors ${
                tab === "python"
                  ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                  : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1] hover:border-[#374151]"
              }`}
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              {t.curriculum.pythonScriptTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "prompt"}
              onClick={() => setTab("prompt")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 font-mono text-xs font-semibold transition-colors ${
                tab === "prompt"
                  ? "border-[#34D399] bg-[#064E3B] text-[#6EE7B7]"
                  : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1] hover:border-[#374151]"
              }`}
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              {t.curriculum.systemPromptTab}
            </button>
          </div>

          <div className="mt-4">
            {tab === "mcp" && (
              <CodeBlock
                code={current.mcpConfigs[harness]}
                language={harness === "codex" ? "bash" : "json"}
                title={`${HARNESSES.find((h) => h.id === harness)?.label} · .mcp.json`}
              />
            )}
            {tab === "python" && (
              <CodeBlock
                code={current.pythonScript}
                language="python"
                title={`step_0${current.step}_pipeline.py`}
              />
            )}
            {tab === "prompt" && (
              <CodeBlock
                code={current.systemPrompt}
                language="bash"
                title={`System Prompt — Step 0${current.step}`}
              />
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 font-mono text-xs text-[#94A3B8]">
            <Terminal className="h-3.5 w-3.5 text-[#67E8F9]" aria-hidden="true" />
            <span>
              Tip: Keep `pyproject.toml`, `cad/`, `tests/`, and `build/` in git for deterministic
              hardware CI.
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
}
