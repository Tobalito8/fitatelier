# FitAtelier

Diseña vestidos a la medida sobre un **modelo de tu cuerpo a escala** y exporta
el patrón para confeccionarlo.

El flujo es: **medir → diseñar → exportar patrón → confeccionar**.

## Cómo funciona

1. **Medidas** (`/measurements`) — capturas tu perfil corporal (o estimas
   algunas medidas lineales desde una foto con MediaPipe, 100% en el navegador).
2. **Diseñador** (`/designer`) — eliges escote, mangas, falda, tela y color
   sobre un avatar generado a tu escala real; ves el precio al instante.
3. **Carrito y pedidos** (`/cart`, `/orders`) — agregas diseños y generas el
   pedido.
4. **Exportar patrón** _(en construcción — Fase 2)_ — genera las piezas planas
   del vestido a tamaño real (SVG/PDF) listas para imprimir y cortar.

## Estructura

```
app/                  rutas (App Router). El layout raíz monta header/footer
                      globales y el ShopProvider.
components/
  ui/                 primitivas shadcn/ui
  layout/             SiteHeader, SiteFooter, Sidebar
  avatar/             avatar 2D (SVG) y 3D (Three.js / GLTF) + medición por foto
  designer/           overlay del vestido y controles del diseñador
  dashboard/          tarjetas del panel
lib/
  measurements.ts     tipos de medidas, persistencia y geometría del avatar
  garments.ts         catálogo de prendas y trazado del vestido en SVG
  avatarMapping.ts    medidas (cm) → morph targets del modelo 3D
  poseEstimation.ts   estimación de medidas desde foto (MediaPipe)
  store/shop.tsx      estado de carrito y pedidos (React Context + localStorage)
  utils.ts            helpers (cn)
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Three.js · @mediapipe/tasks-vision.
