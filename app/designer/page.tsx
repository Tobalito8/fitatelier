"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AvatarFigure from "@/components/AvatarFigure";
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
  buildDressPaths,
  computeDressPrice,
} from "@/lib/garments";
import type { AvatarMetrics } from "@/lib/measurements";

export default function DesignerPage() {
  const [design, setDesign] = useState<DressDesign>(DEFAULT_DRESS_DESIGN);
  const [bodyProfile, setBodyProfile] = useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [hydrated, setHydrated] = useState(false);

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

  return (
    <div className="grid min-h-screen grid-cols-1 bg-stone-50 lg:grid-cols-[320px_1fr_360px]">
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
            <span className="font-semibold underline">
              Completa tu perfil →
            </span>
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
                {["#111111", "#1A237E", "#880E4F", "#4A148C", "#C8A96B", "#1B5E20"].map(
                  (hex) => (
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
                  )
                )}
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
              renderGarment={(m: AvatarMetrics) => (
                <DressOverlay design={design} metrics={m} />
              )}
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

          <button className="w-full rounded-xl bg-black p-4 text-white">
            Agregar al Carrito
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ── Dress overlay: pure SVG, anchored to the avatar's real metrics  ── */
function DressOverlay({
  design,
  metrics,
}: {
  design: DressDesign;
  metrics: AvatarMetrics;
}) {
  const { bodicePath, skirtPath, leftSleeve, rightSleeve } = buildDressPaths(
    design,
    metrics
  );
  const fabric = FABRICS.find((f) => f.value === design.fabric);
  const opacity = fabric?.swatchOpacity ?? 1;

  const cx = metrics.centerX;
  const necklineCutouts: Record<string, React.ReactNode> = {
    V: (
      <path
        d={`
          M ${cx - metrics.bustHalfWidth * 0.45} ${metrics.shoulderY}
          L ${cx} ${metrics.shoulderY + (metrics.bustY - metrics.shoulderY) * 1.1}
          L ${cx + metrics.bustHalfWidth * 0.45} ${metrics.shoulderY}
          Z
        `}
        fill="#E8C4A0"
      />
    ),
    Corazón: (
      <path
        d={`
          M ${cx - metrics.bustHalfWidth * 0.4} ${metrics.shoulderY}
          Q ${cx - metrics.bustHalfWidth * 0.15} ${metrics.shoulderY - metrics.head.r * 0.3}
            ${cx} ${metrics.shoulderY + metrics.head.r * 0.15}
          Q ${cx + metrics.bustHalfWidth * 0.15} ${metrics.shoulderY - metrics.head.r * 0.3}
            ${cx + metrics.bustHalfWidth * 0.4} ${metrics.shoulderY}
          L ${cx} ${metrics.shoulderY + (metrics.bustY - metrics.shoulderY) * 0.9}
          Z
        `}
        fill="#E8C4A0"
      />
    ),
    Cuadrado: (
      <rect
        x={cx - metrics.bustHalfWidth * 0.4}
        y={metrics.shoulderY}
        width={metrics.bustHalfWidth * 0.8}
        height={(metrics.bustY - metrics.shoulderY) * 0.55}
        fill="#E8C4A0"
      />
    ),
  };

  return (
    <g>
      {/* Sleeves drawn first so the bodice slightly overlaps the shoulder seam */}
      {leftSleeve && (
        <ellipse
          cx={leftSleeve.cx}
          cy={leftSleeve.cy}
          rx={leftSleeve.rx}
          ry={leftSleeve.ry}
          fill={design.color}
          opacity={opacity}
        />
      )}
      {rightSleeve && (
        <ellipse
          cx={rightSleeve.cx}
          cy={rightSleeve.cy}
          rx={rightSleeve.rx}
          ry={rightSleeve.ry}
          fill={design.color}
          opacity={opacity}
        />
      )}

      <path d={bodicePath} fill={design.color} opacity={opacity} stroke="black" strokeWidth={1.5} />
      <path d={skirtPath} fill={design.color} opacity={opacity * 0.92} stroke="black" strokeWidth={1.5} />

      {necklineCutouts[design.neckline] ?? null}
    </g>
  );
}

/* ── Small UI helpers ── */

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{label}</h3>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border p-3"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      <p>{value}</p>
    </div>
  );
}
