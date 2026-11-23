export type HarnessId = "claude" | "cursor" | "codex" | "antigravity";

export interface CurriculumStep {
  step: number;
  title: string;
  subtitle: string;
  objective: string;
  mcpConfigs: Record<HarnessId, string>;
  pythonScript: string;
  systemPrompt: string;
}

export const curriculumSteps: CurriculumStep[] = [
  {
    step: 1,
    title: "Local UV & MCP Harness Setup",
    subtitle: "Install Python 3.12 toolchain and wire build123d-mcp",
    objective:
      "Configure your AI coding harness to launch an isolated build123d + OpenCascade MCP server via uv without polluting your system Python.",
    mcpConfigs: {
      claude: `// ~/.claude.json or project .mcp.json
{
  "mcpServers": {
    "build123d": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]
    }
  }
}`,
      cursor: `// .cursor/mcp.json
{
  "mcpServers": {
    "build123d": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]
    }
  }
}`,
      codex: `# ~/.codex/config.toml
[mcp_servers.build123d]
command = "uv"
args = ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]`,
      antigravity: `// Antigravity MCP config (.gemini/antigravity/mcp_config.json)
{
  "mcpServers": {
    "build123d": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]
    },
    "build123d-remote": {
      "serverUrl": "https://buildcad.ai/api/mcp"
    }
  }
}`,
    },
    pythonScript: `# Verify local build123d + OpenCascade installation
# Run: uv run --python 3.12 python verify_env.py
from build123d import Box, export_step, export_stl

with Box(20, 20, 10) as cube:
    pass

assert cube.is_valid(), "B-Rep solid failed manifold check!"
print(f"Volume: {cube.volume:.2f} mm^3")
export_step(cube, "build/smoke_test.step")
export_stl(cube, "build/smoke_test.stl")`,
    systemPrompt: `You are an autonomous mechanical CAD engineer.
Always write parametric build123d Python scripts using BuildPart() and BuildSketch().
Never hand-edit STL triangles. After generating geometry:
1. Verify solid.is_valid() == True and check bounding box dimensions.
2. Render 4 orthographic views (Iso, Top, Front, Right) via build123d-mcp.
3. Export both .step (for CNC) and .stl/.3mf (for 3D printing).`,
  },
  {
    step: 2,
    title: "Parametric Part Scripting",
    subtitle: "Author clean B-Rep geometry with named design variables",
    objective:
      "Parameterize gear tooth count, bore diameter, wall thickness, and stress-relieving fillets so dimensions can be mutated programmatically.",
    mcpConfigs: {
      claude: `// Invoke build123d-mcp execute_cad_script tool
{
  "tool": "execute_cad_script",
  "arguments": {
    "script_path": "cad/planetary_gear.py",
    "export_formats": ["step", "stl", "3mf"]
  }
}`,
      cursor: `// Cursor MCP tool call contract
{
  "server": "build123d",
  "tool": "execute_cad_script",
  "arguments": { "script_path": "cad/planetary_gear.py" }
}`,
      codex: `# Run parametric build directly in Codex sandbox
uv run --python 3.12 python cad/planetary_gear.py --teeth 24 --bore 8.0`,
      antigravity: `// Antigravity MCP call to build123d
{
  "server": "build123d",
  "tool": "execute_cad_script",
  "arguments": {
    "script_path": "cad/planetary_gear.py",
    "check_manifold": true
  }
}`,
    },
    pythonScript: `from build123d import (
    BuildPart, BuildSketch, RegularPolygon, Circle,
    Mode, extrude, fillet, export_step, export_stl
)

TEETH = 24
MODULE = 1.5
BORE_DIA = 8.0
THICKNESS = 10.0
FILLET_R = 0.8

pitch_r = (TEETH * MODULE) / 2.0

with BuildPart() as gear:
    with BuildSketch():
        RegularPolygon(radius=pitch_r + MODULE, side_count=TEETH)
        Circle(radius=BORE_DIA / 2.0, mode=Mode.SUBTRACT)
    extrude(amount=THICKNESS)
    fillet(gear.edges().filter_by(lambda e: e.length > 2.0), radius=FILLET_R)

assert gear.part.is_valid(), "Gear B-Rep must be watertight"
export_step(gear.part, "build/gear.step")
export_stl(gear.part, "build/gear.stl")`,
    systemPrompt: `Refactor cad/planetary_gear.py to accept CLI parameters for teeth, module, bore_dia, wall_thickness, and fillet_radius.
Ensure all internal corners have >= 0.6mm fillets to prevent stress concentrations when printed in PETG or PA12-CF.
Assert solid.is_valid() and print exact volume (cm^3) and center of mass.`,
  },
  {
    step: 3,
    title: "Automated Visual & Topological Gates",
    subtitle: "4-view orthographic PNGs + clearance assertions",
    objective:
      "Prevent blind CAD hallucinations by rendering Iso/Top/Front/Right PNGs for VLM inspection and asserting zero tooth interference.",
    mcpConfigs: {
      claude: `// Render 4 orthographic views for Claude vision inspection
{
  "server": "build123d",
  "tool": "render_orthographic_views",
  "arguments": {
    "part_path": "build/gear.step",
    "views": ["iso", "top", "front", "right"],
    "resolution": [1024, 1024]
  }
}`,
      cursor: `// Cursor visual gate tool call
{
  "server": "build123d",
  "tool": "render_orthographic_views",
  "arguments": { "part_path": "build/gear.step" }
}`,
      codex: `# Headless render + B-Rep interference check
uv run python scripts/visual_gate.py --step build/gear.step --min-clearance 0.25`,
      antigravity: `// Antigravity visual + topological gate
{
  "server": "build123d",
  "tool": "render_orthographic_views",
  "arguments": {
    "part_path": "build/gear.step",
    "check_interference": true
  }
}`,
    },
    pythonScript: `import pytest
from build123d import import_step

def test_gear_topology_and_clearance():
    sun = import_step("build/sun_gear.step")
    planet = import_step("build/planet_gear.step")

    assert sun.is_valid(), "Sun gear B-Rep invalid"
    assert planet.is_valid(), "Planet gear B-Rep invalid"

    # Boolean intersection volume must be zero (no teeth collision)
    intersection = sun.intersect(planet)
    interference_vol = intersection.volume if intersection else 0.0
    assert interference_vol < 1e-4, f"Gear Teeth Interference Detected: {interference_vol:.3f} mm^3"`,
    systemPrompt: `Inspect the 4 orthographic PNG renders (Iso, Top, Front, Right) from Stage 3.
If any tooth interference, blocked bore, or floating geometry is detected (e.g. -0.42mm overlap),
do NOT proceed to physics or slicing. Loop back to Stage 2, increase backlash/addendum clearance by 0.25mm, and re-verify.`,
  },
  {
    step: 4,
    title: "URDF Wrapping & Headless MuJoCo Pytest",
    subtitle: "Verify gear ratio, torque, and FEA safety factor",
    objective:
      "Wrap the verified STL meshes in an MJCF/URDF model and run headless MuJoCo + CalculiX pytest assertions.",
    mcpConfigs: {
      claude: `// FreeCAD FEM / MuJoCo verification MCP
{
  "mcpServers": {
    "freecad-fem": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "freecad-mcp@latest", "--headless"]
    }
  }
}`,
      cursor: `// .cursor/mcp.json for Physics/FEA
{
  "mcpServers": {
    "freecad-fem": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "freecad-mcp@latest", "--headless"]
    }
  }
}`,
      codex: `# Run headless MuJoCo kinematics suite
uv run pytest tests/test_planetary_kinematics.py -v`,
      antigravity: `// Antigravity headless physics verification
{
  "mcpServers": {
    "freecad-fem": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "freecad-mcp@latest", "--headless"]
    }
  }
}`,
    },
    pythonScript: `import mujoco
import numpy as np

def test_planetary_reduction_ratio():
    model = mujoco.MjModel.from_xml_path("sim/planetary_assembly.xml")
    data = mujoco.MjData(model)

    target_rpm = 120.0
    data.ctrl[0] = 2.4  # Motor torque (N*m)

    for _ in range(2000):
        mujoco.mj_step(model, data)

    output_rpm = (data.qvel[1] * 60.0) / (2.0 * np.pi)
    # 4:1 planetary reduction assertion
    assert abs(output_rpm - target_rpm * 0.25) < 0.02, f"Ratio drift: {output_rpm:.3f}"`,
    systemPrompt: `Wrap build/gear.stl into sim/planetary_assembly.xml with accurate inertia tensors.
Run headless MuJoCo for 2000 steps and assert abs(output_rpm - target_rpm * 0.25) < 0.02.
Then run CalculiX FEA under 250N load and confirm Safety Factor >= 2.0 for PETG.`,
  },
  {
    step: 5,
    title: "Automated CLI Slicing",
    subtitle: "Headless PrusaSlicer / OrcaSlicer G-Code & DFM telemetry",
    objective:
      "Slice the verified STL into production G-code via CLI and parse filament mass, print duration, and >45° overhang warnings.",
    mcpConfigs: {
      claude: `// Slicer CLI wrapper MCP
{
  "mcpServers": {
    "slicer-cli": {
      "command": "uv",
      "args": ["run", "python", "scripts/slicer_mcp.py"]
    }
  }
}`,
      cursor: `// .cursor/mcp.json Slicer CLI
{
  "mcpServers": {
    "slicer-cli": {
      "command": "uv",
      "args": ["run", "python", "scripts/slicer_mcp.py"]
    }
  }
}`,
      codex: `# Direct PrusaSlicer headless invocation
prusa-slicer --export-gcode --layer-height 0.2 --fill-density 25% build/gear.stl`,
      antigravity: `// Antigravity Slicer DFM Gate
{
  "mcpServers": {
    "slicer-cli": {
      "command": "uv",
      "args": ["run", "python", "scripts/slicer_mcp.py"]
    }
  }
}`,
    },
    pythonScript: `import subprocess
import json
import re

cmd = [
    "prusa-slicer", "--export-gcode",
    "--layer-height", "0.2",
    "--fill-density", "25%",
    "--fill-pattern", "gyroid",
    "--output", "build/gear.gcode",
    "build/gear.stl",
]
subprocess.run(cmd, check=True)

gcode = open("build/gear.gcode", "r", encoding="utf-8").read()
filament_g = float(re.search(r"filament used \\[g\\] = ([\\d.]+)", gcode).group(1))
print(json.dumps({"filament_g": filament_g, "status": "PRINT_READY"}))`,
    systemPrompt: `Run prusa-slicer --export-gcode --layer-height 0.2 --fill-density 25% on build/gear.stl.
Parse the G-code metadata into JSON. If overhang_defects > 0 or support_volume_cm3 > 5.0,
re-orient the part or add 45-degree chamfers in Stage 2 until zero critical overhangs remain.`,
  },
];
