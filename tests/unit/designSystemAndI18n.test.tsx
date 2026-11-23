import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { architectureNodes } from "@/data/architectureNodes";
import { curriculumSteps } from "@/data/curriculumSteps";
import { techStackGuide } from "@/data/techStackGuide";
import { Badge } from "@/design-system/Badge";
import { Button } from "@/design-system/Button";
import { Card } from "@/design-system/Card";
import { CodeBlock } from "@/design-system/CodeBlock";
import { Drawer } from "@/design-system/Drawer";
import { Slider } from "@/design-system/Slider";
import { I18nProvider, useTranslation } from "@/i18n/I18nContext";
import { type Locale, translations } from "@/i18n/translations";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return collectKeys(v as Record<string, unknown>, path);
    }
    return [path];
  });
}

function OrphanTranslationConsumer() {
  useTranslation();
  return null;
}

describe("i18n dictionary & context", () => {
  it("maintains 100% key parity and non-empty strings across en, pt-BR, and es", () => {
    const enKeys = collectKeys(translations.en as unknown as Record<string, unknown>).sort();
    const ptKeys = collectKeys(translations["pt-BR"] as unknown as Record<string, unknown>).sort();
    const esKeys = collectKeys(translations.es as unknown as Record<string, unknown>).sort();

    expect(ptKeys).toEqual(enKeys);
    expect(esKeys).toEqual(enKeys);

    for (const locale of ["en", "pt-BR", "es"] as Locale[]) {
      const serialized = JSON.stringify(translations[locale]);
      expect(serialized).not.toContain('""');
    }
  });

  it("throws when useTranslation is called outside I18nProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<OrphanTranslationConsumer />)).toThrow(
      /useTranslation must be used within an I18nProvider/,
    );
    spy.mockRestore();
  });
});

describe("data catalogs (architectureNodes, curriculumSteps, techStackGuide)", () => {
  it("validates architectureNodes JSON configs and fields", () => {
    expect(architectureNodes).toHaveLength(5);
    for (const node of architectureNodes) {
      expect(() => JSON.parse(node.mcpConfig)).not.toThrow();
      expect(node.verificationChecks.length).toBeGreaterThanOrEqual(2);
      expect(node.alternatives.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("validates curriculumSteps and techStackGuide entries", () => {
    expect(curriculumSteps).toHaveLength(5);
    for (const step of curriculumSteps) {
      expect(step.pythonScript.length).toBeGreaterThan(20);
      expect(Object.keys(step.mcpConfigs)).toEqual(["claude", "cursor", "codex", "antigravity"]);
    }
    expect(techStackGuide).toHaveLength(5);
    for (const item of techStackGuide) {
      expect(item.pros.length).toBeGreaterThan(0);
      expect(item.cons.length).toBeGreaterThan(0);
    }
  });
});

describe("Design System primitives", () => {
  it("renders Badge, Button, Card, and Slider across variants", () => {
    const onChange = vi.fn();
    const onClick = vi.fn();

    render(
      <div>
        <Badge tone="cyan">Cyan</Badge>
        <Badge tone="amber">Amber</Badge>
        <Badge tone="emerald">Emerald</Badge>
        <Badge tone="red">Red</Badge>
        <Badge>Neutral</Badge>
        <Card accent="cyan">Card Cyan</Card>
        <Card accent="amber">Card Amber</Card>
        <Card accent="emerald">Card Emerald</Card>
        <Card accent="red">Card Red</Card>
        <Card>Card None</Card>
        <Button variant="primary" onClick={onClick}>
          Primary
        </Button>
        <Button variant="emerald">Emerald Btn</Button>
        <Button variant="amber">Amber Btn</Button>
        <Button variant="ghost">Ghost Btn</Button>
        <Slider
          label="Torque"
          value={25}
          min={10}
          max={50}
          unit=" N·m"
          accentColor="amber"
          onChange={onChange}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Primary" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    const slider = screen.getByRole("slider", { name: /Torque/i });
    fireEvent.change(slider, { target: { value: "35" } });
    expect(onChange).toHaveBeenCalledWith(35);
  });

  it("renders CodeBlock with Python syntax highlighting and copies to clipboard", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const pyCode = `# Parametric comment\nfrom build123d import BuildPart, extrude\nRADIUS = 12.5\nLABEL = "gear"\nassert True`;

    render(
      <I18nProvider>
        <CodeBlock code={pyCode} language="python" title="gear.py" />
      </I18nProvider>,
    );

    expect(screen.getByText("# Parametric comment")).toBeInTheDocument();
    const copyBtn = screen.getByRole("button", { name: /Copy/i });

    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(writeText).toHaveBeenCalledWith(pyCode);
    expect(screen.getByText(/Copied/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("traps Tab and Shift+Tab focus inside Drawer", () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} title="Test Drawer" subtitle="SUB" closeLabel="Close" onClose={onClose}>
        <button type="button">Inner Action</button>
      </Drawer>,
    );

    const closeBtn = screen.getByRole("button", { name: "Close" });
    const innerBtn = screen.getByRole("button", { name: "Inner Action" });

    // Close button receives initial focus on open
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps to last focusable element
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(innerBtn);

    // Tab from last element wraps back to first focusable element
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });
});
