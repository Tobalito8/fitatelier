"use client";

import { useRef, useState } from "react";
import { estimateFromPhoto, type PhotoMeasurementEstimate } from "@/lib/poseEstimation";

type Props = {
  /** Altura ya capturada en el formulario — necesaria como referencia de escala. */
  knownHeightCm: number;
  /** Se llama cuando el usuario confirma aplicar los valores estimados. */
  onApply: (values: { shoulders: number; armLength: number; legLength: number }) => void;
};

export default function PhotoMeasurement({ knownHeightCm, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "no-pose">("idle");
  const [estimate, setEstimate] = useState<PhotoMeasurementEstimate | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function drawSkeleton(img: HTMLImageElement, est: PhotoMeasurementEstimate) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Escala la imagen al ancho del canvas manteniendo proporción.
    const maxW = 280;
    const scale = maxW / img.naturalWidth;
    canvas.width  = img.naturalWidth  * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const k = est.keypoints;
    const pairs: [keyof typeof k, keyof typeof k][] = [
      ["leftShoulder", "rightShoulder"],
      ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
      ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
      ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"],
      ["leftHip", "rightHip"],
      ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"],
      ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"],
    ];

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    pairs.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(k[a].x * scale, k[a].y * scale);
      ctx.lineTo(k[b].x * scale, k[b].y * scale);
      ctx.stroke();
    });

    ctx.fillStyle = "#16a34a";
    Object.values(k).forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!knownHeightCm || knownHeightCm <= 0) {
      setStatus("error");
      setErrorMsg("Primero completa tu altura en el Paso 1 — la usamos como referencia de escala.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setEstimate(null);

    const img = new Image();
    img.onload = async () => {
      try {
        const result = await estimateFromPhoto(img, knownHeightCm);
        if (!result) {
          setStatus("no-pose");
          return;
        }
        setEstimate(result);
        drawSkeleton(img, result);
        setStatus("done");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMsg("No se pudo procesar la foto. Intenta con otra imagen.");
      }
    };
    img.onerror = () => {
      setStatus("error");
      setErrorMsg("No se pudo leer el archivo como imagen.");
    };
    img.src = URL.createObjectURL(file);
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-4">
      <p className="mb-1 text-sm font-medium">Calcular medidas desde una foto</p>
      <p className="mb-3 text-xs text-gray-500">
        Estimamos <strong>ancho de hombros, largo de brazo y largo de pierna</strong> a
        partir de una foto de cuerpo completo. No podemos calcular busto, cintura,
        cadera, cuello ni tobillo desde una sola foto — esas sí debes escribirlas
        a mano, o tomar foto de perfil.
      </p>

      <details className="mb-3 text-xs text-gray-500">
        <summary className="cursor-pointer font-medium text-gray-700">
          Cómo tomar la foto para mejores resultados
        </summary>
        <ul className="ml-4 mt-2 list-disc space-y-1">
          <li>Cámara a ~2–2.5 m de distancia, a la altura del pecho</li>
          <li>Celular en vertical, cuerpo completo visible de pies a cabeza</li>
          <li>De frente, brazos un poco separados del cuerpo (no pegados)</li>
          <li>Ropa ajustada, fondo simple, buena luz</li>
        </ul>
      </details>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-3 block text-sm"
      />

      {status === "loading" && (
        <p className="text-sm text-amber-600">Analizando foto…</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}
      {status === "no-pose" && (
        <p className="text-sm text-red-500">
          No detectamos una persona completa en la foto. Asegúrate de que el
          cuerpo entero (de pies a cabeza) esté visible.
        </p>
      )}

      {estimate && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <canvas ref={canvasRef} className="rounded-lg border" />

          <div className="flex-1 space-y-2 text-sm">
            {estimate.confidence < 0.6 && (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-700">
                ⚠ Confianza baja de detección ({Math.round(estimate.confidence * 100)}%).
                Los valores pueden ser imprecisos — revisa la iluminación/encuadre.
              </p>
            )}
            <Row label="Hombros"      value={estimate.shoulders} />
            <Row label="Largo brazo"  value={estimate.armLength} />
            <Row label="Largo pierna" value={estimate.legLength} />

            <button
              type="button"
              onClick={() =>
                onApply({
                  shoulders: Math.round(estimate.shoulders),
                  armLength: Math.round(estimate.armLength),
                  legLength: Math.round(estimate.legLength),
                })
              }
              className="mt-2 w-full rounded bg-black px-4 py-2 text-sm text-white"
            >
              Aplicar estos valores
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value.toFixed(1)} cm</span>
    </div>
  );
}
