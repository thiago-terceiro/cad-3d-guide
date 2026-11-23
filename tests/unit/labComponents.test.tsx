import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { CodeCadStudio } from "@/components/CodeCadStudio";
import { CurriculumStepper } from "@/components/CurriculumStepper";
import { GeneralExamplesPage } from "@/components/GeneralExamplesPage";
import { Navbar } from "@/components/Navbar";
import { PhysicsFeaSandbox } from "@/components/PhysicsFeaSandbox";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { SlicerAnalyzer } from "@/components/SlicerAnalyzer";
import { TechStackGuide } from "@/components/TechStackGuide";
import { I18nProvider } from "@/i18n/I18nContext";

describe("Lab interactive modules", () => {
  it("renders Navbar and switches locales and active pages", () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <I18nProvider>
        <Navbar activePage="lab" onNavigatePage={onNavigate} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "PT-BR" }));
    expect(screen.getByText(/Mapa do Loop/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ES" }));
    expect(screen.getByText(/Mapa del Loop/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    fireEvent.click(screen.getAllByRole("button", { name: /3D Examples/i })[0]);
    expect(onNavigate).toHaveBeenCalledWith("examples");

    rerender(
      <I18nProvider>
        <Navbar activePage="examples" onNavigatePage={onNavigate} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Hardware Lab/i })[0]);
    expect(onNavigate).toHaveBeenCalledWith("lab");
  });

  it("renders SectionSkeleton placeholder", () => {
    render(<SectionSkeleton id="cad-studio" />);
    expect(screen.getByTestId("skeleton-cad-studio")).toHaveAttribute("aria-busy", "true");
  });

  it("interacts with CodeCadStudio sliders, orthographic views, and CAD exports", () => {
    const { container, unmount } = render(
      <I18nProvider>
        <CodeCadStudio />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByRole("slider", { name: /Module \/ Tooth Count/i }), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Bore Diameter/i }), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Wall Thickness/i }), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Fillet Radius/i }), {
      target: { value: "1.2" },
    });

    expect(container.textContent).toContain("TOOTH_COUNT = 30");

    // Switch orthographic views
    for (const viewName of ["Top", "Front", "Right", "Iso"]) {
      const btn = screen.getByRole("button", { name: viewName });
      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "true");
    }

    // Export STEP, STL, 3MF
    fireEvent.click(screen.getByRole("button", { name: /Export STEP/i }));
    fireEvent.click(screen.getByRole("button", { name: /Export STL/i }));
    fireEvent.click(screen.getByRole("button", { name: /Export 3MF/i }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);

    fireEvent(window, new Event("resize"));
    unmount();
  });

  it("interacts with PhysicsFeaSandbox Mode A (Kinematics) and Mode B (FEA)", () => {
    const { unmount } = render(
      <I18nProvider>
        <PhysicsFeaSandbox />
      </I18nProvider>,
    );

    // Mode A sliders
    fireEvent.change(screen.getByRole("slider", { name: /Motor Torque/i }), {
      target: { value: "3.5" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Friction Coefficient/i }), {
      target: { value: "0.15" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Payload Mass/i }), {
      target: { value: "2.4" },
    });

    // Switch to Mode B: Structural Stress FEA
    fireEvent.click(screen.getByRole("tab", { name: /Mode B: Structural Stress FEA/i }));
    expect(screen.getByText(/CalculiX \(ccx\) von Mises Stress Heatmap/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("slider", { name: /Virtual Downward Load/i }), {
      target: { value: "420" },
    });

    const deformCheckbox = screen.getByRole("checkbox", { name: /Exaggerated Deformation/i });
    fireEvent.click(deformCheckbox);
    expect(deformCheckbox).not.toBeChecked();

    fireEvent(window, new Event("resize"));
    unmount();
  });

  it("interacts with SlicerAnalyzer layer scrubber and overhang toggle", () => {
    const { unmount } = render(
      <I18nProvider>
        <SlicerAnalyzer />
      </I18nProvider>,
    );

    const layerSlider = screen.getByRole("slider", { name: /G-Code Layer Scrubber/i });
    fireEvent.change(layerSlider, { target: { value: "30" } });
    fireEvent.change(layerSlider, { target: { value: "135" } });
    fireEvent.change(layerSlider, { target: { value: "220" } });

    const overhangCheckbox = screen.getByRole("checkbox", { name: /Highlight >45° Overhangs/i });
    fireEvent.click(overhangCheckbox);
    expect(overhangCheckbox).not.toBeChecked();

    fireEvent(window, new Event("resize"));
    unmount();
  });

  it("switches tabs in TechStackGuide and CurriculumStepper", () => {
    render(
      <I18nProvider>
        <TechStackGuide />
        <CurriculumStepper />
      </I18nProvider>,
    );

    // TechStackGuide tabs
    fireEvent.click(screen.getByRole("tab", { name: /2\. Agent Transport & Runtime/i }));
    fireEvent.click(screen.getByRole("tab", { name: /3\. Kinematics & Robotics Physics/i }));
    fireEvent.click(screen.getByRole("tab", { name: /4\. Structural FEA Solver/i }));
    fireEvent.click(screen.getByRole("tab", { name: /5\. Headless CLI Slicer & DFM/i }));
    expect(screen.getAllByText(/PrusaSlicer/i).length).toBeGreaterThan(0);

    // CurriculumStepper steps, harnesses, and artifact tabs
    fireEvent.click(
      screen.getByRole("tab", { name: /STEP 04 URDF Wrapping & Headless MuJoCo Pytest/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Antigravity" }));
    fireEvent.click(screen.getByRole("button", { name: "Cursor" }));
    fireEvent.click(screen.getByRole("button", { name: "Codex" }));
    fireEvent.click(screen.getByRole("tab", { name: /Python Script/i }));
    fireEvent.click(screen.getByRole("tab", { name: /Agent Prompt/i }));
    expect(screen.getAllByText(/MuJoCo/i).length).toBeGreaterThan(0);
  });

  it("interacts with GeneralExamplesPage across all 3 parametric 3D examples", () => {
    const onBack = vi.fn();
    const { unmount } = render(
      <I18nProvider>
        <GeneralExamplesPage onBack={onBack} />
      </I18nProvider>,
    );

    // Example 1: Threaded Jar & Knurled Cap sliders + Wireframe + STL download
    fireEvent.change(screen.getByRole("slider", { name: /Outer Diameter/i }), {
      target: { value: "54" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Container Height/i }), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Exploded Cap Lift/i }), {
      target: { value: "18" },
    });
    const wireframeBtn = screen.getByRole("button", { name: /Wireframe/i });
    fireEvent.click(wireframeBtn);
    expect(wireframeBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Export STL/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();

    // Example 2: Print-in-Place Articulated Hinge
    fireEvent.click(screen.getByRole("tab", { name: /2\. Print-in-Place Articulated Hinge/i }));
    fireEvent.change(screen.getByRole("slider", { name: /Articulation Angle/i }), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Hinge Width/i }), {
      target: { value: "48" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Print-in-Place Clearance/i }), {
      target: { value: "0.35" },
    });

    // Example 3: Modular Desk Cable Organizer
    fireEvent.click(screen.getByRole("tab", { name: /3\. Modular Desk Cable Organizer/i }));
    fireEvent.change(screen.getByRole("slider", { name: /Slot Count/i }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Organizer Width/i }), {
      target: { value: "88" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Divider Height/i }), {
      target: { value: "30" },
    });

    fireEvent(window, new Event("resize"));
    fireEvent.click(screen.getByRole("button", { name: /Back to Hardware Lab/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("renders full App with lazy-loaded sections and navigates between Lab and Examples", async () => {
    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        { name: /Live Parametric Code-CAD Studio/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    // Navigate to 3D Examples
    fireEvent.click(screen.getAllByRole("button", { name: /3D Examples/i })[0]);
    expect(
      await screen.findByRole(
        "heading",
        { name: /Everyday Parametric 3D Printing Gallery/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    // Navigate back via brand header button
    fireEvent.click(screen.getByRole("button", { name: /Agentic Hardware Lab/i }));
    expect(
      await screen.findByRole(
        "heading",
        { name: /Agentic Hardware Lab: Zero-GUI Mechanical CAD/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});
