// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Day/night from the visitor's local clock (the Landfall template does the same). Returns plain CSS colour strings.
import * as THREE from "three";

export function skyLight(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  const sun = Math.max(0, Math.cos(((h - 13) / 12) * Math.PI)); // 1 at 13:00, 0 from ~19:00 to ~07:00
  const day = 0.45 + 0.55 * sun;
  const col = (a, b, t) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  return {
    isDay: sun > 0.15,
    sunIntensity: 1.1 + 1.9 * day,
    sunColor: col("#b4c4ec", "#ffffff", sun), // cool moonlight at night, white by day
    ambient: 0.55 + 0.35 * day,
    background: col("#04060d", "#0c1a38", sun),
  };
}
