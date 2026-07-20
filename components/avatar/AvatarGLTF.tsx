"use client";

/**
 * AvatarGLTF – carga el modelo real esculpido en Blender (avatar_female.glb)
 * y anima sus Shape Keys (morph targets) según las medidas del usuario.
 *
 * Diseño clave: la carga del archivo .glb ocurre UNA sola vez al montar el
 * componente. Cuando las medidas cambian, solo se actualizan los valores
 * de `morphTargetInfluences` sobre la malla ya cargada — nunca se vuelve a
 * descargar/parsear el archivo. Esto es importante porque el modelo pesa
 * ~27 MB; recargarlo en cada cambio de medida sería muy lento.
 *
 * Requiere que el archivo exista en /public/models/avatar_female.glb
 */

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BodyMeasurements } from "@/lib/measurements";
import { computeMorphInfluences, SHAPE_KEY_NAMES } from "@/lib/avatarMapping";

type Props = {
  measurements: BodyMeasurements;
  width?: number;
  height?: number;
  modelUrl?: string;
  className?: string;
};

/** Todo lo que la escena necesita recordar entre renders, sin disparar
 *  un re-render de React (por eso vive en un ref, no en useState). */
type SceneRefs = {
  THREE: typeof THREE;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  skinMesh: THREE.Mesh | null;
  modelGroup: THREE.Group;
  nativeHeightMeters: number; // altura real del modelo tal cual viene del .glb, antes de reescalar
  animId: number;
};

/** Aplica los Shape Keys correctos y la escala general según las medidas
 *  del usuario, sobre una escena ya creada (nunca recarga el .glb). */
function applyMeasurements(refs: SceneRefs, m: BodyMeasurements) {
  const { skinMesh, modelGroup, nativeHeightMeters } = refs;
  if (!skinMesh || !skinMesh.morphTargetDictionary || !skinMesh.morphTargetInfluences) return;

  // 1) Shape Keys (busto, cintura, cadera, hombros, muslo)
  const influences = computeMorphInfluences(m);
  for (const [name, value] of Object.entries(influences)) {
    const idx = skinMesh.morphTargetDictionary[name];
    if (idx !== undefined) {
      skinMesh.morphTargetInfluences[idx] = value;
    }
  }

  // 2) Escala general según la altura real del usuario. El modelo viene
  // modelado a su propia escala nativa (nativeHeightMeters); lo
  // reescalamos para que coincida con la altura real ingresada.
  const heightCm = Number(m.height) || 165;
  const targetMeters = heightCm / 100;
  const scale = targetMeters / (nativeHeightMeters || 1);
  modelGroup.scale.setScalar(scale);

  // Vuelve a apoyar los pies en el piso tras reescalar (el origen del
  // grupo ya estaba en los pies antes de escalar, así que basta con
  // mantener modelGroup.position.y en 0).
  modelGroup.position.y = 0;
}

/**
 * Corrige un defecto del .glb: los Shape Keys del cuerpo (bust/waist/hips/
 * shoulders/thigh) también arrastran los vértices de la cabeza y la cara.
 * Como los ojos y el pelo son mallas SEPARADAS sin esos morphs, se
 * despegaban del cuerpo al cambiar las medidas.
 *
 * Aquí atenuamos los deltas de morph por altura: morph completo en el torso,
 * cero en la cara/cráneo, con un desvanecido suave a lo largo del cuello para
 * que no haya un corte brusco. Así la cara queda fija y ojos + pelo se
 * mantienen en su lugar, mientras el torso sigue deformándose con normalidad.
 *
 * Se ejecuta UNA sola vez, justo después de cargar el modelo y ANTES de que
 * la malla se renderice por primera vez (para que el morph texture interno de
 * Three.js se construya ya con los deltas corregidos).
 */
function freezeHeadMorphs(mesh: THREE.Mesh) {
  const geom = mesh.geometry;
  const pos = geom.attributes.position;
  const morphs = geom.morphAttributes.position;
  if (!pos || !morphs || morphs.length === 0) return;

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const H = maxY - minY || 1;
  const yFull = minY + 0.85 * H;    // por debajo: morph completo (incluye hombros/base del cuello)
  const yFrozen = minY + 0.915 * H; // por encima: cara, cráneo y pelo → morph congelado

  for (const attr of morphs) {
    for (let i = 0; i < attr.count; i++) {
      const y = pos.getY(i);
      let w = 1;
      if (y >= yFrozen) w = 0;
      else if (y > yFull) w = 1 - (y - yFull) / (yFrozen - yFull);
      if (w < 1) {
        attr.setXYZ(i, attr.getX(i) * w, attr.getY(i) * w, attr.getZ(i) * w);
      }
    }
    attr.needsUpdate = true;
  }
}

