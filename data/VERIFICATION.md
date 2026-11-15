# Data verification sheet: SAME / SAME-R, DAFT, ACME (owner: Sibi)

How to use this: each row group lists what the source **confirms** (with the passage it comes from) and
what was **inferred** (not stated in the source). Every row in `tested_conditions.csv` stays `verified=false` until
Sibi signs off on its group below. Rows whose only inferred fields are ISS cabin O₂ and pressure can be flipped
once the team accepts the cabin-nominal rule (section 0).

Sources (all public):
- **S2**: Urban et al., *Particle Morphology and Size Results from SAME-2*, AIAA 2012-3536, NTRS 20130000422 (full text read)
- **S1**: Urban et al., SAE 2009-01-2468 (abstract only)
- **TM**: Yang, Cleary, Urban, Ruff, Sheredy, Yuan, Mulholland, *Smoke Aerosol Measurement Experiment (SAME)*, NASA TM 2010, NIST pub 904707 (full text read, incl. flight run log)
- **DA**: Urban, Ruff, Sheredy, Funk, *Particle and Smoke Detection on ISS for Next Generation Smoke Detectors*, ISDC 2007, NTRS 20070031686 (slides read)
- **AC**: Stocker, *Recent Research on Flames of Gaseous Fuel Aboard the ISS*, 33rd JASMAC 2021, NTRS 20210021781 (full text read)
- **DE**: Dehghani, UMD dissertation 2022, hdl:1903/29303 (full text read: Table 2.1 design parameters, Table 3.1 all 59 round-1 tests)
- **WR**: Wright, UMD thesis 2021, hdl:1903/27484 (full text read: Tables 2.1–2.2 design parameters, Appendix B Tables B.1–B.3, every ISS BRE test)

## 0. Team rule to decide: ISS cabin nominal atmosphere

None of the SAME or DAFT sources states the O₂ fraction or pressure of the air used (the BRE theses do; see §4–5). The rows use
O₂ = 0.21 and 101.3 kPa (ISS cabin nominal, about 14.7 psi). SAME ran in the MSG and DAFT sampled open cabin air,
so cabin air is the reasonable reading, but it is an inference.

- [x] Accept "ISS cabin nominal = 0.21 / 101.3 kPa" for SAME, SAME-R and DAFT. **Accepted by Sibi, 15 Nov 2026.**

## 1. SAME-R (SAME-2), 6 materials at 8 cm/s: `SAMER-*-08`

| Field | Value | Status | Passage (S2) |
|---|---|---|---|
| Materials | Teflon, Kapton, Pyrell, silicone rubber, cellulose lampwick, dibutyl phthalate | ✅ confirmed | §II.C: "samples of 6 materials: Teflon™, Kapton™, Pyrell™, silicone rubber, cellulose (lamp wick), and dibutyl-phthalate" |
| Flow | 8.0 cm/s | ✅ confirmed | §II.C: "The baseline air flow rate was 8 cm/s" |
| g | 0.0 | ✅ confirmed | Conducted in the MSG on ISS during Expedition 24 (abstract) |
| O₂ / pressure | 0.21 / 101.3 kPa | ⚠️ inferred | Not stated; see section 0 |
| Outputs | d10, d30, d_gm, σg, age | ✅ confirmed | Table 1 and §II.A moment method |

- [x] Sign off group 1: 6 rows marked `verified=true` (all other fields confirmed in S2; O₂/pressure by the section 0 rule)

## 2. SAME-R at 2 and 0 cm/s: Teflon, Kapton, lampwick: `SAMER-{TEFL,KAPT,CELL}-{02,00}`

| Field | Value | Status | Passage (S2) |
|---|---|---|---|
| Flow 2 cm/s | 2.0 | ✅ confirmed | §II.C: "runs conducted at rates down to 2 cm/s" |
| Flow 0 cm/s | 0.0 | ✅ confirmed | §II.C: "a limited set conducted with no airflow"; §4: zero flow "examined for 11 tests" |
| Which materials | Teflon, Kapton, lampwick | ✅ confirmed | Figs. 6–8 plot diameters vs. air velocity (0–8 cm/s) for exactly these three |
| O₂ / pressure | 0.21 / 101.3 kPa | ⚠️ inferred | Section 0 |

Note: S2 says zero-flow was examined "for all of the materials" in the D30 comparison, but only these three are
plotted, so only these three got 0 and 2 cm/s rows.

- [x] Sign off group 2: 6 rows marked `verified=true` (all other fields confirmed in S2; O₂/pressure by the section 0 rule)

