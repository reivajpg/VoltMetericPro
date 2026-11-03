# Plan de Implementación v2.7.0: Simbología Técnica IEC 60617, Botón Único de Exportación y Mejoras Avanzadas en CAD Eléctrico

Este plan aborda la solicitud del usuario para modernizar y elevar la calidad técnica del esquema unifilar, consolidar los botones de descarga en un selector único desplegable, añadir mejoras clave de flujo de trabajo (presets REBT C1-C12, Undo/Redo, subcuadros y tabla de cargas) e incrementar la versión de la app a **v2.7.0** con su correspondiente control de cambios.

---

## 1. Control de Versiones e Iteración (v2.7.0)

- **Actualizar `package.json`**: Incrementar versión de `2.6.0` a `2.7.0`.
- **Actualizar `src/utils/versionHistory.ts`**:
  - `APP_VERSION = '2.7.0'`
  - `APP_BUILD_CODE = '2026.11.03-R7'`
  - Registrar entrada de versión 2.7.0 con resumen detallado y cambios clasificados (`nuevo`, `mejora`, `fix`) en módulos de CAD Unifilar, Exportación y Simbología.

---

## 2. Simbología Vectorial IEC 60617 / UNE-EN 60617 de Alta Fidelidad

Refactorizar y expandir la función `IECSymbolGraphic` en `src/components/ElectricalCADScreen.tsx` para ajustarse rigurosamente a la norma electrotécnica:

1. **Magnetotérmico (PIA / MCB / IGA)**:
   - Símbolo normalizado de corte/contacto con actuador manual.
   - Símbolo de disparo térmico (lámina bimetálica / rectángulo abierto).
   - Símbolo de disparo electromagnético (semicírculo o bobina de disparo instantáneo).
   - Distinción visual para interruptores generales IGA (seccionamiento reforzado) y polos (1P+N, 2P, 3P, 4P).
2. **Interruptor Diferencial (ID / RCCB)**:
   - Núcleo toroidal de detección diferencial (toroide de ferrita circular envolviendo las líneas activas).
   - Devanado secundario con relé de disparo directo.
   - Pulsador de comprobación periódica con la letra **«T»** (Test).
3. **Protector de Sobretensiones (SPD / DPS)**:
   - Símbolo normalizado de varistor de óxido metálico (resistencia no lineal con quiebre oblicuo con pestaña).
   - Indicador de estado de cartucho (verde/rojo) y borne derivador de puesta a tierra con descarga a masa.
4. **Guardamotor Magnetotérmico (QM)**:
   - Interruptor con doble disparador térmico ajustable (regulación de intensidad) y magnético para protección contra sobrecargas y cortocircuitos de motores asíncronos.
5. **Contactor de Maniobra (KM)**:
   - Bobina de accionamiento (rectángulo con terminales A1-A2) y contactos de potencia normalmente abiertos con actuador mecánico común.
6. **Receptores y Cargas según ITC-BT-25**:
   - Alumbrado (cruz en círculo IEC).
   - Bases de enchufe (arco semicircular con vástago y conexión a tierra).
   - Climatización/HVAC (icono térmico normalizado con compresor).
   - Motor trifásico (estator circular con «M» y «3~» e identificación de bornes U-V-W).
   - Punto de Recarga de Vehículo Eléctrico (borne ITC-BT-52 con conector Tipo 2 / Mennekes).
   - Subcuadro secundario en cascada (icono de envolvente y bornes de derivación).

---

## 3. Botón Único de Exportación con Menú Desplegable

Reemplazar los 3 botones separados de la barra de herramientas (`DXF`, `SVG`, `PDF A3`) por un único botón principal elegante:

- **Componente de Menú**: Botón `Exportar Plano` con icono de descarga, flecha hacia abajo (`ChevronDown`) y menú desplegable interactivo flotante (con cierre al hacer clic fuera o seleccionar).
- **Opciones de Formato**:
  1. **Plano Técnico A3 en PDF**: Formato oficial con cajetín REBT homologado, marco normativo, escala y datos del instalador autorizado.
  2. **AutoCAD DXF (.dxf)**: Archivo vectorial CAD listo para abrir en AutoCAD, LibreCAD, DraftSight o QCad.
  3. **Vectorial SVG (.svg)**: Gráfico vectorial escalable transparente ideal para maquetación, presentaciones e impresión directa.
  4. **Imagen PNG en Alta Resolución**: Renderizado rasterizado nítido para adjuntar rápidamente en informes o compartir por WhatsApp con clientes y operarios en obra.
- **Optimización Responsive**: En pantallas móviles, el menú desplegable se adapta como menú contextual limpio o popover táctil para no saturar la pantalla.

---

## 4. Mejoras Avanzadas en el Estudio Unifilar

1. **Presets Rápidos de Circuitos REBT (ITC-BT-25: C1 a C12)**:
   - Añadir selector rápido de circuitos estándar de vivienda y local:
     - **C1**: Iluminación (10A, 1.5 mm²)
     - **C2**: Tomas generales y frigorífico (16A, 2.5 mm²)
     - **C3**: Cocina y horno (25A, 6 mm²)
     - **C4**: Lavadora, lavavajillas y termo (20A, 4 mm²)
     - **C5**: Tomas de baños y cocina (16A, 2.5 mm²)
     - **C6 a C11**: Circuitos de electrificación elevada (calefacción, aire acondicionado, secadora, domótica)
     - **C12**: Recarga de vehículo eléctrico (ITC-BT-52, 32A/16A)
   - Al pulsar un preset, se inserta automáticamente en la rama adecuada con su magneto, cable y símbolo de carga ya configurados.
2. **Historial de Acciones (Deshacer / Rehacer - Undo / Redo)**:
   - Implementar pila de estados de nodos y conexiones (`history`, `future`).
   - Botones visuales de flecha deshacer (`Undo2`) y rehacer (`Redo2`) en la barra de comandos.
   - Atajos de teclado universales: `Ctrl+Z` (Deshacer) y `Ctrl+Y` / `Ctrl+Shift+Z` (Rehacer).
3. **Subcuadros Eléctricos en Cascada**:
   - Nuevo tipo de nodo `subpanel` («Subcuadro Secundario / Planta»).
   - Permite derivar líneas desde el cuadro principal a cuadros secundarios con sus correspondientes protecciones de cabecera.
4. **Cuadro Resumen de Cargas y Potencias en el Plano**:
   - Bloque informativo vectorial en la parte inferior del plano A3 (junto al cajetín).
   - Muestra la potencia total instalada (kW), potencia prevista simultánea, factor de simultaneidad e intensidad total de cálculo de la acometida.

---

## 5. Plan de Verificación

1. **Compilación y Linteo**:
   - Ejecutar `compile_applet` y verificar 0 errores TypeScript/Vite.
   - Ejecutar `lint_applet` para confirmar la coherencia sintáctica.
2. **Pruebas Funcionales**:
   - Probar el nuevo botón único de exportación y sus 4 formatos (PDF A3, DXF, SVG, PNG).
   - Probar la inserción de circuitos estándar REBT (C1 a C12) y comprobar que sus calibres y secciones se configuren fielmente al REBT.
   - Probar la pila de Deshacer / Rehacer (eliminar componentes, moverlos y restaurarlos con Ctrl+Z).
   - Verificar la representación visual de la nueva simbología IEC 60617 (bimetal, bobina magnética, toroide diferencial y varistor).
   - Confirmar el registro de la versión 2.7.0 en el changelog de la aplicación.
