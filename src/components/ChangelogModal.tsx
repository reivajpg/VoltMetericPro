import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Download,
  CheckCircle2,
  Sparkles,
  Wrench,
  Tag,
  Calendar,
  Layers
} from 'lucide-react';
import {
  APP_VERSION,
  APP_BUILD_CODE,
  VERSION_HISTORY,
  ChangeEntry
} from '../utils/versionHistory';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function ChangelogModal({ isOpen, onClose, onShowToast }: ChangelogModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const modules = ['all', 'CAD Unifilar', 'Offline / PWA', 'Exportación MTD', 'Cálculo REBT', 'Documentación', 'Sistema'];

  const filteredReleases = useMemo(() => {
    if (selectedModule === 'all') return VERSION_HISTORY;
    return VERSION_HISTORY.map((rel) => ({
      ...rel,
      changes: rel.changes.filter((c) => c.module === selectedModule)
    })).filter((rel) => rel.changes.length > 0);
  }, [selectedModule]);

  if (!isOpen) return null;

  const handleDownloadChangelog = () => {
    const mdLines: string[] = [
      `# VoltMetric Pro — Registro Oficial de Versiones y Control de Cambios`,
      `Versión Activa: v${APP_VERSION} (Build ${APP_BUILD_CODE})`,
      ``
    ];

    VERSION_HISTORY.forEach((rel) => {
      mdLines.push(`## [v${rel.version}] — ${rel.date} · ${rel.title}`);
      mdLines.push(`${rel.summary}`);
      mdLines.push(``);
      rel.changes.forEach((c) => {
        const tag = c.type === 'nuevo' ? 'NUEVO' : c.type === 'mejora' ? 'MEJORA' : 'FIX';
        mdLines.push(`- **[${tag} · ${c.module}]** ${c.text}`);
      });
      mdLines.push(``);
    });

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoltMetric_Pro_CHANGELOG_v${APP_VERSION}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Control de cambios exportado (v${APP_VERSION})`);
  };

  const renderBadge = (type: ChangeEntry['type']) => {
    switch (type) {
      case 'nuevo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
            <Sparkles size={10} /> Nuevo
          </span>
        );
      case 'mejora':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25 shrink-0">
            <Layers size={10} /> Mejora
          </span>
        );
      case 'fix':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 shrink-0">
            <Wrench size={10} /> Fix
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
              <History size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-base sm:text-lg text-on-surface tracking-tight">
                  Control de Cambios y Versiones
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-primary text-white font-mono font-bold text-xs tabular-nums">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono tabular-nums">
                Build {APP_BUILD_CODE} · Registro acumulativo de iteraciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadChangelog}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-on-surface transition-colors cursor-pointer"
              title="Descargar archivo CHANGELOG.md"
            >
              <Download size={14} className="text-primary" />
              <span>Exportar .MD</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Module Filter Pills */}
        <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedModule === mod
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {mod === 'all' ? 'Todos los módulos' : mod}
            </button>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {filteredReleases.map((release) => (
            <div
              key={release.version}
              className={`rounded-xl border p-4 sm:p-5 transition-all ${
                release.isCurrent
                  ? 'bg-surface-container-low border-primary/40 shadow-xs'
                  : 'bg-surface-container-lowest border-outline-variant/25'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs tabular-nums flex items-center gap-1.5 ${
                      release.isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <Tag size={12} />v{release.version}
                  </span>
                  {release.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Versión Actual
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1 tabular-nums">
                  <Calendar size={12} /> {release.date}
                </span>
              </div>

              <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface mb-1">
                {release.title}
              </h3>
              <p className="text-xs text-on-surface-variant mb-3.5 leading-relaxed">
                {release.summary}
              </p>

              <div className="space-y-2 border-t border-outline-variant/15 pt-3">
                {release.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-on-surface leading-relaxed"
                  >
                    {renderBadge(change.type)}
                    <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono font-bold text-[10px] text-on-surface-variant shrink-0">
                      {change.module}
                    </span>
                    <span className="flex-1 text-on-surface">{change.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 bg-surface-container border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
          <span>Política activa: incremento automático de versión en cada iteración.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-white font-bold text-xs cursor-pointer hover:opacity-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
