export type Locale = "en" | "pt-BR" | "es";

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  nav: {
    architecture: string;
    cadStudio: string;
    physicsFea: string;
    slicer: string;
    techGuide: string;
    curriculum: string;
    examplesPage: string;
    mainLabPage: string;
    languageLabel: string;
  };
  hero: {
    badge: string;
    heading: string;
    subheading: string;
    simulateBtn: string;
    simulatingBtn: string;
    resetBtn: string;
    loopStatusIdle: string;
    loopStatusRunning: string;
    loopStatusFailed: string;
    loopStatusCorrecting: string;
    loopStatusPassed: string;
    clickNodeHint: string;
    drawerClose: string;
    mcpConfigTitle: string;
    cliSetupTitle: string;
    whyStageTitle: string;
    alternativesTitle: string;
  };
  cad: {
    sectionTitle: string;
    sectionDesc: string;
    codePaneTitle: string;
    viewportTitle: string;
    toothCount: string;
    boreDiameter: string;
    wallThickness: string;
    filletRadius: string;
    volumeLabel: string;
    comLabel: string;
    watertightLabel: string;
    watertightPass: string;
    exportStep: string;
    exportStl: string;
    export3mf: string;
    views: {
      iso: string;
      top: string;
      front: string;
      right: string;
    };
  };
  physics: {
    sectionTitle: string;
    sectionDesc: string;
    modeKinematics: string;
    modeFea: string;
    motorTorque: string;
    frictionCoeff: string;
    payloadMass: string;
    angularVelocity: string;
    backlashError: string;
    pytestTitle: string;
    downwardLoad: string;
    exaggeratedDeform: string;
    peakStress: string;
    maxDeflection: string;
    safetyFactor: string;
    materialComparison: string;
    yieldStrength: string;
    statusPass: string;
    statusCaution: string;
    statusFail: string;
  };
  slicer: {
    sectionTitle: string;
    sectionDesc: string;
    layerScrubber: string;
    layerOf: string;
    showOverhangs: string;
    cliTitle: string;
    telemetryTitle: string;
    filamentUsed: string;
    printTime: string;
    supportVolume: string;
    overhangDefects: string;
    infillLegend: string;
    overhangLegend: string;
  };
  guide: {
    sectionTitle: string;
    sectionDesc: string;
    whyWeUseIt: string;
    prosLabel: string;
    consLabel: string;
    alternativesLabel: string;
    manufacturingNote: string;
  };
  curriculum: {
    sectionTitle: string;
    sectionDesc: string;
    harnessLabel: string;
    mcpConfigTab: string;
    pythonScriptTab: string;
    systemPromptTab: string;
  };
  common: {
    copy: string;
    copied: string;
  };
}

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    appTitle: "Agentic Hardware Lab",
    appSubtitle: "Zero-GUI Mechanical CAD, Physics & 3D Printing",
    nav: {
      architecture: "Loop Map",
      cadStudio: "Code-CAD",
      physicsFea: "Physics & FEA",
      slicer: "CLI Slicer",
      techGuide: "Why This Stack",
      curriculum: "Curriculum",
      examplesPage: "3D Examples",
      mainLabPage: "Hardware Lab",
      languageLabel: "Language",
    },
    hero: {
      badge: "AUTONOMOUS HARDWARE ENGINEERING",
      heading: "Agentic Hardware Lab: Zero-GUI Mechanical CAD, Physics & 3D Printing",
      subheading:
        "Design B-Rep mechanical parts, verify rigid-body kinematics & FEA stress, and slice manufacturing-ready G-code directly from Claude Code, Codex, Cursor, or Antigravity.",
      simulateBtn: "Simulate Agent Loop",
      simulatingBtn: "Running Closed Loop...",
      resetBtn: "Reset Loop",
      loopStatusIdle: "IDLE — Click Simulate Agent Loop or inspect any node",
      loopStatusRunning: "EXECUTING — Dispatching parametric intent...",
      loopStatusFailed: "GATE 3 FAIL — Gear Teeth Interference Detected (-0.42mm)",
      loopStatusCorrecting: "SELF-CORRECTING — Adjusting addendum clearance in Stage 2...",
      loopStatusPassed: "ALL GATES PASS — Ready for STEP / STL / G-Code Manufacturing",
      clickNodeHint:
        "Click any stage node to inspect .mcp.json, CLI setup, and engineering rationale",
      drawerClose: "Close",
      mcpConfigTitle: "MCP Server Configuration (.mcp.json)",
      cliSetupTitle: "Headless CLI Setup",
      whyStageTitle: "Why This Stage Exists",
      alternativesTitle: "Alternatives & Trade-offs",
    },
    cad: {
      sectionTitle: "Live Parametric Code-CAD Studio",
      sectionDesc:
        "Drag sliders to mutate the build123d Python script and regenerate the procedural Three.js B-Rep mesh and orthographic LLM inspection views in real time.",
      codePaneTitle: "planetary_gear.py (build123d)",
      viewportTitle: "3D CAD Viewport (mm)",
      toothCount: "Module / Tooth Count",
      boreDiameter: "Bore Diameter",
      wallThickness: "Wall Thickness",
      filletRadius: "Fillet Radius",
      volumeLabel: "Volume",
      comLabel: "Center of Mass",
      watertightLabel: "Watertight B-Rep",
      watertightPass: "PASS",
      exportStep: "Export STEP",
      exportStl: "Export STL",
      export3mf: "Export 3MF",
      views: {
        iso: "Iso",
        top: "Top",
        front: "Front",
        right: "Right",
      },
    },
    physics: {
      sectionTitle: "Interactive Physics & Structural FEA Sandbox",
      sectionDesc:
        "Validate mechanical assemblies before printing: test planetary gear kinematics in headless MuJoCo/Genesis or inspect von Mises stress & deflection via CalculiX FEA.",
      modeKinematics: "Mode A: Kinematics & Robotics (MuJoCo / Genesis)",
      modeFea: "Mode B: Structural Stress FEA (FreeCAD + CalculiX)",
      motorTorque: "Motor Torque",
      frictionCoeff: "Friction Coefficient",
      payloadMass: "Payload Mass",
      angularVelocity: "Angular Velocity (rad/s)",
      backlashError: "Backlash Error (rad)",
      pytestTitle: "Headless Pytest Assertion Gate",
      downwardLoad: "Virtual Downward Load",
      exaggeratedDeform: "Exaggerated Deformation (12x)",
      peakStress: "Peak von Mises Stress",
      maxDeflection: "Max Tip Deflection",
      safetyFactor: "Safety Factor",
      materialComparison: "3D-Printable Material Yield Comparison",
      yieldStrength: "Yield",
      statusPass: "PASS",
      statusCaution: "MARGINAL",
      statusFail: "YIELD RISK",
    },
    slicer: {
      sectionTitle: "Headless CLI Slicer & Printability Analyzer",
      sectionDesc:
        "Scrub through 240 horizontal print layers to inspect perimeter shells, gyroid infill geometry, and >45° overhang risks before running PrusaSlicer or OrcaSlicer in CI.",
      layerScrubber: "G-Code Layer Scrubber",
      layerOf: "of",
      showOverhangs: "Highlight >45° Overhangs",
      cliTitle: "Headless Slicer CLI & Parsed JSON Telemetry",
      telemetryTitle: "Printability Telemetry",
      filamentUsed: "Filament Used",
      printTime: "Est. Print Time",
      supportVolume: "Support Volume",
      overhangDefects: "Overhang Defects",
      infillLegend: "Gyroid Infill (25%)",
      overhangLegend: "Overhang >45° Warning",
    },
    guide: {
      sectionTitle: "Technology Deep-Dive: Why This Stack?",
      sectionDesc:
        "Understand every layer of the zero-GUI hardware pipeline—why each tool is chosen for AI coding agents, its pros and cons, and when to switch to an alternative.",
      whyWeUseIt: "Why We Use It",
      prosLabel: "Pros",
      consLabel: "Cons",
      alternativesLabel: "Alternatives & When to Switch",
      manufacturingNote: "Manufacturing Readiness",
    },
    curriculum: {
      sectionTitle: "5-Step Agentic Hardware Curriculum",
      sectionDesc:
        "Copy production-ready .mcp.json configs, Python CAD/physics scripts, and exact system prompts into your preferred AI coding harness.",
      harnessLabel: "Target AI Harness",
      mcpConfigTab: ".mcp.json Config",
      pythonScriptTab: "Python Script",
      systemPromptTab: "Agent Prompt",
    },
    common: {
      copy: "Copy",
      copied: "Copied",
    },
  },
  "pt-BR": {
    appTitle: "Agentic Hardware Lab",
    appSubtitle: "CAD Mecânico Zero-GUI, Física & Impressão 3D",
    nav: {
      architecture: "Mapa do Loop",
      cadStudio: "Code-CAD",
      physicsFea: "Física & FEA",
      slicer: "Slicer CLI",
      techGuide: "Por que Esta Stack",
      curriculum: "Currículo",
      examplesPage: "Exemplos 3D",
      mainLabPage: "Lab Principal",
      languageLabel: "Idioma",
    },
    hero: {
      badge: "ENGENHARIA DE HARDWARE AUTÔNOMA",
      heading: "Agentic Hardware Lab: CAD Mecânico Zero-GUI, Física & Impressão 3D",
      subheading:
        "Projete peças mecânicas B-Rep, valide cinemática e tensão FEA, e gere G-code pronto para fabricação direto do Claude Code, Codex, Cursor ou Antigravity.",
      simulateBtn: "Simular Loop do Agente",
      simulatingBtn: "Executando Loop Fechado...",
      resetBtn: "Reiniciar Loop",
      loopStatusIdle: "OCIOSO — Clique em Simular Loop ou inspecione qualquer nó",
      loopStatusRunning: "EXECUTANDO — Enviando intenção paramétrica...",
      loopStatusFailed: "FALHA NO PORTÃO 3 — Interferência nos Dentes (-0.42mm)",
      loopStatusCorrecting: "AUTOCORREÇÃO — Ajustando folga de adendo no Estágio 2...",
      loopStatusPassed: "TODOS OS PORTÕES OK — Pronto para STEP / STL / G-Code",
      clickNodeHint: "Clique em qualquer estágio para ver .mcp.json, CLI e justificativa técnica",
      drawerClose: "Fechar",
      mcpConfigTitle: "Configuração do Servidor MCP (.mcp.json)",
      cliSetupTitle: "Instalação CLI Headless",
      whyStageTitle: "Por Que Este Estágio Existe",
      alternativesTitle: "Alternativas & Trade-offs",
    },
    cad: {
      sectionTitle: "Estúdio Code-CAD Paramétrico ao Vivo",
      sectionDesc:
        "Arraste os controles para atualizar o script Python build123d e regenerar a malha 3D e as vistas ortográficas de inspeção em tempo real.",
      codePaneTitle: "planetary_gear.py (build123d)",
      viewportTitle: "Viewport CAD 3D (mm)",
      toothCount: "Módulo / Nº de Dentes",
      boreDiameter: "Diâmetro do Furo",
      wallThickness: "Espessura da Parede",
      filletRadius: "Raio de Filete",
      volumeLabel: "Volume",
      comLabel: "Centro de Massa",
      watertightLabel: "B-Rep Estanque",
      watertightPass: "PASSOU",
      exportStep: "Exportar STEP",
      exportStl: "Exportar STL",
      export3mf: "Exportar 3MF",
      views: {
        iso: "Iso",
        top: "Topo",
        front: "Frente",
        right: "Direita",
      },
    },
    physics: {
      sectionTitle: "Sandbox Interativo de Física & FEA Estrutural",
      sectionDesc:
        "Valide conjuntos mecânicos antes de imprimir: teste cinemática planetária no MuJoCo/Genesis ou inspecione tensão von Mises no CalculiX FEA.",
      modeKinematics: "Modo A: Cinemática & Robótica (MuJoCo / Genesis)",
      modeFea: "Modo B: Tensão Estrutural FEA (FreeCAD + CalculiX)",
      motorTorque: "Torque do Motor",
      frictionCoeff: "Coeficiente de Atrito",
      payloadMass: "Massa da Carga",
      angularVelocity: "Velocidade Angular (rad/s)",
      backlashError: "Erro de Folga (rad)",
      pytestTitle: "Portão de Asserção Pytest Headless",
      downwardLoad: "Carga Vertical Virtual",
      exaggeratedDeform: "Deformação Exagerada (12x)",
      peakStress: "Tensão Pico von Mises",
      maxDeflection: "Deflexão Máxima",
      safetyFactor: "Fator de Segurança",
      materialComparison: "Comparação de Escoamento (Impressão 3D)",
      yieldStrength: "Escoamento",
      statusPass: "APROVADO",
      statusCaution: "MARGINAL",
      statusFail: "RISCO",
    },
    slicer: {
      sectionTitle: "Slicer CLI Headless & Análise de Imprimibilidade",
      sectionDesc:
        "Navegue pelas 240 camadas horizontais para inspecionar perímetros, preenchimento giroide e alertas de balanço >45° antes de rodar o PrusaSlicer/OrcaSlicer.",
      layerScrubber: "Seletor de Camada G-Code",
      layerOf: "de",
      showOverhangs: "Destacar Balanços >45°",
      cliTitle: "CLI Headless & Telemetria JSON",
      telemetryTitle: "Telemetria de Imprimibilidade",
      filamentUsed: "Filamento Usado",
      printTime: "Tempo Estimado",
      supportVolume: "Volume de Suporte",
      overhangDefects: "Defeitos de Balanço",
      infillLegend: "Preenchimento Giroide (25%)",
      overhangLegend: "Alerta de Balanço >45°",
    },
    guide: {
      sectionTitle: "Guia Técnico Profundo: Por Que Esta Stack?",
      sectionDesc:
        "Entenda cada camada do pipeline zero-GUI — por que cada ferramenta é escolhida para agentes de IA, seus prós, contras e alternativas.",
      whyWeUseIt: "Por Que Usamos",
      prosLabel: "Prós",
      consLabel: "Contras",
      alternativesLabel: "Alternativas & Quando Trocar",
      manufacturingNote: "Prontidão para Fabricação",
    },
    curriculum: {
      sectionTitle: "Currículo Prático em 5 Passos",
      sectionDesc:
        "Copie configurações .mcp.json, scripts Python de CAD/física e prompts exatos para colar no seu agente de código.",
      harnessLabel: "Agente / IDE Alvo",
      mcpConfigTab: "Config .mcp.json",
      pythonScriptTab: "Script Python",
      systemPromptTab: "Prompt do Agente",
    },
    common: {
      copy: "Copiar",
      copied: "Copiado",
    },
  },
  es: {
    appTitle: "Agentic Hardware Lab",
    appSubtitle: "CAD Mecánico Zero-GUI, Física e Impresión 3D",
    nav: {
      architecture: "Mapa del Loop",
      cadStudio: "Code-CAD",
      physicsFea: "Física & FEA",
      slicer: "Slicer CLI",
      techGuide: "Por qué Esta Stack",
      curriculum: "Currículo",
      examplesPage: "Ejemplos 3D",
      mainLabPage: "Lab Principal",
      languageLabel: "Idioma",
    },
    hero: {
      badge: "INGENIERÍA DE HARDWARE AUTÓNOMA",
      heading: "Agentic Hardware Lab: CAD Mecánico Zero-GUI, Física e Impresión 3D",
      subheading:
        "Diseña piezas mecánicas B-Rep, verifica cinemática y estrés FEA, y genera G-code listo para fabricar desde Claude Code, Codex, Cursor o Antigravity.",
      simulateBtn: "Simular Loop del Agente",
      simulatingBtn: "Ejecutando Loop Cerrado...",
      resetBtn: "Reiniciar Loop",
      loopStatusIdle: "INACTIVO — Haz clic en Simular Loop o inspecciona cualquier nodo",
      loopStatusRunning: "EJECUTANDO — Enviando intención paramétrica...",
      loopStatusFailed: "FALLO EN PUERTA 3 — Interferencia en Dientes (-0.42mm)",
      loopStatusCorrecting: "AUTOCORRECCIÓN — Ajustando holgura de adendo en Etapa 2...",
      loopStatusPassed: "TODAS LAS PUERTAS OK — Listo para STEP / STL / G-Code",
      clickNodeHint: "Haz clic en cualquier etapa para ver .mcp.json, CLI y justificación técnica",
      drawerClose: "Cerrar",
      mcpConfigTitle: "Configuración del Servidor MCP (.mcp.json)",
      cliSetupTitle: "Instalación CLI Headless",
      whyStageTitle: "Por Qué Existe Esta Etapa",
      alternativesTitle: "Alternativas y Trade-offs",
    },
    cad: {
      sectionTitle: "Estudio Code-CAD Paramétrico en Vivo",
      sectionDesc:
        "Mueve los controles para actualizar el script Python build123d y regenerar la malla 3D y vistas ortográficas de inspección en tiempo real.",
      codePaneTitle: "planetary_gear.py (build123d)",
      viewportTitle: "Viewport CAD 3D (mm)",
      toothCount: "Módulo / Nº de Dientes",
      boreDiameter: "Diámetro del Eje",
      wallThickness: "Espesor de Pared",
      filletRadius: "Radio de Redondeo",
      volumeLabel: "Volumen",
      comLabel: "Centro de Masa",
      watertightLabel: "B-Rep Estanco",
      watertightPass: "APROBADO",
      exportStep: "Exportar STEP",
      exportStl: "Exportar STL",
      export3mf: "Exportar 3MF",
      views: {
        iso: "Iso",
        top: "Superior",
        front: "Frontal",
        right: "Derecha",
      },
    },
    physics: {
      sectionTitle: "Sandbox Interactivo de Física y FEA Estructural",
      sectionDesc:
        "Valida ensamblajes antes de imprimir: prueba cinemática planetaria en MuJoCo/Genesis o inspecciona tensión von Mises en CalculiX FEA.",
      modeKinematics: "Modo A: Cinemática y Robótica (MuJoCo / Genesis)",
      modeFea: "Modo B: Tensión Estructural FEA (FreeCAD + CalculiX)",
      motorTorque: "Torque del Motor",
      frictionCoeff: "Coeficiente de Fricción",
      payloadMass: "Masa de Carga",
      angularVelocity: "Velocidad Angular (rad/s)",
      backlashError: "Error de Holgura (rad)",
      pytestTitle: "Puerta de Aserción Pytest Headless",
      downwardLoad: "Carga Vertical Virtual",
      exaggeratedDeform: "Deformación Exagerada (12x)",
      peakStress: "Tensión Pico von Mises",
      maxDeflection: "Deflexión Máxima",
      safetyFactor: "Factor de Seguridad",
      materialComparison: "Comparación de Fluencia (Impresión 3D)",
      yieldStrength: "Fluencia",
      statusPass: "APROBADO",
      statusCaution: "MARGINAL",
      statusFail: "RIESGO",
    },
    slicer: {
      sectionTitle: "Slicer CLI Headless y Analizador de Imprimibilidad",
      sectionDesc:
        "Explora 240 capas horizontales para inspeccionar perímetros, relleno giroide y advertencias de voladizos >45° antes de ejecutar PrusaSlicer/OrcaSlicer.",
      layerScrubber: "Selector de Capa G-Code",
      layerOf: "de",
      showOverhangs: "Resaltar Voladizos >45°",
      cliTitle: "CLI Headless y Telemetría JSON",
      telemetryTitle: "Telemetría de Imprimibilidad",
      filamentUsed: "Filamento Usado",
      printTime: "Tiempo Estimado",
      supportVolume: "Volumen de Soporte",
      overhangDefects: "Defectos de Voladizo",
      infillLegend: "Relleno Giroide (25%)",
      overhangLegend: "Alerta de Voladizo >45°",
    },
    guide: {
      sectionTitle: "Guía Técnica Profunda: ¿Por Qué Esta Stack?",
      sectionDesc:
        "Comprende cada capa del pipeline zero-GUI: por qué se elige cada herramienta para agentes de IA, sus pros, contras y alternativas.",
      whyWeUseIt: "Por Qué Lo Usamos",
      prosLabel: "Pros",
      consLabel: "Contras",
      alternativesLabel: "Alternativas y Cuándo Cambiar",
      manufacturingNote: "Preparación para Fabricación",
    },
    curriculum: {
      sectionTitle: "Currículo Práctico en 5 Pasos",
      sectionDesc:
        "Copia configuraciones .mcp.json, scripts Python de CAD/física y prompts exactos para pegar en tu agente de código.",
      harnessLabel: "Agente / IDE Objetivo",
      mcpConfigTab: "Config .mcp.json",
      pythonScriptTab: "Script Python",
      systemPromptTab: "Prompt del Agente",
    },
    common: {
      copy: "Copiar",
      copied: "Copiado",
    },
  },
};
