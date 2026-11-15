# Envelope Guard thresholds (owner: Sibi)

Every threshold the guard uses is listed here, so each badge can be explained. Code: `guard.py`.

## Axes

| Axis | Transform | Note |
|---|---|---|
| O₂ mole fraction | linear, divided by the tested range | flammability is roughly monotonic in X_O2 |
| Pressure | `log(kPa)`, divided by the tested range | tests span about 0.7 to 3 atm and lower |
| Flow speed | `log(u + 0.1)` with u in cm/s, divided by the tested range | `FLOW_EPS_CM_S = 0.1` so quiescent (0 cm/s) tests fit on a log axis |
| Gravity | special rule | only 0 g and 1 g data exist |

If an axis has zero tested range (every row has the same value), its divisor is 1.0.

Distance = Euclidean norm of the normalized difference over the three axes above (gravity is not part of the distance).

## Badges

| Badge | Rule |
|---|---|
| 🔴 red | Outside the tested min/max on at least one axis (O₂, pressure, flow, or g). `outside_axes` names them. |
| 🟢 green | Not red, distance to the nearest tested row `< D_GREEN = 0.1`, **and** g equals a tested g exactly. |
| 🟡 yellow | Everything else inside the envelope. **Every 0 < g < 1 condition is yellow by rule**, because PSI has no partial-g data. |

## Placeholders

- `DEFAULT_FLOW_CM_S = 10.0`: `Mission` has no flow field yet, so `distance_to()` (used by ranking) assumes a typical cabin vent speed. Replace it once Mission or `calibration.csv` provides a flow.

## Gap map

`EnvelopeGuard.gap_map(pressure_kpa, g)` runs `check()` on a 13 × 13 grid, O₂ 0.15–0.45 × flow 0–30 cm/s, at the mission's pressure and g. It returns `{pressure_kpa, g, o2_values, flow_values, cells[i][j], nearest[i][j], counts}`, where `cells[i][j]` is the badge at `o2_values[i]`, `flow_values[j]`. Red cells show where future experiments (LUCI, FM2) are needed.
