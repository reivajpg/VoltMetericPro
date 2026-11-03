import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Move,
  GitCommit,
  MousePointer,
  RotateCw,
  Copy,
  FileCode,
  Layers,
  Sparkles,
  Sliders,
  Info,
  ArrowLeft,
  X,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CircuitRecord } from '../utils/pdfExport';

export type SymbolCategory = 'supply' | 'protection' | 'control' | 'load';

export type SymbolType =
  | 'grid_supply'
  | 'meter'
  | 'icp'
  | 'iga'
  | 'spd'
  | 'rccb'
  | 'mcb'
  | 'motor_breaker'
  | 'fuse'
  | 'contactor'
  | 'busbar'
  | 'terminal'
  | 'ground'
  | 'load_light'
  | 'load_socket'
  | 'load_hvac'
  | 'load_motor'
  | 'load_ev'
  | 'text_note';

export interface CADNode {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  designation: string; // e.g., IGA, ID1, C1, M1
  label: string; // e.g., Alumbrado General
  poles: string; // e.g., 2P, 4P, 1P+N
  calibre: string; // e.g., 16A, 25A, 40A
  curve: string; // e.g., C, D, B
  sensitivity?: string; // e.g., 30mA Clase A
  cableSpec?: string; // e.g., 2x2.5+T mm² Cu RZ1-K
  powerSpec?: string; // e.g., 3.68 kW · L=22m · ΔU=1.68%
  width?: number; // For busbar custom width
}

export interface CADWire {
  id: string;
  fromNodeId: string;
  fromPort: 'top' | 'bottom';
  toNodeId: string;
  toPort: 'top' | 'bottom';
  phases: '1F+N' | '3F+N' | 'CP';
  label?: string;
}

export interface CADTitleBlock {
  projectTitle: string;
  clientName: string;
  location: string;
  authorName: string;
  installerNumber: string;
  drawingCode: string;
  scale: string;
  normative: string;
  date: string;
}

interface SymbolDefinition {
  type: SymbolType;
  name: string;
  shortTag: string;
  category: SymbolCategory;
  defaultDesignation: string;
  defaultPoles: string;
  defaultCalibre: string;
  defaultCurve: string;
  description: string;
}

const SYMBOL_LIBRARY: SymbolDefinition[] = [
  {
    type: 'grid_supply',
    name: 'Red / Acometida BT',
    shortTag: 'RED',
    category: 'supply',
    defaultDesignation: 'RED',
    defaultPoles: '3F+N',
    defaultCalibre: '400/230V',
    defaultCurve: '50Hz',
    description: 'Punto de entrega de la compañía distribuidora (ITC-BT-11)'
  },
  {
    type: 'meter',
    name: 'Contador Medida (kWh)',
    shortTag: 'kWh',
    category: 'supply',
    defaultDesignation: 'M1',
    defaultPoles: '2P',
    defaultCalibre: 'Directa',
    defaultCurve: 'Cl.1',
    description: 'Equipo de medida de energía activa/reactiva (ITC-BT-16)'
  },
  {
    type: 'busbar',
    name: 'Embarrado / Peine Reparto',
    shortTag: 'BAR',
    category: 'supply',
    defaultDesignation: 'EMB1',
    defaultPoles: '2P / 4P',
    defaultCalibre: '63A',
    defaultCurve: 'Cu',
    description: 'Barra colectora de distribución para circuitos derivados'
  },
  {
    type: 'ground',
    name: 'Puesta a Tierra (PAT)',
    shortTag: 'PAT',
    category: 'supply',
    defaultDesignation: 'PE',
    defaultPoles: '1P',
    defaultCalibre: 'Cu 16mm²',
    defaultCurve: 'TT',
    description: 'Borne principal de tierra y pica (ITC-BT-18)'
  },
  {
    type: 'icp',
    name: 'ICP Limitador',
    shortTag: 'ICP',
    category: 'protection',
    defaultDesignation: 'ICP',
    defaultPoles: '2P',
    defaultCalibre: '40A',
    defaultCurve: 'M',
    description: 'Interruptor de Control de Potencia (ITC-BT-17)'
  },
  {
    type: 'iga',
    name: 'Interruptor General (IGA)',
    shortTag: 'IGA',
    category: 'protection',
    defaultDesignation: 'IGA',
    defaultPoles: '2P',
    defaultCalibre: '40A',
    defaultCurve: 'C',
    description: 'Interruptor General Automático de corte omnipolar (6kA)'
  },
  {
    type: 'spd',
    name: 'Protector Sobretensiones',
    shortTag: 'SPD',
    category: 'protection',
    defaultDesignation: 'SPD1',
    defaultPoles: '1P+N',
    defaultCalibre: '15kA',
    defaultCurve: 'Tipo 2',
    description: 'Descargador de sobretensiones transitorias/permanentes (ITC-BT-23)'
  },
  {
    type: 'rccb',
    name: 'Interruptor Diferencial',
    shortTag: 'ID',
    category: 'protection',
    defaultDesignation: 'ID1',
    defaultPoles: '2P',
    defaultCalibre: '40A',
    defaultCurve: 'Clase A',
    description: 'Protección contra contactos indirectos 30mA/300mA (ITC-BT-24)'
  },
  {
    type: 'mcb',
    name: 'Magnetotérmico (PIA)',
    shortTag: 'PIA',
    category: 'protection',
    defaultDesignation: 'C1',
    defaultPoles: '1P+N',
    defaultCalibre: '16A',
    defaultCurve: 'C',
    description: 'Pequeño Interruptor Automático para circuito interior (ITC-BT-25)'
  },
  {
    type: 'motor_breaker',
    name: 'Guardamotor Magnetot.',
    shortTag: 'QM',
    category: 'protection',
    defaultDesignation: 'QM1',
    defaultPoles: '3P',
    defaultCalibre: '14-20A',
    defaultCurve: 'D',
    description: 'Interruptor magnético-térmico regulable para motores (ITC-BT-47)'
  },
  {
    type: 'fuse',
    name: 'Fusible Seccionador',
    shortTag: 'FUS',
    category: 'protection',
    defaultDesignation: 'F1',
    defaultPoles: '1P',
    defaultCalibre: '63A',
    defaultCurve: 'gG',
    description: 'Cortacircuitos fusible de cuchilla o cilíndrico'
  },
  {
    type: 'contactor',
    name: 'Contactor de Potencia',
    shortTag: 'KM',
    category: 'control',
    defaultDesignation: 'KM1',
    defaultPoles: '4P',
    defaultCalibre: '25A',
    defaultCurve: 'AC-3',
    description: 'Contactor electromagnético de maniobra'
  },
  {
    type: 'terminal',
    name: 'Borna de Conexión',
    shortTag: 'X',
    category: 'control',
    defaultDesignation: 'X1',
    defaultPoles: '1P+N+PE',
    defaultCalibre: '16mm²',
    defaultCurve: '-',
    description: 'Regleta o borna de salida de cuadro eléctrico'
  },
  {
    type: 'load_light',
    name: 'Alumbrado / Luminaria',
    shortTag: 'LUX',
    category: 'load',
    defaultDesignation: 'E1',
    defaultPoles: '1F+N+PE',
    defaultCalibre: '10A',
    defaultCurve: 'LED',
    description: 'Receptor de iluminación interior o emergencia'
  },
  {
    type: 'load_socket',
    name: 'Toma de Corriente 16A',
    shortTag: 'TC',
    category: 'load',
    defaultDesignation: 'TC1',
    defaultPoles: '1F+N+PE',
    defaultCalibre: '16A',
    defaultCurve: 'Schuko',
    description: 'Base de enchufe 16A 2P+T (ITC-BT-25)'
  },
  {
    type: 'load_hvac',
    name: 'Climatización / Clima',
    shortTag: 'CLIM',
    category: 'load',
    defaultDesignation: 'CL1',
    defaultPoles: '1F+N+PE',
    defaultCalibre: '25A',
    defaultCurve: 'R32',
    description: 'Equipo de aire acondicionado o aerotermia'
  },
  {
    type: 'load_motor',
    name: 'Motor Asíncrono 3F',
    shortTag: 'M 3~',
    category: 'load',
    defaultDesignation: 'M1',
    defaultPoles: '3F+N+PE',
    defaultCalibre: '40A',
    defaultCurve: 'IE3',
    description: 'Motor eléctrico trifásico de inducción (ITC-BT-47)'
  },
  {
    type: 'load_ev',
    name: 'Punto Recarga VE',
    shortTag: 'SAVE',
    category: 'load',
    defaultDesignation: 'VE1',
    defaultPoles: '1F+N+PE',
    defaultCalibre: '32A',
    defaultCurve: 'Modo 3',
    description: 'Estación de recarga de vehículo eléctrico (ITC-BT-52)'
  }
];

