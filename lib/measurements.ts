/**
 * Body measurements: types, persistence and human-scale avatar geometry.
 *
 * This file is the single source of truth for body data. Both
 * `/measurements` (capture) and `/designer` (avatar + garment preview)
 * import from here so they can never drift out of sync.
 */

/** "Mujer" / "hombre" — usado para decidir la forma del pecho (busto vs
 *  pectorales) y algunos matices de silueta en el avatar 3D. No es una
 *  medida numérica, así que vive aparte del sistema de rangos/clamp. */
export type BodyType = "mujer" | "hombre";

export type BodyMeasurements = {
  bodyType: BodyType;

  height: number | "";
  weight: number | "";
  age: number | "";

  neck: number | "";       // NEW – mejora cuello en 3D
  bust: number | "";
  underBust: number | "";
  waist: number | "";
  shoulders: number | "";

  hips: number | "";
  thigh: number | "";
  calf: number | "";
  ankle: number | "";      // NEW – mejora tobillo en 3D
  legLength: number | "";

  armLength: number | "";
  biceps: number | "";
  wrist: number | "";
};

/** Claves numéricas de BodyMeasurements (todo excepto bodyType). Es lo que
 *  usan FIELD_RANGES / clampField / MEASUREMENT_FIELDS — bodyType tiene su
 *  propio control de UI (un toggle), no un NumberField. */
export type NumericMeasurementKey = Exclude<keyof BodyMeasurements, "bodyType">;

export const EMPTY_MEASUREMENTS: BodyMeasurements = {
  bodyType: "mujer",
  height: "",
  weight: "",
  age: "",
  neck: "",
  bust: "",
  underBust: "",
  waist: "",
  shoulders: "",
  hips: "",
  thigh: "",
  calf: "",
  ankle: "",
  legLength: "",
  armLength: "",
  biceps: "",
  wrist: "",
};

/** Fields used to compute "profile completion %". */
export const MEASUREMENT_FIELDS: NumericMeasurementKey[] = [
  "height",
  "weight",
  "age",
  "neck",
  "bust",
  "underBust",
  "waist",
  "shoulders",
  "hips",
  "thigh",
  "calf",
  "ankle",
  "legLength",
  "armLength",
  "biceps",
  "wrist",
];

/** Fields strictly required to render an accurate avatar. */
const CORE_FIELDS: NumericMeasurementKey[] = ["height", "bust", "waist", "hips"];

/** Sane human ranges, used to clamp/validate on blur. */
export const FIELD_RANGES: Record<
  NumericMeasurementKey,
  { min: number; max: number; unit: string }
> = {
  height:    { min: 120, max: 220, unit: "cm" },
  weight:    { min: 30,  max: 200, unit: "kg" },
  age:       { min: 12,  max: 100, unit: "años" },
  neck:      { min: 25,  max: 55,  unit: "cm" },
  bust:      { min: 60,  max: 160, unit: "cm" },
  underBust: { min: 55,  max: 150, unit: "cm" },
  waist:     { min: 45,  max: 160, unit: "cm" },
  shoulders: { min: 28,  max: 60,  unit: "cm" },
  hips:      { min: 60,  max: 170, unit: "cm" },
  thigh:     { min: 30,  max: 90,  unit: "cm" },
  calf:      { min: 20,  max: 60,  unit: "cm" },
  ankle:     { min: 15,  max: 40,  unit: "cm" },
  legLength: { min: 50,  max: 110, unit: "cm" },
  armLength: { min: 40,  max: 80,  unit: "cm" },
  biceps:    { min: 15,  max: 50,  unit: "cm" },
  wrist:     { min: 10,  max: 25,  unit: "cm" },
};

const STORAGE_KEY = "fitatelier-measurements";

/** Reads the saved profile from localStorage. Safe to call on the server (SSR). */
export function loadMeasurements(): BodyMeasurements {
  if (typeof window === "undefined") return EMPTY_MEASUREMENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_MEASUREMENTS;
    const parsed = JSON.parse(raw);
    // Compatibilidad con perfiles guardados antes de agregar bodyType.
    return { ...EMPTY_MEASUREMENTS, ...parsed, bodyType: parsed.bodyType ?? "mujer" };
  } catch {
    return EMPTY_MEASUREMENTS;
  }
}

export function saveMeasurements(data: BodyMeasurements) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently ignore — saving is best-effort until there's a real backend.
  }
}