## 3. SAME-1 (Expedition 15): rows replaced with run-log-backed points: `SAME1-DIBU-08`, `SAME1-KAPT-02`, `SAME1-CELL-02`

The first draft had 5 rows (all 5 materials at 8 cm/s), with the 8 cm/s inferred. The NIST SAME technical memo (TM)
was readable, and it gives no single baseline flow: "The system was designed to provide air flow rates ranging
from 2 to 8 cm/s." Its flight run log names the flow for three runs, so the rows now match those runs exactly:

| Row | Material | Flow | Passage (TM run log) |
|---|---|---|---|
| `SAME1-DIBU-08` | dibutyl phthalate | 8 cm/s | run 37: "DBP Reheat … 8 cm/s" |
| `SAME1-KAPT-02` | Kapton | 2 cm/s | run 33: "Kapton Initial … using 2 cm/s" |
| `SAME1-CELL-02` | cellulose (lampwick) | 2 cm/s | run 34: "Lampwick Initial … using 2 cm/s" |

Other fields: g = 0 ✅ (MSG on ISS, Expedition 15); O₂ / pressure by the section 0 rule ✅. Teflon and silicone rubber
rows were dropped because the run log doesn't give their flow.

- [x] Sign off group 3: 3 rows marked `verified=true` (every field read from TM; O₂/pressure by section 0). Signed off by Sibi, 15 Nov 2026.

## 4–5. ACME / BRE: rows replaced with real ISS test points from Wright (2021) Appendix B

The first draft had 7 BRE rows built from abstract ranges. The full theses gave the actual test tables, and showed that
two of the draft rows were wrong: methane was only tested on the **25 mm** burner (not 50 mm), and only at **14.7 psia**
(so "methane at 57 kPa" never happened). All 7 draft rows are replaced by 10 real test points: the lowest- and highest-O₂
test in each fuel / burner / pressure group.

| Row (test ID) | Fuel, burner | X_O2 | Pressure | Table |
|---|---|---|---|---|
| `BRE-19039H2` | ethylene, 25 mm | 0.18 | 14.7 psia (101.3 kPa) | B.1 |
| `BRE-20358B1` | ethylene, 25 mm | 0.39 | 14.7 psia | B.1 |
| `BRE-19056G1` | ethylene 50% in N₂, 25 mm | 0.24 | **10.2 psia (70.3 kPa)** | B.1 |
| `BRE-20261J1` | ethylene, 25 mm | 0.29 | **10.2 psia** | B.1 |
| `BRE-19051G1` | ethylene, 25 mm | 0.30 | 8.2 psia (56.5 kPa) | B.1 |
| `BRE-19094H1` | ethylene, 25 mm | 0.35 | 8.2 psia | B.1 |
| `BRE-20247K1` | ethylene, 50 mm | 0.23 | 14.7 psia | B.2 |
| `BRE-20247B1` | ethylene, 50 mm | 0.37 | 14.7 psia | B.2 |
| `BRE-20279J6` | methane, 25 mm | 0.24 | 14.7 psia | B.3 |
| `BRE-20279B1` | methane, 25 mm | 0.39 | 14.7 psia | B.3 |

Every field is read from the table row with that test ID. Pressures are the tables' psia values converted to kPa
(× 6.895). DE Table 3.1 lists the same round-1 tests with measured pressures (1.01–1.04, 0.69–0.71, 0.57–0.58 bar),
which agree. Flow 0 ✅ (DE §2: the burner "is installed in a quiescent chamber"). g = 0 ✅ (ISS CIR).

Worth knowing for the pitch: 10.2 psia is the planned Moon base / rover pressure, and DE §2 says three BRE atmospheres
were "nominal NASA selected atmospheres … 21 % oxygen and 1 bar, 26.5% and 0.7 bar and 34 % and 0.565 bar". The Moon
base mission (0.30 O₂, 70.3 kPa) sits right next to `BRE-20261J1` (0.29, 70.3 kPa); it is still 🟡 only because of g.

- [x] Sign off groups 4–5: 10 rows marked `verified=true` (every field read from WR Appendix B, cross-checked against DE Table 3.1 for round 1; no inference). Signed off by Sibi, 15 Nov 2026.

## 6. DAFT: no condition rows (by design)

DAFT measured background aerosol in cabin air, not a combustion condition, so it has no rows in
`tested_conditions.csv`. Its numbers live in `calibration.csv`:

| Constant | Value | Status | Passage (DA, slide 26) |
|---|---|---|---|
| `background.iss_mass_mg_m3` | 0.005 | ✅ confirmed (upper bound) | "Average values of cabin air less than 0.005 mg/m3 (Dust Trak)" |
| `background.iss_number_cm3` | 15 | ✅ confirmed (upper bound) | "15 particles /cm3 (P-Trak)" |

