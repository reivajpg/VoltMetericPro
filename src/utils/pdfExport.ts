import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CircuitRecord {
  id: string;
  metodo: string;
  conductores: string;
  tension: string;
  aisl: string;
  seccion: string;
  n: string;
  carga: string;
  ud: string;
  fu: string;
  fs: string;
  ib: string;
  in: string;
  xin: string;
  ir: string;
  iz: string;
  l: string;
  deltaU: string;
  nota?: string;
  // Extended v2.8.0 fields for Panelboard & CAD association
  grupoId?: string;          // e.g. 'ID1', 'ID2', 'DIRECT'
  curva?: string;            // e.g. 'C', 'B', 'D', 'MA'
  poderCorte?: string;       // e.g. '6kA', '10kA', '15kA'
  tipoProteccion?: string;   // 'Interruptor automático' | 'Fusible gG' | 'Guardamotor'
  seccionNeutro?: string;    // e.g. '2.5 mm²'
  seccionCp?: string;        // e.g. '2.5 mm²'
  cosPhi?: string;           // e.g. '0,85'
  tempAmbiente?: string;     // e.g. '40'
  iccPrevista?: string;      // e.g. '6,0'
}

export interface DifferentialGroup {
  id: string;                // e.g. 'ID1', 'ID2'
  name: string;              // e.g. 'Alumbrado y Tomas Generales'
  poles: '2P' | '4P';
  calibre: string;           // '25' | '40' | '63' | '80' | '100'
  sensitivity: '30mA' | '100mA' | '300mA' | '500mA';
  rccbClass: 'AC' | 'A' | 'F' | 'B' | 'A-SI';
  selective?: boolean;
}

export interface PanelBoardConfig {
  // Cabecera (IGA)
  igaPoles: '2P' | '4P';
  igaCalibre: string;        // '25' | '32' | '40' | '50' | '63' | '80' | '100' | '125' | '160' | '250'
  igaCurve: 'B' | 'C' | 'D' | 'S';
  igaTimeDelayMs?: 0 | 60 | 150;
  igaBreakingCapacity: '6kA' | '10kA' | '15kA' | '25kA';
  igaAutoSize: boolean;
  // Sobretensiones (SPD)
  spdIncluded: boolean;
  spdType: 'Tipo 2 (Transitorias)' | 'Tipo 1+2 (Combinado)' | 'Combi (Permanentes + Transitorias)';
  spdDischargeCurrent: '15kA' | '40kA' | '65kA';
  spdVoltageLevel: '1.2 kV' | '1.5 kV' | '2.0 kV';
  // Repartidor / Embarrado
  includeDistributorInCAD: boolean;
  distributorTypeOverride?: 'auto' | 'peine' | 'bloque_modular';
  // Grupos Diferenciales
  differentialGroups: DifferentialGroup[];
}

export const DEFAULT_PANEL_CONFIG: PanelBoardConfig = {
  igaPoles: '4P',
  igaCalibre: '63',
  igaCurve: 'C',
  igaTimeDelayMs: 0,
  igaBreakingCapacity: '10kA',
  igaAutoSize: true,
  spdIncluded: true,
  spdType: 'Combi (Permanentes + Transitorias)',
  spdDischargeCurrent: '15kA',
  spdVoltageLevel: '1.5 kV',
  includeDistributorInCAD: true,
  distributorTypeOverride: 'auto',
  differentialGroups: [
    {
      id: 'ID1',
      name: 'Alumbrado y Tomas Generales',
      poles: '2P',
      calibre: '40',
      sensitivity: '30mA',
      rccbClass: 'A',
      selective: false
    },
    {
      id: 'ID2',
      name: 'Climatización y Fuerza / VE',
      poles: '4P',
      calibre: '63',
      sensitivity: '30mA',
      rccbClass: 'A-SI',
      selective: false
    }
  ]
};


export interface ProjectMetadata {
  projectName: string;
  projectId: string;
  clientName: string;
  location: string;
  installerName: string;
  installerCard: string;
  installerCategory: string;
  voltageSupply: string;
  groundSystem: string;
  notes: string;
}

