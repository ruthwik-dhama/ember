# Data verification sheet: SAME / SAME-R, DAFT, ACME (owner: Sibi)

How to use this: each row group lists what the source **confirms** (with the passage it comes from) and
what was **inferred** (not stated in the source). Every row in `tested_conditions.csv` stays `verified=false` until
Sibi signs off on its group below. Rows whose only inferred fields are ISS cabin O₂ and pressure can be flipped
once the team accepts the cabin-nominal rule (section 0).

Sources (all public):
- **S2**: Urban et al., *Particle Morphology and Size Results from SAME-2*, AIAA 2012-3536, NTRS 20130000422 (full text read)
- **S1**: Urban et al., SAE 2009-01-2468 (abstract only)
- **DA**: Urban, Ruff, Sheredy, Funk, *Particle and Smoke Detection on ISS for Next Generation Smoke Detectors*, ISDC 2007, NTRS 20070031686 (slides read)
- **AC**: Stocker, *Recent Research on Flames of Gaseous Fuel Aboard the ISS*, 33rd JASMAC 2021, NTRS 20210021781 (full text read)
- **DE**: Dehghani, UMD dissertation 2022, hdl:1903/29303 (abstract only)
- **WR**: Wright, UMD thesis 2021, hdl:1903/27484 (abstract only)

## 0. Team rule to decide: ISS cabin nominal atmosphere

None of the SAME, DAFT or BRE sources states the O₂ fraction or pressure of the air used. The rows use
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

## 3. SAME-1, 5 materials at 8 cm/s: `SAME1-*-08`

| Field | Value | Status | Passage |
|---|---|---|---|
| Materials | Teflon, Kapton, cellulose, silicone rubber, dibutyl phthalate | ✅ confirmed | S1 abstract lists these five |
| Flow | 8.0 cm/s | ⚠️ inferred | S1 abstract gives no flow value. S2 calls 8 cm/s "the baseline", and S2 says it "built upon the results of the original flight", but doesn't say SAME-1 used 8 cm/s |
| g | 0.0 | ✅ confirmed | MSG on ISS, Expedition 15 (S1) |
| O₂ / pressure | 0.21 / 101.3 kPa | ⚠️ inferred | Section 0 |

- [ ] Need the S1 full text (SAE paywall) or the NIST SAME final report to confirm the flow, or drop these 5 rows

## 4. ACME / BRE, Dehghani: `BRE-C2H4-25-{210,265,340,400}`

| Field | Value | Status | Passage (DE abstract) |
|---|---|---|---|
| Fuel / burner | N₂-diluted ethylene, 25 mm porous burner | ✅ confirmed | "gaseous ethylene diluted with varying amounts of nitrogen", "25 mm" |
| O₂ | 0.21, 0.265, 0.34, 0.40 | ✅ confirmed | "21% … self-extinguished within 40 s"; "steady flames at 26.5, 34 and 40% oxygen" |
| Pressure | 101.3 kPa | ⚠️ inferred | DE abstract says pressure was varied but gives no values. WR gives 0.57–1 bar for the same ISS tests, so 1 atm is the upper end, not confirmed per O₂ level |
| Flow | 0.0 (still air) | ✅ confirmed | AC §3.3: flames "burn for minutes in the absence of an air flow" |
| g | 0.0 | ✅ confirmed | ISS CIR |

- [ ] Sign off O₂ and fuel. Pressure needs the DE full text (Chapter on test matrix) or stays 🟡

## 5. ACME / BRE, Wright: `BRE-C2H4-25-340-LP`, `BRE-CH4-50-210-LP`, `BRE-CH4-50-400`

| Field | Value | Status | Passage (WR abstract) |
|---|---|---|---|
| Fuels / burners | ethylene and methane, 25 and 50 mm | ✅ confirmed | "ethylene and methane … 25 and 50 mm burners" |
| O₂ range | 0.21–0.40 | ✅ confirmed | "XO2 from 0.21 to 0.4" |
| Pressure range | 57–100 kPa | ✅ confirmed | "pressures from 0.57 to 1 bar" |
| **Specific pairings** (0.34 @ 57 kPa ethylene 25 mm; 0.21 @ 57 kPa methane 50 mm; 0.40 @ 100 kPa methane 50 mm) | | ⚠️ inferred | The abstract gives ranges only. These are corners of the reported envelope, chosen so the guard's ranges match the paper. 0.34 @ 57 kPa matches NASA's planned exploration atmosphere, but that isn't confirmed for BRE |

- [ ] Need the WR full text test matrix to confirm pairings, or replace with confirmed ones

These three rows matter most: they are what extend the tested pressure range down to 57 kPa, which moves the Moon
base (70.3 kPa) from 🔴 to 🟡 on the pressure axis.

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

- [ ] Decide DAFT ranking approach

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
| Pressure | 101.3 kPa | ⚠️ inferred | Not stated. The duct fan draws from and exhausts to the MSG work volume ("combustion products exit the duct and mix with the gas in the work volume"), so pressure is taken as ISS cabin nominal under the section 0 rule. O₂ is **not** inferred: it was set per test and is measured in Table S1 |

Note on units: in Table S1 the left half labels V_f "×10³ (cm/s)" and the right half (0.64 cm rods) "×10³ (mm/s)".
The values are cm/s in both halves. With cm/s, 0.64 cm rods in microgravity spread faster than the 1 g Table S2 values
below 19% O₂, which is what the paper states ("below X_O2 = 19% the flame spread becomes faster in microgravity").
With mm/s they would be about 10× slower, contradicting it. `calibration.csv` (material.pmma.v0 and the flame fit) uses cm/s.

- [x] Extend the section 0 rule to BASS-II **pressure only** (MSG work volume at ISS cabin nominal). Accepted by Ruthwik, 15 Nov 2026.
- [x] Sign off group 8: 6 rows marked `verified=true` (`BASSII-B13a`, `-B6`, `-B16-hi`, `-B16-lo`, `-B19`, `-B10`)
- [ ] `G-BASSII-*` (1 g, UC Berkeley flow duct, Table S2) stay `verified=false`: lab pressure isn't stated, and the ISS cabin rule doesn't apply to a ground lab
