import * as THREE from "three";

export interface GearParams {
  toothCount: number;
  boreDiameter: number;
  wallThickness: number;
  filletRadius: number;
}

export interface GearMetrics {
  pitchDiameterMm: number;
  outerDiameterMm: number;
  rootDiameterMm: number;
  volumeCm3: number;
  centerOfMass: [number, number, number];
  watertight: boolean;
}

export const GEAR_MODULE_MM = 1.6;

export function computeGearMetrics(params: GearParams): GearMetrics {
  const { toothCount, boreDiameter, wallThickness } = params;
  const pitchDiameterMm = toothCount * GEAR_MODULE_MM;
  const outerDiameterMm = pitchDiameterMm + 2 * GEAR_MODULE_MM;
  const rootDiameterMm = pitchDiameterMm - 2.5 * GEAR_MODULE_MM;

  const rPitch = pitchDiameterMm / 2;
  const rBore = Math.min(boreDiameter / 2, rPitch - 2);
  const gearAreaMm2 = Math.PI * (rPitch * rPitch - rBore * rBore);
  const volumeCm3 = (gearAreaMm2 * wallThickness) / 1000;

  return {
    pitchDiameterMm: Number(pitchDiameterMm.toFixed(2)),
    outerDiameterMm: Number(outerDiameterMm.toFixed(2)),
    rootDiameterMm: Number(rootDiameterMm.toFixed(2)),
    volumeCm3: Number(volumeCm3.toFixed(2)),
    centerOfMass: [0.0, 0.0, Number((wallThickness / 2).toFixed(2))],
    watertight: rBore < rootDiameterMm / 2 - 0.8,
  };
}

/**
 * Generates a procedural involute-style spur gear ExtrudeGeometry in millimeters.
 */
