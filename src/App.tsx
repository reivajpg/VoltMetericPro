import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  BookOpen, 
  Settings, 
  ArrowLeft, 
  UserCircle,
  Zap,
  Cpu,
  Shield,
  History,
  FileText,
  RefreshCw,
  AlertTriangle,
  Info,
  BarChart2,
  List,
  Eye,
  Gauge,
  ChevronDown,
  Layers,
  Search,
  Home,
  Building2,
  Tag,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  FolderOpen,
  WifiOff,
  Smartphone,
  Save,
  GitBranch,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ExportModal } from './components/ExportModal';
import { ElectricalCADScreen, generateCADFromCircuits } from './components/ElectricalCADScreen';
import { ChangelogModal } from './components/ChangelogModal';
import { APP_VERSION } from './utils/versionHistory';
import {
  CircuitRecord,
  ProjectMetadata,
  PanelBoardConfig,
  DifferentialGroup,
  DEFAULT_PANEL_CONFIG
} from './utils/pdfExport';
import {
  validateProtectionSelectivity,
  SelectivityValidationResult
} from './utils/selectivity';

// --- Types ---
type Screen = 'dashboard' | 'cad' | 'power' | 'voltage_drop' | 'protections' | 'canalizacion' | 'installation' | 'advanced_circuit' | 'docs';
type Phase = 'mono' | 'tri';
type CalcMode = 'power' | 'current';
type Material = 'cu' | 'al';

const INITIAL_CIRCUITS: CircuitRecord[] = [
  { id: 'C1 - Alumbrado General', metodo: 'B1', conductores: '1F+N+CP Cu', tension: '230,0', aisl: 'Z1', seccion: '1.5 mm²', n: '1', carga: '2,3', ud: 'kW', fu: '1,0', fs: '1,0', ib: '10,00', in: '10', xin: '1,0', ir: '10,0', iz: '15,83', l: '18,0', deltaU: '1,12', grupoId: 'ID1', curva: 'C', poderCorte: '6kA', tipoProteccion: 'Interruptor automático' },
  { id: 'C2 - Tomas de Corriente', metodo: 'B1', conductores: '1F+N+CP Cu', tension: '230,0', aisl: 'Z1', seccion: '2.5 mm²', n: '1', carga: '3,68', ud: 'kW', fu: '1,0', fs: '1,0', ib: '16,00', in: '16', xin: '1,0', ir: '16,0', iz: '20,36', l: '22,0', deltaU: '1,68', grupoId: 'ID1', curva: 'C', poderCorte: '6kA', tipoProteccion: 'Interruptor automático' },
  { id: 'C3 - Climatización / AC', metodo: 'B1', conductores: '1F+N+CP Cu', tension: '230,0', aisl: 'Z1', seccion: '6 mm²', n: '1', carga: '5,5', ud: 'kW', fu: '1,0', fs: '1,0', ib: '23,91', in: '25', xin: '1,0', ir: '25,0', iz: '38,45', l: '15,0', deltaU: '0,87', grupoId: 'ID2', curva: 'C', poderCorte: '6kA', tipoProteccion: 'Interruptor automático' },
  { id: 'C4 - Fuerza Trifásica Nave', metodo: 'B1', conductores: '3F+N Cu', tension: '400,0', aisl: 'Z1', seccion: '16 mm²', n: '1', carga: '22,0', ud: 'kW', fu: '1,0', fs: '1,0', ib: '39,69', in: '40', xin: '1,0', ir: '40,0', iz: '62,20', l: '35,0', deltaU: '1,35', grupoId: 'ID2', curva: 'C', poderCorte: '10kA', tipoProteccion: 'Interruptor automático' },
  { id: 'C5 - Recarga Vehículo Eléc.', metodo: 'B1', conductores: '1F+N+CP Cu', tension: '230,0', aisl: 'Z1', seccion: '10 mm²', n: '1', carga: '7,4', ud: 'kW', fu: '1,0', fs: '1,0', ib: '32,17', in: '40', xin: '1,0', ir: '40,0', iz: '50,33', l: '28,0', deltaU: '1,89', grupoId: 'ID2', curva: 'C', poderCorte: '6kA', tipoProteccion: 'Interruptor automático' }
];

// --- Main App Component ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Persistent circuits state in localStorage (Offline support for obra)
  const [circuits, setCircuits] = useState<CircuitRecord[]>(() => {
    const saved = localStorage.getItem('voltmetric_circuits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CIRCUITS;
  });

  useEffect(() => {
    localStorage.setItem('voltmetric_circuits', JSON.stringify(circuits));
  }, [circuits]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface pb-20 md:pb-0 relative">
      <TopBar 
        onShowToast={showToast} 
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {currentScreen !== 'cad' && (
          <SideNav 
            currentScreen={currentScreen} 
            setCurrentScreen={setCurrentScreen} 
            onShowToast={showToast}
            onOpenExport={() => setIsExportModalOpen(true)}
            circuitCount={circuits.length}
          />
        )}
        
        <main className="flex-1 overflow-y-auto w-full">
          {currentScreen === 'dashboard' && (
            <DashboardScreen 
              onNavigate={setCurrentScreen} 
              onShowToast={showToast}
              onOpenExport={() => setIsExportModalOpen(true)}
              circuits={circuits}
            />
          )}
          {currentScreen === 'power' && <PowerCalculatorScreen />}
          {currentScreen === 'voltage_drop' && <VoltageDropScreen />}
          {currentScreen === 'protections' && <ProtectionsScreen />}
          {currentScreen === 'canalizacion' && <CanalizacionScreen />}
          {currentScreen === 'docs' && <DocsScreen />}
          {currentScreen === 'installation' && <InstallationScreen />}
          {currentScreen === 'advanced_circuit' && (
            <AdvancedCircuitScreen 
              circuits={circuits}
              setCircuits={setCircuits}
              onShowToast={showToast}
              onOpenExport={() => setIsExportModalOpen(true)}
              onTransferToCAD={(panelConfig) => {
                const generated = generateCADFromCircuits(circuits, panelConfig);
                localStorage.setItem('voltmetric_cad_nodes_v1', JSON.stringify(generated.nodes));
                localStorage.setItem('voltmetric_cad_wires_v1', JSON.stringify(generated.wires));
                setCurrentScreen('cad');
                showToast(`Cuadro transferido al Esquema Unifilar CAD (${circuits.length} líneas y ${panelConfig.differentialGroups.length} grupos ID)`);
              }}
            />
          )}
          {currentScreen === 'cad' && (
            <ElectricalCADScreen
              circuits={circuits}
              onShowToast={showToast}
              onNavigateBack={() => setCurrentScreen('dashboard')}
            />
          )}
        </main>
      </div>

      <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      {/* Offline Mode Floating Alert */}
      <OfflineIndicator />

      {/* Export & Technical Report Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        circuits={circuits}
        onImportCircuits={(newCircs) => {
          setCircuits(newCircs);
          showToast(`Proyecto importado con ${newCircs.length} líneas`);
        }}
        onShowToast={showToast}
      />

      {/* Version Control & Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-6 py-3 rounded-full shadow-lg font-bold text-sm z-[100] transition-all duration-300 flex items-center gap-2">
          <Info size={18} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// --- Navigation Components ---
function TopBar({ 
  onShowToast, 
  onOpenExport,
  onOpenChangelog
}: { 
  onShowToast: (msg: string) => void;
  onOpenExport: () => void;
  onOpenChangelog: () => void;
}) {
  return (
    <header className="w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center bg-primary text-white p-1.5 rounded-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-black text-primary tracking-tighter text-xl leading-none">VoltMetric Pro</h1>
              <button
                onClick={onOpenChangelog}
                className="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-mono font-bold text-[11px] tabular-nums transition-colors cursor-pointer flex items-center gap-1"
                title="Ver Control de Cambios e Historial de Versiones"
              >
                <span>v{APP_VERSION}</span>
                <History size={11} className="hidden sm:inline" />
              </button>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:inline">REBT · Modo Obra</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* In-app PWA install button (Desktop/Android/iOS) */}
          <PWAInstallButton variant="topbar" onInstalledToast={onShowToast} />

          {/* Quick Export Button */}
          <button 
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Exportar Memoria Técnica oficial en PDF, Excel o Copia de Seguridad JSON"
          >
            <Download size={15} className="text-primary" />
            <span className="hidden sm:inline">Exportar MTD</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button 
            onClick={onOpenChangelog} 
            className="text-primary active:opacity-80 transition-all p-1 cursor-pointer"
            title={`Control de Cambios · VoltMetric Pro v${APP_VERSION}`}
          >
            <UserCircle size={28} />
          </button>
        </div>
      </div>
    </header>
  );
}

function SideNav({ 
  currentScreen, 
  setCurrentScreen, 
  onShowToast,
  onOpenExport,
  circuitCount
}: { 
  currentScreen: Screen; 
  setCurrentScreen: (s: Screen) => void; 
  onShowToast: (msg: string) => void;
  onOpenExport: () => void;
  circuitCount: number;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    calculators: true
  });

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', type: 'item' as const },
    { id: 'cad', icon: GitBranch, label: 'Esquemas CAD', type: 'item' as const },
    { 
      id: 'calculators', 
      icon: Calculator, 
      label: 'Calculadoras', 
      type: 'group' as const,
      subItems: [
        { id: 'advanced_circuit', icon: Calculator, label: 'Circuito Completo' },
        { id: 'power', icon: Zap, label: 'Potencia' },
        { id: 'voltage_drop', icon: Cpu, label: 'Caída de Tensión' },
        { id: 'canalizacion', icon: Layers, label: 'Canalización' },
        { id: 'protections', icon: Shield, label: 'Protecciones' },
        { id: 'installation', icon: Gauge, label: 'Aislamiento' }
      ]
    },
    { id: 'docs', icon: BookOpen, label: 'Documentación', type: 'item' as const }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container border-r border-outline-variant/20 h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-white shadow-sm flex items-center justify-center">
            <Cpu size={22} />
          </div>
          <div>
            <p className="font-bold text-primary text-sm leading-tight">Proyecto Eléctrico</p>
            <p className="text-xs text-on-surface-variant font-medium">{circuitCount} líneas activas</p>
          </div>
        </div>

        <button 
          onClick={onOpenExport} 
          className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98]"
        >
          <Download size={15} />
          Exportar Memoria
        </button>
      </div>

      <nav className="flex-1 flex flex-col px-4 gap-1 pb-4">
        {navItems.map((item) => {
          if (item.type === 'item') {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as Screen)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-bold ${
                  isActive 
                    ? 'bg-white text-primary shadow-sm translate-x-1' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                {item.label}
              </button>
            );
          } else if (item.type === 'group') {
            const Icon = item.icon;
            const isOpen = openGroups[item.id];
            const hasActiveChild = item.subItems?.some(sub => sub.id === currentScreen);
            
            return (
              <div key={item.id} className="flex flex-col gap-1">
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-bold ${
                    hasActiveChild && !isOpen ? 'text-primary' : 'text-on-surface-variant'
                  } hover:bg-surface-container-high hover:text-primary`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={hasActiveChild && !isOpen ? 'text-primary' : ''} />
                    {item.label}
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-1 pl-4"
                    >
                      {item.subItems?.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentScreen === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setCurrentScreen(sub.id as Screen)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-bold mt-1 ${
                              isSubActive 
                                ? 'bg-white text-primary shadow-sm translate-x-1' 
                                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                            }`}
                          >
                            <SubIcon size={18} className={isSubActive ? 'text-primary' : ''} />
                            {sub.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
        })}
      </nav>

      {/* Sidebar Footer with PWA offline badge */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest/50">
        <PWAInstallButton variant="sidebar" onInstalledToast={onShowToast} />
      </div>
    </aside>
  );
}

function BottomNav({ currentScreen, setCurrentScreen }: { currentScreen: Screen, setCurrentScreen: (s: Screen) => void }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'cad', icon: GitBranch, label: 'Esquema CAD' },
    { id: 'advanced_circuit', icon: Calculator, label: 'Línea BT' },
    { id: 'power', icon: Zap, label: 'Calculadoras' },
    { id: 'voltage_drop', icon: Cpu, label: 'Caída de T.' },
    { id: 'canalizacion', icon: Layers, label: 'Canalización' },
    { id: 'protections', icon: Shield, label: 'Protecciones' },
    { id: 'installation', icon: Gauge, label: 'Aislamiento' },
    { id: 'docs', icon: BookOpen, label: 'Docs' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface shadow-[0_-4px_24px_rgba(17,29,35,0.06)] z-50">
      <div className="bg-surface-container-highest h-[2px] w-full absolute top-0 left-0"></div>
      <div className="flex overflow-x-auto items-center gap-2 px-4 pb-4 pt-3 scrollbar-hide scroll-smooth snap-x touch-pan-x w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id as Screen)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 mt-1 mx-0.5 transition-all active:scale-95 duration-150 rounded-xl snap-center ${
                isActive 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary bg-surface-container-low hover:bg-surface-container-high'
              }`}
            >
              <Icon size={18} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// --- Screens ---

function DashboardScreen({ 
  onNavigate, 
  onShowToast,
  onOpenExport,
  circuits
}: { 
  onNavigate: (s: Screen) => void; 
  onShowToast: (msg: string) => void;
  onOpenExport: () => void;
  circuits: CircuitRecord[];
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Hero Industrial Header */}
      <section className="mb-8 p-6 md:p-10 rounded-2xl industrial-gradient text-white flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-xl border border-white/10">
        <div className="z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-label bg-white/20 text-white uppercase tracking-widest text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm">
              REBT R.D. 842/2002
            </span>
            <span className="font-label bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Modo Obra Offline Activo
            </span>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-black mb-2 tracking-tight">Panel de Control & Memoria REBT</h2>
          <p className="text-slate-200 text-sm md:text-base opacity-90 leading-relaxed">
            Dimensionado de conductores, caídas de tensión y protecciones. Generación instantánea de memorias técnicas oficiales y esquemas unifilares sin conexión a internet.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('cad')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <GitBranch size={16} />
              Estudio CAD Unifilar
            </button>
            <button
              onClick={onOpenExport}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download size={16} />
              Exportar Memoria MTD (PDF)
            </button>
            <button
              onClick={() => onNavigate('advanced_circuit')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
            >
              <Calculator size={16} />
              Ver Líneas ({circuits.length})
            </button>
          </div>
        </div>

        <div className="mt-6 md:mt-0 z-10 shrink-0 flex flex-col gap-3">
          <a 
            href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md p-4 rounded-xl block cursor-pointer"
          >
            <p className="font-label text-xs uppercase opacity-70 mb-1">Normativa Oficial</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="font-bold text-sm">BOE Consolidado Vigente</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">ITC-BT-01 a ITC-BT-52</p>
          </a>
        </div>

        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Zap size={240} fill="currentColor" />
        </div>
      </section>

      {/* Main Calculation Tools (Bento Grid) */}
      <h3 className="font-headline text-lg font-bold mb-4 px-1 text-on-surface">Herramientas Principales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <ToolCard 
          icon={Calculator} 
          title="Circuito Completo BT" 
          desc="Cálculo térmico, cortocircuito e impedancia para tabla MTD."
          action="Calcular Línea"
          colorClass="text-primary border-primary"
          bgClass="bg-primary/10"
          onClick={() => onNavigate('advanced_circuit')}
        />
        <ToolCard 
          icon={Cpu} 
          title="Sección de Cableado" 
          desc="Caída de tensión y densidad de corriente según ITC-BT-19."
          action="Calcular Caída"
          colorClass="text-secondary border-secondary"
          bgClass="bg-secondary-container/20"
          onClick={() => onNavigate('voltage_drop')}
        />
        <ToolCard 
          icon={Shield} 
          title="Protecciones Schneider" 
          desc="Selección de PIA Resi9/Acti9 y Diferenciales (ITC-BT-22)."
          action="Configurar"
          colorClass="text-tertiary-container border-tertiary-container"
          bgClass="bg-tertiary-fixed-dim/30"
          onClick={() => onNavigate('protections')}
        />
        <ToolCard 
          icon={Layers} 
          title="Canalización & Tubos" 
          desc="Diámetro exterior de tubos según ITC-BT-21."
          action="Dimensionar"
          colorClass="text-error border-error"
          bgClass="bg-error-container/20"
          onClick={() => onNavigate('canalizacion')}
        />
      </div>

      {/* Recent Calculations */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">Circuitos Registrados en Obra</h3>
          <p className="text-xs text-on-surface-variant">Líneas guardadas localmente en este dispositivo ({circuits.length})</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenExport}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <Download size={14} /> Exportar
          </button>
          <span className="text-on-surface-variant">·</span>
          <button 
            onClick={() => onNavigate('advanced_circuit')} 
            className="text-xs font-bold text-primary hover:underline"
          >
            Ver todas
          </button>
        </div>
      </div>

      <div className="bg-surface-container rounded-xl overflow-x-auto mb-8 border border-outline-variant/20 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant/15">
              <th className="px-4 md:px-6 py-3.5 font-label text-xs uppercase tracking-widest text-on-surface-variant">Circuito / Línea</th>
              <th className="hidden md:table-cell px-6 py-3.5 font-label text-xs uppercase tracking-widest text-on-surface-variant">Método</th>
              <th className="px-4 md:px-6 py-3.5 font-label text-xs uppercase tracking-widest text-on-surface-variant text-right">Sección & Carga</th>
              <th className="px-4 md:px-6 py-3.5 font-label text-xs uppercase tracking-widest text-on-surface-variant text-center">Estado REBT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-sm">
            {circuits.slice(0, 5).map((circ) => {
              const deltaNum = parseFloat(circ.deltaU.replace(',', '.')) || 0;
              const isCompliant = deltaNum <= 5;
              return (
                <tr 
                  key={circ.id} 
                  onClick={() => onNavigate('advanced_circuit')} 
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <td className="px-4 md:px-6 py-3.5">
                    <div className="font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{circ.id}</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      {circ.conductores} · {circ.l}m · {circ.tension}V
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-3.5 font-mono text-xs font-bold text-on-surface-variant">
                    {circ.metodo} ({circ.aisl})
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-right font-mono">
                    <span className="font-bold text-on-surface block text-sm">{circ.seccion}</span>
                    <span className="text-[10px] text-on-surface-variant block">
                      {circ.carga} kW · ΔU: {circ.deltaU}%
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-center">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                      isCompliant 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                      {isCompliant ? 'CUMPLE' : 'REVISAR'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink 
          icon={FileText} 
          label="Memoria MTD (PDF)" 
          onClick={onOpenExport} 
        />
        <QuickLink 
          icon={FileSpreadsheet} 
          label="Exportar Excel/CSV" 
          onClick={onOpenExport} 
        />
        <QuickLink 
          icon={Smartphone} 
          label="Instalar en Android" 
          onClick={() => {
            const btn = document.querySelector('button[title*="Instalar"]') as HTMLButtonElement;
            if (btn) btn.click();
            else onShowToast('Usa la opción Instalar App en la barra superior');
          }} 
        />
        <QuickLink 
          icon={RefreshCw} 
          label="Copia JSON" 
          onClick={onOpenExport} 
        />
      </div>
    </div>
  );
}

function ToolCard({ icon: Icon, title, desc, action, colorClass, bgClass, onClick }: any) {
  return (
    <div onClick={onClick} className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:bg-surface-container-low transition-colors group cursor-pointer border-l-4 ${colorClass.split(' ')[1]}`}>
      <div className={`w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={colorClass.split(' ')[0]} />
      </div>
      <h4 className="font-headline text-xl font-extrabold text-primary mb-2">{title}</h4>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{desc}</p>
      <div className="flex items-center text-primary font-bold text-xs uppercase tracking-wider">
        {action} <ArrowLeft size={16} className="ml-1 rotate-180" />
      </div>
    </div>
  );
}

function RecentRow({ title, id, type, result, subResult, status, statusColor, bg = '', resultColor = 'text-primary' }: any) {
  return (
    <tr className={`hover:bg-surface-container-low transition-colors ${bg}`}>
      <td className="px-4 md:px-6 py-4">
        <div className="font-bold text-primary text-sm md:text-base">{title}</div>
        <div className="text-xs text-on-surface-variant">ID: {id}</div>
      </td>
      <td className="hidden md:table-cell px-6 py-4 text-sm font-medium text-on-surface">{type}</td>
      <td className="px-4 md:px-6 py-4 text-right">
        <span className={`font-headline font-bold text-base md:text-lg ${resultColor}`}>{result}</span>
        <span className="text-[10px] text-on-surface-variant block uppercase">{subResult}</span>
      </td>
      <td className="px-4 md:px-6 py-4 text-center">
        <span className={`${statusColor} text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}>{status}</span>
      </td>
    </tr>
  );
}

