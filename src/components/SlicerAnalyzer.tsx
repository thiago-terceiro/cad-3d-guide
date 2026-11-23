import { Badge } from "@/design-system/Badge";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Slider } from "@/design-system/Slider";
import { useTranslation } from "@/i18n/I18nContext";
import { computeSlicerTelemetry } from "@/utils/cadGeometry";
import { AlertTriangle, Layers, Printer, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function SlicerAnalyzer() {
  const { t } = useTranslation();
  const [layer, setLayer] = useState(135);
  const [showOverhangs, setShowOverhangs] = useState(true);

  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 10));
  const sliceRingRef = useRef<THREE.Mesh | null>(null);
  const overhangMeshRef = useRef<THREE.Mesh | null>(null);
  const infillCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const telemetry = useMemo(
    () => computeSlicerTelemetry(layer, showOverhangs),
    [layer, showOverhangs],
  );

  const cliOutput = useMemo(() => {
    return `$ prusa-slicer --export-gcode --layer-height 0.2 --fill-density 25% part.stl
[INFO] Slicing mesh: 48.0 mm height (240 layers @ 0.20mm)
[INFO] Infill pattern: gyroid (25% density, 3 perimeters)
${showOverhangs ? "[WARN] Overhang > 45 deg detected at Z=19.0mm..33.6mm (3 regions)" : "[OK] Overhang highlight disabled"}

// Parsed G-Code JSON Telemetry
${JSON.stringify(
  {
    layer: telemetry.layer,
    z_height_mm: telemetry.zHeightMm,
    filament_used_g: telemetry.filamentUsedG,
    estimated_print_time: telemetry.estimatedPrintTime,
    support_volume_cm3: telemetry.supportVolumeCm3,
    overhang_defects: telemetry.overhangDefects,
  },
  null,
  2,
)}`;
  }, [telemetry, showOverhangs]);

  // Setup Three.js horizontally-clipped 3D part
  useEffect(() => {
    const container = threeMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16");

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(48, 38, 56);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.localClippingEnabled = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.GridHelper(90, 18, "#06B6D4", "#1F2937"));
    scene.add(new THREE.AmbientLight("#FFFFFF", 0.7));
    const dir = new THREE.DirectionalLight("#67E8F9", 1.5);
    dir.position.set(40, 60, 40);
    scene.add(dir);

    const clipPlane = clipPlaneRef.current;

    // Tapered flange/bracket housing (total height 48 units, y from 0 to 48)
    const bodyGeo = new THREE.CylinderGeometry(16, 22, 48, 32);
    bodyGeo.translate(0, 24, 0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: "#06B6D4",
      roughness: 0.35,
      metalness: 0.3,
      clippingPlanes: [clipPlane],
      side: THREE.DoubleSide,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    scene.add(bodyMesh);

    // Overhang flange (> 45 deg lip at mid-height)
    const lipGeo = new THREE.ConeGeometry(24, 14, 32);
    lipGeo.rotateX(Math.PI);
    lipGeo.translate(0, 26, 0);
    const lipMat = new THREE.MeshStandardMaterial({
      color: "#EF4444",
      roughness: 0.4,
      clippingPlanes: [clipPlane],
      side: THREE.DoubleSide,
    });
    const lipMesh = new THREE.Mesh(lipGeo, lipMat);
    scene.add(lipMesh);
    overhangMeshRef.current = lipMesh;

    // Glowing active Z-slice plane indicator
    const ringGeo = new THREE.RingGeometry(10, 25, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#34D399",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);
    sliceRingRef.current = ring;

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 260;
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
      bodyGeo.dispose();
      bodyMat.dispose();
      lipGeo.dispose();
      lipMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  // Update Z-clipping plane + overhang visibility + procedural 2D gyroid infill canvas
  useEffect(() => {
    const zPos = (layer / 240) * 48;
    clipPlaneRef.current.constant = zPos;
    if (sliceRingRef.current) {
      sliceRingRef.current.position.y = zPos;
    }
    if (overhangMeshRef.current) {
      overhangMeshRef.current.visible = showOverhangs;
    }

    const canvas = infillCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.max(46, 92 - (layer / 240) * 26);

    // Clip to outer perimeter shell
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.clip();

    // Gyroid sine-wave infill pattern (phase shifts smoothly with Z layer)
    const phase = layer * 0.18;
    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 1.4;
    for (let y = cy - outerR; y <= cy + outerR; y += 11) {
      ctx.beginPath();
      for (let x = cx - outerR; x <= cx + outerR; x += 3) {
        const wave = Math.sin((x - cx) * 0.11 + phase) * 4.5;
        if (x === cx - outerR) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 3 Perimeter shells
    [0, 3.5, 7].forEach((offset, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR - offset, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 0 ? "#34D399" : "#67E8F9";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Overhang >45° warning ring when slicing through the lip region
    if (showOverhangs && layer >= 95 && layer <= 168) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [layer, showOverhangs]);

  return (
    <section id="slicer" className="border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            {t.slicer.sectionTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
            {t.slicer.sectionDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: 3D Sliced Viewport + Layer Scrubber + 2D Gyroid Cross-Section */}
          <Card className="flex flex-col gap-4 p-5 lg:col-span-7" accent="emerald">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#F8FAFC]">
                <Layers className="h-4 w-4 text-[#34D399]" aria-hidden="true" />
                <span>
                  {t.slicer.layerScrubber}: {layer} {t.slicer.layerOf} 240 (Z ={" "}
                  {telemetry.zHeightMm} mm)
                </span>
              </div>

              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#E2E8F0]">
                <input
                  type="checkbox"
                  checked={showOverhangs}
                  onChange={(e) => setShowOverhangs(e.target.checked)}
                  className="h-4 w-4 accent-[#EF4444]"
                />
                {t.slicer.showOverhangs}
              </label>
            </div>

            <Slider
              label={t.slicer.layerScrubber}
              value={layer}
              min={1}
              max={240}
              step={1}
              unit="/ 240"
              accentColor="emerald"
              onChange={setLayer}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                ref={threeMountRef}
                role="img"
                className="h-[260px] w-full overflow-hidden rounded-lg border border-[#1F2937] bg-[#090D16]"
                aria-label="3D horizontally sliced model viewport"
              />
              <div className="flex flex-col items-center justify-between rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <span className="font-mono text-[11px] text-[#CBD5E1]">
                  2D Toolpath Cross-Section (Layer {layer})
                </span>
                <canvas
                  ref={infillCanvasRef}
                  width={210}
                  height={200}
                  aria-label="Procedural gyroid infill and perimeter shell cross section"
                />
                <div className="flex flex-wrap justify-center gap-3 font-mono text-[11px]">
                  <span className="text-[#67E8F9]">● {t.slicer.infillLegend}</span>
                  <span className="text-[#FCA5A5]">● {t.slicer.overhangLegend}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Right: Headless CLI Invocation + JSON Telemetry */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Card className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <div className="font-mono text-[11px] text-[#94A3B8]">{t.slicer.filamentUsed}</div>
                <div className="mt-1 font-mono text-lg font-bold text-[#67E8F9]">
                  {telemetry.filamentUsedG} g
                </div>
              </div>
              <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <div className="font-mono text-[11px] text-[#94A3B8]">{t.slicer.printTime}</div>
                <div className="mt-1 font-mono text-lg font-bold text-[#F8FAFC]">
                  {telemetry.estimatedPrintTime}
                </div>
              </div>
              <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <div className="font-mono text-[11px] text-[#94A3B8]">{t.slicer.supportVolume}</div>
                <div className="mt-1 font-mono text-lg font-bold text-[#FDE68A]">
                  {telemetry.supportVolumeCm3} cm³
                </div>
              </div>
              <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <div className="font-mono text-[11px] text-[#94A3B8]">
                  {t.slicer.overhangDefects}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={telemetry.overhangDefects > 0 ? "red" : "emerald"}>
                    {telemetry.overhangDefects > 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {telemetry.overhangDefects}
                  </Badge>
                </div>
              </div>
            </Card>

            <CodeBlock
              code={cliOutput}
              language="bash"
              title={t.slicer.cliTitle}
              maxHeightClass="max-h-[290px]"
            />
            <div className="flex items-center gap-2 font-mono text-xs text-[#94A3B8]">
              <Terminal className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
              <span>OrcaSlicer / PrusaSlicer headless exit code: 0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
