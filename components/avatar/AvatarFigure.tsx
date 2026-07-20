"use client";

import type { BodyMeasurements } from "@/lib/measurements";
import { computeAvatarMetrics } from "@/lib/measurements";

type AvatarFigureProps = {
  measurements: BodyMeasurements;
  width?: number;
  height?: number;
  renderGarment?: (
    metrics: ReturnType<typeof computeAvatarMetrics>
  ) => React.ReactNode;
  showMeasurementGuides?: boolean;
  className?: string;
};

/**
 * Draws a human-proportioned figure scaled from real body measurements.
 * Uses SVG gradients for a more realistic, three-dimensional skin tone.
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
  const id = `av-${width}x${height}`; // unique-enough prefix for gradient IDs

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Avatar corporal a escala"
    >
      <defs>
        {/* Body skin – warm mid-tone with subtle light-from-above feel */}
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#E8B48A" />
          <stop offset="50%"  stopColor="#D4956A" />
          <stop offset="100%" stopColor="#C07840" />
        </linearGradient>

        {/* Arm shadow side */}
        <linearGradient id={`${id}-arm-r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#D4956A" />
          <stop offset="100%" stopColor="#B8723E" />
        </linearGradient>

        {/* Face – radial gradient for rounded look */}
        <radialGradient id={`${id}-face`} cx="48%" cy="38%" r="55%">
          <stop offset="0%"   stopColor="#F0C090" />
          <stop offset="70%"  stopColor="#D4956A" />
          <stop offset="100%" stopColor="#C07840" />
        </radialGradient>

        {/* Neck */}
        <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C88050" />
          <stop offset="40%"  stopColor="#E0A878" />
          <stop offset="100%" stopColor="#C88050" />
        </linearGradient>

        {/* Leg left */}
        <linearGradient id={`${id}-leg-l`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%"   stopColor="#D4956A" />
          <stop offset="100%" stopColor="#C07840" />
        </linearGradient>

        {/* Leg right */}
        <linearGradient id={`${id}-leg-r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#D4956A" />
          <stop offset="100%" stopColor="#B86830" />
        </linearGradient>

        {/* Hair */}
        <radialGradient id={`${id}-hair`} cx="50%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#5C3D2A" />
          <stop offset="100%" stopColor="#2A1810" />
        </radialGradient>
      </defs>

      {/* ── Legs (tapered to ankle) ── */}
      <path
        d={`
          M ${m.centerX - m.hipHalfWidth * 0.52} ${m.hipY}
          L ${m.centerX - m.ankleHalfWidth * 1.1} ${m.ankleY}
          L ${m.centerX - m.ankleHalfWidth * 0.4} ${m.ankleY}
          L ${m.centerX - m.hipHalfWidth * 0.1}  ${m.hipY}
          Z
        `}
        fill={`url(#${id}-leg-l)`}
      />
      <path
        d={`
          M ${m.centerX + m.hipHalfWidth * 0.1}  ${m.hipY}
          L ${m.centerX + m.ankleHalfWidth * 0.4} ${m.ankleY}
          L ${m.centerX + m.ankleHalfWidth * 1.1} ${m.ankleY}
          L ${m.centerX + m.hipHalfWidth * 0.52} ${m.hipY}
          Z
        `}
        fill={`url(#${id}-leg-r)`}
      />

      {/* ── Arms ── */}
      <path
        d={`
          M ${m.centerX - m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX - m.shoulderHalfWidth - m.armHalfWidth} ${m.wristY}
          L ${m.centerX - m.shoulderHalfWidth + m.armHalfWidth * 0.4} ${m.wristY}
          L ${m.centerX - m.bustHalfWidth * 0.7} ${m.shoulderY + (m.bustY - m.shoulderY) * 0.5}
          Z
        `}
        fill={`url(#${id}-body)`}
      />
      <path
        d={`
          M ${m.centerX + m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX + m.shoulderHalfWidth + m.armHalfWidth} ${m.wristY}
          L ${m.centerX + m.shoulderHalfWidth - m.armHalfWidth * 0.4} ${m.wristY}
          L ${m.centerX + m.bustHalfWidth * 0.7} ${m.shoulderY + (m.bustY - m.shoulderY) * 0.5}
          Z
        `}
        fill={`url(#${id}-arm-r)`}
      />

      {/* ── Torso silhouette ── */}
      <path
        d={`
          M ${m.centerX - m.shoulderHalfWidth} ${m.shoulderY}
          L ${m.centerX - m.bustHalfWidth}     ${m.bustY}
          L ${m.centerX - m.waistHalfWidth}    ${m.waistY}
          L ${m.centerX - m.hipHalfWidth}      ${m.hipY}
          L ${m.centerX + m.hipHalfWidth}      ${m.hipY}
          L ${m.centerX + m.waistHalfWidth}    ${m.waistY}
          L ${m.centerX + m.bustHalfWidth}     ${m.bustY}
          L ${m.centerX + m.shoulderHalfWidth} ${m.shoulderY}
          Z
        `}
        fill={`url(#${id}-body)`}
        opacity={0.55}
      />

      {/* ── Garment overlay ── */}
      {renderGarment?.(m)}

      {/* ── Neck (accurate width from measurement) ── */}
      <rect
        x={m.centerX - m.neckHalfWidth}
        y={m.neckTopY}
        width={m.neckHalfWidth * 2}
        height={Math.max(m.neckBottomY - m.neckTopY, 1)}
        fill={`url(#${id}-neck)`}
        rx={m.neckHalfWidth * 0.3}
      />

      {/* ── Head ── */}
      <ellipse
        cx={m.head.cx}
        cy={m.head.cy}
        rx={m.head.r * 0.82}
        ry={m.head.r}
        fill={`url(#${id}-face)`}
      />

      {/* Jawline shadow */}
      <ellipse
        cx={m.head.cx}
        cy={m.head.cy + m.head.r * 0.75}
        rx={m.head.r * 0.68}
        ry={m.head.r * 0.22}
        fill="#B06030"
        opacity={0.18}
      />

      {/* ── Hair ── */}
      <path
        d={`
          M ${m.head.cx - m.head.r * 0.85} ${m.head.cy - m.head.r * 0.15}
          Q ${m.head.cx - m.head.r * 0.95} ${m.head.cy - m.head.r * 1.2}
            ${m.head.cx}                   ${m.head.cy - m.head.r * 1.08}
          Q ${m.head.cx + m.head.r * 0.95} ${m.head.cy - m.head.r * 1.2}
            ${m.head.cx + m.head.r * 0.85} ${m.head.cy - m.head.r * 0.15}
          Q ${m.head.cx + m.head.r * 0.55} ${m.head.cy - m.head.r * 0.5}
            ${m.head.cx}                   ${m.head.cy - m.head.r * 0.48}
          Q ${m.head.cx - m.head.r * 0.55} ${m.head.cy - m.head.r * 0.5}
            ${m.head.cx - m.head.r * 0.85} ${m.head.cy - m.head.r * 0.15}
          Z
        `}
        fill={`url(#${id}-hair)`}
      />

      {/* ── Facial features ── */}
      {/* Left eye */}
      <ellipse
        cx={m.head.cx - m.head.r * 0.28}
        cy={m.head.cy - m.head.r * 0.05}
        rx={m.head.r * 0.14}
        ry={m.head.r * 0.09}
        fill="#2A1810"
      />
      <ellipse
        cx={m.head.cx - m.head.r * 0.28}
        cy={m.head.cy - m.head.r * 0.05}
        rx={m.head.r * 0.05}
        ry={m.head.r * 0.05}
        fill="#fff"
        opacity={0.5}
      />
      {/* Right eye */}
      <ellipse
        cx={m.head.cx + m.head.r * 0.28}
        cy={m.head.cy - m.head.r * 0.05}
        rx={m.head.r * 0.14}
        ry={m.head.r * 0.09}
        fill="#2A1810"
      />
      <ellipse
        cx={m.head.cx + m.head.r * 0.28}
        cy={m.head.cy - m.head.r * 0.05}
        rx={m.head.r * 0.05}
        ry={m.head.r * 0.05}
        fill="#fff"
        opacity={0.5}
      />

      {/* Eyebrows */}
      <path
        d={`M ${m.head.cx - m.head.r * 0.38} ${m.head.cy - m.head.r * 0.2}
            Q ${m.head.cx - m.head.r * 0.28} ${m.head.cy - m.head.r * 0.24}
              ${m.head.cx - m.head.r * 0.18} ${m.head.cy - m.head.r * 0.2}`}
        stroke="#4A2E1C" strokeWidth={m.head.r * 0.05} fill="none" strokeLinecap="round"
      />
      <path
        d={`M ${m.head.cx + m.head.r * 0.18} ${m.head.cy - m.head.r * 0.2}
            Q ${m.head.cx + m.head.r * 0.28} ${m.head.cy - m.head.r * 0.24}
              ${m.head.cx + m.head.r * 0.38} ${m.head.cy - m.head.r * 0.2}`}
        stroke="#4A2E1C" strokeWidth={m.head.r * 0.05} fill="none" strokeLinecap="round"
      />

      {/* Nose */}
      <ellipse
        cx={m.head.cx}
        cy={m.head.cy + m.head.r * 0.18}
        rx={m.head.r * 0.07}
        ry={m.head.r * 0.045}
        fill="#C07050"
        opacity={0.45}
      />

      {/* Mouth */}
      <path
        d={`M ${m.head.cx - m.head.r * 0.2} ${m.head.cy + m.head.r * 0.38}
            Q ${m.head.cx}                   ${m.head.cy + m.head.r * 0.46}
              ${m.head.cx + m.head.r * 0.2}  ${m.head.cy + m.head.r * 0.38}`}
        stroke="#B06040" strokeWidth={m.head.r * 0.06} fill="none" strokeLinecap="round"
      />

      {/* ── Optional measurement guide lines ── */}
      {showMeasurementGuides && (
        <g stroke="#C8A96B" strokeWidth={0.6} strokeDasharray="3,3" opacity={0.6}>
          <line x1={8} y1={m.bustY}  x2={width - 8} y2={m.bustY}  />
          <line x1={8} y1={m.waistY} x2={width - 8} y2={m.waistY} />
          <line x1={8} y1={m.hipY}   x2={width - 8} y2={m.hipY}   />
        </g>
      )}
    </svg>
  );
}
