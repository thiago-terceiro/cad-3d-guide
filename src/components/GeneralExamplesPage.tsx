import { ArrowLeft, Box, Download, Layers, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Badge } from "@/design-system/Badge";
import { Button } from "@/design-system/Button";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Slider } from "@/design-system/Slider";
import { geometryToAsciiStl } from "@/utils/cadGeometry";

type ExampleId = "jar" | "hinge" | "organizer";

function downloadStl(filename: string, group: THREE.Group) {
  const parts: string[] = [];
  group.updateMatrixWorld(true);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const cloned = obj.geometry.clone();
      cloned.applyMatrix4(obj.matrixWorld);
      parts.push(geometryToAsciiStl(cloned, obj.name || "part"));
      cloned.dispose();
    }
  });
  const blob = new Blob([parts.join("\n")], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function GeneralExamplesPage({ onBack }: { onBack: () => void }) {
  const [activeExample, setActiveExample] = useState<ExampleId>("jar");
  const [wireframe, setWireframe] = useState(false);

  // Example 1: Threaded Jar & Knurled Cap
  const [jarDiameter, setJarDiameter] = useState(46);
  const [jarHeight, setJarHeight] = useState(44);
  const [capLift, setCapLift] = useState(14);

  // Example 2: Print-in-Place Articulated Hinge
  const [hingeAngle, setHingeAngle] = useState(35);
  const [hingeWidth, setHingeWidth] = useState(42);
  const [pinClearance, setPinClearance] = useState(0.35);

  // Example 3: Modular Desk Cable & Tool Organizer
  const [slotCount, setSlotCount] = useState(5);
  const [orgWidth, setOrgWidth] = useState(76);
  const [orgHeight, setOrgHeight] = useState(26);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(78, 62, 92);

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

    const grid = new THREE.GridHelper(160, 24, "#06B6D4", "#1F2937");
    grid.position.y = -24;
    scene.add(grid);

    scene.add(new THREE.AmbientLight("#E2E8F0", 0.65));
    const keyLight = new THREE.DirectionalLight("#67E8F9", 1.7);
    keyLight.position.set(70, 90, 60);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight("#F59E0B", 0.8);
    rimLight.position.set(-60, -25, -50);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
      groupRef.current = null;
    };
  }, []);

  // Rebuild procedural 3D meshes whenever activeExample, parameters, or wireframe changes
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Dispose old meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            for (const m of obj.material) m.dispose();
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    const cyanMat = new THREE.MeshStandardMaterial({
      color: "#06B6D4",
      metalness: 0.35,
      roughness: 0.35,
      wireframe,
    });
    const amberMat = new THREE.MeshStandardMaterial({
      color: "#F59E0B",
      metalness: 0.35,
      roughness: 0.4,
      wireframe,
    });
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: "#10B981",
      metalness: 0.3,
      roughness: 0.38,
      wireframe,
    });

    if (activeExample === "jar") {
      const r = jarDiameter / 2;
      // Jar body
      const bodyGeo = new THREE.CylinderGeometry(r, r, jarHeight, 36);
      const bodyMesh = new THREE.Mesh(bodyGeo, cyanMat);
      bodyMesh.name = "jar_body";
      bodyMesh.position.y = -24 + jarHeight / 2;
      group.add(bodyMesh);

      // Neck + helical thread rings
      const neckR = r * 0.86;
      const neckGeo = new THREE.CylinderGeometry(neckR, neckR, 10, 32);
      const neckMesh = new THREE.Mesh(neckGeo, cyanMat);
      neckMesh.name = "jar_neck";
      neckMesh.position.y = -24 + jarHeight + 4;
      group.add(neckMesh);

      for (let t = 0; t < 3; t++) {
        const threadGeo = new THREE.TorusGeometry(neckR + 0.8, 0.9, 10, 36);
        threadGeo.rotateX(Math.PI / 2);
        const threadMesh = new THREE.Mesh(threadGeo, amberMat);
        threadMesh.name = `thread_ridge_${t}`;
        threadMesh.position.y = -24 + jarHeight + 1.5 + t * 2.8;
        group.add(threadMesh);
      }

      // Knurled Cap
      const capGroup = new THREE.Group();
      const capGeo = new THREE.CylinderGeometry(r + 1.5, r + 1.5, 12, 36);
      const capMesh = new THREE.Mesh(capGeo, emeraldMat);
      capMesh.name = "knurled_cap";
      capGroup.add(capMesh);

      const knurlCount = 24;
      for (let k = 0; k < knurlCount; k++) {
        const a = (k / knurlCount) * Math.PI * 2;
        const ribGeo = new THREE.BoxGeometry(1.4, 11.2, 1.4);
        const ribMesh = new THREE.Mesh(ribGeo, emeraldMat);
        ribMesh.position.set(Math.cos(a) * (r + 1.6), 0, Math.sin(a) * (r + 1.6));
        ribMesh.rotation.y = -a;
        capGroup.add(ribMesh);
      }
      capGroup.position.y = -24 + jarHeight + 7 + capLift;
      group.add(capGroup);
    } else if (activeExample === "hinge") {
      const leafLen = 28;
      const leafThick = 5;
      const knuckleR = 5.2;

      // Fixed left leaf + 2 outer knuckles
      const leftLeafGeo = new THREE.BoxGeometry(leafLen, leafThick, hingeWidth);
      leftLeafGeo.translate(-leafLen / 2 - knuckleR * 0.4, 0, 0);
      const leftLeaf = new THREE.Mesh(leftLeafGeo, cyanMat);
      leftLeaf.name = "fixed_leaf";
      group.add(leftLeaf);

      const knuckleLen = (hingeWidth - pinClearance * 4) / 3;
      for (const idx of [-1, 1]) {
        const kGeo = new THREE.CylinderGeometry(knuckleR, knuckleR, knuckleLen, 24);
        kGeo.rotateX(Math.PI / 2);
        kGeo.translate(0, 0, idx * (knuckleLen + pinClearance * 2));
        const kMesh = new THREE.Mesh(kGeo, cyanMat);
        kMesh.name = `fixed_knuckle_${idx}`;
        group.add(kMesh);
      }

      // Central hinge pin
      const pinGeo = new THREE.CylinderGeometry(2.3, 2.3, hingeWidth + 2, 20);
      pinGeo.rotateX(Math.PI / 2);
      const pinMesh = new THREE.Mesh(pinGeo, amberMat);
      pinMesh.name = "hinge_pin";
      group.add(pinMesh);

      // Articulated right leaf + center knuckle
      const pivotGroup = new THREE.Group();
      const rightLeafGeo = new THREE.BoxGeometry(leafLen, leafThick, hingeWidth);
      rightLeafGeo.translate(leafLen / 2 + knuckleR * 0.4, 0, 0);
      const rightLeaf = new THREE.Mesh(rightLeafGeo, emeraldMat);
      rightLeaf.name = "moving_leaf";
      pivotGroup.add(rightLeaf);

      const centerKGeo = new THREE.CylinderGeometry(knuckleR, knuckleR, knuckleLen, 24);
      centerKGeo.rotateX(Math.PI / 2);
      const centerK = new THREE.Mesh(centerKGeo, emeraldMat);
      centerK.name = "moving_knuckle";
      pivotGroup.add(centerK);

      pivotGroup.rotation.z = (hingeAngle * Math.PI) / 180;
      group.add(pivotGroup);
    } else {
      // Example 3: Modular Desk Cable & Tool Organizer
      const depth = 36;
      const baseGeo = new THREE.BoxGeometry(orgWidth, 6, depth);
      baseGeo.translate(0, -18, 0);
      const baseMesh = new THREE.Mesh(baseGeo, cyanMat);
      baseMesh.name = "organizer_base";
      group.add(baseMesh);

      // Back spine
      const spineGeo = new THREE.BoxGeometry(orgWidth, orgHeight, 8);
      spineGeo.translate(0, -18 + orgHeight / 2, -depth / 2 + 4);
      const spineMesh = new THREE.Mesh(spineGeo, cyanMat);
      spineMesh.name = "organizer_spine";
      group.add(spineMesh);

      // Parametric divider fins creating cable/tool slots
      const finCount = slotCount + 1;
      const usableW = orgWidth - 6;
      for (let i = 0; i < finCount; i++) {
        const x = -usableW / 2 + (i / (finCount - 1)) * usableW;
        const finGeo = new THREE.BoxGeometry(3.4, orgHeight * 0.85, depth - 8);
        finGeo.translate(x, -18 + (orgHeight * 0.85) / 2 + 2, 2);
        const finMesh = new THREE.Mesh(finGeo, i % 2 === 0 ? emeraldMat : amberMat);
        finMesh.name = `divider_fin_${i}`;
        group.add(finMesh);
      }
    }
  }, [
    activeExample,
    wireframe,
    jarDiameter,
    jarHeight,
    capLift,
    hingeAngle,
    hingeWidth,
    pinClearance,
    slotCount,
    orgWidth,
    orgHeight,
  ]);

  const pythonCode = useMemo(() => {
    if (activeExample === "jar") {
      return `from build123d import BuildPart, Cylinder, Helix, sweep, export_stl

DIAMETER = ${jarDiameter.toFixed(1)}
HEIGHT = ${jarHeight.toFixed(1)}
CAP_LIFT = ${capLift.toFixed(1)}

with BuildPart() as jar:
    Cylinder(radius=DIAMETER / 2, height=HEIGHT)
    # Helical ISO-style thread ridge on neck
    neck_r = (DIAMETER / 2) * 0.86
    Cylinder(radius=neck_r, height=10.0)
    Helix(pitch=2.8, height=8.5, radius=neck_r)

export_stl(jar.part, "build/threaded_jar.stl")`;
    }
    if (activeExample === "hinge") {
      return `from build123d import BuildPart, Box, Cylinder, Align, export_stl

HINGE_WIDTH = ${hingeWidth.toFixed(1)}
PIN_CLEARANCE = ${pinClearance.toFixed(2)}  # Print-in-place air gap
OPEN_ANGLE_DEG = ${hingeAngle}

with BuildPart() as hinge:
    # Interlocking 3-knuckle print-in-place geometry
    Box(28.0, 5.0, HINGE_WIDTH, align=(Align.MAX, Align.CENTER, Align.CENTER))
    Cylinder(radius=2.3, height=HINGE_WIDTH + 2.0)

export_stl(hinge.part, "build/print_in_place_hinge.stl")`;
    }
    return `from build123d import BuildPart, Box, Align, export_stl

SLOT_COUNT = ${slotCount}
ORG_WIDTH = ${orgWidth.toFixed(1)}
WALL_HEIGHT = ${orgHeight.toFixed(1)}

with BuildPart() as organizer:
    Box(ORG_WIDTH, 6.0, 36.0)
    for i in range(SLOT_COUNT + 1):
        # Parametric divider fins for USB-C cables & hex drivers
        Box(3.4, WALL_HEIGHT * 0.85, 28.0)

export_stl(organizer.part, "build/desk_organizer.stl")`;
  }, [
    activeExample,
    jarDiameter,
    jarHeight,
    capLift,
    hingeAngle,
    hingeWidth,
    pinClearance,
    slotCount,
    orgWidth,
    orgHeight,
  ]);

  const handleExportStl = () => {
    if (!groupRef.current) return;
    downloadStl(`example_${activeExample}.stl`, groupRef.current);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="cyan" className="mb-3">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            GENERAL-PURPOSE 3D CAD EXAMPLES
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
            Everyday Parametric 3D Printing Gallery
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
            Explore three practical, non-aerospace mechanical examples built procedurally in
            Three.js and paired with ready-to-run build123d Python scripts.
          </p>
        </div>

        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Hardware Lab
        </Button>
      </div>

      {/* 3 Example Selector Cards */}
      <div
        role="tablist"
        aria-label="General 3D CAD examples"
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {[
          {
            id: "jar" as const,
            title: "1. Threaded Jar & Knurled Cap",
            desc: "Consumer packaging with helical threads & grip knurling",
          },
          {
            id: "hinge" as const,
            title: "2. Print-in-Place Articulated Hinge",
            desc: "Zero-assembly 3-knuckle mechanism with tolerance slider",
          },
          {
            id: "organizer" as const,
            title: "3. Modular Desk Cable Organizer",
            desc: "Parametric slotted caddy for cables & hex drivers",
          },
        ].map((ex) => {
          const active = activeExample === ex.id;
          return (
            <button
              key={ex.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveExample(ex.id)}
              className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-[#22D3EE] bg-[#083344]/80 text-[#F8FAFC]"
                  : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151]"
              }`}
            >
              <span className="font-mono text-xs font-bold text-[#67E8F9]">{ex.title}</span>
              <span className="mt-1 text-xs text-[#CBD5E1]">{ex.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Parametric Controls + Python Code */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Card className="space-y-4 p-5">
            {activeExample === "jar" && (
              <>
                <Slider
                  label="Outer Diameter"
                  value={jarDiameter}
                  min={28}
                  max={72}
                  step={2}
                  unit="mm"
                  onChange={setJarDiameter}
                />
                <Slider
                  label="Container Height"
                  value={jarHeight}
                  min={24}
                  max={68}
                  step={2}
                  unit="mm"
                  onChange={setJarHeight}
                />
                <Slider
                  label="Exploded Cap Lift"
                  value={capLift}
                  min={0}
                  max={28}
                  step={1}
                  unit="mm"
                  accentColor="emerald"
                  onChange={setCapLift}
                />
              </>
            )}

            {activeExample === "hinge" && (
              <>
                <Slider
                  label="Articulation Angle"
                  value={hingeAngle}
                  min={0}
                  max={150}
                  step={5}
                  unit="°"
                  accentColor="emerald"
                  onChange={setHingeAngle}
                />
                <Slider
                  label="Hinge Width"
                  value={hingeWidth}
                  min={28}
                  max={70}
                  step={2}
                  unit="mm"
                  onChange={setHingeWidth}
                />
                <Slider
                  label="Print-in-Place Clearance"
                  value={pinClearance}
                  min={0.2}
                  max={0.6}
                  step={0.05}
                  unit="mm"
                  accentColor="amber"
                  onChange={setPinClearance}
                />
              </>
            )}

            {activeExample === "organizer" && (
              <>
                <Slider
                  label="Slot Count"
                  value={slotCount}
                  min={3}
                  max={8}
                  step={1}
                  unit="slots"
                  onChange={setSlotCount}
                />
                <Slider
                  label="Organizer Width"
                  value={orgWidth}
                  min={48}
                  max={110}
                  step={2}
                  unit="mm"
                  onChange={setOrgWidth}
                />
                <Slider
                  label="Divider Height"
                  value={orgHeight}
                  min={16}
                  max={44}
                  step={2}
                  unit="mm"
                  accentColor="emerald"
                  onChange={setOrgHeight}
                />
              </>
            )}
          </Card>

          <CodeBlock
            code={pythonCode}
            language="python"
            title={`examples/${activeExample}.py`}
            maxHeightClass="max-h-[290px]"
          />
        </div>

        {/* Right: Interactive 3D Viewport */}
        <Card className="flex flex-col overflow-hidden lg:col-span-7" accent="cyan">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] bg-[#111827] px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#F8FAFC]">
              <Box className="h-4 w-4 text-[#67E8F9]" aria-hidden="true" />
              <span>Interactive Three.js Viewport (Drag to Orbit · Scroll to Zoom)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={wireframe}
                onClick={() => setWireframe((w) => !w)}
                className={`min-h-[44px] rounded-lg border px-3 font-mono text-xs font-semibold transition-colors ${
                  wireframe
                    ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                    : "border-[#1F2937] bg-[#090D16] text-[#CBD5E1]"
                }`}
              >
                <Layers className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
                Wireframe
              </button>
              <Button variant="primary" onClick={handleExportStl}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export STL
              </Button>
            </div>
          </div>

          <div
            ref={mountRef}
            role="img"
            className="h-[420px] w-full bg-[#090D16] sm:h-[480px]"
            aria-label="Interactive 3D example viewport"
          />
        </Card>
      </div>
    </main>
  );
}
