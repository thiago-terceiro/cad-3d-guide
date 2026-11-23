export interface TechComparisonItem {
  id: string;
  category: string;
  chosenTech: string;
  tagline: string;
  whyWeUseIt: string;
  pros: string[];
  cons: string[];
  alternatives: {
    name: string;
    comparison: string;
    whenToChoose: string;
  }[];
  manufacturingReadiness: string;
}

export const techStackGuide: TechComparisonItem[] = [
  {
    id: "cad-kernel",
    category: "1. Code-CAD Kernel",
    chosenTech: "build123d (OpenCascade B-Rep)",
    tagline: "Pythonic Boundary-Representation CAD built for LLMs & precision manufacturing",
    whyWeUseIt:
      "Unlike mesh-based tools (Blender, OpenSCAD), build123d operates on exact mathematical B-Rep surfaces via OpenCascade (OCCT). Its Python context-manager syntax (`with BuildPart():`) eliminates fragile fluent method-chaining, dramatically reducing AI syntax errors while outputting true STEP files for CNC machining, injection molding, and 3D printing.",
    pros: [
      "Outputs industry-standard STEP / IGES (exact NURBS) alongside high-res STL / 3MF.",
      "Clean Pythonic `BuildPart()` / `BuildSketch()` blocks that LLMs write reliably.",
      "Native topological queries (`part.faces()`, `part.edges().filter_by()`) for automated assertions.",
      "100% headless & pip/uv-installable with zero GUI dependencies.",
    ],
    cons: [
      "OpenCascade (OCCT) can throw cryptic `StdFail_NotDone` errors on degenerate zero-radius fillets.",
      "Steeper learning curve for artists used to sculpting meshes rather than engineering sketches.",
      "Heavy C++ binary wheel (~150 MB) on initial `uv` install.",
    ],
    alternatives: [
      {
        name: "OpenSCAD",
        comparison:
          "Uses CSG (Constructive Solid Geometry) on triangle meshes. Fillets require slow `minkowski()` hacks and it cannot export STEP.",
        whenToChoose:
          "Choose OpenSCAD only for simple 3D-printed brackets/boxes where STEP files and smooth fillets are unnecessary.",
      },
      {
        name: "CadQuery",
        comparison:
          "Shares the same OCCT kernel as build123d, but uses long fluent `.workplane().pushPoints().cboreHole()` chains.",
        whenToChoose:
          "Choose CadQuery if your team already maintains a large legacy CadQuery library.",
      },
      {
        name: "FreeCAD Python / MCP",
        comparison:
          "Full desktop-class CAD + FEM workbench, but heavier process startup and more complex API.",
        whenToChoose:
          "Choose FreeCAD MCP when you need integrated CalculiX FEM meshing or complex multi-part assembly constraints.",
      },
    ],
    manufacturingReadiness:
      "Production-ready: exports watertight B-Rep STEP AP214 for CNC/sheet-metal and 3MF/STL for FDM/SLA/SLS 3D printing.",
  },
  {
    id: "mcp-transport",
    category: "2. Agent Transport & Runtime",
    chosenTech: "MCP + uv (`build123d-mcp`)",
    tagline: "Zero-config Python 3.12 isolation with multimodal PNG & B-Rep verification",
    whyWeUseIt:
      "Model Context Protocol (MCP) gives Claude Code, Codex, Cursor, and Antigravity a typed, deterministic contract for CAD execution. Paired with `uv tool run`, the agent spins up an isolated Python 3.12 + OCCT environment in seconds without polluting global site-packages, and automatically receives 4-view orthographic PNGs to visually inspect its own geometry.",
    pros: [
      "Works identically across Claude Code, Codex, Cursor, and Antigravity via `.mcp.json`.",
      "`uv` resolves OCCT + build123d in deterministic lockfiles without Conda headaches.",
      "Built-in orthographic rendering turns blind code generation into a closed-loop visual check.",
      "Supports both local execution and hosted endpoints (`https://buildcad.ai/api/mcp`).",
    ],
    cons: [
      "Multimodal PNG inspection consumes extra vision tokens on every iteration.",
      "Local `uv` execution requires Python 3.12+ and ~500 MB disk cache on first run.",
    ],
    alternatives: [
      {
        name: "Raw CLI / Bash Scripts",
        comparison:
          "The agent writes `.py` files and runs them with `python part.py`, but has no standardized visual render or B-Rep schema feedback.",
        whenToChoose:
          "Choose raw CLI in CI/CD pipelines (GitHub Actions) where no interactive MCP client is present.",
      },
      {
        name: "Proprietary CAD Plugins (Fusion / Onshape API)",
        comparison: "Requires cloud OAuth, paid seats, or a running Windows/macOS desktop GUI.",
        whenToChoose:
          "Choose Onshape/Fusion APIs only if corporate PDM/PLM requires all parts to live in a proprietary cloud vault.",
      },
    ],
    manufacturingReadiness:
      "Reproducible builds: every part is pinned by `pyproject.toml` + `uv.lock`, guaranteeing identical geometry months later.",
  },
  {
    id: "physics-robotics",
    category: "3. Kinematics & Robotics Physics",
    chosenTech: "MuJoCo / Genesis",
    tagline: "Sub-millimeter contact accuracy & headless pytest verification",
    whyWeUseIt:
      "Before 3D printing a planetary gearbox or robotic gripper, you must verify gear ratios, backlash, and torque transmission. MuJoCo's generalized-coordinate solver models rigid-body gear teeth and joint friction with high numerical stability, while Genesis adds GPU-accelerated parallel rollouts—all runnable headlessly inside `pytest`.",
    pros: [
      "Deterministic headless stepping: `mujoco.mj_step(model, data)` runs 10,000+ FPS on CPU.",
      "Native URDF and MJCF XML support directly from exported STL/OBJ meshes.",
      "Integrates directly into `pytest` assertions (`assert abs(rpm - target) < 0.02`).",
      "Zero GUI required for CI regression testing of mechanical assemblies.",
    ],
    cons: [
      "Complex concave gear teeth require convex decomposition (CoACD/VHACD) or analytic tooth colliders.",
      "Does not simulate material plastic deformation or thermal warping.",
    ],
    alternatives: [
      {
        name: "PyBullet",
        comparison:
          "Easy to install, but uses softer penalty-based contact constraints that can cause gear teeth to tunnel under high torque.",
        whenToChoose:
          "Choose PyBullet for quick RL prototypes where exact gear contact stiffness isn't critical.",
      },
      {
        name: "NVIDIA Isaac Sim / Gazebo",
        comparison:
          "Heavyweight simulators requiring massive GPU/container footprints and slow startup.",
        whenToChoose:
          "Choose Isaac Sim for photorealistic camera/LiDAR sensor simulation in full-robot environments.",
      },
    ],
    manufacturingReadiness:
      "Prevents wasted prints by catching wrong gear ratios, binding clearances, and motor stall before slicing.",
  },
  {
    id: "structural-fea",
    category: "4. Structural FEA Solver",
    chosenTech: "CalculiX (via FreeCAD FEM)",
    tagline: "Open-source 3D tetrahedral/hexahedral von Mises stress & deflection",
    whyWeUseIt:
      "3D-printed parts fail at sharp internal corners and thin mounting flanges. CalculiX (`ccx`) is an open-source, Abaqus-compatible finite-element solver that computes 3D von Mises stress (MPa) and elastic deflection (mm) headlessly—allowing an AI agent to check Safety Factors against PLA, PETG, ABS, or PA12-CF yield strengths.",
    pros: [
      "Battle-tested industrial solver using standard `.inp` Abaqus syntax.",
      "Scriptable end-to-end via FreeCAD Python API or `pycalculix` without opening a GUI.",
      "Computes true 3D stress concentrations around fillets, holes, and gussets.",
    ],
    cons: [
      "Isotropic material assumption overestimates Z-axis interlayer strength of FDM prints (apply SF >= 2.0).",
      "Requires tetrahedral meshing (Gmsh/Netgen) which can fail on dirty non-manifold STLs.",
    ],
    alternatives: [
      {
        name: "FEniCSx",
        comparison:
          "Flexible PDE solver in Python, but requires writing weak-form variational equations manually.",
        whenToChoose:
          "Choose FEniCSx for custom multiphysics (coupled thermal-structural) research.",
      },
      {
        name: "ANSYS / SolidWorks Simulation",
        comparison:
          "Polished UI, but expensive per-seat licensing and poor headless agent automation.",
        whenToChoose: "Choose commercial FEA for aerospace/medical certification sign-off.",
      },
    ],
    manufacturingReadiness:
      "Guides infill density, wall count, and material choice (e.g., upgrading PLA to PA12-CF when Safety Factor < 1.5).",
  },
  {
    id: "headless-slicer",
    category: "5. Headless CLI Slicer & DFM",
    chosenTech: "PrusaSlicer / OrcaSlicer CLI",
    tagline: "Automated G-code generation, overhang detection & print-time telemetry",
    whyWeUseIt:
      "A part that looks great in CAD can still fail on the build plate. Running `prusa-slicer --export-gcode` or `orca-slicer` headlessly generates real toolpaths and exposes exact filament grams, print time, support volume, and >45° overhang warnings as machine-readable telemetry.",
    pros: [
      "Exact same slicing engine used on desktop printers—zero discrepancy between sim and shop floor.",
      "Parses G-code header comments for filament weight, cost, and estimated duration.",
      "Detects unprintable overhangs (>45°) and thin walls (< nozzle diameter) automatically.",
    ],
    cons: [
      "OrcaSlicer CLI flags vary slightly across versions compared to PrusaSlicer's stable `--export-gcode`.",
      "Requires printer/filament `.ini` profile files checked into the repo.",
    ],
    alternatives: [
      {
        name: "CuraEngine CLI",
        comparison: "Fast C++ backend, but profile JSON configuration is verbose to manage in git.",
        whenToChoose:
          "Choose CuraEngine if your print farm standardizes on Ultimaker Cura profiles.",
      },
      {
        name: "Cloud Slicing APIs",
        comparison: "Easy REST calls, but vendor lock-in and slower iteration loops.",
        whenToChoose: "Choose cloud slicers only for web-based print-on-demand storefronts.",
      },
    ],
    manufacturingReadiness:
      "100% shop-floor ready: outputs verified `.gcode` / `.bgcode` ready for OctoPrint, Klipper/Mainsail, or SD card.",
  },
];
