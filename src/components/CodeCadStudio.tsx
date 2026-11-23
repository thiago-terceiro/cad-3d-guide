import { Badge } from "@/design-system/Badge";
import { Button } from "@/design-system/Button";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Slider } from "@/design-system/Slider";
import { useTranslation } from "@/i18n/I18nContext";
import {
  type GearParams,
  computeGearMetrics,
  createSpurGearGeometry,
  geometryToAsciiStl,
} from "@/utils/cadGeometry";
import { Box, CheckCircle2, Download, Eye, Layers } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type CadView = "iso" | "top" | "front" | "right";

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CodeCadStudio() {
  const { t } = useTranslation();
  const [params, setParams] = useState<GearParams>({
    toothCount: 24,
    boreDiameter: 8,
    wallThickness: 10,
    filletRadius: 0.8,
  });
  const [activeView, setActiveView] = useState<CadView>("iso");

  const mountRef = useRef<HTMLDivElement | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const boxHelperRef = useRef<THREE.Box3Helper | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const metrics = useMemo(() => computeGearMetrics(params), [params]);

  const pythonScript = useMemo(() => {
    return `from build123d import (
    BuildPart, BuildSketch, RegularPolygon,
    Circle, Mode, extrude, fillet, export_step, export_stl
)

# Parametric Hardware Variables (Live Mutated)
TOOTH_COUNT = ${params.toothCount}
MODULE_MM = 1.6
BORE_DIAMETER = ${params.boreDiameter.toFixed(1)}
WALL_THICKNESS = ${params.wallThickness.toFixed(1)}
FILLET_RADIUS = ${params.filletRadius.toFixed(2)}

pitch_radius = (TOOTH_COUNT * MODULE_MM) / 2.0
outer_radius = pitch_radius + MODULE_MM

with BuildPart() as spur_gear:
    with BuildSketch():
        RegularPolygon(radius=outer_radius, side_count=TOOTH_COUNT)
        Circle(radius=BORE_DIAMETER / 2.0, mode=Mode.SUBTRACT)
    extrude(amount=WALL_THICKNESS)
    fillet(spur_gear.edges(), radius=FILLET_RADIUS)

# MCP Topological Gate Assertions
assert spur_gear.part.is_valid(), "B-Rep solid must be watertight"
export_step(spur_gear.part, "build/spur_gear.step")
export_stl(spur_gear.part, "build/spur_gear.stl")`;
  }, [params]);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(55, 48, 65);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // Millimeter grid
    const grid = new THREE.GridHelper(120, 24, "#06B6D4", "#1F2937");
    grid.position.y = -18;
    scene.add(grid);

    // Industrial studio lighting
    const ambient = new THREE.AmbientLight("#E2E8F0", 0.65);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#67E8F9", 1.8);
    keyLight.position.set(60, 80, 50);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight("#F59E0B", 0.75);
    rimLight.position.set(-50, -30, -40);
    scene.add(rimLight);

    const initialGeo = createSpurGearGeometry(params);
    const material = new THREE.MeshStandardMaterial({
      color: "#06B6D4",
      metalness: 0.45,
      roughness: 0.32,
    });
    const mesh = new THREE.Mesh(initialGeo, material);
    scene.add(mesh);
    meshRef.current = mesh;

    const bbox = new THREE.Box3().setFromObject(mesh);
    const boxHelper = new THREE.Box3Helper(bbox, new THREE.Color("#22D3EE"));
    scene.add(boxHelper);
    boxHelperRef.current = boxHelper;

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      initialGeo.dispose();
      material.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update procedural gear geometry when sliders move
  useEffect(() => {
    const mesh = meshRef.current;
    const boxHelper = boxHelperRef.current;
    if (!mesh || !boxHelper) return;

    const nextGeo = createSpurGearGeometry(params);
    mesh.geometry.dispose();
    mesh.geometry = nextGeo;

    const bbox = new THREE.Box3().setFromObject(mesh);
    boxHelper.box.copy(bbox);
  }, [params]);

  // Snap camera to 4 orthographic-style inspection views
  const handleViewChange = (view: CadView) => {
    setActiveView(view);
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;

    const dist = Math.max(70, metrics.outerDiameterMm * 1.9);
    controls.enableDamping = false;
    if (view === "iso") cam.position.set(dist * 0.72, dist * 0.62, dist * 0.85);
    if (view === "top") cam.position.set(0, dist, 0.01);
    if (view === "front") cam.position.set(0, 0, dist);
    if (view === "right") cam.position.set(dist, 0, 0);
    controls.target.set(0, 0, 0);
    cam.lookAt(0, 0, 0);
    controls.update();
    controls.enableDamping = true;
  };

  const handleExport = (format: "step" | "stl" | "3mf") => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (format === "stl") {
      const stl = geometryToAsciiStl(mesh.geometry, `spur_gear_${params.toothCount}t`);
      downloadTextFile(`spur_gear_${params.toothCount}t.stl`, stl, "model/stl");
    } else if (format === "step") {
      const stepStub = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('build123d B-Rep Spur Gear: ${params.toothCount} teeth, bore ${params.boreDiameter}mm'),'2;1');\nFILE_NAME('spur_gear_${params.toothCount}t.step','2026-11-18T18:00:00',('Agentic Hardware Lab'),('build123d-mcp'),'OCCT 7.8','','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN'));\nENDSEC;\nDATA;\n/* Parametric Volume: ${metrics.volumeCm3} cm^3 | OD: ${metrics.outerDiameterMm} mm */\nENDSEC;\nEND-ISO-10303-21;\n`;
      downloadTextFile(`spur_gear_${params.toothCount}t.step`, stepStub, "application/step");
    } else {
      const threemf = `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="en-US">\n  <metadata name="Title">spur_gear_${params.toothCount}t</metadata>\n  <metadata name="Generator">Agentic Hardware Lab (build123d-mcp)</metadata>\n  <resources><object id="1" type="model"><mesh><!-- Volume ${metrics.volumeCm3} cm^3 --></mesh></object></resources>\n  <build><item objectid="1"/></build>\n</model>`;
      downloadTextFile(`spur_gear_${params.toothCount}t.3mf`, threemf, "model/3mf");
    }
  };

  return (
    <section id="cad-studio" className="border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            {t.cad.sectionTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
            {t.cad.sectionDesc}
          </p>
        </div>

        {/* Parametric Sliders */}
        <Card className="mb-6 grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Slider
            label={t.cad.toothCount}
            value={params.toothCount}
            min={12}
            max={40}
            step={1}
            unit="T"
            onChange={(toothCount) => setParams((p) => ({ ...p, toothCount }))}
          />
          <Slider
            label={t.cad.boreDiameter}
            value={params.boreDiameter}
            min={4}
            max={16}
            step={0.5}
            unit="mm"
            onChange={(boreDiameter) => setParams((p) => ({ ...p, boreDiameter }))}
          />
          <Slider
            label={t.cad.wallThickness}
            value={params.wallThickness}
            min={4}
            max={24}
            step={1}
            unit="mm"
            onChange={(wallThickness) => setParams((p) => ({ ...p, wallThickness }))}
          />
          <Slider
            label={t.cad.filletRadius}
            value={params.filletRadius}
            min={0.2}
            max={1.5}
            step={0.1}
            unit="mm"
            onChange={(filletRadius) => setParams((p) => ({ ...p, filletRadius }))}
          />
        </Card>

        {/* Split-Pane Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Live Python Code */}
          <div className="lg:col-span-5">
            <CodeBlock
              code={pythonScript}
              language="python"
              title={t.cad.codePaneTitle}
              maxHeightClass="max-h-[440px]"
            />
          </div>

          {/* Right: Interactive Three.js Viewport */}
          <Card className="flex flex-col overflow-hidden lg:col-span-7" accent="cyan">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] bg-[#111827] px-4 py-2">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
                <span className="font-mono text-xs font-semibold text-[#F8FAFC]">
                  {t.cad.viewportTitle}
                </span>
              </div>

              <div className="flex items-center gap-1" role="group" aria-label="Orthographic views">
                <Eye className="mr-1 h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                {(["iso", "top", "front", "right"] as CadView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-pressed={activeView === view}
                    onClick={() => handleViewChange(view)}
                    className={`min-h-[44px] min-w-[44px] rounded-md border px-2.5 font-mono text-xs font-medium transition-colors ${
                      activeView === view
                        ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                        : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1] hover:border-[#374151]"
                    }`}
                  >
                    {t.cad.views[view]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-[340px] w-full bg-[#090D16] sm:h-[380px]">
              <div
                ref={mountRef}
                role="img"
                className="h-full w-full"
                aria-label="Interactive 3D CAD gear viewport"
              />

              {/* Bounding-Box Dimension Callout Overlay */}
              <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 rounded-lg border border-[#1F2937] bg-[#090D16]/85 px-3 py-2 font-mono text-[11px] text-[#E2E8F0] backdrop-blur-xs">
                <div>
                  OD: <span className="text-[#67E8F9]">{metrics.outerDiameterMm} mm</span>
                </div>
                <div>
                  PD: <span className="text-[#67E8F9]">{metrics.pitchDiameterMm} mm</span>
                </div>
                <div>
                  Z: <span className="text-[#67E8F9]">{params.wallThickness.toFixed(1)} mm</span>
                </div>
              </div>
            </div>

            {/* MCP Gate Inspector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1F2937] bg-[#111827] px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                <span className="text-[#CBD5E1]">
                  {t.cad.volumeLabel}:{" "}
                  <strong className="text-[#F8FAFC]">{metrics.volumeCm3} cm³</strong>
                </span>
                <span className="text-[#CBD5E1]">
                  {t.cad.comLabel}:{" "}
                  <strong className="text-[#F8FAFC]">({metrics.centerOfMass.join(", ")}) mm</strong>
                </span>
                <Badge tone={metrics.watertight ? "emerald" : "red"}>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.cad.watertightLabel}: {metrics.watertight ? t.cad.watertightPass : "FAIL"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => handleExport("step")}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.cad.exportStep}
                </Button>
                <Button variant="primary" onClick={() => handleExport("stl")}>
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.cad.exportStl}
                </Button>
                <Button variant="secondary" onClick={() => handleExport("3mf")}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.cad.export3mf}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
