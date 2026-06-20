"use client";

/**
 * AvatarFigure3D – maniquí 3D construido con Three.js a partir de medidas reales.
 *
 * Geometría:
 *  - Torso:  LatheGeometry suavizado con CatmullRomCurve (perfil "centripetal")
 *            + escala elíptica (más ancho que profundo, como un torso real)
 *  - Cabeza: SphereGeometry escalada + pelo + ojos
 *  - Brazos: LatheGeometry con curva de bíceps/antebrazo (no son conos rectos)
 *  - Piernas: LatheGeometry con curva de cuádriceps/pantorrilla + pie
 *
 * Todas las dimensiones se derivan de las medidas del usuario (en cm).
 *
 * Nota sobre el techo de realismo de este enfoque: al estar construido con
 * primitivas (lathe + esferas de articulación), siempre habrá una unión
 * visible entre piezas, aunque se disimule con las esferas de empalme.
 * Para eliminarla por completo se necesitaría una malla base humana con
 * "morph targets" en vez de piezas separadas.
 */

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { BodyMeasurements } from "@/lib/measurements";

/** Circunferencia (cm) → radio 3D (cm) para sección circular */
function cToR(circ: number): number {
  return circ / (2 * Math.PI);
}

type Props = {
  measurements: BodyMeasurements;
  width?: number;
  height?: number;
  className?: string;
};

