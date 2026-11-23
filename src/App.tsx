import { useState } from "react";
import { CodeCadStudio } from "@/components/CodeCadStudio";
import { CurriculumStepper } from "@/components/CurriculumStepper";
import { GeneralExamplesPage } from "@/components/GeneralExamplesPage";
import { HeroArchitectureMap } from "@/components/HeroArchitectureMap";
import { Navbar } from "@/components/Navbar";
import { PhysicsFeaSandbox } from "@/components/PhysicsFeaSandbox";
import { SlicerAnalyzer } from "@/components/SlicerAnalyzer";
import { TechStackGuide } from "@/components/TechStackGuide";
import { I18nProvider } from "@/i18n/I18nContext";

export function App() {
  const [activePage, setActivePage] = useState<"lab" | "examples">("lab");

  const handleNavigatePage = (page: "lab" | "examples") => {
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
            <CodeCadStudio />
            <PhysicsFeaSandbox />
            <SlicerAnalyzer />
            <TechStackGuide />
            <CurriculumStepper />
          </main>
        ) : (
          <GeneralExamplesPage onBack={() => handleNavigatePage("lab")} />
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
