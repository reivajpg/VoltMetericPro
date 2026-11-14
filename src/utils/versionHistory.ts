export type ChangeType = 'nuevo' | 'mejora' | 'fix';

export interface ChangeEntry {
  type: ChangeType;
  module: 'CAD Unifilar' | 'Offline / PWA' | 'Exportación MTD' | 'Cálculo REBT' | 'Documentación' | 'Sistema';
  text: string;
}

export interface VersionRelease {
  version: string;
  date: string;
  title: string;
  summary: string;
  isCurrent?: boolean;
  changes: ChangeEntry[];
}

export const APP_VERSION = '2.9.0';
export const APP_BUILD_CODE = '2026.11.12-R9';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '2.9.0',
    date: '12/11/2026',
    title: 'Validación de Selectividad Amperimétrica y Cronométrica (IGA ↔ PIA)',
    summary:
      'Nuevo motor de comprobación de coordinación de protecciones entre el IGA de cabecera y los magnetotérmicos/guardamotores de cada circuito según curvas de disparo (B, C, D, MA, S), con etiquetas de aviso automáticas y recomendaciones correctivas.',
    isCurrent: true,
    changes: [
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Función normativa de validación de selectividad amperimétrica (relación térmica In,IGA/In,PIA ≥ 1.6 y umbral magnético Imag,mín,IGA > Imag,máx,PIA) y selectividad cronométrica (jerarquía de curvas B < C < D/MA < S y retardo corto plazo Δt frente a Icc).'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Etiquetas visuales de aviso instantáneo en la pestaña Receptor, Memoria de Cálculo (Sección Cable), tabla de circuitos guardados y auditoría del Cuadro General cuando no se cumple la selectividad amperimétrica o cronométrica.'
      },
      {
        type: 'mejora',
        module: 'Cálculo REBT',
        text: 'Soporte para Curva S (Selectiva) y ajuste de retardo cronométrico en el IGA de cabecera (0 ms, 60 ms, 150 ms) con cálculo de corriente límite de selectividad Is (kA) y reflejo automático en el Esquema Unifilar CAD.'
      }
    ]
  },
  {
    version: '2.8.0',
    date: '05/11/2026',
    title: 'Asociación Normativa Líneas BT (UNE 60364-5-52), Cuadro General con Repartidor y Paso a Unifilar CAD',
    summary:
      'Interconexión completa en tiempo real entre Condiciones, Receptor, Sección Cable y Tabla según UNE-HD 60364-5-52, pestaña de configuración de Cuadro General (Cabecera IGA, Sobretensiones SPD, Grupos Diferenciales y recomendación automática de Repartidor/Embarrado) y sincronización directa con el Esquema Unifilar CAD.',
    isCurrent: false,
    changes: [
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Asociación dinámica integral entre «Condiciones», «Receptor», «Sección Cable» y «Tabla» según UNE-HD 60364-5-52: mapeo automático del método de instalación (A1, A2, B1, B2, C, D1, D2, E, F), resistividad térmica y profundidad en enterrados, cortocircuito adiabático (Icc y tiempo t), factores Fu, Fs, 3er armónico, conductores por fase y agrupamiento automático.'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Pestaña «Tabla» interactiva con doble modo de selección: cálculo automático de sección óptima (criterio térmico Iz\', caída de tensión ΔU% y cortocircuito Icc) o selección manual haciendo clic en cualquier fila de la tabla para forzar una sección.'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Pestaña «Sección Cable» 100 % reactiva en tiempo real: cálculo exacto de sección de fase, neutro y conductor de protección (CP/PE), temperatura real de operación del conductor, conductividad corregida, impedancia R+jX, pérdidas en vatios (Joule) y verificación IEC 60364-4-43 (Ib ≤ In ≤ Iz\' e I2 ≤ 1.45·Iz\').'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Nueva pestaña «Cuadro / Protecciones»: configuración de protección de cabecera (IGA con autodimensionado), protector de sobretensiones (SPD Tipo 1+2, Tipo 2 o Combi) y gestión de múltiples Grupos Diferenciales (ID1, ID2, ID3...) con asignación individual por circuito.'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Motor inteligente de recomendación de Bloque Repartidor / Embarrado modular (UNE-EN 61439-1) cuando se superan ≥ 4 circuitos en el cuadro, > 2 derivaciones por borne o múltiples conductores por fase, calculando el calibre comercial recomendado (63A a 400A).'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Botón directo «Pasar Cuadro al Esquema Unifilar CAD»: transfiere todos los circuitos guardados junto con el IGA de cabecera, SPD, Repartidor recomendado y Grupos Diferenciales (ID1..IDn) generando automáticamente la topología jerárquica completa en el Estudio CAD.'
      }
    ]
  },
  {
    version: '2.7.0',
    date: '03/11/2026',
    title: 'Simbología Técnica IEC 60617, Exportación Unificada y Presets REBT ITC-BT-25',
    summary:
      'Incorporación de simbología eléctrica vectorial de máxima precisión electrotécnica (UNE-EN 60617), botón único de exportación con selector de formatos, historial Deshacer/Rehacer (Undo/Redo), presets automáticos de circuitos estándar REBT y tabla resumen de cargas integrada.',
    isCurrent: false,
    changes: [
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Simbología vectorial normalizada UNE-EN 60617 de alta fidelidad: corte con disparador bimetálico térmico y magnético para magnetotérmicos (PIA/IGA), núcleo toroidal con lazo secundario y botón «T» (Test) para diferenciales (ID), resistencia no lineal de varistor con puesta a tierra para sobretensiones (SPD) y contactos de potencia para contactores y guardamotores.'
      },
      {
        type: 'nuevo',
        module: 'Exportación MTD',
        text: 'Botón de exportación unificado «Exportar Plano» con menú desplegable flotante con selección de formatos: Plano Técnico A3 en PDF (con cajetín e ITC-BT), AutoCAD (.DXF), Vectorial (.SVG) e Imagen rasterizada en Alta Resolución (.PNG).'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Selector de presets de circuitos normalizados REBT (ITC-BT-25: C1 a C12): inserción inmediata de iluminación, tomas generales, cocina/horno, lavadora/termo, tomas húmedas, climatización, domótica y recarga de vehículo eléctrico (ITC-BT-52) con calibres y secciones preconfiguradas.'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Sistema de historial Deshacer / Rehacer (Undo / Redo) con botones dedicados en la barra de comandos y atajos de teclado universales (Ctrl+Z / Ctrl+Y).'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Soporte para subcuadros secundarios y derivaciones en cascada en la librería de componentes.'
      },
      {
        type: 'mejora',
        module: 'CAD Unifilar',
        text: 'Cuadro resumen de potencias y balance de cargas integrado en el lienzo del plano A3 (potencia total instalada, factor de simultaneidad e intensidad prevista).'
      }
    ]
  },
  {
    version: '2.6.0',
    date: '03/11/2026',
    title: 'Sistema de Versionado Semántico, Control de Cambios y Lienzo CAD 100% Responsivo',
    summary:
      'Optimización completa del espacio de trabajo en el Estudio CAD para móviles y escritorio, junto con registro auditable de versiones e iteraciones.',
    isCurrent: false,
    changes: [
      {
        type: 'nuevo',
        module: 'Sistema',
        text: 'Incorporado gestor de control de versiones e historial interactivo de cambios (Changelog) accesible desde la cabecera principal y exportable a Markdown.'
      },
      {
        type: 'mejora',
        module: 'CAD Unifilar',
        text: 'Ocultación automática del menú lateral principal al entrar en Esquemas CAD para liberar el 100 % del ancho horizontal en móviles y modo escritorio.'
      },
      {
        type: 'mejora',
        module: 'CAD Unifilar',
        text: 'Transformación de los paneles de Librería IEC 60617 e Inspector/Cajetín en gavetas inferiores deslizables (Bottom Sheets) en pantallas móviles y paneles plegables en escritorio.'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Motor matemático de auto-encuadre inteligente (Bounding-Box Auto-Fit) que centra y escala todo el esquema unifilar automáticamente al abrir o girar el dispositivo.'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Soporte nativo de gestos táctiles en el lienzo: arrastre con 1 dedo, zoom con pellizco (pinch-to-zoom) con 2 dedos y barra flotante inferior de acciones rápidas.'
      }
    ]
  },
  {
    version: '2.5.0',
    date: '03/11/2026',
    title: 'Estudio de Esquemas Unifilares CAD Eléctrico (IEC 60617 / REBT)',
    summary:
      'Nuevo entorno vectorial interactivo para diseño y generación automática de esquemas unifilares normalizados.',
    changes: [
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Librería integrada de 18 símbolos vectoriales IEC 60617 (Acometida, Contador kWh, ICP, IGA, Sobretensiones SPD, Diferencial, PIA, Guardamotor, Embarrado, Tierra, Motores y VE).'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Generador automático de esquema unifilar en un clic a partir de la tabla de circuitos calculados en el proyecto (asignación automática de IGA, fases, secciones y caídas de tensión).'
      },
      {
        type: 'nuevo',
        module: 'CAD Unifilar',
        text: 'Trazado ortogonal de líneas entre bornes con marcas de fases (1F+N+PE, 3F+N+PE, PE) y Cajetín Técnico Normalizado UNE / REBT editable.'
      },
      {
        type: 'nuevo',
        module: 'Exportación MTD',
        text: 'Triple exportación técnica del plano unifilar: formato nativo AutoCAD (.DXF por capas), Plano Técnico A3 apaisado (.PDF) y gráfico vectorial (.SVG).'
      }
    ]
  },
  {
    version: '2.4.0',
    date: '02/11/2026',
    title: 'Exportación Profesional de Memoria Técnica (MTD) y Modo Obra Offline (PWA)',
    summary:
      'Capacidades completas de trabajo sin cobertura en obra, persistencia local de proyectos y generación de informes oficiales.',
    changes: [
      {
        type: 'nuevo',
        module: 'Exportación MTD',
        text: 'Generador de Memoria Técnica de Diseño (MTD) en PDF con datos del titular, instalador autorizado, cuadro resumen normativo y verificación REBT.'
      },
      {
        type: 'nuevo',
        module: 'Exportación MTD',
        text: 'Exportación de tablas de circuitos a Excel/CSV compatible con hojas de cálculo y copia de seguridad completa en archivo JSON importable.'
      },
      {
        type: 'nuevo',
        module: 'Offline / PWA',
        text: 'Service Worker con precaché completo (incluyendo documentos PDF normativos de hasta 6 MB), instalador nativo en Android/iOS/PC e indicador de Modo Obra sin conexión.'
      },
      {
        type: 'mejora',
        module: 'Cálculo REBT',
        text: 'Persistencia automática en almacenamiento local (localStorage) de todos los circuitos calculados en el proyecto.'
      }
    ]
  },
  {
    version: '2.3.0',
    date: '02/11/2026',
    title: 'Visor Integrado de Documentación Normativa PDF y Metadatos Android',
    summary:
      'Restauración y mejora del visor PDF integrado con renderizado por páginas en Canvas y documentación técnica incluida.',
    changes: [
      {
        type: 'fix',
        module: 'Documentación',
        text: 'Nuevo motor de visualización PDF integrado basado en PDF.js con renderizado directo en Canvas, controles de página, zoom y respaldo para navegadores móviles.'
      },
      {
        type: 'nuevo',
        module: 'Documentación',
        text: 'Inclusión local de los documentos oficiales del REBT (R.D. 842/2002), Guía Técnica de Aplicación y Anexo 2 de Cálculo de Caídas de Tensión.'
      },
      {
        type: 'mejora',
        module: 'Sistema',
        text: 'Actualización de metadatos y manifiesto de la aplicación para empaquetado e instalación en dispositivos Android.'
      }
    ]
  },
  {
    version: '2.0.0',
    date: '01/11/2026',
    title: 'Suite Completa de Calculadoras REBT y Dimensionado de Líneas BT',
    summary:
      'Motor de cálculo térmico, caída de tensión, canalizaciones y protecciones según UNE-HD 60364-5-52.',
    changes: [
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Calculadora avanzada de Circuito Completo BT con tablas UNE-HD 60364-5-52, factores de corrección por temperatura, agrupamiento y resistividad térmica.'
      },
      {
        type: 'nuevo',
        module: 'Cálculo REBT',
        text: 'Módulos especializados de Potencia Activa/Aparente, Caída de Tensión (ITC-BT-19), Dimensionado de Canalizaciones y Tubos (ITC-BT-21), Protecciones (ITC-BT-22/24) y Aislamiento.'
      }
    ]
  }
];
