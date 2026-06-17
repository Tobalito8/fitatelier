/**
 * Garment catalog.
 *
 * FitAtelier starts with dresses only, but the data is shaped so adding a
 * new garment type later (blusas, pantalones, faldas...) means adding a
 * new entry here — not rewriting the designer page.
 */

import type { AvatarMetrics } from "./measurements";

export type GarmentType = "dress"; // add "top" | "pants" | "skirt" here later

export type OptionField<T extends string> = {
  key: string;
  label: string;
  choices: { value: T; label: string }[];
};

export type FabricOption = {
  value: string;
  label: string;
  priceModifier: number;
  /** Used to render a subtle texture/sheen on the SVG preview. */
  swatchOpacity: number;
};

export const FABRICS: FabricOption[] = [
  { value: "Satín", label: "Satín", priceModifier: 0, swatchOpacity: 0.95 },
  { value: "Chifón", label: "Chifón", priceModifier: 25, swatchOpacity: 0.75 },
  { value: "Tul", label: "Tul", priceModifier: 20, swatchOpacity: 0.65 },
  { value: "Encaje", label: "Encaje", priceModifier: 50, swatchOpacity: 0.85 },
  { value: "Algodón", label: "Algodón", priceModifier: -20, swatchOpacity: 1 },
];

export type NecklineValue = "Redondo" | "V" | "Corazón" | "Halter" | "Cuadrado";
export type SleeveValue = "Sin mangas" | "Corta" | "Larga" | "Globo";
export type SkirtValue = "A-Line" | "Princesa" | "Sirena" | "Recta";

export type DressDesign = {
  garmentType: "dress";
  neckline: NecklineValue;
  sleeves: SleeveValue;
  skirt: SkirtValue;
  fabric: string;
  color: string;
};

export const DEFAULT_DRESS_DESIGN: DressDesign = {
  garmentType: "dress",
  neckline: "Redondo",
  sleeves: "Sin mangas",
  skirt: "A-Line",
  fabric: "Satín",
  color: "#2B2B2B",
};

export const NECKLINES: { value: NecklineValue; label: string }[] = [
  { value: "Redondo", label: "Redondo" },
  { value: "V", label: "V" },
  { value: "Corazón", label: "Corazón" },
  { value: "Halter", label: "Halter" },
  { value: "Cuadrado", label: "Cuadrado" },
];

export const SLEEVES: { value: SleeveValue; label: string; lengthFrac: number }[] = [
  { value: "Sin mangas", label: "Sin mangas", lengthFrac: 0 },
  { value: "Corta", label: "Corta", lengthFrac: 0.18 },
  { value: "Larga", label: "Larga", lengthFrac: 0.85 },
  { value: "Globo", label: "Globo", lengthFrac: 0.3 },
];

export const SKIRTS: { value: SkirtValue; label: string; hemFlareFrac: number }[] = [
  { value: "Recta", label: "Recta", hemFlareFrac: 1.0 },
  { value: "A-Line", label: "A-Line", hemFlareFrac: 1.35 },
  { value: "Princesa", label: "Princesa", hemFlareFrac: 1.6 },
  { value: "Sirena", label: "Sirena", hemFlareFrac: 0.85 },
];

const BASE_PRICE_USD = 150;

export function computeDressPrice(design: DressDesign): number {
  let total = BASE_PRICE_USD;
  const fabric = FABRICS.find((f) => f.value === design.fabric);
  if (fabric) total += fabric.priceModifier;

  if (design.sleeves === "Larga") total += 10;
  if (design.sleeves === "Globo") total += 15;
  if (design.skirt === "Sirena") total += 20;
  if (design.skirt === "Princesa") total += 15;
  if (design.neckline === "Halter" || design.neckline === "Corazón") total += 5;

  return total;
}

export const PRODUCTION_DAYS = "7 – 10 días";

/**
 * Builds the SVG path data for a dress overlay, anchored to the avatar's
 * real measurements (via AvatarMetrics) so the garment always matches the
 * body underneath it — instead of floating fixed-size shapes.
 */
export function buildDressPaths(design: DressDesign, m: AvatarMetrics) {
  const cx = m.centerX;
  const skirt = SKIRTS.find((s) => s.value === design.skirt) ?? SKIRTS[0];
  const sleeve = SLEEVES.find((s) => s.value === design.sleeves) ?? SLEEVES[0];

  const hemY = m.kneeY + (m.ankleY - m.kneeY) * 0.35;
  const hipFlareHalf = m.hipHalfWidth * skirt.hemFlareFrac;

  // Bodice: shoulder -> bust -> waist
  const bodicePath = `
    M ${cx - m.shoulderHalfWidth} ${m.shoulderY}
    L ${cx - m.bustHalfWidth} ${m.bustY}
    L ${cx - m.waistHalfWidth} ${m.waistY}
    L ${cx + m.waistHalfWidth} ${m.waistY}
    L ${cx + m.bustHalfWidth} ${m.bustY}
    L ${cx + m.shoulderHalfWidth} ${m.shoulderY}
    Z
  `;

  // Skirt: waist -> hip -> flared hem
  const skirtPath = `
    M ${cx - m.waistHalfWidth} ${m.waistY}
    L ${cx - m.hipHalfWidth} ${m.hipY}
    L ${cx - hipFlareHalf} ${hemY}
    L ${cx + hipFlareHalf} ${hemY}
    L ${cx + m.hipHalfWidth} ${m.hipY}
    L ${cx + m.waistHalfWidth} ${m.waistY}
    Z
  `;

  const sleeveLengthPx = sleeve.lengthFrac * (m.wristY - m.shoulderY) * 2.1;
  const sleeveEndY = m.shoulderY + Math.max(sleeveLengthPx, m.armHalfWidth * 2);
  const isBalloon = design.sleeves === "Globo";
  const sleeveRx = isBalloon ? m.armHalfWidth * 2.4 : m.armHalfWidth * 1.6;

  const leftSleeve =
    sleeve.value === "Sin mangas"
      ? null
      : {
          cx: cx - m.shoulderHalfWidth,
          cy: (m.shoulderY + sleeveEndY) / 2,
          rx: sleeveRx,
          ry: Math.max((sleeveEndY - m.shoulderY) / 2, m.armHalfWidth),
        };

  const rightSleeve =
    sleeve.value === "Sin mangas"
      ? null
      : {
          cx: cx + m.shoulderHalfWidth,
          cy: (m.shoulderY + sleeveEndY) / 2,
          rx: sleeveRx,
          ry: Math.max((sleeveEndY - m.shoulderY) / 2, m.armHalfWidth),
        };

  return { bodicePath, skirtPath, leftSleeve, rightSleeve, hemY };
}
