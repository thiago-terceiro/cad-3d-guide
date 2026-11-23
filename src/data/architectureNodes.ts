export interface ArchitectureNodeData {
  id: string;
  stageNumber: number;
  shortTitle: string;
  title: string;
  subtitle: string;
  accent: "cyan" | "amber" | "emerald";
  protocol: string;
  engineBadge: string;
  inputArtifact: string;
  outputArtifact: string;
  latencyBudget: string;
  liveMetricDefault: string;
  liveMetricFail?: string;
  liveMetricFixed?: string;
  verificationChecks: string[];
  summary: string;
  whyStageExists: string;
  mcpConfig: string;
  cliSetup: string;
  alternatives: {
    name: string;
    tradeoff: string;
  }[];
}

export const architectureNodes: ArchitectureNodeData[] = [
  {
    id: "harness",
    stageNumber: 1,
    shortTitle: "Harness Prompt",
    title: "1. AI Coding Harness (Claude Code / Codex / Cursor / Antigravity)",
    subtitle: "STAGE 01 · INTENT & ORCHESTRATION",
    accent: "cyan",
    protocol: "MCP JSON-RPC",
    engineBadge: "Claude · Codex · AGY",
    inputArtifact: "Spec + Constraints",
    outputArtifact: "parametric_part.py",
    latencyBudget: "~1.2s AST synth",
    liveMetricDefault: "AST: 64 params · 0 GUI",
    verificationChecks: [
      "Strict Python typing & deterministic seed constraints",
      "Parametric variables isolated for automated mutation",
      "Zero binary CAD blobs — 100% git-diffable source",
    ],
    summary:
      "The agentic coding harness translates high-level mechanical requirements (loads, tolerances, print orientation) into deterministic Python scripts and invokes MCP tools in a tight feedback loop.",
    whyStageExists:
      "Traditional GUI CAD (SolidWorks, Fusion 360) locks design intent behind mouse clicks and proprietary binary files. By starting in an AI coding harness, geometry becomes version-controlled Python code that can be diffed, parameterized, and automatically verified by unit tests.",
    mcpConfig: `{
  "mcpServers": {
    "build123d": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]
    }
  }
}`,
    cliSetup: `# Install uv (fast Rust-based Python package/tool runner)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify Python 3.12 & build123d-mcp availability
uv tool run --python 3.12 build123d-mcp@latest --help`,
    alternatives: [
      {
        name: "Hosted Remote MCP (buildcad.ai)",
        tradeoff:
          "Zero local Python/OCCT setup via https://buildcad.ai/api/mcp, but adds network latency and requires uploading proprietary part scripts.",
      },
      {
        name: "Raw Bash + Python Subprocess",
        tradeoff:
          "Works without MCP, but loses structured tool schemas, automatic orthographic PNG attachment, and standardized error payloads.",
      },
    ],
  },
  {
    id: "cad-mcp",
    stageNumber: 2,
    shortTitle: "Code-CAD MCP",
    title: "2. Code-CAD MCP (build123d-mcp / FreeCAD MCP)",
    subtitle: "STAGE 02 · B-REP KERNEL EXECUTION",
    accent: "cyan",
    protocol: "OCCT 7.8 Kernel",
    engineBadge: "build123d + OpenCascade",
    inputArtifact: "parametric_part.py",
    outputArtifact: "part.step · part.stl",
    latencyBudget: "~380ms B-Rep solve",
    liveMetricDefault: "B-Rep: 14.8 cm³ · STEP",
    liveMetricFixed: "Patched: +0.25mm root",
    verificationChecks: [
      "Exact analytic NURBS / B-Rep solid synthesis via OCCT",
      "Automatic fillet & chamfer topological edge resolution",
      "Dual export: ISO-10303 STEP for CNC + binary STL/3MF",
    ],
    summary:
      "Executes pure-Python build123d scripts on top of OpenCascade (OCCT) to synthesize exact mathematical B-Rep solids, exporting watertight STEP, STL, and 3MF artifacts.",
    whyStageExists:
      "LLMs hallucinate when generating raw triangle meshes (.obj/.stl) directly. Code-CAD MCP constrains the agent to high-level parametric Python primitives (BuildPart, RegularPolygon, extrude, fillet) backed by a real industrial CAD kernel (OCCT).",
    mcpConfig: `{
  "mcpServers": {
    "build123d-local": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"]
    },
    "build123d-hosted": {
      "type": "http",
      "url": "https://buildcad.ai/api/mcp"
    }
  }
}`,
    cliSetup: `# Local isolated workspace with build123d
uv init hardware-lab --python 3.12
cd hardware-lab
uv add build123d ocp-vscode pytest`,
    alternatives: [
      {
        name: "OpenSCAD",
        tradeoff:
          "Simple CSG syntax, but lacks true B-Rep STEP export, native fillets/chamfers are painful, and CNC/injection-molding houses reject STL-only deliverables.",
      },
      {
        name: "CadQuery",
        tradeoff:
          "Also wraps OCCT in Python; build123d improves on it with cleaner context-manager syntax (with BuildPart():) that LLMs write with fewer fluent-chaining bugs.",
      },
      {
        name: "FreeCAD MCP",
        tradeoff:
          "Essential when you need FreeCAD's built-in CalculiX FEM workbench or assembly constraints, though heavier to run headlessly than build123d.",
      },
    ],
  },
  {
    id: "visual-gate",
    stageNumber: 3,
    shortTitle: "Visual & Topo Gate",
    title: "3. Visual & Topological Gate (4-View PNGs + B-Rep Check)",
    subtitle: "STAGE 03 · SELF-CORRECTION CHECKPOINT",
    accent: "amber",
    protocol: "VLM + B-Rep Gate",
    engineBadge: "4-View PNG + Manifold",
    inputArtifact: "part.step + 4x Ortho PNG",
    outputArtifact: "Boolean Gate + Delta",
    latencyBudget: "~520ms boolean check",
    liveMetricDefault: "Clearance: +0.25mm OK",
    liveMetricFail: "COLLISION: -0.42mm!",
    liveMetricFixed: "Clearance: +0.25mm PASS",
    verificationChecks: [
      "solid.is_valid() watertight manifold & positive volume check",
      "Boolean intersection volume == 0.00 mm³ across mating gears",
      "Multimodal 4-view orthographic PNG VLM defect inspection",
    ],
    summary:
      "Renders orthographic Iso, Top, Front, and Right PNGs for multimodal VLM inspection while running automated B-Rep manifold, interference, and clearance assertions.",
    whyStageExists:
      "Code that compiles without Python exceptions can still produce physically broken geometry (floating bosses, self-intersecting gear teeth, blocked bolt holes). The Visual & Topological Gate catches geometric defects—like -0.42mm gear tooth interference—and forces the agent back to Stage 2 before wasting simulation or printer time.",
    mcpConfig: `{
  "mcpServers": {
    "build123d": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "build123d-mcp@latest"],
      "env": {
        "CAD_RENDER_VIEWS": "iso,top,front,right",
        "CAD_CHECK_WATERTIGHT": "true"
      }
    }
  }
}`,
    cliSetup: `# Run headless B-Rep topological & interference check
uv run pytest tests/test_topology.py -v
# Checks: solid.is_valid(), volume > 0, clearance >= 0.2mm`,
    alternatives: [
      {
        name: "Manual GUI Inspection",
        tradeoff:
          "Breaks the zero-GUI autonomous loop; requires a human to open every STL/STEP file in a desktop viewer.",
      },
      {
        name: "Blind Text-Only Execution",
        tradeoff:
          "Without orthographic PNG renders, coding agents cannot spot inverted cutouts, misaligned mounting holes, or colliding teeth.",
      },
    ],
  },
  {
    id: "physics-fea",
    stageNumber: 4,
    shortTitle: "Physics & FEA",
    title: "4. Physics & FEA Verifier (MuJoCo / Genesis & CalculiX)",
    subtitle: "STAGE 04 · KINEMATICS & STRUCTURAL INTEGRITY",
    accent: "amber",
    protocol: "MJCF + CalculiX",
    engineBadge: "MuJoCo 3 · CalculiX ccx",
    inputArtifact: "assembly.xml · mesh.inp",
    outputArtifact: "Stress & Torque Report",
    latencyBudget: "~1.4s FEM + 500Hz sim",
    liveMetricDefault: "SF: 2.84x · 29.0 MPa",
    verificationChecks: [
      "MuJoCo 500Hz rigid-body gear train transmission & backlash test",
      "CalculiX tetrahedral FEM von Mises peak stress < yield / 2.0",
      "Max tip deflection <= 1.20 mm under 200 N rated load",
    ],
    summary:
      "Wraps exported meshes into URDF/MJCF for headless MuJoCo/Genesis rigid-body kinematics tests and runs CalculiX finite-element analysis to verify von Mises stress and Safety Factors.",
    whyStageExists:
      "A watertight gear or bracket might still strip teeth under motor torque or snap under payload. Running MuJoCo/Genesis and CalculiX in headless pytest turns mechanical performance into deterministic pass/fail assertions.",
    mcpConfig: `{
  "mcpServers": {
    "freecad-fem": {
      "command": "uv",
      "args": ["tool", "run", "--python", "3.12", "freecad-mcp@latest", "--headless"]
    }
  }
}`,
    cliSetup: `# Install headless physics & FEA verification stack
uv add mujoco numpy pytest
# CalculiX (ccx) via system package manager or conda-forge
# Ubuntu/WSL: sudo apt-get install calculix-ccx
uv run pytest tests/test_planetary_kinematics.py`,
    alternatives: [
      {
        name: "PyBullet / Gazebo",
        tradeoff:
          "Older contact solvers with softer penalty springs; MuJoCo offers faster, more accurate gear/contact dynamics and Genesis adds GPU-parallel simulation.",
      },
      {
        name: "Commercial FEA (ANSYS / SolidWorks Sim)",
        tradeoff:
          "GUI-bound and license-gated, making automated CI/agentic verification loops impractical compared to open-source CalculiX.",
      },
    ],
  },
  {
    id: "slicer",
    stageNumber: 5,
    shortTitle: "Headless Slicer",
    title: "5. Headless CLI Slicer (PrusaSlicer / OrcaSlicer G-Code)",
    subtitle: "STAGE 05 · DESIGN FOR MANUFACTURING (DFM)",
    accent: "emerald",
    protocol: "CLI G-Code DFM",
    engineBadge: "PrusaSlicer · Orca CLI",
    inputArtifact: "verified_part.3mf",
    outputArtifact: "part.gcode + DFM JSON",
    latencyBudget: "~640ms CLI slice",
    liveMetricDefault: "38m 12s · 19.4g · 0 err",
    verificationChecks: [
      "Zero unprintable >45° overhangs without support structures",
      "Minimum wall thickness >= 2x 0.4mm nozzle perimeter width",
      "Gyroid infill mass, print duration & G-code checksum verified",
    ],
    summary:
      "Invokes PrusaSlicer or OrcaSlicer via CLI to slice the verified STL/3MF into machine G-code and parses filament mass, print duration, support volume, and >45° overhang warnings.",
    whyStageExists:
      "A part that passes FEA can still be unprintable due to unsupported 60° overhangs, thin walls thinner than a 0.4mm nozzle, or excessive support waste. Headless slicing closes the DFM loop automatically.",
    mcpConfig: `{
  "mcpServers": {
    "slicer-cli": {
      "command": "uv",
      "args": ["run", "python", "scripts/slicer_mcp.py"]
    }
  }
}`,
    cliSetup: `# Headless PrusaSlicer G-Code export & telemetry check
prusa-slicer --export-gcode \\
  --layer-height 0.2 \\
  --fill-density 25% \\
  --fill-pattern gyroid \\
  --output build/part.gcode build/part.stl`,
    alternatives: [
      {
        name: "CuraEngine CLI",
        tradeoff:
          "Fast slicing engine, but PrusaSlicer/OrcaSlicer offer cleaner CLI profile overrides, native 3MF support, and richer G-code metadata headers.",
      },
      {
        name: "Desktop Slicer GUI Only",
        tradeoff:
          "Prevents the AI agent from seeing print time, filament cost, or overhang defects before handing the file to the engineer.",
      },
    ],
  },
];
