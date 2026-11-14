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
  PanelRight,
  Undo2,
  Redo2,
  ChevronDown,
  Check,
  Image as ImageIcon,
  FileText,
  Zap,
  BookmarkCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CircuitRecord, PanelBoardConfig, DEFAULT_PANEL_CONFIG } from '../utils/pdfExport';

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
  | 'subpanel'
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
  },
  {
    type: 'subpanel',
    name: 'Subcuadro Secundario',
    shortTag: 'S-CUAD',
    category: 'control',
    defaultDesignation: 'SC1',
    defaultPoles: '2P / 4P',
    defaultCalibre: '32A',
    defaultCurve: 'REBT',
    description: 'Subcuadro de distribución secundaria o planta (ITC-BT-17/25)'
  }
];

export interface REBTPreset {
  code: string;
  name: string;
  poles: string;
  in: string;
  section: string;
  loadType: SymbolType;
  defaultPower: string;
  powerKw: number;
  description: string;
  loadLabel: string;
}

export const REBT_PRESETS: REBTPreset[] = [
  {
    code: 'C1',
    name: 'Iluminación',
    poles: '1P+N',
    in: '10A',
    section: '1.5 mm² Cu RZ1-K',
    loadType: 'load_light',
    defaultPower: '2.30 kW · Máx 30 puntos',
    powerKw: 2.3,
    description: 'Iluminación interior general y emergencias (ITC-BT-25)',
    loadLabel: 'Puntos de Alumbrado'
  },
  {
    code: 'C2',
    name: 'Tomas Generales',
    poles: '1P+N',
    in: '16A',
    section: '2.5 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '3.68 kW · Máx 20 tomas',
    powerKw: 3.68,
    description: 'Bases de enchufe uso general y frigorífico (ITC-BT-25)',
    loadLabel: 'Tomas 16A 2P+T'
  },
  {
    code: 'C3',
    name: 'Cocina y Horno',
    poles: '2P',
    in: '25A',
    section: '6.0 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '5.40 kW · Placa + Horno',
    powerKw: 5.4,
    description: 'Cocina eléctrica, vitro/inducción y horno (ITC-BT-25)',
    loadLabel: 'Toma Cocina / Horno 25A'
  },
  {
    code: 'C4',
    name: 'Lavadora / Termo / Lavavaj.',
    poles: '2P',
    in: '20A',
    section: '4.0 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '4.60 kW · 3 tomas ded.',
    powerKw: 4.6,
    description: 'Lavadora, lavavajillas y calentador/termo (ITC-BT-25)',
    loadLabel: 'Lavadora / Termo / Lavavaj.'
  },
  {
    code: 'C5',
    name: 'Tomas Baño y Cocina',
    poles: '1P+N',
    in: '16A',
    section: '2.5 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '3.68 kW · Máx 6 tomas',
    powerKw: 3.68,
    description: 'Tomas de cuartos de baño y auxiliares de cocina (ITC-BT-25)',
    loadLabel: 'Tomas Aux. Baño/Cocina'
  },
  {
    code: 'C6',
    name: 'Iluminación Adicional',
    poles: '1P+N',
    in: '10A',
    section: '1.5 mm² Cu RZ1-K',
    loadType: 'load_light',
    defaultPower: '2.30 kW · Puntos extra',
    powerKw: 2.3,
    description: 'Circuito suplementario iluminación >30 puntos (ITC-BT-25)',
    loadLabel: 'Alumbrado Suplementario'
  },
  {
    code: 'C7',
    name: 'Tomas Adicionales',
    poles: '1P+N',
    in: '16A',
    section: '2.5 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '3.68 kW · Tomas extra',
    powerKw: 3.68,
    description: 'Circuito suplementario de tomas >20 puntos (ITC-BT-25)',
    loadLabel: 'Tomas Suplementarias 16A'
  },
  {
    code: 'C8',
    name: 'Calefacción Eléctrica',
    poles: '2P',
    in: '25A',
    section: '6.0 mm² Cu RZ1-K',
    loadType: 'load_hvac',
    defaultPower: '5.75 kW · Radiadores',
    powerKw: 5.75,
    description: 'Emisores térmicos y calefacción eléctrica (ITC-BT-25)',
    loadLabel: 'Emisores Calefacción'
  },
  {
    code: 'C9',
    name: 'Aire Acondicionado / Clima',
    poles: '2P',
    in: '25A',
    section: '6.0 mm² Cu RZ1-K',
    loadType: 'load_hvac',
    defaultPower: '5.75 kW · Aerotermia/Bomba',
    powerKw: 5.75,
    description: 'Equipo de climatización, aerotermia o split (ITC-BT-25)',
    loadLabel: 'Climatización / Aerotermia'
  },
  {
    code: 'C10',
    name: 'Secadora Independiente',
    poles: '1P+N',
    in: '16A',
    section: '2.5 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '3.68 kW · Toma ded.',
    powerKw: 3.68,
    description: 'Secadora de ropa independiente (ITC-BT-25)',
    loadLabel: 'Toma Secadora 16A'
  },
  {
    code: 'C11',
    name: 'Domótica / Automatización',
    poles: '1P+N',
    in: '10A',
    section: '1.5 mm² Cu RZ1-K',
    loadType: 'load_socket',
    defaultPower: '2.30 kW · Domótica',
    powerKw: 2.3,
    description: 'Sistema centralizado de domótica y seguridad (ITC-BT-25)',
    loadLabel: 'Central Domótica'
  },
  {
    code: 'C12',
    name: 'Punto Recarga VE',
    poles: '2P',
    in: '32A',
    section: '10.0 mm² Cu RZ1-K',
    loadType: 'load_ev',
    defaultPower: '7.40 kW · Modo 3 (ITC-BT-52)',
    powerKw: 7.4,
    description: 'Infraestructura de recarga de vehículos eléctricos (ITC-BT-52)',
    loadLabel: 'Punto Recarga VE (SAVE)'
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

export function generateCADFromCircuits(
  circuits: CircuitRecord[],
  customPanelConfig?: PanelBoardConfig
): {
  nodes: CADNode[];
  wires: CADWire[];
} {
  const nodes: CADNode[] = [];
  const wires: CADWire[] = [];

  // Load panelConfig from parameter or localStorage fallback
  let panelConfig: PanelBoardConfig = customPanelConfig || DEFAULT_PANEL_CONFIG;
  if (!customPanelConfig && typeof window !== 'undefined') {
    const savedCfg = localStorage.getItem('voltmetric_panel_config_v1');
    if (savedCfg) {
      try {
        panelConfig = { ...DEFAULT_PANEL_CONFIG, ...JSON.parse(savedCfg) };
      } catch (e) {}
    }
  }

  const maxCircuitIn = circuits.reduce((acc, c) => {
    const val = parseFloat((c.in || '16').replace(',', '.')) || 16;
    return Math.max(acc, val);
  }, 25);
  const sumCircuitIb = circuits.reduce((acc, c) => {
    const val = parseFloat((c.ib || '10').replace(',', '.')) || 10;
    return acc + val;
  }, 0);

  const hasThreePhase =
    panelConfig.igaPoles === '4P' ||
    circuits.some((c) => c.conductores.includes('3F') || c.tension.startsWith('400'));
  const mainPoles = hasThreePhase ? '4P' : '2P';
  const mainPhaseType: '1F+N' | '3F+N' = hasThreePhase ? '3F+N' : '1F+N';

  // Determine IGA calibre (either auto-sized or configured)
  const standardCalibres = [25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 400];
  const autoIgaVal =
    standardCalibres.find((cal) => cal >= Math.max(maxCircuitIn, sumCircuitIb * 0.75)) || 63;
  const igaCalibreNum = panelConfig.igaAutoSize
    ? autoIgaVal
    : parseInt(panelConfig.igaCalibre, 10) || autoIgaVal;
  const igaCalibre = `${igaCalibreNum}A`;

  // Group circuits by Differential Group
  const definedGroups =
    panelConfig.differentialGroups && panelConfig.differentialGroups.length > 0
      ? panelConfig.differentialGroups
      : DEFAULT_PANEL_CONFIG.differentialGroups;

  const groupBuckets: {
    group: {
      id: string;
      name: string;
      poles: '2P' | '4P';
      calibre: string;
      sensitivity: string;
      rccbClass: string;
    };
    items: { circ: CircuitRecord; origIdx: number }[];
  }[] = definedGroups.map((g) => ({
    group: g,
    items: []
  }));

  const directItems: { circ: CircuitRecord; origIdx: number }[] = [];

  circuits.forEach((circ, origIdx) => {
    if (circ.grupoId === 'DIRECT') {
      directItems.push({ circ, origIdx });
      return;
    }
    if (circ.grupoId) {
      const target = groupBuckets.find((b) => b.group.id === circ.grupoId);
      if (target) {
        target.items.push({ circ, origIdx });
        return;
      }
    }
    // Intelligent fallback assignment if circuit has no explicit grupoId yet
    const isTriOrPower =
      circ.conductores.includes('3F') ||
      circ.tension.startsWith('400') ||
      (parseFloat((circ.in || '16').replace(',', '.')) || 16) >= 25;
    if (isTriOrPower && groupBuckets.length > 1) {
      groupBuckets[1].items.push({ circ, origIdx });
    } else {
      groupBuckets[0].items.push({ circ, origIdx });
    }
  });

  // Keep only non-empty buckets (or first bucket if no circuits exist)
  const activeBuckets = groupBuckets.filter((b) => b.items.length > 0);
  if (activeBuckets.length === 0 && directItems.length === 0) {
    activeBuckets.push(groupBuckets[0]);
  }

  // Assign X coordinate to each circuit column, adding extra gap between differential groups
  const colSpacing = 175;
  const groupGap = 55;
  const startX = 140;
  let cursorX = startX;

  const bucketPositions: {
    bucket: (typeof activeBuckets)[0];
    colXs: number[];
    centerX: number;
    minX: number;
    maxX: number;
  }[] = [];

  activeBuckets.forEach((bucket, bIdx) => {
    if (bIdx > 0) cursorX += groupGap;
    const colXs: number[] = [];
    const itemCount = Math.max(bucket.items.length, 1);
    for (let i = 0; i < itemCount; i++) {
      colXs.push(cursorX);
      if (i < itemCount - 1) cursorX += colSpacing;
    }
    const minX = colXs[0];
    const maxX = colXs[colXs.length - 1];
    bucketPositions.push({
      bucket,
      colXs,
      centerX: (minX + maxX) / 2,
      minX,
      maxX
    });
    cursorX += colSpacing;
  });

  const directColXs: number[] = [];
  if (directItems.length > 0) {
    if (bucketPositions.length > 0) cursorX += groupGap;
    directItems.forEach((_, dIdx) => {
      directColXs.push(cursorX);
      if (dIdx < directItems.length - 1) cursorX += colSpacing;
    });
  }

  const allX = [
    ...bucketPositions.flatMap((bp) => bp.colXs),
    ...directColXs
  ];
  const minCanvasX = allX.length > 0 ? Math.min(...allX) : startX;
  const maxCanvasX = allX.length > 0 ? Math.max(...allX) : startX + 340;
  const totalWidth = Math.max(maxCanvasX - minCanvasX, 340);
  const centerX = minCanvasX + totalWidth / 2;

  // Determine whether a Main Repartidor / Distributor Block is recommended and included
  const hasParallelConductors = circuits.some((c) => (parseInt(c.n || '1', 10) || 1) >= 2);
  const needsDistributor =
    panelConfig.includeDistributorInCAD &&
    (circuits.length >= 4 ||
      activeBuckets.length >= 2 ||
      directItems.length > 0 ||
      hasParallelConductors);

  const distributorCalibreNum =
    [63, 100, 125, 160, 250, 400].find((cal) => cal >= Math.max(igaCalibreNum, 63)) || 100;

  // 1. Red / Acometida
  nodes.push({
    id: 'node_supply',
    type: 'grid_supply',
    x: centerX,
    y: 55,
    rotation: 0,
    designation: 'ACOM',
    label: hasThreePhase ? 'Red 3x400/230V 50Hz' : 'Red 230V 50Hz',
    poles: mainPoles,
    calibre: hasThreePhase ? '400V' : '230V',
    curve: '50Hz',
    cableSpec: hasThreePhase ? 'DI: 4x16mm² Cu RZ1-K (AS)' : 'DI: 2x10mm² Cu RZ1-K (AS)'
  });

  // 2. Contador
  nodes.push({
    id: 'node_meter',
    type: 'meter',
    x: centerX,
    y: 130,
    rotation: 0,
    designation: 'WH1',
    label: 'Contador Telegestión',
    poles: mainPoles,
    calibre: 'Directa',
    curve: 'Cl. 1'
  });

  // 3. IGA Cabecera
  nodes.push({
    id: 'node_iga',
    type: 'iga',
    x: centerX,
    y: 210,
    rotation: 0,
    designation: 'IGA',
    label: 'Interruptor General Automático',
    poles: mainPoles,
    calibre: igaCalibre,
    curve: `Curva ${panelConfig.igaCurve || 'C'}${
      (panelConfig.igaTimeDelayMs || 0) > 0 ? ` (Δt=${panelConfig.igaTimeDelayMs}ms)` : ''
    } · ${panelConfig.igaBreakingCapacity || '10kA'}`
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
    }
  );

  // 4. Sobretensiones (SPD) + Tierra (PAT)
  if (panelConfig.spdIncluded !== false) {
    const spdX = Math.max(60, centerX - 190);
    nodes.push({
      id: 'node_spd',
      type: 'spd',
      x: spdX,
      y: 250,
      rotation: 0,
      designation: 'SPD',
      label: `Protector Sobretensiones`,
      poles: mainPoles,
      calibre: `${panelConfig.spdDischargeCurrent || '15kA'} (8/20)`,
      curve: `${panelConfig.spdType || 'Tipo 2 + Perm.'} · Up≤${panelConfig.spdVoltageLevel || '1.5 kV'}`
    });

    nodes.push({
      id: 'node_ground_main',
      type: 'ground',
      x: spdX,
      y: 330,
      rotation: 0,
      designation: 'PAT',
      label: 'Tierra General Cuadro',
      poles: 'PE',
      calibre: '16 mm² Cu',
      curve: 'Ra < 37Ω'
    });

    wires.push(
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
      }
    );
  }

  // 5. Repartidor General Modular (if recommended/enabled)
  const rccbY = needsDistributor ? 375 : 310;
  const groupBusbarY = needsDistributor ? 450 : 390;
  const mcbY = needsDistributor ? 535 : 475;
  const loadY = needsDistributor ? 680 : 625;

  if (needsDistributor) {
    const distLabel =
      panelConfig.distributorTypeOverride === 'peine'
        ? `Peine Embarrado General ${mainPoles} ${distributorCalibreNum}A`
        : `Bloque Repartidor Modular ${mainPoles} ${distributorCalibreNum}A (UNE-EN 61439)`;

    nodes.push({
      id: 'node_distributor',
      type: 'busbar',
      x: centerX,
      y: 295,
      rotation: 0,
      designation: 'REP-1',
      label: distLabel,
      poles: mainPoles,
      calibre: `${distributorCalibreNum}A`,
      curve: 'Barras Cu',
      width: Math.max(totalWidth + 60, 320)
    });

    wires.push({
      id: 'w_iga_distributor',
      fromNodeId: 'node_iga',
      fromPort: 'bottom',
      toNodeId: 'node_distributor',
      toPort: 'top',
      phases: mainPhaseType
    });
  }

  // 6. Grupos Diferenciales (ID1, ID2...) + Sub-embarrados + Circuitos
  bucketPositions.forEach((bp, bIdx) => {
    const grp = bp.bucket.group;
    const rccbId = bIdx === 0 && bucketPositions.length === 1 ? 'node_rccb' : `node_rccb_${grp.id}`;
    const busbarId =
      bIdx === 0 && bucketPositions.length === 1 ? 'node_busbar' : `node_busbar_${grp.id}`;
    const grpPhaseType: '1F+N' | '3F+N' = grp.poles === '4P' ? '3F+N' : '1F+N';

    nodes.push({
      id: rccbId,
      type: 'rccb',
      x: bp.centerX,
      y: rccbY,
      rotation: 0,
      designation: grp.id,
      label: grp.name || `Diferencial ${grp.id}`,
      poles: grp.poles,
      calibre: `${grp.calibre}A`,
      curve: `Clase ${grp.rccbClass || 'A'}`,
      sensitivity: grp.sensitivity || '30mA'
    });

    const spanWidth = Math.max(bp.maxX - bp.minX + 110, 180);
    nodes.push({
      id: busbarId,
      type: 'busbar',
      x: bp.centerX,
      y: groupBusbarY,
      rotation: 0,
      designation: `EMB-${grp.id}`,
      label: `Peine ${grp.id} (${grp.poles} ${grp.calibre}A)`,
      poles: grp.poles,
      calibre: `${grp.calibre}A`,
      curve: 'Cu',
      width: spanWidth
    });

    wires.push(
      {
        id: `w_up_${rccbId}`,
        fromNodeId: needsDistributor ? 'node_distributor' : 'node_iga',
        fromPort: 'bottom',
        toNodeId: rccbId,
        toPort: 'top',
        phases: grpPhaseType
      },
      {
        id: `w_${rccbId}_${busbarId}`,
        fromNodeId: rccbId,
        fromPort: 'bottom',
        toNodeId: busbarId,
        toPort: 'top',
        phases: grpPhaseType
      }
    );

    bp.bucket.items.forEach(({ circ, origIdx }, itemIdx) => {
      const colX = bp.colXs[itemIdx];
      const isTri = circ.conductores.includes('3F') || circ.tension.startsWith('400');
      const phaseTag: '1F+N' | '3F+N' = isTri ? '3F+N' : '1F+N';
      const poles = isTri ? '4P' : '1P+N';
      const parts = circ.id.split(' - ');
      const code = parts[0]?.trim() || `C${origIdx + 1}`;
      const desc = parts[1]?.trim() || circ.id;

      const mcbId = `node_mcb_${origIdx}`;
      const loadId = `node_load_${origIdx}`;

      const protSymbol: SymbolType =
        circ.tipoProteccion === 'Fusible gG'
          ? 'fuse'
          : circ.tipoProteccion === 'Guardamotor'
          ? 'motor_breaker'
          : 'mcb';

      nodes.push({
        id: mcbId,
        type: protSymbol,
        x: colX,
        y: mcbY,
        rotation: 0,
        designation: code,
        label: desc,
        poles,
        calibre: `${circ.in}A`,
        curve: `Curva ${circ.curva || 'C'} · ${circ.poderCorte || '6kA'}`,
        cableSpec: `${circ.conductores} ${circ.seccion} (${circ.aisl})`,
        powerSpec: `${circ.carga}${circ.ud} · L=${circ.l}m · ΔU=${circ.deltaU}%`
      });

      const loadSymbol = inferLoadSymbol(circ.id, circ.conductores);
      nodes.push({
        id: loadId,
        type: loadSymbol,
        x: colX,
        y: loadY,
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
          id: `w_bus_mcb_${origIdx}`,
          fromNodeId: busbarId,
          fromPort: 'bottom',
          toNodeId: mcbId,
          toPort: 'top',
          phases: phaseTag
        },
        {
          id: `w_mcb_load_${origIdx}`,
          fromNodeId: mcbId,
          fromPort: 'bottom',
          toNodeId: loadId,
          toPort: 'top',
          phases: phaseTag,
          label: `${circ.seccion} ${circ.conductores.includes('Al') ? 'Al' : 'Cu'} ${circ.aisl}`
        }
      );
    });
  });

  // 7. Circuitos Directos al Repartidor (sin diferencial intermedio o con diferencial propio)
  directItems.forEach(({ circ, origIdx }, dIdx) => {
    const colX = directColXs[dIdx];
    const isTri = circ.conductores.includes('3F') || circ.tension.startsWith('400');
    const phaseTag: '1F+N' | '3F+N' = isTri ? '3F+N' : '1F+N';
    const poles = isTri ? '4P' : '1P+N';
    const parts = circ.id.split(' - ');
    const code = parts[0]?.trim() || `C${origIdx + 1}`;
    const desc = parts[1]?.trim() || circ.id;

    const mcbId = `node_mcb_${origIdx}`;
    const loadId = `node_load_${origIdx}`;

    nodes.push({
      id: mcbId,
      type:
        circ.tipoProteccion === 'Fusible gG'
          ? 'fuse'
          : circ.tipoProteccion === 'Guardamotor'
          ? 'motor_breaker'
          : 'mcb',
      x: colX,
      y: mcbY,
      rotation: 0,
      designation: code,
      label: desc,
      poles,
      calibre: `${circ.in}A`,
      curve: `Curva ${circ.curva || 'C'} · ${circ.poderCorte || '6kA'}`,
      cableSpec: `${circ.conductores} ${circ.seccion} (${circ.aisl})`,
      powerSpec: `${circ.carga}${circ.ud} · L=${circ.l}m · ΔU=${circ.deltaU}%`
    });

    const loadSymbol = inferLoadSymbol(circ.id, circ.conductores);
    nodes.push({
      id: loadId,
      type: loadSymbol,
      x: colX,
      y: loadY,
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
        id: `w_bus_mcb_${origIdx}`,
        fromNodeId: needsDistributor ? 'node_distributor' : 'node_iga',
        fromPort: 'bottom',
        toNodeId: mcbId,
        toPort: 'top',
        phases: phaseTag
      },
      {
        id: `w_mcb_load_${origIdx}`,
        fromNodeId: mcbId,
        fromPort: 'bottom',
        toNodeId: loadId,
        toPort: 'top',
        phases: phaseTag,
        label: `${circ.seccion} ${circ.conductores.includes('Al') ? 'Al' : 'Cu'} ${circ.aisl}`
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

  // Undo / Redo History Stack (up to 30 snapshots)
  const [history, setHistory] = useState<{ nodes: CADNode[]; wires: CADWire[] }[]>(() => [
    { nodes, wires }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = useCallback(
    (newNodes: CADNode[], newWires: CADWire[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const next = [...trimmed, { nodes: newNodes, wires: newWires }];
        return next.slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setNodes(prevStep.nodes);
      setWires(prevStep.wires);
      setSelectedNodeId(null);
      setSelectedWireId(null);
      onShowToast('Acción deshecha (Deshacer)');
    }
  }, [history, historyIndex, onShowToast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setNodes(nextStep.nodes);
      setWires(nextStep.wires);
      setSelectedNodeId(null);
      setSelectedWireId(null);
      onShowToast('Acción recuperada (Rehacer)');
    }
  }, [history, historyIndex, onShowToast]);

  // Unified Export Dropdown & REBT Presets Menu States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const presetsMenuRef = useRef<HTMLDivElement | null>(null);

  // Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (presetsMenuRef.current && !presetsMenuRef.current.contains(e.target as Node)) {
        setIsPresetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_nodes_v1', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_wires_v1', JSON.stringify(wires));
  }, [wires]);

  useEffect(() => {
    localStorage.setItem('voltmetric_cad_titleblock', JSON.stringify(titleBlock));
  }, [titleBlock]);

  // Cuadro Resumen y Balance de Potencias REBT (ITC-BT-10 / ITC-BT-25)
  const summaryMetrics = useMemo(() => {
    const mcbNodes = nodes.filter((n) => n.type === 'mcb');
    let totalPinstKw = 0;
    mcbNodes.forEach((n) => {
      const match = n.powerSpec?.match(/([\d.,]+)\s*kW/i);
      if (match) {
        totalPinstKw += parseFloat(match[1].replace(',', '.')) || 0;
      } else {
        const cal = parseFloat(n.calibre.replace('A', '').replace(',', '.')) || 16;
        totalPinstKw += (cal * 230) / 1000;
      }
    });

    const count = mcbNodes.length;
    let fs = 1.0;
    if (count >= 10) fs = 0.65;
    else if (count >= 6) fs = 0.75;
    else if (count >= 4) fs = 0.85;

    const pSimultKw = +(totalPinstKw * fs).toFixed(2);
    const iCalc = Math.round((pSimultKw * 1000) / 230);

    return {
      circuitCount: count,
      totalPinstKw: +totalPinstKw.toFixed(2),
      simultaneityFactor: fs,
      simultaneousPowerKw: pSimultKw,
      estimatedCurrentA: iCalc
    };
  }, [nodes]);

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
    pushHistory(generated.nodes, generated.wires);
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

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushHistory(nextNodes, wires);
    setSelectedNodeId(newId);
    setSelectedWireId(null);
    setTool('select');
    // Close library drawer on mobile/tablet so the user immediately sees the placed symbol
    if (window.innerWidth < 1280) {
      setIsLibraryOpen(false);
    }
    onShowToast(`Símbolo insertado: ${def.name}`);
  };

  // Insert complete REBT ITC-BT-25 Standard Circuit (C1 - C12)
  const handleInsertREBTPreset = (preset: REBTPreset) => {
    let busbar = nodes.find((n) => n.type === 'busbar');
    let nextNodes = [...nodes];
    let nextWires = [...wires];

    // Find the rightmost MCB/subpanel column X
    const branchNodes = nextNodes.filter((n) => n.type === 'mcb' || n.type === 'subpanel');
    let targetX = 140;
    if (branchNodes.length > 0) {
      const maxX = Math.max(...branchNodes.map((b) => b.x));
      targetX = maxX + 175;
    } else if (busbar) {
      targetX = busbar.x - (busbar.width || 360) / 2 + 70;
    }

    // Expand busbar if branch extends beyond its right edge
    if (busbar) {
      const halfW = (busbar.width || 360) / 2;
      const rightEdge = busbar.x + halfW;
      if (targetX + 60 > rightEdge) {
        const requiredWidth = Math.max(busbar.width || 360, (targetX - busbar.x + 80) * 2);
        nextNodes = nextNodes.map((n) =>
          n.id === busbar!.id ? { ...n, width: requiredWidth } : n
        );
        busbar = nextNodes.find((n) => n.type === 'busbar');
      }
    }

    const uniqueId = `${preset.code}_${Date.now().toString().slice(-4)}`;
    const mcbId = `node_mcb_${uniqueId}`;
    const loadId = `node_load_${uniqueId}`;

    const newMcb: CADNode = {
      id: mcbId,
      type: 'mcb',
      x: targetX,
      y: 475,
      rotation: 0,
      designation: preset.code,
      label: preset.name,
      poles: preset.poles,
      calibre: preset.in,
      curve: 'Curva C · 6kA',
      cableSpec: preset.section,
      powerSpec: preset.defaultPower
    };

    const newLoad: CADNode = {
      id: loadId,
      type: preset.loadType,
      x: targetX,
      y: 625,
      rotation: 0,
      designation: `R-${preset.code}`,
      label: preset.loadLabel,
      poles: preset.poles,
      calibre: preset.in,
      curve: '230V 50Hz',
      cableSpec: `ITC-BT-25 · ${preset.section}`,
      powerSpec: preset.defaultPower
    };

    nextNodes.push(newMcb, newLoad);

    if (busbar) {
      nextWires.push({
        id: `w_bus_${mcbId}`,
        fromNodeId: busbar.id,
        fromPort: 'bottom',
        toNodeId: mcbId,
        toPort: 'top',
        phases: preset.poles.includes('3F') ? '3F+N' : '1F+N'
      });
    }

    nextWires.push({
      id: `w_${mcbId}_${loadId}`,
      fromNodeId: mcbId,
      fromPort: 'bottom',
      toNodeId: loadId,
      toPort: 'top',
      phases: preset.poles.includes('3F') ? '3F+N' : '1F+N',
      label: preset.section
    });

    setNodes(nextNodes);
    setWires(nextWires);
    pushHistory(nextNodes, nextWires);
    setSelectedNodeId(mcbId);
    setSelectedWireId(null);
    setIsPresetsOpen(false);
    onShowToast(`Circuito ${preset.code} (${preset.name}) insertado según ITC-BT-25`);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const nextWires = wires.filter(
        (w) => w.fromNodeId !== selectedNodeId && w.toNodeId !== selectedNodeId
      );
      setNodes(nextNodes);
      setWires(nextWires);
      pushHistory(nextNodes, nextWires);
      setSelectedNodeId(null);
      onShowToast('Elemento eliminado del plano');
    } else if (selectedWireId) {
      const nextWires = wires.filter((w) => w.id !== selectedWireId);
      setWires(nextWires);
      pushHistory(nodes, nextWires);
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
    const nextNodes = [...nodes, duplicated];
    setNodes(nextNodes);
    pushHistory(nextNodes, wires);
    setSelectedNodeId(copyId);
    onShowToast('Componente duplicado');
  };

  const handleRotateSelected = () => {
    if (!selectedNode) return;
    const nextNodes = nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, rotation: (n.rotation + 90) % 360 } : n
    );
    setNodes(nextNodes);
    pushHistory(nextNodes, wires);
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
      const nextWires = [...wires, newWire];
      setWires(nextWires);
      pushHistory(nodes, nextWires);
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
    if (draggingNodeId) {
      pushHistory(nodes, wires);
    }
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
    if (draggingNodeId) {
      pushHistory(nodes, wires);
    }
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
    setIsExportMenuOpen(false);
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
    setIsExportMenuOpen(false);
    onShowToast('Plano vectorial (.SVG) descargado correctamente');
  };

  // Export High Resolution PNG (2400 x 1600 raster)
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = blueprintDark ? '#0B1120' : '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `Plano_Unifilar_${titleBlock.drawingCode}.png`;
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExportMenuOpen(false);
      onShowToast('Imagen en Alta Resolución (.PNG) exportada');
    };
    img.src = url;
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

    // Cuadro de Resumen de Potencia y Cargas (ITC-BT-10 / 25)
    const sumW = 125;
    const sumH = 36;
    const sumX = 14;
    const sumY = pageH - 12 - sumH;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(sumX, sumY, sumW, sumH, 'FD');

    doc.setLineWidth(0.25);
    doc.line(sumX, sumY + 9, sumX + sumW, sumY + 9);
    doc.line(sumX + 62, sumY + 9, sumX + 62, sumY + sumH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('BALANCE DE POTENCIA Y CARGAS (REBT ITC-BT-10/25)', sumX + 3, sumY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Circuitos: ${summaryMetrics.circuitCount} líneas`, sumX + 3, sumY + 16);
    doc.text(`Potencia Instalada: ${summaryMetrics.totalPinstKw.toFixed(2)} kW`, sumX + 3, sumY + 23);
    doc.text(`Factor Simultaneidad (Fs): ${summaryMetrics.simultaneityFactor}`, sumX + 3, sumY + 30);

    doc.text(`Potencia de Cálculo: ${summaryMetrics.simultaneousPowerKw.toFixed(2)} kW`, sumX + 65, sumY + 16);
    doc.text(`Intensidad Prevista (Ib): ~${summaryMetrics.estimatedCurrentA} A`, sumX + 65, sumY + 23);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Acometida y Protecciones Conformes', sumX + 65, sumY + 30);

    // Cajetín Oficial REBT
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
    setIsExportMenuOpen(false);
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

          {/* Undo / Redo Actions */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/25 shrink-0">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                historyIndex > 0
                  ? 'text-on-surface hover:bg-surface-container-high cursor-pointer'
                  : 'text-outline/40 cursor-not-allowed'
              }`}
              title="Deshacer última acción (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                historyIndex < history.length - 1
                  ? 'text-on-surface hover:bg-surface-container-high cursor-pointer'
                  : 'text-outline/40 cursor-not-allowed'
              }`}
              title="Rehacer acción (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Presets REBT ITC-BT-25 Quick Inserter */}
          <div className="relative shrink-0" ref={presetsMenuRef}>
            <button
              onClick={() => setIsPresetsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                isPresetsOpen
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-outline-variant/30'
              }`}
              title="Insertar circuito normalizado REBT ITC-BT-25 (C1 a C12)"
            >
              <Zap size={13} className={isPresetsOpen ? 'text-white' : 'text-amber-500'} />
              <span className="hidden sm:inline">Presets</span> REBT
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${isPresetsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isPresetsOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl p-2 z-50 max-h-[70vh] overflow-y-auto">
                <div className="px-2 py-1.5 border-b border-outline-variant/20 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Circuitos REBT (ITC-BT-25)
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">12 tipos</span>
                </div>
                <div className="space-y-1">
                  {REBT_PRESETS.map((preset) => (
                    <button
                      key={preset.code}
                      onClick={() => handleInsertREBTPreset(preset)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-left cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-8 h-6 rounded bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {preset.code}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {preset.in} · {preset.section}
                          </p>
                        </div>
                      </div>
                      <Plus size={14} className="text-primary shrink-0 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Auto-Generate, Inspector Toggle & Consolidated Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSyncFromProject}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            title="Autogenerar Esquema Unifilar desde los circuitos del proyecto"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Autogenerar</span> ({circuits.length})
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
            <span className="hidden sm:inline">{selectedNode ? `Editar ${selectedNode.designation}` : 'Cajetín / Prop.'}</span>
          </button>

          {/* Unified Export Button with Dropdown Selector */}
          <div className="relative shrink-0" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="Descargar Plano Eléctrico en Diferentes Formatos"
            >
              <Download size={13} />
              <span>Exportar Plano</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-outline-variant/15 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                    Seleccionar Formato
                  </span>
                </div>

                <button
                  onClick={handleExportCADPdf}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container text-left cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary">
                      Plano Técnico A3 (PDF)
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      Con cajetín oficial REBT y balance
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleExportDXF}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container text-left cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <FileCode size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary">
                      AutoCAD (.DXF)
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      Capas normalizadas (AutoCAD / LibreCAD)
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleExportSVG}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container text-left cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary">
                      Vectorial (.SVG)
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      Escalable sin pérdida para planos
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleExportPNG}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container text-left cursor-pointer transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <ImageIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary">
                      Imagen HD (.PNG)
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      Alta resolución para informes y WhatsApp
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
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

              {/* Cuadro Resumen y Balance de Potencias REBT (ITC-BT-10 / 25) */}
              <g transform="translate(28, 675)">
                <rect
                  x={0}
                  y={0}
                  width={460}
                  height={97}
                  fill={theme.nodeFill}
                  stroke={theme.strokeMain}
                  strokeWidth={1.5}
                />
                <line x1={0} y1={28} x2={460} y2={28} stroke={theme.strokeMain} strokeWidth={1} />
                <line x1={230} y1={28} x2={230} y2={97} stroke={theme.strokeMain} strokeWidth={1} />

                <text
                  x={12}
                  y={18}
                  fill={theme.textPrimary}
                  fontSize={10.5}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  BALANCE DE POTENCIA Y CARGAS PREVISTAS (REBT)
                </text>
                <text
                  x={448}
                  y={18}
                  textAnchor="end"
                  fill={theme.strokeAccent}
                  fontSize={9.5}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ITC-BT-10 / 25
                </text>

                <text x={12} y={44} fill={theme.textSecondary} fontSize={9.5}>
                  Líneas Derivadas:{' '}
                  <tspan fill={theme.textPrimary} fontWeight="bold">
                    {summaryMetrics.circuitCount} circuitos
                  </tspan>
                </text>
                <text x={12} y={58} fill={theme.textSecondary} fontSize={9.5}>
                  Potencia Total Instalada:{' '}
                  <tspan fill={theme.textPrimary} fontWeight="bold">
                    {summaryMetrics.totalPinstKw.toFixed(2)} kW
                  </tspan>
                </text>
                <text x={12} y={72} fill={theme.textSecondary} fontSize={9.5}>
                  Factor de Simultaneidad (Fs):{' '}
                  <tspan fill={theme.strokeAccent} fontWeight="bold">
                    {summaryMetrics.simultaneityFactor}
                  </tspan>
                </text>
                <text x={12} y={88} fill={theme.textSecondary} fontSize={8.5} fontFamily="monospace">
                  Tensión Suministro: 230V 1F+N / 400V 3F+N
                </text>

                <text x={242} y={44} fill={theme.textSecondary} fontSize={9.5}>
                  Potencia de Cálculo:{' '}
                  <tspan fill={theme.strokeAccent} fontWeight="bold">
                    {summaryMetrics.simultaneousPowerKw.toFixed(2)} kW
                  </tspan>
                </text>
                <text x={242} y={58} fill={theme.textSecondary} fontSize={9.5}>
                  Intensidad Prevista (Ib):{' '}
                  <tspan fill={theme.textPrimary} fontWeight="bold">
                    ~{summaryMetrics.estimatedCurrentA} A
                  </tspan>
                </text>
                <text x={242} y={72} fill={theme.strokeGround} fontSize={9.5} fontWeight="bold">
                  ✓ Protecciones e IGA Conformes
                </text>
                <text x={242} y={88} fill={theme.textSecondary} fontSize={8.5} fontFamily="monospace">
                  Límite Reglamentario: ΔU &lt; 3%
                </text>
              </g>

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

// --- IEC 60617 / UNE-EN 60617 Standard Vector Symbol Renderer ---
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
          {/* Main distribution busbar rectangle */}
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
          {/* Phase markings dots along busbar */}
          <circle cx={-w / 2 + 12} cy={0} r={2} fill={theme.nodeFill} />
          <circle cx={w / 2 - 12} cy={0} r={2} fill={theme.nodeFill} />
        </g>
      );
    }

    case 'grid_supply':
      return (
        <g>
          {/* Top connection / aerial feeder */}
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Generator / Network circle */}
          <circle
            cx={0}
            cy={0}
            r={18}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          {/* Sine wave 50Hz symbol */}
          <path
            d="M -10 0 Q -5 -9 0 0 T 10 0"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={2.2}
          />
          {/* Output conductor to downstream */}
          <line x1={0} y1={18} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'meter':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Meter Enclosure */}
          <rect
            x={-18}
            y={-18}
            width={36}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
          {/* Internal counting register window */}
          <rect
            x={-12}
            y={-13}
            width={24}
            height={10}
            rx={1.5}
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.2}
          />
          <line x1={-6} y1={-13} x2={-6} y2={-3} stroke={theme.strokeAccent} strokeWidth={1} />
          <line x1={0} y1={-13} x2={0} y2={-3} stroke={theme.strokeAccent} strokeWidth={1} />
          <line x1={6} y1={-13} x2={6} y2={-3} stroke={theme.strokeAccent} strokeWidth={1} />
          {/* kWh active energy tag */}
          <text
            x={0}
            y={9}
            textAnchor="middle"
            fill={theme.strokeAccent}
            fontSize={9.5}
            fontWeight="bold"
            fontFamily="monospace"
          >
            kWh
          </text>
          <line x1={0} y1={18} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'iga':
      return (
        <g>
          {/* Incoming terminal */}
          <line x1={0} y1={-28} x2={0} y2={-15} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Background Technical Enclosure */}
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
          {/* Switch-Disconnector Cross pad (Aptitud al seccionamiento UNE-EN 60947-2) */}
          <line x1={-3.5} y1={-15} x2={3.5} y2={-9} stroke={theme.strokeMain} strokeWidth={1.6} />
          <line x1={3.5} y1={-15} x2={-3.5} y2={-9} stroke={theme.strokeMain} strokeWidth={1.6} />
          {/* Main switch blade */}
          <line x1={0} y1={10} x2={-10} y2={-9} stroke={theme.strokeAccent} strokeWidth={2.2} />
          {/* Disparador Térmico Bimetálico (Curva / U-Bracket) */}
          <path
            d="M -10 -1 L -6 -1 L -6 -6 L -10 -6"
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.4}
          />
          {/* Disparador Magnético Instantáneo (Flecha / Bobina de disparo) */}
          <path
            d="M -9 4 L -5 4 L -5 1"
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.4}
          />
          <polygon points="-7,1 -3,1 -5,-2" fill={theme.strokeMain} />
          {/* Mechanism dashed linkage */}
          <line x1={-6} y1={-1} x2={-4} y2={2} stroke={theme.strokeAccent} strokeWidth={1} strokeDasharray="1.5,1.5" />
          {/* Outgoing terminal */}
          <line x1={0} y1={10} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'icp':
    case 'mcb':
      return (
        <g>
          {/* Incoming terminal */}
          <line x1={0} y1={-28} x2={0} y2={-14} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Breaker Enclosure */}
          <rect
            x={-17}
            y={-18}
            width={34}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeProtection}
            strokeWidth={1.8}
          />
          {/* Fixed contact pad */}
          <circle cx={0} cy={-13} r={1.8} fill={theme.strokeMain} />
          {/* Movable Contact Arm (Automatic Breaker) */}
          <line x1={0} y1={10} x2={-9} y2={-11} stroke={theme.strokeProtection} strokeWidth={2.2} />
          {/* Disparador Térmico Bimetálico (Sobrecarga ITC-BT-22) */}
          <path
            d="M -9 -1 L -5 -1 L -5 -6 L -9 -6"
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.4}
          />
          {/* Disparador Magnético (Cortocircuito ITC-BT-22) */}
          <path
            d="M -9 5 L -5 5 L -5 2"
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.4}
          />
          <polygon points="-7,2 -3,2 -5,-1" fill={theme.strokeMain} />
          {/* Mechanical actuator toggle / latch */}
          <line x1={-6} y1={-1} x2={-3} y2={1} stroke={theme.strokeAccent} strokeWidth={1} strokeDasharray="1.5,1.5" />
          <circle cx={-12} cy={-1} r={2} fill={theme.strokeProtection} />
          {/* Outgoing terminal */}
          <line x1={0} y1={10} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'motor_breaker':
      return (
        <g>
          {/* Incoming 3-phase feed line */}
          <line x1={0} y1={-28} x2={0} y2={-14} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-17}
            y={-18}
            width={34}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          {/* Fixed contact pad with disconnect cross */}
          <line x1={-3} y1={-15} x2={3} y2={-9} stroke={theme.strokeMain} strokeWidth={1.5} />
          <line x1={3} y1={-15} x2={-3} y2={-9} stroke={theme.strokeMain} strokeWidth={1.5} />
          {/* Contact arm */}
          <line x1={0} y1={10} x2={-9} y2={-9} stroke={theme.strokeAccent} strokeWidth={2.2} />
          {/* Regulable Thermal Element (Flecha diagonal de ajuste motor) */}
          <path
            d="M -9 0 L -5 0 L -5 -5 L -9 -5"
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1.4}
          />
          <line x1={-11} y1={2} x2={-3} y2={-7} stroke={theme.strokeAccent} strokeWidth={1.4} />
          <polygon points="-4,-7 -2,-8 -3,-5" fill={theme.strokeAccent} />
          {/* Magnetic instantaneous trip */}
          <path d="M -9 6 L -5 6 L -5 3" fill="none" stroke={theme.strokeMain} strokeWidth={1.4} />
          <polygon points="-7,3 -3,3 -5,0" fill={theme.strokeMain} />
          {/* Outgoing terminal */}
          <line x1={0} y1={10} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'rccb':
      return (
        <g>
          {/* Incoming terminal */}
          <line x1={0} y1={-28} x2={0} y2={-14} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* RCCB Enclosure */}
          <rect
            x={-19}
            y={-18}
            width={38}
            height={36}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          {/* Main switch blade */}
          <line x1={0} y1={-13} x2={0} y2={-10} stroke={theme.strokeMain} strokeWidth={1.8} />
          <line x1={0} y1={4} x2={-8} y2={-10} stroke={theme.strokeMain} strokeWidth={2.2} />
          {/* Toroidal Detection Core (Toroide diferencial que abraza las fases) */}
          <ellipse
            cx={0}
            cy={9}
            rx={10}
            ry={4.5}
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          {/* Sensing secondary coil winding */}
          <path
            d="M 6 8 A 2.5 2.5 0 0 1 10 9 A 2.5 2.5 0 0 1 10 11"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.5}
          />
          {/* Trip Relay Mechanical Linkage */}
          <line
            x1={-7}
            y1={9}
            x2={-4}
            y2={-3}
            stroke={theme.strokeAccent}
            strokeWidth={1.2}
            strokeDasharray="2,2"
          />
          {/* Test Push Button "T" & Loop (Botón de comprobación periódica) */}
          <line x1={-12} y1={-12} x2={-16} y2={-12} stroke={theme.textPrimary} strokeWidth={1.2} />
          <line x1={-16} y1={-12} x2={-16} y2={4} stroke={theme.textPrimary} strokeWidth={1.2} />
          <line x1={-16} y1={4} x2={-12} y2={4} stroke={theme.textPrimary} strokeWidth={1.2} />
          <rect x={-18} y={-7} width={6} height={6} rx={1} fill={theme.nodeFill} stroke={theme.textPrimary} strokeWidth={1} />
          <text x={-15} y={-2.5} textAnchor="middle" fill={theme.strokeAccent} fontSize={6.5} fontWeight="bold" fontFamily="monospace">
            T
          </text>
          {/* Outgoing terminal */}
          <line x1={0} y1={13.5} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'spd':
      return (
        <g>
          {/* Phase connection from top */}
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* SPD Enclosure */}
          <rect
            x={-16}
            y={-16}
            width={32}
            height={32}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeBusbar}
            strokeWidth={1.8}
          />
          {/* Non-linear Varistor Symbol (Resistencia dependiente de la tensión / hockey-stick) */}
          <rect
            x={-9}
            y={-10}
            width={18}
            height={20}
            fill="none"
            stroke={theme.strokeBusbar}
            strokeWidth={1.6}
          />
          {/* Oblique line with upper horizontal hook (Varistor characteristic curve) */}
          <path
            d="M -12 8 L 8 -8 L 12 -8"
            fill="none"
            stroke={theme.strokeBusbar}
            strokeWidth={1.8}
          />
          {/* Cartridge Status Indicator Window (Verde = Operativo) */}
          <rect x={-4} y={3} width={8} height={4} rx={1} fill="#22C55E" />
          {/* Earth ground conductor line & PE symbol */}
          <line x1={0} y1={16} x2={0} y2={28} stroke={theme.strokeGround} strokeWidth={1.8} />
          <line x1={-6} y1={28} x2={6} y2={28} stroke={theme.strokeGround} strokeWidth={2} />
          <line x1={-3.5} y1={31} x2={3.5} y2={31} stroke={theme.strokeGround} strokeWidth={2} />
        </g>
      );

    case 'ground':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-4} stroke={theme.strokeGround} strokeWidth={2.2} />
          {/* UNE Standard Earthing Bars (Tres barras decrecientes) */}
          <line x1={-18} y1={-4} x2={18} y2={-4} stroke={theme.strokeGround} strokeWidth={2.5} />
          <line x1={-11} y1={3} x2={11} y2={3} stroke={theme.strokeGround} strokeWidth={2.5} />
          <line x1={-5} y1={10} x2={5} y2={10} stroke={theme.strokeGround} strokeWidth={2.5} />
          <text
            x={14}
            y={12}
            fill={theme.strokeGround}
            fontSize={9.5}
            fontWeight="bold"
            fontFamily="monospace"
          >
            PE
          </text>
        </g>
      );

    case 'fuse':
      return (
        <g>
          {/* Conductor passing completely through the fuse link (UNE-EN 60617 standard) */}
          <line x1={0} y1={-28} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-8}
            y={-14}
            width={16}
            height={28}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
        </g>
      );

    case 'contactor':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-13} stroke={theme.strokeMain} strokeWidth={1.8} />
          <rect
            x={-16}
            y={-16}
            width={32}
            height={32}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.6}
          />
          {/* Contactor Semicircular Actuator Cup on NO contact (IEC 60617 standard) */}
          <path
            d="M -6 -13 A 5 5 0 0 1 4 -13"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          <line x1={0} y1={10} x2={-9} y2={-11} stroke={theme.strokeMain} strokeWidth={2} />
          {/* Electromagnetic coil indication */}
          <rect x={-12} y={3} width={8} height={8} fill="none" stroke={theme.strokeAccent} strokeWidth={1.2} />
          <line x1={-12} y1={3} x2={-4} y2={11} stroke={theme.strokeAccent} strokeWidth={1.2} />
          <line x1={0} y1={10} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'subpanel':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Subpanel enclosure with technical dashed double border */}
          <rect
            x={-19}
            y={-16}
            width={38}
            height={32}
            rx={3}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
            strokeDasharray="4,2"
          />
          <rect
            x={-15}
            y={-12}
            width={30}
            height={24}
            rx={2}
            fill="none"
            stroke={theme.strokeMain}
            strokeWidth={1}
          />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            fill={theme.strokeAccent}
            fontSize={9}
            fontWeight="bold"
            fontFamily="monospace"
          >
            SC
          </text>
          <line x1={0} y1={16} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'terminal':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-7} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Terminal clamp circle */}
          <circle cx={0} cy={0} r={7} fill={theme.nodeFill} stroke={theme.strokeMain} strokeWidth={1.8} />
          <circle cx={0} cy={0} r={2} fill={theme.strokeAccent} />
          <line x1={0} y1={7} x2={0} y2={28} stroke={theme.strokeMain} strokeWidth={1.8} />
        </g>
      );

    case 'load_light':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Luminaire circle with cross (UNE-EN 60617 standard) */}
          <circle
            cx={0}
            cy={0}
            r={16}
            fill={theme.nodeFill}
            stroke={theme.strokeBusbar}
            strokeWidth={2}
          />
          <line x1={-11.3} y1={-11.3} x2={11.3} y2={11.3} stroke={theme.strokeBusbar} strokeWidth={2} />
          <line x1={11.3} y1={-11.3} x2={-11.3} y2={11.3} stroke={theme.strokeBusbar} strokeWidth={2} />
        </g>
      );

    case 'load_socket':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-10} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Socket outlet housing */}
          <circle
            cx={0}
            cy={2}
            r={16}
            fill={theme.nodeFill}
            stroke={theme.strokeMain}
            strokeWidth={1.8}
          />
          {/* Semicircular receptacle arc (IEC standard) */}
          <path
            d="M -11 8 A 11 11 0 0 1 11 8"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={2.2}
          />
          {/* Earth pin line */}
          <line x1={0} y1={-10} x2={0} y2={-3} stroke={theme.strokeAccent} strokeWidth={2.2} />
        </g>
      );

    case 'load_hvac':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-16} stroke={theme.strokeMain} strokeWidth={1.8} />
          <circle
            cx={0}
            cy={0}
            r={16}
            fill={theme.nodeFill}
            stroke={theme.strokeAccent}
            strokeWidth={2}
          />
          {/* Heat pump / fan blades symbol */}
          <path
            d="M -9 0 C -9 -7, 0 -7, 0 0 C 0 7, 9 7, 9 0"
            fill="none"
            stroke={theme.strokeAccent}
            strokeWidth={1.8}
          />
          <line x1={-8} y1={-8} x2={8} y2={8} stroke={theme.strokeAccent} strokeWidth={1.2} strokeDasharray="2,2" />
        </g>
      );

    case 'load_motor':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* Stator circle */}
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
          {/* Terminal markings dots */}
          <circle cx={-5} cy={-14} r={1.2} fill={theme.strokeMain} />
          <circle cx={0} cy={-14} r={1.2} fill={theme.strokeMain} />
          <circle cx={5} cy={-14} r={1.2} fill={theme.strokeMain} />
        </g>
      );

    case 'load_ev':
      return (
        <g>
          <line x1={0} y1={-28} x2={0} y2={-18} stroke={theme.strokeMain} strokeWidth={1.8} />
          {/* EV Charging Station Pillar Outline */}
          <rect
            x={-16}
            y={-18}
            width={32}
            height={36}
            rx={4}
            fill={theme.nodeFill}
            stroke={theme.strokeGround}
            strokeWidth={2}
          />
          <text
            x={0}
            y={-2}
            textAnchor="middle"
            fill={theme.strokeGround}
            fontSize={9.5}
            fontWeight="bold"
            fontFamily="monospace"
          >
            SAVE
          </text>
          {/* Charging cable and vehicle plug symbol */}
          <path
            d="M -7 9 L 7 9 M 0 9 L 0 13 M -4 13 L 4 13"
            fill="none"
            stroke={theme.strokeGround}
            strokeWidth={1.6}
          />
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