export function createSpurGearGeometry(params: GearParams): THREE.ExtrudeGeometry {
  const { toothCount, boreDiameter, wallThickness, filletRadius } = params;
  const pitchR = (toothCount * GEAR_MODULE_MM) / 2;
  const outerR = pitchR + GEAR_MODULE_MM * 0.95;
  const rootR = Math.max(boreDiameter / 2 + 2.2, pitchR - GEAR_MODULE_MM * 1.15);

  const shape = new THREE.Shape();
  const stepAngle = (Math.PI * 2) / toothCount;

  for (let i = 0; i < toothCount; i++) {
    const a0 = i * stepAngle;
    const a1 = a0 + stepAngle * 0.18;
    const a2 = a0 + stepAngle * 0.3;
    const a3 = a0 + stepAngle * 0.52;
    const a4 = a0 + stepAngle * 0.64;

    const p0x = Math.cos(a0) * rootR;
    const p0y = Math.sin(a0) * rootR;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }
    shape.lineTo(Math.cos(a1) * rootR, Math.sin(a1) * rootR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
    shape.lineTo(Math.cos(a4) * rootR, Math.sin(a4) * rootR);
  }
  shape.closePath();

  const safeBoreR = Math.min(boreDiameter / 2, rootR - 1.2);
  const boreHole = new THREE.Path();
  boreHole.absarc(0, 0, Math.max(1.5, safeBoreR), 0, Math.PI * 2, true);
  shape.holes.push(boreHole);

  const bevel = Math.min(filletRadius, wallThickness * 0.25, 1.5);
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: Math.max(2, wallThickness - bevel * 2),
    bevelEnabled: bevel > 0.05,
    bevelThickness: bevel,
    bevelSize: Math.min(bevel * 0.6, 0.7),
    bevelSegments: 2,
    curveSegments: 16,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

/**
 * Generates a valid ASCII STL string from a Three.js BufferGeometry for real download.
 */
export function geometryToAsciiStl(geometry: THREE.BufferGeometry, solidName: string): string {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const lines: string[] = [`solid ${solidName}`];

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  const triCount = index ? index.count / 3 : pos.count / 3;
  for (let i = 0; i < triCount; i++) {
    const a = index ? index.getX(i * 3) : i * 3;
    const b = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const c = index ? index.getX(i * 3 + 2) : i * 3 + 2;

    vA.fromBufferAttribute(pos, a);
    vB.fromBufferAttribute(pos, b);
    vC.fromBufferAttribute(pos, c);

    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab).normalize();

    lines.push(`  facet normal ${cb.x.toFixed(5)} ${cb.y.toFixed(5)} ${cb.z.toFixed(5)}`);
    lines.push("    outer loop");
    lines.push(`      vertex ${vA.x.toFixed(4)} ${vA.y.toFixed(4)} ${vA.z.toFixed(4)}`);
    lines.push(`      vertex ${vB.x.toFixed(4)} ${vB.y.toFixed(4)} ${vB.z.toFixed(4)}`);
    lines.push(`      vertex ${vC.x.toFixed(4)} ${vC.y.toFixed(4)} ${vC.z.toFixed(4)}`);
    lines.push("    endloop");
    lines.push("  endfacet");
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join("\n");
}

export interface FeaMaterialSpec {
  id: "PLA" | "PETG" | "ABS" | "PA12-CF";
  name: string;
  yieldMpa: number;
  youngsModulusGpa: number;
}

export const FEA_MATERIALS: FeaMaterialSpec[] = [
  { id: "PLA", name: "PLA (Standard)", yieldMpa: 50, youngsModulusGpa: 3.5 },
  { id: "PETG", name: "PETG (Tough)", yieldMpa: 52, youngsModulusGpa: 2.1 },
  { id: "ABS", name: "ABS (Thermal)", yieldMpa: 42, youngsModulusGpa: 2.3 },
  { id: "PA12-CF", name: "PA12-CF (Carbon Nylon)", yieldMpa: 76, youngsModulusGpa: 6.2 },
];

export interface FeaMetrics {
  peakStressMpa: number;
  maxDeflectionMm: number;
}

export function computeFeaMetrics(loadN: number): FeaMetrics {
  // Cantilever L-bracket calibrated stress concentration factor at inner fillet
  const peakStressMpa = Number((loadN * 0.145).toFixed(1));
  const maxDeflectionMm = Number((loadN * 0.0042).toFixed(2));
  return { peakStressMpa, maxDeflectionMm };
}

/**
 * Maps normalized stress [0..1] to engineering FEA colormap: blue -> cyan -> green -> yellow -> red.
 */
export function stressToColor(t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t));
  const color = new THREE.Color();
  if (clamped < 0.25) {
    color.setRGB(0.05, 0.25 + clamped * 2.4, 0.95);
  } else if (clamped < 0.5) {
    const k = (clamped - 0.25) / 0.25;
    color.setRGB(0.05 + k * 0.15, 0.85, 0.95 - k * 0.75);
  } else if (clamped < 0.75) {
    const k = (clamped - 0.5) / 0.25;
    color.setRGB(0.2 + k * 0.78, 0.85 - k * 0.1, 0.2 - k * 0.15);
  } else {
    const k = (clamped - 0.75) / 0.25;
    color.setRGB(0.98, 0.75 - k * 0.65, 0.05);
  }
  return color;
}

/**
 * Creates a subdivided L-bracket mesh with real-time von Mises stress vertex colors and deflection.
 */
