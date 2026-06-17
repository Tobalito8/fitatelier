"use client";

import { useEffect, useMemo, useState } from "react";

export default function DesignerPage() {
  const [design, setDesign] = useState({
    neckline: "Redondo",
    sleeves: "Sin mangas",
    fabric: "Satín",
    color: "#F5F5DC",
    skirt: "A-Line",
  });
  const [bodyProfile, setBodyProfile] = useState<any>(null);
  const bustWidth = bodyProfile
    ? Math.max(
      120,
      Number(bodyProfile.bust) * 1.5
    )
    : 140;

  const waistWidth = bodyProfile
    ? Math.max(
      70,
      Number(bodyProfile.waist) * 0.9
    )
    : 90;

  const hipsWidth = bodyProfile
    ? Math.max(
      120,
      Number(bodyProfile.hips) * 1.3
    )
    : 150;
  const dressColor = design.color;

  const sleeveSize =
    design.sleeves === "Globo"
      ? 35
      : design.sleeves === "Larga"
        ? 20
        : design.sleeves === "Corta"
          ? 15
          : 0;
  const skirtMultiplier =
    design.skirt === "Princesa"
      ? 1.5
      : design.skirt === "Sirena"
        ? 0.8
        : 1.2;
  const price = useMemo(() => {
    let total = 150;

    if (design.fabric === "Tul")
      total += 20;

    if (design.fabric === "Chifón")
      total += 25;

    if (design.fabric === "Encaje")
      total += 50;

    if (design.sleeves === "Larga")
      total += 10;

    if (design.sleeves === "Globo")
      total += 15;

    return total;
  }, [design]);

  useEffect(() => {
    const saved = localStorage.getItem(
      "fitatelier-measurements"
    );

    if (saved) {
      setBodyProfile(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="grid min-h-screen grid-cols-[320px_1fr_360px] bg-stone-50">

      {/* PANEL IZQUIERDO */}
      <aside className="border-r bg-white p-6">
        <h1 className="mb-6 text-2xl font-bold">
          Diseñador de Vestidos
        </h1>

        <div className="space-y-6">

          <div>
            <h3 className="mb-2 font-semibold">Escote</h3>

            <select
              value={design.neckline}
              onChange={(e) =>
                setDesign({
                  ...design,
                  neckline: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            >
              <option>Redondo</option>
              <option>V</option>
              <option>Corazón</option>
              <option>Halter</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Mangas</h3>

            <select
              value={design.sleeves}
              onChange={(e) =>
                setDesign({
                  ...design,
                  sleeves: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            >
              <option>Sin mangas</option>
              <option>Corta</option>
              <option>Larga</option>
              <option>Globo</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Tela</h3>

            <select
              value={design.fabric}
              onChange={(e) =>
                setDesign({
                  ...design,
                  fabric: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            >
              <option>Satín</option>
              <option>Chifón</option>
              <option>Tul</option>
              <option>Encaje</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Color</h3>

            <input
              type="color"
              value={design.color}
              onChange={(e) =>
                setDesign({
                  ...design,
                  color: e.target.value,
                })
              }
              className="h-12 w-full"
            />
          </div>
          <div>
            <h3 className="mb-2 font-semibold">
              Falda
            </h3>

            <select
              value={design.skirt}
              onChange={(e) =>
                setDesign({
                  ...design,
                  skirt: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            >
              <option>A-Line</option>
              <option>Princesa</option>
              <option>Sirena</option>
            </select>
          </div>
        </div>
      </aside>

      {/* AVATAR */}
      <main className="flex flex-col items-center justify-center">

        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold">
            Vista Previa
          </h2>

          <p className="text-gray-500">
            Próximamente avatar 3D
          </p>
        </div>

        <div className="flex h-[650px] w-[400px] items-center justify-center rounded-3xl border bg-white shadow">

          <div className="flex flex-col items-center">

            <svg
              width="260"
              height="500"
              viewBox="0 0 260 500"
            >
              <path
                d={`
                  M ${130 - bustWidth / 2} 80
                  Q 130 40 ${130 + bustWidth / 2} 80
                  L ${130 + waistWidth / 2} 220
                  L ${130 + hipsWidth / 2} 380
                  Q 130 470 ${130 - hipsWidth / 2} 380
                  L ${130 - waistWidth / 2} 220
                  Z
                `}
                fill={design.color}
                stroke="black"
                strokeWidth="3"
              />
              <path
                d={`
                  M ${130 - bustWidth / 2 + 10} 100
                  L ${130 + bustWidth / 2 - 10} 100
                  L ${130 + (hipsWidth * skirtMultiplier) / 2 - 10} 380
                  L ${130 - (hipsWidth * skirtMultiplier) / 2 + 10} 380
                  Z
                `}
                fill={dressColor}
                opacity="0.8"
              />
              {design.neckline === "V" && (
                <path
                  d="
                    M 110 100
                    L 130 150
                    L 150 100
                  "
                  fill="white"
                />
              )}
              {design.neckline === "Corazón" && (
                <path
                  d="
                    M 105 100
                    Q 118 75 130 95
                    Q 142 75 155 100
                    L 130 145
                    Z
                  "
                  fill="white"
                />
              )}
              {sleeveSize > 0 && (
                <>
                  <ellipse
                    cx={130 - bustWidth / 2}
                    cy="130"
                    rx={sleeveSize}
                    ry="25"
                    fill={dressColor}
                  />

                  <ellipse
                    cx={130 + bustWidth / 2}
                    cy="130"
                    rx={sleeveSize}
                    ry="25"
                    fill={dressColor}
                  />
                </>
              )}
            </svg>
            <div className="mt-6 text-center text-sm">

              <p>
                Busto: {bodyProfile?.bust || "--"} cm
              </p>

              <p>
                Cintura: {bodyProfile?.waist || "--"} cm
              </p>

              <p>
                Cadera: {bodyProfile?.hips || "--"} cm
              </p>

            </div>
            <p className="mt-4 font-semibold">
              {design.fabric}
            </p>
          </div>
        </div>
      </main >

      {/* RESUMEN */}
      < aside className="border-l bg-white p-6" >

        <h2 className="mb-6 text-2xl font-bold">
          Resumen
        </h2>
        {bodyProfile && (

          <div className="mb-6 rounded-xl border bg-stone-50 p-4">

            <h3 className="mb-3 font-semibold">
              Perfil Corporal
            </h3>

            <div className="space-y-1 text-sm">

              <p>
                Altura: {bodyProfile.height} cm
              </p>

              <p>
                Busto: {bodyProfile.bust} cm
              </p>

              <p>
                Cintura: {bodyProfile.waist} cm
              </p>

              <p>
                Cadera: {bodyProfile.hips} cm
              </p>

            </div>

          </div>

        )}

        <div className="space-y-4">

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Escote
            </h3>

            <p>{design.neckline}</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Mangas
            </h3>

            <p>{design.sleeves}</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Tela
            </h3>

            <p>{design.fabric}</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Color
            </h3>

            <div
              className="mt-2 h-8 w-8 rounded-full border"
              style={{
                backgroundColor: design.color,
              }}
            />
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Tiempo Producción
            </h3>

            <p>7 - 10 días</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">
              Precio Estimado
            </h3>

            <p className="text-3xl font-bold">
              ${price} USD
            </p>
          </div>

          <button className="w-full rounded-xl bg-black p-4 text-white">
            Agregar al Carrito
          </button>

        </div>
      </aside >

    </div >
  );
}