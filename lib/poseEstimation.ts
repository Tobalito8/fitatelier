/**
 * Estimación de medidas lineales a partir de una foto, usando MediaPipe
 * Pose Landmarker (corre 100% en el navegador, sin servidor).
 *
 * IMPORTANTE — alcance real de esta técnica:
 * A partir de una sola foto frontal, sólo podemos estimar con confianza
 * medidas LINEALES (distancias entre puntos visibles desde el frente):
 *   - ancho de hombros
 *   - largo de brazo (hombro → codo → muñeca)
 *   - largo de pierna (cadera → rodilla → tobillo)
 *
 * NO podemos estimar circunferencias (busto, cintura, cadera, cuello,
 * tobillo) porque eso requiere información de profundidad que una sola
 * foto 2D no tiene. Para eso se necesitaría una foto de perfil adicional
 * y/o un modelo entrenado en miles de cuerpos reales (ej. servicios como
 * Meshcapade). Aquí no fingimos calcular eso.
 */

import type { PoseLandmarker as PoseLandmarkerType } from "@mediapipe/tasks-vision";

export type PoseKeypoints = {
  nose: { x: number; y: number };
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftElbow: { x: number; y: number };
  rightElbow: { x: number; y: number };
  leftWrist: { x: number; y: number };
  rightWrist: { x: number; y: number };
  leftHip: { x: number; y: number };
  rightHip: { x: number; y: number };
  leftKnee: { x: number; y: number };
  rightKnee: { x: number; y: number };
  leftAnkle: { x: number; y: number };
  rightAnkle: { x: number; y: number };
};

export type PhotoMeasurementEstimate = {
  shoulders: number;   // cm
  armLength: number;   // cm (promedio de ambos brazos)
  legLength: number;   // cm (promedio de ambas piernas)
  /** Puntos normalizados (0–1) para dibujar el esqueleto sobre la imagen. */
  keypoints: PoseKeypoints;
  /** Qué tan visible/confiable fue cada landmark usado (0–1). Útil para avisar al usuario si la foto no es clara. */
  confidence: number;
};

// Índices del esqueleto BlazePose (33 puntos) que usa MediaPipe.
const IDX = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
} as const;

let landmarkerPromise: Promise<PoseLandmarkerType> | null = null;

/** Carga (una sola vez, cacheada) el modelo de MediaPipe en el navegador. */
async function getLandmarker(): Promise<PoseLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Detecta la pose en una imagen y estima medidas lineales en cm, usando
 * la altura real de la persona (ya capturada en el formulario) como
 * referencia de escala: cm_por_unidad_normalizada = altura_cm / altura_en_imagen.
 */
export async function estimateFromPhoto(
  image: HTMLImageElement,
  knownHeightCm: number
): Promise<PhotoMeasurementEstimate | null> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);

  const lm = result.landmarks[0];
  if (!lm) return null; // no se detectó ninguna persona en la foto

  const get = (i: number) => ({ x: lm[i].x * image.naturalWidth, y: lm[i].y * image.naturalHeight });

  const keypoints: PoseKeypoints = {
    nose:          get(IDX.nose),
    leftShoulder:  get(IDX.leftShoulder),
    rightShoulder: get(IDX.rightShoulder),
    leftElbow:     get(IDX.leftElbow),
    rightElbow:    get(IDX.rightElbow),
    leftWrist:     get(IDX.leftWrist),
    rightWrist:    get(IDX.rightWrist),
    leftHip:       get(IDX.leftHip),
    rightHip:      get(IDX.rightHip),
    leftKnee:      get(IDX.leftKnee),
    rightKnee:     get(IDX.rightKnee),
    leftAnkle:     get(IDX.leftAnkle),
    rightAnkle:    get(IDX.rightAnkle),
  };

  // Escala: usamos la distancia vertical nariz → tobillo promedio como proxy
  // de la "altura visible" en píxeles, y la comparamos con la altura real.
  const ankleY = (keypoints.leftAnkle.y + keypoints.rightAnkle.y) / 2;
  const pixelHeight = ankleY - keypoints.nose.y;
  if (pixelHeight <= 0) return null;

  // La altura real persona-completa es ligeramente mayor que nariz→tobillo
  // (falta la parte superior de la cabeza). Factor empírico ≈ 1.13.
  const cmPerPixel = (knownHeightCm / 1.13) / pixelHeight;

  const shoulders = dist(keypoints.leftShoulder, keypoints.rightShoulder) * cmPerPixel;

  const armLeft  = (dist(keypoints.leftShoulder, keypoints.leftElbow) + dist(keypoints.leftElbow, keypoints.leftWrist)) * cmPerPixel;
  const armRight = (dist(keypoints.rightShoulder, keypoints.rightElbow) + dist(keypoints.rightElbow, keypoints.rightWrist)) * cmPerPixel;
  const armLength = (armLeft + armRight) / 2;

  const legLeft  = (dist(keypoints.leftHip, keypoints.leftKnee) + dist(keypoints.leftKnee, keypoints.leftAnkle)) * cmPerPixel;
  const legRight = (dist(keypoints.rightHip, keypoints.rightKnee) + dist(keypoints.rightKnee, keypoints.rightAnkle)) * cmPerPixel;
  const legLength = (legLeft + legRight) / 2;

  // Confianza: promedio de "visibility" de los landmarks usados.
  const usedIdx: number[] = Object.values(IDX);
  const confidence =
    usedIdx.reduce((sum, i) => sum + (lm[i].visibility ?? 0), 0) / usedIdx.length;

  return { shoulders, armLength, legLength, keypoints, confidence };
}

/** Libera el modelo de memoria (llamar al desmontar el componente, si aplica). */
export async function disposePoseLandmarker() {
  if (landmarkerPromise) {
    const lm = await landmarkerPromise;
    lm.close();
    landmarkerPromise = null;
  }
}