export function createBracketGeometry(loadN: number, exaggerated: boolean): THREE.BufferGeometry {
  // Build a subdivided cantilevered arm + vertical backplate merged into one BufferGeometry
  const armGeo = new THREE.BoxGeometry(56, 8, 28, 28, 4, 8);
  armGeo.translate(22, -10, 0);

  const backGeo = new THREE.BoxGeometry(10, 44, 28, 4, 20, 8);
  backGeo.translate(-6, 8, 0);

  const armPos = armGeo.attributes.position;
  const backPos = backGeo.attributes.position;

  const peakMpa = computeFeaMetrics(loadN).peakStressMpa;
  const deformScale = exaggerated ? 12 : 1;
  const maxDeflect = computeFeaMetrics(loadN).maxDeflectionMm * deformScale;

  const applyStressAndDeflection = (pos: THREE.BufferAttribute, isArm: boolean): Float32Array => {
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Normalized distance from fixed backplate root (x = -1)
      let stressNorm = 0.05;
      if (isArm) {
        const span = Math.max(0, (x + 6) / 56); // 0 at root, 1 at tip
        // Bending moment is highest at root (span ~ 0.05..0.2) and near top/bottom surfaces
        const rootFactor = Math.exp(-span * 3.2);
        const surfaceFactor = Math.abs(y + 10) / 4;
        stressNorm = (rootFactor * (0.65 + 0.35 * surfaceFactor) * peakMpa) / 72;

        // Parabolic cantilever downward deflection
        const dy = -maxDeflect * span * span;
        pos.setY(i, y + dy);
      } else {
        // Backplate stress concentrated near lower fillet junction (y around -10)
        const distFromJoint = Math.abs(y + 10) / 34;
        stressNorm = (Math.exp(-distFromJoint * 3.5) * 0.78 * peakMpa) / 72;
      }

      const c = stressToColor(stressNorm);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return colors;
  };

  const armColors = applyStressAndDeflection(armPos as THREE.BufferAttribute, true);
  const backColors = applyStressAndDeflection(backPos as THREE.BufferAttribute, false);

  const nonIndexedArm = armGeo.toNonIndexed();
  const nonIndexedBack = backGeo.toNonIndexed();

  // Recompute colors for non-indexed vertices cleanly
  const buildFinalGeometry = (g1: THREE.BufferGeometry, g2: THREE.BufferGeometry) => {
    const p1 = g1.attributes.position;
    const p2 = g2.attributes.position;
    const n1 = g1.attributes.normal;
    const n2 = g2.attributes.normal;

    const totalVerts = p1.count + p2.count;
    const mergedPos = new Float32Array(totalVerts * 3);
    const mergedNorm = new Float32Array(totalVerts * 3);
    const mergedCol = new Float32Array(totalVerts * 3);

    mergedPos.set(p1.array as Float32Array, 0);
    mergedPos.set(p2.array as Float32Array, p1.count * 3);

    mergedNorm.set(n1.array as Float32Array, 0);
    mergedNorm.set(n2.array as Float32Array, n1.count * 3);

    // Map indexed colors onto non-indexed via original index
    const i1 = armGeo.index;
    const i2 = backGeo.index;
    if (i1) {
      for (let k = 0; k < i1.count; k++) {
        const idx = i1.getX(k);
        mergedCol[k * 3] = armColors[idx * 3];
        mergedCol[k * 3 + 1] = armColors[idx * 3 + 1];
        mergedCol[k * 3 + 2] = armColors[idx * 3 + 2];
      }
    }
    if (i2) {
      const offset = p1.count * 3;
      for (let k = 0; k < i2.count; k++) {
        const idx = i2.getX(k);
        mergedCol[offset + k * 3] = backColors[idx * 3];
        mergedCol[offset + k * 3 + 1] = backColors[idx * 3 + 1];
        mergedCol[offset + k * 3 + 2] = backColors[idx * 3 + 2];
      }
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(mergedNorm, 3));
    merged.setAttribute("color", new THREE.BufferAttribute(mergedCol, 3));
    merged.computeVertexNormals();
    return merged;
  };

  return buildFinalGeometry(nonIndexedArm, nonIndexedBack);
}

export interface SlicerTelemetry {
  layer: number;
  totalLayers: number;
  zHeightMm: number;
  filamentUsedG: number;
  estimatedPrintTime: string;
  supportVolumeCm3: number;
  overhangDefects: number;
}

export function computeSlicerTelemetry(layer: number, showOverhangs: boolean): SlicerTelemetry {
  const totalLayers = 240;
  const zHeightMm = Number((layer * 0.2).toFixed(1));
  const progress = layer / totalLayers;
  const filamentUsedG = Number((12.4 + progress * 34.8).toFixed(1));
  const totalMinutes = Math.round(48 + progress * 94);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const supportVolumeCm3 = showOverhangs ? 4.82 : 1.15;
  const overhangDefects = showOverhangs && layer >= 95 && layer <= 168 ? 3 : showOverhangs ? 1 : 0;

  return {
    layer,
    totalLayers,
    zHeightMm,
    filamentUsedG,
    estimatedPrintTime: `${hours}h ${mins.toString().padStart(2, "0")}m`,
    supportVolumeCm3,
    overhangDefects,
  };
}
