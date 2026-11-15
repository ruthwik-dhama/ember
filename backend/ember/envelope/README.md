# Envelope Guard thresholds (owner: Sibi)

Write down every threshold here so each badge can be explained.

| Axis | Transform | Note |
|---|---|---|
| O2 mole fraction | linear, scaled by tested range | |
| Pressure | log | |
| Flow speed | log(u + 0.1) | cm/s |
| Gravity | special rule | only 0 g and 1 g data exist; anything between is yellow |

- Green: normalized distance to nearest tested row < `D_GREEN` (currently 0.1) and g equals a tested value.
- Yellow: inside every per-axis tested range (includes any 0 < g < 1).
- Red: outside the tested range on at least one axis.
