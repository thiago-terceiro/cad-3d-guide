import { lazy, Suspense, useState } from "react";
import { CurriculumStepper } from "@/components/CurriculumStepper";
import { HeroArchitectureMap } from "@/components/HeroArchitectureMap";
import { Navbar } from "@/components/Navbar";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { TechStackGuide } from "@/components/TechStackGuide";
import { I18nProvider } from "@/i18n/I18nContext";

// Three.js-heavy sections are code-split so the hero loop paints without waiting on WebGL code.
const CodeCadStudio = lazy(() =>
  import("@/components/CodeCadStudio").then((m) => ({ default: m.CodeCadStudio })),
);
const PhysicsFeaSandbox = lazy(() =>
  import("@/components/PhysicsFeaSandbox").then((m) => ({ default: m.PhysicsFeaSandbox })),
);
const SlicerAnalyzer = lazy(() =>
  import("@/components/SlicerAnalyzer").then((m) => ({ default: m.SlicerAnalyzer })),
);
const GeneralExamplesPage = lazy(() =>
  import("@/components/GeneralExamplesPage").then((m) => ({ default: m.GeneralExamplesPage })),
);

export type AppPage = "lab" | "examples";

export function App() {
  const [activePage, setActivePage] = useState<AppPage>("lab");

  const handleNavigatePage = (page: AppPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <I18nProvider>
      <div id="top" className="min-h-screen bg-[#090D16] text-[#F1F5F9]">
        <Navbar activePage={activePage} onNavigatePage={handleNavigatePage} />
        {activePage === "lab" ? (
          <main>
            <HeroArchitectureMap />
            <Suspense fallback={<SectionSkeleton id="cad-studio" />}>
              <CodeCadStudio />
            </Suspense>
            <Suspense fallback={<SectionSkeleton id="physics-fea" />}>
              <PhysicsFeaSandbox />
            </Suspense>
            <Suspense fallback={<SectionSkeleton id="slicer" />}>
              <SlicerAnalyzer />
            </Suspense>
            <TechStackGuide />
            <CurriculumStepper />
          </main>
        ) : (
          <Suspense fallback={<SectionSkeleton id="examples" />}>
            <GeneralExamplesPage onBack={() => handleNavigatePage("lab")} />
          </Suspense>
        )}
        <footer className="border-t border-[#1F2937] bg-[#090D16] py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 font-mono text-xs text-[#94A3B8] sm:px-6">
            <span>Agentic Hardware Lab · Zero-GUI Mechanical CAD, Physics &amp; 3D Printing</span>
            <span>build123d · MuJoCo · CalculiX · PrusaSlicer CLI</span>
          </div>
        </footer>
      </div>
    </I18nProvider>
  );
}

export default App;
