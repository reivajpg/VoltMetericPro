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
  Gauge
} from 'lucide-react';

// --- Types ---
type Screen = 'dashboard' | 'power' | 'voltage_drop' | 'protections' | 'tubing';
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
          {currentScreen === 'tubing' && <TubingScreen />}
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
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'power', icon: Calculator, label: 'Power Calc' },
    { id: 'voltage_drop', icon: Cpu, label: 'Voltage Drop' },
    { id: 'tubing', icon: BookOpen, label: 'Tubos' },
    { id: 'protections', icon: Shield, label: 'Protecciones' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container border-r border-outline-variant/20 h-[calc(100vh-65px)] sticky top-[65px]">
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
      <nav className="flex-1 flex flex-col px-4 gap-1">
        {navItems.map((item) => {
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
        })}
      </nav>
    </aside>
  );
}

function BottomNav({ currentScreen, setCurrentScreen }: { currentScreen: Screen, setCurrentScreen: (s: Screen) => void }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'power', icon: Calculator, label: 'Calculadoras' },
    { id: 'protections', icon: Shield, label: 'Protecciones' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface shadow-[0_-4px_24px_rgba(17,29,35,0.06)] z-50">
      <div className="bg-surface-container-highest h-[2px] w-full absolute top-0 left-0"></div>
      <div className="flex justify-around items-center px-2 pb-4 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // For demo, map 'power' and 'voltage_drop' to the 'Calculadoras' tab
          const isActive = item.id === 'power' ? (currentScreen === 'power' || currentScreen === 'voltage_drop') : currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.id === 'dashboard' || item.id === 'power' ? setCurrentScreen(item.id as Screen) : null}
              className={`flex flex-col items-center justify-center px-3 py-1.5 transition-all active:scale-95 duration-150 rounded-xl ${
                isActive 
                  ? 'bg-primary-container text-white' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="font-label text-[10px] font-semibold uppercase tracking-widest">{item.label}</span>
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
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-lg">
            <p className="font-label text-xs uppercase opacity-70 mb-1">Estado del Sistema</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-tertiary-fixed rounded-full animate-pulse"></span>
              <span className="font-bold text-sm">Normativa Vigente 2024</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Zap size={200} fill="currentColor" />
        </div>
      </section>

      {/* Main Calculation Tools (Bento Grid) */}
      <h3 className="font-headline text-lg font-bold mb-4 px-1 text-on-surface">Herramientas Principales</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
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
      </div>

      {/* Recent Calculations */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-headline text-lg font-bold text-on-surface">Cálculos Recientes</h3>
        <button className="text-sm font-bold text-primary hover:underline">Ver todo</button>
      </div>
      <div className="bg-surface-container rounded-xl overflow-hidden mb-8 border border-outline-variant/20">
        <table className="w-full text-left border-collapse">
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
        <QuickLink icon={BookOpen} label="Tubos" onClick={() => onNavigate('tubing')} />
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
  }, [mode, phase]);

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
  const [power, setPower] = useState('3.5');
  const [distance, setDistance] = useState('45');
  const [section, setSection] = useState('4');

  // Simplified calculation
  const p = parseFloat(power) || 0;
  const l = parseFloat(distance) || 0;
  const s = parseFloat(section) || 1;
  const k = phase === 'mono' ? 2 : 1;
  const rho = material === 'cu' ? 0.0179 : 0.0286;
  const v = phase === 'mono' ? 230 : 400;

  // ΔU = K * rho * L * P(W) / (S * V)
  const deltaU_volts = (k * rho * l * (p * 1000)) / (s * v);
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
        <p className="text-on-surface-variant max-w-2xl mt-2 text-sm md:text-base">Dimensionamiento técnico según normativa REBT para instalaciones de baja tensión.</p>
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

              <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4">
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
                <h4 className="font-bold text-sm mb-1 text-on-surface">Cálculo {phase === 'mono' ? 'Monofásico' : 'Trifásico'}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Considera retorno por neutro. Fórmula: ΔU = {k} · L · P / (κ · S · U)</p>
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
                  <td className="p-4 font-semibold text-on-surface-variant">Resistividad (ρ)</td>
                  <td className="p-4 text-right font-bold text-on-surface">{rho} Ω·mm²/m</td>
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
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-outline-variant/15">
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
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-6">
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
        </aside>
      </div>
    </div>
  );
}

// --- Tubing Screen ---

function TubingScreen() {
  const [section, setSection] = useState('1.5');
  const [conductors, setConductors] = useState('3');

  const sections = ['1.5', '2.5', '4', '6', '10', '16', '25', '35', '50'];
  
  // Basic calculation mapping (simplified standard values for illustrative purposes based on ITC-BT-21)
  const getTubeDiameter = (sec: string, conds: string) => {
    const s = parseFloat(sec);
    const c = parseInt(conds);
    if (s <= 1.5) return c <= 3 ? 16 : 20;
    if (s <= 2.5) return c <= 3 ? 16 : 20;
    if (s <= 4) return c <= 3 ? 20 : 25;
    if (s <= 6) return c <= 3 ? 20 : 25;
    if (s <= 10) return c <= 3 ? 25 : 32;
    if (s <= 16) return c <= 3 ? 25 : 32;
    if (s <= 25) return c <= 3 ? 32 : 40;
    if (s <= 35) return c <= 3 ? 40 : 50;
    return c <= 3 ? 50 : 63;
  };

  const diameter = getTubeDiameter(section, conductors);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span className="font-medium">Calculadoras</span>
          <span className="text-xs">/</span>
          <span className="font-bold text-primary">Canalizaciones</span>
        </div>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Diámetro de Tubos</h2>
        <p className="text-on-surface-variant max-w-2xl mt-2 text-base">Cálculo del diámetro exterior mínimo según ITC-BT-21 para tubos en derivaciones y circuitos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/15 space-y-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sección del Conductor</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Número de Conductores</label>
              <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-2 rounded-xl">
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

          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
            
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2 relative z-10">Tubo Recomendado</h3>
            <div className="relative z-10 flex flex-col items-center justify-center my-6">
              <div className="w-40 h-40 rounded-full border-8 border-primary flex items-center justify-center bg-white shadow-inner relative">
                <div className="absolute inset-0 rounded-full border border-primary/20 m-2"></div>
                <div className="text-center">
                  <span className="text-5xl font-black text-primary tracking-tighter">Ø{diameter}</span>
                  <span className="block text-sm font-bold text-on-surface-variant mt-1">mm</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-on-surface-variant font-medium mt-4 relative z-10">
              Diámetro exterior mínimo para {conductors} conductores de {section} mm².
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