Side effect: Kishan's `rank()` scores an investigation with no condition rows as 0, so DAFT ranks last under
"detection" even though it is the false-alarm reference. Decide: add DAFT cabin-air rows, or ask Kishan to rank
non-combustion investigations differently.

- [x] Decide DAFT ranking approach: `rank()` scores investigations without rows from their investigations.json conditions, and adds a dust bonus on Moon/Mars/rover habitats **under the detection filter only** (PRs #17, #18).

## 7. Calibration values from SAME-2 Table 1

| Constant | Value | Status | How to reproduce |
|---|---|---|---|
| `smoke.d0_nm` | 258 | fitted | Median of unaged D30 over Kapton 101, Teflon 170, lampwick 258, Pyrell 384, silicone 465 nm |
| `smoke.tau_s` | 408 | fitted | Per material, τ = 720 / ((D30_aged / D30_unaged)³ − 1): Kapton 236, lampwick 270, Pyrell 408, Teflon 467, silicone 530 s; median 408 |
| `smoke.sigma_g` | 2.21 | fitted | Median unaged σg: 2.154, 2.198, 2.211, 2.312, 2.530 |
| `smoke.zero_flow_d30_factor` | 1.35 | measured | §4: "the diameter of average mass is 30 % to 40 % larger for the zero-flow tests" (midpoint) |
| `smoke.sample_mass_{min,max}_mg_m3` | 2, 15 | measured | §II.C: "mass concentrations were 2 to 15 mg/m3" |

The aging law `d = d0 (1 + t/τ)^(1/3)` is the design doc's assumed form, not S2's. S2 only reports unaged vs.
720 s, so τ is fitted to two points per material.

- [ ] Sign off group 7

## 8. BASS-II on the ISS: `BASSII-*` (owner: Ruthwik)

Source **BL**: Link, Huang, Fernandez-Pello, Olson, Ferkul (2018), *The Effect of Gravity on Flame Spread over PMMA
Cylinders*, Sci. Rep. 8:120, doi:10.1038/s41598-017-18398-4 (full text and supplementary Table S1 read; table checked
against a rendered image of the page, not only extracted text).

| Field | Value | Status | Passage (BL) |
|---|---|---|---|
| Fuel | PMMA, solid | ✅ confirmed | Methods: "rods of cast black PMMA with diameters of 6.4, 9.5, and 12.7 mm"; Table S1: "B ... means black" |
| g | 0.0 | ✅ confirmed | Table S1 title: "microgravity data in International Space Station" |
| O₂ fraction per row | 0.207, 0.189, 0.182, 0.175, 0.170 | ✅ confirmed | Table S1 X_O2 column (B13a 20.7, B6 18.9, B16 18.2, B19 17.5, B10 17.0 %); Fig. 7 caption: O₂ uncertainty ±0.3% |
| Flow per row | 1.64, 2.00, 7.55, 0.72, 1.67, 2.00 cm/s | ✅ confirmed | Table S1 V_g column for the same samples |
| Output | spread rate | ✅ confirmed | Table S1 V_f column; methods: "flame spread rate was measured by tracking the flame leading edge" |
| Pressure | 101.3 kPa | ✅ confirmed | Not stated in BL, but **ZH** (section 9) describes the same BASS/BASS-II flow duct in the MSG (7.6 cm × 7.6 cm, fan-driven) and states "Ambient pressure was 1 atm". Previously inferred via the section 0 rule; now sourced |

Note on units: in Table S1 the left half labels V_f "×10³ (cm/s)" and the right half (0.64 cm rods) "×10³ (mm/s)".
The values are cm/s in both halves. With cm/s, 0.64 cm rods in microgravity spread faster than the 1 g Table S2 values
below 19% O₂, which is what the paper states ("below X_O2 = 19% the flame spread becomes faster in microgravity").
With mm/s they would be about 10× slower, contradicting it. `calibration.csv` (material.pmma.v0 and the flame fit) uses cm/s.

- [x] Extend the section 0 rule to BASS-II **pressure only** (MSG work volume at ISS cabin nominal). Accepted by Ruthwik, 15 Nov 2026.
- [x] Sign off group 8: 6 rows marked `verified=true` (`BASSII-B13a`, `-B6`, `-B16-hi`, `-B16-lo`, `-B19`, `-B10`)
- [ ] `G-BASSII-*` (1 g, UC Berkeley flow duct, Table S2) stay `verified=false`: lab pressure isn't stated, and the ISS cabin rule doesn't apply to a ground lab

## 9. BASS / BASS-II SIBAL cotton-fiberglass fabric: `SIBAL-*` and `material.cotton.*` (owner: Ruthwik)

Source **ZH**: Zhao, T'ien, Ferkul, Olson (2015), *Concurrent flame growth, spread and extinction over composite fabric
samples in low speed purely forced flow in microgravity*, 9th US National Combustion Meeting, NTRS 20150008962
(full text read; Fig. 4 rendered and read as an image).

| Field | Value | Status | Passage (ZH) |
|---|---|---|---|
| Hardware | small flow duct in the MSG | ✅ confirmed | §2: "small flow duct of cross-sectional size of 7.6 cm × 7.6 cm. The flow speed could be varied from 1 to 55 cm/s" |
| Pressure | 101.3 kPa | ✅ confirmed | §2: "Ambient pressure was 1 atm" |
| O₂, flow per row | GMT96-T7 21% / 10, GMT96-T8 21% / 5, GMT178-T11 17.1% / 4, GMT190-T19 17.2% / 11 cm/s | ✅ confirmed | Appendix test table (fixed-flow tests only; tests where flow was ramped are left out) |
| g | 0.0 | ✅ confirmed | Abstract: "aboard the International Space Station" |
| Investigation label | GMT96 = BASS, others = BASS-II | ✅ confirmed | Appendix "Comments" column marks GMT96 tests "BASS" |

- [x] Sign off group 9: 4 rows marked `verified=true` (every field stated in ZH; no inference)

**Cotton calibration (`material.cotton.v0`, `.o2_exponent`, `.u_q`) is DIGITIZED** from ZH Fig. 4 (steady spread rate vs.
flow, log x-axis 2–20 cm/s, linear y 0–3.5 mm/s), 2.2 cm samples only:
(21%, 10.0 cm/s, 2.72 mm/s), (21%, 5.0, 1.76), (18.8%, 2.4, 0.78), (18.8%, 2.6, 0.84), (17.6%, 3.0, 0.82),
(17.1%, 4.0, 0.99), (16.9%, 3.7, 0.88). Fit `v = v0 (X/0.21)^a · u/(u + u_q)`, no blowoff (ZH appendix: no blow-off up to
29–53 cm/s at 16.9–18.7% O₂): v0 = 6.07 ± 0.17 mm/s, a = 2.08 ± 0.06, u_q = 12.3 ± 0.6 cm/s, R² ≈ 1.0 on 7 points.
Caveats: ZH says flames "spread more slowly across the narrower samples", so cabin-sized fabric may spread faster;
above 21% O₂ the fit is an extrapolation. Concurrent fabric spread rises with flow, unlike opposed PMMA spread, which is
why cotton has its own flame parameters instead of sharing `flame.*`.

- [ ] Second reader: re-digitize Fig. 4 independently and check the 7 points (±0.05 mm/s)

## 9. Investigation summaries in `investigations.json`: SAME, DAFT, ACME (owner: Sibi)

Every field of the three summary objects (objective, hardware, fuel, conditions, varied, held constant, sensors,
findings, sources) was checked against the full sources already read for §1–5: S2 text and Table 1, TM, DA slides,
AC, DE Table 3.1, WR Appendix B.

| Change | Why |
|---|---|
| **Removed** the SAME finding "the diameter of average mass increased on average by a factor of 1.7 in low gravity" (also from `witness_docs/SAME.md`) | The Yang et al. (2015) abstract says only "increased on average by a factor of 1.7" and doesn't name the baseline. The sentence before it is about zero external flow, so "in low gravity" was an unsupported reading. The confirmed zero-flow effect (D30 30–40% larger, S2 §4) is already a finding. |
| DAFT sampling locations: "US Lab and Node" → "two locations in the Lab, and the Node" | DA slide 26 wording |
| DAFT sources: added S2 | The P-Trak condenser grooves and their separate space test come from S2 §II.B, not the DAFT slides |

Not changed, but worth knowing:
- SAME and DAFT conditions use the section 0 cabin-air rule (the summaries say so in `diluents`).
- ACME `conditions.flow_cm_s = 0` describes BRE (still chamber). The other ACME studies (coflow, gas-jet) used burner flows.
- The investigation name "DAFT, DAFT-2" is the team's scope label. DA calls the flight runs "DAFT 1-2" and "DAFT 3-4" (Expeditions 10 and 13), not two separately named flights.

- [x] Sign off SAME, DAFT and ACME summaries: `verified: true`. Signed off by Sibi, 15 Nov 2026.
- [ ] BASS and FLEX summaries: Ruthwik's paper split. CFI, SPICE, SLICE: no data yet.
