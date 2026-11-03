import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'topbar' | 'card' | 'sidebar';
  onInstalledToast?: (msg: string) => void;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'topbar', onInstalledToast }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success && onInstalledToast) {
        onInstalledToast('¡VoltMetric Pro instalada correctamente en tu dispositivo!');
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-bold">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>App Instalada · Offline Listo</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'topbar' ? (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Instalar VoltMetric Pro en Android / Ordenador para trabajar sin conexión en obra"
        >
          <Smartphone size={15} />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">Instalar</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Download size={16} />
          <span>Instalar en Dispositivo / Android</span>
        </button>
      )}

      {/* Guide Modal for Manual or iOS installation */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-6 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Instalar VoltMetric Pro</h3>
                <p className="text-xs text-on-surface-variant font-medium">Uso garantizado sin conexión a internet en obra</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-4 my-4 bg-surface-container-low p-4 rounded-xl text-xs text-on-surface font-medium leading-relaxed">
                <p className="font-bold text-sm text-primary flex items-center gap-2">
                  <Share size={16} /> Instalación en Safari (iPhone / iPad):
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-1 text-on-surface-variant">
                  <li>Toca el botón <strong>Compartir</strong> <Share size={13} className="inline mx-1" /> en la barra inferior de Safari.</li>
                  <li>Desplaza hacia abajo y selecciona <strong>Añadir a pantalla de inicio</strong> <PlusSquare size={13} className="inline mx-1" />.</li>
                  <li>Pulsa <strong>Añadir</strong> en la esquina superior derecha.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4 my-4 bg-surface-container-low p-4 rounded-xl text-xs text-on-surface font-medium leading-relaxed">
                <p className="font-bold text-sm text-primary flex items-center gap-2">
                  <Smartphone size={16} /> Instalación en Android / Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-1 text-on-surface-variant">
                  <li>Toca el menú de <strong>tres puntos (⋮)</strong> en la esquina superior del navegador.</li>
                  <li>Pulsa sobre <strong>Instalar aplicación</strong> o <strong>Añadir a la pantalla de inicio</strong>.</li>
                  <li>Confirma la instalación para tener acceso instantáneo con icono nativo en tu cajón de apps.</li>
                </ol>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 mb-5 text-[11px] text-on-surface-variant flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
              <p>
                Una vez instalada, todos los cálculos de líneas, caídas de tensión, protecciones y documentación REBT se abren al instante sin gastar datos y sin cobertura móvil.
              </p>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
