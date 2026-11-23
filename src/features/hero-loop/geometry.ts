/**
 * Pure 2D path geometry for the hero loop diagram.
 *
 * Paths are described once as data (lines / cubic Béziers) and turned into both an SVG `d`
 * string and an arc-length lookup table, so the animated packet moves at constant visual speed
 * along exactly the curve that is drawn — no DOM measuring (getPointAtLength) required.
 */

export interface Point {
  x: number;
  y: number;
}

export type PathGeometry =
  | { kind: "line"; from: Point; to: Point }
  | { kind: "cubic"; p0: Point; p1: Point; p2: Point; p3: Point };

export interface SampledPath {
  geometry: PathGeometry;
  d: string;
  length: number;
  /** Cumulative arc length at each of the evenly spaced parameter samples (length === samples + 1). */
  lut: number[];
  /** Point at a fraction (0..1) of the path's *arc length*. */
  pointAt: (fraction: number) => Point;
}

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Smooth acceleration and deceleration — the default motion curve for packet travel. */
export const easeInOutCubic = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/** Hermite smoothstep between two edges (edge0 may be greater than edge1 for a falling ramp). */
export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const round = (n: number): number => Math.round(n * 100) / 100;

export function pathToD(geometry: PathGeometry): string {
  if (geometry.kind === "line") {
    const { from, to } = geometry;
    return `M ${round(from.x)} ${round(from.y)} L ${round(to.x)} ${round(to.y)}`;
  }
  const { p0, p1, p2, p3 } = geometry;
  return `M ${round(p0.x)} ${round(p0.y)} C ${round(p1.x)} ${round(p1.y)}, ${round(p2.x)} ${round(
    p2.y,
  )}, ${round(p3.x)} ${round(p3.y)}`;
}

/** Evaluates the path at its raw curve parameter t (not arc-length). */
export function evaluatePath(geometry: PathGeometry, t: number): Point {
  const u = clamp(t);
  if (geometry.kind === "line") {
    return {
      x: lerp(geometry.from.x, geometry.to.x, u),
      y: lerp(geometry.from.y, geometry.to.y, u),
    };
  }
  const { p0, p1, p2, p3 } = geometry;
  const mt = 1 - u;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * u;
  const c = 3 * mt * u * u;
  const d = u * u * u;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

export function samplePath(geometry: PathGeometry, samples = 96): SampledPath {
  const steps = Math.max(1, Math.floor(samples));
  const lut: number[] = [0];
  let previous = evaluatePath(geometry, 0);
  let total = 0;
  for (let i = 1; i <= steps; i++) {
    const point = evaluatePath(geometry, i / steps);
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    lut.push(total);
    previous = point;
  }

  const pointAt = (fraction: number): Point => {
    if (total === 0) return evaluatePath(geometry, 0);
    const target = clamp(fraction) * total;
    // Binary search the first LUT entry >= target, then interpolate inside that sample span.
    let lo = 0;
    let hi = steps;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lut[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) return evaluatePath(geometry, 0);
    const spanStart = lut[lo - 1];
    const spanLength = lut[lo] - spanStart;
    const local = spanLength === 0 ? 0 : (target - spanStart) / spanLength;
    return evaluatePath(geometry, (lo - 1 + local) / steps);
  };

  return { geometry, d: pathToD(geometry), length: total, lut, pointAt };
}
