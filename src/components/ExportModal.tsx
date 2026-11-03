import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Save, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Building,
  User,
  MapPin,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  ProjectMetadata, 
  CircuitRecord, 
  generateTechnicalReportPDF, 
  exportCircuitsToCSV, 
  exportProjectToJSON 
} from '../utils/pdfExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  circuits: CircuitRecord[];
  onImportCircuits?: (newCircuits: CircuitRecord[], newProject?: ProjectMetadata) => void;
  onShowToast: (msg: string) => void;
}

export const ExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  circuits,
  onImportCircuits,
  onShowToast,
}) => {
  const [projectData, setProjectData] = useState<ProjectMetadata>(() => {
    // Attempt to load saved project data from localStorage
    const saved = localStorage.getItem('voltmetric_project_meta');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      projectName: 'Instalación Nave Industrial - Sector Alpha',
      projectId: 'EXP-2024-0402',
      clientName: 'Industrias Metálicas del Norte S.L.',
      location: 'Polígono Ind. San Fernando, Nave 14, Madrid',
      installerName: 'Carlos M. Rodríguez',
      installerCard: 'IBTE-MAD-89241',
      installerCategory: 'Instalador Especialista (IBTE)',
      voltageSupply: '400V / 230V III+N (50 Hz)',
      groundSystem: 'Esquema TT (UNE-HD 60364)',
      notes: 'Dimensionado conforme al Reglamento Electrotécnico para Baja Tensión (R.D. 842/2002) e Instrucciones Técnicas ITC-BT-19 e ITC-BT-22.',
    };
  });

  const [activeTab, setActiveTab] = useState<'export' | 'metadata' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSaveMeta = () => {
    localStorage.setItem('voltmetric_project_meta', JSON.stringify(projectData));
    onShowToast('Datos del proyecto guardados en el dispositivo');
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      handleSaveMeta();
      generateTechnicalReportPDF(projectData, circuits);
      onShowToast('¡Memoria Técnica PDF generada con éxito!');
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el PDF. Revisa los datos.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportCircuitsToCSV(projectData.projectName, circuits);
      onShowToast('Tabla de circuitos exportada a CSV / Excel');
    } catch (err) {
      onShowToast('Error al exportar CSV');
    }
  };

  const handleExportJSON = () => {
    try {
      exportProjectToJSON(projectData, circuits);
      onShowToast('Copia de seguridad del proyecto exportada en JSON');
    } catch (err) {
      onShowToast('Error al exportar JSON');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.circuits && Array.isArray(parsed.circuits)) {
          if (parsed.project) {
            setProjectData(parsed.project);
            localStorage.setItem('voltmetric_project_meta', JSON.stringify(parsed.project));
          }
          if (onImportCircuits) {
            onImportCircuits(parsed.circuits, parsed.project);
          }
          onShowToast(`Proyecto "${parsed.project?.projectName || 'Cargado'}" importado con éxito (${parsed.circuits.length} circuitos).`);
          onClose();
        } else {
          onShowToast('El archivo no contiene un formato de proyecto válido.');
        }
      } catch (err) {
        onShowToast('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const totalKW = circuits.reduce((acc, c) => acc + (parseFloat(c.carga.replace(',', '.')) || 0), 0);
  const maxDU = circuits.reduce((max, c) => Math.max(max, parseFloat(c.deltaU.replace(',', '.')) || 0), 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest max-w-2xl w-full rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg leading-tight">Exportación Profesional REBT</h3>
              <p className="text-xs text-slate-300 font-medium">Memoria Técnica, Esquema Unifilar y Respaldo de Obra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low px-6 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Download size={15} /> Descarga / Formatos
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'metadata'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Building size={15} /> Datos del Proyecto & Firma
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'import'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Upload size={15} /> Importar Proyecto
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Summary pill banner */}
              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Líneas Registradas</span>
                  <span className="font-headline font-black text-lg text-primary">{circuits.length}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Potencia Total</span>
                  <span className="font-headline font-black text-lg text-on-surface">{totalKW.toFixed(2)} kW</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Máx Caída ΔU</span>
                  <span className={`font-headline font-black text-lg ${maxDU <= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {maxDU.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Norma</span>
                  <span className="font-headline font-black text-xs text-blue-600 uppercase mt-1 block">R.D. 842/2002</span>
                </div>
              </div>

              {/* Export Formats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PDF Card */}
                <div className="bg-surface-container-lowest border-2 border-primary/40 rounded-xl p-5 flex flex-col justify-between hover:border-primary transition-all shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center mb-3">
                      <FileText size={22} />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Memoria Oficial (PDF)</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Documento oficial normalizado listo para visar o entregar a Industria y cliente. Incluye tabla técnica y unifilar.
                    </p>
                  </div>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="mt-4 w-full py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download size={14} />
                    {isExporting ? 'Generando...' : 'Descargar PDF'}
                  </button>
                </div>

                {/* CSV / Excel Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-500 transition-all shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Planilla Excel / CSV</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Exportación en formato delimitado por comas para importar en Microsoft Excel, Google Sheets, Presto o presupuestos.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download size={14} />
                    Descargar CSV
                  </button>
                </div>

                {/* Backup JSON Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500 transition-all shadow-sm">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                      <Save size={22} />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mb-1">Respaldo Total (JSON)</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Copia de seguridad completa con todos los parámetros del proyecto y circuitos para transferir a otro móvil o PC.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Save size={14} />
                    Guardar JSON
                  </button>
                </div>
              </div>

              {/* Informative banner about offline capability */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface">100% Autónomo en Obra:</strong> La generación de la Memoria Técnica en PDF y las tablas se procesa directamente en tu navegador o app móvil. No requiere conexión a servidores ni cobertura de datos.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant font-medium">
                Personaliza los datos identificativos que aparecerán impresos en el encabezado y en el pie de diligencia de la Memoria Técnica oficial.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Nombre del Proyecto / Obra
                  </label>
                  <input
                    type="text"
                    value={projectData.projectName}
                    onChange={(e) => setProjectData({ ...projectData, projectName: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Nº Expediente / Referencia
                  </label>
                  <input
                    type="text"
                    value={projectData.projectId}
                    onChange={(e) => setProjectData({ ...projectData, projectId: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Titular / Cliente
                  </label>
                  <input
                    type="text"
                    value={projectData.clientName}
                    onChange={(e) => setProjectData({ ...projectData, clientName: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Emplazamiento / Dirección
                  </label>
                  <input
                    type="text"
                    value={projectData.location}
                    onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Instalador Autorizado / Técnico
                  </label>
                  <input
                    type="text"
                    value={projectData.installerName}
                    onChange={(e) => setProjectData({ ...projectData, installerName: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Nº Carnet / Registro IBTE
                  </label>
                  <input
                    type="text"
                    value={projectData.installerCard}
                    onChange={(e) => setProjectData({ ...projectData, installerCard: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Tensión de Suministro
                  </label>
                  <input
                    type="text"
                    value={projectData.voltageSupply}
                    onChange={(e) => setProjectData({ ...projectData, voltageSupply: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Esquema de Tierras
                  </label>
                  <input
                    type="text"
                    value={projectData.groundSystem}
                    onChange={(e) => setProjectData({ ...projectData, groundSystem: e.target.value })}
                    className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Notas u Observaciones del Cálculo
                </label>
                <textarea
                  rows={3}
                  value={projectData.notes}
                  onChange={(e) => setProjectData({ ...projectData, notes: e.target.value })}
                  className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg text-xs font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveMeta}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  Guardar Datos del Proyecto
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Upload size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-headline font-bold text-base text-on-surface mb-2">
                  Restaurar Proyecto desde Archivo JSON
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Carga un archivo de respaldo previo generado por VoltMetric Pro para recuperar todas las líneas, secciones y datos técnicos al instante.
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all">
                  <Upload size={16} />
                  <span>Seleccionar Archivo .JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/20 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Normativa REBT Española · R.D. 842/2002
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
