import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Screen = 'dashboard' | 'power' | 'voltage_drop' | 'protections' | 'canalizacion' | 'installation' | 'advanced_circuit' | 'docs';
type Phase = 'mono' | 'tri';
type CalcMode = 'power' | 'current';
type Material = 'cu' | 'al';

// --- Main App Component ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface pb-20 md:pb-0 relative">
      <TopBar onShowToast={showToast} />
      
      <div className="flex flex-1 overflow-hidden">
        <SideNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} onShowToast={showToast} />
        
        <main className="flex-1 overflow-y-auto w-full">
          {currentScreen === 'dashboard' && <DashboardScreen onNavigate={setCurrentScreen} onShowToast={showToast} />}
          {currentScreen === 'power' && <PowerCalculatorScreen />}
          {currentScreen === 'voltage_drop' && <VoltageDropScreen />}
          {currentScreen === 'protections' && <ProtectionsScreen />}
          {currentScreen === 'canalizacion' && <CanalizacionScreen />}
          {currentScreen === 'docs' && <DocsScreen />}
          {currentScreen === 'installation' && <InstallationScreen />}
          {currentScreen === 'advanced_circuit' && <AdvancedCircuitScreen />}
        </main>
      </div>

      <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

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
function TopBar({ onShowToast }: { onShowToast: (msg: string) => void }) {
  return (
    <header className="w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 w-full">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-primary active:opacity-80 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div className="hidden md:flex items-center justify-center bg-primary text-white p-1.5 rounded-lg mr-2">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-headline font-black text-primary tracking-tighter text-xl">VoltMetric Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onShowToast('Guardar proyecto próximamente')} className="hidden md:block px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all">
            Save Project
          </button>
          <button onClick={() => onShowToast('Perfil de usuario próximamente')} className="text-primary active:opacity-80 transition-all">
            <UserCircle size={28} />
          </button>
        </div>
      </div>
    </header>
  );
}

function SideNav({ currentScreen, setCurrentScreen, onShowToast }: { currentScreen: Screen, setCurrentScreen: (s: Screen) => void, onShowToast: (msg: string) => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    calculators: true
  });

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', type: 'item' as const },
    { 
      id: 'calculators', 
      icon: Calculator, 
      label: 'Calculadoras', 
      type: 'group' as const,
      subItems: [
        { id: 'power', icon: Zap, label: 'Potencia' },
        { id: 'voltage_drop', icon: Cpu, label: 'Caída de Tensión' },
        { id: 'canalizacion', icon: Layers, label: 'Canalización' },
        { id: 'protections', icon: Shield, label: 'Protecciones' },
        { id: 'installation', icon: Gauge, label: 'Aislamiento' },
        { id: 'advanced_circuit', icon: Calculator, label: 'Circuito Completo' }
      ]
    },
    { id: 'docs', icon: BookOpen, label: 'Documentación', type: 'item' as const }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container border-r border-outline-variant/20 h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded bg-white p-2 shadow-sm flex items-center justify-center text-primary">
            <Cpu size={24} />
          </div>
          <div>
            <p className="font-bold text-primary text-sm">Project #402</p>
            <p className="text-xs text-on-surface-variant">Industrial Grid Alpha</p>
          </div>
        </div>
        <button onClick={() => onShowToast('Nuevo cálculo próximamente')} className="w-full py-2.5 bg-primary text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md text-sm font-bold">
          + New Calculation
        </button>
      </div>
      <nav className="flex-1 flex flex-col px-4 gap-1 pb-6">
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
    </aside>
  );
}

