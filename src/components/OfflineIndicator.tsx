import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, HardDriveDownload } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed top-16 right-4 z-[90] flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-bold text-xs animate-in fade-in slide-in-from-top-2 border border-emerald-400/40">
        <Wifi size={16} className="shrink-0" />
        <span>Conexión restablecida · Datos sincronizados localmente</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-[90] flex items-center gap-2.5 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl font-bold text-xs border border-amber-500/40 backdrop-blur-md max-w-sm">
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-amber-400 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Modo Obra / Offline Activo
        </span>
        <span className="text-slate-300 font-medium text-[11px] leading-tight mt-0.5">
          Todas las calculadoras y guardado funcionan sin internet.
        </span>
      </div>
    </div>
  );
};
