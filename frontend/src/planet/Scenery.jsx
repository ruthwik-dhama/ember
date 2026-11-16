// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Low-poly dressing like the Landfall planet: trees and white clouds on Earth, scattered rocks on the Moon and Mars.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DOME_DIR, PALETTES, R, heightAt } from "./Planet.jsx";

function rng(seed) { // mulberry32: deterministic, so the planet looks the same every load
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const UP = new THREE.Vector3(0, 1, 0);

function Instances({ geometry, material, mats, colors }) {
  const ref = useRef();
  useLayoutEffect(() => {
    mats.forEach((m, i) => { ref.current.setMatrixAt(i, m); if (colors) ref.current.setColorAt(i, colors[i]); });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [mats, colors, geometry, material]); // geometry/material must be memoized by the caller, or the mesh is rebuilt empty
  return <instancedMesh ref={ref} args={[geometry, material, mats.length]} />;
}

function useScatter(kind) {
  return useMemo(() => {
    const rand = rng(PALETTES[kind].seed * 100 + 7);
    const out = [];
    const want = kind === "earth" ? 260 : 150;
    for (let i = 0; i < want * 4 && out.length < want; i++) {
      const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
      if (d.lengthSq() > 1 || d.lengthSq() < 0.05) continue;
      d.normalize();
      const h = heightAt(d, kind);
      if (d.angleTo(DOME_DIR) < 0.45) continue; // keep the landing pad clear
      if (kind === "earth" && h < 0.012) continue; // no trees in the sea
      out.push({ d, h, s: 0.7 + rand() * 0.9, tint: rand() });
    }
    return out;
  }, [kind]);
}

function Trees({ items }) {
  const { trunk, crown, colors, geo } = useMemo(() => {
    const q = new THREE.Quaternion(), m = new THREE.Matrix4(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const place = (it, lift, scale) => {
      q.setFromUnitVectors(UP, it.d);
      v.copy(it.d).multiplyScalar(R + it.h + lift * it.s);
      sc.setScalar(it.s * scale);
      return m.clone().compose(v, q, sc);
    };
    const greens = ["#4f7f3a", "#5f8f45", "#3f6b34", "#6f9a4c"].map((c) => new THREE.Color(c));
    return {
      trunk: items.map((it) => place(it, 0.02, 1)),
      crown: items.map((it) => place(it, 0.1, 1)),
      colors: items.map((it) => greens[Math.floor(it.tint * greens.length)]),
      geo: {
        trunk: new THREE.CylinderGeometry(0.012, 0.016, 0.06, 5), crown: new THREE.ConeGeometry(0.055, 0.15, 6),
        trunkMat: new THREE.MeshStandardMaterial({ color: "#6b4f3a", flatShading: true }),
        crownMat: new THREE.MeshStandardMaterial({ flatShading: true }),
      },
    };
  }, [items]);
  return (
    <>
      <Instances geometry={geo.trunk} material={geo.trunkMat} mats={trunk} />
      <Instances geometry={geo.crown} material={geo.crownMat} mats={crown} colors={colors} />
    </>
  );
}

function Rocks({ items, kind }) {
  const { mats, colors, geo, mat } = useMemo(() => {
    const q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), e = new THREE.Euler();
    const base = new THREE.Color(PALETTES[kind].low);
    return {
      mats: items.map((it) => {
        q.setFromUnitVectors(UP, it.d).multiply(new THREE.Quaternion().setFromEuler(e.set(it.tint * 6, it.tint * 9, 0)));
        v.copy(it.d).multiplyScalar(R + it.h + 0.01);
        sc.set(it.s * 0.05, it.s * 0.035, it.s * 0.05);
        return new THREE.Matrix4().compose(v, q, sc);
      }),
      colors: items.map((it) => base.clone().multiplyScalar(0.8 + it.tint * 0.35)),
      geo: new THREE.IcosahedronGeometry(1, 0),
      mat: new THREE.MeshStandardMaterial({ flatShading: true }),
    };
  }, [items, kind]);
  return <Instances geometry={geo} material={mat} mats={mats} colors={colors} />;
}

function Clouds({ isDay }) {
  const group = useRef();
  const clouds = useMemo(() => {
    const rand = rng(99);
    return Array.from({ length: 11 }, () => {
      const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      return { p: d.multiplyScalar(R + 0.8 + rand() * 0.5), s: 0.7 + rand() * 0.7, puffs: [[0, 0, 0, 1], [0.13, 0.02, 0.04, 0.75], [-0.12, -0.01, -0.03, 0.7]] };
    });
  }, []);
  useFrame((_, dt) => { group.current.rotation.y += dt * 0.025; });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={c.p} scale={c.s}>
          {c.puffs.map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]}>
              <icosahedronGeometry args={[0.1 * r, 1]} />
              <meshStandardMaterial color={isDay ? "#ffffff" : "#8d9bd8"} flatShading emissive={isDay ? "#ffffff" : "#1b2a6b"} emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function Scenery({ kind, isDay }) {
  const items = useScatter(kind);
  return (
    <>
      {kind === "earth" ? <Trees items={items} /> : <Rocks items={items} kind={kind} />}
      {kind === "earth" && <Clouds isDay={isDay} />}
    </>
  );
}
