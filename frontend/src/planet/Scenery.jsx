// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Things on the ground: scattered boulders across the planet, and the base around the habitat dome
// (two modules, a connecting tube, solar array, landing pad, antenna mast, rover). Decorative only.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DOME_DIR, R, heightAt } from "./Planet.jsx";

const rand = (n) => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const ROCK = { moon: "#6f7078", mars: "#7a3b24", earth: "#5d6a5a" };
const HULL = "#e9e5db", HULL_DARK = "#b9b5aa", EMBER = "#c2471a", STEEL = "#4b5059";

export function Boulders({ kind, count = 170 }) {
  const ref = useRef();
  const items = useMemo(() => {
    const out = [];
    for (let i = 0; out.length < count && i < count * 4; i++) {
      const z = rand(i * 3) * 2 - 1, a = rand(i * 3 + 1) * Math.PI * 2, r = Math.sqrt(1 - z * z);
      const dir = new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a));
      if (dir.angleTo(DOME_DIR) < 0.4) continue; // keep the base clear
      const h = heightAt(dir, kind);
      if (kind === "earth" && h <= 0.002) continue; // no rocks floating on the sea
      out.push({ dir, h, s: 0.012 + Math.pow(rand(i * 3 + 2), 3) * 0.05, i });
    }
    return out;
  }, [kind, count]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    items.forEach((it, n) => {
      p.copy(it.dir).multiplyScalar(R + it.h + it.s * 0.35);
      q.setFromEuler(e.set(rand(it.i) * 6, rand(it.i + 9) * 6, rand(it.i + 5) * 6));
      sc.set(it.s, it.s * (0.6 + rand(it.i + 2) * 0.5), it.s * (0.7 + rand(it.i + 4) * 0.6));
      ref.current.setMatrixAt(n, m.compose(p, q, sc));
    });
    ref.current.count = items.length;
    ref.current.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={ROCK[kind]} flatShading roughness={1} />
    </instancedMesh>
  );
}

function Module({ position, rotation, length = 0.26 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, length, 10]} />
        <meshStandardMaterial color={HULL} flatShading roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * length) / 2, 0, 0]} rotation={[0, 0, (-s * Math.PI) / 2]}>
          <coneGeometry args={[0.055, 0.035, 10]} />
          <meshStandardMaterial color={HULL_DARK} flatShading roughness={0.7} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[length * 0.22, 0, 0]}>
        <cylinderGeometry args={[0.057, 0.057, 0.022, 10]} />
        <meshStandardMaterial color={EMBER} flatShading roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={"leg" + s} position={[s * length * 0.3, -0.04, 0]}>
          <boxGeometry args={[0.012, 0.03, 0.09]} />
          <meshStandardMaterial color={STEEL} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Beacon({ position }) {
  const ref = useRef();
  useFrame(({ clock }) => { ref.current.material.opacity = (clock.elapsedTime % 2.2) < 0.25 ? 1 : 0.15; });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.009, 8, 6]} />
      <meshBasicMaterial color="#ff5a2a" transparent />
    </mesh>
  );
}

// Laid out in the dome's local frame: y is up from the pad, the dome sits at the origin (radius 0.24).
export function Base() {
  return (
    <group>
      <Module position={[0.4, 0.06, 0.04]} rotation={[0, 0.25, 0]} />
      <mesh position={[0.27, 0.045, 0.02]} rotation={[0, 0.25, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
        <meshStandardMaterial color={HULL_DARK} flatShading />
      </mesh>
      <Module position={[-0.12, 0.06, -0.4]} rotation={[0, 1.2, 0]} length={0.2} />
      <mesh position={[-0.06, 0.045, -0.28]} rotation={[Math.PI / 2, 0, 0.45]}>
        <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
        <meshStandardMaterial color={HULL_DARK} flatShading />
      </mesh>

      {/* solar array */}
      <group position={[-0.42, 0, 0.14]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.006, 0.006, 0.1, 6]} /><meshStandardMaterial color={STEEL} /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.095, 0.1, 0]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.17, 0.004, 0.075]} />
            <meshStandardMaterial color="#1d2f52" metalness={0.4} roughness={0.35} flatShading />
          </mesh>
        ))}
      </group>

      {/* landing pad */}
      <group position={[0.14, 0.004, 0.46]}>
        <mesh><cylinderGeometry args={[0.14, 0.15, 0.012, 20]} /><meshStandardMaterial color="#3a3d44" flatShading roughness={0.9} /></mesh>
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.095, 0.105, 28]} /><meshBasicMaterial color={EMBER} /></mesh>
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.018, 12]} /><meshBasicMaterial color={HULL} /></mesh>
      </group>

      {/* antenna mast */}
      <group position={[-0.32, 0, -0.18]}>
        <mesh position={[0, 0.11, 0]}><cylinderGeometry args={[0.004, 0.007, 0.22, 6]} /><meshStandardMaterial color={STEEL} /></mesh>
        <mesh position={[0.02, 0.17, 0]} rotation={[0, 0, -0.9]}><coneGeometry args={[0.03, 0.016, 10, 1, true]} /><meshStandardMaterial color={HULL} side={THREE.DoubleSide} flatShading /></mesh>
        <Beacon position={[0, 0.225, 0]} />
      </group>

      {/* rover */}
      <group position={[0.36, 0.012, -0.3]} rotation={[0, -0.7, 0]}>
        <mesh position={[0, 0.022, 0]}><boxGeometry args={[0.07, 0.022, 0.04]} /><meshStandardMaterial color={HULL} flatShading /></mesh>
        <mesh position={[0.012, 0.042, 0]}><boxGeometry args={[0.03, 0.018, 0.034]} /><meshStandardMaterial color={EMBER} flatShading /></mesh>
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.024, 0.008, z * 0.024]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.008, 8]} /><meshStandardMaterial color="#23252a" flatShading />
          </mesh>
        )))}
      </group>
    </group>
  );
}