function QuickLink({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-center md:justify-start gap-3 p-4 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-all active:scale-95">
      <Icon size={20} className="text-primary" />
      <span className="font-bold text-sm text-primary">{label}</span>
    </button>
  );
}

// --- Power Calculator Screen ---

function PowerCalculatorScreen() {
  const [phase, setPhase] = useState<Phase>('tri');
  const [mode, setMode] = useState<CalcMode>('power');
  
  const [voltage, setVoltage] = useState('400');
  const [current, setCurrent] = useState('10.00');
  const [power, setPower] = useState('5.89');
  const [pf, setPf] = useState('0.85');

  const [results, setResults] = useState<{
    activePower: number;
    reactivePower: number;
    apparentPower: number;
    calculatedCurrent: number;
  } | null>(null);

  useEffect(() => {
    setResults(null);
  }, [mode, phase, voltage, current, power, pf]);

  const handleCalculate = () => {
    const v = parseFloat(voltage) || 0;
    const i = parseFloat(current) || 0;
    const p_kw = parseFloat(power) || 0;
    const cosPhi = parseFloat(pf) || 1;

    let activePower = 0;
    let reactivePower = 0;
    let apparentPower = 0;
    let calculatedCurrent = 0;

    if (mode === 'power') {
      const factor = phase === 'tri' ? Math.sqrt(3) : 1;
      activePower = (factor * v * i * cosPhi) / 1000;
      apparentPower = (factor * v * i) / 1000;
      reactivePower = Math.sqrt(Math.max(0, apparentPower**2 - activePower**2));
    } else {
      const factor = phase === 'tri' ? Math.sqrt(3) : 1;
      calculatedCurrent = (p_kw * 1000) / (factor * v * cosPhi);
    }

    setResults({ activePower, reactivePower, apparentPower, calculatedCurrent });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight mb-2">Calculadora de Potencia</h2>
        <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">Cálculo de parámetros técnicos para sistemas de baja tensión.</p>
      </div>

      {/* Mode Switcher */}
      <div className="mb-6 flex p-1 bg-surface-container rounded-xl max-w-md">
        <button 
          onClick={() => setMode('power')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'power' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <Zap size={16} /> Potencia
        </button>
        <button 
          onClick={() => setMode('current')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'current' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <Gauge size={16} /> Intensidad (A)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Input Form */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/20">
          <div className="bg-surface-container-high px-6 py-4 flex flex-col gap-4 border-b border-outline-variant/10">
            <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
              <Settings size={20} className="text-primary" />
              Parámetros de Entrada
            </h3>
            <div className="flex p-1 bg-surface-container rounded-lg">
              <button onClick={() => setPhase('mono')} className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded transition-all ${phase === 'mono' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Monofásico</button>
              <button onClick={() => setPhase('tri')} className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded transition-all ${phase === 'tri' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Trifásico</button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {mode === 'current' && (
              <InputField 
                label="Potencia Activa (kW)" 
                value={power} 
                onChange={setPower} 
                unit="kW" 
                formula={`I = P / (${phase === 'tri' ? '√3 × ' : ''}V × cosφ)`}
              />
            )}
            
            <InputField 
              label={phase === 'tri' ? "Tensión de Línea (V)" : "Tensión (V)"} 
              value={voltage} 
              onChange={setVoltage} 
              unit={phase === 'tri' ? "VAC (L-L)" : "VAC"} 
              formula={mode === 'power' ? `P = ${phase === 'tri' ? '√3 × ' : ''}V × I × cosφ` : undefined}
            />
            
            {mode === 'power' && (
              <InputField 
                label={phase === 'tri' ? "Corriente por Fase (A)" : "Corriente (A)"} 
                value={current} 
                onChange={setCurrent} 
                unit="Amps" 
              />
            )}
            
            <InputField 
              label="Factor de Potencia (cos φ)" 
              value={pf} 
              onChange={setPf} 
              unit="φ" 
              step="0.01"
              max="1"
            />

            <button 
              onClick={handleCalculate}
              className="w-full mt-4 bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-lg font-headline font-extrabold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:shadow-lg"
            >
              <Calculator size={20} />
              {mode === 'power' ? `CALCULAR (${phase === 'tri' ? '√3' : 'P'})` : 'HALLAR INTENSIDAD (A)'}
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="lg:col-span-7 space-y-4">
          <h3 className="font-headline font-bold text-on-surface px-1">
            {mode === 'power' ? `Resultados de Cálculo (${phase === 'tri' ? 'Trifásico' : 'Monofásico'})` : 'Resultado del Cálculo Inverso'}
          </h3>
          
          {!results ? (
            <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-48 md:h-64 shadow-sm">
              <Calculator size={48} className="text-secondary/30 mb-4" />
              <p className="text-on-surface-variant font-medium">Presiona el botón "Calcular" para ver los resultados.</p>
            </div>
          ) : mode === 'power' ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-surface-container-low border-l-4 border-tertiary-fixed-dim rounded-xl p-6 flex justify-between items-center group hover:bg-surface-container transition-colors shadow-sm">
                <div>
                  <p className="text-[0.7rem] font-bold text-on-tertiary-fixed-variant uppercase tracking-widest mb-1">Potencia Activa {phase === 'tri' ? 'Total' : ''}</p>
                  <h4 className="text-4xl font-headline font-black text-on-surface tracking-tighter">{results.activePower.toFixed(2)} <span className="text-base font-bold text-on-surface-variant">kW</span></h4>
                </div>
                <div className="bg-tertiary-fixed-dim/20 p-4 rounded-full text-tertiary-container">
                  <Zap size={32} fill="currentColor" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard label="Potencia Reactiva" value={results.reactivePower.toFixed(2)} unit="kVAR" />
                <ResultCard label="Potencia Aparente" value={results.apparentPower.toFixed(2)} unit="kVA" />
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low border-l-4 border-secondary-container rounded-xl p-6 flex justify-between items-center group hover:bg-surface-container transition-colors shadow-sm">
              <div>
                <p className="text-[0.7rem] font-bold text-on-secondary-fixed-variant uppercase tracking-widest mb-1">Corriente por Fase</p>
                <h4 className="text-4xl font-headline font-black text-on-surface tracking-tighter">{results.calculatedCurrent.toFixed(2)} <span className="text-base font-bold text-on-surface-variant">Amps</span></h4>
              </div>
              <div className="bg-secondary-container/20 p-4 rounded-full text-secondary">
                <Zap size={32} fill="currentColor" />
              </div>
            </div>
          )}

          <div className="bg-secondary-container/10 rounded-lg p-4 flex items-start gap-3 border border-secondary-container/20 mt-6">
            <Info size={20} className="text-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-on-secondary-container font-medium leading-relaxed">
              {phase === 'tri' 
                ? "Los cálculos para sistemas trifásicos utilizan el factor √3 (1.732) asumiendo una carga perfectamente equilibrada entre las fases."
                : "Los cálculos asumen carga equilibrada. Para sistemas trifásicos, utilice la configuración Trifásica."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, unit, formula, step, max }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
        {formula && <span className="text-[0.65rem] font-mono text-primary/70 font-semibold italic hidden sm:block">{formula}</span>}
      </div>
      <div className="relative group">
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          max={max}
          className="w-full bg-surface-container-high border-none rounded focus:ring-2 focus:ring-primary transition-all px-4 py-3 text-on-surface font-body font-semibold text-lg outline-none" 
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-label text-xs font-bold">{unit}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5 hover:bg-surface-container-low transition-all shadow-sm">
      <p className="text-[0.65rem] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-headline font-bold text-on-surface">{value} <span className="text-xs font-semibold text-on-surface-variant">{unit}</span></h4>
    </div>
  );
}

// --- Voltage Drop Screen ---

function VoltageDropScreen() {
  const [phase, setPhase] = useState<Phase>('mono');
  const [material, setMaterial] = useState<Material>('cu');
  const [insulation, setInsulation] = useState<'pvc' | 'xlpe'>('pvc');
  const [power, setPower] = useState('3.5');
  const [distance, setDistance] = useState('45');
  const [section, setSection] = useState('4');

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(false);
  }, [phase, material, insulation, power, distance, section]);

  // Conductividad a máxima temperatura de servicio (Guía BT Anexo 2)
  // PVC = 70ºC, XLPE/EPR = 90ºC
  const getConductivity = (mat: Material, ins: 'pvc' | 'xlpe') => {
    if (mat === 'cu') {
      return ins === 'pvc' ? 48 : 44;
    } else {
      return ins === 'pvc' ? 30 : 28;
    }
  };

  const p = parseFloat(power) || 0;
  const l = parseFloat(distance) || 0;
  const s = parseFloat(section) || 1;
  const k = phase === 'mono' ? 2 : 1;
  const gamma = getConductivity(material, insulation);
  const v = phase === 'mono' ? 230 : 400;

  // Fórmula Guía Técnica REBT Anexo 2: e = K * P * L / (γ * S * U)
  const deltaU_volts = (k * (p * 1000) * l) / (gamma * s * v);
  const deltaU_percent = (deltaU_volts / v) * 100;

  const sections = ['1.5', '2.5', '4', '6', '10', '16', '25', '35'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span className="font-medium">Calculadoras</span>
          <span className="text-xs">/</span>
          <span className="font-bold text-primary">Caída de Tensión</span>
        </div>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-primary">Cálculo de Caída de Tensión</h2>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-sm md:text-base">Dimensionamiento técnico basado en la conductividad a temperatura máxima de servicio (Guía Técnica REBT Anexo 2).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Input Form */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
              <Cpu size={20} className="text-primary" />
              Parámetros de Entrada
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tipo de Circuito</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-lg">
                    <button onClick={() => setPhase('mono')} className={`py-2 rounded text-sm font-bold transition-colors ${phase === 'mono' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>Monofásico</button>
                    <button onClick={() => setPhase('tri')} className={`py-2 rounded text-sm font-bold transition-colors ${phase === 'tri' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>Trifásico</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Material Conductor</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-lg">
                    <button onClick={() => setMaterial('cu')} className={`py-2 rounded text-sm font-bold transition-colors border ${material === 'cu' ? 'bg-surface-container-lowest text-primary border-primary/20 shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>Cobre</button>
                    <button onClick={() => setMaterial('al')} className={`py-2 rounded text-sm font-bold transition-colors border ${material === 'al' ? 'bg-surface-container-lowest text-primary border-primary/20 shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>Aluminio</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tipo de Aislamiento</label>
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-lg">
                    <button onClick={() => setInsulation('pvc')} className={`py-2 rounded text-sm font-bold transition-colors border ${insulation === 'pvc' ? 'bg-surface-container-lowest text-primary border-primary/20 shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>PVC (70ºC)</button>
                    <button onClick={() => setInsulation('xlpe')} className={`py-2 rounded text-sm font-bold transition-colors border ${insulation === 'xlpe' ? 'bg-surface-container-lowest text-primary border-primary/20 shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>XLPE/EPR (90ºC)</button>
                  </div>
                </div>
                {/* Spacer for alignment */}
                <div className="hidden sm:block"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="Potencia de Carga" value={power} onChange={setPower} unit="kW" />
                <InputField label="Distancia a la Carga" value={distance} onChange={setDistance} unit="metros" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sección del Conductor (mm²)</label>
                <div className="flex flex-wrap gap-2">
                  {sections.map(sec => (
                    <button 
                      key={sec}
                      onClick={() => setSection(sec)}
                      className={`w-12 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors border ${
                        section === sec 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowResults(true)}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
              >
                <Calculator size={24} />
                CALCULAR CAÍDA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/15 flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 text-on-surface">Cálculo {phase === 'mono' ? 'Monofásico' : 'Trifásico'} (Guía Anexo 2)</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Considera retorno por neutro. Fórmula: e = {k} · P · L / (γ · S · U)</p>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/15 flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 text-on-surface">Normativa REBT</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Límites ITC-BT-19: 3% Alumbrado / 5% Fuerza Motriz.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <aside className="lg:col-span-5 space-y-6">
          {!showResults ? (
            <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
              <Calculator size={48} className="text-secondary/30 mb-4" />
              <p className="text-on-surface-variant font-medium">Presiona el botón "Calcular" para ver la caída de tensión.</p>
            </div>
          ) : (
            <>
              <div className="bg-primary text-white rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 opacity-10">
                  <Zap size={200} fill="currentColor" />
                </div>
                <h3 className="font-headline font-bold text-lg mb-8 flex items-center gap-2 opacity-90 relative z-10">
                  <BarChart2 size={20} />
                  Resultados del Cálculo
                </h3>
                
                <div className="space-y-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-primary-fixed-dim text-xs font-bold uppercase tracking-[0.2em] mb-1">Caída de Tensión Total</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-5xl font-black">{deltaU_volts.toFixed(2)}</span>
                      <span className="text-2xl font-bold opacity-80">V</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-primary-fixed-dim text-xs font-bold uppercase tracking-[0.2em] mb-1">Porcentaje ΔU</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-4xl font-black text-secondary-container">{deltaU_percent.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/20 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Uso Alumbrado</span>
                        {deltaU_percent <= 3 ? (
                           <span className="bg-tertiary-fixed-dim text-tertiary-container px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                             <Shield size={12} /> CUMPLE (3%)
                           </span>
                        ) : (
                          <span className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                            <AlertTriangle size={12} /> NO CUMPLE (3%)
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full ${deltaU_percent <= 3 ? 'bg-tertiary-fixed-dim' : 'bg-error'}`} style={{ width: `${Math.min(100, (deltaU_percent/3)*100)}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Otros Usos</span>
                        {deltaU_percent <= 5 ? (
                           <span className="bg-tertiary-fixed-dim text-tertiary-container px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                             <Shield size={12} /> CUMPLE (5%)
                           </span>
                        ) : (
                          <span className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                            <AlertTriangle size={12} /> NO CUMPLE (5%)
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full ${deltaU_percent <= 5 ? 'bg-tertiary-fixed-dim' : 'bg-error'}`} style={{ width: `${Math.min(100, (deltaU_percent/5)*100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {deltaU_percent > 3 && (
                <div className="bg-error-container text-on-error-container rounded-xl p-5 flex gap-4 border border-error/20 shadow-sm">
                  <AlertTriangle size={24} className="text-error shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm mb-1">Acción Recomendada</h4>
                    <p className="text-xs leading-relaxed opacity-90">Para circuitos de alumbrado, aumente la sección a la siguiente disponible para reducir la caída de tensión por debajo del límite reglamentario del 3%.</p>
                  </div>
                </div>
              )}

              <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/15 shadow-sm">
                <div className="px-5 py-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-high">
                  <span className="font-bold text-sm uppercase tracking-wider text-on-surface">Desglose Técnico</span>
                  <List size={18} className="text-on-surface-variant" />
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-outline-variant/10">
                      <td className="p-4 font-semibold text-on-surface-variant">Conductividad (γ)</td>
                      <td className="p-4 text-right font-bold text-on-surface">{gamma} m/(Ω·mm²)</td>
                    </tr>
                    <tr className="bg-surface-container-low border-b border-outline-variant/10">
                      <td className="p-4 font-semibold text-on-surface-variant">Intensidad (Ib)</td>
                      <td className="p-4 text-right font-bold text-on-surface">
                        {(phase === 'mono' ? (p * 1000) / v : (p * 1000) / (Math.sqrt(3) * v)).toFixed(2)} A
                      </td>
                    </tr>
                    <tr className="border-b border-outline-variant/10">
                      <td className="p-4 font-semibold text-on-surface-variant">Pérdida Potencia</td>
                      <td className="p-4 text-right font-bold text-on-surface">
                        {(deltaU_volts * (phase === 'mono' ? (p * 1000) / v : (p * 1000) / (Math.sqrt(3) * v)) * (phase === 'mono' ? 1 : Math.sqrt(3))).toFixed(1)} W
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// --- Protections Screen ---

function ProtectionsScreen() {
  const [activeTab, setActiveTab] = useState<'pia' | 'dif'>('pia');
  const [scope, setScope] = useState<'domestic' | 'industrial'>('industrial');
  
  // PIA state
  const [current, setCurrent] = useState('16');
  const [curve, setCurve] = useState('C');
  const [poles, setPoles] = useState('2');
  const [showPiaResults, setShowPiaResults] = useState(false);

  // Dif state
  const [difPoles, setDifPoles] = useState('2');
  const [difCurrent, setDifCurrent] = useState('40');
  const [difSensibility, setDifSensibility] = useState('30');
  const [difClass, setDifClass] = useState('AC');
  const [showDifResults, setShowDifResults] = useState(false);

  useEffect(() => {
    setShowPiaResults(false);
  }, [current, curve, poles, scope]);

  useEffect(() => {
    setShowDifResults(false);
  }, [difPoles, difCurrent, difSensibility, difClass, scope]);

  const pias = [10, 16, 20, 25, 32, 40, 50, 63];
  const difCurrents = [25, 40, 63, 80, 100, 125];
  const difSensibilities = scope === 'industrial' ? [30, 100, 300, 500] : [10, 30, 300];
  const difClasses = scope === 'industrial' ? ['AC', 'A', 'A-SI', 'B-EV'] : ['AC', 'A', 'A-SI'];

  const getSchneiderPia = () => {
    if (scope === 'domestic') {
      const pCode = poles === '1+N' ? '6' : poles === '4' ? '4' : '2';
      const iCode = current.padStart(2, '0');
      const ref = `R9P12${pCode}${iCode}`;
      const basePrice = poles === '1+N' ? 14.50 : poles === '4' ? 45.00 : 25.80;
      return {
        model: "Resi9 (Gama Residencial)",
        desc: "Optimizada para cuadros de distribución en viviendas. Diseño compacto y fácil instalación con peines.",
        ref,
        price: (basePrice * (parseInt(current) / 16)).toFixed(2),
        link: `https://www.se.com/es/es/search/${ref}`
      };
    } else {
      const refBase = "A9F7";
      // B=8, C=9, D=5 based on latest screenshots
      const cCode = curve === "C" ? "9" : curve === "B" ? "8" : "5";
      const pCode = poles === "1+N" ? "6" : poles === "2" ? "2" : poles === "4" ? "4" : "1";
      const iCode = current.padStart(2, "0");
      const ref = `${refBase}${cCode}${pCode}${iCode}`;
      
      // Price targets: ~120€ for 2P, ~320€ for 4P
      const baseVal = poles === '4' ? 315.00 : poles === '2' ? 118.00 : 85.00;
      const currentFactor = parseInt(current) / 16;
      
      return {
        model: "Acti9 iC60N (Industrial)",
        desc: `Gama robusta con VisiSafe y VisiTrip. Curva ${curve}: ${getCurveDesc(curve)}`,
        ref,
        price: (baseVal * (currentFactor > 1 ? 1 + (currentFactor-1)*0.2 : currentFactor)).toFixed(2),
        link: `https://www.se.com/es/es/search/${ref}`
      };
    }
  };

  const getCurveDesc = (c: string) => {
    const descs: Record<string, string> = {
      'B': 'Disparo rápido (3-5 In). Ideal para cables muy largos o generadores.',
      'C': 'Estándar (5-10 In). Uso general en iluminación y tomas de corriente.',
      'D': 'Retardado (10-14 In). Para motores, transformadores y cargas con fuertes picos de arranque.'
    };
    return descs[c] || '';
  };

  const getSchneiderDif = () => {
    if (scope === 'domestic') {
      const classCode = difClass === "AC" ? "112" : difClass === "A" ? "122" : "172";
      const iCode = difCurrent.padStart(2, "0");
      const ref = `R9R${classCode}${iCode}`;
      const basePrice = difClass === 'AC' ? 48.00 : difClass === 'A' ? 72.00 : 135.00;
      return {
        model: "Resi9 RCD (Vivienda)",
        desc: "Diferencial estándar para el hogar. Protección eficaz de personas contra contactos indirectos.",
        ref,
        price: basePrice.toFixed(2),
        link: `https://www.se.com/es/es/search/${ref}`
      };
    } else {
      let rangeBase = "A9R";
      let classCode = "";
      
      // Mapping based on iID screenshots:
      // AC 30mA: 81, A 30mA: 21, A-SI 30mA: 61, AC 300mA: 84
      if (difSensibility === "30") {
        if (difClass === "AC") classCode = "81";
        else if (difClass === "A") classCode = "21";
        else if (difClass === "A-SI") classCode = "61";
      } else {
        // 300mA logic
        if (difClass === "AC") classCode = "84";
        else if (difClass === "A") classCode = "24";
        else if (difClass === "A-SI") classCode = "64";
      }

      if (difClass === "B-EV") {
        rangeBase = "A9Z";
        classCode = "51";
      }

      const pCode = difPoles === "4" ? "4" : "2";
      const iCode = difCurrent.padStart(2, "0");
      const ref = `${rangeBase}${classCode}${pCode}${iCode}`;
      
      let basePrice = 0;
      if (difClass === 'AC') basePrice = difSensibility === "30" ? 220 : 185;
      else if (difClass === 'A') basePrice = 280;
      else if (difClass === 'A-SI') basePrice = 360;
      else if (difClass === 'B-EV') basePrice = 550;

      if (difPoles === '4') basePrice *= 2.8; // Match screenshot prices (4P AC 30mA ~635€)

      return {
        model: `Acti9 iID (${difClass})`,
        desc: getClassJustification(difClass, difSensibility),
        ref,
        price: basePrice.toFixed(2),
        link: `https://www.se.com/es/es/search/${ref}`
      };
    }
  };

  const getClassJustification = (cls: string, sens: string) => {
    const sDesc = sens === "30" ? "Alta sensibilidad (Personas)." : "Baja sensibilidad (Incendio/Máquinas).";
    const cDescs: Record<string, string> = {
      'AC': `Uso básico. ${sDesc} Solo detecta fugas en corriente alterna senoidal.`,
      'A': `Electrónica. ${sDesc} Detecta fugas alternas y pulsantes (rectificadores, lavadoras).`,
      'A-SI': `Superinmunizado. Sistema reforzado contra disparos intempestivos por armónicos o rayos.`,
      'B-EV': `Vehículo Eléctrico. Obligatorio para detectar fugas en corriente continua pura (>6mA).`
    };
    return cDescs[cls] || '';
  };

  const schneiderPia = getSchneiderPia();
  const schneiderDif = getSchneiderDif();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span className="font-medium">Selección</span>
          <span className="text-xs">/</span>
          <span className="font-bold text-primary">Protecciones Schneider</span>
        </div>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-primary">Recomendador Schneider</h2>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-sm md:text-base">Selección de protecciones con referencias exactas basadas en el catálogo actual de Schneider Electric.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15">
          <div className="flex gap-2 mb-3">
            <Home size={18} className="text-secondary" />
            <h4 className="font-bold text-sm">Gama Resi9 (Doméstico)</h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Diseñada exclusivamente para viviendas. Cumple la norma EN 60898-1. Su ventaja es el precio competitivo y la facilidad de montaje en cuadros residenciales. 
          </p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15">
          <div className="flex gap-2 mb-3">
            <Building2 size={18} className="text-primary" />
            <h4 className="font-bold text-sm">Gama Acti9 (Industrial)</h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Uso en industria, hospitales y centros de datos. Mayor poder de corte (Icu/Ics) y funciones de seguridad avanzada como VisiSafe (franja verde de corte seguro).
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/15 shrink-0">
          <button
            className={`flex-1 md:w-40 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'pia' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
            onClick={() => setActiveTab('pia')}
          >
            <Shield size={16} />
            Magnetos
          </button>
          <button
            className={`flex-1 md:w-40 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'dif' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
            onClick={() => setActiveTab('dif')}
          >
            <Zap size={16} />
            Diferenciales
          </button>
        </div>

        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/15 flex-1 max-w-md">
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${scope === 'industrial' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            onClick={() => setScope('industrial')}
          >
            <Building2 size={16} />
            Industrial (Acti9)
          </button>
          <button
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${scope === 'domestic' ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            onClick={() => setScope('domestic')}
          >
            <Home size={16} />
            Vivienda (Resi9)
          </button>
        </div>
      </div>

      {activeTab === 'pia' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15 flex flex-col">
              <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
                <Shield size={20} className="text-primary" />
                Parámetros del Magnetotérmico
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Intensidad Nominal (In)</label>
                  <div className="flex flex-wrap gap-2">
                    {pias.map(val => (
                      <button 
                        key={val}
                        onClick={() => setCurrent(val.toString())}
                        className={`w-12 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors border ${
                          current === val.toString() 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                        }`}
                      >
                        {val}A
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Curva de Disparo</label>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-lg">
                      {['B', 'C', 'D'].map(c => (
                        <button 
                          key={c}
                          onClick={() => setCurve(c)} 
                          className={`py-2 rounded text-sm font-bold transition-colors ${curve === c ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Polos</label>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-lg">
                      {['1+N', '2', '4'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setPoles(p)} 
                          className={`py-2 rounded text-sm font-bold transition-colors ${poles === p ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                          {p}P
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container px-4 py-3 rounded-lg border border-outline-variant/15 flex items-center justify-between mt-4">
                  <span className="text-sm font-bold text-on-surface-variant">Poder de Corte (kA)</span>
                  <span className="text-sm font-black text-on-surface">6 kA / 10 kA</span>
                </div>
                
                <button 
                  onClick={() => setShowPiaResults(true)}
                  className="w-full bg-[#3dcd58] text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8 hover:opacity-90"
                >
                  <Search size={22} />
                  BUSCAR EN SCHNEIDER ELECTRIC
                </button>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            {!showPiaResults ? (
              <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
                <Shield size={48} className="text-secondary/30 mb-4" />
                <p className="text-on-surface-variant font-medium">Configura los parámetros y busca para ver el modelo recomendado de Schneider Electric.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden border border-[#3dcd58]/30">
                <div className="absolute -right-8 -top-8 opacity-5">
                  <Shield size={200} fill="currentColor" className="text-[#3dcd58]" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="bg-[#3dcd58]/20 text-[#2b903e] p-2 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-[#2b903e] tracking-tight">PIA Recomendado</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Gama Terciario e Industria</p>
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-col">
                    <span className="font-headline text-3xl font-black text-on-surface mb-1">{schneiderPia.model}</span>
                    <div className="flex items-center gap-2 mb-4 bg-tertiary-fixed-dim/10 rounded-lg p-3 border border-tertiary-fixed-dim/20">
                      <Shield size={18} className="text-tertiary-fixed-dim shrink-0" />
                      <p className="text-[10px] text-tertiary-container font-bold uppercase leading-tight">
                        Justificación Curva {curve}: {getCurveDesc(curve)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-sm font-bold mt-1">
                      <div className="flex gap-2 text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">
                        <span>Ref:</span>
                        <span className="text-on-surface select-all tracking-wider">{schneiderPia.ref}</span>
                      </div>
                      <div className="bg-secondary/10 text-secondary px-3 py-2 rounded-lg flex items-center gap-2">
                        <Tag size={14} />
                        <span>PVP aprox: {schneiderPia.price}€</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Intensidad</span>
                      <span className="font-black text-sm">{current} A</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Curva</span>
                      <span className="font-black text-sm">{curve}</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Polos</span>
                      <span className="font-black text-sm">{poles}</span>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {schneiderPia.desc}
                  </p>

                  <a 
                    href={schneiderPia.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 w-full py-3 bg-[#3dcd58] text-white font-bold rounded-lg hover:bg-[#2b903e] shadow-sm transition-colors mt-2"
                  >
                    <span>Ver en catálogo Schneider</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {activeTab === 'dif' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15 flex flex-col">
              <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
                <Zap size={20} className="text-primary" />
                Parámetros del Diferencial
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Calibre In (A)</label>
                  <div className="flex flex-wrap gap-2">
                    {difCurrents.map(val => (
                      <button 
                        key={val}
                        onClick={() => setDifCurrent(val.toString())}
                        className={`w-14 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors border ${
                          difCurrent === val.toString() 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                        }`}
                      >
                        {val}A
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sensibilidad IΔn (mA)</label>
                  <div className="flex flex-wrap gap-2">
                    {difSensibilities.map(val => (
                      <button 
                        key={val}
                        onClick={() => setDifSensibility(val.toString())}
                        className={`h-10 px-4 flex items-center justify-center rounded font-bold text-sm transition-colors border ${
                          difSensibility === val.toString() 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                        }`}
                      >
                        {val} mA
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Clase</label>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-lg">
                      {difClasses.map(c => (
                        <button 
                          key={c}
                          onClick={() => setDifClass(c)} 
                          className={`py-2 rounded text-sm font-bold transition-colors ${difClass === c ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Polos</label>
                    <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-lg">
                      {['2', '4'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setDifPoles(p)} 
                          className={`py-2 rounded text-sm font-bold transition-colors ${difPoles === p ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                        >
                          {p}P
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowDifResults(true)}
                  className="w-full bg-[#3dcd58] text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8 hover:opacity-90"
                >
                  <Search size={22} />
                  BUSCAR EN SCHNEIDER ELECTRIC
                </button>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            {!showDifResults ? (
              <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
                <Zap size={48} className="text-secondary/30 mb-4" />
                <p className="text-on-surface-variant font-medium">Configura los parámetros y busca para ver el modelo recomendado de Schneider Electric.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl relative overflow-hidden border border-[#3dcd58]/30">
                <div className="absolute -right-8 -top-8 opacity-5">
                  <Zap size={200} fill="currentColor" className="text-[#3dcd58]" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="bg-[#3dcd58]/20 text-[#2b903e] p-2 rounded-lg">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-[#2b903e] tracking-tight">Diferencial Recomendado</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Gama Terciario e Industria</p>
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-col">
                    <span className="font-headline text-3xl font-black text-on-surface mb-1">{schneiderDif.model}</span>
                    <div className="flex items-center gap-2 mb-4 bg-[#3dcd58]/10 rounded-lg p-3 border border-[#3dcd58]/20">
                      <Zap size={18} className="text-[#3dcd58] shrink-0" />
                      <p className="text-[10px] text-[#2b903e] font-bold uppercase leading-tight">
                        Justificación Clase {difClass}: {getClassJustification(difClass, difSensibility)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-sm font-bold mt-1">
                      <div className="flex gap-2 text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">
                        <span>Ref:</span>
                        <span className="text-on-surface select-all tracking-wider">{schneiderDif.ref}</span>
                      </div>
                      <div className="bg-secondary/10 text-secondary px-3 py-2 rounded-lg flex items-center gap-2">
                        <Tag size={14} />
                        <span>PVP aprox: {schneiderDif.price}€</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Calibre In</span>
                      <span className="font-black text-sm">{difCurrent} A</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sensibilidad</span>
                      <span className="font-black text-sm">{difSensibility} mA</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Clase</span>
                      <span className="font-black text-sm">{difClass}</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Polos</span>
                      <span className="font-black text-sm">{difPoles}</span>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {schneiderDif.desc}
                  </p>

                  <a 
                    href={schneiderDif.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 w-full py-3 bg-[#3dcd58] text-white font-bold rounded-lg hover:bg-[#2b903e] shadow-sm transition-colors mt-2"
                  >
                    <span>Ver en catálogo Schneider</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// --- Tubing Screen ---

function CanalizacionScreen() {
  const [activeTab, setActiveTab] = useState<'tubos' | 'bandejas'>('tubos');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Canalización</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Dimensionado de tubos y bandejas de acuerdo con el REBT.</p>
      </header>

      <div className="flex bg-surface-container p-1 rounded-xl shadow-inner border border-outline-variant/30 mb-6 max-w-sm">
        <button 
          onClick={() => setActiveTab('tubos')} 
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'tubos' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
        >
          Tubos
        </button>
        <button 
          onClick={() => setActiveTab('bandejas')} 
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'bandejas' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
        >
          Bandejas
        </button>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'tubos' ? (
            <motion.div key="tubos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <TubingCalculator />
            </motion.div>
          ) : (
            <motion.div key="bandejas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
                <Layers size={48} className="text-secondary/30 mb-4" />
                <h3 className="font-headline font-bold text-lg mb-2">Cálculo de Bandejas Próximamente</h3>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto">Dimensionamiento de bandejas portacables y canales protectoras según REBT.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TubingCalculator() {
  const [section, setSection] = useState('1.5');
  const [conductors, setConductors] = useState('3');
  const [installMethod, setInstallMethod] = useState<'surface' | 'flush'>('surface');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(false);
  }, [section, conductors, installMethod]);

  const sections = ['1.5', '2.5', '4', '6', '10', '16', '25', '35', '50'];
  
  // ITC-BT-21 simplified tables
  const getTubeDiameter = (sec: string, conds: string, method: string) => {
    const s = parseFloat(sec);
    const c = parseInt(conds);
    const isUpTo3 = c <= 3;
    
    if (method === 'surface') {
      if (s <= 1.5) return isUpTo3 ? 12 : 16;
      if (s <= 2.5) return isUpTo3 ? 16 : 20;
      if (s <= 4) return isUpTo3 ? 16 : 20;
      if (s <= 6) return isUpTo3 ? 20 : 25;
      if (s <= 10) return isUpTo3 ? 25 : 32;
      if (s <= 16) return isUpTo3 ? 25 : 32;
      if (s <= 25) return isUpTo3 ? 32 : 40;
      if (s <= 35) return isUpTo3 ? 40 : 50;
      return isUpTo3 ? 50 : 63;
    } else {
      // Flush/Embedded (Empotrados)
      if (s <= 1.5) return isUpTo3 ? 16 : 16;
      if (s <= 2.5) return isUpTo3 ? 16 : 20;
      if (s <= 4) return isUpTo3 ? 20 : 20;
      if (s <= 6) return isUpTo3 ? 20 : 25;
      if (s <= 10) return isUpTo3 ? 25 : 25;
      if (s <= 16) return isUpTo3 ? 25 : 32;
      if (s <= 25) return isUpTo3 ? 32 : 40;
      if (s <= 35) return isUpTo3 ? 40 : 40;
      return isUpTo3 ? 40 : 50;
    }
  };

  const diameter = getTubeDiameter(section, conductors, installMethod);

  return (
    <div className="px-1 py-2 md:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15 flex flex-col">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
              <BookOpen size={20} className="text-primary" />
              Parámetros de la Instalación
            </h3>
            
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Método de Instalación</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setInstallMethod('surface')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      installMethod === 'surface' 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="h-2 w-16 bg-current rounded-full mb-1"></div>
                    Montaje Superficial
                  </button>
                  <button 
                    onClick={() => setInstallMethod('flush')}
                    className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      installMethod === 'flush' 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="h-8 w-16 border-4 border-t-0 border-current rounded-b-lg mb-1 relative overflow-hidden">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-current rounded-full opacity-30"></div>
                    </div>
                    Empotrado / Oculto
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sección del Conductor</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {sections.map(val => (
                    <button 
                      key={val}
                      onClick={() => setSection(val)}
                      className={`h-12 flex items-center justify-center rounded font-bold transition-all border ${
                        section === val 
                          ? 'bg-primary text-white border-primary shadow-md scale-105' 
                          : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      {val} mm²
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Número de Conductores</label>
                <div className="grid grid-cols-4 gap-2 bg-surface-container-low p-2 rounded-xl">
                  {['2', '3', '4', '5'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setConductors(c)} 
                      className={`py-3 rounded-lg text-lg font-black transition-all ${conductors === c ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => setShowResults(true)}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
              >
                <Calculator size={24} />
                CALCULAR TUBO
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          {!showResults ? (
            <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
              <BookOpen size={48} className="text-secondary/30 mb-4" />
              <p className="text-on-surface-variant font-medium">Presiona el botón "Calcular" para ver el tubo recomendado.</p>
            </div>
          ) : (
            <>
              <div className="bg-primary text-white rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 opacity-10">
                  <BookOpen size={200} fill="currentColor" />
                </div>
                <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-6 relative z-10">Resultado ITC-BT-21</h3>
                
                <div className="relative z-10 flex flex-col items-center justify-center my-8">
                  <div className="w-48 h-48 rounded-full border-8 border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-inner relative">
                    <div className="absolute inset-0 rounded-full border-2 border-white/30 m-3"></div>
                    <div className="text-center">
                      <span className="text-6xl font-black tracking-tighter">Ø{diameter}</span>
                      <span className="block text-sm font-bold opacity-80 mt-1 uppercase tracking-widest">Milímetros</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-center relative z-10 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  Diámetro exterior mínimo para <strong>{conductors}</strong> conductores de <strong>{section} mm²</strong> en 
                  montaje <strong>{installMethod === 'surface' ? 'Superficial' : 'Empotrado'}</strong>.
                </p>
              </div>

              <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/15 flex gap-4 items-start shadow-sm">
                <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-on-surface">Consideraciones</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Para más de 5 conductores por tubo, la sección interior de este será, como mínimo, igual a {installMethod === 'surface' ? '2.5' : '3'} veces la sección ocupada por los conductores.
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function InstallationScreen() {
  const [voltageLevel, setVoltageLevel] = useState<'mbts' | 'under500' | 'over500'>('under500');
  const [length, setLength] = useState('50');
  const [measuredRes, setMeasuredRes] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(false);
  }, [voltageLevel, length, measuredRes]);

  // Valores según ITC-BT-19 / UNE HD 60364-6
  const getRequirements = () => {
    switch (voltageLevel) {
      case 'mbts':
        return { testV: 250, baseMinRes: 0.5, desc: "Muy Baja Tensión de Seguridad (MBTS) o de Protección (MBTP)" };
      case 'under500':
        return { testV: 500, baseMinRes: 1.0, desc: "Instalaciones de tensión nominal hasta 500 V (incluye 230/400V)." };
      case 'over500':
        return { testV: 1000, baseMinRes: 1.0, desc: "Instalaciones de tensión nominal superior a 500 V." };
    }
  };

  const reqs = getRequirements();
  const l = parseFloat(length) || 0;
  
  // ITC-BT-19: Si L > 100m, R_min = base / (L / 100) = base * 100 / L
  const minRequiredRes = l > 100 ? (reqs.baseMinRes * 100) / l : reqs.baseMinRes;
  
  const mRes = parseFloat(measuredRes);
  const isCompliant = !isNaN(mRes) && mRes >= minRequiredRes;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span className="font-medium">Calculadoras</span>
          <span className="text-xs">/</span>
          <span className="font-bold text-primary">Aislamiento</span>
        </div>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Resistencia de Aislamiento</h2>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-base">Cálculo de valores mínimos requeridos según ITC-BT-19 y verificación de medidas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15 flex flex-col">
            <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2 text-on-surface">
              <Settings size={20} className="text-primary" /> Parámetros de la Prueba
            </h3>
            
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">Tensión Nominal del Circuito</span>
                  <select 
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border-none text-on-surface font-semibold focus:ring-2 focus:ring-primary transition-all"
                    value={voltageLevel}
                    onChange={(e) => setVoltageLevel(e.target.value as any)}
                  >
                    <option value="mbts">MBTS / MBTP (Muy Baja Tensión)</option>
                    <option value="under500">≤ 500 V (Ej: 230V / 400V)</option>
                    <option value="over500">&gt; 500 V</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                  label="Longitud (L)" 
                  value={length} 
                  onChange={setLength} 
                  unit="m" 
                />
                <InputField 
                  label="Valor Medido" 
                  value={measuredRes} 
                  onChange={setMeasuredRes} 
                  unit="MΩ" 
                  placeholder="Ej: 1.5"
                />
              </div>
              
              <div className="mt-2 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex gap-3">
                <Info className="text-primary shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  {reqs.desc} El ensayo debe realizarse en corriente continua, con la instalación sin tensión. Para L &gt; 100m, la resistencia mínima admitida decrece proporcionalmente.
                </p>
              </div>
              
              <button 
                onClick={() => setShowResults(true)}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
              >
                <Calculator size={24} />
                VERIFICAR AISLAMIENTO
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          {!showResults ? (
            <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
              <Gauge size={48} className="text-secondary/30 mb-4" />
              <p className="text-on-surface-variant font-medium">Presiona el botón "Verificar" para calcular las exigencias y evaluar la viabilidad.</p>
            </div>
          ) : (
            <>
              <div className="bg-primary text-white rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                 <div className="absolute -right-8 -top-8 opacity-10">
                  <Gauge size={200} fill="currentColor" />
                </div>
                <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
                  <BarChart2 size={18} /> Validación ITC-BT-19
                </h3>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-primary-fixed-dim text-xs font-bold uppercase tracking-[0.2em] mb-1">Tensión de Ensayo Requerida</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-4xl font-black">{reqs.testV}</span>
                      <span className="text-xl font-bold opacity-80">V cc</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Mínimo Exigido</span>
                        <span className="font-black">≥ {minRequiredRes.toFixed(2)} MΩ</span>
                      </div>
                      {l > 100 && (
                        <p className="text-[10px] text-primary-fixed leading-tight mt-1 opacity-80">
                          *Penalización por distancia aplicada ({l}m &gt; 100m)
                        </p>
                      )}
                    </div>
                    
                    {measuredRes !== '' && (
                      <div className={`p-5 rounded-lg border flex flex-col gap-2 ${isCompliant ? 'bg-tertiary-container/30 border-tertiary-container' : 'bg-error/20 border-error/50'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider">Tu Medición</span>
                          <span className={`font-black ${isCompliant ? 'text-tertiary-fixed-dim' : 'text-error-container'}`}>
                            {mRes} MΩ
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {isCompliant ? (
                             <span className="bg-tertiary-fixed-dim text-tertiary-container px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                               <Shield size={12} /> CUMPLE NORMATIVA
                             </span>
                           ) : (
                             <span className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                               <AlertTriangle size={12} /> NO CUMPLE NORMATIVA
                             </span>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {!isCompliant && measuredRes !== '' && (
                <div className="bg-error-container text-on-error-container rounded-xl p-5 flex gap-4 border border-error/20 shadow-sm">
                  <AlertTriangle size={24} className="text-error shrink-0" />
                  <div>
                     <h4 className="font-bold text-sm mb-1">Acción Recomendada</h4>
                     <p className="text-xs leading-relaxed opacity-90">
                       Revise conexiones, limpie terminales o identifique tramos con humedad. La instalación debe cortarse en sectores más pequeños para acotar la causa del fallo de aislamiento.
                     </p>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// Base reference ampacity table (Cu, 3x XLPE/Z1 90°C, Method B1 at 40°C ambient air)
const BASE_SECTIONS_B1_CU_90 = [
  { s: 1.5, izBase: 17.5, xOhmKm: 0.105 },
  { s: 2.5, izBase: 24.0, xOhmKm: 0.098 },
  { s: 4, izBase: 32.0, xOhmKm: 0.092 },
  { s: 6, izBase: 41.0, xOhmKm: 0.087 },
  { s: 10, izBase: 57.0, xOhmKm: 0.082 },
  { s: 16, izBase: 76.0, xOhmKm: 0.078 },
  { s: 25, izBase: 101.0, xOhmKm: 0.076 },
  { s: 35, izBase: 125.0, xOhmKm: 0.074 },
  { s: 50, izBase: 151.0, xOhmKm: 0.072 },
  { s: 70, izBase: 192.0, xOhmKm: 0.071 },
  { s: 95, izBase: 232.0, xOhmKm: 0.070 },
  { s: 120, izBase: 269.0, xOhmKm: 0.069 },
  { s: 150, izBase: 300.0, xOhmKm: 0.068 },
  { s: 185, izBase: 341.0, xOhmKm: 0.068 },
  { s: 240, izBase: 400.0, xOhmKm: 0.067 },
  { s: 300, izBase: 458.0, xOhmKm: 0.066 }
];

const METHOD_FACTORS_UNE: Record<string, number> = {
  A1: 0.78,
  A2: 0.73,
  B1: 1.00,
  B2: 0.89,
  C: 1.14,
  D1: 0.92,
  D2: 0.96,
  E: 1.22,
  F: 1.31
};

const GROUPING_TABLE_B52_17: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  5: 0.60,
  6: 0.57,
  7: 0.54,
  8: 0.52,
  9: 0.50,
  10: 0.48,
  11: 0.46,
  12: 0.45
};

const STANDARD_IN_CALIBRES = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630
];

function computeProtectiveSection(sf: number): number {
  if (sf <= 16) return sf;
  if (sf <= 35) return 16;
  return sf / 2;
}

function AdvancedCircuitScreen({
  circuits,
  setCircuits,
  onShowToast,
  onOpenExport,
  onTransferToCAD
}: {
  circuits: CircuitRecord[];
  setCircuits: React.Dispatch<React.SetStateAction<CircuitRecord[]>>;
  onShowToast: (msg: string) => void;
  onOpenExport: () => void;
  onTransferToCAD: (panelConfig: PanelBoardConfig) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'condiciones' | 'receptor' | 'seccion' | 'tabla' | 'cuadro'
  >('receptor');

  // --- PanelBoard Configuration (Cabecera IGA, SPD, Diferenciales y Repartidor) ---
  const [panelConfig, setPanelConfig] = useState<PanelBoardConfig>(() => {
    const saved = localStorage.getItem('voltmetric_panel_config_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PANEL_CONFIG, ...parsed };
      } catch (e) {}
    }
    return DEFAULT_PANEL_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('voltmetric_panel_config_v1', JSON.stringify(panelConfig));
  }, [panelConfig]);

  // --- State for Receptor Tab ---
  const [alimentacion, setAlimentacion] = useState<'3F+N' | '3F' | '1F+N'>('3F+N');
  const [tension, setTension] = useState('400.0');
  const [aislamiento, setAislamiento] = useState<'Z1' | 'XLPE' | 'PVC' | 'EPR'>('Z1');
  const [grupoId, setGrupoId] = useState<string>('ID2');
  const [numero, setNumero] = useState('1');
  const [potencia, setPotencia] = useState('15.0');
  const [intensidadDirecta, setIntensidadDirecta] = useState('25.47');
  const [cosPhi, setCosPhi] = useState('0.85');
  const [tercerArmonico, setTercerArmonico] = useState('0.0');
  const [fu, setFu] = useState('1.0');
  const [fs, setFs] = useState('1.0');
  const [longitud, setLongitud] = useState('25.0');
  const [caidaMax, setCaidaMax] = useState('5.0');

  // Protection & Conductors in Receptor Tab
  const [tipoProteccion, setTipoProteccion] = useState<
    'Interruptor automático' | 'Fusible gG' | 'Guardamotor'
  >('Interruptor automático');
  const [modoIn, setModoIn] = useState<'auto' | 'manual'>('auto');
  const [intensidadNominal, setIntensidadNominal] = useState('32');
  const [curvaProteccion, setCurvaProteccion] = useState<'B' | 'C' | 'D' | 'MA'>('C');
  const [poderCorte, setPoderCorte] = useState<'6kA' | '10kA' | '15kA' | '25kA'>('6kA');
  const [irFactor, setIrFactor] = useState('1.00');
  const [conductoresPorFase, setConductoresPorFase] = useState('1');
  const [seccionMinima, setSeccionMinima] = useState('1.5');
  const [separacion, setSeparacion] = useState('En contacto (0 m)');
  const [circuitosAdicionales, setCircuitosAdicionales] = useState('0');
  const [frAgrupamiento, setFrAgrupamiento] = useState('1.00');
  const [frAdicional, setFrAdicional] = useState('1.00');

  // --- State for Condiciones Tab ---
  const [metodoInstalacion, setMetodoInstalacion] = useState('Bajo tubo empotrado en obra (mampostería)');
  const [disposicionCables, setDisposicionCables] = useState(
    'Agrupados en conducto, superficie, empotrados o bandeja'
  );
  const [metodo, setMetodo] = useState('B1');
  const [tempAmbiente, setTempAmbiente] = useState('40');
  const [profundidad, setProfundidad] = useState('0.7');
  const [resistividadTermica, setResistividadTermica] = useState('1.0');
  const [icc, setIcc] = useState('6.0');
  const [duracionIcc, setDuracionIcc] = useState('0.1');

  // Calculation Options
  const [tipoCalculo, setTipoCalculo] = useState<'potencia' | 'intensidad'>('potencia');
  const [tipoConductor, setTipoConductor] = useState<'cobre' | 'aluminio'>('cobre');
  const [calculoConductor, setCalculoConductor] = useState<'unipolar' | 'multiconductor'>('unipolar');

  // Manual section override from Tabla tab (null = Automatic UNE 60364-5-52)
  const [selectedManualSection, setSelectedManualSection] = useState<string | null>(null);

  // Circuit ID & search state
  const [circuitoId, setCircuitoId] = useState(`C${circuits.length + 1} - Nueva Línea`);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-map installation method + cable construction to UNE-HD 60364-5-52 reference method
  const handleInstallationMethodChange = (
    newMetodoInst: string,
    newCalculoCond: 'unipolar' | 'multiconductor' = calculoConductor
  ) => {
    setMetodoInstalacion(newMetodoInst);
    let mapped = 'B1';
    if (newMetodoInst.includes('pared aislante')) {
      mapped = newCalculoCond === 'unipolar' ? 'A1' : 'A2';
    } else if (newMetodoInst.includes('Bajo tubo')) {
      mapped = newCalculoCond === 'unipolar' ? 'B1' : 'B2';
    } else if (newMetodoInst.includes('Adosado directamente')) {
      mapped = 'C';
    } else if (newMetodoInst.includes('bandeja perforada')) {
      mapped = newCalculoCond === 'unipolar' ? 'F' : 'E';
    } else if (newMetodoInst.includes('enterrados bajo tubo')) {
      mapped = 'D1';
    } else if (newMetodoInst.includes('directamente enterrados')) {
      mapped = 'D2';
    }
    setMetodo(mapped);
  };

  // Auto-update grouping factor when circuitosAdicionales changes
  const handleCircuitosAdicionalesChange = (val: string) => {
    setCircuitosAdicionales(val);
    const totalCircs = (parseInt(val, 10) || 0) + 1;
    const tableFactor = GROUPING_TABLE_B52_17[Math.min(12, Math.max(1, totalCircs))] || 0.45;
    setFrAgrupamiento(tableFactor.toFixed(2));
  };

  // --- Core Normative Calculations (UNE-HD 60364-5-52 & REBT) ---
  const v = Math.max(12, parseFloat(tension) || (alimentacion === '1F+N' ? 230 : 400));
  const numReceptores = Math.max(1, parseFloat(numero) || 1);
  const cpf = Math.min(1, Math.max(0.1, parseFloat(cosPhi) || 0.85));
  const fuVal = Math.max(0.1, parseFloat(fu) || 1.0);
  const fsVal = Math.max(0.1, parseFloat(fs) || 1.0);
  const length = Math.max(0.5, parseFloat(longitud) || 10);
  const maxDropPct = Math.max(0.1, parseFloat(caidaMax) || 5.0);
  const nPorFase = Math.max(1, parseInt(conductoresPorFase, 10) || 1);
  const sMinReq = parseFloat(seccionMinima) || 1.5;
  const harmPct = parseFloat(tercerArmonico) || 0;

  const isMono = alimentacion === '1F+N';
  const rawPowerKw = parseFloat(potencia) || 0;
  const rawCurrentA = parseFloat(intensidadDirecta) || 0;

  // Effective design current Ib and total design power P_diseño (kW)
  const ib =
    tipoCalculo === 'potencia'
      ? isMono
        ? (rawPowerKw * 1000 * numReceptores * fuVal * fsVal) / (v * cpf)
        : (rawPowerKw * 1000 * numReceptores * fuVal * fsVal) / (Math.sqrt(3) * v * cpf)
      : rawCurrentA * numReceptores * fuVal * fsVal;

  const pCalculadaKw =
    tipoCalculo === 'potencia'
      ? rawPowerKw * numReceptores * fuVal * fsVal
      : isMono
      ? (ib * v * cpf) / 1000
      : (Math.sqrt(3) * ib * v * cpf) / 1000;

  // Automatic or manual nominal breaker rating In
  const autoInNumber =
    STANDARD_IN_CALIBRES.find((cal) => cal >= Math.max(ib, 6)) ||
    STANDARD_IN_CALIBRES[STANDARD_IN_CALIBRES.length - 1];
  const effectiveIn =
    modoIn === 'auto' ? autoInNumber : parseFloat(intensidadNominal) || autoInNumber;
  const irMult = Math.min(1.0, Math.max(0.5, parseFloat(irFactor) || 1.0));
  const effectiveIr = effectiveIn * irMult;

  // Correction Factors (UNE-HD 60364-5-52)
  const isBuried = metodo === 'D1' || metodo === 'D2';
  const is90C = aislamiento === 'Z1' || aislamiento === 'XLPE' || aislamiento === 'EPR';
  const tMaxCond = is90C ? 90 : 70;
  const tAmbNum = parseFloat(tempAmbiente) || (isBuried ? 25 : 40);
  const tRef = isBuried ? 20 : 30; // UNE reference (30°C air, 20°C ground)

  // Temperature correction factor Ft (Table B.52.14 / B.52.15)
  const kTemp = Math.max(
    0.35,
    Math.min(1.25, Math.sqrt(Math.max(5, tMaxCond - tAmbNum) / Math.max(5, tMaxCond - tRef)))
  );

  // Grouping factor Fg (Table B.52.17) * Fr adicional
  const kAgrup = Math.max(0.25, Math.min(1.0, parseFloat(frAgrupamiento) || 1.0));
  const kAdic = Math.max(0.25, Math.min(1.2, parseFloat(frAdicional) || 1.0));

  // Soil resistivity & depth factor for D1/D2
  let kTerreno = 1.0;
  if (isBuried) {
    const resNum = parseFloat(resistividadTermica) || 1.0;
    const profNum = parseFloat(profundidad) || 0.7;
    const fRes =
      resNum <= 0.5
        ? 1.28
        : resNum <= 0.7
        ? 1.2
        : resNum <= 1.0
        ? 1.18
        : resNum <= 1.5
        ? 1.1
        : resNum <= 2.0
        ? 1.05
        : 1.0;
    const fProf = profNum <= 0.5 ? 1.04 : profNum <= 0.7 ? 1.0 : profNum <= 1.0 ? 0.97 : 0.94;
    kTerreno = +(fRes * fProf).toFixed(3);
  }

  // 3rd Harmonic factor (UNE-HD 60364-5-52 Annex E.52.1 for 3F+N)
  let kArmonico = 1.0;
  if (alimentacion === '3F+N' && harmPct >= 15) {
    if (harmPct <= 33) kArmonico = 0.86;
    else if (harmPct <= 45) kArmonico = 0.86 * (3 * (harmPct / 100));
    else kArmonico = 0.75;
  }

  const kTotal = +(kTemp * kAgrup * kAdic * kTerreno * kArmonico).toFixed(4);

  // Short-circuit adiabatic constant K (UNE 60364-4-43)
  const kAdiabatic =
    tipoConductor === 'cobre' ? (is90C ? 143 : 115) : is90C ? 94 : 76;
  const iccPrevistaKa = Math.max(0, parseFloat(icc) || 0);
  const tIccSec = Math.max(0.02, parseFloat(duracionIcc) || 0.1);
  const sMinCortocircuito =
    iccPrevistaKa > 0 ? (iccPrevistaKa * 1000 * Math.sqrt(tIccSec)) / kAdiabatic : 0;

  // Method base multiplier, phase multiplier (2x mono vs 3x tri), material (Cu vs Al), insulation (90°C vs 70°C)
  const methodMult = METHOD_FACTORS_UNE[metodo] || 1.0;
  const phaseMult = isMono ? 1.12 : 1.0;
  const matMult = tipoConductor === 'aluminio' ? 0.78 : 1.0;
  const insulMult = is90C ? 1.0 : 0.84;

  // Conductivity at reference 20°C (Cu = 56, Al = 35 m/(Ω·mm²))
  const gamma20 = tipoConductor === 'cobre' ? 56.0 : 35.0;
  const alphaTemp = 0.00393;

  // Build full UNE-HD 60364-5-52 calculation table
  const tableRows = BASE_SECTIONS_B1_CU_90.map((base) => {
    const sNum = base.s;
    const izTabla = +(base.izBase * methodMult * phaseMult * matMult * insulMult).toFixed(1);
    const izCorregida = +(izTabla * kTotal * nPorFase).toFixed(2);

    // Real conductor operating temperature Tc (°C)
    const loadRatio = Math.min(1.5, ib / Math.max(1, izCorregida));
    const tRealCond = +(
      tAmbNum +
      (tMaxCond - tAmbNum) * Math.pow(Math.min(1.2, loadRatio), 2)
    ).toFixed(2);

    // Thermally corrected conductivity at real operating temperature (or normative max temp for sizing)
    const gammaReal = +(gamma20 / (1 + alphaTemp * (tRealCond - 20))).toFixed(2);
    const gammaNormative =
      tipoConductor === 'cobre' ? (is90C ? 44 : 48) : is90C ? 28 : 30;

    // Resistance R and Reactance X of the line (Ω)
    const rLineOhm = length / (gammaNormative * sNum * nPorFase);
    const xLineOhm = (base.xOhmKm * (length / 1000)) / nPorFase;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cpf * cpf));

    // Voltage drop ΔU (V and %) including R·cosφ + X·sinφ
    const factorRed = isMono ? 2 : Math.sqrt(3);
    const caidaVolts = factorRed * ib * (rLineOhm * cpf + xLineOhm * sinPhi);
    const caidaPct = (caidaVolts / v) * 100;

    // Short-circuit capability for this section
    const k2S2_MA2s = +((Math.pow(kAdiabatic * sNum * nPorFase, 2)) / 1e6).toFixed(2);
    const iccMaxCableKa = +((kAdiabatic * sNum * nPorFase) / (1000 * Math.sqrt(tIccSec))).toFixed(2);

    // Active power loss in line ΔP (W)
    const nPhasesCurrent = isMono ? 2 : 3;
    const powerLossWatts = +(nPhasesCurrent * Math.pow(ib, 2) * rLineOhm).toFixed(2);

    // Normative Checks:
    // 1. Minimum section (e.g. 1.5 mm² or user min, Al >= 16 mm² often recommended)
    const okMinSection = sNum >= sMinReq;
    // 2. Thermal overload: Ib <= Ir <= Iz'
    const okThermal = ib <= effectiveIr && effectiveIr <= izCorregida;
    // 3. Voltage drop: ΔU% <= ΔUmax%
    const okVoltageDrop = caidaPct <= maxDropPct;
    // 4. Short-circuit: Icc_prevista <= Icc_max_cable
    const okShortCircuit = iccPrevistaKa <= iccMaxCableKa;

    const passAll = okMinSection && okThermal && okVoltageDrop && okShortCircuit;
    const ratioPct = Math.min(999.9, (ib / Math.max(0.1, izCorregida)) * 100);

    return {
      s: sNum.toString(),
      sNum,
      izTabla: izTabla.toFixed(1),
      iz: izCorregida.toFixed(2),
      izNum: izCorregida,
      ibRatio: ratioPct.toFixed(1),
      caida: caidaPct.toFixed(2),
      caidaVolts: caidaVolts.toFixed(2),
      caidaNum: caidaPct,
      ir: okThermal ? effectiveIr.toFixed(1) : `${effectiveIr.toFixed(0)}!`,
      icc: iccMaxCableKa.toFixed(2),
      iccNum: iccMaxCableKa,
      tRealCond: tRealCond.toFixed(2),
      gammaReal: gammaReal.toFixed(1),
      rLineOhm: rLineOhm.toFixed(4),
      xLineOhm: xLineOhm.toFixed(4),
      k2S2: k2S2_MA2s.toFixed(2),
      powerLossWatts: powerLossWatts.toFixed(2),
      okMinSection,
      okThermal,
      okVoltageDrop,
      okShortCircuit,
      fail: !passAll,
      pass: passAll
    };
  });

  const optimalAutoRow = tableRows.find((r) => r.pass) || null;
  const activeRow =
    (selectedManualSection
      ? tableRows.find((r) => r.s === selectedManualSection)
      : optimalAutoRow) ||
    optimalAutoRow ||
    tableRows[tableRows.length - 1];

  // Neutral & Protective Conductor (CP/PE) sizing for activeRow
  const sfActiva = activeRow ? activeRow.sNum : 1.5;
  const snActiva =
    alimentacion === '3F'
      ? 0
      : alimentacion === '3F+N' && harmPct > 33
      ? BASE_SECTIONS_B1_CU_90.find((b) => b.s >= sfActiva * 1.45)?.s || sfActiva
      : sfActiva <= 16
      ? sfActiva
      : Math.max(16, sfActiva / 2);
  const scpActiva = computeProtectiveSection(sfActiva);

  const cableDesignation = useMemo(() => {
    const matStr = tipoConductor === 'cobre' ? 'Cu' : 'Al';
    const typeName =
      aislamiento === 'Z1'
        ? 'RZ1-K / H07Z1-K (AS)'
        : aislamiento === 'XLPE'
        ? 'RV-K (XLPE)'
        : aislamiento === 'EPR'
        ? 'DN-K (EPR)'
        : 'H07V-K (PVC)';
    if (alimentacion === '1F+N') {
      return `2x(${nPorFase}x${sfActiva}) + 1x${scpActiva}G mm² ${matStr} ${typeName}`;
    }
    if (alimentacion === '3F') {
      return `3x(${nPorFase}x${sfActiva}) + 1x${scpActiva}G mm² ${matStr} ${typeName}`;
    }
    return `3x(${nPorFase}x${sfActiva}) + 1x${snActiva}N + 1x${scpActiva}G mm² ${matStr} ${typeName}`;
  }, [alimentacion, nPorFase, sfActiva, snActiva, scpActiva, tipoConductor, aislamiento]);

  // --- Distribution Panel & Automatic Repartidor Recommendation Engine ---
  const panelAnalysis = useMemo(() => {
    const totalCircuits = circuits.length;
    const sumIb = circuits.reduce(
      (acc, c) => acc + (parseFloat((c.ib || '0').replace(',', '.')) || 0),
      0
    );
    const maxIn = circuits.reduce(
      (acc, c) => Math.max(acc, parseFloat((c.in || '0').replace(',', '.')) || 0),
      25
    );
    const totalPowerKw = circuits.reduce(
      (acc, c) => acc + (parseFloat((c.carga || '0').replace(',', '.')) || 0),
      0
    );

    const recommendedIgaCalibre =
      STANDARD_IN_CALIBRES.find((cal) => cal >= Math.max(maxIn, sumIb * 0.75, 25)) || 63;

    // Count circuits per differential group
    const groupCounts: Record<string, { count: number; sumIb: number }> = {};
    panelConfig.differentialGroups.forEach((g) => {
      groupCounts[g.id] = { count: 0, sumIb: 0 };
    });
    groupCounts['DIRECT'] = { count: 0, sumIb: 0 };

    circuits.forEach((c) => {
      const gid = c.grupoId && groupCounts[c.grupoId] ? c.grupoId : panelConfig.differentialGroups[0]?.id || 'ID1';
      if (!groupCounts[gid]) groupCounts[gid] = { count: 0, sumIb: 0 };
      groupCounts[gid].count += 1;
      groupCounts[gid].sumIb += parseFloat((c.ib || '0').replace(',', '.')) || 0;
    });

    const maxCircuitsInAnyGroup = Math.max(
      0,
      ...Object.values(groupCounts).map((g) => g.count)
    );
    const upstreamBranchesFromIga =
      panelConfig.differentialGroups.length +
      (groupCounts['DIRECT']?.count || 0) +
      (panelConfig.spdIncluded ? 1 : 0);
    const hasParallelCables =
      nPorFase >= 2 || circuits.some((c) => (parseInt(c.n || '1', 10) || 1) >= 2);

    // Trigger distributor recommendation if >= 4 circuits, > 2 derivations on a single terminal, or parallel conductors per phase
    const recommendDistributor =
      totalCircuits >= 4 ||
      upstreamBranchesFromIga > 2 ||
      maxCircuitsInAnyGroup > 2 ||
      hasParallelCables;

    const reasons: string[] = [];
    if (totalCircuits >= 4) {
      reasons.push(`El cuadro dispone de ${totalCircuits} circuitos de salida (≥ 4 líneas en paralelo).`);
    }
    if (upstreamBranchesFromIga > 2) {
      reasons.push(
        `Aguas abajo del IGA concurren ${upstreamBranchesFromIga} derivaciones (Diferenciales + SPD > 2 conexiones por borne).`
      );
    }
    if (maxCircuitsInAnyGroup > 2) {
      reasons.push(
        `Existen grupos diferenciales que alimentan hasta ${maxCircuitsInAnyGroup} circuitos en paralelo (> 2 derivaciones por borne).`
      );
    }
    if (hasParallelCables) {
      reasons.push(`Se han configurado múltiples conductores por fase (n ≥ 2) que exigen bornes repartidores.`);
    }

    const effectiveIgaNum = panelConfig.igaAutoSize
      ? recommendedIgaCalibre
      : parseInt(panelConfig.igaCalibre, 10) || recommendedIgaCalibre;

    const distributorCalibre =
      [63, 100, 125, 160, 250, 400].find((cal) => cal >= Math.max(effectiveIgaNum, sumIb * 0.85, 63)) || 125;

    const minHolesPerBar = Math.max(6, totalCircuits + panelConfig.differentialGroups.length + 2);
    const distributorModel =
      distributorCalibre >= 125 || hasParallelCables || panelConfig.differentialGroups.length >= 2
        ? `Bloque Repartidor Modular ${panelConfig.igaPoles} ${distributorCalibre}A (${minHolesPerBar} salidas/barra · UNE-EN 61439-1)`
        : `Peine Embarrado de Distribución ${panelConfig.igaPoles} ${distributorCalibre}A`;

    // Selectivity validation between IGA and every saved circuit in the panel
    const circuitSelectivityMap: Record<string, SelectivityValidationResult> = {};
    let selectivityFailCount = 0;
    let selectivityPartialCount = 0;

    circuits.forEach((c) => {
      const piaInNum = parseFloat((c.in || '16').replace(',', '.')) || 16;
      const iccCircKa = parseFloat((c.iccPrevista || '6.0').replace(',', '.')) || 6.0;
      const res = validateProtectionSelectivity({
        igaIn: effectiveIgaNum,
        igaCurve: panelConfig.igaCurve || 'C',
        igaTimeDelayMs: panelConfig.igaTimeDelayMs || 0,
        piaIn: piaInNum,
        piaCurve: c.curva || 'C',
        piaType: c.tipoProteccion || 'Interruptor automático',
        iccKa: iccCircKa
      });
      circuitSelectivityMap[c.id] = res;
      if (res.status === 'fail') selectivityFailCount++;
      else if (res.status === 'partial') selectivityPartialCount++;
    });

    return {
      totalCircuits,
      sumIb,
      totalPowerKw,
      recommendedIgaCalibre,
      effectiveIgaNum,
      groupCounts,
      recommendDistributor,
      reasons,
      distributorCalibre,
      minHolesPerBar,
      distributorModel,
      circuitSelectivityMap,
      selectivityFailCount,
      selectivityPartialCount
    };
  }, [circuits, panelConfig, nPorFase]);

  const activeSelectivity = useMemo(
    () =>
      validateProtectionSelectivity({
        igaIn: panelAnalysis.effectiveIgaNum,
        igaCurve: panelConfig.igaCurve || 'C',
        igaTimeDelayMs: panelConfig.igaTimeDelayMs || 0,
        piaIn: effectiveIn,
        piaCurve: tipoProteccion === 'Fusible gG' ? 'gG' : curvaProteccion,
        piaType: tipoProteccion,
        iccKa: iccPrevistaKa > 0 ? iccPrevistaKa : 6.0
      }),
    [
      panelAnalysis.effectiveIgaNum,
      panelConfig.igaCurve,
      panelConfig.igaTimeDelayMs,
      effectiveIn,
      curvaProteccion,
      tipoProteccion,
      iccPrevistaKa
    ]
  );

  const handleSave = () => {
    const targetRow = activeRow;
    const matLabel = tipoConductor === 'cobre' ? 'Cu' : 'Al';
    const condPrefix =
      alimentacion === '1F+N' ? '1F+N+CP' : alimentacion === '3F' ? '3F+CP' : '3F+N+CP';

    const newRecord: CircuitRecord = {
      id: circuitoId.trim() || `C${circuits.length + 1} - Línea BT`,
      metodo: metodo,
      conductores: `${condPrefix} ${matLabel}`,
      tension: v.toFixed(1).replace('.', ','),
      aisl: aislamiento,
      seccion: targetRow ? `${targetRow.s} mm²` : '---',
      n: conductoresPorFase,
      carga: pCalculadaKw.toFixed(2).replace('.', ','),
      ud: 'kW',
      fu: parseFloat(fu).toFixed(2).replace('.', ','),
      fs: parseFloat(fs).toFixed(2).replace('.', ','),
      ib: ib.toFixed(2).replace('.', ','),
      in: effectiveIn.toString(),
      xin: irMult.toFixed(2).replace('.', ','),
      ir: effectiveIr.toFixed(1).replace('.', ','),
      iz: targetRow ? targetRow.iz.replace('.', ',') : '---',
      l: length.toFixed(1).replace('.', ','),
      deltaU: targetRow ? targetRow.caida.replace('.', ',') : '---',
      grupoId: grupoId,
      curva: curvaProteccion,
      poderCorte: poderCorte,
      tipoProteccion: tipoProteccion,
      seccionNeutro: snActiva > 0 ? `${snActiva} mm²` : '---',
      seccionCp: `${scpActiva} mm²`,
      cosPhi: cpf.toFixed(2).replace('.', ','),
      tempAmbiente: tempAmbiente,
      iccPrevista: iccPrevistaKa.toFixed(1).replace('.', ',')
    };

    const existingIndex = circuits.findIndex(
      (c) => c.id.toLowerCase() === newRecord.id.toLowerCase()
    );
    if (existingIndex >= 0) {
      const updated = [...circuits];
      updated[existingIndex] = newRecord;
      setCircuits(updated);
      onShowToast(`Línea "${newRecord.id}" actualizada (${newRecord.seccion} · Grupo ${grupoId}).`);
    } else {
      setCircuits([...circuits, newRecord]);
      setCircuitoId(`C${circuits.length + 2} - Nueva Línea`);
      onShowToast(`Línea "${newRecord.id}" guardada en el cuadro (${newRecord.seccion} · Grupo ${grupoId}).`);
    }
  };

  const handleClear = () => {
    setCircuitoId(`C${circuits.length + 1} - Nueva Línea`);
    setPotencia('5.0');
    setIntensidadDirecta('21.74');
    setLongitud('20.0');
    setCosPhi('0.85');
    setFu('1.0');
    setFs('1.0');
    setSelectedManualSection(null);
    onShowToast('Formulario restablecido en modo de cálculo automático');
  };

  const handleOpenRecord = (rec: CircuitRecord) => {
    setCircuitoId(rec.id);
    setMetodo(rec.metodo || 'B1');
    setTension((rec.tension || '230').replace(',', '.'));
    setAislamiento((rec.aisl as any) || 'Z1');
    setPotencia((rec.carga || '5.0').replace(',', '.'));
    setIntensidadDirecta((rec.ib || '16.0').replace(',', '.'));
    setLongitud((rec.l || '20.0').replace(',', '.'));
    setFu((rec.fu || '1.0').replace(',', '.'));
    setFs((rec.fs || '1.0').replace(',', '.'));
    setConductoresPorFase(rec.n || '1');
    setIntensidadNominal(rec.in || '25');
    setModoIn('manual');
    if (rec.grupoId) setGrupoId(rec.grupoId);
    if (rec.curva) setCurvaProteccion(rec.curva as any);
    if (rec.poderCorte) setPoderCorte(rec.poderCorte as any);
    if (rec.tipoProteccion) setTipoProteccion(rec.tipoProteccion as any);
    if (rec.cosPhi) setCosPhi(rec.cosPhi.replace(',', '.'));
    if (rec.conductores.includes('1F')) {
      setAlimentacion('1F+N');
    } else if (rec.conductores.includes('3F+N')) {
      setAlimentacion('3F+N');
    } else {
      setAlimentacion('3F');
    }
    setTipoConductor(rec.conductores.includes('Al') ? 'aluminio' : 'cobre');
    const secClean = (rec.seccion || '').replace(' mm²', '').trim();
    if (secClean && BASE_SECTIONS_B1_CU_90.some((b) => b.s.toString() === secClean)) {
      setSelectedManualSection(secClean);
    } else {
      setSelectedManualSection(null);
    }
    setActiveTab('receptor');
    onShowToast(`Línea "${rec.id}" cargada en el editor.`);
  };

  const handleDeleteRecord = (id: string) => {
    const remaining = circuits.filter((c) => c.id !== id);
    setCircuits(remaining);
    onShowToast(`Línea "${id}" eliminada del cuadro.`);
  };

  const handleAddDifferentialGroup = () => {
    const nextIdx = panelConfig.differentialGroups.length + 1;
    const newId = `ID${nextIdx}`;
    const newGroup: DifferentialGroup = {
      id: newId,
      name: `Grupo Diferencial ${nextIdx}`,
      poles: panelConfig.igaPoles,
      calibre: '40',
      sensitivity: '30mA',
      rccbClass: 'A',
      selective: false
    };
    setPanelConfig((prev) => ({
      ...prev,
      differentialGroups: [...prev.differentialGroups, newGroup]
    }));
    onShowToast(`Diferencial ${newId} añadido al cuadro general.`);
  };

  const handleUpdateDifferentialGroup = (id: string, patch: Partial<DifferentialGroup>) => {
    setPanelConfig((prev) => ({
      ...prev,
      differentialGroups: prev.differentialGroups.map((g) =>
        g.id === id ? { ...g, ...patch } : g
      )
    }));
  };

  const handleRemoveDifferentialGroup = (id: string) => {
    if (panelConfig.differentialGroups.length <= 1) {
      onShowToast('El cuadro debe mantener al menos un grupo diferencial.');
      return;
    }
    setPanelConfig((prev) => ({
      ...prev,
      differentialGroups: prev.differentialGroups.filter((g) => g.id !== id)
    }));
    onShowToast(`Diferencial ${id} eliminado.`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'condiciones':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Método de instalación (ITC-BT-19)
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={metodoInstalacion}
                    onChange={(e) => handleInstallationMethodChange(e.target.value)}
                  >
                    <option value="Bajo tubo empotrado en pared aislante">
                      Bajo tubo empotrado en pared aislante (A1 / A2)
                    </option>
                    <option value="Bajo tubo empotrado en obra (mampostería)">
                      Bajo tubo empotrado en obra / mampostería (B1 / B2)
                    </option>
                    <option value="Bajo tubo en superficie o canaleta">
                      Bajo tubo en superficie o canal protectora (B1 / B2)
                    </option>
                    <option value="Adosado directamente a pared o bandeja no perforada">
                      Adosado a pared o bandeja continua (C)
                    </option>
                    <option value="Sobre bandeja perforada o escalera">
                      Sobre bandeja perforada o escalera al aire (E / F)
                    </option>
                    <option value="Cables enterrados bajo tubo (zanja)">
                      Cables enterrados bajo tubo en zanja (D1)
                    </option>
                    <option value="Cables directamente enterrados">
                      Cables directamente enterrados (D2)
                    </option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Disposición de cables
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={disposicionCables}
                    onChange={(e) => setDisposicionCables(e.target.value)}
                  >
                    <option value="Agrupados en conducto, superficie, empotrados o bandeja">
                      Agrupados en el aire, superficie, empotrados o embutidos
                    </option>
                    <option value="Una capa en contacto sobre bandeja o pared">
                      En una capa en contacto mutuo sobre bandeja o pared
                    </option>
                    <option value="En conductos o tubos protectores">
                      En conductos o tubos protectores cerrados
                    </option>
                    <option value="En tresbolillo (unipolares trifásicos)">
                      En tresbolillo (cables unipolares trifásicos)
                    </option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Método Ref. UNE 60364-5-52
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-primary/10 text-primary border border-primary/30 px-4 py-3 rounded-lg text-sm font-black font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                  >
                    <option value="A1">A1 — Unipolar tubo pared aislante</option>
                    <option value="A2">A2 — Multiconductor tubo pared aislante</option>
                    <option value="B1">B1 — Unipolar tubo empotrado / superf.</option>
                    <option value="B2">B2 — Multiconductor tubo empotrado / superf.</option>
                    <option value="C">C — Adosado a pared / bandeja continua</option>
                    <option value="D1">D1 — Enterrado bajo tubo o conducto</option>
                    <option value="D2">D2 — Directamente enterrado</option>
                    <option value="E">E — Multiconductor bandeja perforada</option>
                    <option value="F">F — Unipolar bandeja perforada / aire</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  {isBuried ? 'Temperatura del terreno' : 'Temperatura ambiente'} (Ft={kTemp.toFixed(2)})
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={tempAmbiente}
                    onChange={(e) => setTempAmbiente(e.target.value)}
                  >
                    {Array.from({ length: 11 }, (_, i) => i * 5 + 10).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                    °C
                  </span>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Profundidad {isBuried ? '(Enterrado D1/D2)' : '(Solo D1/D2)'}
                </label>
                <div className="relative">
                  <select
                    className={`w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono outline-none appearance-none cursor-pointer ${
                      !isBuried ? 'opacity-60' : 'ring-1 ring-primary/30'
                    }`}
                    value={isBuried ? profundidad : '---'}
                    onChange={(e) => setProfundidad(e.target.value)}
                  >
                    <option value="---">---</option>
                    <option value="0.5">0.5</option>
                    <option value="0.7">0.7</option>
                    <option value="0.8">0.8</option>
                    <option value="1.0">1.0</option>
                    <option value="1.2">1.2</option>
                    <option value="1.5">1.5</option>
                  </select>
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                    m
                  </span>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1 group relative">
                  Resistividad térmica
                  <Info size={12} className="text-primary cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 invisible group-hover:visible bg-[#0f172a] text-white p-4 rounded-lg shadow-xl z-[100] w-[270px] text-[10px] leading-relaxed font-mono border border-white/10">
                    <div className="font-bold border-b border-white/10 pb-1.5 mb-2 uppercase tracking-widest text-sky-400">
                      Naturaleza del terreno (K·m/W):
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Terreno muy húmedo:</span>
                        <span className="font-bold text-emerald-400">0.40 - 0.70</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terreno normal / seco:</span>
                        <span className="font-bold text-amber-400">1.00 - 1.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Arenisca / Caliza seca:</span>
                        <span className="font-bold text-rose-400">2.00 - 2.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Granito / Roca seca:</span>
                        <span className="font-bold text-purple-400">3.00</span>
                      </div>
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <select
                    className={`w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono outline-none appearance-none cursor-pointer ${
                      !isBuried ? 'opacity-60' : 'ring-1 ring-primary/30'
                    }`}
                    value={isBuried ? resistividadTermica : '---'}
                    onChange={(e) => setResistividadTermica(e.target.value)}
                  >
                    <option value="---">---</option>
                    <option value="0.4">0.4</option>
                    <option value="0.7">0.7</option>
                    <option value="1.0">1.0</option>
                    <option value="1.5">1.5</option>
                    <option value="2.0">2.0</option>
                    <option value="2.5">2.5</option>
                    <option value="3.0">3.0</option>
                  </select>
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant pointer-events-none">
                    K·m/W
                  </span>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 mt-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-outline-variant/20 pb-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  Cortocircuito y Opciones de Conductor (UNE 60364-4-43)
                </h4>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                  Constante adiabática K = {kAdiabatic} · Smín,cc = {sMinCortocircuito.toFixed(2)} mm²
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <InputField
                  label="Cortocircuito previsto (Icc)"
                  value={icc}
                  onChange={setIcc}
                  unit="kA"
                />
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Duración despeje (t)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono outline-none appearance-none cursor-pointer"
                      value={duracionIcc}
                      onChange={(e) => setDuracionIcc(e.target.value)}
                    >
                      <option value="0.05">0.05</option>
                      <option value="0.1">0.1</option>
                      <option value="0.2">0.2</option>
                      <option value="0.5">0.5</option>
                      <option value="1.0">1.0</option>
                      <option value="3.0">3.0</option>
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                      s
                    </span>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-sm font-medium pb-1 border-l border-outline-variant/20 pl-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Magnitud de entrada
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="tipoCalculo"
                        checked={tipoCalculo === 'potencia'}
                        onChange={() => setTipoCalculo('potencia')}
                        className="w-4 h-4 accent-primary"
                      />
                      Potencia (kW)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="tipoCalculo"
                        checked={tipoCalculo === 'intensidad'}
                        onChange={() => setTipoCalculo('intensidad')}
                        className="w-4 h-4 accent-primary"
                      />
                      Intensidad (A)
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-sm font-medium pb-1">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="tipoConductor"
                        checked={tipoConductor === 'cobre'}
                        onChange={() => setTipoConductor('cobre')}
                        className="w-4 h-4 accent-primary"
                      />
                      Cobre (Cu)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="tipoConductor"
                        checked={tipoConductor === 'aluminio'}
                        onChange={() => setTipoConductor('aluminio')}
                        className="w-4 h-4 accent-primary"
                      />
                      Aluminio (Al)
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="calculoConductor"
                        checked={calculoConductor === 'unipolar'}
                        onChange={() => {
                          setCalculoConductor('unipolar');
                          handleInstallationMethodChange(metodoInstalacion, 'unipolar');
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      Unipolar
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-semibold">
                      <input
                        type="radio"
                        name="calculoConductor"
                        checked={calculoConductor === 'multiconductor'}
                        onChange={() => {
                          setCalculoConductor('multiconductor');
                          handleInstallationMethodChange(metodoInstalacion, 'multiconductor');
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      Multiconductor
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'receptor':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top row: Supply, Voltage, Insulation, Differential Group Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Alimentación
                </label>
                <div className="relative">
                  <select
                    value={alimentacion}
                    onChange={(e) => {
                      const val = e.target.value as '3F+N' | '3F' | '1F+N';
                      setAlimentacion(val);
                      if (val === '1F+N') {
                        setTension('230.0');
                      } else {
                        setTension('400.0');
                      }
                    }}
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    <option value="3F+N">3F+N (Trifásica con Neutro)</option>
                    <option value="3F">3F (Trifásica sin Neutro)</option>
                    <option value="1F+N">1F+N (Monofásica)</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Tensión nominal*
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tension}
                    onChange={(e) => setTension(e.target.value)}
                    className="w-full bg-surface-container px-4 py-2.5 rounded-lg border border-transparent font-mono font-bold text-sm text-on-surface focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                    V
                  </span>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-1 block">
                  {alimentacion === '1F+N' ? 'MONOFÁSICA 230V' : 'TRIFÁSICA 400V'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Aislamiento cable ({is90C ? '90 °C' : '70 °C'})
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    value={aislamiento}
                    onChange={(e) => setAislamiento(e.target.value as any)}
                  >
                    <option value="Z1">Z1 — Poliolefina Libre Halógenos (AS) 90°C</option>
                    <option value="XLPE">XLPE — Polietileno Reticulado (RV-K) 90°C</option>
                    <option value="PVC">PVC — Policloruro de Vinilo (H07V-K) 70°C</option>
                    <option value="EPR">EPR — Etileno Propileno 90°C</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                  <span>Grupo Diferencial (Cuadro)</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cuadro')}
                    className="text-[10px] underline hover:opacity-80 cursor-pointer"
                  >
                    Configurar ID
                  </button>
                </label>
                <div className="relative">
                  <select
                    value={grupoId}
                    onChange={(e) => setGrupoId(e.target.value)}
                    className="w-full bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    {panelConfig.differentialGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.id} — {grp.name} ({grp.poles} {grp.calibre}A {grp.sensitivity})
                      </option>
                    ))}
                    <option value="DIRECT">Directo a Repartidor / Embarrado General</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Second row: Load Power/Current, CosPhi, Harmonics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InputField label="N° Receptores*" value={numero} onChange={setNumero} />
              {tipoCalculo === 'potencia' ? (
                <div className="space-y-1">
                  <InputField
                    label="Potencia unitaria*"
                    value={potencia}
                    onChange={setPotencia}
                    unit="kW"
                  />
                  <span className="text-[11px] font-mono text-on-surface-variant px-1 block">
                    Ib calculada: <strong className="text-primary">{ib.toFixed(2)} A</strong>
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <InputField
                    label="Intensidad Ib unitaria*"
                    value={intensidadDirecta}
                    onChange={setIntensidadDirecta}
                    unit="A"
                  />
                  <span className="text-[11px] font-mono text-on-surface-variant px-1 block">
                    P equivalente: <strong className="text-primary">{pCalculadaKw.toFixed(2)} kW</strong>
                  </span>
                </div>
              )}
              <InputField label="Cos φ*" value={cosPhi} onChange={setCosPhi} />
              <div className="space-y-1.5">
                <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                  Tercer armónico (UNE B.52)
                </label>
                <div className="relative">
                  <select
                    value={tercerArmonico}
                    onChange={(e) => setTercerArmonico(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    <option value="0.0">0 % (Sin armónicos relevantes)</option>
                    <option value="20.0">15 % - 33 % (Fc = 0.86)</option>
                    <option value="40.0">33 % - 45 % (Dimensionado por Neutro)</option>
                    <option value="50.0">&gt; 45 % (Cargas no lineales severas)</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Third row: Fu, Fs, Length, Max Voltage Drop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InputField label="Factor utilización (Fu)*" value={fu} onChange={setFu} />
              <InputField
                label="Factor simultaneidad (Fs)*"
                value={fs}
                onChange={setFs}
              />
              <InputField label="Longitud línea (L)*" value={longitud} onChange={setLongitud} unit="m" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Caída tensión máx. (ΔUmáx)*
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCaidaMax('3.0')}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                        caidaMax === '3.0'
                          ? 'bg-primary text-white font-bold'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                      title="REBT ITC-BT-19 Alumbrado (3%)"
                    >
                      3% Alum
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaidaMax('5.0')}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                        caidaMax === '5.0'
                          ? 'bg-primary text-white font-bold'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                      title="REBT ITC-BT-19 Otros usos / Fuerza (5%)"
                    >
                      5% Fuerza
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={caidaMax}
                    onChange={(e) => setCaidaMax(e.target.value)}
                    className="w-full bg-surface-container px-4 py-2.5 rounded-lg border border-transparent font-mono font-bold text-sm text-on-surface focus:border-primary focus:bg-surface outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Protection & Grouping Box */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 mt-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Protección Magnetotérmica / Fusible y Agrupamiento de Canalización
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModoIn('auto')}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                      modoIn === 'auto'
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Calibre In Automático ({autoInNumber} A)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoIn('manual')}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                      modoIn === 'manual'
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Calibre In Manual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Dispositivo de Protección
                  </label>
                  <div className="relative">
                    <select
                      value={tipoProteccion}
                      onChange={(e) => setTipoProteccion(e.target.value as any)}
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value="Interruptor automático">Interruptor automático (PIA)</option>
                      <option value="Guardamotor">Guardamotor magnetotérmico</option>
                      <option value="Fusible gG">Fusible calibrado gG</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Intensidad nominal (In)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                      value={effectiveIn.toString()}
                      onChange={(e) => {
                        setModoIn('manual');
                        setIntensidadNominal(e.target.value);
                      }}
                    >
                      {STANDARD_IN_CALIBRES.map((cal) => (
                        <option key={cal} value={cal}>
                          {cal}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                      A
                    </span>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Curva y Poder de Corte
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={curvaProteccion}
                      onChange={(e) => setCurvaProteccion(e.target.value as any)}
                      className="bg-surface-container px-3 py-3 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="B">Curva B</option>
                      <option value="C">Curva C</option>
                      <option value="D">Curva D</option>
                      <option value="MA">Curva MA</option>
                    </select>
                    <select
                      value={poderCorte}
                      onChange={(e) => setPoderCorte(e.target.value as any)}
                      className="bg-surface-container px-3 py-3 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="6kA">6 kA</option>
                      <option value="10kA">10 kA</option>
                      <option value="15kA">15 kA</option>
                      <option value="25kA">25 kA</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Regulación térmica Ir (x In)
                  </label>
                  <div className="relative">
                    <select
                      value={irFactor}
                      onChange={(e) => setIrFactor(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value="1.00">1.00 (Ir = {effectiveIn.toFixed(1)} A)</option>
                      <option value="0.90">0.90 (Ir = {(effectiveIn * 0.9).toFixed(1)} A)</option>
                      <option value="0.80">0.80 (Ir = {(effectiveIn * 0.8).toFixed(1)} A)</option>
                      <option value="0.70">0.70 (Ir = {(effectiveIn * 0.7).toFixed(1)} A)</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Conductores por fase (n)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                      value={conductoresPorFase}
                      onChange={(e) => setConductoresPorFase(e.target.value)}
                    >
                      <option value="1">1 conductor / fase</option>
                      <option value="2">2 conductores en paralelo / fase</option>
                      <option value="3">3 conductores en paralelo / fase</option>
                      <option value="4">4 conductores en paralelo / fase</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Sección mínima admisible
                  </label>
                  <div className="relative">
                    <select
                      value={seccionMinima}
                      onChange={(e) => setSeccionMinima(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value="1.5">1.5</option>
                      <option value="2.5">2.5</option>
                      <option value="4">4.0</option>
                      <option value="6">6.0</option>
                      <option value="10">10.0</option>
                      <option value="16">16.0</option>
                      <option value="25">25.0</option>
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">
                      mm²
                    </span>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Separación entre cables
                  </label>
                  <div className="relative">
                    <select
                      value={separacion}
                      onChange={(e) => setSeparacion(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold outline-none appearance-none cursor-pointer"
                    >
                      <option value="En contacto (0 m)">En contacto (0 m)</option>
                      <option value="1 diámetro (De)">Separados 1 diámetro (De)</option>
                      <option value="0.125 m">0.125 m</option>
                      <option value="0.25 m">0.25 m</option>
                      <option value="0.50 m">0.50 m</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">
                    Circuitos adicionales agrupados
                  </label>
                  <div className="relative">
                    <select
                      value={circuitosAdicionales}
                      onChange={(e) => handleCircuitosAdicionalesChange(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i).map((numAdd) => (
                        <option key={numAdd} value={numAdd}>
                          {numAdd} ({numAdd + 1} circuito{numAdd + 1 > 1 ? 's' : ''} total)
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>

                <InputField
                  label="Fr agrupamiento (UNE B.52.17)*"
                  value={frAgrupamiento}
                  onChange={setFrAgrupamiento}
                />
                <InputField
                  label="Fr adicional (solar/otros)*"
                  value={frAdicional}
                  onChange={setFrAdicional}
                />
              </div>

              {/* Validación en vivo de Selectividad IGA <-> PIA */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  activeSelectivity.status === 'total'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                    : activeSelectivity.status === 'partial'
                    ? 'bg-amber-500/10 border-amber-500/35 text-amber-950'
                    : 'bg-error/10 border-error/35 text-error'
                }`}
              >
                <div className="flex items-start gap-3">
                  {activeSelectivity.status === 'total' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle
                      size={18}
                      className={`shrink-0 mt-0.5 ${
                        activeSelectivity.status === 'partial' ? 'text-amber-600' : 'text-error'
                      }`}
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wider text-[10px] ${
                          activeSelectivity.status === 'total'
                            ? 'bg-emerald-600 text-white'
                            : activeSelectivity.status === 'partial'
                            ? 'bg-amber-600 text-white'
                            : 'bg-error text-white'
                        }`}
                      >
                        {activeSelectivity.badgeText}
                      </span>
                      <span className="font-mono font-bold text-on-surface">
                        IGA {panelAnalysis.effectiveIgaNum}A Curva {panelConfig.igaCurve}
                        {(panelConfig.igaTimeDelayMs || 0) > 0
                          ? ` (Δt=${panelConfig.igaTimeDelayMs}ms)`
                          : ''}{' '}
                        ↔ PIA {effectiveIn}A Curva {curvaProteccion}
                      </span>
                    </div>
                    <p className="text-on-surface-variant leading-snug">
                      {activeSelectivity.shortReason}
                    </p>
                    {!activeSelectivity.isFullyCompliant && (
                      <p className="font-semibold text-on-surface">
                        Recomendación: {activeSelectivity.recommendation}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('cuadro')}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/40 text-on-surface font-bold hover:bg-surface-container cursor-pointer whitespace-nowrap shadow-sm"
                >
                  Ajustar Cabecera IGA
                </button>
              </div>

              {nPorFase >= 2 && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>
                      <strong>Conductores en paralelo ({nPorFase} por fase):</strong> Se recomienda instalar{' '}
                      <strong>{panelAnalysis.distributorModel}</strong> para garantizar el reparto equitativo de corriente en bornes.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cuadro')}
                    className="px-3 py-1.5 rounded bg-amber-600 text-white font-bold whitespace-nowrap cursor-pointer"
                  >
                    Ver Repartidor
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'seccion': {
        const selectedDiff = panelConfig.differentialGroups.find((g) => g.id === grupoId);
        const i2Breaker = +(1.45 * effectiveIr).toFixed(2);
        const maxIz145 = +(1.45 * (activeRow?.izNum || 0)).toFixed(2);

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 font-medium font-mono text-on-surface-variant leading-relaxed shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-outline-variant/20">
              <div>
                <span className="font-sans font-extrabold text-on-surface uppercase tracking-wider text-xs block">
                  Memoria de Cálculo Normativa — UNE-HD 60364-5-52 / REBT
                </span>
                <span className="font-sans text-xs text-on-surface-variant">
                  Circuito: <strong className="text-primary">{circuitoId}</strong> · Método{' '}
                  <strong>{metodo}</strong> ({metodoInstalacion})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedManualSection ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-700 font-sans font-bold text-xs">
                      Sección Forzada Manualmente ({selectedManualSection} mm²)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedManualSection(null)}
                      className="px-3 py-1 rounded bg-primary text-white font-sans font-bold text-xs cursor-pointer hover:opacity-90"
                    >
                      Restablecer Automático ({optimalAutoRow?.s || '---'} mm²)
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-700 font-sans font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Selección Óptima Automática UNE 60364-5-52
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-outline-variant/20">
              <div className="space-y-2">
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Sección de Fase (Sf):</strong>
                  <span className="text-base font-black text-primary">
                    {nPorFase > 1 ? `${nPorFase} x ` : ''}
                    {activeRow?.s || '---'} mm²
                  </span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Sección de Neutro (Sn):</strong>
                  <span className="text-on-surface font-bold">
                    {snActiva > 0 ? `${nPorFase > 1 ? `${nPorFase} x ` : ''}${snActiva} mm²` : 'Sin neutro (3F)'}
                  </span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Conductor Protec. (PE):</strong>
                  <span className="text-on-surface font-bold">{scpActiva} mm² (ITC-BT-18)</span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Composición Cable:</strong>
                  <span className="text-on-surface font-bold text-xs">{cableDesignation}</span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">{tipoProteccion}:</strong>
                  <span className="text-on-surface font-bold">
                    In = {effectiveIn} A · Curva {curvaProteccion} · PdC {poderCorte}
                  </span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Regulación térmica:</strong>
                  <span className="text-on-surface font-bold">
                    Ir = {effectiveIr.toFixed(1)} A ({irFactor} x In)
                  </span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Grupo Diferencial:</strong>
                  <span className="text-primary font-bold">
                    {selectedDiff
                      ? `${selectedDiff.id} (${selectedDiff.poles} ${selectedDiff.calibre}A · ${selectedDiff.sensitivity} Clase ${selectedDiff.rccbClass})`
                      : 'Directo a Embarrado / Repartidor General'}
                  </span>
                </p>
                <p className="flex gap-2 items-center">
                  <ChevronDown size={14} className="rotate-[-90deg] text-primary" />
                  <strong className="text-on-surface w-48">Potencia de diseño:</strong>
                  <span className="text-on-surface font-bold">
                    {pCalculadaKw.toFixed(2)} kW (cos φ = {cpf})
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-6 pb-6 border-b border-outline-variant/20">
              <p className="text-on-surface flex gap-2">
                · <span className="w-72 text-on-surface-variant">Intensidad de empleo (Ib):</span>
                <strong>{ib.toFixed(2)} A</strong>
              </p>
              <p className="text-on-surface flex gap-2">
                · <span className="w-72 text-on-surface-variant">Intensidad admisible corregida (Iz'):</span>
                <strong>{activeRow?.iz || '---'} A</strong>
              </p>
              <p className="text-on-surface flex gap-2">
                · <span className="w-72 text-on-surface-variant">Cortocircuito máx. admisible cable:</span>
                <strong>
                  {activeRow?.icc || '---'} kA (t = {duracionIcc} s · Icc prevista = {iccPrevistaKa} kA)
                </strong>
              </p>
              <p className="text-on-surface flex gap-2">
                · <span className="w-72 text-on-surface-variant">Caída de tensión en línea (ΔU):</span>
                <strong className={activeRow?.okVoltageDrop ? 'text-emerald-600' : 'text-error'}>
                  {activeRow?.caidaVolts || '0.00'} V ({activeRow?.caida || '---'} % · Límite ≤ {caidaMax} %)
                </strong>
              </p>
            </div>

            <div className="space-y-1.5 mb-6 pb-6 border-b border-outline-variant/20">
              <p className="flex gap-2">
                · <span className="w-72">Intensidad base tabla UNE (Iz, {metodo}):</span>
                <span className="text-on-surface">{activeRow?.izTabla} A</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Fc temperatura ({tempAmbiente} °C):</span>
                <span className="text-on-surface">{kTemp.toFixed(3)} (Tabla B.52.14)</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Fc agrupamiento ({parseInt(circuitosAdicionales) + 1} circ.):</span>
                <span className="text-on-surface">{(kAgrup * kAdic).toFixed(3)} (Tabla B.52.17)</span>
              </p>
              {isBuried && (
                <p className="flex gap-2">
                  · <span className="w-72">Fc terreno y profundidad ({resistividadTermica} K·m/W):</span>
                  <span className="text-on-surface">{kTerreno.toFixed(3)}</span>
                </p>
              )}
              {kArmonico < 1 && (
                <p className="flex gap-2">
                  · <span className="w-72">Fc 3er armónico ({tercerArmonico}%):</span>
                  <span className="text-on-surface">{kArmonico.toFixed(3)}</span>
                </p>
              )}
              <p className="flex gap-2">
                · <span className="w-72">Factor de corrección total (Fc total):</span>
                <span className="text-on-surface font-bold">{kTotal.toFixed(4)}</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72 text-on-surface">Cálculo Iz' corregida:</span>
                <span>
                  {activeRow?.izTabla} A × {kTotal.toFixed(4)}
                  {nPorFase > 1 ? ` × ${nPorFase} cond.` : ''} ={' '}
                  <strong className="text-primary">{activeRow?.iz} A</strong>
                </span>
              </p>
            </div>

            <div className="space-y-1.5 mb-6 pb-6 border-b border-outline-variant/20">
              <p className="flex gap-2">
                · <span className="w-72">Temperatura real estimada en conductor:</span>
                <span className="text-on-surface">{activeRow?.tRealCond} °C (Máx. {tMaxCond} °C)</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Conductividad a temperatura de servicio:</span>
                <span className="text-on-surface">{activeRow?.gammaReal} m/(Ω·mm²)</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Impedancia total de la línea (Z = R + jX):</span>
                <span className="text-on-surface">
                  {activeRow?.rLineOhm} + j{activeRow?.xLineOhm} Ω
                </span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Energía pasante admisible (K²·S²):</span>
                <span className="text-on-surface">{activeRow?.k2S2} MA²s</span>
              </p>
              <p className="flex gap-2">
                · <span className="w-72">Pérdida de potencia activa (Efecto Joule):</span>
                <span className="text-on-surface">{activeRow?.powerLossWatts} W</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-on-surface tracking-widest text-xs uppercase font-sans">
                Comprobación Reglamentaria IEC 60364-4-43 / REBT:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-sans text-xs">
                <div
                  className={`p-3 rounded-lg border ${
                    activeRow?.okThermal
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : 'bg-error/10 border-error/30 text-error'
                  }`}
                >
                  <div className="font-bold uppercase mb-1">1. Sobrecarga (Ib ≤ In ≤ Iz')</div>
                  <div className="font-mono">
                    {ib.toFixed(2)} A ≤ {effectiveIr.toFixed(1)} A ≤ {activeRow?.iz} A
                  </div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    I2 ({i2Breaker} A) ≤ 1.45·Iz' ({maxIz145} A)
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    activeRow?.okVoltageDrop
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : 'bg-error/10 border-error/30 text-error'
                  }`}
                >
                  <div className="font-bold uppercase mb-1">2. Caída de Tensión (ΔU ≤ {caidaMax}%)</div>
                  <div className="font-mono">
                    ΔU = {activeRow?.caida}% ({activeRow?.caidaVolts} V) ≤ {caidaMax}%
                  </div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    Longitud L = {longitud} m
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    activeRow?.okShortCircuit
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : 'bg-error/10 border-error/30 text-error'
                  }`}
                >
                  <div className="font-bold uppercase mb-1">3. Cortocircuito (Icc ≤ Icc,adm)</div>
                  <div className="font-mono">
                    {iccPrevistaKa.toFixed(2)} kA ≤ {activeRow?.icc} kA (t={duracionIcc}s)
                  </div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    Smín,cc = {sMinCortocircuito.toFixed(2)} mm²
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    activeSelectivity.status === 'total'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : activeSelectivity.status === 'partial'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                      : 'bg-error/10 border-error/30 text-error'
                  }`}
                >
                  <div className="font-bold uppercase mb-1">4. Selectividad IGA ↔ PIA</div>
                  <div className="font-bold">{activeSelectivity.badgeText}</div>
                  <div className="font-mono text-[11px] opacity-90 mt-0.5">
                    Amperimétrica: {activeSelectivity.amperimetricOk ? 'OK' : 'NO'} · Cronométrica:{' '}
                    {activeSelectivity.chronometricOk ? 'OK' : 'NO'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'tabla':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/30">
              <div className="text-xs text-on-surface-variant">
                <strong className="text-on-surface">Selección interactiva UNE-HD 60364-5-52:</strong>{' '}
                Haz clic en cualquier fila de la tabla para forzar esa sección manualmente, o mantén el cálculo automático.
              </div>
              <div className="flex items-center gap-2">
                {selectedManualSection && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedManualSection(null);
                      onShowToast('Modo de sección automático UNE 60364-5-52 activado');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer hover:opacity-90"
                  >
                    Volver a Selección Automática ({optimalAutoRow?.s || '---'} mm²)
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/30 shadow-sm bg-surface">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/20 text-on-surface-variant font-bold text-[0.7rem] uppercase tracking-wider">
                    <th className="px-4 py-3.5">Sf (mm²)</th>
                    <th className="px-4 py-3.5">Iz tabla (A)</th>
                    <th className="px-4 py-3.5">Iz' corr. (A)</th>
                    <th className="px-4 py-3.5">Carga Ib/Iz' (%)</th>
                    <th className="px-4 py-3.5">Caída ΔU (%)</th>
                    <th className="px-4 py-3.5">Ir Prot. (A)</th>
                    <th className="px-4 py-3.5">Icc máx (kA) [{duracionIcc}s]</th>
                    <th className="px-4 py-3.5">Estado REBT</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/10">
                  {tableRows.map((row) => {
                    const isOptimalAuto = optimalAutoRow?.s === row.s;
                    const isManualSelected = selectedManualSection === row.s;
                    const isActive = activeRow?.s === row.s;

                    return (
                      <tr
                        key={row.s}
                        onClick={() => {
                          setSelectedManualSection(row.s);
                          onShowToast(`Sección seleccionada manualmente: ${row.s} mm²`);
                        }}
                        className={`transition-colors font-mono cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 ring-1 ring-inset ring-primary/40 font-bold'
                            : 'hover:bg-surface-container/50'
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-primary flex items-center justify-center gap-1.5">
                          <span>{row.s}</span>
                          {isOptimalAuto && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-sans text-[9px] font-extrabold uppercase">
                              Auto
                            </span>
                          )}
                          {isManualSelected && !isOptimalAuto && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-sans text-[9px] font-extrabold uppercase">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{row.izTabla}</td>
                        <td
                          className={`px-4 py-3 font-semibold ${
                            row.okThermal ? 'text-primary' : 'text-error'
                          }`}
                        >
                          {row.iz}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            row.okThermal ? 'text-on-surface' : 'text-error'
                          }`}
                        >
                          {row.ibRatio}%
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold ${
                            row.okVoltageDrop ? 'text-emerald-600' : 'text-error'
                          }`}
                        >
                          {row.caida}% ({row.caidaVolts}V)
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            row.okThermal ? 'text-on-surface' : 'text-error'
                          }`}
                        >
                          {row.ir}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            row.okShortCircuit ? 'text-on-surface' : 'text-error'
                          }`}
                        >
                          {row.icc}
                        </td>
                        <td className="px-4 py-3 font-sans text-xs">
                          {row.pass ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                              CUMPLE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-error/15 text-error font-bold">
                              NO CUMPLE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'cuadro':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Banner with Quick Action to Transfer to CAD */}
            <div className="p-5 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-headline font-extrabold text-base text-on-surface flex items-center gap-2">
                  <Shield size={18} className="text-primary" />
                  Configuración del Cuadro General de Mando y Protección (CGMP)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Potencia total instalada en {panelAnalysis.totalCircuits} circuitos:{' '}
                  <strong className="font-mono text-on-surface">
                    {panelAnalysis.totalPowerKw.toFixed(2)} kW
                  </strong>{' '}
                  · Corriente total ΣIb:{' '}
                  <strong className="font-mono text-primary">
                    {panelAnalysis.sumIb.toFixed(2)} A
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTransferToCAD(panelConfig)}
                className="bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <GitBranch size={16} />
                Pasar Cuadro al Esquema Unifilar CAD
              </button>
            </div>

            {/* 1. Cabecera (IGA) & 2. Sobretensiones (SPD) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* IGA Card */}
              <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      1. Protección de Cabecera (IGA — ITC-BT-17)
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Interruptor General Automático de corte omnipolar
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={panelConfig.igaAutoSize}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaAutoSize: e.target.checked,
                          igaCalibre: e.target.checked
                            ? panelAnalysis.recommendedIgaCalibre.toString()
                            : prev.igaCalibre
                        }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    Autodimensionar ({panelAnalysis.recommendedIgaCalibre}A)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Polos Cabecera
                    </label>
                    <select
                      value={panelConfig.igaPoles}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaPoles: e.target.value as '2P' | '4P'
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="2P">2P (Monofásico 230V)</option>
                      <option value="4P">4P (Trifásico 400V)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Calibre Nominal In (A)
                    </label>
                    <select
                      value={panelAnalysis.effectiveIgaNum.toString()}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaAutoSize: false,
                          igaCalibre: e.target.value
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      {[25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 400].map((c) => (
                        <option key={c} value={c}>
                          {c} A
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Curva Disparo IGA
                    </label>
                    <select
                      value={panelConfig.igaCurve}
                      onChange={(e) => {
                        const curve = e.target.value as 'B' | 'C' | 'D' | 'S';
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaCurve: curve,
                          igaTimeDelayMs:
                            curve === 'S' && !(prev.igaTimeDelayMs && prev.igaTimeDelayMs > 0)
                              ? 60
                              : curve !== 'S'
                              ? prev.igaTimeDelayMs || 0
                              : prev.igaTimeDelayMs
                        }));
                      }}
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="B">Curva B (3–5 × In)</option>
                      <option value="C">Curva C (5–10 × In)</option>
                      <option value="D">Curva D (10–20 × In)</option>
                      <option value="S">Curva S (Selectivo MCCB)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Poder de Corte (Icu)
                    </label>
                    <select
                      value={panelConfig.igaBreakingCapacity}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaBreakingCapacity: e.target.value as any
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="6kA">6 kA</option>
                      <option value="10kA">10 kA</option>
                      <option value="15kA">15 kA</option>
                      <option value="25kA">25 kA</option>
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Retardo Cronométrico Corto Plazo (Δt Selectividad)
                    </label>
                    <select
                      value={(panelConfig.igaTimeDelayMs || 0).toString()}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          igaTimeDelayMs: parseInt(e.target.value, 10) as 0 | 60 | 150
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="0">0 ms — Instantáneo estándar (Modular UNE-EN 60898)</option>
                      <option value="60">60 ms — Temporizado Selectivo (IEC 60947-2)</option>
                      <option value="150">150 ms — Selectividad Cronométrica Total</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SPD Card */}
              <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      2. Protección Contra Sobretensiones (SPD — ITC-BT-23)
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Descargador de sobretensiones transitorias y permanentes
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={panelConfig.spdIncluded}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          spdIncluded: e.target.checked
                        }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    Incluir SPD
                  </label>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!panelConfig.spdIncluded ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="space-y-1 md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Tipo de Protector SPD
                    </label>
                    <select
                      value={panelConfig.spdType}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          spdType: e.target.value as any
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold outline-none cursor-pointer"
                    >
                      <option value="Combi (Permanentes + Transitorias)">
                        Combi (Sobretensiones Permanentes + Transitorias Tipo 2)
                      </option>
                      <option value="Tipo 2 (Transitorias)">
                        Tipo 2 (Descargador Transitorias 8/20 μs)
                      </option>
                      <option value="Tipo 1+2 (Combinado)">
                        Tipo 1+2 (Con pararrayos / acometida aérea)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Corriente Imax (8/20)
                    </label>
                    <select
                      value={panelConfig.spdDischargeCurrent}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          spdDischargeCurrent: e.target.value as any
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="15kA">15 kA</option>
                      <option value="40kA">40 kA</option>
                      <option value="65kA">65 kA</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Nivel de Protección en Tensión (Up)
                    </label>
                    <select
                      value={panelConfig.spdVoltageLevel}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          spdVoltageLevel: e.target.value as any
                        }))
                      }
                      className="w-full bg-surface-container px-3 py-2.5 rounded-lg text-sm font-bold font-mono outline-none cursor-pointer"
                    >
                      <option value="1.2 kV">Up ≤ 1.2 kV (Equipos sensibles)</option>
                      <option value="1.5 kV">Up ≤ 1.5 kV (Estándar ITC-BT-23)</option>
                      <option value="2.0 kV">Up ≤ 2.0 kV (Industrial)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recomendación Automática de Repartidor / Embarrado */}
            <div
              className={`p-6 rounded-xl border shadow-sm space-y-4 ${
                panelAnalysis.recommendDistributor
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-surface-container-lowest border-outline-variant/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <Layers size={20} className="text-primary" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                      3. Recomendación de Bloque Repartidor / Embarrado (UNE-EN 61439-1)
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Evaluación automática por número de líneas en paralelo y conexiones por borne
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {panelAnalysis.recommendDistributor ? (
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wider">
                      Repartidor Recomendado
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase">
                      Opcional (&lt; 4 circuitos)
                    </span>
                  )}
                  <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={panelConfig.includeDistributorInCAD}
                      onChange={(e) =>
                        setPanelConfig((prev) => ({
                          ...prev,
                          includeDistributorInCAD: e.target.checked
                        }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    Incluir en Esquema Unifilar
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="lg:col-span-2 space-y-2 text-xs">
                  <div className="font-bold text-on-surface">
                    Elemento prescrito:{' '}
                    <span className="text-primary font-mono">{panelAnalysis.distributorModel}</span>
                  </div>
                  <ul className="space-y-1 text-on-surface-variant list-disc list-inside">
                    {panelAnalysis.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                    {panelAnalysis.reasons.length === 0 && (
                      <li>
                        Número reducido de derivaciones; puede emplearse peine embarrado estándar.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="bg-surface p-4 rounded-lg border border-outline-variant/30 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Calibre barras (In):</span>
                    <strong className="text-primary">{panelAnalysis.distributorCalibre} A</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Polos:</span>
                    <strong className="text-on-surface">{panelConfig.igaPoles} (Fases + N)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Salidas mín./barra:</span>
                    <strong className="text-on-surface">{panelAnalysis.minHolesPerBar} bornes</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Gestión de Grupos Diferenciales (ID1, ID2...) */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    4. Grupos Diferenciales del Cuadro (ITC-BT-24 / ITC-BT-25)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Configura los interruptores diferenciales y revisa los circuitos asignados a cada grupo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDifferentialGroup}
                  className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Añadir Diferencial (ID)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {panelConfig.differentialGroups.map((grp) => {
                  const stats = panelAnalysis.groupCounts[grp.id] || { count: 0, sumIb: 0 };
                  const assignedCircuits = circuits.filter(
                    (c) =>
                      c.grupoId === grp.id ||
                      (!c.grupoId && grp.id === panelConfig.differentialGroups[0]?.id)
                  );
                  const isOver5Circuits = stats.count > 5;

                  return (
                    <div
                      key={grp.id}
                      className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2.5 py-1 rounded bg-primary text-white font-mono font-black text-xs">
                            {grp.id}
                          </span>
                          <input
                            type="text"
                            value={grp.name}
                            onChange={(e) =>
                              handleUpdateDifferentialGroup(grp.id, { name: e.target.value })
                            }
                            className="bg-surface-container px-2.5 py-1 rounded text-xs font-bold text-on-surface flex-1 outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDifferentialGroup(grp.id)}
                          className="text-error/70 hover:text-error p-1 cursor-pointer"
                          title="Eliminar grupo diferencial"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                        <div>
                          <label className="block text-[10px] font-sans font-bold text-on-surface-variant uppercase">
                            Polos
                          </label>
                          <select
                            value={grp.poles}
                            onChange={(e) =>
                              handleUpdateDifferentialGroup(grp.id, {
                                poles: e.target.value as '2P' | '4P'
                              })
                            }
                            className="w-full bg-surface-container px-2 py-1.5 rounded font-bold outline-none"
                          >
                            <option value="2P">2P</option>
                            <option value="4P">4P</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-sans font-bold text-on-surface-variant uppercase">
                            Calibre
                          </label>
                          <select
                            value={grp.calibre}
                            onChange={(e) =>
                              handleUpdateDifferentialGroup(grp.id, { calibre: e.target.value })
                            }
                            className="w-full bg-surface-container px-2 py-1.5 rounded font-bold outline-none"
                          >
                            <option value="25">25 A</option>
                            <option value="40">40 A</option>
                            <option value="63">63 A</option>
                            <option value="80">80 A</option>
                            <option value="100">100 A</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-sans font-bold text-on-surface-variant uppercase">
                            Sensib.
                          </label>
                          <select
                            value={grp.sensitivity}
                            onChange={(e) =>
                              handleUpdateDifferentialGroup(grp.id, {
                                sensitivity: e.target.value as any
                              })
                            }
                            className="w-full bg-surface-container px-2 py-1.5 rounded font-bold outline-none"
                          >
                            <option value="30mA">30mA</option>
                            <option value="100mA">100mA</option>
                            <option value="300mA">300mA</option>
                            <option value="500mA">500mA</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-sans font-bold text-on-surface-variant uppercase">
                            Clase
                          </label>
                          <select
                            value={grp.rccbClass}
                            onChange={(e) =>
                              handleUpdateDifferentialGroup(grp.id, {
                                rccbClass: e.target.value as any
                              })
                            }
                            className="w-full bg-surface-container px-2 py-1.5 rounded font-bold outline-none"
                          >
                            <option value="AC">Clase AC</option>
                            <option value="A">Clase A</option>
                            <option value="A-SI">Clase A-SI</option>
                            <option value="F">Clase F</option>
                            <option value="B">Clase B</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-on-surface-variant">
                          Circuitos asociados: <strong className="text-on-surface">{assignedCircuits.length}</strong>{' '}
                          (ΣIb = <strong className="font-mono">{stats.sumIb.toFixed(1)} A</strong>)
                        </span>
                        {isOver5Circuits && (
                          <span className="text-amber-600 font-bold">
                            Aviso ITC-BT-25: &gt; 5 circuitos en un mismo diferencial
                          </span>
                        )}
                      </div>

                      {assignedCircuits.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedCircuits.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono font-bold text-on-surface"
                            >
                              {c.id.split(' - ')[0]} ({c.in}A · {c.seccion})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Auditoría de Selectividad Amperimétrica y Cronométrica (IGA <-> Circuitos PIA) */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                    5. Validación de Selectividad IGA ↔ Circuitos PIA (Amperimétrica y Cronométrica)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Comprobación de curvas de disparo entre cabecera (IGA {panelAnalysis.effectiveIgaNum}A Curva {panelConfig.igaCurve}
                    {(panelConfig.igaTimeDelayMs || 0) > 0 ? ` · Δt=${panelConfig.igaTimeDelayMs}ms` : ' · Instantáneo'}) y las protecciones de cada circuito
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {panelAnalysis.selectivityFailCount === 0 &&
                  panelAnalysis.selectivityPartialCount === 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700">
                      Selectividad Total Verificada ({circuits.length}/{circuits.length})
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600" />
                      {panelAnalysis.selectivityFailCount} sin selectividad ·{' '}
                      {panelAnalysis.selectivityPartialCount} parcial / aviso cronométrico
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant/25">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-container text-[10px] uppercase text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-3 py-2.5">Circuito</th>
                      <th className="px-3 py-2.5">Protección PIA</th>
                      <th className="px-3 py-2.5">Ratio In (IGA/PIA)</th>
                      <th className="px-3 py-2.5">Umbral Mag. (IGA vs PIA)</th>
                      <th className="px-3 py-2.5">Amperimétrica</th>
                      <th className="px-3 py-2.5">Cronométrica</th>
                      <th className="px-3 py-2.5">Etiqueta de Aviso / Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 bg-surface">
                    {circuits.map((circ) => {
                      const sel = panelAnalysis.circuitSelectivityMap[circ.id];
                      if (!sel) return null;
                      return (
                        <tr key={circ.id} className="hover:bg-surface-container/30">
                          <td className="px-3 py-2.5 font-sans font-bold text-on-surface">
                            {circ.id}
                          </td>
                          <td className="px-3 py-2.5">
                            {circ.in}A · Curva {circ.curva || 'C'}
                          </td>
                          <td
                            className={`px-3 py-2.5 font-bold ${
                              sel.ratioIn >= 1.6 ? 'text-emerald-600' : 'text-error'
                            }`}
                          >
                            {sel.ratioIn}× {sel.ratioIn >= 1.6 ? '(≥1.6)' : '(<1.6)'}
                          </td>
                          <td className="px-3 py-2.5 text-on-surface-variant">
                            {sel.iMagMinIga} A vs {sel.iMagMaxPia} A
                          </td>
                          <td className="px-3 py-2.5 font-sans font-bold">
                            {sel.amperimetricOk ? (
                              <span className="text-emerald-600">CUMPLE</span>
                            ) : (
                              <span className="text-error">NO CUMPLE</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-sans font-bold">
                            {sel.chronometricOk ? (
                              <span className="text-emerald-600">CUMPLE</span>
                            ) : (
                              <span className="text-amber-600">NO CUMPLE</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] w-fit ${
                                  sel.status === 'total'
                                    ? 'bg-emerald-500/15 text-emerald-700'
                                    : sel.status === 'partial'
                                    ? 'bg-amber-500/15 text-amber-800'
                                    : 'bg-error/15 text-error'
                                }`}
                              >
                                {sel.status !== 'total' && <AlertTriangle size={11} />}
                                {sel.badgeText}
                              </span>
                              {!sel.isFullyCompliant && (
                                <span className="text-[11px] text-on-surface-variant">
                                  {sel.shortReason}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabs: {
    id: 'condiciones' | 'receptor' | 'seccion' | 'tabla' | 'cuadro';
    label: string;
  }[] = [
    { id: 'condiciones', label: '1. Condiciones' },
    { id: 'receptor', label: '2. Receptor' },
    { id: 'seccion', label: '3. Sección Cable' },
    { id: 'tabla', label: '4. Tabla UNE' },
    { id: 'cuadro', label: `5. Cuadro y Protecciones (${panelConfig.differentialGroups.length} ID)` }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 lg:px-8 pb-32">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4 pl-4 border-l-[6px] border-primary rounded-[2px]">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface -tracking-[0.02em]">
            Líneas BT y Cuadro de Distribución
          </h2>
          <p className="text-on-surface-variant text-sm font-medium tracking-wide">
            Cálculo normativo UNE-HD 60364-5-52 /{' '}
            <span className="text-primary font-bold">
              Condiciones · Receptor · Sección · Tabla · Cabecera y Diferenciales
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTransferToCAD(panelConfig)}
          className="bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
        >
          <GitBranch size={16} />
          Pasar Cuadro al Esquema Unifilar ({circuits.length})
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col min-h-[560px] xl:w-[96%] mx-auto">
        {/* Tabs Navigation */}
        <div className="flex border-b border-outline-variant/20 overflow-x-auto scrollbar-hide bg-surface-container-lowest">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-[0.78rem] font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="p-6 md:p-8 flex-1 bg-surface-container-lowest">{renderTabContent()}</div>

        {/* Global Summary Bar at Bottom */}
        <div className="bg-surface-container-lowest px-6 py-3.5 border-t border-b border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-5 text-sm font-mono overflow-x-auto w-full">
            <span className="bg-surface px-3.5 py-1 rounded-lg border border-outline-variant/30 font-bold whitespace-nowrap text-on-surface shadow-sm uppercase tracking-widest text-xs">
              Resumen Línea Activa
            </span>
            {activeRow ? (
              <>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    Sección:
                  </strong>
                  <strong className="text-primary">{activeRow.s} mm²</strong>{' '}
                  {selectedManualSection ? '(Manual)' : '(Auto)'}
                </span>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    Ib:
                  </strong>
                  {ib.toFixed(2)} A
                </span>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    In:
                  </strong>
                  {effectiveIn} A ({curvaProteccion})
                </span>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    Iz':
                  </strong>
                  {activeRow.iz} A
                </span>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    ΔU:
                  </strong>
                  <span className={activeRow.okVoltageDrop ? 'text-emerald-600 font-bold' : 'text-error font-bold'}>
                    {activeRow.caida} %
                  </span>
                </span>
                <span className="whitespace-nowrap text-on-surface font-mono text-xs">
                  <strong className="font-sans font-semibold text-on-surface-variant mr-1">
                    Diferencial:
                  </strong>
                  <span className="text-primary font-bold">{grupoId}</span>
                </span>
                <span
                  className={`whitespace-nowrap px-2.5 py-0.5 rounded font-sans font-bold text-[11px] flex items-center gap-1 ${
                    activeSelectivity.status === 'total'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : activeSelectivity.status === 'partial'
                      ? 'bg-amber-500/15 text-amber-800'
                      : 'bg-error/15 text-error'
                  }`}
                  title={activeSelectivity.shortReason}
                >
                  {activeSelectivity.status !== 'total' && <AlertTriangle size={12} />}
                  {activeSelectivity.badgeText}
                </span>
              </>
            ) : (
              <span className="text-error font-sans font-semibold text-xs">
                Ninguna sección cumple las condiciones
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="bg-surface-container-lowest p-5 flex flex-wrap gap-3 items-center justify-between border-t border-outline-variant/15">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden shrink-0 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="px-3.5 py-2 border-r border-outline-variant/30 text-xs font-bold text-on-surface-variant bg-surface-container-low min-w-[70px] text-center">
                ID Línea
              </span>
              <input
                type="text"
                className="px-3.5 py-2 bg-transparent text-xs font-bold text-on-surface outline-none w-52 focus:bg-primary/5 transition-colors"
                value={circuitoId}
                onChange={(e) => setCircuitoId(e.target.value)}
                placeholder="Ej: C1 - Alumbrado General"
              />
            </div>

            <button
              onClick={handleClear}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
              title="Limpiar campos para una nueva línea"
            >
              Limpiar
            </button>
            <button
              onClick={handleSave}
              className="bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <Save size={15} />
              Guardar Circuito en Cuadro
            </button>
          </div>

          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            <button
              onClick={() => onTransferToCAD(panelConfig)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2"
              title="Generar Esquema Unifilar CAD con Cabecera IGA, SPD, Repartidor, Diferenciales y estos Circuitos"
            >
              <GitBranch size={15} />
              Pasar a Unifilar CAD
            </button>
            <button
              onClick={onOpenExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2"
              title="Generar Memoria Técnica oficial completa en PDF con unifilar y tabla"
            >
              <FileText size={15} />
              Exportar Memoria MTD
            </button>
          </div>
        </div>
      </div>

      {/* Saved Circuits Table at Bottom */}
      <div className="mt-8 bg-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden xl:w-[96%] mx-auto pb-6">
        <div className="p-4 md:p-6 border-b border-outline-variant/20 bg-surface flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                placeholder="Buscar por circuito, grupo ID, sección, método..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-outline-variant/30 rounded-lg bg-surface-container-lowest text-xs outline-none focus:border-primary shadow-sm w-72 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-on-surface"
              />
            </div>

            <button
              onClick={() => onTransferToCAD(panelConfig)}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary rounded-lg border border-primary/30 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <GitBranch size={14} />
              Sincronizar Unifilar CAD ({circuits.length})
            </button>

            <button
              onClick={onOpenExport}
              className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface rounded-lg border border-outline-variant/30 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              Exportar Todo ({circuits.length})
            </button>
          </div>

          <div className="text-xs text-on-surface-variant text-right font-medium">
            Cabecera: <strong className="text-on-surface">IGA {panelConfig.igaPoles} {panelAnalysis.effectiveIgaNum}A</strong> ·{' '}
            {panelConfig.spdIncluded ? <strong className="text-emerald-600">SPD Activo</strong> : 'Sin SPD'} ·{' '}
            <strong className="text-primary">{circuits.length}</strong> líneas en cuadro
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm text-center font-mono whitespace-nowrap min-w-[1250px]">
            <thead className="bg-[#fcfdfd] text-[0.65rem] border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider font-extrabold pb-4 shadow-sm">
              <tr>
                <th className="py-4 px-3 align-middle">Cargar</th>
                <th className="py-4 px-3 text-left align-middle text-[#000]">Circuito</th>
                <th className="py-4 px-3 align-middle text-[#000]">Grupo ID</th>
                <th className="py-4 px-3 align-middle text-[#000]">Método</th>
                <th className="py-4 px-3 align-middle text-[#000]">Conductores</th>
                <th className="py-4 px-3 align-middle text-[#000]">Tensión</th>
                <th className="py-4 px-3 align-middle text-[#000]">Aisl.</th>
                <th className="py-4 px-3 align-middle text-[#000]">Sección (mm²)</th>
                <th className="py-4 px-3 align-middle text-[#000]">N°</th>
                <th className="py-4 px-3 align-middle text-[#000]">Carga (kW)</th>
                <th className="py-4 px-3 align-middle text-[#000]">Ib (A)</th>
                <th className="py-4 px-3 align-middle text-[#000]">PIA In (A)</th>
                <th className="py-4 px-3 align-middle text-[#000]">Selectividad IGA</th>
                <th className="py-4 px-3 align-middle text-[#000]">Iz' (A)</th>
                <th className="py-4 px-3 align-middle text-[#000]">L (m)</th>
                <th className="py-4 px-3 align-middle text-[#000]">ΔU (%)</th>
                <th className="py-4 px-3 align-middle text-[#000]">Borrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface bg-surface-container-lowest text-[13px] font-medium">
              {circuits
                .filter((c) => {
                  if (!searchTerm) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    c.id.toLowerCase().includes(q) ||
                    c.metodo.toLowerCase().includes(q) ||
                    c.seccion.toLowerCase().includes(q) ||
                    (c.grupoId || '').toLowerCase().includes(q) ||
                    c.conductores.toLowerCase().includes(q)
                  );
                })
                .map((circ) => {
                  const deltaNum = parseFloat(circ.deltaU.replace(',', '.')) || 0;
                  const isOk = deltaNum <= 5;
                  const sel = panelAnalysis.circuitSelectivityMap[circ.id];
                  return (
                    <tr key={circ.id} className="hover:bg-surface-container/40 transition-colors group">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleOpenRecord(circ)}
                          className="text-[#4e6df5] hover:text-[#3d5ce4] p-1.5 rounded active:scale-95 transition-transform cursor-pointer"
                          title="Cargar esta línea en el formulario para editar o recalcular"
                        >
                          <FolderOpen size={18} />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-left font-sans font-bold text-on-surface/90">
                        {circ.id}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={circ.grupoId || panelConfig.differentialGroups[0]?.id || 'ID1'}
                          onChange={(e) => {
                            const newGid = e.target.value;
                            setCircuits((prev) =>
                              prev.map((item) =>
                                item.id === circ.id ? { ...item, grupoId: newGid } : item
                              )
                            );
                            onShowToast(`Circuito "${circ.id}" asignado a ${newGid}`);
                          }}
                          className="px-2 py-1 rounded bg-primary/10 text-primary font-bold text-xs outline-none cursor-pointer"
                        >
                          {panelConfig.differentialGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.id}
                            </option>
                          ))}
                          <option value="DIRECT">DIRECTO</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.metodo}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.conductores}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.tension} V</td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.aisl}</td>
                      <td className="py-3 px-3 font-bold text-primary">{circ.seccion}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.n}</td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        {circ.carga} {circ.ud}
                      </td>
                      <td className="py-3 px-3 text-on-surface">{circ.ib}</td>
                      <td className="py-3 px-3 font-bold text-on-surface">
                        {circ.in}A ({circ.curva || 'C'})
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {sel && (
                          <span
                            title={`${sel.shortReason} — ${sel.recommendation}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-help ${
                              sel.status === 'total'
                                ? 'bg-emerald-500/15 text-emerald-700'
                                : sel.status === 'partial'
                                ? 'bg-amber-500/15 text-amber-800'
                                : 'bg-error/15 text-error'
                            }`}
                          >
                            {sel.status !== 'total' && <AlertTriangle size={11} />}
                            {sel.badgeText}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.iz}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{circ.l}</td>
                      <td
                        className={`py-3 px-3 font-bold ${
                          isOk ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {circ.deltaU}%
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleDeleteRecord(circ.id)}
                          className="text-error/60 hover:text-error transition-colors p-1.5 rounded active:scale-95 cursor-pointer"
                          title="Eliminar este circuito"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PDFViewerWrapper({ url }: { url: string }) {
  // Use native browser PDF embedding which is 100% robust and compatible with React 19
  return (
    <div className="w-full h-full flex flex-col bg-surface-container-lowest">
      <iframe 
        src={url} 
        className="w-full h-full border-0 select-none flex-1"
        title="Visualizador de PDF oficial"
      />
    </div>
  );
}

// --- Helper for PDF summaries ---
function getDocSummary(title: string) {
  if (title.includes('REBT')) {
    return (
      <div className="text-xs bg-surface-container-highest/50 p-4 rounded-lg space-y-3 text-on-surface-variant font-medium">
        <p className="font-bold text-on-surface text-xs border-b border-outline-variant/20 pb-1 mb-1">Puntos Clave del REBT (R.D. 842/2002):</p>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Estructura Fundamental:</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Consta de 29 artículos doctrinales de seguridad y 51 Instrucciones Técnicas Complementarias (ITC-BT) que detallan los requisitos técnicos del diseño eléctrico en España.</p>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">ITC-BT de Consulta Frecuente:</span>
          <ul className="mt-0.5 opacity-95 list-disc ml-4 space-y-1">
            <li><strong className="text-on-surface font-semibold">ITC-BT-19:</strong> Instalaciones interiores (caídas de tensión máximas del 3% en alumbrado y 5% en otros usos).</li>
            <li><strong className="text-on-surface font-semibold">ITC-BT-22:</strong> Selección de protecciones contra sobreintensidades (PIAs con curvas B, C o D).</li>
            <li><strong className="text-on-surface font-semibold">ITC-BT-24:</strong> Protección contra contactos directos e indirectos (Diferenciales Clase AC, A o B de ≤30mA).</li>
          </ul>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Ámbito de Aplicación:</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Obligatorio en todo el territorio español para cualquier red con tensión nominal menor o igual a 1.000 V en corriente alterna o 1.500 V en corriente continua.</p>
        </div>
      </div>
    );
  } else if (title.includes('Guía Técnica')) {
    return (
      <div className="text-xs bg-surface-container-highest/50 p-4 rounded-lg space-y-3 text-on-surface-variant font-medium">
        <p className="font-bold text-on-surface text-xs border-b border-outline-variant/20 pb-1 mb-1">Guía Oficial de Aplicación:</p>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Propósito Administrativo:</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Redactada por el Ministerio de Industria. No es un texto reglamentario rígido sino el criterio de interpretación oficial de obligado conocimiento ante dudas técnicas o auditorías.</p>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Factor de Motores (ITC-BT-47):</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Las líneas alimentadoras de motores deben dimensionarse para soportar un mínimo del 125% de la corriente nominal a plena carga (factor 1,25).</p>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Sistemas de Instalación:</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Define con precisión técnica de interpretación los tipos de canalizaciones: cables unipolares o multipolares en tubos, canales protectoras o bandejas.</p>
        </div>
      </div>
    );
  } else if (title.includes('Caídas') || title.includes('Anexo 2')) {
    return (
      <div className="text-xs bg-surface-container-highest/50 p-4 rounded-lg space-y-3 text-on-surface-variant font-medium">
        <p className="font-bold text-on-surface text-xs border-b border-outline-variant/20 pb-1 mb-1">Anexo 2 - Caídas de Tensión:</p>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Metodología de Cálculo (ΔU):</span>
          <ul className="mt-1 opacity-95 list-disc ml-4 space-y-1">
            <li><strong className="text-on-surface font-semibold">Monofásica:</strong> ΔU = (2 · L · Ib · cosφ) / (γ · S)</li>
            <li><strong className="text-on-surface font-semibold">Trifásica:</strong> ΔU = (√3 · L · Ib · cosφ) / (γ · S)</li>
          </ul>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Conductividades Térmicas (γ):</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">La conductividad del metal se corrige según el tipo de aislamiento debido a la temperatura de servicio continuo:</p>
          <ul className="mt-1 opacity-95 list-disc ml-4 space-y-0.5">
            <li><strong className="text-on-surface font-semibold">PVC (70ºC de servicio):</strong> Cobre = 48, Aluminio = 30</li>
            <li><strong className="text-on-surface font-semibold">XLPE o EPR (90ºC de servicio):</strong> Cobre = 44, Aluminio = 28</li>
          </ul>
        </div>
        <div>
          <span className="font-bold text-on-surface text-[11px] block">Influencia de Reactancia (X):</span>
          <p className="mt-0.5 opacity-90 leading-relaxed">Para secciones menores de 120 mm² la reactancia inductiva es despreciable, utilizándose únicamente la componente resistiva de cálculo.</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="text-xs bg-surface-container-highest/50 p-4 rounded-lg space-y-3 text-on-surface-variant font-medium">
        <p className="font-bold text-on-surface text-xs border-b border-outline-variant/20 pb-1 mb-1">Portal Oficial UNE:</p>
        <p className="opacity-90 leading-relaxed">La norma UNE-HD 60364-5-52 proporciona las directrices unificadas europeas para la selección e instalación de canalizaciones y corrientes admisibles para cables.</p>
      </div>
    );
  }
}

// --- Docs Screen ---
function DocsScreen() {
  const [activeDoc, setActiveDoc] = useState<{ title: string; url: string } | null>(null);
  const [boeUpdate, setBoeUpdate] = useState<string | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  useEffect(() => {
    async function fetchBoeUpdate() {
      try {
        setLoadingUpdate(true);
        let html = '';
        
        try {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=326_Reglamento_electrotecnico_para_baja_tension_e_ITC&tipo=C&modo=2')}`);
          if (!res.ok) throw new Error('allorigins failed');
          const data = await res.json();
          html = data.contents || '';
        } catch (err) {
          // Fallback to corsproxy
          const res2 = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=326_Reglamento_electrotecnico_para_baja_tension_e_ITC&tipo=C&modo=2')}`);
          if (!res2.ok) throw new Error('corsproxy failed');
          html = await res2.text();
        }

        const match = html.match(/<p>Última modificación:\s*<strong>\s*(.*?)\s*<\/strong>\.<\/p>/i);
        if (match && match[1]) {
          setBoeUpdate(match[1]);
        } else {
          setBoeUpdate('No disponible (comprobar en la web)');
        }
      } catch (e) {
        // Silently catch fetch errors to avoid console spam for users with adblockers
        setBoeUpdate('No disponible (error de conexión)');
      } finally {
        setLoadingUpdate(false);
      }
    }
    fetchBoeUpdate();
  }, []);

  const docs = [
    {
      title: 'REBT (R.D. 842/2002)',
      desc: 'Reglamento Electrotécnico para Baja Tensión (ITC-BT). Texto Consolidado Oficial.',
      url: '/rebt.pdf',
      icon: BookOpen,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Guía Técnica de Aplicación',
      desc: 'Documento completo de aclaraciones del REBT (F2I2).',
      url: '/guia.pdf',
      icon: FileText,
      iconColor: 'bg-tertiary/10 text-tertiary',
    },
    {
      title: 'Cálculo de Caídas de Tensión',
      desc: 'Guía Técnica de Aplicación Anexo 2 del Ministerio de Industria, Energía y Turismo.',
      url: '/anexo2.pdf',
      icon: Calculator,
      iconColor: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Norma UNE-HD 60364-5-52',
      desc: 'Instalaciones eléctricas de baja tensión. Selección e instalación (Extracto/Buscador).',
      url: 'https://www.une.org/encuentra-tu-norma/busca-tu-norma/norma/?c=N0054045',
      icon: Info,
      iconColor: 'bg-surface-container-highest text-on-surface',
    }
  ];

  if (activeDoc) {
    const isLocalPDF = activeDoc.url.startsWith('/') || activeDoc.url.endsWith('.pdf');
    return (
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveDoc(null)}
              className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              title="Volver"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="text-2xl font-headline font-bold text-on-surface">{activeDoc.title}</h2>
          </div>
          <a href={activeDoc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-lg">
            <span>Abrir en nueva pestaña</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        
        {isLocalPDF ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Split view: Left pane with explanations, right pane with rapid loaded local viewer */}
            <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant/30 flex flex-col justify-between space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">{activeDoc.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Documento de referencia técnica integrada para consultas ágiles y fundamentación de cálculos según la normativa española.
                </p>
                {getDocSummary(activeDoc.title)}
              </div>
              <div className="space-y-3">
                <a 
                  href={activeDoc.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-bold px-4 py-3 rounded-lg hover:bg-primary/95 transition-colors shadow-sm text-sm opacity-95 hover:opacity-100"
                >
                  <span>Abrir PDF a Pantalla Completa</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
                <p className="text-[10px] text-center text-on-surface-variant italic">
                  * Nota: En dispositivos móviles, los archivos PDF se descargan o se abren de forma nativa. Si no visualiza el panel derecho, use el botón superior.
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm relative h-full">
              <div className="absolute top-3 left-3 z-10 bg-primary text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow">
                Visor Integrado de Respaldo
              </div>
              <PDFViewerWrapper url={activeDoc.url} />
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm relative">
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <BookOpen size={48} className="text-secondary/40" />
              <h3 className="font-bold text-on-surface">Documento Externo</h3>
              <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                Las especificaciones de seguridad correspondientes al portal original impiden mostrar y embeber directamente este recurso en un iFrame. Por favor consulte el documento oficial en su portal original:
              </p>
              <a 
                href={activeDoc.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all text-sm flex items-center gap-2"
              >
                <span>Abrir Portal Externo</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Documentación</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Normativas, manuales y recursos de referencia integrados para consultas rápidas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <button 
              key={idx}
              onClick={() => setActiveDoc(doc)}
              className="group text-left bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className={`${doc.iconColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">
                {doc.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                {doc.desc}
              </p>
              {doc.title.includes('REBT') && (
                <div className="mt-2 text-xs font-bold text-secondary">
                  {loadingUpdate ? 'Comprobando última versión...' : boeUpdate ? `Última actualización BOE: ${boeUpdate}` : ''}
                </div>
              )}
              <div className="mt-4 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ver documento</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
