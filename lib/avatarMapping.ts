/**
 * Traduce medidas corporales reales (cm) a valores de Shape Key / morph
 * target (0–1) para el modelo base femenino esculpido en Blender
 * (`avatar_female.glb`).
 *
 * ── Cómo se obtuvieron estos números ──
 * BASIS_CM: lo que mide cada zona cuando TODOS los Shape Keys están en 0
 * (la malla tal cual se esculpió, antes de cualquier morph). Se calcularon
 * analizando la geometría real del archivo .glb (cortes transversales del
 * torso) y calibrando la escala con un dato confirmado directamente en
 * Blender (altura total del mesh: 285 cm — este modelo base viene
 * modelado a una escala mayor que una persona real; es una particularidad
 * del asset, no un error).
 *
 * EXTREME_CM: lo que representa cada medida cuando su Shape Key está al
 * 100% (Value = 1.0). Se decidieron a ojo en Blender mientras se esculpía
 * cada extremo, viendo qué tan creíble se veía.
 *
 * ── Peso (kg) como respaldo, no como override ──
 * Las medidas de cinta (cintura/busto/cadera/muslo) SIEMPRE mandan cuando
 * el usuario ya las escribió — son la fuente de verdad real para el calce
 * de la prenda. El peso solo entra a jugar mientras esos campos siguen
 * vacíos: usando una relación peso/altura (similar a IMC) empuja el
 * cuerpo hacia una silueta más creíble por defecto, en vez de mostrar
 * siempre el mismo Basis delgado sin importar qué tan pesada dijo ser la
 * persona. En cuanto el usuario complete cintura/busto/cadera/muslo a
 * mano, el peso deja de influir en ese campo específico.
 *
 * ── Limitación conocida ──
 * No existen Shape Keys para `neck` (cuello) ni `ankle` (tobillo) — el set
 * esculpido en Blender solo cubre busto, cintura, cadera, hombros y muslo.
 * Esos dos campos siguen sirviendo para el avatar 2D (SVG), pero no mueven
 * nada en el avatar 3D real hasta que se esculpan sus Shape Keys.
 */

export const BASIS_CM = {
  waist: 74,
  bust: 75,
  hips: 85,
  thigh: 39,
  // No hay Shape Key "Shoulders_Narrow" con el que calibrar un extremo
  // angosto real — este es un estimado razonable de línea base.
  shoulders: 40,
} as const;

export const EXTREME_CM = {
  waistMinus: 55,
  waistPlus: 100,
  bustMinus: 70,
  bustPlus: 130,
  hipsMinus: 60,
  hipsPlus: 115,
  shouldersWide: 65,
  thighMinus: 30,
  thighPlus: 70,
} as const;

/**
 * IMC de referencia que representa el Basis (cuerpo delgado/tonificado tal
 * como viene esculpido). Un IMC más alto empuja cintura/cadera/muslo/busto
 * hacia sus extremos "Plus"; uno más bajo, hacia sus extremos "Minus".
 * BMI_RANGE define hasta qué IMC se alcanza el 100% del empuje (valores
 * más extremos que eso simplemente se acotan en 1.0).
 */
const BMI_BASIS = 19.5;
const BMI_RANGE = 14; // a BMI_BASIS + 14 (≈ 33.5) el empuje llega a full

/** Interpolación lineal, siempre acotada a [0, 1]. */
function ratio(value: number, from: number, to: number): number {
  if (to === from) return 0;
  const t = (value - from) / (to - from);
  return Math.min(1, Math.max(0, t));
}

/**
 * Estima una medida (cm) de respaldo a partir de peso+altura, cuando el
 * usuario todavía no escribió esa medida a mano. Devuelve `null` si no
 * hay suficientes datos (falta peso o altura) para estimar nada.
 */
function estimateFromWeight(
  basisCm: number,
  minusCm: number,
  plusCm: number,
  weightKg: number,
  heightCm: number,
): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const t = Math.min(1, Math.max(-1, (bmi - BMI_BASIS) / BMI_RANGE));
  return t >= 0
    ? basisCm + t * (plusCm - basisCm)
    : basisCm + (-t) * (minusCm - basisCm);
}

export type MorphInfluences = Record<ShapeKeyName, number>;
type ShapeKeyName = (typeof SHAPE_KEY_NAMES)[number];