export default function AvatarFigure3D({
  measurements,
  width = 380,
  height = 500,
  className,
}: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Limpia la escena anterior (medidas cambiaron)
    disposeRef.current?.();
    setLoading(true);

    const container = mountRef.current;
    let cancelled   = false;

    Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
    ]).then(([THREEMod, { OrbitControls }]) => {
      if (cancelled || !container.isConnected) return;
      const THREE = THREEMod;

      /* ──────────────────────────────────────────────
         MEDIDAS → unidades Three.js  (1 unit = 1 cm)
         ────────────────────────────────────────────── */
      const H       = Math.max(Number(measurements.height)    || 165, 120);
      const neckR   = cToR(Number(measurements.neck)          || 34);
      const bustR   = cToR(Number(measurements.bust)          || 92);
      const uBustR  = cToR(Number(measurements.underBust)     || 80);
      const waistR  = cToR(Number(measurements.waist)         || 72);
      const hipsR   = cToR(Number(measurements.hips)          || 96);
      const thighR  = cToR(Number(measurements.thigh)         || 55);
      const calfR   = cToR(Number(measurements.calf)          || 36);
      const ankleR  = cToR(Number(measurements.ankle)         || 22);
      const bicepsR = cToR(Number(measurements.biceps)        || 28);
      const wristR  = cToR(Number(measurements.wrist)         || 16);
      const shldrHW = (Number(measurements.shoulders)         || 40) / 2;
      const armLen  = Number(measurements.armLength)          || 56;

      /* Alturas en cm desde el suelo (Y = 0) */
      const ANKLE_Y  = H * 0.035;
      const KNEE_Y   = H * 0.255;
      const CROTCH_Y = H * 0.475;
      const HIP_Y    = H * 0.500;
      const WAIST_Y  = H * 0.600;
      const UBUST_Y  = H * 0.650;
      const BUST_Y   = H * 0.730;
      const ARMPIT_Y = H * 0.800;
      const SHLDR_Y  = H * 0.845;
      const NBOT_Y   = H * 0.858;
      const NTOP_Y   = H * 0.878;

      const HEAD_R   = H / 15.0;
      const HEAD_Y   = H - HEAD_R;           // centro de la cabeza

      /* Brazos */
      const U_ARM_LEN  = armLen * 0.44;
      const F_ARM_LEN  = armLen * 0.56;
      const ELBOW_Y    = SHLDR_Y - U_ARM_LEN;
      const WRIST_Y    = ELBOW_Y - F_ARM_LEN;

      /* ──────────────────────────────────────────────
         FACTORES DE FORMA ELÍPTICA
         El torso/extremidades humanas son más anchos (X) que profundos (Z),
         no círculos perfectos. Se preserva aprox. el radio promedio
         (X*Z ≈ 1) para no alterar demasiado el "tamaño" derivado de la
         circunferencia real.
         ────────────────────────────────────────────── */
      const TORSO_X = 1.13, TORSO_Z = 0.85;   // pecho/cintura/cadera
      const ARM_X   = 1.05, ARM_Z   = 0.92;   // brazos, leve achatado
      const LEG_X   = 1.10, LEG_Z   = 0.90;   // muslos/pantorrillas

      /* ──────────────────────────────────────────────
         ESCENA
         ────────────────────────────────────────────── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f2ed);

      /* Cámara */
      const cam = new THREE.PerspectiveCamera(38, width / height, 0.5, H * 12);
      cam.position.set(0, H * 0.55, H * 2.1);
      cam.lookAt(0, H * 0.55, 0);

      /* Renderer */
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      /* Controles */
      const controls = new OrbitControls(cam, renderer.domElement);
      controls.target.set(0, H * 0.55, 0);
      controls.enableDamping  = true;
      controls.dampingFactor  = 0.07;
      controls.minDistance    = H * 0.6;
      controls.maxDistance    = H * 3.5;
      controls.minPolarAngle  = 0.1;
      controls.maxPolarAngle  = Math.PI * 0.92;

      /* ──────────────────────────────────────────────
         ILUMINACIÓN (clave + relleno + rebote)
         ────────────────────────────────────────────── */
      scene.add(new THREE.AmbientLight(0xfff0e0, 0.75));

      const key = new THREE.DirectionalLight(0xfffaf3, 1.5);
      key.position.set(H * 0.5, H * 1.8, H * 1.0);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.near   = 1;
      key.shadow.camera.far    = H * 5;
      key.shadow.camera.left   = -H * 0.8;
      key.shadow.camera.right  =  H * 0.8;
      key.shadow.camera.top    =  H * 2.2;
      key.shadow.camera.bottom = -H * 0.1;
      key.shadow.bias          = -0.001;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffd8b8, 0.55);
      fill.position.set(-H * 0.7, H * 0.9, H * 0.6);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffeedd, 0.28);
      rim.position.set(0, H * 0.5, -H * 1.2);
      scene.add(rim);

      /* ──────────────────────────────────────────────
         MATERIALES
         MeshPhysicalMaterial con un toque de "sheen" para que la piel
         tenga un brillo suave en los bordes, en vez del aspecto plano
         de MeshStandardMaterial.
         ────────────────────────────────────────────── */
      const skinMat = new THREE.MeshPhysicalMaterial({
        color:            new THREE.Color(0xd4956a),
        roughness:        0.55,
        metalness:        0.0,
        clearcoat:        0.05,
        clearcoatRoughness: 0.6,
        sheen:            0.18,
        sheenColor:       new THREE.Color(0xffe0c2),
        sheenRoughness:   0.7,
      });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.95 });
      const eyeMat  = new THREE.MeshStandardMaterial({ color: 0x0e0805, roughness: 0.35 });
      const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f0ea, roughness: 0.4 });
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xe0d8ce, roughness: 1.0 });

      /* Utilidad para crear y agregar un Mesh */
      function mkMesh(
        geo : THREE.BufferGeometry,
        mat : THREE.Material,
        pos?: [number, number, number],
        scl?: [number, number, number],
      ) {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow    = true;
        m.receiveShadow = true;
        if (pos) m.position.set(...pos);
        if (scl) m.scale.set(...scl);
        scene.add(m);
        return m;
      }

      /** Genera una LatheGeometry suavizada a partir de pocos puntos de
       *  control [radio, alturaLocal]. Útil para extremidades con curva de
       *  músculo (bíceps, pantorrilla, etc) — perfectamente simétricas en
       *  revolución, no necesitan variar por ángulo. */
      function lathe(points: THREE.Vector3[], radialSegments = 32, samples = 40) {
        const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
        const pts = curve
          .getPoints(samples)
          .map((p: THREE.Vector3) => new THREE.Vector2(Math.max(0.02, p.x), p.y));
        return new THREE.LatheGeometry(pts, radialSegments);
      }

      /* ──────────────────────────────────────────────
         SUPERFICIE RADIAL CON FORMA POR ÁNGULO
         A diferencia de LatheGeometry (radio uniforme en 360°), el torso
         real NO es simétrico de adelante hacia atrás: el pecho/busto
         sobresale al frente, los glúteos hacia atrás, y hay una concavidad
         bajo la axila. Esta función construye una malla donde el radio
         depende tanto de la altura (y) como del ángulo (theta), generando
         esos rasgos. La triangulación/orden de vértices replica
         exactamente la de THREE.LatheGeometry para garantizar normales
         hacia afuera correctas.
         ────────────────────────────────────────────── */
      function gauss(x: number, width: number): number {
        return Math.exp(-(x * x) / (2 * width * width));
      }

      function angleDiff(a: number, b: number): number {
        let d = a - b;
        while (d >  Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
      }

      type HeightSample = { y: number; baseR: number };

      function buildRadialSurface(
        samples: HeightSample[],
        thetaSegments: number,
        radiusFn: (theta: number, y: number, baseR: number) => number,
      ): THREE.BufferGeometry {
        const HCOUNT = samples.length;
        const positions: number[] = [];

        // Mismo convenio que THREE.LatheGeometry: x = r·sin(θ), z = r·cos(θ).
        // θ=0 → z positivo (frente, hacia la cámara). θ=π → atrás.
        // θ=±π/2 → lados (donde va el brazo).
        for (let i = 0; i <= thetaSegments; i++) {
          const theta = (i / thetaSegments) * Math.PI * 2;
          const sin = Math.sin(theta);
          const cos = Math.cos(theta);
          for (let j = 0; j < HCOUNT; j++) {
            const { y, baseR } = samples[j];
            const r = radiusFn(theta, y, baseR);
            positions.push(r * sin, y, r * cos);
          }
        }

        const indices: number[] = [];
        for (let i = 0; i < thetaSegments; i++) {
          for (let j = 0; j < HCOUNT - 1; j++) {
            const base = j + i * HCOUNT;
            const a = base;
            const b = base + HCOUNT;
            const c = base + HCOUNT + 1;
            const d = base + 1;
            indices.push(a, b, d);
            indices.push(c, d, b);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
      }

      /* ──────────────────────────────────────────────
         TORSO
         Puntos de control: [radio, alturaY] en el plano XY
         ────────────────────────────────────────────── */
      const torsoCtrl: THREE.Vector3[] = [
        // de abajo (entrepierna) hacia arriba (cuello)
        new THREE.Vector3(hipsR  * 0.32, CROTCH_Y - H * 0.015, 0), // cierre inferior
        new THREE.Vector3(hipsR  * 0.66, CROTCH_Y,              0),
        new THREE.Vector3(hipsR  * 0.92, HIP_Y - H * 0.025,   0),
        new THREE.Vector3(hipsR,          HIP_Y,                 0),
        new THREE.Vector3(hipsR  * 0.94, HIP_Y + H * 0.035,    0),
        new THREE.Vector3(waistR * 1.02, WAIST_Y - H * 0.01,   0),
        new THREE.Vector3(waistR,         WAIST_Y,               0),
        new THREE.Vector3(uBustR,         UBUST_Y,               0),
        new THREE.Vector3(bustR,          BUST_Y,                0),
        new THREE.Vector3(bustR  * 0.94, ARMPIT_Y - H * 0.015, 0),
        new THREE.Vector3(bustR  * 0.78, ARMPIT_Y,              0),
        new THREE.Vector3(shldrHW * 1.05, SHLDR_Y - H * 0.012, 0),
        new THREE.Vector3(shldrHW,        SHLDR_Y,               0),
        new THREE.Vector3(shldrHW * 0.72, SHLDR_Y + H * 0.012, 0),
        new THREE.Vector3(neckR  * 1.35, NBOT_Y,                0),
        new THREE.Vector3(neckR,          NTOP_Y,                0),
      ];

      // Ángulos de referencia (convenio θ=0 → frente, ver buildRadialSurface)
      const FRONT  = 0;
      const BACK   = Math.PI;
      const SIDE_R = Math.PI / 2;
      const SIDE_L = -Math.PI / 2;

      // Compensan que el pecho/glúteo actúan sobre todo en Z (profundidad,
      // achatada por TORSO_Z) y la axila sobre todo en X (ancho, estirado
      // por TORSO_X) — sin esto, al aplicar la escala elíptica del torso
      // los bultos se verían más débiles/fuertes de lo previsto.
      const DEPTH_COMP = 1 / TORSO_Z;
      const WIDTH_COMP = 1 / TORSO_X;

      const isFemale = measurements.bodyType !== "hombre";

      function torsoShapeRadius(theta: number, y: number, baseR: number): number {
        let r = baseR;

        // ---- Pecho / busto ----
        // El tipo de cuerpo decide la FORMA (busto vs. pectorales);
        // "cupDepth" (diferencia busto/bajo-busto) decide qué tan
        // pronunciada se ve, en ambos casos.
        const cupDepth = Math.max(0, bustR - uBustR);
        if (!isFemale) {
          // Pectorales: dos lóbulos sutiles a cada lado del esternón
          const amt = (cupDepth * 0.9 + 0.55) * DEPTH_COMP;
          r += amt * gauss(angleDiff(theta, FRONT - 0.34), 0.22) * gauss(y - BUST_Y, H * 0.045);
          r += amt * gauss(angleDiff(theta, FRONT + 0.34), 0.22) * gauss(y - BUST_Y, H * 0.045);
          r -= 0.35 * DEPTH_COMP * gauss(angleDiff(theta, FRONT), 0.12) * gauss(y - BUST_Y, H * 0.04);
        } else {
          // Busto: masa frontal llena, más redondeada por debajo del pico
          // que por arriba (silueta típica de seno). Incluso con cupDepth
          // chico mantiene esta forma (solo cambia de tamaño), en vez de
          // saltar a la forma de pectorales.
          const dy = y - (BUST_Y - H * 0.008);
          const gy = dy >= 0 ? gauss(dy, H * 0.032) : gauss(dy, H * 0.05);
          const gt = gauss(angleDiff(theta, FRONT), 0.50);
          r += (cupDepth * 1.25 + 0.6) * DEPTH_COMP * gt * gy;
        }

        // ---- Glúteos ----
        // Ligeramente más prominentes en silueta femenina, más planos en
        // masculina — sobre la misma base real (medidas de cadera/cintura).
        const gluteBase = Math.max(0, (hipsR - waistR) * 0.5 + 1.1);
        const gluteAmt  = gluteBase * (isFemale ? 1.18 : 0.85) * DEPTH_COMP;
        const gluteY    = HIP_Y - H * 0.012;
        r += gluteAmt        * gauss(angleDiff(theta, BACK),  0.60) * gauss(y - gluteY, H * 0.048);
        r -= gluteAmt * 0.32 * gauss(angleDiff(theta, FRONT), 0.55) * gauss(y - gluteY, H * 0.045);

        // ---- Arco de la axila (concavidad bajo el brazo) ----
        const armpitDent = (shldrHW * 0.16 + 0.9) * WIDTH_COMP;
        const armpitY     = (ARMPIT_Y + SHLDR_Y) / 2;
        r -= armpitDent * gauss(angleDiff(theta, SIDE_R), 0.30) * gauss(y - armpitY, H * 0.026);
        r -= armpitDent * gauss(angleDiff(theta, SIDE_L), 0.30) * gauss(y - armpitY, H * 0.026);

        return Math.max(r, baseR * 0.55, 1);
      }

      const torsoSamples: HeightSample[] = new THREE.CatmullRomCurve3(torsoCtrl, false, "centripetal")
        .getPoints(180)
        .map((p: THREE.Vector3) => ({ y: p.y, baseR: Math.max(0.02, p.x) }));

      const torsoMesh = mkMesh(buildRadialSurface(torsoSamples, 96, torsoShapeRadius), skinMat);
      torsoMesh.scale.set(TORSO_X, 1, TORSO_Z);

      /* ──────────────────────────────────────────────
         CABEZA
         ────────────────────────────────────────────── */
      // Cráneo
      mkMesh(
        new THREE.SphereGeometry(HEAD_R, 48, 48),
        skinMat,
        [0, HEAD_Y, 0],
        [0.83, 1.0, 0.89],
      );

      // Sombra mandíbula (elipsoide aplastado)
      const jawMat = new THREE.MeshStandardMaterial({
        color:     0xb87848,
        roughness: 0.8,
        transparent: true,
        opacity: 0.25,
      });
      mkMesh(
        new THREE.SphereGeometry(HEAD_R * 0.72, 32, 32),
        jawMat,
        [0, HEAD_Y - HEAD_R * 0.7, 0],
        [0.9, 0.35, 0.85],
      );

      // Pelo (semiesfera)
      const hairGeo = new THREE.SphereGeometry(
        HEAD_R * 1.02, 48, 48,
        0, Math.PI * 2,   // phi completo
        0, Math.PI * 0.58 // solo la parte superior
      );
      mkMesh(hairGeo, hairMat, [0, HEAD_Y, 0], [0.85, 1.03, 0.91]);

      // Ojos (esclerótica + iris)
      const eyeW  = HEAD_R * 0.13;
      const eyeZ  = HEAD_R * 0.82 * 0.89 * 0.97;
      const eyeY  = HEAD_Y - HEAD_R * 0.06;
      const eyeXL = -HEAD_R * 0.27;
      const eyeXR =  HEAD_R * 0.27;

      mkMesh(new THREE.SphereGeometry(eyeW, 16, 16), eyeWhiteMat,
             [eyeXL, eyeY, eyeZ], [1, 0.75, 0.55]);
      mkMesh(new THREE.SphereGeometry(eyeW * 0.62, 16, 16), eyeMat,
             [eyeXL, eyeY, eyeZ + eyeW * 0.55]);

      mkMesh(new THREE.SphereGeometry(eyeW, 16, 16), eyeWhiteMat,
             [eyeXR, eyeY, eyeZ], [1, 0.75, 0.55]);
      mkMesh(new THREE.SphereGeometry(eyeW * 0.62, 16, 16), eyeMat,
             [eyeXR, eyeY, eyeZ + eyeW * 0.55]);

      // Cejas (cajas pequeñas inclinadas)
      const browMat = new THREE.MeshStandardMaterial({ color: 0x3a2215, roughness: 1 });
      const browGeo = new THREE.BoxGeometry(HEAD_R * 0.32, HEAD_R * 0.05, HEAD_R * 0.04);
      [-1, 1].forEach((side) => {
        const brow = new THREE.Mesh(browGeo, browMat);
        brow.position.set(side * HEAD_R * 0.27 * 0.83, eyeY + HEAD_R * 0.18, eyeZ);
        brow.rotation.z = side * 0.08;
        scene.add(brow);
      });

      /* ──────────────────────────────────────────────
         BRAZOS  (lathe con curva de bíceps/antebrazo, pose A)
         ────────────────────────────────────────────── */
      const ARM_TILT = 0.16; // rad, ligera apertura tipo "pose A"

      // El hombro real (silueta ya escalada por TORSO_X) define dónde
      // arrancan brazo y bola de empalme — así no quedan huecos.
      const shoulderEdgeX = shldrHW * TORSO_X;

      [-1, 1].forEach((side) => {
        const ax = (shoulderEdgeX + bicepsR * 0.55) * side;

        // Bola de hombro → ahora una "cápsula" (esfera alargada
        // verticalmente): cubre mucho más superficie de la costura entre
        // el torso y el brazo que una esfera perfecta, que solo toca un
        // punto. Levemente más grande en silueta masculina.
        mkMesh(
          new THREE.SphereGeometry(bicepsR * (isFemale ? 1.12 : 1.22), 28, 28),
          skinMat,
          [shoulderEdgeX * side * 0.90, SHLDR_Y - bicepsR * 0.35, 0],
          [1, 1.55, 1],
        );

        // Brazo superior: bíceps abultado cerca del hombro, se afina al codo
        const upperProfile = [
          new THREE.Vector3(bicepsR * 1.00,  U_ARM_LEN / 2,         0),
          new THREE.Vector3(bicepsR * 1.10,  U_ARM_LEN * 0.18,      0),
          new THREE.Vector3(bicepsR * 0.88, -U_ARM_LEN * 0.22,      0),
          new THREE.Vector3(bicepsR * 0.74, -U_ARM_LEN / 2,         0),
        ];
        const upperArm = mkMesh(
          lathe(upperProfile, 32, 36),
          skinMat,
          [ax, (SHLDR_Y + ELBOW_Y) / 2, 0],
          [ARM_X, 1, ARM_Z],
        );
        upperArm.rotation.z = -side * ARM_TILT;

        // Bola de codo → también alargada, cubre más costura
        mkMesh(
          new THREE.SphereGeometry(bicepsR * 0.86, 24, 24),
          skinMat,
          [ax + Math.sin(-side * ARM_TILT) * (U_ARM_LEN / 2), ELBOW_Y, 0],
          [1, 1.35, 1],
        );

        // Antebrazo: más grueso cerca del codo, se afina hacia la muñeca
        const lowerProfile = [
          new THREE.Vector3(bicepsR * 0.72,  F_ARM_LEN / 2,         0),
          new THREE.Vector3(bicepsR * 0.60,  F_ARM_LEN * 0.15,      0),
          new THREE.Vector3(bicepsR * 0.40, -F_ARM_LEN * 0.35,      0),
          new THREE.Vector3(wristR,         -F_ARM_LEN / 2,         0),
        ];
        const lowerArm = mkMesh(
          lathe(lowerProfile, 32, 36),
          skinMat,
          [ax + Math.sin(-side * ARM_TILT) * (U_ARM_LEN / 2), (ELBOW_Y + WRIST_Y) / 2, 0],
          [ARM_X, 1, ARM_Z],
        );
        lowerArm.rotation.z = -side * ARM_TILT * 0.5;

        // Mano
        mkMesh(
          new THREE.SphereGeometry(wristR * 1.35, 24, 24),
          skinMat,
          [ax + Math.sin(-side * ARM_TILT) * (U_ARM_LEN / 2 + F_ARM_LEN / 2), WRIST_Y - wristR * 1.05, 0],
          [1.25, 0.72, 0.62],
        );
      });

      /* ──────────────────────────────────────────────
         PIERNAS  (lathe con curva de cuádriceps/pantorrilla)
         ────────────────────────────────────────────── */
      const hipEdgeX   = hipsR * TORSO_X * 0.40;
      // Empieza más arriba, bien adentro del torso, para que el muslo se
      // solape de sobra con él y la bola de cadera tape toda la transición.
      const THIGH_TOP  = CROTCH_Y + H * 0.028;
      const THIGH_LEN  = KNEE_Y  - THIGH_TOP;
      const CALF_LEN   = KNEE_Y  - ANKLE_Y;

      [-1, 1].forEach((side) => {
        const lx = hipEdgeX * side;

        // Bola de cadera: debe ser AL MENOS tan ancha como el tope del
        // muslo (thighR), nunca más angosta — si es más angosta crea un
        // "pellizco" justo donde empieza la pierna y luego, al llegar al
        // bulto del cuádriceps, se ve como si la pierna fuera de menor a
        // mayor en vez de ir afinándose hacia la rodilla.
        mkMesh(
          new THREE.SphereGeometry(thighR * 1.10, 28, 28),
          skinMat,
          [lx * 0.88, THIGH_TOP - thighR * 0.25, 0],
          [1, 1.6, 1],
        );

        // Muslo: el bulto del cuádriceps se ubica cerca de la cadera (no
        // en medio del muslo), así la silueta se afina de forma continua
        // hacia la rodilla en vez de "pellizcar y luego inflar".
        const thighProfile = [
          new THREE.Vector3(thighR * 1.02,         THIGH_LEN / 2,        0),
          new THREE.Vector3(thighR * 1.05,         THIGH_LEN * 0.62,     0),
          new THREE.Vector3(thighR * 0.82,        -THIGH_LEN * 0.25,     0),
          new THREE.Vector3(calfR  * 1.10,        -THIGH_LEN / 2,        0),
        ];
        mkMesh(
          lathe(thighProfile, 36, 40),
          skinMat,
          [lx, (THIGH_TOP + KNEE_Y) / 2, 0],
          [LEG_X, 1, LEG_Z],
        );

        // Rótula (esfera aplastada con algo más de altura para tapar bien
        // la costura entre muslo y pantorrilla)
        mkMesh(
          new THREE.SphereGeometry(calfR * 0.96, 28, 28),
          skinMat,
          [lx, KNEE_Y, 0],
          [1.0, 0.82, 1.0],
        );

        // Pantorrilla: bulto de gemelo cerca de la rodilla, se afina al tobillo
        const calfProfile = [
          new THREE.Vector3(calfR  * 0.96,  CALF_LEN / 2,         0),
          new THREE.Vector3(calfR  * 1.16,  CALF_LEN * 0.22,      0),
          new THREE.Vector3(calfR  * 0.55, -CALF_LEN * 0.40,      0),
          new THREE.Vector3(ankleR,        -CALF_LEN / 2,         0),
        ];
        mkMesh(
          lathe(calfProfile, 32, 36),
          skinMat,
          [lx, (ANKLE_Y + KNEE_Y) / 2, 0],
          [LEG_X, 1, LEG_Z],
        );

        // Tobillo: bola alargada para suavizar la unión con el pie
        mkMesh(
          new THREE.SphereGeometry(ankleR * 1.0, 22, 22),
          skinMat,
          [lx, ANKLE_Y, ankleR * 0.3],
          [1, 1.3, 1],
        );

        // Pie (caja redondeada)
        const footGeo = new THREE.BoxGeometry(
          ankleR * 2.4,
          ankleR * 0.85,
          ankleR * 3.8,
        );
        const foot = new THREE.Mesh(footGeo, skinMat);
        foot.castShadow    = true;
        foot.receiveShadow = true;
        foot.position.set(lx, ANKLE_Y - ankleR * 0.42, ankleR * 1.1);
        scene.add(foot);
      });

      /* ──────────────────────────────────────────────
         SUELO
         ────────────────────────────────────────────── */
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(H * 0.75, 48),
        floorMat,
      );
      floor.rotation.x    = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      /* Sombra suave difusa bajo los pies */
      const blobMat = new THREE.MeshStandardMaterial({
        color: 0x9c8878,
        transparent: true,
        opacity: 0.18,
      });
      mkMesh(
        new THREE.CircleGeometry(hipsR * 0.65, 32),
        blobMat,
        [0, 0.5, 0],
        [1, 1, 1],
      );
      const blob = scene.children[scene.children.length - 1] as THREE.Mesh;
      blob.rotation.x = -Math.PI / 2;

      /* ──────────────────────────────────────────────
         LOOP DE ANIMACIÓN
         ────────────────────────────────────────────── */
      let animId = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, cam);
      }
      animate();
      setLoading(false);

      /* ──────────────────────────────────────────────
         LIMPIEZA
         ────────────────────────────────────────────── */
      disposeRef.current = () => {
        cancelAnimationFrame(animId);
        controls.dispose();

        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              (mesh.material as THREE.Material).dispose();
            }
          }
        });

        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        disposeRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      disposeRef.current?.();
      setLoading(false);
    };
  }, [measurements, width, height]);

  return (
    <div style={{ position: "relative", width, height }} className={className}>
      {/* Canvas de Three.js se inserta aquí */}
      <div ref={mountRef} style={{ width, height }} />

      {/* Spinner mientras carga */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f2ed",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "3px solid #e0d4c4",
              borderTopColor: "#8b6a50",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "#9e8878" }}>Cargando avatar…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Hint de interacción */}
      {!loading && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            color: "#b0a090",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          arrastra para girar · scroll para zoom
        </div>
      )}
    </div>
  );
}