export type IGACurveType = 'B' | 'C' | 'D' | 'S';
export type PIACurveType = 'B' | 'C' | 'D' | 'MA' | 'gG';

export interface SelectivityValidationInput {
  igaIn: number;
  igaCurve: IGACurveType;
  igaTimeDelayMs?: number; // 0 = Instantáneo (magnetotérmico modular), 60 / 150 = Selectivo con retardo Δt
  piaIn: number;
  piaCurve: string; // 'B' | 'C' | 'D' | 'MA' | 'gG'
  piaType?: string; // 'Interruptor automático' | 'Fusible gG' | 'Guardamotor'
  iccKa?: number; // Cortocircuito previsto en kA (por defecto 6.0 kA)
}

export interface SelectivityValidationResult {
  status: 'total' | 'partial' | 'fail';
  isFullyCompliant: boolean;
  amperimetricOk: boolean;
  chronometricOk: boolean;
  curveHierarchyOk: boolean;
  ratioIn: number;
  iMagMinIga: number;
  iMagMaxPia: number;
  limitCurrentKa: number;
  badgeText: string;
  shortReason: string;
  recommendation: string;
  failedTypes: ('amperimétrica' | 'cronométrica')[];
}

function getCurveBounds(curve: string, isFusible: boolean): { minMult: number; maxMult: number; rank: number } {
  if (isFusible || curve === 'gG') {
    return { minMult: 5, maxMult: 6.5, rank: 2 };
  }
  switch (curve.toUpperCase()) {
    case 'B':
      return { minMult: 3, maxMult: 5, rank: 1 };
    case 'C':
      return { minMult: 5, maxMult: 10, rank: 2 };
    case 'D':
      return { minMult: 10, maxMult: 20, rank: 3 };
    case 'MA':
      return { minMult: 12, maxMult: 14, rank: 3 };
    case 'S':
      return { minMult: 8, maxMult: 12, rank: 4 };
    default:
      return { minMult: 5, maxMult: 10, rank: 2 };
  }
}

/**
 * Valida la selectividad Amperimétrica y Cronométrica entre Cabecera (IGA) y Circuito (PIA)
 * según criterios UNE-EN 60898-1, UNE-EN 60947-2 e IEC 60364-5-53.
 */