/** Nombres exactos de los Shape Keys tal como se llaman en el .glb. */
export const SHAPE_KEY_NAMES = [
  "Waist_Minus", "Waist_Plus",
  "Bust_Minus", "Bust_Plus",
  "Hips_Minus", "Hips_Plus",
  "Shoulders_Wide",
  "Thigh_Minus", "Thigh_Plus",
] as const;

/**
 * Dadas las medidas reales del usuario (cm) más peso/altura, devuelve el
 * Value (0–1) que debe tener cada Shape Key.
 *
 * Prioridad por campo:
 *   1. Si el usuario ya escribió esa medida (cm) → se usa tal cual.
 *   2. Si no, y hay peso+altura → se estima con estimateFromWeight().
 *   3. Si tampoco hay peso/altura → se usa el Basis (sin deformación).
 */
export function computeMorphInfluences(m: {
  waist?: number | "";
  bust?: number | "";
  hips?: number | "";
  thigh?: number | "";
  shoulders?: number | "";
  weight?: number | "";
  height?: number | "";
}): MorphInfluences {
  const out: MorphInfluences = {
    Waist_Minus: 0, Waist_Plus: 0,
    Bust_Minus: 0, Bust_Plus: 0,
    Hips_Minus: 0, Hips_Plus: 0,
    Shoulders_Wide: 0,
    Thigh_Minus: 0, Thigh_Plus: 0,
  };

  const weightKg = Number(m.weight) || 0;
  const heightCm = Number(m.height) || 0;

  function resolve(explicit: number | "" | undefined, basis: number, minus: number, plus: number): number {
    if (explicit !== "" && explicit !== undefined && Number(explicit) > 0) {
      return Number(explicit);
    }
    return estimateFromWeight(basis, minus, plus, weightKg, heightCm) ?? basis;
  }

  const waist     = resolve(m.waist,  BASIS_CM.waist,  EXTREME_CM.waistMinus,  EXTREME_CM.waistPlus);
  const bust      = resolve(m.bust,   BASIS_CM.bust,   EXTREME_CM.bustMinus,   EXTREME_CM.bustPlus);
  const hips      = resolve(m.hips,   BASIS_CM.hips,   EXTREME_CM.hipsMinus,   EXTREME_CM.hipsPlus);
  const thigh     = resolve(m.thigh,  BASIS_CM.thigh,  EXTREME_CM.thighMinus,  EXTREME_CM.thighPlus);
  const shoulders = Number(m.shoulders) || BASIS_CM.shoulders; // sin respaldo por peso (ver nota en Shoulders_Wide)

  // Cintura — bidireccional: el Basis queda entre Waist_Minus y Waist_Plus.
  if (waist < BASIS_CM.waist) {
    out.Waist_Minus = ratio(waist, BASIS_CM.waist, EXTREME_CM.waistMinus);
  } else {
    out.Waist_Plus = ratio(waist, BASIS_CM.waist, EXTREME_CM.waistPlus);
  }

  // Busto
  if (bust < BASIS_CM.bust) {
    out.Bust_Minus = ratio(bust, BASIS_CM.bust, EXTREME_CM.bustMinus);
  } else {
    out.Bust_Plus = ratio(bust, BASIS_CM.bust, EXTREME_CM.bustPlus);
  }

  // Cadera
  if (hips < BASIS_CM.hips) {
    out.Hips_Minus = ratio(hips, BASIS_CM.hips, EXTREME_CM.hipsMinus);
  } else {
    out.Hips_Plus = ratio(hips, BASIS_CM.hips, EXTREME_CM.hipsPlus);
  }

  // Muslo
  if (thigh < BASIS_CM.thigh) {
    out.Thigh_Minus = ratio(thigh, BASIS_CM.thigh, EXTREME_CM.thighMinus);
  } else {
    out.Thigh_Plus = ratio(thigh, BASIS_CM.thigh, EXTREME_CM.thighPlus);
  }

  // Hombros — solo unidireccional (no existe Shape Key "angosto"), y sin
  // respaldo por peso (el ancho de hombros no está bien correlacionado
  // con IMC, sería una estimación poco confiable).
  out.Shoulders_Wide = ratio(shoulders, BASIS_CM.shoulders, EXTREME_CM.shouldersWide);

  return out;
}