export default function AvatarGLTF({
  measurements,
  width = 340,
  height = 480,
  modelUrl = "/models/avatar_female.glb",
  className,
}: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const refsRef    = useRef<SceneRefs | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  /* ──────────────────────────────────────────────────────────────
     EFECTO 1 — Se ejecuta UNA sola vez (mount): crea la escena,
     carga el modelo .glb, configura cámara/luces/controles.
     No depende de `measurements` a propósito.
     ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let cancelled = false;

    setStatus("loading");
    setErrorMsg("");

    Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]).then(([THREEMod, { OrbitControls }, { GLTFLoader }]) => {
      if (cancelled || !container.isConnected) return;
      const THREE = THREEMod;

      /* ── Escena base ── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f2ed);

      const cam = new THREE.PerspectiveCamera(38, width / height, 0.05, 50);
      cam.position.set(0, 1.0, 2.6);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(cam, renderer.domElement);
      controls.target.set(0, 0.9, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 1.0;
      controls.maxDistance = 5.5;
      controls.minPolarAngle = 0.1;
      controls.maxPolarAngle = Math.PI * 0.92;
      cam.lookAt(controls.target);

      /* ── Iluminación (clave + relleno + rebote) ── */
      scene.add(new THREE.AmbientLight(0xfff0e0, 0.7));

      const key = new THREE.DirectionalLight(0xfffaf3, 2.2);
      key.position.set(1.2, 3.2, 1.8);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.near = 0.1;
      key.shadow.camera.far = 8;
      key.shadow.camera.left = -1.5;
      key.shadow.camera.right = 1.5;
      key.shadow.camera.top = 3.5;
      key.shadow.camera.bottom = -0.2;
      key.shadow.bias = -0.001;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffd8b8, 0.8);
      fill.position.set(-1.4, 1.8, 1.2);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffeedd, 0.4);
      rim.position.set(0, 1.2, -2.2);
      scene.add(rim);

      /* ── Piso ── */
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(1.4, 48),
        new THREE.MeshStandardMaterial({ color: 0xe0d8ce, roughness: 1.0 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      /* ── Grupo contenedor del modelo (para escalar/posicionar sin
         tocar la jerarquía interna del .glb) ── */
      const modelGroup = new THREE.Group();
      scene.add(modelGroup);

      refsRef.current = {
        THREE,
        scene,
        camera: cam,
        renderer,
        controls,
        skinMesh: null,
        modelGroup,
        nativeHeightMeters: 1,
        animId: 0,
      };

      /* ── Carga del modelo ── */
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf: GLTF) => {
          if (cancelled) return;

          const root = gltf.scene;

          // Encuentra la malla de piel: la que tiene morphTargetDictionary
          // con nuestros Shape Keys conocidos.
          let skinMesh: THREE.Mesh | null = null;
          root.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (
              mesh.isMesh &&
              mesh.morphTargetDictionary &&
              SHAPE_KEY_NAMES.some((n) => n in mesh.morphTargetDictionary!)
            ) {
              skinMesh = mesh;
            }
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          if (!skinMesh) {
            setStatus("error");
            setErrorMsg(
              "El modelo cargó, pero no se encontró la malla con Shape Keys. " +
              "Verifica que el .glb incluya el mesh de piel con los morph targets."
            );
            return;
          }

          // Evita que los Shape Keys del cuerpo arrastren la cabeza/cara,
          // lo que despegaba ojos y pelo (mallas separadas sin morphs).
          freezeHeadMorphs(skinMesh);

          modelGroup.add(root);

          // Altura nativa del modelo tal cual viene (antes de reescalar a
          // la altura real del usuario).
          const box = new THREE.Box3().setFromObject(root);
          const nativeHeight = box.max.y - box.min.y;
          const feetY = box.min.y;

          if (refsRef.current) {
            refsRef.current.skinMesh = skinMesh;
            refsRef.current.nativeHeightMeters = nativeHeight || 1;
          }

          // Centra horizontalmente y apoya los pies en y=0.
          root.position.x -= (box.max.x + box.min.x) / 2;
          root.position.z -= (box.max.z + box.min.z) / 2;
          root.position.y -= feetY;

          applyMeasurements(refsRef.current!, measurements);
          setStatus("ready");
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.error("Error cargando avatar .glb:", err);
          setStatus("error");
          setErrorMsg(
            "No se pudo cargar el modelo 3D. Verifica que el archivo exista en " +
            modelUrl + "."
          );
        }
      );

      /* ── Loop de animación ── */
      function animate() {
        if (!refsRef.current) return;
        refsRef.current.animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, cam);
      }
      animate();

      /* ── Limpieza ── */
      disposeRef.current = () => {
        if (refsRef.current) cancelAnimationFrame(refsRef.current.animId);
        controls.dispose();

        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
              if (!mat) return;
              Object.values(mat).forEach((v) => {
                if (v && typeof v === "object" && "isTexture" in v) {
                  (v as THREE.Texture).dispose();
                }
              });
              mat.dispose();
            });
          }
        });

        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        refsRef.current = null;
        disposeRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      disposeRef.current?.();
    };
    // Deliberadamente NO se incluye `measurements` aquí — ver Efecto 2.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, width, height]);

  /* ──────────────────────────────────────────────────────────────
     EFECTO 2 — Se ejecuta cada vez que cambian las medidas. Solo
     actualiza morphTargetInfluences + la escala general del modelo
     sobre la escena ya creada — nunca recarga el archivo .glb.
     ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== "ready" || !refsRef.current) return;
    applyMeasurements(refsRef.current, measurements);
  }, [measurements, status]);

  return (
    <div style={{ position: "relative", width, height }} className={className}>
      <div ref={mountRef} style={{ width, height }} />

      {status === "loading" && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "#f7f2ed", gap: 10,
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "3px solid #e0d4c4", borderTopColor: "#8b6a50",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "#9e8878" }}>Cargando avatar…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "#fdf2f2", gap: 8, padding: 16, textAlign: "center",
          }}
        >
          <span style={{ fontSize: 22 }}>⚠️</span>
          <span style={{ fontSize: 12, color: "#a03030" }}>{errorMsg}</span>
        </div>
      )}

      {status === "ready" && (
        <div
          style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            fontSize: 10, color: "#b0a090", pointerEvents: "none", whiteSpace: "nowrap",
          }}
        >
          arrastra para girar · scroll para zoom
        </div>
      )}
    </div>
  );
}