export function measurementsCompletion(data: BodyMeasurements): number {
  const filled = MEASUREMENT_FIELDS.filter(
    (key) => data[key] !== "" && data[key] !== undefined && data[key] !== null
  ).length;
  return Math.round((filled / MEASUREMENT_FIELDS.length) * 100);
}

/** True once there's enough data (height + 3 circumferences) to draw a real avatar. */
export function hasMinimumProfile(data: BodyMeasurements): boolean {
  return CORE_FIELDS.every((key) => data[key] !== "" && Number(data[key]) > 0);
}

export function clampField(key: NumericMeasurementKey, value: number): number {
  const { min, max } = FIELD_RANGES[key];
  return Math.min(max, Math.max(min, value));
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Human-scale avatar geometry                                           */
/* ────────────────────────────────────────────────────────────────────── */

const FALLBACK_CM = {
  height:    165,
  neck:      34,
  bust:      92,
  waist:     72,
  hips:      96,
  shoulders: 40,
  armLength: 56,
  legLength: 78,
  ankle:     22,
};

export type AvatarMetrics = {
  /** px per real-world cm, derived from this person's height + the canvas size. */
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  centerX: number;

  head: { cx: number; cy: number; r: number };
  neckTopY: number;
  neckBottomY: number;
  neckHalfWidth: number;  // NEW

  shoulderY: number;
  shoulderHalfWidth: number;

  bustY: number;
  bustHalfWidth: number;

  waistY: number;
  waistHalfWidth: number;

  hipY: number;
  hipHalfWidth: number;

  kneeY: number;
  ankleY: number;
  ankleHalfWidth: number; // NEW
  wristY: number;

  armHalfWidth: number;
  legHalfWidth: number;
};

/**
 * Converts a body-part circumference (cm, measured with a tape) into an
 * approximate frontal width (cm). Assumes a roughly elliptical cross
 * section where depth ≈ 0.86 × width.
 */
function circumferenceToFrontalWidth(circumferenceCm: number): number {
  return circumferenceCm / Math.PI / 0.86;
}

export function computeAvatarMetrics(
  data: BodyMeasurements,
  canvasWidth = 240,
  canvasHeight = 480
): AvatarMetrics {
  const heightCm    = Number(data.height)    || FALLBACK_CM.height;
  const neckCm      = Number(data.neck)      || FALLBACK_CM.neck;
  const bustCm      = Number(data.bust)      || FALLBACK_CM.bust;
  const waistCm     = Number(data.waist)     || FALLBACK_CM.waist;
  const hipsCm      = Number(data.hips)      || FALLBACK_CM.hips;
  const shouldersCm = Number(data.shoulders) || FALLBACK_CM.shoulders;
  const ankleCm     = Number(data.ankle)     || FALLBACK_CM.ankle;

  const figureHeightPx = canvasHeight * 0.94;
  const topMargin      = canvasHeight * 0.03;
  const scale          = figureHeightPx / heightCm;

  const headHeightCm = heightCm / 7.5;
  const headR        = (headHeightCm / 2) * scale;

  const FRAC = {
    neckTop:    0.118,
    neckBottom: 0.145,
    shoulder:   0.155,
    bust:       0.27,
    waist:      0.4,
    hip:        0.5,
    wrist:      0.46,
    knee:       0.745,
    ankle:      0.965,
  };

  const y = (frac: number) => topMargin + frac * heightCm * scale;

  return {
    scale,
    canvasWidth,
    canvasHeight,
    centerX: canvasWidth / 2,

    head: { cx: canvasWidth / 2, cy: topMargin + headR, r: headR },
    neckTopY:      y(FRAC.neckTop),
    neckBottomY:   y(FRAC.neckBottom),
    neckHalfWidth: (circumferenceToFrontalWidth(neckCm) / 2) * scale,

    shoulderY:         y(FRAC.shoulder),
    shoulderHalfWidth: (shouldersCm / 2) * scale,

    bustY:         y(FRAC.bust),
    bustHalfWidth: (circumferenceToFrontalWidth(bustCm) / 2) * scale,

    waistY:         y(FRAC.waist),
    waistHalfWidth: (circumferenceToFrontalWidth(waistCm) / 2) * scale,

    hipY:         y(FRAC.hip),
    hipHalfWidth: (circumferenceToFrontalWidth(hipsCm) / 2) * scale,

    kneeY:          y(FRAC.knee),
    ankleY:         y(FRAC.ankle),
    ankleHalfWidth: (circumferenceToFrontalWidth(ankleCm) / 2) * scale,
    wristY:         y(FRAC.wrist),

    armHalfWidth: 5.2 * scale,
    legHalfWidth: 7.5 * scale,
  };
}