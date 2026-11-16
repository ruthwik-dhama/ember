// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Full-screen 3D stage: draggable low-poly planet, habitat dome, ship, day/night light, camera fly-in.
// focus: "planet" (free orbit) | "zooming" / "room" (camera sits above the dome).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Planet, { DOME_DIR, DOME_POS, R, SkyBody, planetKind } from "./Planet.jsx";
import { Boulders } from "./Scenery.jsx";
import Habitat3D from "./Habitat3D.jsx";
import Ship from "./Ship.jsx";
import { skyLight } from "./dayNight.js";

// Portrait phones need the camera further back so the whole planet fits.
const HOME = new THREE.Vector3(0.5, 1.1, typeof window !== "undefined" && window.innerWidth < 900 ? 11.5 : 7.8);
const DOME_CAM = DOME_POS.clone().add(DOME_DIR.clone().multiplyScalar(1.0));

// Flies the camera between the free-orbit view and the dome; hands control back to OrbitControls when home.
function CameraRig({ focus, controls }) {
  const { camera } = useThree();
  const anim = useRef({ moving: false });
  const prev = useRef("planet");
  useEffect(() => {
    if (prev.current !== focus) anim.current.moving = true;
    prev.current = focus;
  }, [focus]);
  useFrame((_, dt) => {
    const c = controls.current;
    const toDome = focus !== "planet";
    if (!anim.current.moving) { if (c) c.enabled = !toDome; return; }
    if (c) c.enabled = false;
    const target = toDome ? DOME_CAM : HOME;
    camera.position.lerp(target, 1 - Math.pow(0.002, dt)); // frame-rate independent ease
    camera.lookAt(toDome ? DOME_POS : new THREE.Vector3());
    if (camera.position.distanceTo(target) < 0.02) { anim.current.moving = false; if (c) { c.target.set(0, 0, 0); c.enabled = !toDome; c.update(); } }
  });
  return null;
}

export default function PlanetScene({ mission, focus, onEnter, agents, canEnter = true }) {
  const kind = planetKind(mission);
  const sky = useMemo(() => skyLight(), []);
  const controls = useRef();
  const [hover, setHover] = useState(false);
  const still = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const station = mission && (mission.habitat === "iss" || mission.habitat === "spacecraft");
  return (
    <div className="stage" aria-hidden="true">
      <Canvas camera={{ position: HOME.toArray(), fov: 45 }} dpr={[1, 1.75]}>
        <color attach="background" args={[sky.background]} />
        <ambientLight intensity={sky.ambient} />
        <directionalLight position={[5, 3, 4]} intensity={sky.sunIntensity} color={sky.sunColor} />
        <hemisphereLight args={["#c9d6ff", "#241a14", 0.32]} />
        <Stars radius={70} depth={30} count={1400} factor={2.2} fade speed={0.3} />
        <SkyBody kind={kind} />
        <Planet kind={kind} />
        <Boulders kind={kind} />
        {station && <Station />}
        <Habitat3D onHover={setHover} onEnter={onEnter} interactive={canEnter && focus === "planet"} agents={agents} />
        <Ship />
        <CameraRig focus={focus} controls={controls} />
        <OrbitControls ref={controls} enablePan={false} minDistance={4.2} maxDistance={11} autoRotate={!still && !hover && focus === "planet"} autoRotateSpeed={0.5}
          rotateSpeed={0.6} dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

// Decorative ring station for 0 g missions (ISS / spacecraft). Not clickable; the habitat dome is the room view.
function Station() {
  const ref = useRef();
  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.25; });
  return (
    <group ref={ref} rotation={[0.5, 0, 0.3]}>
      <mesh position={[R + 1.1, 0, 0]}>
        <torusGeometry args={[0.16, 0.025, 6, 16]} />
        <meshStandardMaterial color="#cfd6e4" flatShading />
      </mesh>
      <mesh position={[R + 1.1, 0, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.07]} />
        <meshStandardMaterial color="#ff7a3d" flatShading />
      </mesh>
    </group>
  );
}
