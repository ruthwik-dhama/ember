// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Day/night for the scene, from the visitor's local clock (like the Landfall template), or forced by the sun/moon button.
// Colours are the template's: warm taupe sky by day, deep blue by night. `background` is a CSS gradient for the stage.
export function skyLight(mode = "auto", date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  const sun = Math.max(0, Math.cos(((h - 13) / 12) * Math.PI)); // 1 at 13:00, 0 from ~19:00 to ~07:00
  const isDay = mode === "day" ? true : mode === "night" ? false : sun > 0.15;
  return isDay
    ? { isDay, sunIntensity: 3.0, sunColor: "#fff3df", ambient: 1.05,
        background: "radial-gradient(circle at 50% 42%, #ddd4cf 0%, #d3c9c4 55%, #c8beba 100%)" }
    : { isDay, sunIntensity: 1.7, sunColor: "#a9bcff", ambient: 0.7,
        background: "radial-gradient(circle at 50% 46%, #183ea8 0%, #0b2066 36%, #060e2d 70%, #020617 100%)" };
}