function inferLoadSymbol(circuitName: string, conductors: string): SymbolType {
  const lower = circuitName.toLowerCase();
  if (lower.includes('alumbrado') || lower.includes('luz') || lower.includes('emergencia')) {
    return 'load_light';
  }
  if (lower.includes('clima') || lower.includes('ac') || lower.includes('calefacc') || lower.includes('aerotermia')) {
    return 'load_hvac';
  }
  if (lower.includes('vehículo') || lower.includes('vehiculo') || lower.includes('recarga') || lower.includes('ve')) {
    return 'load_ev';
  }
  if (lower.includes('motor') || lower.includes('fuerza') || conductors.includes('3F')) {
    return 'load_motor';
  }
  return 'load_socket';
}

export function generateCADFromCircuits(circuits: CircuitRecord[]): {
  nodes: CADNode[];
  wires: CADWire[];
} {
  const nodes: CADNode[] = [];
  const wires: CADWire[] = [];

  const count = Math.max(circuits.length, 1);
  const colSpacing = 175;
  const startX = 140;
  const totalWidth = Math.max((count - 1) * colSpacing, 340);
  const centerX = startX + totalWidth / 2;

  const maxCircuitIn = circuits.reduce((acc, c) => {
    const val = parseFloat(c.in.replace(',', '.')) || 16;
    return Math.max(acc, val);
  }, 25);
  const hasThreePhase = circuits.some((c) => c.conductores.includes('3F') || c.tension.startsWith('400'));
  const mainPoles = hasThreePhase ? '4P' : '2P';
  const mainPhaseType: '1F+N' | '3F+N' = hasThreePhase ? '3F+N' : '1F+N';
  const igaCalibre = maxCircuitIn >= 40 ? '63A' : '40A';

  nodes.push({
    id: 'node_supply',
    type: 'grid_supply',
    x: centerX,
    y: 60,
    rotation: 0,
    designation: 'ACOM',
    label: hasThreePhase ? 'Red 3x400/230V 50Hz' : 'Red 230V 50Hz',
    poles: mainPoles,
    calibre: hasThreePhase ? '400V' : '230V',
    curve: '50Hz',
    cableSpec: hasThreePhase ? 'DI: 4x16mm² Cu RZ1-K (AS)' : 'DI: 2x10mm² Cu RZ1-K (AS)'
  });

  nodes.push({
    id: 'node_meter',
    type: 'meter',
    x: centerX,
    y: 140,
    rotation: 0,
    designation: 'WH1',
    label: 'Contador Telegestión',
    poles: mainPoles,
    calibre: 'Directa',
    curve: 'Cl. 1'
  });

  nodes.push({
    id: 'node_iga',
    type: 'iga',
    x: centerX,
    y: 225,
    rotation: 0,
    designation: 'IGA',
    label: 'Interruptor General',
    poles: mainPoles,
    calibre: igaCalibre,
    curve: 'Curva C · 6kA'
  });

  const spdX = Math.max(60, centerX - 180);
  nodes.push({
    id: 'node_spd',
    type: 'spd',
    x: spdX,
    y: 265,
    rotation: 0,
    designation: 'SPD',
    label: 'Sobretensiones Combi',
    poles: mainPoles,
    calibre: '15kA (8/20)',
    curve: 'Tipo 2 + Perm.'
  });

  nodes.push({
    id: 'node_ground_main',
    type: 'ground',
    x: spdX,
    y: 345,
    rotation: 0,
    designation: 'PAT',
    label: 'Tierra General Cuadro',
    poles: 'PE',
    calibre: '16 mm² Cu',
    curve: 'Ra < 37Ω'
  });

  nodes.push({
    id: 'node_rccb',
    type: 'rccb',
    x: centerX,
    y: 315,
    rotation: 0,
    designation: 'ID1',
    label: 'Diferencial General',
    poles: mainPoles,
    calibre: igaCalibre,
    curve: 'Clase A',
    sensitivity: '30mA'
  });

  nodes.push({
    id: 'node_busbar',
    type: 'busbar',
    x: centerX,
    y: 390,
    rotation: 0,
    designation: 'EMB-1',
    label: `Peine Distribución ${mainPoles} ${igaCalibre}`,
    poles: mainPoles,
    calibre: igaCalibre,
    curve: 'Cu',
    width: totalWidth + 80
  });

  wires.push(
    {
      id: 'w_supply_meter',
      fromNodeId: 'node_supply',
      fromPort: 'bottom',
      toNodeId: 'node_meter',
      toPort: 'top',
      phases: mainPhaseType
    },
    {
      id: 'w_meter_iga',
      fromNodeId: 'node_meter',
      fromPort: 'bottom',
      toNodeId: 'node_iga',
      toPort: 'top',
      phases: mainPhaseType
    },
    {
      id: 'w_iga_spd',
      fromNodeId: 'node_iga',
      fromPort: 'bottom',
      toNodeId: 'node_spd',
      toPort: 'top',
      phases: mainPhaseType
    },
    {
      id: 'w_spd_gnd',
      fromNodeId: 'node_spd',
      fromPort: 'bottom',
      toNodeId: 'node_ground_main',
      toPort: 'top',
      phases: 'CP'
    },
    {
      id: 'w_iga_rccb',
      fromNodeId: 'node_iga',
      fromPort: 'bottom',
      toNodeId: 'node_rccb',
      toPort: 'top',
      phases: mainPhaseType
    },
    {
      id: 'w_rccb_busbar',
      fromNodeId: 'node_rccb',
      fromPort: 'bottom',
      toNodeId: 'node_busbar',
      toPort: 'top',
      phases: mainPhaseType
    }
  );

  circuits.forEach((circ, idx) => {
    const colX = startX + idx * colSpacing;
    const isTri = circ.conductores.includes('3F') || circ.tension.startsWith('400');
    const phaseTag: '1F+N' | '3F+N' = isTri ? '3F+N' : '1F+N';
    const poles = isTri ? '4P' : '1P+N';
    const parts = circ.id.split(' - ');
    const code = parts[0]?.trim() || `C${idx + 1}`;
    const desc = parts[1]?.trim() || circ.id;

    const mcbId = `node_mcb_${idx}`;
    const loadId = `node_load_${idx}`;

    nodes.push({
      id: mcbId,
      type: 'mcb',
      x: colX,
      y: 475,
      rotation: 0,
      designation: code,
      label: desc,
      poles,
      calibre: `${circ.in}A`,
      curve: 'Curva C · 6kA',
      cableSpec: `${circ.conductores} ${circ.seccion} (${circ.aisl})`,
      powerSpec: `${circ.carga}${circ.ud} · L=${circ.l}m · ΔU=${circ.deltaU}%`
    });

    const loadSymbol = inferLoadSymbol(circ.id, circ.conductores);
    nodes.push({
      id: loadId,
      type: loadSymbol,
      x: colX,
      y: 625,
      rotation: 0,
      designation: `R-${code}`,
      label: desc,
      poles: circ.conductores,
      calibre: `${circ.ib}A`,
      curve: `${circ.tension}V`,
      cableSpec: `Método ${circ.metodo} · Iz=${circ.iz}A`,
      powerSpec: `P=${circ.carga}${circ.ud} · ΔU=${circ.deltaU}%`
    });

    wires.push(
      {
        id: `w_bus_mcb_${idx}`,
        fromNodeId: 'node_busbar',
        fromPort: 'bottom',
        toNodeId: mcbId,
        toPort: 'top',
        phases: phaseTag
      },
      {
        id: `w_mcb_load_${idx}`,
        fromNodeId: mcbId,
        fromPort: 'bottom',
        toNodeId: loadId,
        toPort: 'top',
        phases: phaseTag,
        label: `${circ.seccion} Cu ${circ.aisl}`
      }
    );
  });

  return { nodes, wires };
}

