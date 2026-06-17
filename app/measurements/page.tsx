"use client";

import { useEffect, useState } from "react";

export default function MeasurementsPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    age: "",

    bust: "",
    underBust: "",
    waist: "",
    shoulders: "",

    hips: "",
    thigh: "",
    calf: "",
    legLength: "",

    armLength: "",
    biceps: "",
    wrist: "",

    frontPhoto: "",
    sidePhoto: "",
    backPhoto: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("fitatelier-measurements");

    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "fitatelier-measurements",
      JSON.stringify(formData)
    );
  }, [formData]);

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);
  const totalSteps = 5;
  /*const fields = Object.values(formData);*/
  const fields = [
    formData.height,
    formData.weight,
    formData.age,

    formData.bust,
    formData.underBust,
    formData.waist,
    formData.shoulders,

    formData.hips,
    formData.thigh,
    formData.calf,
    formData.legLength,

    formData.armLength,
    formData.biceps,
    formData.wrist,
  ];

  const completedFields = fields.filter(
    (value) => value !== ""
  ).length;

  const progress =
    (completedFields / fields.length) * 100;

  const updateField = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveProfile = () => {
    alert("Perfil actualizado");
  };

  return (
    <main className="min-h-screen bg-stone-50 p-10">

      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_320px] gap-8">
        <div className="rounded-3xl bg-white p-8 shadow">
          <h1 className="mb-2 text-4xl font-bold">
            Perfil Corporal
          </h1>

          <p className="mb-8 text-gray-500">
            Completa tus medidas para generar tu avatar.
          </p>

          <div className="mb-8">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-black transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="mb-8 flex justify-between">

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 1
                ? "bg-black text-white"
                : "bg-gray-200"
                }`}
            >
              1
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 2
                ? "bg-black text-white"
                : "bg-gray-200"
                }`}
            >
              2
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 3
                ? "bg-black text-white"
                : "bg-gray-200"
                }`}
            >
              3
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 4
                ? "bg-black text-white"
                : "bg-gray-200"
                }`}
            >
              4
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 5
                ? "bg-black text-white"
                : "bg-gray-200"
                }`}
            >
              5
            </div>

          </div>

          {/* STEP 1 */}

          {step === 1 && (
            <div>
              <h2 className="mb-6 text-2xl font-semibold">
                Datos Generales
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <input
                  className="rounded border p-3"
                  placeholder="Altura (cm)"
                  value={formData.height}
                  onChange={(e) =>
                    updateField("height", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Peso (kg)"
                  value={formData.weight}
                  onChange={(e) =>
                    updateField("weight", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Edad"
                  value={formData.age}
                  onChange={(e) =>
                    updateField("age", e.target.value)
                  }
                />

              </div>
            </div>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <div>
              <h2 className="mb-6 text-2xl font-semibold">
                Torso
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <input
                  className="rounded border p-3"
                  placeholder="Busto"
                  value={formData.bust}
                  onChange={(e) =>
                    updateField("bust", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Bajo Busto"
                  value={formData.underBust}
                  onChange={(e) =>
                    updateField("underBust", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Cintura"
                  value={formData.waist}
                  onChange={(e) =>
                    updateField("waist", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Hombros"
                  value={formData.shoulders}
                  onChange={(e) =>
                    updateField("shoulders", e.target.value)
                  }
                />

              </div>
            </div>
          )}

          {/* STEP 3 */}

          {step === 3 && (
            <div>
              <h2 className="mb-6 text-2xl font-semibold">
                Cadera y Piernas
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <input
                  className="rounded border p-3"
                  placeholder="Cadera"
                  value={formData.hips}
                  onChange={(e) =>
                    updateField("hips", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Muslo"
                  value={formData.thigh}
                  onChange={(e) =>
                    updateField("thigh", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Pantorrilla"
                  value={formData.calf}
                  onChange={(e) =>
                    updateField("calf", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Largo Pierna"
                  value={formData.legLength}
                  onChange={(e) =>
                    updateField("legLength", e.target.value)
                  }
                />

              </div>
            </div>
          )}

          {/* STEP 4 */}

          {step === 4 && (
            <div>
              <h2 className="mb-6 text-2xl font-semibold">
                Brazos
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <input
                  className="rounded border p-3"
                  placeholder="Largo Brazo"
                  value={formData.armLength}
                  onChange={(e) =>
                    updateField("armLength", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Bíceps"
                  value={formData.biceps}
                  onChange={(e) =>
                    updateField("biceps", e.target.value)
                  }
                />

                <input
                  className="rounded border p-3"
                  placeholder="Muñeca"
                  value={formData.wrist}
                  onChange={(e) =>
                    updateField("wrist", e.target.value)
                  }
                />

              </div>
            </div>
          )}

          {/* STEP 5 */}

          {step === 5 && (
            <div>

              <h2 className="mb-6 text-2xl font-semibold">
                Fotografías
              </h2>

              <div className="space-y-4">

                <input
                  type="file"
                  accept="image/*"
                />

                <input
                  type="file"
                  accept="image/*"
                />

                <input
                  type="file"
                  accept="image/*"
                />

              </div>

            </div>
          )}

          {/* FOOTER */}

          <div className="mt-10 flex justify-between">

            <button
              disabled={step === 1}
              onClick={prev}
              className="rounded border px-6 py-3"
            >
              Atrás
            </button>

            {step < 5 ? (
              <button
                onClick={next}
                className="rounded bg-black px-6 py-3 text-white"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={saveProfile}
                className="rounded bg-green-600 px-6 py-3 text-white"
              >
                Guardar Perfil
              </button>
            )}

          </div>
        </div>
        <aside className="h-fit rounded-3xl bg-white p-6 shadow">

          <h2 className="mb-6 text-2xl font-bold">
            Resumen Corporal
          </h2>

          <div className="space-y-4">

            <div>
              <span className="text-gray-500">
                Altura
              </span>

              <p className="font-semibold">
                {formData.height || "--"} cm
              </p>
            </div>

            <div>
              <span className="text-gray-500">
                Peso
              </span>

              <p className="font-semibold">
                {formData.weight || "--"} kg
              </p>
            </div>

            <div>
              <span className="text-gray-500">
                Busto
              </span>

              <p className="font-semibold">
                {formData.bust || "--"} cm
              </p>
            </div>

            <div>
              <span className="text-gray-500">
                Cintura
              </span>

              <p className="font-semibold">
                {formData.waist || "--"} cm
              </p>
            </div>

            <div>
              <span className="text-gray-500">
                Cadera
              </span>

              <p className="font-semibold">
                {formData.hips || "--"} cm
              </p>
            </div>

          </div>
          <div className="mt-8 border-t pt-6">

            <h3 className="mb-3 font-semibold">
              Perfil Completo
            </h3>

            <div className="h-3 rounded-full bg-gray-200">

              <div
                className={`h-3 rounded-full ${progress === 100
                  ? "bg-emerald-500"
                  : "bg-green-600"
                  }`}

                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {Math.round(progress)}% completado
            </p>

          </div>
        </aside>

      </div>

    </main>
  );
}