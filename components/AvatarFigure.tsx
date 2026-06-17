"use client";

import type { BodyMeasurements } from "@/lib/measurements";
import { computeAvatarMetrics } from "@/lib/measurements";

const SKIN_TONE = "#E8C4A0";
const SKIN_SHADOW = "#D9AF89";

type AvatarFigureProps = {
  measurements: BodyMeasurements;
  width?: number;
  height?: number;
  /** Render garment layers on top of the body, given the same metrics used for the body. */
  renderGarment?: (
    metrics: ReturnType<typeof computeAvatarMetrics>
  ) => React.ReactNode;
  showMeasurementGuides?: boolean;
  className?: string;
};

/**
 * Draws a human-proportioned figure scaled from real body measurements
 * (see lib/measurements.ts → computeAvatarMetrics). Garments are injected
 * via `renderGarment` so this component never needs to know about dresses,
 * shirts, or any other clothing category.
 */
export default function AvatarFigure({
  measurements,
  width = 240,
  height = 480,
  renderGarment,
  showMeasurementGuides = false,
  className,
}: AvatarFigureProps) {
  const m = computeAvatarMetrics(measurements, width, height);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Avatar corporal a escala"
    >
      {/* ── Legs (skin) ── */}
      <path
        d={`
          M ${m.centerX - m.hipHalfWidth * 0.55} ${m.hipY}
          L ${m.centerX - m.legHalfWidth} ${m.ankleY}
          L ${m.centerX - m.legHalfWidth * 0.6} ${m.ankleY}
          L ${m.centerX - m.hipHalfWidth * 0.12} ${m.hipY}
          Z
        `}
        fill={SKIN_TONE}
      />
      <path
        d={`
          M ${m.centerX + m.hipHalfWidth * 0.12} ${m.hipY}
          L ${m.centerX + m.legHalfWidth * 0.6} ${m.ankleY}
          L ${m.centerX + m.legHalfWidth} ${m.ankleY}
          L ${m.centerX + m.hipHalfWidth * 0.55} ${m.hipY}
          Z
        `}
        fill={SKIN_SHADOW}
      />

      {/* ── Arms (skin) ── */}
      <path
        d={`
          M ${m.centerX - m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX - m.shoulderHalfWidth - m.armHalfWidth} ${m.wristY}
          L ${m.centerX - m.shoulderHalfWidth + m.armHalfWidth * 0.4} ${m.wristY}
          L ${m.centerX - m.bustHalfWidth * 0.7} ${m.shoulderY + (m.bustY - m.shoulderY) * 0.5}
          Z
        `}
        fill={SKIN_TONE}
      />
      <path
        d={`
          M ${m.centerX + m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX + m.shoulderHalfWidth + m.armHalfWidth} ${m.wristY}
          L ${m.centerX + m.shoulderHalfWidth - m.armHalfWidth * 0.4} ${m.wristY}
          L ${m.centerX + m.bustHalfWidth * 0.7} ${m.shoulderY + (m.bustY - m.shoulderY) * 0.5}
          Z
        `}
        fill={SKIN_SHADOW}
      />

      {/* ── Torso silhouette (skin, mostly covered by garment) ── */}
      <path
        d={`
          M ${m.centerX - m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX - m.bustHalfWidth} ${m.bustY}
          L ${m.centerX - m.waistHalfWidth} ${m.waistY}
          L ${m.centerX - m.hipHalfWidth} ${m.hipY}
          L ${m.centerX + m.hipHalfWidth} ${m.hipY}
          L ${m.centerX + m.waistHalfWidth} ${m.waistY}
          L ${m.centerX + m.bustHalfWidth} ${m.bustY}
          L ${m.centerX + m.shoulderHalfWidth} ${m.shoulderY}
          Z
        `}
        fill={SKIN_TONE}
        opacity={0.5}
      />

      {/* ── Garment overlay (dress, future: tops/pants) ── */}
      {renderGarment?.(m)}

      {/* ── Neck ── */}
      <rect
        x={m.centerX - m.head.r * 0.45}
        y={m.neckTopY}
        width={m.head.r * 0.9}
        height={Math.max(m.neckBottomY - m.neckTopY, 1)}
        fill={SKIN_TONE}
        rx={m.head.r * 0.15}
      />

      {/* ── Head ── */}
      <ellipse
        cx={m.head.cx}
        cy={m.head.cy}
        rx={m.head.r * 0.82}
        ry={m.head.r}
        fill={SKIN_TONE}
      />
      {/* simple hair silhouette */}
      <path
        d={`
          M ${m.head.cx - m.head.r * 0.85} ${m.head.cy - m.head.r * 0.2}
          Q ${m.head.cx - m.head.r * 0.9} ${m.head.cy - m.head.r * 1.15}
            ${m.head.cx} ${m.head.cy - m.head.r * 1.05}
          Q ${m.head.cx + m.head.r * 0.9} ${m.head.cy - m.head.r * 1.15}
            ${m.head.cx + m.head.r * 0.85} ${m.head.cy - m.head.r * 0.2}
          Q ${m.head.cx + m.head.r * 0.6} ${m.head.cy - m.head.r * 0.6}
            ${m.head.cx} ${m.head.cy - m.head.r * 0.55}
          Q ${m.head.cx - m.head.r * 0.6} ${m.head.cy - m.head.r * 0.6}
            ${m.head.cx - m.head.r * 0.85} ${m.head.cy - m.head.r * 0.2}
          Z
        `}
        fill="#3B2C25"
        opacity={0.85}
      />

      {/* ── Optional measurement guide lines (used on /measurements) ── */}
      {showMeasurementGuides && (
        <g stroke="#C8A96B" strokeWidth={0.6} strokeDasharray="3,3" opacity={0.6}>
          <line x1={8} y1={m.bustY} x2={width - 8} y2={m.bustY} />
          <line x1={8} y1={m.waistY} x2={width - 8} y2={m.waistY} />
          <line x1={8} y1={m.hipY} x2={width - 8} y2={m.hipY} />
        </g>
      )}
    </svg>
  );
}
