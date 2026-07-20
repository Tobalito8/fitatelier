import type { AvatarMetrics } from "@/lib/measurements";
import { FABRICS, buildDressPaths, type DressDesign } from "@/lib/garments";

/**
 * Capa SVG del vestido, anclada a las métricas reales del avatar
 * (`AvatarMetrics`) para que la prenda siempre calce el cuerpo debajo,
 * en vez de flotar con tamaños fijos. Se dibuja dentro del <svg> del avatar.
 */
export default function DressOverlay({
  design,
  metrics,
}: {
  design: DressDesign;
  metrics: AvatarMetrics;
}) {
  const { bodicePath, skirtPath, leftSleeve, rightSleeve } = buildDressPaths(design, metrics);
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
      {/* Mangas primero, para que el corpiño solape ligeramente la costura del hombro */}
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