function BottomNav({ currentScreen, setCurrentScreen }: { currentScreen: Screen, setCurrentScreen: (s: Screen) => void }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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

function DashboardScreen({ onNavigate, onShowToast }: { onNavigate: (s: Screen) => void, onShowToast: (msg: string) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      {/* Hero Industrial Header */}
      <section className="mb-8 p-6 md:p-10 rounded-xl industrial-gradient text-white flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-lg">
        <div className="z-10">
          <span className="font-label text-secondary-container uppercase tracking-widest text-xs font-bold mb-2 block">Central de Ingeniería</span>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Panel de Control REBT</h2>
          <p className="text-primary-fixed-dim max-w-md text-sm md:text-base opacity-90">Gestione sus cálculos de instalaciones eléctricas de baja tensión con precisión técnica certificada.</p>
        </div>
        <div className="mt-6 md:mt-0 z-10">
          <a href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-md p-4 rounded-lg block cursor-pointer">
            <p className="font-label text-xs uppercase opacity-70 mb-1">Estado del Sistema</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-tertiary-fixed rounded-full animate-pulse"></span>
              <span className="font-bold text-sm">Normativa Vigente 2024</span>
            </div>
          </a>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Zap size={200} fill="currentColor" />
        </div>
      </section>

      {/* Main Calculation Tools (Bento Grid) */}
      <h3 className="font-headline text-lg font-bold mb-4 px-1 text-on-surface">Herramientas Principales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <ToolCard 
          icon={Zap} 
          title="Cálculo de Potencia" 
          desc="Dimensionado de cargas monofásicas y trifásicas según ITC-BT-10."
          action="Empezar"
          colorClass="text-primary border-primary"
          bgClass="bg-surface-container"
          onClick={() => onNavigate('power')}
        />
        <ToolCard 
          icon={Cpu} 
          title="Sección de Cableado" 
          desc="Caída de tensión y densidad de corriente según ITC-BT-19."
          action="Calcular"
          colorClass="text-secondary border-secondary"
          bgClass="bg-secondary-container/20"
          onClick={() => onNavigate('voltage_drop')}
        />
        <ToolCard 
          icon={Shield} 
          title="Protecciones" 
          desc="Selección de PIA, Diferenciales y Sobretensiones (ITC-BT-22)."
          action="Configurar"
          colorClass="text-tertiary-container border-tertiary-container"
          bgClass="bg-tertiary-fixed-dim/30"
          onClick={() => onNavigate('protections')}
        />
        <ToolCard 
          icon={Gauge} 
          title="Aislamiento" 
          desc="Resistencia de aislamiento y rigidez dieléctrica (UNE)."
          action="Verificar"
          colorClass="text-error border-error"
          bgClass="bg-error-container/20"
          onClick={() => onNavigate('installation')}
        />
      </div>

      {/* Recent Calculations */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-headline text-lg font-bold text-on-surface">Cálculos Recientes</h3>
        <button className="text-sm font-bold text-primary hover:underline">Ver todo</button>
      </div>
      <div className="bg-surface-container rounded-xl overflow-x-auto mb-8 border border-outline-variant/20">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-surface-container-high">
              <th className="px-4 md:px-6 py-4 font-label text-xs uppercase tracking-widest text-on-surface-variant">Proyecto / ID</th>
              <th className="hidden md:table-cell px-6 py-4 font-label text-xs uppercase tracking-widest text-on-surface-variant">Tipo</th>
              <th className="px-4 md:px-6 py-4 font-label text-xs uppercase tracking-widest text-on-surface-variant text-right">Resultado</th>
              <th className="px-4 md:px-6 py-4 font-label text-xs uppercase tracking-widest text-on-surface-variant text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            <RecentRow title="Nave Industrial Sector C" id="2024-0892" type="Sección Cable" result="35 mm²" subResult="Cu XLPE" status="Cumple" statusColor="bg-tertiary-fixed text-tertiary-container" />
            <RecentRow title="Instalación Vivienda Lujo" id="2024-0885" type="Potencia GA" result="9.2 kW" subResult="Monofásica" status="Cumple" statusColor="bg-tertiary-fixed text-tertiary-container" bg="bg-surface-container-low/50" />
            <RecentRow title="Edificio Oficinas Central" id="2024-0870" type="Derivación Indiv." result="16 mm²" subResult="Caída > 1.5%" resultColor="text-error" status="Revisar" statusColor="bg-error-container text-on-error-container" />
          </tbody>
        </table>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink icon={Layers} label="Canalización" onClick={() => onNavigate('canalizacion')} />
        <QuickLink icon={History} label="Historial" onClick={() => onShowToast('Historial de proyectos próximamente')} />
        <QuickLink icon={FileText} label="Plantillas" onClick={() => onShowToast('Gestor de plantillas próximamente')} />
        <QuickLink icon={RefreshCw} label="Sincronizar" onClick={() => onShowToast('Sincronización en la nube próximamente')} />
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
                      <td className="p-4 text-right font-bold text-on-surface">{((p * 1000) / v).toFixed(2)} A</td>
                    </tr>
                    <tr className="border-b border-outline-variant/10">
                      <td className="p-4 font-semibold text-on-surface-variant">Pérdida Potencia</td>
                      <td className="p-4 text-right font-bold text-on-surface">{(deltaU_volts * ((p * 1000) / v)).toFixed(1)} W</td>
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
  const [current, setCurrent] = useState('16');
  const [curve, setCurve] = useState('C');
  const [poles, setPoles] = useState('2');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(false);
  }, [current, curve, poles]);

  const pias = [10, 16, 20, 25, 32, 40, 50, 63];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span className="font-medium">Calculadoras</span>
          <span className="text-xs">/</span>
          <span className="font-bold text-primary">Protecciones</span>
        </div>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-primary">Protecciones (PIA)</h2>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-sm md:text-base">Selección de interruptores magnetotérmicos según REBT ITC-BT-22.</p>
      </div>

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

              <InputField label="Poder de Corte (kA)" value="6" onChange={() => {}} unit="kA" />
              
              <button 
                onClick={() => setShowResults(true)}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
              >
                <Calculator size={24} />
                CALCULAR PROTECCIÓN
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          {!showResults ? (
            <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center h-full shadow-sm min-h-[300px]">
              <Shield size={48} className="text-secondary/30 mb-4" />
              <p className="text-on-surface-variant font-medium">Presiona el botón "Calcular" para ver la selección recomendada.</p>
            </div>
          ) : (
            <>
              <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 opacity-10">
                  <Shield size={200} fill="currentColor" />
                </div>
                <h3 className="font-headline font-bold text-lg mb-8 flex items-center gap-2 relative z-10">
                  <Shield size={20} />
                  Selección Recomendada
                </h3>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-on-tertiary-container/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Magnetotérmico</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-4xl font-black">PIA {current}A</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md rounded-lg p-5 border border-white/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider">Curva</span>
                      <span className="font-black text-lg">{curve}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider">Polos</span>
                      <span className="font-black text-lg">{poles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider">Poder de Corte</span>
                      <span className="font-black text-lg">6 kA</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/15 flex gap-4 items-start">
                <div className="bg-tertiary-fixed-dim/20 p-2 rounded-lg text-tertiary-container shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-on-surface">Curva {curve}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {curve === 'B' && 'Disparo rápido (3-5 In). Recomendado para grandes longitudes de cable o generadores.'}
                    {curve === 'C' && 'Disparo normal (5-10 In). Uso general en instalaciones domésticas e industriales.'}
                    {curve === 'D' && 'Disparo lento (10-20 In). Recomendado para motores o transformadores con alta corriente de arranque.'}
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

function AdvancedCircuitScreen() {
  const [activeTab, setActiveTab] = useState<'condiciones' | 'receptor' | 'seccion' | 'tabla'>('receptor');
  
  // State for receptor tab
  const [tension, setTension] = useState('400.0');
  const [aislamiento, setAislamiento] = useState('Z1');
  const [numero, setNumero] = useState('2');
  const [potencia, setPotencia] = useState('40.0');
  const [cosPhi, setCosPhi] = useState('0.8');
  const [longitud, setLongitud] = useState('10.0');
  const [caidaMax, setCaidaMax] = useState('5.0');
  const [intensidadNominal, setIntensidadNominal] = useState('125');
  const [conductoresPorFase, setConductoresPorFase] = useState('1');
  
  // State for condiciones tab
  const [metodo, setMetodo] = useState('B1');
  const [tempAmbiente, setTempAmbiente] = useState('40');
  const [metodoInstalacion, setMetodoInstalacion] = useState('Bajo tubo empotrado');
  const [disposicionCables, setDisposicionCables] = useState('Agrupados en el aire, superficie, empotrados o embutidos');
  const [profundidad, setProfundidad] = useState('---');
  const [resistividadTermica, setResistividadTermica] = useState('---');
  const [icc, setIcc] = useState('');

  // Calculation Options
  const [tipoCalculo, setTipoCalculo] = useState<'potencia' | 'intensidad'>('potencia');
  const [tipoConductor, setTipoConductor] = useState<'cobre' | 'aluminio'>('cobre');
  const [calculoConductor, setCalculoConductor] = useState<'unipolar' | 'multiconductor'>('unipolar');

  // Circuit ID
  const [circuitoId, setCircuitoId] = useState('Circuito3');
  const [records, setRecords] = useState<any[]>([
    { id: 'Circuito', metodo: 'B1', conductores: '1F+N+CP', tension: '230,0', aisl: 'Z1', seccion: '3G(1x10)', n: '1', carga: '4,0', ud: 'kW', fu: '1,0', fs: '1,0', ib: '21,74', in: '25', xin: '1,0', ir: '25,0', iz: '32,23', l: '10,0', deltaU: '0,31' },
    { id: 'Circuito2', metodo: 'B1', conductores: '3F+N', tension: '400,0', aisl: 'Z1', seccion: '4x(1x50)', n: '2', carga: '4,0', ud: 'kW', fu: '1,0', fs: '1,0', ib: '14,43', in: '63', xin: '1,0', ir: '63,0', iz: '75,78', l: '10,0', deltaU: '0,02' }
  ]);

  // Dynamic Calculations (Move out of renderTabContent)
  const v = parseFloat(tension) || 400;
  const p = parseFloat(potencia) || 40;
  const cpf = parseFloat(cosPhi) || 0.8;
  const length = parseFloat(longitud) || 10;
  const num = parseFloat(numero) || 1;
  const cpf_fase = parseFloat(conductoresPorFase) || 1;
  
  const ib = (p * 1000) / (Math.sqrt(3) * v * cpf);
  
  // Correction factors stub (Can be expanded later)
  let k_temp = 1.0;
  const t = parseInt(tempAmbiente);
  if (aislamiento === 'XLPE' || aislamiento === 'Z1') {
    if (t > 40) k_temp = 1.0 - (t - 40) * 0.02;
    else if (t < 40) k_temp = 1.0 + (40 - t) * 0.02;
  } else { // PVC
    if (t > 40) k_temp = 1.0 - (t - 40) * 0.03;
    else if (t < 40) k_temp = 1.0 + (40 - t) * 0.03;
  }

  const tableRows = [
    { s: '1.5', iz: '8.77', icc: '0.55' },
    { s: '2.5', iz: '11.88', icc: '0.91' },
    { s: '4', iz: '15.83', icc: '1.45' },
    { s: '6', iz: '20.36', icc: '2.18' },
    { s: '10', iz: '28.27', icc: '3.64' },
    { s: '16', iz: '38.45', icc: '5.82' },
    { s: '25', iz: '50.33', icc: '9.09' },
    { s: '35', iz: '62.20', icc: '12.73' },
    { s: '50', iz: '75.78', icc: '18.18' },
    { s: '70', iz: '96.70', icc: '25.46' },
    { s: '95', iz: '117.06', icc: '34.55' },
    { s: '120', iz: '135.15', icc: '43.64' },
    { s: '150', iz: '148.16', icc: '54.55' },
    { s: '185', iz: '167.39', icc: '67.28' },
    { s: '240', iz: '195.66', icc: '87.28' },
  ].map(row => {
    const izNum = parseFloat(row.iz) * k_temp * cpf_fase;
    const sNum = parseFloat(row.s);
    
    const isFail = ib > izNum;
    let ratio = (ib / izNum) * 100;
    if (ratio > 9999) ratio = 9999;
    
    const caidaRow = (Math.sqrt(3) * (tipoConductor === 'cobre' ? 0.0179 : 0.028) * length * ib * cpf * 100) / (sNum * v);
    return {
      ...row,
      iz: izNum.toFixed(2),
      ibRatio: ratio.toFixed(1),
      caida: caidaRow.toFixed(2),
      ir: (isFail ? '---' : intensidadNominal),
      fail: isFail || caidaRow > parseFloat(caidaMax),
      pass: !isFail && caidaRow <= parseFloat(caidaMax)
    };
  });

  const handleSave = () => {
    const passingRow = tableRows.find(r => r.pass);
    const newRecord = {
      id: circuitoId,
      metodo: metodo,
      conductores: (calculoConductor === 'unipolar' ? '1x' : '') + (tipoConductor === 'cobre' ? 'Cu' : 'Al'),
      tension: tension.replace('.', ','),
      aisl: aislamiento,
      seccion: passingRow ? `${passingRow.s} mm²` : '---',
      n: conductoresPorFase,
      carga: potencia.replace('.', ','),
      ud: 'kW',
      fu: '1,0',
      fs: '1,0',
      ib: ib.toFixed(2).replace('.', ','),
      in: intensidadNominal,
      xin: '1,0',
      ir: passingRow ? passingRow.ir.replace('.', ',') : '---',
      iz: passingRow ? passingRow.iz.replace('.', ',') : '---',
      l: longitud.replace('.', ','),
      deltaU: passingRow ? passingRow.caida.replace('.', ',') : '---'
    };
    setRecords([newRecord, ...records]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'condiciones':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Método de instalación</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" 
                      value={metodoInstalacion} 
                      onChange={(e) => setMetodoInstalacion(e.target.value)}
                    >
                      <option value="Bajo tubo empotrado">Bajo tubo empotrado</option>
                      <option value="Multiconductores en conductos">Multiconductores en conductos</option>
                      <option value="Cables unipolares en aire">Cables unipolares en aire</option>
                      <option value="Cables enterrados">Cables enterrados</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 min-w-[300px]">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Disposición de cables</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" 
                      value={disposicionCables} 
                      onChange={(e) => setDisposicionCables(e.target.value)}
                    >
                      <option value="Agrupados en el aire, superficie, empotrados o embutidos">Agrupados en el aire, superficie, empotrados o embutidos</option>
                      <option value="En conductos">En conductos</option>
                      <option value="Sobre bandejas">Sobre bandejas</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField label="Método" value={metodo} onChange={setMetodo} />
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Temperatura ambiente</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" 
                      value={tempAmbiente} 
                      onChange={(e) => setTempAmbiente(e.target.value)}
                    >
                      {Array.from({ length: 51 }, (_, i) => i + 10).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">°C</span>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Profundidad</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold outline-none appearance-none cursor-pointer"
                      value={profundidad}
                      onChange={(e) => setProfundidad(e.target.value)}
                    >
                      <option value="---">---</option>
                      <option value="0.7">0.7</option>
                      <option value="1.0">1.0</option>
                      <option value="1.5">1.5</option>
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">m</span>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1 group relative">
                    Resistividad térmica 
                    <Info size={12} className="text-primary cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible bg-[#2c3e50] text-[#f8f9fa] p-4 rounded-lg shadow-xl z-[100] w-[280px] text-[10px] leading-relaxed font-mono border border-white/10 backdrop-blur-sm">
                      <div className="font-bold border-b border-white/10 pb-2 mb-2 uppercase tracking-widest text-[#95a5a6]">Según la naturaleza del suelo [orientativo]:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Inundado:</span> <span className="font-bold text-[#2ecc71]">0.40</span></div>
                        <div className="flex justify-between"><span>Muy húmedo:</span> <span className="font-bold text-[#2ecc71]">0.50</span></div>
                        <div className="flex justify-between"><span>Húmedo:</span> <span className="font-bold text-[#2ecc71]">0.70</span></div>
                        <div className="flex justify-between"><span>Ligeramente húmedo:</span> <span className="font-bold text-[#f1c40f]">0.85</span></div>
                        <div className="flex justify-between"><span>Seco:</span> <span className="font-bold text-[#e67e22]">1.00</span></div>
                        <div className="flex justify-between"><span>Arcilloso muy seco:</span> <span className="font-bold text-[#e74c3c]">1.20</span></div>
                        <div className="flex justify-between"><span>Arenoso muy seco:</span> <span className="font-bold text-[#e74c3c]">1.50</span></div>
                        <div className="flex justify-between"><span>Arenisca:</span> <span className="font-bold text-[#9b59b6]">2.00</span></div>
                        <div className="flex justify-between"><span>Caliza:</span> <span className="font-bold text-[#9b59b6]">2.50</span></div>
                        <div className="flex justify-between"><span>Granito:</span> <span className="font-bold text-[#34495e]">3.00</span></div>
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold outline-none appearance-none cursor-pointer"
                      value={resistividadTermica}
                      onChange={(e) => setResistividadTermica(e.target.value)}
                    >
                      <option value="---">---</option>
                      <option value="0.4">0.4</option>
                      <option value="1.0">1.0</option>
                      <option value="2.5">2.5</option>
                    </select>
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant pointer-events-none">K·m/W</span>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
             </div>
             
             <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 mt-6 shadow-sm">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-outline-variant/20 pb-2 text-on-surface-variant">Cortocircuito</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <InputField label="Cortocircuito kA" value={icc} onChange={setIcc} unit="kA" />
                    <div className="flex flex-col gap-3 text-sm font-medium pb-2 border-l border-outline-variant/20 pl-4">
                        <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                          <input 
                            type="radio" 
                            name="tipoCalculo" 
                            checked={tipoCalculo === 'potencia'} 
                            onChange={() => setTipoCalculo('potencia')}
                            className="w-4 h-4 accent-primary" 
                          /> Potencia
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                          <input 
                            type="radio" 
                            name="tipoCalculo" 
                            checked={tipoCalculo === 'intensidad'} 
                            onChange={() => setTipoCalculo('intensidad')}
                            className="w-4 h-4 accent-primary" 
                          /> Intensidad
                        </label>
                    </div>
                    <div className="flex flex-col gap-3 text-sm font-medium pb-2">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                            <input 
                              type="radio" 
                              name="tipoConductor" 
                              checked={tipoConductor === 'cobre'} 
                              onChange={() => setTipoConductor('cobre')}
                              className="w-4 h-4 accent-primary" 
                            /> Cobre
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                            <input 
                              type="radio" 
                              name="tipoConductor" 
                              checked={tipoConductor === 'aluminio'} 
                              onChange={() => setTipoConductor('aluminio')}
                              className="w-4 h-4 accent-primary" 
                            /> Aluminio
                          </label>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                            <input 
                              type="radio" 
                              name="calculoConductor" 
                              checked={calculoConductor === 'unipolar'} 
                              onChange={() => setCalculoConductor('unipolar')}
                              className="w-4 h-4 accent-primary" 
                            /> Unipolar
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                            <input 
                              type="radio" 
                              name="calculoConductor" 
                              checked={calculoConductor === 'multiconductor'} 
                              onChange={() => setCalculoConductor('multiconductor')}
                              className="w-4 h-4 accent-primary" 
                            /> Multiconductor
                          </label>
                        </div>
                    </div>
                </div>
             </div>

             <div className="flex gap-2 items-center bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/30 w-fit">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant pr-4 border-r border-outline-variant/30">Resumen</span>
                <span className="text-sm font-mono font-bold text-primary pl-2">{tableRows.find(r => r.pass)?.s || '---'}</span>
             </div>
          </div>
        );
      case 'receptor':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Alimentación</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                      <option>3F+N</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                   <div className="flex justify-between items-end">
                     <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Tensión*</label>
                   </div>
                   <div className="relative group">
                     <input 
                       type="number" 
                       value={tension}
                       onChange={(e) => setTension(e.target.value)}
                       className="w-full bg-surface-container px-4 py-2.5 rounded-lg border border-transparent font-medium text-sm text-on-surface focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/40 hover:bg-surface-container-high"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none select-none">
                       V
                     </span>
                   </div>
                   <span className="text-[10px] font-bold text-secondary-container uppercase tracking-wider px-1">TRIFÁSICA</span>
                 </div>

                <div className="space-y-1.5">
                  <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">Aislamiento <Info size={12}/></label>
                  <div className="relative">
                    <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" value={aislamiento} onChange={(e) => setAislamiento(e.target.value)}>
                      <option>Z1</option>
                      <option>PVC</option>
                      <option>XLPE</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField label="Número*" value={numero} onChange={setNumero} />
                <InputField label="Potencia*" value={potencia} onChange={setPotencia} unit="kW" />
                <InputField label="Cos φ*" value={cosPhi} onChange={setCosPhi} />
                <InputField label="Tercer armónico" value="0.0" onChange={() => {}} unit="%" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField label="Fu*" value="1.0" onChange={() => {}} />
                <InputField label="Fs*" value="1.0" onChange={() => {}} />
                <InputField label="Longitud*" value={longitud} onChange={setLongitud} unit="m" />
                <InputField label="Caída tensión máxima*" value={caidaMax} onChange={setCaidaMax} unit="%" />
             </div>

             <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 mt-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Protección</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                        <option>Interruptor automático</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Intensidad nominal</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" value={intensidadNominal} onChange={(e) => setIntensidadNominal(e.target.value)}>
                        <option>125</option>
                        <option>160</option>
                      </select>
                      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">A</span>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Ir (x In)</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                        <option>1.00</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Conductores por fase</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none" value={conductoresPorFase} onChange={(e) => setConductoresPorFase(e.target.value)}>
                        <option>1</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Sección mínima</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                        <option>1.5</option>
                      </select>
                      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">mm²</span>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Separación</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold outline-none appearance-none cursor-not-allowed opacity-70" disabled>
                        <option>---</option>
                      </select>
                      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant pointer-events-none">m</span>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block font-label text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-wider">Circuitos adicionales</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container px-4 py-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                        <option>3</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <InputField label={<span className="flex items-center gap-1">Fr agrupamiento* <Info size={12} className="inline"/></span>} value="0.65" onChange={() => {}} />
                  <InputField label={<span className="flex items-center gap-1">Fr adicional* <Info size={12} className="inline"/></span>} value="1.0" onChange={() => {}} />
               </div>
             </div>
          </div>
        );
      case 'seccion':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 font-medium font-mono text-on-surface-variant leading-relaxed shadow-sm">
            <h4 className="flex justify-between items-center mb-6">
               <span className="font-sans font-bold text-on-surface uppercase tracking-wider text-xs">Memoria de Cálculo</span>
               <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary-container transition-colors shadow-sm"><Info size={16}/></button>
            </h4>
            <p className="flex gap-2 items-center"><ChevronDown size={14} className="rotate-[-90deg] text-primary"/> <strong className="text-on-surface w-40">Sección:</strong> 185 mm²</p>
            <p className="flex gap-2 items-center"><ChevronDown size={14} className="rotate-[-90deg] text-primary"/> <strong className="text-on-surface w-40">Sección neutro:</strong> 185 mm²</p>
            <p className="flex gap-2 items-center"><ChevronDown size={14} className="rotate-[-90deg] text-primary"/> <strong className="text-on-surface w-40">Cables:</strong> 4x(1x185) mm²</p>
            <p className="flex gap-2 items-center"><ChevronDown size={14} className="rotate-[-90deg] text-primary"/> <strong className="text-on-surface w-40">Interruptor auto (In):</strong> 160 A</p>
            <p className="flex gap-2 items-center mb-6 pb-6 border-b border-outline-variant/20"><ChevronDown size={14} className="rotate-[-90deg] text-primary"/> <strong className="text-on-surface w-40">Regulación:</strong> {intensidadNominal} A (Ir = 1.0 x In)</p>
            
            <p className="text-on-surface flex gap-2">· <span className="w-64 text-on-surface-variant">Intensidad (Ib):</span> {ib.toFixed(2)} A</p>
            <p className="text-on-surface flex gap-2">· <span className="w-64 text-on-surface-variant">Intensidad admisible corregida (Iz'):</span> {tableRows.find(r => r.pass)?.iz || '---'} A</p>
            <p className="text-on-surface flex gap-2">· <span className="w-64 text-on-surface-variant">Cortocircuito admisible:</span> {tableRows.find(r => r.pass)?.icc || '---'} kA (t=0.1 s)</p>
            <p className="text-on-surface flex gap-2">· <span className="w-64 text-on-surface-variant">Caída de tensión:</span> {(parseFloat(tableRows.find(r => r.pass)?.caida || '0') * v / 100).toFixed(2)} V, {tableRows.find(r => r.pass)?.caida || '---'}% (ΔU≤{caidaMax} %)</p>
            <p className="text-on-surface flex gap-2 mb-6 pb-6 border-b border-outline-variant/20">· <span className="w-64 text-on-surface-variant">Tipo cable:</span> H07Z1-K (AS)</p>
            
            <p className="flex gap-2">· <span className="w-64">Intensidad admisible (Iz):</span> 296.0 A</p>
            <p className="flex gap-2">· <span className="w-64">Fc temperatura:</span> 0.87 (tabla B.52.14)</p>
            <p className="flex gap-2">· <span className="w-64">Fc agrupamiento:</span> 0.65 (tabla B.52.17)</p>
            <p className="flex gap-2">· <span className="w-64">Fc total:</span> 0.5655</p>
            <p className="flex gap-2 mb-6 pb-6 border-b border-outline-variant/20">· <span className="w-64 text-on-surface">Iz':</span> 296.0 A x 0.5655 = <strong className="text-on-surface">167.39 A</strong></p>
            
            <p className="flex gap-2">· <span className="w-64">Temperatura real conductor:</span> 62.31 °C</p>
            <p className="flex gap-2">· <span className="w-64">Conductividad:</span> 49.7 m/(Ω·mm²)</p>
            <p className="flex gap-2">· <span className="w-64">Impedancia:</span> 0.0011 + j0.0008 Ω</p>
            <p className="flex gap-2">· <span className="w-64">Energía admisible (cable) K²·S²:</span> 452.6 MA²s</p>
            <p className="flex gap-2 mb-6 pb-6 border-b border-outline-variant/20">· <span className="w-64">Pérdida de potencia:</span> 69.29 W</p>
            
            <p className="font-bold text-on-surface mb-2 tracking-widest text-xs uppercase font-sans">Comprobación IEC 60364-4-43:</p>
            <p className="text-primary-fixed-dim">· Ib ≤ In(Ir) ≤ Iz' ⇒ 144.34 ≤ 160.0 ≤ 167.39</p>
            <p className="text-primary-fixed-dim">· I2 ≤ 1.45xIz' ⇒ 232.0 A ≤ 242.7 A</p>
          </div>
        );
      case 'tabla':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto rounded-xl border border-outline-variant/30 shadow-sm bg-surface">
            <table className="w-full text-center text-sm">
                <thead>
                    <tr className="bg-surface-container border-b border-outline-variant/20 text-on-surface-variant font-bold text-[0.7rem] uppercase tracking-wider">
                        <th className="px-4 py-4">Sf (mm²)</th>
                        <th className="px-4 py-4">Iz' (A)</th>
                        <th className="px-4 py-4">Ib/Iz' (%)</th>
                        <th className="px-4 py-4">Caída (%)</th>
                        <th className="px-4 py-4">Ir (A)</th>
                        <th className="px-4 py-4">Icc (kA) [0.1s]</th>
                    </tr>
                </thead>
                <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/10">
                    {tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container/30 transition-colors font-mono">
                          <td className="px-4 py-3 font-bold text-primary">{row.s}</td>
                          <td className={`px-4 py-3 font-medium ${row.fail ? 'text-error' : 'text-primary'}`}>{row.iz}</td>
                          <td className={`px-4 py-3 font-medium ${row.fail ? 'text-error' : 'text-primary'}`}>{row.ibRatio}</td>
                          <td className={`px-4 py-3 font-medium ${row.fail ? 'text-error' : 'text-primary'}`}>{row.caida}</td>
                          <td className={`px-4 py-3 font-medium ${row.ir === intensidadNominal ? 'text-tertiary-fixed-dim font-bold' : 'text-on-surface-variant'}`}>{row.ir}</td>
                          <td className={`px-4 py-3 font-medium ${row.pass ? 'text-tertiary-fixed-dim' : 'text-primary-fixed-dim'}`}>{row.icc}</td>
                      </tr>
                    ))}
                </tbody>
            </table>
          </div>
        );
    }
  };

  const tabs: {id: 'condiciones' | 'receptor' | 'seccion' | 'tabla', label: string}[] = [
    { id: 'condiciones', label: 'Condiciones' },
    { id: 'receptor', label: 'Receptor' },
    { id: 'seccion', label: 'Sección cable' },
    { id: 'tabla', label: 'Tabla' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 lg:px-8 pb-32">
      {/* Header section similar to the original image header */}
      <div className="flex flex-col mb-8 gap-1 pl-4 border-l-[6px] border-primary rounded-[2px]">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface -tracking-[0.02em]">Project - 1</h2>
        <p className="text-on-surface-variant text-sm font-medium tracking-wide">Circuito de baja tensión  /  <span className="text-primary font-bold">Circuito BT</span></p>
      </div>
      
      {/* Main Form Container */}
      <div className="bg-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col min-h-[600px] xl:w-[94%] mx-auto">
        {/* Tabs Desktop view */}
        <div className="flex border-b border-outline-variant/20 overflow-x-auto scrollbar-hide bg-surface-container-lowest">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`py-4 px-8 text-[0.8rem] font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 relative ${
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
        <div className="p-6 md:p-10 flex-1 bg-surface-container-lowest">
           {renderTabContent()}
        </div>

        {/* Global Summary Bar at Bottom */}
        <div className="bg-surface-container-lowest px-6 py-4 border-t border-b border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex items-center gap-6 text-sm font-mono overflow-x-auto w-full pb-2">
             <span className="bg-surface px-4 py-1.5 rounded-lg border border-outline-variant/30 font-bold whitespace-nowrap text-on-surface-variant shadow-sm uppercase tracking-widest text-[#000] text-xs">Resumen</span>
             {tableRows.find(r => r.pass)?.s ? (
                <>
                   <span className="whitespace-nowrap text-on-surface opacity-90 font-mono text-[11px]"><strong className="font-sans font-semibold text-on-surface-variant mr-1">Sección:</strong> {tableRows.find(r => r.pass)?.s} mm²</span>
                   <span className="whitespace-nowrap text-on-surface opacity-90 font-mono text-[11px]"><strong className="font-sans font-semibold text-on-surface-variant mr-1">Ib:</strong> {ib.toFixed(2)} A</span>
                   <span className="whitespace-nowrap text-on-surface opacity-90 font-mono text-[11px]"><strong className="font-sans font-semibold text-on-surface-variant mr-1">Iz':</strong> {tableRows.find(r => r.pass)?.iz} A</span>
                   <span className="whitespace-nowrap text-on-surface opacity-90 font-mono text-[11px]"><strong className="font-sans font-semibold text-on-surface-variant mr-1">ΔU:</strong> {tableRows.find(r => r.pass)?.caida} %</span>
                </>
             ) : (
                <span className="text-error font-sans font-semibold text-xs">Ninguna sección cumple</span>
             )}
           </div>
        </div>

        {/* Action Buttons Row */}
        <div className="bg-surface-container-lowest p-6 flex flex-wrap gap-4 items-center justify-center lg:justify-start">
            <div className="flex bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden shrink-0 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all">
               <span className="px-4 py-2 border-r border-outline-variant/30 text-sm font-bold text-on-surface-variant bg-surface-container-low min-w-[80px] text-center">Circuito</span>
               <input 
                 type="text" 
                 className="px-4 py-2 bg-transparent text-sm font-bold text-on-surface outline-none w-32 focus:bg-primary/5 transition-colors" 
                 value={circuitoId}
                 onChange={(e) => setCircuitoId(e.target.value)}
               />
            </div>
            
            <button className="bg-[#4e6df5] hover:bg-[#3d5ce4] text-white font-bold text-sm px-8 py-2.5 rounded-lg transition-colors ml-auto lg:ml-0 shadow-sm active:scale-[0.98]">
              Borrar
            </button>
            <button 
              onClick={handleSave}
              className="bg-[#4e6df5] hover:bg-[#3d5ce4] text-white font-bold text-sm px-8 py-2.5 rounded-lg transition-colors shadow-sm active:scale-[0.98]"
            >
              Guardar
            </button>
            <a 
              href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#4e6df5] hover:bg-[#3d5ce4] text-white p-2.5 rounded-lg transition-colors shadow-sm cursor-pointer px-4 flex items-center justify-center"
              title="Normativa vigente del REBT"
            >
               <BookOpen size={18}/>
            </a>
            <button className="text-[#4e6df5] hover:bg-[#4e6df5]/10 p-2.5 rounded-full transition-colors ml-1 border-2 border-transparent hover:border-[#4e6df5]/20">
              <Info size={24} />
            </button>
        </div>

      </div>

      {/* Table List at Bottom */}
      <div className="mt-8 bg-surface rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden xl:w-[94%] mx-auto pb-10">
        <div className="p-4 md:p-6 border-b border-outline-variant/20 bg-surface flex justify-between items-center flex-wrap gap-4">
           <div className="flex items-center gap-6 text-sm">
              <label className="text-on-surface-variant font-bold text-xs uppercase tracking-wider flex items-center gap-3">
                Filas por página
                <div className="relative">
                  <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2 outline-none appearance-none font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-primary min-w-[70px]">
                    <option>10</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>
              </label>
              
              <div className="relative">
                <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border border-outline-variant/30 rounded-lg bg-surface-container-lowest text-sm outline-none focus:border-primary shadow-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-[2px] border-on-surface-variant rounded-full before:content-[''] before:absolute before:w-1.5 before:h-[2px] before:bg-on-surface-variant before:top-[100%] before:left-[80%] before:rotate-45 opacity-50"></span>
              </div>
           </div>
           
           <div className="text-xs text-on-surface-variant text-right font-medium">
             <span className="font-bold text-on-surface">1-3</span> de <span className="font-bold text-on-surface">3</span> registros<br/>
             Página <span className="font-bold text-on-surface">1</span> de 1
           </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm text-center font-mono whitespace-nowrap min-w-[1200px]">
            <thead className="bg-[#fcfdfd] text-[0.65rem] border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider font-extrabold pb-4 shadow-sm">
              <tr>
                <th className="py-4 px-4 align-middle">Abrir</th>
                <th className="py-4 px-4 text-left align-middle text-[#000]">Circuito</th>
                <th className="py-4 px-4 align-middle text-[#000]">Método</th>
                <th className="py-4 px-4 align-middle text-[#000]">Conductores</th>
                <th className="py-4 px-4 align-middle text-[#000]">Tensión</th>
                <th className="py-4 px-4 align-middle text-[#000]">Aisl.</th>
                <th className="py-4 px-4 align-middle text-[#000]">Sección <span className="lowercase font-sans font-medium text-on-surface-variant">(mm²)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">N°</th>
                <th className="py-4 px-4 align-middle text-[#000]">Carga</th>
                <th className="py-4 px-4 align-middle font-sans font-bold text-on-surface-variant lowercase">ud.</th>
                <th className="py-4 px-4 align-middle text-[#000]">Fu</th>
                <th className="py-4 px-4 align-middle text-[#000]">Fs</th>
                <th className="py-4 px-4 align-middle text-[#000]">Ib <span className="lowercase font-sans font-medium text-on-surface-variant">(A)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">In <span className="lowercase font-sans font-medium text-on-surface-variant">(A)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">x In</th>
                <th className="py-4 px-4 align-middle text-[#000]">Ir <span className="lowercase font-sans font-medium text-on-surface-variant">(A)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">Iz' <span className="lowercase font-sans font-medium text-on-surface-variant">(A)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">L <span className="lowercase font-sans font-medium text-on-surface-variant">(m)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">ΔU <span className="lowercase font-sans font-medium text-on-surface-variant">(%)</span></th>
                <th className="py-4 px-4 align-middle text-[#000]">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface bg-surface-container-lowest text-[13px] font-medium">
              <tr className="hover:bg-surface-container/40 transition-colors group">
                <td className="py-3 px-4"><button className="text-[#4e6df5] hover:text-[#3d5ce4] transition-colors p-1.5 rounded active:scale-95"><BookOpen size={18} strokeWidth={2.5}/></button></td>
                <td className="py-3 px-4 text-left font-sans font-bold text-on-surface/90">Circuito</td>
                <td className="py-3 px-4 text-on-surface-variant">B1</td>
                <td className="py-3 px-4 text-on-surface-variant">1F+N+CP</td>
                <td className="py-3 px-4 text-on-surface-variant">230,0</td>
                <td className="py-3 px-4 text-on-surface-variant">Z1</td>
                <td className="py-3 px-4 font-bold">3G(1x10)</td>
                <td className="py-3 px-4 text-on-surface-variant">1</td>
                <td className="py-3 px-4 text-on-surface-variant">4,0</td>
                <td className="py-3 px-4 font-sans text-xs text-on-surface-variant/70">kW</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface">21,74</td>
                <td className="py-3 px-4 text-on-surface-variant">25</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface-variant">25,0</td>
                <td className="py-3 px-4 text-on-surface-variant">32,23</td>
                <td className="py-3 px-4 text-on-surface-variant">10,0</td>
                <td className="py-3 px-4 text-on-surface">0,31</td>
                <td className="py-3 px-4"><button className="text-error/70 hover:text-error transition-colors active:scale-95"><span className="w-5 h-5 border-[1.5px] border-current rounded-full flex items-center justify-center font-bold pb-[1px]">-</span></button></td>
              </tr>
              <tr className="hover:bg-surface-container/40 transition-colors group">
                <td className="py-3 px-4"><button className="text-[#4e6df5] hover:text-[#3d5ce4] transition-colors p-1.5 rounded active:scale-95"><BookOpen size={18} strokeWidth={2.5}/></button></td>
                <td className="py-3 px-4 text-left font-sans font-bold text-on-surface/90">Circuito2</td>
                <td className="py-3 px-4 text-on-surface-variant">B1</td>
                <td className="py-3 px-4 text-on-surface-variant">3F+N</td>
                <td className="py-3 px-4 text-on-surface-variant">400,0</td>
                <td className="py-3 px-4 text-on-surface-variant">Z1</td>
                <td className="py-3 px-4 font-bold">4x(1x50)</td>
                <td className="py-3 px-4 text-on-surface-variant">2</td>
                <td className="py-3 px-4 text-on-surface-variant">4,0</td>
                <td className="py-3 px-4 font-sans text-xs text-on-surface-variant/70">kW</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface">14,43</td>
                <td className="py-3 px-4 text-on-surface-variant">63</td>
                <td className="py-3 px-4 text-on-surface-variant">1,0</td>
                <td className="py-3 px-4 text-on-surface-variant">63,0</td>
                <td className="py-3 px-4 text-on-surface-variant">75,78</td>
                <td className="py-3 px-4 text-on-surface-variant">10,0</td>
                <td className="py-3 px-4 text-on-surface">0,02</td>
                <td className="py-3 px-4"><button className="text-error/70 hover:text-error transition-colors active:scale-95"><span className="w-5 h-5 border-[1.5px] border-current rounded-full flex items-center justify-center font-bold pb-[1px]">-</span></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Docs Screen ---
function DocsScreen() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">Documentación</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Normativas, manuales y recursos de referencia para cálculos eléctricos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* REBT Card */}
        <a 
          href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col"
        >
          <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">
            REBT (R.D. 842/2002)
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
            Reglamento Electrotécnico para Baja Tensión (ITC-BT). Enlace a la Legislación Consolidada del BOE para asegurar la versión más reciente.
          </p>
          <div className="mt-4 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Ver texto consolidado</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>

        {/* Guia Tecnica Card */}
        <a 
          href="https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacioneselectricas/bajatension/Paginas/guia-tecnica-baja-tension.aspx" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col"
        >
          <div className="bg-tertiary/10 w-12 h-12 rounded-lg flex items-center justify-center text-tertiary mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">
            Guía Técnica de Aplicación
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
            Documento del Ministerio con aclaraciones del REBT. Se enlaza al repositorio oficial sujeto a revisiones periódicas.
          </p>
          <div className="mt-4 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Ver guías y revisiones</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>

        {/* Guia Caida de Tension Card */}
        <a 
          href="https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Documents/bt/guia_bt_anexo_2_sep03R1.pdf" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col"
        >
          <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
            <Calculator size={24} />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">
            Cálculo de Caídas de Tensión
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
            Anexo 2 de la Guía Técnica con directrices y tablas para los cálculos de caída de tensión. Puede requerir verificar actualizaciones.
          </p>
          <div className="mt-4 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Ver documento (PDF)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>

        {/* UNE HD 60364 Card */}
        <a 
          href="https://www.une.org/encuentra-tu-norma" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col"
        >
          <div className="bg-surface-container-highest w-12 h-12 rounded-lg flex items-center justify-center text-on-surface mb-4 group-hover:scale-110 transition-transform">
            <Info size={24} />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">
            Normas UNE (Referencia)
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
            Estándares internacionales armonizados (e.g., UNE-HD 60364-5-52) para dimensionamiento. Enlace al buscador oficial para encontrar las últimas ediciones.
          </p>
          <div className="mt-4 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Buscar en UNE</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>
      </div>
    </div>
  );
}
