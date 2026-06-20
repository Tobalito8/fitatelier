"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AvatarFigure from "@/components/AvatarFigure";
import AvatarFigure3D from "@/components/AvatarFigure3D";
import PhotoMeasurement from "@/components/PhotoMeasurement";
import {
  BodyMeasurements,
  NumericMeasurementKey,
  EMPTY_MEASUREMENTS,
  FIELD_RANGES,
  clampField,
  hasMinimumProfile,
  loadMeasurements,
  measurementsCompletion,
  saveMeasurements,
} from "@/lib/measurements";

const TOTAL_STEPS = 5;

export default function MeasurementsPage() {
  const [step, setStep]           = useState(1);
  const [formData, setFormData]   = useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [hydrated, setHydrated]   = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [viewMode, setViewMode]   = useState<"2d" | "3d">("3d");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(loadMeasurements());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMeasurements(formData);
  }, [formData, hydrated]);

  const progress       = measurementsCompletion(formData);
  const readyForAvatar = hasMinimumProfile(formData);

  /**
   * Called on blur. If the user left the field empty we store "".
   * Otherwise we parse and clamp to valid human range.
   */
  function commitField(field: NumericMeasurementKey, raw: string) {
    if (raw.trim() === "") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) return; // revert handled inside NumberField
    setFormData((prev) => ({ ...prev, [field]: clampField(field, num) }));
  }

  function next() { if (step < TOTAL_STEPS) setStep(step + 1); }
  function prev() { if (step > 1) setStep(step - 1); }

  function saveProfile() {
    saveMeasurements(formData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-stone-50 p-6 md:p-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_320px]">

          {/* ── Form ── */}
          <div className="rounded-3xl bg-white p-8 shadow">
            <h1 className="mb-2 text-4xl font-bold">Perfil Corporal</h1>
            <p className="mb-8 text-gray-500">
              Completa tus medidas para generar tu avatar a escala real.
            </p>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span>Paso {step} de {TOTAL_STEPS}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-black transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step dots */}
            <div className="mb-8 flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStep(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    step >= n ? "bg-black text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* STEP 1 — General */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <span className="mb-2 block text-xs font-medium text-gray-600">
                    Tipo de cuerpo
                    <span className="ml-1 text-gray-400">
                      (define la forma del pecho y algunos detalles del avatar)
                    </span>
                  </span>
                  <div className="flex gap-2">
                    {(["mujer", "hombre"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, bodyType: opt }))}
                        className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                          formData.bodyType === opt
                            ? "border-black bg-black text-white"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <StepSection title="Datos Generales">
                  <NumberField label="Altura" field="height" value={formData.height} onCommit={commitField} required />
                  <NumberField label="Peso"   field="weight" value={formData.weight} onCommit={commitField} />
                  <NumberField label="Edad"   field="age"    value={formData.age}    onCommit={commitField} />
                </StepSection>
              </div>
            )}

            {/* STEP 2 — Torso */}
            {step === 2 && (
              <StepSection title="Torso">
                <NumberField label="Cuello"     field="neck"      value={formData.neck}      onCommit={commitField} hint="opcional" />
                <NumberField label="Busto"      field="bust"      value={formData.bust}      onCommit={commitField} required />
                <NumberField label="Bajo Busto" field="underBust" value={formData.underBust} onCommit={commitField} />
                <NumberField label="Cintura"    field="waist"     value={formData.waist}     onCommit={commitField} required />
                <NumberField label="Hombros"    field="shoulders" value={formData.shoulders} onCommit={commitField} />
              </StepSection>
            )}

            {/* STEP 3 — Cadera y piernas */}
            {step === 3 && (
              <StepSection title="Cadera y Piernas">
                <NumberField label="Cadera"      field="hips"      value={formData.hips}      onCommit={commitField} required />
                <NumberField label="Muslo"        field="thigh"     value={formData.thigh}     onCommit={commitField} />
                <NumberField label="Pantorrilla"  field="calf"      value={formData.calf}      onCommit={commitField} />
                <NumberField label="Tobillo"      field="ankle"     value={formData.ankle}     onCommit={commitField} hint="opcional" />
                <NumberField label="Largo Pierna" field="legLength" value={formData.legLength} onCommit={commitField} />
              </StepSection>
            )}

            {/* STEP 4 — Brazos */}
            {step === 4 && (
              <StepSection title="Brazos">
                <NumberField label="Largo Brazo" field="armLength" value={formData.armLength} onCommit={commitField} />
                <NumberField label="Bíceps"      field="biceps"    value={formData.biceps}    onCommit={commitField} />
                <NumberField label="Muñeca"      field="wrist"     value={formData.wrist}     onCommit={commitField} />
              </StepSection>
            )}

            {/* STEP 5 — Fotos */}
            {step === 5 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Fotografías</h2>
                <p className="mb-6 text-sm text-gray-500">
                  Opcionales. Una foto de cuerpo completo nos ayuda a calcular
                  algunas medidas automáticamente — el resto sigue siendo
                  necesario completarlo a mano.
                </p>

                <PhotoMeasurement
                  knownHeightCm={Number(formData.height) || 0}
                  onApply={({ shoulders, armLength, legLength }) => {
                    setFormData((prev) => ({
                      ...prev,
                      shoulders: clampField("shoulders", shoulders),
                      armLength: clampField("armLength", armLength),
                      legLength: clampField("legLength", legLength),
                    }));
                  }}
                />
              </div>
            )}

            {/* Footer nav */}
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                disabled={step === 1}
                onClick={prev}
                className="rounded border px-6 py-3 disabled:opacity-40"
              >
                Atrás
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded bg-black px-6 py-3 text-white"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveProfile}
                  className="rounded bg-emerald-600 px-6 py-3 text-white"
                >
                  Guardar Perfil
                </button>
              )}
            </div>

            {savedToast && (
              <p className="mt-4 text-center text-sm font-medium text-emerald-600">
                ✓ Perfil guardado
              </p>
            )}
          </div>

          {/* ── Avatar + summary ── */}
          <aside className="h-fit space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-xl font-bold">Tu avatar</h2>
                <div className="flex rounded-full border bg-stone-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      viewMode === "3d" ? "bg-black text-white" : "text-gray-500"
                    }`}
                  >
                    3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("2d")}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      viewMode === "2d" ? "bg-black text-white" : "text-gray-500"
                    }`}
                  >
                    2D
                  </button>
                </div>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                {readyForAvatar
                  ? "Generado a escala real con tus medidas"
                  : "Completa altura, busto, cintura y cadera para verlo a escala"}
              </p>

              <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-stone-50 py-4">
                {viewMode === "3d" ? (
                  <AvatarFigure3D
                    measurements={formData}
                    width={260}
                    height={360}
                  />
                ) : (
                  <AvatarFigure
                    measurements={formData}
                    width={150}
                    height={300}
                    showMeasurementGuides={readyForAvatar}
                  />
                )}
              </div>

              {!readyForAvatar && (
                <p className="mt-3 text-center text-xs text-amber-600">
                  Mostrando una talla promedio de referencia
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <h2 className="mb-6 text-2xl font-bold">Resumen Corporal</h2>
              <div className="space-y-4">
                <SummaryRow label="Altura"  value={formData.height} unit="cm" />
                <SummaryRow label="Peso"    value={formData.weight} unit="kg" />
                <SummaryRow label="Cuello"  value={formData.neck}   unit="cm" />
                <SummaryRow label="Busto"   value={formData.bust}   unit="cm" />
                <SummaryRow label="Cintura" value={formData.waist}  unit="cm" />
                <SummaryRow label="Cadera"  value={formData.hips}   unit="cm" />
                <SummaryRow label="Tobillo" value={formData.ankle}  unit="cm" />
              </div>

              <div className="mt-8 border-t pt-6">
                <h3 className="mb-3 font-semibold">Perfil Completo</h3>
                <div className="h-3 rounded-full bg-gray-200">
                  <div
                    className={`h-3 rounded-full ${
                      progress === 100 ? "bg-emerald-500" : "bg-green-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">{progress}% completado</p>
              </div>

              {readyForAvatar && (
                <Link
                  href="/designer"
                  className="mt-6 block rounded-xl bg-black p-3 text-center text-white"
                >
                  Ir al diseñador →
                </Link>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

/* ── Small building blocks ── */

function StepSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/**
 * A text input that lets the user type freely.
 * On blur it validates the value and snaps it into the allowed range.
 * The visual feedback (value jumping to the limit) makes the constraints obvious.
 */
function NumberField({
  label,
  field,
  value,
  onCommit,
  required = false,
  hint,
}: {
  label: string;
  field: NumericMeasurementKey;
  value: number | "";
  onCommit: (field: NumericMeasurementKey, raw: string) => void;
  required?: boolean;
  hint?: string;
}) {
  const range = FIELD_RANGES[field];

  // Local string lets the user type freely without premature clamping.
  const [raw, setRaw] = useState(value === "" ? "" : String(value));
  const [error, setError] = useState("");

  // Keep in sync when the parent value changes (e.g. initial load from localStorage).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRaw(value === "" ? "" : String(value));
    setError("");
  }, [value]);

  function handleBlur() {
    if (raw.trim() === "") {
      setError("");
      onCommit(field, "");
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      setError("Valor inválido");
      setRaw(value === "" ? "" : String(value));
      return;
    }
    if (num < range.min) {
      setError(`Mínimo: ${range.min} ${range.unit}`);
    } else if (num > range.max) {
      setError(`Máximo: ${range.max} ${range.unit}`);
    } else {
      setError("");
    }
    // Commit always — the parent will clamp it and the effect above
    // will update raw to the clamped value, making the snap visible.
    onCommit(field, raw);
  }

  const hasError = error !== "";

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {hint && <span className="ml-1 text-gray-400">({hint})</span>}
        {" "}
        <span className="text-gray-400">({range.unit})</span>
      </span>
      <input
        type="text"
        inputMode="decimal"
        placeholder={`${range.min}–${range.max}`}
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setError(""); }}
        onBlur={handleBlur}
        className={`rounded border p-3 transition-colors focus:outline-none focus:ring-2 ${
          hasError
            ? "border-red-400 bg-red-50 ring-red-200"
            : "border-gray-200 focus:ring-black/20"
        }`}
      />
      {hasError && (
        <span className="text-[11px] font-medium text-red-500">{error}</span>
      )}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | "";
  unit: string;
}) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <p className="font-semibold">
        {value === "" ? "--" : value} {value !== "" && unit}
      </p>
    </div>
  );
}