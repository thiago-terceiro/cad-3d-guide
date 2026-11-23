import {
  computeFeaMetrics,
  computeGearMetrics,
  computeSlicerTelemetry,
  createBracketGeometry,
  createSpurGearGeometry,
  geometryToAsciiStl,
  stressToColor,
} from "@/utils/cadGeometry";
import { describe, expect, it } from "vitest";

describe("cadGeometry domain math", () => {
  it("computes accurate spur gear pitch, outer diameter, volume, and watertight status", () => {
    const metrics = computeGearMetrics({
      toothCount: 24,
      boreDiameter: 8,
      wallThickness: 10,
      filletRadius: 0.8,
    });

    expect(metrics.pitchDiameterMm).toBe(38.4);
    expect(metrics.outerDiameterMm).toBe(41.6);
    expect(metrics.volumeCm3).toBeGreaterThan(10);
    expect(metrics.watertight).toBe(true);
    expect(metrics.centerOfMass).toEqual([0, 0, 5]);
  });

  it("generates procedural spur gear Three.js geometry and valid ASCII STL", () => {
    const geo = createSpurGearGeometry({
      toothCount: 20,
      boreDiameter: 6,
      wallThickness: 8,
      filletRadius: 0.5,
    });
    expect(geo.attributes.position.count).toBeGreaterThan(100);

    const stl = geometryToAsciiStl(geo, "test_gear");
    expect(stl.startsWith("solid test_gear")).toBe(true);
    expect(stl.includes("facet normal")).toBe(true);
    expect(stl.endsWith("endsolid test_gear")).toBe(true);
    geo.dispose();
  });

  it("computes FEA stress, deflection, and bracket vertex colors", () => {
    const fea = computeFeaMetrics(200);
    expect(fea.peakStressMpa).toBe(29);
    expect(fea.maxDeflectionMm).toBe(0.84);

    const cLow = stressToColor(0);
    const cHigh = stressToColor(1);
    expect(cLow.b).toBeGreaterThan(0.8);
    expect(cHigh.r).toBeGreaterThan(0.9);

    const bracket = createBracketGeometry(200, true);
    expect(bracket.attributes.color).toBeDefined();
    expect(bracket.attributes.position.count).toBeGreaterThan(100);
    bracket.dispose();
  });

  it("computes slicer telemetry with overhang defects in mid-layers", () => {
    const mid = computeSlicerTelemetry(135, true);
    expect(mid.zHeightMm).toBe(27);
    expect(mid.overhangDefects).toBe(3);

    const clean = computeSlicerTelemetry(135, false);
    expect(clean.overhangDefects).toBe(0);
  });
});
