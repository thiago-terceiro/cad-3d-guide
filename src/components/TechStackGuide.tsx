import { techStackGuide } from "@/data/techStackGuide";
import { Badge } from "@/design-system/Badge";
import { Card } from "@/design-system/Card";
import { useTranslation } from "@/i18n/I18nContext";
import { ArrowRightLeft, BookOpen, Check, Factory, Minus } from "lucide-react";
import { useState } from "react";

export function TechStackGuide() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(techStackGuide[0].id);

  const activeItem = techStackGuide.find((item) => item.id === selectedId) ?? techStackGuide[0];

  return (
    <section id="tech-guide" className="border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <Badge tone="cyan" className="mb-3">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            ENGINEERING RATIONALE &amp; TRADE-OFFS
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            {t.guide.sectionTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
            {t.guide.sectionDesc}
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div
          role="tablist"
          aria-label="Technology stack layers"
          className="mb-6 flex flex-wrap gap-2"
        >
          {techStackGuide.map((item) => {
            const selected = item.id === activeItem.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedId(item.id)}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-left font-mono text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                    : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151]"
                }`}
              >
                {item.category}
              </button>
            );
          })}
        </div>

        {/* Detailed Comparison Card */}
        <Card className="p-6" accent="cyan">
          <div className="border-b border-[#1F2937] pb-4">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
              {activeItem.category}
            </div>
            <h3 className="mt-1 text-xl font-bold text-[#F8FAFC] sm:text-2xl">
              {activeItem.chosenTech}
            </h3>
            <p className="mt-1 text-sm text-[#CBD5E1]">{activeItem.tagline}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left column: Why We Use It + Pros/Cons */}
            <div className="space-y-6 lg:col-span-7">
              <div>
                <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                  {t.guide.whyWeUseIt}
                </h4>
                <p className="rounded-lg border border-[#1F2937] bg-[#090D16] p-4 text-sm leading-relaxed text-[#E2E8F0]">
                  {activeItem.whyWeUseIt}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-[#10B981]/30 bg-[#064E3B]/20 p-4">
                  <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#6EE7B7]">
                    {t.guide.prosLabel}
                  </h4>
                  <ul className="space-y-2 text-xs leading-relaxed text-[#E2E8F0]">
                    {activeItem.pros.map((pro) => (
                      <li key={pro} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]"
                          aria-hidden="true"
                        />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-[#F59E0B]/30 bg-[#451A03]/20 p-4">
                  <h4 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#FDE68A]">
                    {t.guide.consLabel}
                  </h4>
                  <ul className="space-y-2 text-xs leading-relaxed text-[#E2E8F0]">
                    {activeItem.cons.map((con) => (
                      <li key={con} className="flex items-start gap-2">
                        <Minus
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FBBF24]"
                          aria-hidden="true"
                        />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-[#1F2937] bg-[#090D16] p-4">
                <Factory className="mt-0.5 h-5 w-5 shrink-0 text-[#6EE7B7]" aria-hidden="true" />
                <div>
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6EE7B7]">
                    {t.guide.manufacturingNote}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#CBD5E1]">
                    {activeItem.manufacturingReadiness}
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: Alternatives & When to Switch */}
            <div className="space-y-3 lg:col-span-5">
              <h4 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#FDE68A]">
                <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                {t.guide.alternativesLabel}
              </h4>
              {activeItem.alternatives.map((alt) => (
                <div key={alt.name} className="rounded-lg border border-[#1F2937] bg-[#090D16] p-4">
                  <div className="font-mono text-sm font-semibold text-[#F8FAFC]">{alt.name}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">{alt.comparison}</p>
                  <p className="mt-2 border-t border-[#1F2937] pt-2 font-mono text-[11px] text-[#67E8F9]">
                    {alt.whenToChoose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