export function ElectricalCADScreen({
  circuits,
  onShowToast,
  onNavigateBack
}: {
  circuits: CircuitRecord[];
  onShowToast: (msg: string) => void;
  onNavigateBack?: () => void;
}) {
  const [nodes, setNodes] = useState<CADNode[]>(() => {
    const saved = localStorage.getItem('voltmetric_cad_nodes_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return generateCADFromCircuits(circuits).nodes;
  });

  const [wires, setWires] = useState<CADWire[]>(() => {
    const saved = localStorage.getItem('voltmetric_cad_wires_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return generateCADFromCircuits(circuits).wires;
  });

  const [titleBlock, setTitleBlock] = useState<CADTitleBlock>(() => {
    const saved = localStorage.getItem('voltmetric_cad_titleblock');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      projectTitle: 'ESQUEMA UNIFILAR GENERAL DE BAJA TENSIÓN',
      clientName: 'Instalación Tipo REBT / Local Comercial',
      location: 'Madrid, España',
      authorName: 'Instalador Eléctrico Autorizado',
      installerNumber: 'IBTE-28-09421',
      drawingCode: 'PL-BT-01',
      scale: 'S/E (ISO A3)',
      normative: 'UNE-EN 60617 / R.D. 842/2002',
      date: new Date().toLocaleDateString('es-ES')
    };
  });

  // Responsive Panel States:
  // Only open by default on very wide monitors (>= 1360px) so mobile/tablet and mobile "Desktop mode" (~980px) get 100% canvas!
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1360 : false
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1440 : false
  );

  // CAD Viewport & Interaction State
  const [tool, setTool] = useState<'select' | 'pan' | 'wire'>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<{ nodeId: string; port: 'top' | 'bottom' } | null>(null);

  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 24, y: 16 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid] = useState<boolean>(true);
  const [blueprintDark, setBlueprintDark] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<SymbolCategory | 'all'>('all');

  // Refs for Canvas, Dragging & Pinch-to-Zoom
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    centerCanvasX: number;
    centerCanvasY: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_nodes_v1', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_wires_v1', JSON.stringify(wires));
  }, [wires]);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_titleblock', JSON.stringify(titleBlock));
  }, [titleBlock]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedWire = useMemo(
    () => wires.find((w) => w.id === selectedWireId) || null,
    [wires, selectedWireId]
  );

  // Smart Bounding-Box Auto-Fit (`fitToScreen`)
  const fitToScreen = useCallback(
    (targetNodes: CADNode[] = nodes) => {
      if (!containerRef.current || targetNodes.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      targetNodes.forEach((n) => {
        const halfW = n.type === 'busbar' ? (n.width || 360) / 2 : 45;
        const rightLabelAllowance = n.type === 'busbar' ? 20 : 155;
        minX = Math.min(minX, n.x - halfW);
        maxX = Math.max(maxX, n.x + halfW + rightLabelAllowance);
        minY = Math.min(minY, n.y - 45);
        maxY = Math.max(maxY, n.y + 80);
      });

      const contentW = Math.max(320, maxX - minX);
      const contentH = Math.max(300, maxY - minY);

      const padX = rect.width < 640 ? 24 : 56;
      const padY = rect.height < 640 ? 28 : 56;

      const scaleX = (rect.width - padX * 2) / contentW;
      const scaleY = (rect.height - padY * 2) / contentH;
      const optimalZoom = Math.max(0.28, Math.min(1.25, Math.min(scaleX, scaleY)));

      const centeredX = (rect.width - contentW * optimalZoom) / 2 - minX * optimalZoom;
      const centeredY = (rect.height - contentH * optimalZoom) / 2 - minY * optimalZoom;

      setZoom(+optimalZoom.toFixed(2));
      setPan({
        x: Math.round(centeredX),
        y: Math.round(centeredY)
      });
    },
    [nodes]
  );

  // Auto-fit on mount and when container dimensions change significantly (e.g. rotating mobile portrait <-> landscape)
  useEffect(() => {
    const timer = setTimeout(() => fitToScreen(nodes), 60);
    const handleOrientationOrResize = () => {
      fitToScreen(nodes);
    };
    window.addEventListener('orientationchange', handleOrientationOrResize);
    window.addEventListener('resize', handleOrientationOrResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('orientationchange', handleOrientationOrResize);
      window.removeEventListener('resize', handleOrientationOrResize);
    };
  }, [fitToScreen]);

  // Convert screen coordinates to SVG canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left - pan.x) / zoom;
    const rawY = (clientY - rect.top - pan.y) / zoom;
    return { x: rawX, y: rawY };
  };

  // Sync / Regenerate from project circuits
  const handleSyncFromProject = () => {
    const generated = generateCADFromCircuits(circuits);
    setNodes(generated.nodes);
    setWires(generated.wires);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    setTimeout(() => fitToScreen(generated.nodes), 50);
    onShowToast(`Esquema unifilar autogenerado con ${circuits.length} circuitos`);
  };

  // Add new symbol from library to viewport center
  const handleAddSymbol = (def: SymbolDefinition) => {
    const countSame = nodes.filter((n) => n.type === def.type).length + 1;
    const newId = `node_${def.type}_${Date.now()}`;

    const rect = containerRef.current?.getBoundingClientRect();
    const viewW = rect?.width || 600;
    const viewH = rect?.height || 450;
    const centerCanvasX = (viewW / 2 - pan.x) / zoom;
    const centerCanvasY = (viewH / 2 - pan.y) / zoom;

    const newX = Math.round(centerCanvasX / 20) * 20;
    const newY = Math.round(centerCanvasY / 20) * 20;

    const newNode: CADNode = {
      id: newId,
      type: def.type,
      x: Math.max(60, newX),
      y: Math.max(60, newY),
      rotation: 0,
      designation: `${def.defaultDesignation}${countSame > 1 ? countSame : ''}`,
      label: def.name,
      poles: def.defaultPoles,
      calibre: def.defaultCalibre,
      curve: def.defaultCurve,
      sensitivity: def.type === 'rccb' ? '30mA' : undefined,
      cableSpec: def.category === 'protection' ? '1F+N+CP Cu 2.5 mm² (Z1)' : undefined,
      width: def.type === 'busbar' ? 360 : undefined
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setSelectedWireId(null);
    setTool('select');
    // Close library drawer on mobile/tablet so the user immediately sees the placed symbol
    if (window.innerWidth < 1280) {
      setIsLibraryOpen(false);
    }
    onShowToast(`Símbolo insertado: ${def.name}`);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setWires((prev) =>
        prev.filter((w) => w.fromNodeId !== selectedNodeId && w.toNodeId !== selectedNodeId)
      );
      setSelectedNodeId(null);
      onShowToast('Elemento eliminado del plano');
    } else if (selectedWireId) {
      setWires((prev) => prev.filter((w) => w.id !== selectedWireId));
      setSelectedWireId(null);
      onShowToast('Conexión eliminada');
    }
  };

  const handleDuplicateSelected = () => {
    if (!selectedNode) return;
    const copyId = `node_${selectedNode.type}_${Date.now()}`;
    const duplicated: CADNode = {
      ...selectedNode,
      id: copyId,
      x: selectedNode.x + 60,
      y: selectedNode.y + 20,
      designation: `${selectedNode.designation}-B`
    };
    setNodes((prev) => [...prev, duplicated]);
    setSelectedNodeId(copyId);
    onShowToast('Componente duplicado');
  };

  const handleRotateSelected = () => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode.id ? { ...n, rotation: (n.rotation + 90) % 360 } : n
      )
    );
  };

  const updateSelectedNode = (patch: Partial<CADNode>) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, ...patch } : n))
    );
  };

  // Port click handler for creating wires
  const handlePortClick = (e: React.MouseEvent | React.TouchEvent, nodeId: string, port: 'top' | 'bottom') => {
    e.stopPropagation();
    if (!wireStart) {
      setWireStart({ nodeId, port });
      setTool('wire');
      onShowToast('Selecciona el borne de destino para conectar');
    } else {
      if (wireStart.nodeId === nodeId && wireStart.port === port) {
        setWireStart(null);
        return;
      }
      const newWire: CADWire = {
        id: `wire_${Date.now()}`,
        fromNodeId: wireStart.nodeId,
        fromPort: wireStart.port,
        toNodeId: nodeId,
        toPort: port,
        phases: '1F+N'
      };
      setWires((prev) => [...prev, newWire]);
      setWireStart(null);
      setTool('select');
      onShowToast('Línea eléctrica conectada');
    }
  };

  // Mouse handlers on SVG canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'pan' || e.button === 1 || e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (e.target === svgRef.current || (e.target as Element).id === 'cad-bg-rect') {
        setSelectedNodeId(null);
        setSelectedWireId(null);
        setWireStart(null);
      }
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: CADNode) => {
    e.stopPropagation();
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (tool === 'wire') {
      handlePortClick(e, node.id, wireStart ? 'top' : 'bottom');
      return;
    }
    setSelectedNodeId(node.id);
    setSelectedWireId(null);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      let nextX = coords.x - dragOffset.x;
      let nextY = coords.y - dragOffset.y;
      if (snapToGrid) {
        nextX = Math.round(nextX / 20) * 20;
        nextY = Math.round(nextY / 20) * 20;
      }
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId ? { ...n, x: Math.max(40, nextX), y: Math.max(40, nextY) } : n
        )
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.max(0.25, Math.min(2.2, +(zoom * delta).toFixed(2)));
    const scaleFactor = nextZoom / zoom;

    setPan({
      x: Math.round(mouseX - (mouseX - pan.x) * scaleFactor),
      y: Math.round(mouseY - (mouseY - pan.y) * scaleFactor)
    });
    setZoom(nextZoom);
  };

  // Touch handlers for 1-finger pan/drag and 2-finger pinch-to-zoom on mobile
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2 && svgRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = svgRef.current.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      pinchStateRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        centerCanvasX: (midX - pan.x) / zoom,
        centerCanvasY: (midY - pan.y) / zoom
      };
      setIsPanning(false);
      setDraggingNodeId(null);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      if (!draggingNodeId) {
        setIsPanning(true);
        setPanStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
      }
    }
  };

  const handleNodeTouchStart = (e: React.TouchEvent, node: CADNode) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const t = e.touches[0];
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
      return;
    }
    if (tool === 'wire') {
      handlePortClick(e, node.id, wireStart ? 'top' : 'bottom');
      return;
    }
    setSelectedNodeId(node.id);
    setSelectedWireId(null);
    const coords = getCanvasCoords(t.clientX, t.clientY);
    setDraggingNodeId(node.id);
    setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2 && pinchStateRef.current && svgRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / Math.max(10, pinchStateRef.current.initialDist);
      const nextZoom = Math.max(
        0.25,
        Math.min(2.2, +(pinchStateRef.current.initialZoom * ratio).toFixed(2))
      );

      const rect = svgRef.current.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      setZoom(nextZoom);
      setPan({
        x: Math.round(midX - pinchStateRef.current.centerCanvasX * nextZoom),
        y: Math.round(midY - pinchStateRef.current.centerCanvasY * nextZoom)
      });
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      if (draggingNodeId) {
        const coords = getCanvasCoords(t.clientX, t.clientY);
        let nextX = coords.x - dragOffset.x;
        let nextY = coords.y - dragOffset.y;
        if (snapToGrid) {
          nextX = Math.round(nextX / 20) * 20;
          nextY = Math.round(nextY / 20) * 20;
        }
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId ? { ...n, x: Math.max(40, nextX), y: Math.max(40, nextY) } : n
          )
        );
      } else if (isPanning) {
        setPan({
          x: t.clientX - panStart.x,
          y: t.clientY - panStart.y
        });
      }
    }
  };

  const handleTouchEnd = () => {
    pinchStateRef.current = null;
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Port coordinates helper
  const getPortPosition = (node: CADNode, port: 'top' | 'bottom', peerNode?: CADNode) => {
    if (node.type === 'busbar') {
      const halfW = (node.width || 360) / 2;
      const targetX = peerNode
        ? Math.max(node.x - halfW + 20, Math.min(node.x + halfW - 20, peerNode.x))
        : node.x;
      return {
        x: targetX,
        y: port === 'top' ? node.y - 6 : node.y + 6
      };
    }
    return {
      x: node.x,
      y: port === 'top' ? node.y - 28 : node.y + 28
    };
  };

  // Export to AutoCAD DXF (ASCII R12/2000 compatible)
  const handleExportDXF = () => {
    const lines: string[] = [];
    const pushEntity = (...items: (string | number)[]) => {
      items.forEach((it) => lines.push(String(it)));
    };

    pushEntity('0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC');
    pushEntity('0', 'SECTION', '2', 'ENTITIES');

    const cadY = (y: number) => 850 - y;

    const framePts = [
      [20, 20, 1120, 20],
      [1120, 20, 1120, 780],
      [1120, 780, 20, 780],
      [20, 780, 20, 20]
    ];
    framePts.forEach(([x1, y1, x2, y2]) => {
      pushEntity(
        '0', 'LINE',
        '8', 'CAJETIN_MARCO',
        '62', '7',
        '10', x1, '20', cadY(y1), '30', '0.0',
        '11', x2, '21', cadY(y2), '31', '0.0'
      );
    });

    wires.forEach((w) => {
      const fromNode = nodes.find((n) => n.id === w.fromNodeId);
      const toNode = nodes.find((n) => n.id === w.toNodeId);
      if (!fromNode || !toNode) return;
      const p1 = getPortPosition(fromNode, w.fromPort, toNode);
      const p2 = getPortPosition(toNode, w.toPort, fromNode);
      const midY = (p1.y + p2.y) / 2;

      const segments = [
        [p1.x, p1.y, p1.x, midY],
        [p1.x, midY, p2.x, midY],
        [p2.x, midY, p2.x, p2.y]
      ];
      segments.forEach(([x1, y1, x2, y2]) => {
        pushEntity(
          '0', 'LINE',
          '8', 'CABLEADO_BT',
          '62', w.phases === 'CP' ? '3' : '5',
          '10', x1.toFixed(2), '20', cadY(y1).toFixed(2), '30', '0.0',
          '11', x2.toFixed(2), '21', cadY(y2).toFixed(2), '31', '0.0'
        );
      });
    });

    nodes.forEach((n) => {
      if (n.type === 'busbar') {
        const half = (n.width || 360) / 2;
        pushEntity(
          '0', 'LINE',
          '8', 'EMBARRADO',
          '62', '1',
          '10', (n.x - half).toFixed(2), '20', cadY(n.y).toFixed(2), '30', '0.0',
          '11', (n.x + half).toFixed(2), '21', cadY(n.y).toFixed(2), '31', '0.0'
        );
      } else {
        pushEntity(
          '0', 'CIRCLE',
          '8', 'SIMBOLOS_IEC',
          '62', '4',
          '10', n.x.toFixed(2), '20', cadY(n.y).toFixed(2), '30', '0.0',
          '40', '16.0'
        );
      }

      pushEntity(
        '0', 'TEXT',
        '8', 'TEXTOS_TECNICOS',
        '62', '2',
        '10', (n.x + 22).toFixed(2), '20', cadY(n.y - 6).toFixed(2), '30', '0.0',
        '40', '8.5',
        '1', `${n.designation} (${n.poles} ${n.calibre})`
      );

      pushEntity(
        '0', 'TEXT',
        '8', 'TEXTOS_TECNICOS',
        '62', '7',
        '10', (n.x + 22).toFixed(2), '20', cadY(n.y + 8).toFixed(2), '30', '0.0',
        '40', '6.5',
        '1', n.label
      );

      if (n.cableSpec) {
        pushEntity(
          '0', 'TEXT',
          '8', 'CABLEADO_TEXTO',
          '62', '6',
          '10', (n.x + 14).toFixed(2), '20', cadY(n.y + 48).toFixed(2), '30', '0.0',
          '40', '5.5',
          '1', n.cableSpec
        );
      }
    });

    pushEntity(
      '0', 'TEXT',
      '8', 'CAJETIN_MARCO',
      '62', '7',
      '10', '700', '20', cadY(735).toFixed(2), '30', '0.0',
      '40', '10.0',
      '1', `${titleBlock.projectTitle} - ${titleBlock.drawingCode}`
    );

    pushEntity('0', 'ENDSEC', '0', 'EOF');

    const dxfContent = lines.join('\r\n');
    const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plano_Unifilar_${titleBlock.drawingCode}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Archivo AutoCAD (.DXF) exportado con capas IEC');
  };

  // Export clean SVG vector
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const rawSvg = serializer.serializeToString(svgRef.current);
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Esquema_Unifilar_${titleBlock.drawingCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Plano vectorial (.SVG) descargado correctamente');
  };

  // Export Normative Landscape PDF (Plano Técnico A3 con Cajetín REBT)
  const handleExportCADPdf = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3'
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.7);
    doc.rect(10, 10, pageW - 20, pageH - 20);
    doc.setLineWidth(0.25);
    doc.rect(12, 12, pageW - 24, pageH - 24);

    const scaleX = 370 / 1150;
    const scaleY = 220 / 740;
    const ox = 20;
    const oy = 18;

    const tx = (x: number) => ox + x * scaleX;
    const ty = (y: number) => oy + y * scaleY;

    doc.setDrawColor(235, 240, 245);
    doc.setLineWidth(0.1);
    for (let gx = 25; gx < pageW - 20; gx += 15) {
      doc.line(gx, 14, gx, pageH - 52);
    }
    for (let gy = 20; gy < pageH - 52; gy += 15) {
      doc.line(14, gy, pageW - 14, gy);
    }

    wires.forEach((w) => {
      const fromNode = nodes.find((n) => n.id === w.fromNodeId);
      const toNode = nodes.find((n) => n.id === w.toNodeId);
      if (!fromNode || !toNode) return;
      const p1 = getPortPosition(fromNode, w.fromPort, toNode);
      const p2 = getPortPosition(toNode, w.toPort, fromNode);
      const midY = (p1.y + p2.y) / 2;

      if (w.phases === 'CP') {
        doc.setDrawColor(22, 163, 74);
      } else if (w.phases === '3F+N') {
        doc.setDrawColor(37, 99, 235);
      } else {
        doc.setDrawColor(15, 23, 42);
      }
      doc.setLineWidth(0.45);
      doc.line(tx(p1.x), ty(p1.y), tx(p1.x), ty(midY));
      doc.line(tx(p1.x), ty(midY), tx(p2.x), ty(midY));
      doc.line(tx(p2.x), ty(midY), tx(p2.x), ty(p2.y));

      if (w.label) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(w.label, tx(p2.x) + 2, ty((p1.y + p2.y) / 2));
      }
    });

    nodes.forEach((n) => {
      const cx = tx(n.x);
      const cy = ty(n.y);

      if (n.type === 'busbar') {
        const halfW = ((n.width || 360) / 2) * scaleX;
        doc.setFillColor(180, 83, 9);
        doc.setDrawColor(146, 64, 14);
        doc.setLineWidth(0.6);
        doc.rect(cx - halfW, cy - 1.5, halfW * 2, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(146, 64, 14);
        doc.text(`${n.designation}: ${n.label}`, cx - halfW, cy - 3);
        return;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.45);

      if (n.type.startsWith('load_') || n.type === 'meter' || n.type === 'grid_supply') {
        doc.circle(cx, cy, 5.5, 'FD');
      } else {
        doc.roundedRect(cx - 5.5, cy - 6.5, 11, 13, 1, 1, 'FD');
        doc.line(cx - 2.5, cy + 3.5, cx + 2, cy - 3.5);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${n.designation}`, cx + 7, cy - 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`${n.poles} · ${n.calibre} ${n.curve}`, cx + 7, cy + 1.5);

      doc.setTextColor(71, 85, 105);
      doc.text(n.label.substring(0, 26), cx + 7, cy + 4.8);

      if (n.cableSpec) {
        doc.setFontSize(6);
        doc.setTextColor(15, 118, 110);
        doc.text(n.cableSpec.substring(0, 30), cx + 6, cy + 11);
      }
      if (n.powerSpec) {
        doc.setFontSize(5.8);
        doc.setTextColor(100, 116, 139);
        doc.text(n.powerSpec.substring(0, 32), cx + 6, cy + 14.2);
      }
    });

    const tbW = 165;
    const tbH = 36;
    const tbX = pageW - 12 - tbW;
    const tbY = pageH - 12 - tbH;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(tbX, tbY, tbW, tbH, 'FD');

    doc.setLineWidth(0.25);
    doc.line(tbX, tbY + 10, tbX + tbW, tbY + 10);
    doc.line(tbX, tbY + 23, tbX + tbW, tbY + 23);
    doc.line(tbX + 110, tbY, tbX + 110, tbY + tbH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleBlock.projectTitle, tbX + 4, tbY + 6.5);

    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text(`PLANO: ${titleBlock.drawingCode}`, tbX + 114, tbY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Titular: ${titleBlock.clientName}`, tbX + 4, tbY + 15);
    doc.text(`Emplazamiento: ${titleBlock.location}`, tbX + 4, tbY + 20.5);

    doc.text(`Norma: ${titleBlock.normative}`, tbX + 114, tbY + 15);
    doc.text(`Escala: ${titleBlock.scale}`, tbX + 114, tbY + 20.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Autor / Instalador: ${titleBlock.authorName}`, tbX + 4, tbY + 28.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº Carnet / Colegiado: ${titleBlock.installerNumber}`, tbX + 4, tbY + 33.5);

    doc.text(`Fecha: ${titleBlock.date}`, tbX + 114, tbY + 28.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('VoltMetric Pro CAD', tbX + 114, tbY + 33.5);

    doc.save(`Plano_Unifilar_${titleBlock.drawingCode}.pdf`);
    onShowToast('Plano Técnico A3 con Cajetín REBT exportado en PDF');
  };

  const filteredLibrary = useMemo(() => {
    if (activeCategory === 'all') return SYMBOL_LIBRARY;
    return SYMBOL_LIBRARY.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const theme = blueprintDark
    ? {
        canvasBg: '#0B1120',
        gridMajor: '#1E293B',
        gridMinor: '#131D31',
        strokeMain: '#E2E8F0',
        strokeAccent: '#38BDF8',
        strokeProtection: '#60A5FA',
        strokeGround: '#4ADE80',
        strokeBusbar: '#F59E0B',
        nodeFill: '#0F172A',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        textCable: '#34D399'
      }
    : {
        canvasBg: '#FFFFFF',
        gridMajor: '#E2E8F0',
        gridMinor: '#F1F5F9',
        strokeMain: '#0F172A',
        strokeAccent: '#0284C7',
        strokeProtection: '#1D4ED8',
        strokeGround: '#16A34A',
        strokeBusbar: '#D97706',
        nodeFill: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textCable: '#0F766E'
      };

  // Shared Inspector Content (used in desktop panel and mobile bottom drawer)
  const renderInspectorContent = () => {
    if (selectedNode) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Propiedades IEC
              </span>
              <h3 className="font-headline font-bold text-sm text-on-surface truncate">
                {selectedNode.designation} — {selectedNode.label}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleRotateSelected}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary cursor-pointer"
                title="Rotar 90°"
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={handleDuplicateSelected}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary cursor-pointer"
                title="Duplicar Bloque"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-lg bg-error-container/20 hover:bg-error-container/40 text-error cursor-pointer"
                title="Eliminar Componente"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer ml-1"
                title="Cerrar Panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Tag / Designación
                </label>
                <input
                  type="text"
                  value={selectedNode.designation}
                  onChange={(e) => updateSelectedNode({ designation: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono font-bold text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Calibre Nominal (In)
                </label>
                <input
                  type="text"
                  value={selectedNode.calibre}
                  onChange={(e) => updateSelectedNode({ calibre: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Descripción / Circuito
              </label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => updateSelectedNode({ label: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Polos / Fases
                </label>
                <select
                  value={selectedNode.poles}
                  onChange={(e) => updateSelectedNode({ poles: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
                >
                  <option value="1P+N">1P+N</option>
                  <option value="2P">2P</option>
                  <option value="3P">3P</option>
                  <option value="3P+N">3P+N</option>
                  <option value="4P">4P</option>
                  <option value="1F+N+PE">1F+N+PE</option>
                  <option value="3F+N+PE">3F+N+PE</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Curva / Tipo
                </label>
                <input
                  type="text"
                  value={selectedNode.curve}
                  onChange={(e) => updateSelectedNode({ curve: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Sensib. Δn
                </label>
                <input
                  type="text"
                  placeholder="30mA"
                  value={selectedNode.sensitivity || ''}
                  onChange={(e) => updateSelectedNode({ sensitivity: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
                />
              </div>
            </div>

            {selectedNode.type === 'busbar' && (
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Longitud de Embarrado (px)
                </label>
                <input
                  type="number"
                  min={160}
                  max={1200}
                  step={20}
                  value={selectedNode.width || 360}
                  onChange={(e) =>
                    updateSelectedNode({ width: Math.max(160, Number(e.target.value)) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface tabular-nums"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Especificación de Línea (Cable / Aisl.)
              </label>
              <input
                type="text"
                placeholder="Ej. 1F+N+CP Cu 2.5 mm² (Z1)"
                value={selectedNode.cableSpec || ''}
                onChange={(e) => updateSelectedNode({ cableSpec: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Cálculo Eléctrico (P / L / ΔU%)
              </label>
              <input
                type="text"
                placeholder="Ej. 3.68kW · L=22m · ΔU=1.68%"
                value={selectedNode.powerSpec || ''}
                onChange={(e) => updateSelectedNode({ powerSpec: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>
          </div>
        </div>
      );
    }

    if (selectedWire) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Línea / Conductor
              </span>
              <h3 className="font-headline font-bold text-sm text-on-surface">
                Conexión Unifilar
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-lg bg-error-container/20 hover:bg-error-container/40 text-error cursor-pointer"
                title="Eliminar Hilo"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                title="Cerrar Panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Sistema de Fases
              </label>
              <select
                value={selectedWire.phases}
                onChange={(e) =>
                  setWires((prev) =>
                    prev.map((w) =>
                      w.id === selectedWire.id
                        ? { ...w, phases: e.target.value as CADWire['phases'] }
                        : w
                    )
                  )
                }
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              >
                <option value="1F+N">Monofásico (1F+N+PE)</option>
                <option value="3F+N">Trifásico (3F+N+PE)</option>
                <option value="CP">Conductor Protección (PE)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Etiqueta de Tramo
              </label>
              <input
                type="text"
                value={selectedWire.label || ''}
                placeholder="Ej. 2.5 mm² Cu RZ1-K"
                onChange={(e) =>
                  setWires((prev) =>
                    prev.map((w) =>
                      w.id === selectedWire.id ? { ...w, label: e.target.value } : w
                    )
                  )
                }
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
              Cajetín Técnico UNE / REBT
            </span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              Datos del Plano Unifilar
            </h3>
          </div>
          <button
            onClick={() => setIsInspectorOpen(false)}
            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
            title="Cerrar Panel"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-on-surface-variant mb-1">
              Título del Plano
            </label>
            <input
              type="text"
              value={titleBlock.projectTitle}
              onChange={(e) =>
                setTitleBlock((prev) => ({ ...prev, projectTitle: e.target.value }))
              }
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Código Plano
              </label>
              <input
                type="text"
                value={titleBlock.drawingCode}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, drawingCode: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Escala / Formato
              </label>
              <input
                type="text"
                value={titleBlock.scale}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, scale: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Titular / Promotor
              </label>
              <input
                type="text"
                value={titleBlock.clientName}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, clientName: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
              />
            </div>
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Emplazamiento
              </label>
              <input
                type="text"
                value={titleBlock.location}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Instalador Autorizado
              </label>
              <input
                type="text"
                value={titleBlock.authorName}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, authorName: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
              />
            </div>
            <div>
              <label className="block font-bold text-on-surface-variant mb-1">
                Nº Carnet / Colegiado
              </label>
              <input
                type="text"
                value={titleBlock.installerNumber}
                onChange={(e) =>
                  setTitleBlock((prev) => ({ ...prev, installerNumber: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 font-mono text-on-surface"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-122px)] md:h-[calc(100dvh-65px)] w-full bg-surface overflow-hidden select-none relative">
      {/* Compact Single-Row Scrollable Command Ribbon */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-container border-b border-outline-variant/25 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Volver al Panel Principal"
            >
              <ArrowLeft size={14} className="text-primary" />
              <span className="hidden sm:inline">Panel</span>
            </button>
          )}

          {/* Toggle Symbol Library Button */}
          <button
            onClick={() => {
              setIsLibraryOpen((prev) => !prev);
              if (window.innerWidth < 1024) setIsInspectorOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              isLibraryOpen
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-outline-variant/30'
            }`}
            title="Mostrar/Ocultar Librería de Símbolos IEC 60617"
          >
            <PanelLeft size={14} />
            <span>+ Símbolos IEC</span>
          </button>

          {/* Interaction Mode Segmented Switch */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/25 shrink-0">
            <button
              onClick={() => {
                setTool('select');
                setWireStart(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                tool === 'select'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Seleccionar y Mover Componentes"
            >
              <MousePointer size={13} />
              <span>Mover</span>
            </button>
            <button
              onClick={() => setTool('wire')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                tool === 'wire'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Conectar Hilo Ortogonal entre Bornes"
            >
              <GitCommit size={13} />
              <span>Hilo</span>
            </button>
            <button
              onClick={() => {
                setTool('pan');
                setWireStart(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                tool === 'pan'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Desplazar Lienzo con 1 dedo o ratón"
            >
              <Move size={13} />
              <span>Encuadrar</span>
            </button>
          </div>

          {/* Fit-to-Screen & Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/25 shrink-0">
            <button
              onClick={() => fitToScreen(nodes)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 rounded-md text-xs font-bold cursor-pointer transition-colors"
              title="Centrar y Ajustar todo el Esquema a la Pantalla"
            >
              <Maximize2 size={13} />
              <span>Centrar Plano</span>
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.12).toFixed(2)))}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
              title="Alejar Zoom"
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-bold text-on-surface tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.12).toFixed(2)))}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
              title="Acercar Zoom"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setShowGrid((g) => !g)}
              className={`p-1 rounded cursor-pointer ${
                showGrid ? 'text-primary bg-primary/10' : 'text-on-surface-variant'
              }`}
              title="Mostrar/Ocultar Cuadrícula"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setBlueprintDark((d) => !d)}
              className="px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
              title="Alternar Fondo CAD Oscuro / Papel Blanco"
            >
              {blueprintDark ? 'CAD' : 'Papel'}
            </button>
          </div>
        </div>

        {/* Right Actions: Auto-Generate, Inspector Toggle & Exports */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSyncFromProject}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            title="Autogenerar Esquema Unifilar desde los circuitos del proyecto"
          >
            <Sparkles size={13} />
            <span>Autogenerar ({circuits.length})</span>
          </button>

          <button
            onClick={() => {
              setIsInspectorOpen((prev) => !prev);
              if (window.innerWidth < 1024) setIsLibraryOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              isInspectorOpen
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-outline-variant/30'
            }`}
            title="Abrir Propiedades del Componente o Cajetín REBT"
          >
            <PanelRight size={14} />
            <span>{selectedNode ? `Editar ${selectedNode.designation}` : 'Cajetín / Prop.'}</span>
          </button>

          <button
            onClick={handleExportDXF}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Exportar a AutoCAD (.DXF)"
          >
            <FileCode size={13} className="text-amber-600" />
            <span>DXF</span>
          </button>
          <button
            onClick={handleExportSVG}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Exportar Vectorial (.SVG)"
          >
            <Layers size={13} className="text-sky-600" />
            <span>SVG</span>
          </button>
          <button
            onClick={handleExportCADPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            title="Exportar Plano Técnico A3 en PDF"
          >
            <Download size={13} />
            <span>PDF A3</span>
          </button>
        </div>
      </div>

      {/* Main CAD Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        {/* Desktop Collapsible Left Panel (lg+) */}
        {isLibraryOpen && (
          <aside className="hidden lg:flex w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex-col overflow-hidden shrink-0 z-20">
            <div className="p-3 border-b border-outline-variant/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Librería IEC 60617
                </span>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
                  title="Ocultar Librería para ampliar plano"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1 bg-surface-container p-1 rounded-lg text-[10px] font-bold">
                {[
                  { id: 'all', label: 'Todo' },
                  { id: 'supply', label: 'Red' },
                  { id: 'protection', label: 'Prot.' },
                  { id: 'control', label: 'Man.' },
                  { id: 'load', label: 'Carga' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as SymbolCategory | 'all')}
                    className={`py-1 rounded text-center transition-colors cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {filteredLibrary.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddSymbol(item)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-primary/40 transition-all text-left group cursor-pointer"
                  title={item.description}
                >
                  <div className="w-9 h-9 rounded-md bg-surface-container-highest/60 flex items-center justify-center font-mono font-bold text-[11px] text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    {item.shortTag}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant truncate">
                      {item.defaultDesignation} · {item.defaultPoles} · {item.defaultCalibre}
                    </p>
                  </div>
                  <Plus size={14} className="text-on-surface-variant group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Center 100% Responsive Interactive Vector SVG Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden w-full h-full bg-slate-950">
          {/* Active Wire Mode Banner */}
          {wireStart && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2">
              <GitCommit size={15} />
              <span>Toca el borne de destino para conectar la línea</span>
              <button
                onClick={() => setWireStart(null)}
                className="underline ml-2 text-[11px] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Floating Quick-Selection Pill at Bottom of Canvas */}
          {(selectedNode || selectedWire) && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 text-white border border-slate-700 shadow-xl max-w-[95vw] overflow-x-auto">
              {selectedNode ? (
                <>
                  <div className="pr-2 border-r border-slate-700 text-xs shrink-0">
                    <span className="font-mono font-bold text-sky-400 mr-1.5">
                      {selectedNode.designation}
                    </span>
                    <span className="font-medium text-slate-200">
                      {selectedNode.poles} · {selectedNode.calibre}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsInspectorOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                  >
                    <Sliders size={13} />
                    <span>Propiedades</span>
                  </button>
                  <button
                    onClick={handleRotateSelected}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
                    title="Rotar 90°"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    onClick={handleDuplicateSelected}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 cursor-pointer shrink-0"
                    title="Borrar"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs font-mono text-sky-400 pr-2 border-r border-slate-700">
                    Línea {selectedWire?.phases}
                  </span>
                  <button
                    onClick={() => setIsInspectorOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    <Sliders size={13} />
                    <span>Editar Tramo</span>
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          <svg
            ref={svgRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full h-full touch-none ${
              tool === 'pan' || isPanning
                ? 'cursor-grab active:cursor-grabbing'
                : tool === 'wire'
                ? 'cursor-crosshair'
                : 'cursor-default'
            }`}
            style={{ backgroundColor: theme.canvasBg }}
          >
            <defs>
              <pattern
                id="cad-grid-minor"
                width={20 * zoom}
                height={20 * zoom}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x},${pan.y})`}
              >
                <path
                  d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
                  fill="none"
                  stroke={theme.gridMinor}
                  strokeWidth="1"
                />
              </pattern>
              <pattern
                id="cad-grid-major"
                width={100 * zoom}
                height={100 * zoom}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x},${pan.y})`}
              >
                <rect width={100 * zoom} height={100 * zoom} fill="url(#cad-grid-minor)" />
                <path
                  d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`}
                  fill="none"
                  stroke={theme.gridMajor}
                  strokeWidth="1.2"
                />
              </pattern>
            </defs>

            {/* Grid Background */}
            <rect
              id="cad-bg-rect"
              width="100%"
              height="100%"
              fill={showGrid ? 'url(#cad-grid-major)' : theme.canvasBg}
            />

            {/* Main Transformed CAD Viewport Group */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Normative Sheet Frame A3 (1160 x 760) */}
              <rect
                x={20}
                y={20}
                width={1160}
                height={760}
                fill="none"
                stroke={theme.strokeMain}
                strokeWidth={2}
                opacity={0.4}
                pointerEvents="none"
              />
              <rect
                x={28}
                y={28}
                width={1144}
                height={744}
                fill="none"
                stroke={theme.strokeMain}
                strokeWidth={0.8}
                opacity={0.25}
                pointerEvents="none"
              />

              {/* Render Orthogonal Wires */}
              {wires.map((w) => {
                const fromNode = nodes.find((n) => n.id === w.fromNodeId);
                const toNode = nodes.find((n) => n.id === w.toNodeId);
                if (!fromNode || !toNode) return null;

                const p1 = getPortPosition(fromNode, w.fromPort, toNode);
                const p2 = getPortPosition(toNode, w.toPort, fromNode);
                const midY = (p1.y + p2.y) / 2;
                const pathData = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
                const isSelected = selectedWireId === w.id;

                const strokeColor = isSelected
                  ? '#F43F5E'
                  : w.phases === 'CP'
                  ? theme.strokeGround
                  : w.phases === '3F+N'
                  ? theme.strokeAccent
                  : theme.strokeMain;

                const slashX = p2.x;
                const slashY = (midY + p2.y) / 2;

                return (
                  <g
                    key={w.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(w.id);
                      setSelectedNodeId(null);
                    }}
                    className="cursor-pointer"
                  >
                    <path d={pathData} fill="none" stroke="transparent" strokeWidth={16} />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={w.phases === 'CP' ? '5,3' : undefined}
                    />
                    {(fromNode.type === 'busbar' || toNode.type === 'busbar') && (
                      <circle cx={p1.x} cy={p1.y} r={3.8} fill={theme.strokeBusbar} />
                    )}
                    {Math.abs(p2.y - midY) > 25 && (
                      <g transform={`translate(${slashX}, ${slashY})`}>
                        <line
                          x1={-5}
                          y1={4}
                          x2={5}
                          y2={-4}
                          stroke={theme.strokeAccent}
                          strokeWidth={1.5}
                        />
                        <text
                          x={8}
                          y={3}
                          fill={theme.textSecondary}
                          fontSize={9.5}
                          fontFamily="monospace"
                        >
                          {w.phases === '3F+N' ? '3F+N+PE' : w.phases === 'CP' ? 'PE' : '1F+N+PE'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render IEC 60617 Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const topPort = getPortPosition(node, 'top');
                const bottomPort = getPortPosition(node, 'bottom');

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onTouchStart={(e) => handleNodeTouchStart(e, node)}
                    className="cursor-move"
                  >
                    {isSelected && (
                      <rect
                        x={node.type === 'busbar' ? -(node.width || 360) / 2 - 8 : -34}
                        y={node.type === 'busbar' ? -16 : -34}
                        width={node.type === 'busbar' ? (node.width || 360) + 16 : 68}
                        height={node.type === 'busbar' ? 32 : 68}
                        rx={6}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth={2}
                        strokeDasharray="4,3"
                      />
                    )}

                    <IECSymbolGraphic node={node} theme={theme} />

                    {node.type !== 'busbar' ? (
                      <g transform="translate(24, 0)">
                        <text
                          x={0}
                          y={-8}
                          fill={theme.textPrimary}
                          fontSize={11.5}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.designation}
                        </text>
                        <text
                          x={0}
                          y={4}
                          fill={theme.strokeAccent}
                          fontSize={10}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.poles} · {node.calibre}{' '}
                          {node.sensitivity ? `· ${node.sensitivity}` : node.curve}
                        </text>
                        <text x={0} y={16} fill={theme.textSecondary} fontSize={10}>
                          {node.label.length > 24 ? `${node.label.slice(0, 24)}…` : node.label}
                        </text>
                        {node.cableSpec && (
                          <text
                            x={-16}
                            y={48}
                            fill={theme.textCable}
                            fontSize={9}
                            fontFamily="monospace"
                          >
                            {node.cableSpec}
                          </text>
                        )}
                        {node.powerSpec && (
                          <text
                            x={-16}
                            y={60}
                            fill={theme.textSecondary}
                            fontSize={8.5}
                            fontFamily="monospace"
                          >
                            {node.powerSpec}
                          </text>
                        )}
                      </g>
                    ) : (
                      <text
                        x={-(node.width || 360) / 2}
                        y={-12}
                        fill={theme.strokeBusbar}
                        fontSize={11.5}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.designation} — {node.label}
                      </text>
                    )}

                    {/* Top & Bottom Interactive Connection Ports */}
                    {node.type !== 'grid_supply' && (
                      <circle
                        cx={topPort.x - node.x}
                        cy={topPort.y - node.y}
                        r={5.5}
                        fill={
                          wireStart?.nodeId === node.id && wireStart.port === 'top'
                            ? '#F59E0B'
                            : theme.nodeFill
                        }
                        stroke={theme.strokeAccent}
                        strokeWidth={2}
                        onClick={(e) => handlePortClick(e, node.id, 'top')}
                        onTouchEnd={(e) => handlePortClick(e, node.id, 'top')}
                        className="cursor-crosshair"
                      />
                    )}
                    {node.type !== 'ground' && !node.type.startsWith('load_') && (
                      <circle
                        cx={bottomPort.x - node.x}
                        cy={bottomPort.y - node.y}
                        r={5.5}
                        fill={
                          wireStart?.nodeId === node.id && wireStart.port === 'bottom'
                            ? '#F59E0B'
                            : theme.nodeFill
                        }
                        stroke={theme.strokeAccent}
                        strokeWidth={2}
                        onClick={(e) => handlePortClick(e, node.id, 'bottom')}
                        onTouchEnd={(e) => handlePortClick(e, node.id, 'bottom')}
                        className="cursor-crosshair"
                      />
                    )}
                  </g>
                );
              })}

              {/* Normative REBT / UNE Title Block in Bottom-Right of Sheet */}
              <g
                transform="translate(740, 675)"
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedWireId(null);
                  setIsInspectorOpen(true);
                }}
                className="cursor-pointer"
              >
                <rect
                  x={0}
                  y={0}
                  width={432}
                  height={97}
                  fill={theme.nodeFill}
                  stroke={theme.strokeMain}
                  strokeWidth={1.5}
                />
                <line x1={0} y1={28} x2={432} y2={28} stroke={theme.strokeMain} strokeWidth={1} />
                <line x1={0} y1={64} x2={432} y2={64} stroke={theme.strokeMain} strokeWidth={1} />
                <line x1={290} y1={0} x2={290} y2={97} stroke={theme.strokeMain} strokeWidth={1} />

                <text
                  x={12}
                  y={18}
                  fill={theme.textPrimary}
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {titleBlock.projectTitle}
                </text>
                <text
                  x={300}
                  y={18}
                  fill={theme.strokeAccent}
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {titleBlock.drawingCode}
                </text>

                <text x={12} y={44} fill={theme.textSecondary} fontSize={9.5}>
                  Titular: {titleBlock.clientName}
                </text>
                <text x={12} y={58} fill={theme.textSecondary} fontSize={9.5}>
                  Emplazamiento: {titleBlock.location}
                </text>

                <text x={300} y={44} fill={theme.textSecondary} fontSize={9} fontFamily="monospace">
                  {titleBlock.normative}
                </text>
                <text x={300} y={58} fill={theme.textSecondary} fontSize={9} fontFamily="monospace">
                  Escala: {titleBlock.scale}
                </text>

                <text x={12} y={80} fill={theme.textPrimary} fontSize={9.5} fontWeight="bold">
                  Instalador: {titleBlock.authorName}
                </text>
                <text x={12} y={92} fill={theme.textSecondary} fontSize={8.5} fontFamily="monospace">
                  Nº Registro: {titleBlock.installerNumber}
                </text>

                <text x={300} y={80} fill={theme.textSecondary} fontSize={9} fontFamily="monospace">
                  Fecha: {titleBlock.date}
                </text>
                <text
                  x={300}
                  y={92}
                  fill={theme.strokeAccent}
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  VoltMetric Pro CAD
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Desktop Collapsible Right Inspector Panel (lg+) */}
        {isInspectorOpen && (
          <aside className="hidden lg:flex w-72 bg-surface-container-lowest border-l border-outline-variant/20 flex-col overflow-y-auto shrink-0 z-20">
            {renderInspectorContent()}
          </aside>
        )}

        {/* Mobile / Tablet Bottom Sheet Drawer for IEC Symbol Library (<1024px) */}
        {isLibraryOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant/30 max-h-[72dvh] flex flex-col shadow-2xl">
              <div className="p-3 border-b border-outline-variant/15 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Insertar Símbolo IEC 60617
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    Toca un componente para añadirlo al centro del plano
                  </p>
                </div>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-1.5 rounded-lg bg-surface-container text-on-surface cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-3 pt-2">
                <div className="grid grid-cols-5 gap-1 bg-surface-container p-1 rounded-lg text-xs font-bold">
                  {[
                    { id: 'all', label: 'Todo' },
                    { id: 'supply', label: 'Red' },
                    { id: 'protection', label: 'Prot.' },
                    { id: 'control', label: 'Man.' },
                    { id: 'load', label: 'Carga' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as SymbolCategory | 'all')}
                      className={`py-1.5 rounded text-center transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-primary text-white'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLibrary.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAddSymbol(item)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 text-left cursor-pointer active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-mono font-bold text-xs text-primary shrink-0">
                      {item.shortTag}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant truncate">
                        {item.defaultDesignation} · {item.defaultPoles} · {item.defaultCalibre}
                      </p>
                    </div>
                    <Plus size={16} className="text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile / Tablet Bottom Sheet Drawer for Property Inspector & Title Block (<1024px) */}
        {isInspectorOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant/30 max-h-[78dvh] overflow-y-auto shadow-2xl">
              {renderInspectorContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- IEC 60617 Standard Vector Symbol Renderer ---
function IECSymbolGraphic({
  node,
  theme
}: {
  node: CADNode;
  theme: {
    strokeMain: string;
    strokeAccent: string;
    strokeProtection: string;
    strokeGround: string;
    strokeBusbar: string;
    nodeFill: string;
    textPrimary: string;
  };
}) {
  switch (node.type) {
    case 'busbar': {
      const w = node.width || 360;
      return (
        <g>
          <rect
            x={-w / 2}
            y={-4}
            width={w}
            height={8}
            rx={2}
            fill={theme.strokeBusbar}
            stroke={theme.strokeMain}
            strokeWidth={1.2}
          />
        </g>
      );
    }

    case 'grid_supply':
      return (
        <g>
          <circle
            cx={0}
            cy={0}
            r={18}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          <path
            d="M -10 0 Q -5 -8 0 0 T 10 0"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          <line x1={0} y1={18} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'meter':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-18}
            y={-18}
            width={36}
            height={36}
            rx={4}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={theme.strokeAccent}
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
          >
            kWh
          </text>
          <line x1={0} y1={18} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'icp':
    case 'iga':
    case 'mcb':
    case 'motor_breaker':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-14} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-16}
            y={-18}
            width={32}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={node.type === 'iga' ? theme.strokeAccent : theme.strokeProtection}
            strokeWidth={1.8}
          />
          <line x1={-3.5} y1={-15.5} x2={3.5} y2={-8.5} stroke={theme.strokeMain} strokeWidth={1.6} />
          <line x1={3.5} y1={-15.5} x2={-3.5} y2={-8.5} stroke={theme.strokeMain} strokeWidth={1.6} />
          <line x1={0} y1={12} x2={-9} y2={-10} stroke={theme.strokeAccent} strokeWidth={2} />
          <rect
            x={-9}
            y={-3}
            width={5}
            height={6}
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.2}
          />
          <line x1={0} y1={12} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'rccb':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-14} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-18}
            y={-18}
            width={36}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          <ellipse
            cx={0}
            cy={10}
            rx={8}
            ry={3.5}
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.5}
          />
          <line x1={0} y1={12} x2={-8} y2={-11} stroke={theme.strokeMain} strokeWidth={2} />
          <line
            x1={-8}
            y1={10}
            x2={-5}
            y2={-2}
            stroke={theme.strokeAccent}
            strokeWidth={1.2}
            strokeDasharray="2,2"
          />
          <line x1={0} y1={12} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'spd':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-15}
            y={-16}
            width={30}
            height={32}
            rx={2}
            fill={theme.nodeFill}
            stroke={theme.strokeBusbar}
            strokeWidth={1.8}
          />
          <polygon points="0,8 -6,-6 6,-6" fill={theme.strokeBusbar} />
          <line x1={-7} y1={8} x2={7} y2={8} stroke={theme.strokeBusbar} strokeWidth={2} />
          <line x1={0} y1={16} x2={0} y2={28} stroke={theme.strokeGround} strokeWidth={1.8} />
        </g>
      );

    case 'ground':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-4} stroke={theme.strokeGround} strokeWidth={2} />
          <line x1={-16} y1={-4} x2={16} y2={-4} stroke={theme.strokeGround} strokeWidth={2.2} />
          <line x1={-10} y1={3} x2={10} y2={3} stroke={theme.strokeGround} strokeWidth={2.2} />
          <line x1={-4} y1={10} x2={4} y2={10} stroke={theme.strokeGround} strokeWidth={2.2} />
        </g>
      );

    case 'fuse':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-8}
            y={-14}
            width={16}
            height={28}
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
        </g>
      );

    case 'contactor':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-12} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-15}
            y={-16}
            width={30}
            height={32}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.6}
          />
          <path
            d="M -4 -12 A 4 4 0 0 1 4 -12"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.6}
          />
          <line x1={0} y1={12} x2={-8} y2={-10} stroke={theme.strokeMain} strokeWidth={2} />
          <line x1={0} y1={12} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'load_light':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          <circle
            cx={0}
            cy={0}
            r={16}
            fill={theme.nodeFill}
            stroke={theme.strokeBusbar}
            strokeWidth={2}
          />
          <line x1={-11} y1={-11} x2={11} y2={11} stroke={theme.strokeBusbar} strokeWidth={1.8} />
          <line x1={11} y1={-11} x2={-11} y2={11} stroke={theme.strokeBusbar} strokeWidth={1.8} />
        </g>
      );

    case 'load_socket':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-10} stroke={theme.strokeMain} strokeWidth={1.8} />
          <circle
            cx={0}
            cy={2}
            r={16}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
          <path
            d="M -10 8 A 10 10 0 0 1 10 8"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          <line x1={0} y1={-10} x2={0} y2={-2} stroke={theme.strokeAccent} strokeWidth={2} />
        </g>
      );

    case 'load_motor':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          <circle
            cx={0}
            cy={0}
            r={18}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            fill={theme.textPrimary}
            fontSize={11}
            fontWeight="bold"
            fontFamily="monospace"
          >
            M
          </text>
          <text
            x={0}
            y={11}
            textAnchor="middle"
            fill={theme.strokeAccent}
            fontSize={8.5}
            fontFamily="monospace"
          >
            3~
          </text>
        </g>
      );

    case 'load_ev':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-16}
            y={-18}
            width={32}
            height={36}
            rx={5}
            fill={theme.nodeFill}
            stroke={theme.strokeGround}
            strokeWidth={2}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={theme.strokeGround}
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
          >
            EV
          </text>
        </g>
      );

    default:
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-16}
            y={-16}
            width={32}
            height={32}
            rx={4}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={theme.textPrimary}
            fontSize={9}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.designation.slice(0, 4)}
          </text>
          <line x1={0} y1={16} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );
  }
}
