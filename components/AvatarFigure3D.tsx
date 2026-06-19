"use client";

/**
 * AvatarFigure3D – maniquí 3D construido con Three.js a partir de medidas reales.
 *
 * Geometría:
 *  - Torso:  LatheGeometry suavizado con CatmullRomCurve para forma de reloj de arena real
 *  - Cabeza: SphereGeometry escalada + pelo + ojos
 *  - Brazos: CylinderGeometry cónicos (bíceps → muñeca)
 *  - Piernas: CylinderGeometry cónicos (muslo → tobillo) + pie
 *
 * Todas las dimensiones se derivan de las medidas del usuario (en cm).
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
         ────────────────────────────────────────────── */
      const skinMat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(0xd4956a),
        roughness: 0.60,
        metalness: 0.02,
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

      /* ──────────────────────────────────────────────
         TORSO  (LatheGeometry + CatmullRom)
         Puntos de control: [radio, alturaY] en el plano XY
         CatmullRomCurve3 los suaviza → LatheGeometry los gira 360°
         ────────────────────────────────────────────── */
      const torsoCtrl: THREE.Vector3[] = [
        // de abajo (entrepierna) hacia arriba (cuello)
        new THREE.Vector3(hipsR  * 0.15, CROTCH_Y - H * 0.01, 0), // cierre inferior
        new THREE.Vector3(hipsR  * 0.35, CROTCH_Y,             0),
        new THREE.Vector3(hipsR  * 0.78, HIP_Y   - H * 0.03,  0),
        new THREE.Vector3(hipsR,          HIP_Y,                0),
        new THREE.Vector3(hipsR  * 0.97, HIP_Y   + H * 0.04,  0),
        new THREE.Vector3(waistR,         WAIST_Y,              0),
        new THREE.Vector3(uBustR,         UBUST_Y,              0),
        new THREE.Vector3(bustR,          BUST_Y,               0),
        new THREE.Vector3(bustR  * 0.90, ARMPIT_Y,             0),
        new THREE.Vector3(shldrHW,        SHLDR_Y,              0),
        new THREE.Vector3(neckR  * 1.9,  NBOT_Y,               0),
        new THREE.Vector3(neckR,          NTOP_Y,               0),
      ];

      const torsoCurve  = new THREE.CatmullRomCurve3(torsoCtrl, false, "catmullrom", 0.5);
      const lathePoints = torsoCurve
        .getPoints(100)
        .map((p: THREE.Vector3) => new THREE.Vector2(Math.max(0, p.x), p.y));

      mkMesh(new THREE.LatheGeometry(lathePoints, 48), skinMat);

      /* ──────────────────────────────────────────────
         CABEZA
         ────────────────────────────────────────────── */
      // Cráneo
      mkMesh(
        new THREE.SphereGeometry(HEAD_R, 36, 36),
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
        new THREE.SphereGeometry(HEAD_R * 0.72, 24, 24),
        jawMat,
        [0, HEAD_Y - HEAD_R * 0.7, 0],
        [0.9, 0.35, 0.85],
      );

      // Pelo (semiesfera)
      const hairGeo = new THREE.SphereGeometry(
        HEAD_R * 1.02, 36, 36,
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
         BRAZOS  (cilindros cónicos)
         ────────────────────────────────────────────── */
      [-1, 1].forEach((side) => {
        const ax = shldrHW * side * 1.10;

        // Brazo superior (bíceps → codo)
        mkMesh(
          new THREE.CylinderGeometry(bicepsR * 0.78, bicepsR, U_ARM_LEN, 20),
          skinMat,
          [ax, (SHLDR_Y + ELBOW_Y) / 2, 0],
        );
        // Antebrazo (codo → muñeca)
        mkMesh(
          new THREE.CylinderGeometry(wristR, bicepsR * 0.74, F_ARM_LEN, 20),
          skinMat,
          [ax, (ELBOW_Y + WRIST_Y) / 2, 0],
        );
        // Mano
        mkMesh(
          new THREE.SphereGeometry(wristR * 1.35, 18, 18),
          skinMat,
          [ax, WRIST_Y - wristR * 1.05, 0],
          [1.25, 0.72, 0.62],
        );
      });

      /* ──────────────────────────────────────────────
         PIERNAS  (cilindros cónicos)
         ────────────────────────────────────────────── */
      const LEG_X      = hipsR * 0.40;
      const THIGH_LEN  = KNEE_Y  - CROTCH_Y;
      const CALF_LEN   = KNEE_Y  - ANKLE_Y;

      [-1, 1].forEach((side) => {
        const lx = LEG_X * side;

        // Muslo (entrepierna → rodilla)
        mkMesh(
          new THREE.CylinderGeometry(calfR * 1.05, thighR, THIGH_LEN, 20),
          skinMat,
          [lx, (CROTCH_Y + KNEE_Y) / 2, 0],
        );

        // Rótula (esfera aplastada)
        mkMesh(
          new THREE.SphereGeometry(calfR * 1.05, 20, 20),
          skinMat,
          [lx, KNEE_Y, 0],
          [1.0, 0.72, 1.05],
        );

        // Pantorrilla (rodilla → tobillo)
        mkMesh(
          new THREE.CylinderGeometry(ankleR, calfR, CALF_LEN, 20),
          skinMat,
          [lx, (ANKLE_Y + KNEE_Y) / 2, 0],
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
        foot.position.set(lx, ANKLE_Y - ankleR * 0.55, ankleR * 1.0);
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
