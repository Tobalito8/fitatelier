"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AvatarFigure from "@/components/AvatarFigure";
import {
  BodyMeasurements,
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [hydrated, setHydrated] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Load once on mount. Intentionally done in an effect (not a lazy
  // useState initializer) so the server-rendered HTML always matches the
  // client's first paint — localStorage doesn't exist on the server, so
  // reading it during render would cause a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(loadMeasurements());
    setHydrated(true);
  }, []);

  // Persist on every change, but only after the initial load completed.
  useEffect(() => {
    if (!hydrated) return;
    saveMeasurements(formData);
  }, [formData, hydrated]);

  const progress = measurementsCompletion(formData);
  const readyForAvatar = hasMinimumProfile(formData);

  function updateField(field: keyof BodyMeasurements, raw: string) {
    if (raw === "") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    setFormData((prev) => ({ ...prev, [field]: clampField(field, num) }));
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function prev() {
    if (step > 1) setStep(step - 1);
  }

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

            {/* Progress */}
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
              <StepSection title="Datos Generales">
                <NumberField
                  label="Altura"
                  field="height"
                  value={formData.height}
                  onChange={updateField}
                  required
                />
                <NumberField
                  label="Peso"
                  field="weight"
                  value={formData.weight}
                  onChange={updateField}
                />
                <NumberField
                  label="Edad"
                  field="age"
                  value={formData.age}
                  onChange={updateField}
                />
              </StepSection>
            )}

            {/* STEP 2 — Torso */}
            {step === 2 && (
              <StepSection title="Torso">
                <NumberField
                  label="Busto"
                  field="bust"
                  value={formData.bust}
                  onChange={updateField}
                  required
                />
                <NumberField
                  label="Bajo Busto"
                  field="underBust"
                  value={formData.underBust}
                  onChange={updateField}
                />
                <NumberField
                  label="Cintura"
                  field="waist"
                  value={formData.waist}
                  onChange={updateField}
                  required
                />
                <NumberField
                  label="Hombros"
                  field="shoulders"
                  value={formData.shoulders}
                  onChange={updateField}
                />
              </StepSection>
            )}

            {/* STEP 3 — Cadera y piernas */}
            {step === 3 && (
              <StepSection title="Cadera y Piernas">
                <NumberField
                  label="Cadera"
                  field="hips"
                  value={formData.hips}
                  onChange={updateField}
                  required
                />
                <NumberField
                  label="Muslo"
                  field="thigh"
                  value={formData.thigh}
                  onChange={updateField}
                />
                <NumberField
                  label="Pantorrilla"
                  field="calf"
                  value={formData.calf}
                  onChange={updateField}
                />
                <NumberField
                  label="Largo Pierna"
                  field="legLength"
                  value={formData.legLength}
                  onChange={updateField}
                />
              </StepSection>
            )}

            {/* STEP 4 — Brazos */}
            {step === 4 && (
              <StepSection title="Brazos">
                <NumberField
                  label="Largo Brazo"
                  field="armLength"
                  value={formData.armLength}
                  onChange={updateField}
                />
                <NumberField
                  label="Bíceps"
                  field="biceps"
                  value={formData.biceps}
                  onChange={updateField}
                />
                <NumberField
                  label="Muñeca"
                  field="wrist"
                  value={formData.wrist}
                  onChange={updateField}
                />
              </StepSection>
            )}

            {/* STEP 5 — Fotos */}
            {step === 5 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Fotografías</h2>
                <p className="mb-6 text-sm text-gray-500">
                  Opcionales. Mejoran la precisión del avatar pero no son
                  obligatorias — tus medidas ya generan un avatar a escala.
                </p>
                <div className="space-y-4">
                  {["Frontal", "Lateral", "Posterior"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <input type="file" accept="image/*" className="text-sm" />
                    </div>
                  ))}
                </div>
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
              <h2 className="mb-1 text-xl font-bold">Tu avatar</h2>
              <p className="mb-4 text-xs text-gray-500">
                {readyForAvatar
                  ? "Generado a escala real con tus medidas"
                  : "Completa altura, busto, cintura y cadera para verlo a escala"}
              </p>

              <div className="flex items-center justify-center rounded-2xl bg-stone-50 py-4">
                <AvatarFigure
                  measurements={formData}
                  width={150}
                  height={300}
                  showMeasurementGuides={readyForAvatar}
                />
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
                <SummaryRow label="Altura" value={formData.height} unit="cm" />
                <SummaryRow label="Peso" value={formData.weight} unit="kg" />
                <SummaryRow label="Busto" value={formData.bust} unit="cm" />
                <SummaryRow label="Cintura" value={formData.waist} unit="cm" />
                <SummaryRow label="Cadera" value={formData.hips} unit="cm" />
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

function NumberField({
  label,
  field,
  value,
  onChange,
  required = false,
}: {
  label: string;
  field: keyof BodyMeasurements;
  value: number | "";
  onChange: (field: keyof BodyMeasurements, raw: string) => void;
  required?: boolean;
}) {
  const range = FIELD_RANGES[field];
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}{" "}
        <span className="text-gray-400">({range.unit})</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={range.min}
        max={range.max}
        placeholder={`${range.min}–${range.max}`}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="rounded border p-3"
      />
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
