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

export const APP_VERSION = '2.6.0';
export const APP_BUILD_CODE = '2026.11.03-R6';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '2.6.0',
    date: '03/11/2026',
    title: 'Sistema de Versionado Semántico, Control de Cambios y Lienzo CAD 100% Responsivo',
    summary:
      'Optimización completa del espacio de trabajo en el Estudio CAD para móviles y escritorio, junto con registro auditable de versiones e iteraciones.',
    isCurrent: true,
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