export function generateTechnicalReportPDF(
  project: ProjectMetadata,
  circuits: CircuitRecord[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [15, 23, 42]; // #0f172a
  const accentColor = [37, 99, 235]; // #2563eb
  const grayColor = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc

  // --- HEADER BANNER ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  // Title in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MEMORIA TÉCNICA DE DISEÑO (MTD) - REBT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Instalaciones Eléctricas de Baja Tensión · Real Decreto 842/2002', 14, 23);

  // Badge VoltMetric Pro
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - 62, 8, 48, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248);
  doc.text('VoltMetric Pro', pageWidth - 56, 15);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CÁLCULO CERTIFICADO', pageWidth - 56, 20);

  // --- PROJECT INFORMATION SECTION ---
  let y = 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. DATOS IDENTIFICATIVOS DEL PROYECTO Y TITULAR', 14, y);

  y += 4;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  // Col 1
  doc.setFont('helvetica', 'bold');
  doc.text('Proyecto:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(project.projectName || 'Proyecto Eléctrico BT', 38, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('ID / Exp.:', 18, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(project.projectId || 'EXP-2024-001', 38, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Titular / Cliente:', 18, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.clientName || 'Propiedad Privada', 44, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Emplazamiento:', 18, y + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(project.location || 'España', 44, y + 27);

  // Col 2
  const col2X = 110;
  doc.setFont('helvetica', 'bold');
  doc.text('Instalador Autorizado:', col2X, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(project.installerName || 'Técnico Especialista', col2X + 34, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Categoría / Carnet:', col2X, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(project.installerCategory || 'Especialista (IBTE)', col2X + 34, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Tensión Suministro:', col2X, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.voltageSupply || '400V / 230V III+N (50 Hz)', col2X + 34, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Emisión:', col2X, y + 27);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(`${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, col2X + 34, y + 27);

  // --- GENERAL POWER & SUMMARY ---
  y += 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. RESUMEN ENERGÉTICO Y LÍMITES REGLAMENTARIOS', 14, y);

  y += 4;
  const totalPowerKW = circuits.reduce((acc, c) => {
    const val = parseFloat(c.carga.replace(',', '.')) || 0;
    return acc + val;
  }, 0);

  const maxDeltaU = circuits.reduce((max, c) => {
    const val = parseFloat(c.deltaU.replace(',', '.')) || 0;
    return Math.max(max, val);
  }, 0);

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('POTENCIA INSTALADA TOTAL', 20, y + 6);
  doc.text('Nº CIRCUITOS', 75, y + 6);
  doc.text('CAÍDA TUS MÁXIMA', 125, y + 6);
  doc.text('ESQUEMA DE TIERRAS', 165, y + 6);

  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${totalPowerKW.toFixed(2)} kW`, 20, y + 12);
  doc.text(`${circuits.length} líneas`, 75, y + 12);
  doc.setTextColor(maxDeltaU <= 5 ? 22 : 220, maxDeltaU <= 5 ? 101 : 38, maxDeltaU <= 5 ? 52 : 38);
  doc.text(`${maxDeltaU.toFixed(2)} % (${maxDeltaU <= 5 ? 'Cumple REBT' : 'Revisar'})`, 125, y + 12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(project.groundSystem || 'Esquema TT', 165, y + 12);

  // --- CIRCUITS TABLE WITH AUTOTABLE ---
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. CUADRO DE DIMENSIONAMIENTO DE LÍNEAS INTERIORES (ITC-BT-19)', 14, y);

  const tableData = circuits.map((c) => {
    const du = parseFloat(c.deltaU.replace(',', '.')) || 0;
    const ok = du <= 5;
    return [
      c.id,
      c.metodo,
      c.conductores,
      `${c.tension} V`,
      c.carga,
      `${c.ib} A`,
      c.seccion,
      `${c.l} m`,
      `${c.in} A`,
      `${c.iz} A`,
      `${c.deltaU} %`,
      ok ? 'CUMPLE' : 'EXCESIVO',
    ];
  });

  autoTable(doc, {
    startY: y + 3,
    head: [
      [
        'Circuito',
        'Método',
        'Fases',
        'Tensión',
        'Carga (kW)',
        'Ib (A)',
        'Sección',
        'Long.',
        'PIA (In)',
        'Iz\' (A)',
        'ΔU (%)',
        'Estado',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      6: { fontStyle: 'bold' },
      11: { fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 11) {
        if (data.cell.raw === 'CUMPLE') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fillColor = [240, 253, 244];
        } else {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Get position after table
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 8;

  // Check if we need a page break for the single-line diagram and signatures
  if (finalY > pageHeight - 75) {
    doc.addPage();
    finalY = 20;
  }

  // --- ESQUEMA UNIFILAR CONCEPTUAL ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('4. ESQUEMA UNIFILAR GENERAL Y PROTECCIONES (CGMP)', 14, finalY);

  finalY += 4;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, pageWidth - 28, 38, 2, 2, 'FD');

  // Vector single-line diagram drawing
  const diagX = 22;
  const diagY = finalY + 8;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  // Red de alimentación principal
  doc.line(diagX, diagY, diagX + 16, diagY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RED BT', diagX, diagY - 2);

  // IGA box
  doc.setFillColor(255, 255, 255);
  doc.rect(diagX + 16, diagY - 4, 16, 8, 'FD');
  doc.text('IGA', diagX + 20, diagY + 1.5);

  // Line to Differential
  doc.line(diagX + 32, diagY, diagX + 46, diagY);

  // ID box
  doc.rect(diagX + 46, diagY - 4, 18, 8, 'FD');
  doc.text('ID 30mA', diagX + 48, diagY + 1.5);

  // Main Busbar
  doc.setLineWidth(1.4);
  doc.line(diagX + 64, diagY, diagX + 74, diagY);
  doc.line(diagX + 74, diagY - 10, diagX + 74, diagY + 20);

  // Branch lines (draw up to 4 branch lines from the busbar)
  const displayCircuits = circuits.slice(0, 4);
  displayCircuits.forEach((circ, idx) => {
    const branchY = diagY - 8 + idx * 8;
    doc.setLineWidth(0.6);
    doc.line(diagX + 74, branchY, diagX + 88, branchY);

    // PIA box
    doc.setFillColor(255, 255, 255);
    doc.rect(diagX + 88, branchY - 3, 16, 6, 'FD');
    doc.setFontSize(6.5);
    doc.text(`PIA ${circ.in}A`, diagX + 90, branchY + 1.5);

    // Circuit info line
    doc.line(diagX + 104, branchY, diagX + 116, branchY);
    doc.setFontSize(6.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`${circ.id}: ${circ.seccion} (${circ.carga} kW - ${circ.l}m)`, diagX + 118, branchY + 1.5);
  });

  if (circuits.length > 4) {
    doc.setFontSize(7);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`(+ ${circuits.length - 4} circuitos adicionales incluidos en la memoria de cálculo)`, diagX + 74, diagY + 26);
  }

  // --- SIGNATURE AND STAMP BOX ---
  finalY += 46;
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('5. DILIGENCIA Y CONFORMIDAD TÉCNICA', 14, finalY);

  finalY += 3;
  const signBoxWidth = (pageWidth - 32) / 2;

  // Left: Installer stamp
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, signBoxWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INSTALADOR AUTORIZADO / EMPRESA INSTALADORA', 18, finalY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Firma y Sello Digital:', 18, finalY + 10);
  doc.text(`D./Dña.: ${project.installerName || 'Instalador Certificado'}`, 18, finalY + 15);
  doc.text(`Categoría: ${project.installerCategory || 'Básica/Especialista'}`, 18, finalY + 20);

  // Right: Titular / Dirección de Obra
  doc.roundedRect(14 + signBoxWidth + 4, finalY, signBoxWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CONFORMIDAD DE LA PROPIEDAD', 18 + signBoxWidth + 4, finalY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Firma Titular / Representante:', 18 + signBoxWidth + 4, finalY + 10);
  doc.text(`D./Dña.: ${project.clientName || 'Titular'}`, 18 + signBoxWidth + 4, finalY + 15);
  doc.text(`Ubicación: ${project.location || 'Local / Obra'}`, 18 + signBoxWidth + 4, finalY + 20);

  // --- FOOTER ON ALL PAGES ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(
      'VoltMetric Pro · Memoria Técnica conforme al Reglamento Electrotécnico para Baja Tensión (REBT)',
      14,
      pageHeight - 6
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 32, pageHeight - 6);
  }

  const cleanName = (project.projectName || 'proyecto_electrico')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${cleanName}_MTD_REBT.pdf`);
}

export function exportCircuitsToCSV(projectName: string, circuits: CircuitRecord[]) {
  const headers = [
    'Circuito',
    'Metodo_Instalacion',
    'Conductores',
    'Tension_V',
    'Aislamiento',
    'Carga_kW',
    'Ib_A',
    'Seccion_mm2',
    'Longitud_m',
    'PIA_In_A',
    'Ir_A',
    'Iz_A',
    'DeltaU_Percent',
  ];

  const rows = circuits.map((c) => [
    `"${c.id}"`,
    `"${c.metodo}"`,
    `"${c.conductores}"`,
    c.tension,
    `"${c.aisl}"`,
    c.carga,
    c.ib,
    `"${c.seccion}"`,
    c.l,
    c.in,
    c.ir,
    c.iz,
    c.deltaU,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_circuitos.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportProjectToJSON(project: ProjectMetadata, circuits: CircuitRecord[]) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project,
    circuits,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(project.projectName || 'proyecto').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_backup.json`;
  link.click();
  URL.revokeObjectURL(url);
}
