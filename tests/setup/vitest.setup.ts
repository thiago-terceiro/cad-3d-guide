import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

/**
 * jsdom has no WebGL. Swap three's WebGLRenderer for a lightweight fake so the
 * Three.js scene-graph code (geometry, materials, cameras, controls) still runs
 * for real in component tests, while GPU calls become inspectable no-ops.
 */
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();

  class FakeWebGLRenderer {
    domElement: HTMLCanvasElement;
    localClippingEnabled = false;
    shadowMap = { enabled: false, type: 0 };
    outputColorSpace = "srgb";
    toneMapping = 0;
    toneMappingExposure = 1;
    constructor() {
      this.domElement = document.createElement("canvas");
    }
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    setClearColor = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    setAnimationLoop = vi.fn();
    getPixelRatio = () => 1;
  }

  return { ...actual, WebGLRenderer: FakeWebGLRenderer };
});

class FakeResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn((target: Element) => {
    this.callback(
      [{ target, contentRect: target.getBoundingClientRect() } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createFake2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() };
  const target: Record<string, unknown> = { canvas };
  return new Proxy(target, {
    get(obj, prop: string) {
      if (prop in obj) return obj[prop];
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return () => gradient;
      }
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      return vi.fn();
    },
    set(obj, prop: string, value) {
      obj[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

export const matchMediaState = { reducedMotion: false, narrow: false };

beforeEach(() => {
  matchMediaState.reducedMotion = false;
  matchMediaState.narrow = false;

  vi.stubGlobal("ResizeObserver", FakeResizeObserver);

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => {
      const matches = query.includes("prefers-reduced-motion")
        ? matchMediaState.reducedMotion
        : query.includes("max-width")
          ? matchMediaState.narrow
          : false;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });

  HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, kind: string) {
    return kind === "2d" ? createFake2dContext(this) : null;
  }) as unknown as HTMLCanvasElement["getContext"];

  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