export function validateProtectionSelectivity(
  input: SelectivityValidationInput
): SelectivityValidationResult {
  const igaIn = Math.max(1, input.igaIn || 63);
  const piaIn = Math.max(1, input.piaIn || 16);
  const iccKa = Math.max(0.1, input.iccKa ?? 6.0);
  const iccAmps = iccKa * 1000;

  const isPiaFusible = input.piaType === 'Fusible gG' || input.piaCurve === 'gG';
  const igaDelayMs =
    input.igaCurve === 'S'
      ? Math.max(60, input.igaTimeDelayMs || 60)
      : input.igaTimeDelayMs || 0;

  const igaBounds = getCurveBounds(input.igaCurve || 'C', false);
  const piaBounds = getCurveBounds(input.piaCurve || 'C', isPiaFusible);

  const ratioIn = +(igaIn / piaIn).toFixed(2);
  const iMagMinIga = Math.round(igaIn * igaBounds.minMult);
  const iMagMaxPia = Math.round(piaIn * piaBounds.maxMult);

  // 1. Validación Amperimétrica:
  // - Zona térmica (sobrecarga): In_IGA / In_PIA >= 1.6 (evita solapamiento 1.13..1.45 x In)
  // - Zona magnética (si IGA es instantáneo sin retardo Δt): Imag_min_IGA > Imag_max_PIA
  const thermalRatioOk = igaIn > piaIn && ratioIn >= 1.6;
  const magneticAmperimetricOk = igaDelayMs > 0 ? true : iMagMinIga > iMagMaxPia;
  const amperimetricOk = thermalRatioOk && magneticAmperimetricOk;

  // 2. Validación Cronométrica / Jerarquía de curvas:
  // - Jerarquía de curvas: la curva del IGA debe ser igual o más lenta que la del PIA (B < C < D/MA < S)
  // - Escalón de tiempo Δt: si Icc supera el umbral magnético del IGA, se requiere retardo cronométrico (Δt >= 60ms / Curva S)
  const curveHierarchyOk = igaBounds.rank >= piaBounds.rank;
  const chronometricShortCircuitOk =
    igaDelayMs >= 50 || iccAmps <= iMagMinIga;
  const chronometricOk = curveHierarchyOk && chronometricShortCircuitOk;

  const limitCurrentKa = amperimetricOk
    ? igaDelayMs >= 50
      ? iccKa
      : +(iMagMinIga / 1000).toFixed(2)
    : 0;

  const failedTypes: ('amperimétrica' | 'cronométrica')[] = [];
  if (!amperimetricOk) failedTypes.push('amperimétrica');
  if (!chronometricOk) failedTypes.push('cronométrica');

  let status: 'total' | 'partial' | 'fail' = 'total';
  if (!amperimetricOk && !chronometricOk) {
    status = 'fail';
  } else if (!amperimetricOk) {
    status = 'fail';
  } else if (!chronometricOk) {
    status = 'partial';
  }

  let badgeText = 'Selectividad Total OK';
  if (failedTypes.length === 2) {
    badgeText = 'Aviso: Sin Sel. Amperimétrica ni Cronométrica';
  } else if (failedTypes[0] === 'amperimétrica') {
    badgeText = 'Aviso: Fallo Sel. Amperimétrica';
  } else if (failedTypes[0] === 'cronométrica') {
    badgeText = 'Aviso: Fallo Sel. Cronométrica';
  }

  const reasonParts: string[] = [];
  if (!thermalRatioOk) {
    reasonParts.push(
      `Relación de calibres insuficiente (${igaIn}A / ${piaIn}A = ${ratioIn} < 1.60 exigido en zona térmica).`
    );
  }
  if (thermalRatioOk && !magneticAmperimetricOk) {
    reasonParts.push(
      `Solapamiento magnético: Imag,mín IGA (${iMagMinIga} A) ≤ Imag,máx PIA (${iMagMaxPia} A).`
    );
  }
  if (!curveHierarchyOk) {
    reasonParts.push(
      `Inversión de curvas: IGA Curva ${input.igaCurve} dispara antes que PIA Curva ${input.piaCurve}.`
    );
  } else if (!chronometricShortCircuitOk) {
    reasonParts.push(
      `Sin retardo Δt en IGA para Icc=${iccKa.toFixed(1)}kA > Is=${limitCurrentKa}kA (disparo instantáneo simultáneo).`
    );
  }

  const shortReason =
    reasonParts.length > 0
      ? reasonParts.join(' ')
      : `Coordinación verificada: In(IGA)/In(PIA)=${ratioIn} ≥ 1.6 y curva ${input.igaCurve}${
          igaDelayMs > 0 ? ` (Δt=${igaDelayMs}ms)` : ''
        } selectiva frente a PIA Curva ${input.piaCurve}.`;

  // Actionable recommendation
  let recommendation = 'Coordinación correcta según UNE-EN 60898 / 60947-2.';
  if (!thermalRatioOk) {
    const minRecommendedIga = Math.ceil(piaIn * 1.6);
    recommendation = `Aumentar calibre del IGA (≥ ${minRecommendedIga} A) o reducir el calibre In del PIA.`;
  } else if (!curveHierarchyOk || !magneticAmperimetricOk) {
    recommendation = `Cambiar IGA a Curva D / S (Selectivo) o usar PIA Curva B/C para elevar Imag,mín(IGA) por encima de ${iMagMaxPia} A.`;
  } else if (!chronometricShortCircuitOk) {
    recommendation = `Para selectividad total ante Icc=${iccKa.toFixed(
      1
    )}kA, habilitar retardo cronométrico en IGA (Curva S / Δt ≥ 60 ms).`;
  }

  return {
    status,
    isFullyCompliant: amperimetricOk && chronometricOk,
    amperimetricOk,
    chronometricOk,
    curveHierarchyOk,
    ratioIn,
    iMagMinIga,
    iMagMaxPia,
    limitCurrentKa,
    badgeText,
    shortReason,
    recommendation,
    failedTypes
  };
}
