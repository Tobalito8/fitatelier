"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AvatarFigure from "@/components/avatar/AvatarFigure";
import DressOverlay from "@/components/designer/DressOverlay";
import { SelectField, SummaryCard } from "@/components/designer/DesignControls";
import {
  BodyMeasurements,
  EMPTY_MEASUREMENTS,
  hasMinimumProfile,
  loadMeasurements,
} from "@/lib/measurements";
import {
  DEFAULT_DRESS_DESIGN,
  DressDesign,
  FABRICS,
  NECKLINES,
  PRODUCTION_DAYS,
  SKIRTS,
  SLEEVES,
  computeDressPrice,
} from "@/lib/garments";
import type { AvatarMetrics } from "@/lib/measurements";
import { useShop } from "@/lib/store/shop";

export default function DesignerPage() {
  const [design, setDesign] = useState<DressDesign>(DEFAULT_DRESS_DESIGN);
  const [bodyProfile, setBodyProfile] = useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [hydrated, setHydrated] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart } = useShop();

  // Load once on mount. Intentionally done in an effect (not a lazy
  // useState initializer) so the server-rendered HTML always matches the
  // client's first paint — localStorage doesn't exist on the server, so
  // reading it during render would cause a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBodyProfile(loadMeasurements());
    setHydrated(true);
  }, []);

  const readyProfile = hydrated && hasMinimumProfile(bodyProfile);
  const price = useMemo(() => computeDressPrice(design), [design]);

  function update<K extends keyof DressDesign>(key: K, value: DressDesign[K]) {
    setDesign((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddToCart() {
    addToCart(design, price, readyProfile ? bodyProfile : null);
    const token = String(Date.now());
    setAddedId(token);
    setTimeout(() => setAddedId((cur) => (cur === token ? null : cur)), 3000);
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 bg-stone-50 lg:grid-cols-[320px_1fr_360px]">
      {/* ── PANEL IZQUIERDO: opciones ── */}
      <aside className="border-r bg-white p-6">
        <h1 className="mb-1 text-2xl font-bold">Diseñador de Vestidos</h1>
        <p className="mb-6 text-sm text-gray-500">
          Cada cambio se refleja al instante sobre tu avatar a escala.
        </p>

        {!readyProfile && hydrated && (
          <Link
            href="/measurements"
            className="mb-6 block rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
          >
            Aún no tienes medidas completas. Estás viendo una talla
            promedio de referencia.{" "}
            <span className="font-semibold underline">Completa tu perfil →</span>
          </Link>
        )}

        <div className="space-y-6">
          <SelectField
            label="Escote"
            value={design.neckline}
            options={NECKLINES}
            onChange={(v) => update("neckline", v as DressDesign["neckline"])}
          />

          <SelectField
            label="Mangas"
            value={design.sleeves}
            options={SLEEVES}
            onChange={(v) => update("sleeves", v as DressDesign["sleeves"])}
          />

          <SelectField
            label="Falda"
            value={design.skirt}
            options={SKIRTS}
            onChange={(v) => update("skirt", v as DressDesign["skirt"])}
          />

          <SelectField
            label="Tela"
            value={design.fabric}
            options={FABRICS}
            onChange={(v) => update("fabric", v)}
          />

          <div>
            <h3 className="mb-2 font-semibold">Color</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={design.color}
                onChange={(e) => update("color", e.target.value)}
                className="h-12 w-16 cursor-pointer rounded"
              />
              <div className="flex flex-wrap gap-2">
                {["#111111", "#1A237E", "#880E4F", "#4A148C", "#C8A96B", "#1B5E20"].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => update("color", hex)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      design.color === hex ? "scale-110 border-black" : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={hex}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── CENTRO: avatar + prenda ── */}
      <main className="flex flex-col items-center justify-center gap-6 py-10">
        <div className="text-center">
          <h2 className="text-4xl font-bold">Vista Previa</h2>
          <p className="text-gray-500">
            {readyProfile ? "Avatar generado a tu escala real" : "Talla promedio de referencia"}
          </p>
        </div>

        <div className="flex h-[650px] w-[400px] items-center justify-center rounded-3xl border bg-white shadow">
          <div className="flex flex-col items-center">
            <AvatarFigure
              measurements={bodyProfile}
              width={260}
              height={500}
              renderGarment={(m: AvatarMetrics) => <DressOverlay design={design} metrics={m} />}
            />

            <div className="mt-6 text-center text-sm">
              <p>Busto: {bodyProfile.bust || "--"} cm</p>
              <p>Cintura: {bodyProfile.waist || "--"} cm</p>
              <p>Cadera: {bodyProfile.hips || "--"} cm</p>
            </div>
            <p className="mt-4 font-semibold">{design.fabric}</p>
          </div>
        </div>
      </main>

      {/* ── DERECHA: resumen ── */}
      <aside className="border-l bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Resumen</h2>

        {readyProfile && (
          <div className="mb-6 rounded-xl border bg-stone-50 p-4">
            <h3 className="mb-3 font-semibold">Perfil Corporal</h3>
            <div className="space-y-1 text-sm">
              <p>Altura: {bodyProfile.height} cm</p>
              <p>Busto: {bodyProfile.bust} cm</p>
              <p>Cintura: {bodyProfile.waist} cm</p>
              <p>Cadera: {bodyProfile.hips} cm</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <SummaryCard title="Escote" value={design.neckline} />
          <SummaryCard title="Mangas" value={design.sleeves} />
          <SummaryCard title="Falda" value={design.skirt} />
          <SummaryCard title="Tela" value={design.fabric} />

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Color</h3>
            <div
              className="mt-2 h-8 w-8 rounded-full border"
              style={{ backgroundColor: design.color }}
            />
          </div>

          <SummaryCard title="Tiempo Producción" value={PRODUCTION_DAYS} />

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Precio Estimado</h3>
            <p className="text-3xl font-bold">${price} USD</p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-black p-4 text-white transition-colors hover:bg-gray-800"
          >
            Agregar al Carrito
          </button>

          {addedId && (
            <p className="text-center text-sm font-medium text-emerald-600">
              ✓ Agregado al carrito.{" "}
              <Link href="/cart" className="underline">
                Ver carrito →
              </Link>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
