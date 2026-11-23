import { Activity, AlertTriangle, CheckCircle2, Flame, Gauge, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Badge } from "@/design-system/Badge";
import { Card } from "@/design-system/Card";
import { Slider } from "@/design-system/Slider";
import { useTranslation } from "@/i18n/I18nContext";
import { computeFeaMetrics, createBracketGeometry, FEA_MATERIALS } from "@/utils/cadGeometry";

type SandboxMode = "kinematics" | "fea";

export function PhysicsFeaSandbox() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<SandboxMode>("kinematics");

  // Mode A state (MuJoCo / Genesis Kinematics)
  const [torque, setTorque] = useState(2.8);
  const [friction, setFriction] = useState(0.08);
  const [payloadMass, setPayloadMass] = useState(2.5);

  const gearCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics telemetry derived from sliders
  const targetRpm = 120;
  const loadDrag = payloadMass * 0.14 + friction * 18;
  const effectiveOmega = Math.max(0.4, (torque * 5.2) / (1 + loadDrag * 0.28));
  const outputRpm = Number(((effectiveOmega * 60) / (2 * Math.PI)).toFixed(2));
  const ratioError = Math.abs(outputRpm - targetRpm * 0.25);
  const backlashRad = Number((0.004 + friction * 0.04 + payloadMass * 0.0018).toFixed(4));
  const pytestPasses = ratioError < 18 && backlashRad < 0.032;

  // Mode B state (CalculiX FEA)
  const [loadN, setLoadN] = useState(180);
  const [exaggerated, setExaggerated] = useState(true);
  const feaMountRef = useRef<HTMLDivElement | null>(null);
  const feaMeshRef = useRef<THREE.Mesh | null>(null);

  const feaMetrics = useMemo(() => computeFeaMetrics(loadN), [loadN]);

  // Mode A: Planetary Gear + Live Scrolling Telemetry Canvas loop
  useEffect(() => {
    if (mode !== "kinematics") return;

    const gearCanvas = gearCanvasRef.current;
    const chartCanvas = chartCanvasRef.current;
    if (!gearCanvas || !chartCanvas) return;

    const gCtx = gearCanvas.getContext("2d");
    const cCtx = chartCanvas.getContext("2d");
    if (!gCtx || !cCtx) return;

    let sunAngle = 0;
    let frameId = 0;
    let tick = 0;
    const velHistory: number[] = Array.from({ length: 80 }, () => effectiveOmega);
    const errHistory: number[] = Array.from({ length: 80 }, () => backlashRad * 100);

    const drawGearWheel = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number,
      teeth: number,
      angle: number,
      stroke: string,
      fill: string,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = a0 + (0.45 / teeth) * Math.PI * 2;
        const rOut = r + 5;
        const rIn = r - 3;
        if (i === 0) ctx.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
        else ctx.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
        ctx.lineTo(Math.cos(a0 + 0.04) * rOut, Math.sin(a0 + 0.04) * rOut);
        ctx.lineTo(Math.cos(a1) * rOut, Math.sin(a1) * rOut);
        ctx.lineTo(Math.cos(a1 + 0.04) * rIn, Math.sin(a1 + 0.04) * rIn);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = stroke;
      ctx.stroke();

      // Center bore
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#090D16";
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      tick += 0.05;
      sunAngle += effectiveOmega * 0.015;
      const carrierAngle = sunAngle * 0.25;
      const planetSpin = -sunAngle * 0.75;

      // 1. Draw Planetary Gearset
      const gw = gearCanvas.width;
      const gh = gearCanvas.height;
      gCtx.clearRect(0, 0, gw, gh);

      const cx = gw / 2;
      const cy = gh / 2;
      const ringR = 110;
      const sunR = 36;
      const planetR = 34;
      const orbitR = sunR + planetR;

      // Outer ring gear
      gCtx.save();
      gCtx.beginPath();
      gCtx.arc(cx, cy, ringR, 0, Math.PI * 2);
      gCtx.strokeStyle = "#374151";
      gCtx.lineWidth = 10;
      gCtx.stroke();
      gCtx.beginPath();
      gCtx.arc(cx, cy, ringR - 8, 0, Math.PI * 2);
      gCtx.strokeStyle = "#22D3EE";
      gCtx.setLineDash([5, 5]);
      gCtx.lineWidth = 2;
      gCtx.stroke();
      gCtx.restore();

      // Sun gear
      drawGearWheel(gCtx, cx, cy, sunR, 14, sunAngle, "#22D3EE", "rgba(6, 182, 212, 0.2)");

      // 3 Planet gears
      for (let i = 0; i < 3; i++) {
        const a = carrierAngle + (i * Math.PI * 2) / 3;
        const px = cx + Math.cos(a) * orbitR;
        const py = cy + Math.sin(a) * orbitR;
        drawGearWheel(gCtx, px, py, planetR, 12, planetSpin, "#FBBF24", "rgba(245, 158, 11, 0.18)");
      }

      // 2. Update & Draw Live Scrolling Telemetry Chart
      const noise = Math.sin(tick * 2.3) * 0.12 + Math.cos(tick * 4.1) * 0.06;
      velHistory.push(Math.max(0, effectiveOmega + noise));
      velHistory.shift();

      errHistory.push(Math.max(0.1, backlashRad * 100 + Math.sin(tick * 3.1) * 0.15));
      errHistory.shift();

      const cw = chartCanvas.width;
      const ch = chartCanvas.height;
      cCtx.clearRect(0, 0, cw, ch);

      // Grid lines
      cCtx.strokeStyle = "#1F2937";
      cCtx.lineWidth = 1;
      for (let y = 24; y < ch; y += 36) {
        cCtx.beginPath();
        cCtx.moveTo(0, y);
        cCtx.lineTo(cw, y);
        cCtx.stroke();
      }

      // Plot Angular Velocity (Cyan)
      cCtx.beginPath();
      cCtx.strokeStyle = "#22D3EE";
      cCtx.lineWidth = 2;
      velHistory.forEach((v, idx) => {
        const x = (idx / (velHistory.length - 1)) * cw;
        const y = ch - 16 - Math.min(ch - 32, (v / 14) * (ch - 36));
        if (idx === 0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
      });
      cCtx.stroke();

      // Plot Backlash Error (Amber)
      cCtx.beginPath();
      cCtx.strokeStyle = "#FBBF24";
      cCtx.lineWidth = 2;
      errHistory.forEach((v, idx) => {
        const x = (idx / (errHistory.length - 1)) * cw;
        const y = ch - 16 - Math.min(ch - 32, (v / 6) * (ch - 36));
        if (idx === 0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
      });
      cCtx.stroke();

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frameId);
  }, [mode, effectiveOmega, backlashRad]);

  // Latest FEA inputs, read once when the scene is (re)built; live updates happen in the effect below.
  const feaInputsRef = useRef({ loadN, exaggerated });
  feaInputsRef.current = { loadN, exaggerated };

  // Mode B: Three.js FEA Bracket Scene
  useEffect(() => {
    if (mode !== "fea") return;
    const container = feaMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16");

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(58, 36, 78);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.GridHelper(120, 20, "#374151", "#1F2937"));
    scene.add(new THREE.AmbientLight("#FFFFFF", 0.75));
    const dirLight = new THREE.DirectionalLight("#FFFFFF", 1.2);
    dirLight.position.set(40, 60, 40);
    scene.add(dirLight);

    const geo = createBracketGeometry(feaInputsRef.current.loadN, feaInputsRef.current.exaggerated);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    feaMeshRef.current = mesh;

    // Load arrow indicator at tip
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(44, 14, 0),
      18,
      0xf59e0b,
      5,
      3,
    );
    scene.add(arrow);

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
      mesh.geometry.dispose();
      mat.dispose();
      arrow.dispose();
      renderer.dispose();
      container.innerHTML = "";
      feaMeshRef.current = null;
    };
  }, [mode]);

  // Update FEA mesh colors & deflection when loadN or exaggerated changes
  useEffect(() => {
    const mesh = feaMeshRef.current;
    if (!mesh || mode !== "fea") return;
    const nextGeo = createBracketGeometry(loadN, exaggerated);
    mesh.geometry.dispose();
    mesh.geometry = nextGeo;
  }, [loadN, exaggerated, mode]);

  return (
    <section id="physics-fea" className="border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
              {t.physics.sectionTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
              {t.physics.sectionDesc}
            </p>
          </div>

          {/* Mode Toggle */}
          <div
            role="tablist"
            aria-label="Physics and FEA simulation modes"
            className="flex flex-wrap gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "kinematics"}
              onClick={() => setMode("kinematics")}
              className={`min-h-[44px] rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-colors ${
                mode === "kinematics"
                  ? "bg-[#22D3EE] text-[#090D16]"
                  : "text-[#CBD5E1] hover:bg-[#1F2937]"
              }`}
            >
              {t.physics.modeKinematics}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "fea"}
              onClick={() => setMode("fea")}
              className={`min-h-[44px] rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-colors ${
                mode === "fea" ? "bg-[#FBBF24] text-[#090D16]" : "text-[#CBD5E1] hover:bg-[#1F2937]"
              }`}
            >
              {t.physics.modeFea}
            </button>
          </div>
        </div>

        {mode === "kinematics" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="space-y-5 p-5 lg:col-span-4">
              <Slider
                label={t.physics.motorTorque}
                value={torque}
                min={0.5}
                max={8.0}
                step={0.1}
                unit="N·m"
                accentColor="cyan"
                onChange={setTorque}
              />
              <Slider
                label={t.physics.frictionCoeff}
                value={friction}
                min={0.02}
                max={0.35}
                step={0.01}
                unit="μ"
                accentColor="amber"
                onChange={setFriction}
              />
              <Slider
                label={t.physics.payloadMass}
                value={payloadMass}
                min={0.5}
                max={10.0}
                step={0.5}
                unit="kg"
                accentColor="amber"
                onChange={setPayloadMass}
              />

              <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-4 font-mono text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[#CBD5E1]">{t.physics.pytestTitle}</span>
                  <Badge tone={pytestPasses ? "emerald" : "red"}>
                    {pytestPasses ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {pytestPasses ? t.physics.statusPass : "FAIL"}
                  </Badge>
                </div>
                <code className="block whitespace-pre-wrap text-[#67E8F9]">
                  {`assert abs(output_rpm - target_rpm * 0.25) < 0.02\n# measured: ${outputRpm} RPM | backlash: ${backlashRad} rad`}
                </code>
              </div>
            </Card>

            <Card className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:col-span-8" accent="cyan">
              <div className="flex flex-col items-center justify-center rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                <span className="mb-2 font-mono text-xs text-[#67E8F9]">
                  MuJoCo Planetary Carrier (4:1 Reduction)
                </span>
                <canvas
                  ref={gearCanvasRef}
                  width={280}
                  height={260}
                  className="max-w-full"
                  aria-label="Real-time meshing planetary gear animation"
                />
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-[#1F2937] bg-[#090D16] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-[#67E8F9]">
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.physics.angularVelocity}: {effectiveOmega.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs text-[#FDE68A]">
                    {t.physics.backlashError}: {backlashRad}
                  </span>
                </div>
                <canvas
                  ref={chartCanvasRef}
                  width={340}
                  height={190}
                  className="my-3 w-full rounded border border-[#1F2937]"
                  aria-label="Live telemetry plot of angular velocity and backlash error"
                />
                <div className="flex items-center justify-between font-mono text-[11px] text-[#94A3B8]">
                  <span>t - 4.0s</span>
                  <span>headless mj_step() @ 500 Hz</span>
                  <span>now</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="space-y-5 p-5 lg:col-span-4" accent="amber">
              <Slider
                label={t.physics.downwardLoad}
                value={loadN}
                min={10}
                max={500}
                step={10}
                unit="N"
                accentColor="amber"
                onChange={setLoadN}
              />

              <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-lg border border-[#1F2937] bg-[#090D16] px-3 py-2">
                <span className="text-sm font-medium text-[#E2E8F0]">
                  {t.physics.exaggeratedDeform}
                </span>
                <input
                  type="checkbox"
                  checked={exaggerated}
                  onChange={(e) => setExaggerated(e.target.checked)}
                  className="h-5 w-5 accent-[#FBBF24]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#94A3B8]">
                    <Flame className="h-3.5 w-3.5 text-[#FBBF24]" aria-hidden="true" />
                    {t.physics.peakStress}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-[#FDE68A]">
                    {feaMetrics.peakStressMpa} MPa
                  </div>
                </div>
                <div className="rounded-lg border border-[#1F2937] bg-[#090D16] p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#94A3B8]">
                    <Gauge className="h-3.5 w-3.5 text-[#67E8F9]" aria-hidden="true" />
                    {t.physics.maxDeflection}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-[#67E8F9]">
                    {feaMetrics.maxDeflectionMm} mm
                  </div>
                </div>
              </div>

              {/* Material Yield Comparison */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  <ShieldCheck className="h-4 w-4 text-[#6EE7B7]" aria-hidden="true" />
                  {t.physics.materialComparison}
                </h3>
                <div className="space-y-2">
                  {FEA_MATERIALS.map((mat) => {
                    const sf = Number((mat.yieldMpa / feaMetrics.peakStressMpa).toFixed(2));
                    const tone = sf >= 1.8 ? "emerald" : sf >= 1.1 ? "amber" : "red";
                    const statusText =
                      sf >= 1.8
                        ? t.physics.statusPass
                        : sf >= 1.1
                          ? t.physics.statusCaution
                          : t.physics.statusFail;
                    return (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between rounded-lg border border-[#1F2937] bg-[#090D16] px-3 py-2 font-mono text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#F8FAFC]">{mat.id}</span>
                          <span className="ml-2 text-[#94A3B8]">
                            ({t.physics.yieldStrength}: {mat.yieldMpa} MPa)
                          </span>
                        </div>
                        <Badge tone={tone}>
                          SF {sf}x · {statusText}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="flex flex-col overflow-hidden lg:col-span-8" accent="amber">
              <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#111827] px-4 py-3 font-mono text-xs">
                <span className="font-semibold text-[#F8FAFC]">
                  CalculiX (ccx) von Mises Stress Heatmap (MPa)
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[#CBD5E1]">
                  <span>0 MPa</span>
                  <div
                    className="h-2.5 w-28 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #0D40F2 0%, #0DD9F2 28%, #33D933 55%, #FACC15 78%, #EF4444 100%)",
                    }}
                  />
                  <span>72+ MPa</span>
                </div>
              </div>
              <div
                ref={feaMountRef}
                role="img"
                className="h-[360px] w-full bg-[#090D16]"
                aria-label="3D FEA von Mises stress heatmap viewport"
              />
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
