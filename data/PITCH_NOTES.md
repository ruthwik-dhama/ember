# Data honesty: pitch and demo notes (owner: Sibi, for Kavin)

Talking points for the "every number shows how much real data backs it" part of the pitch and demo.
**Rule 7 still applies:** any metric on a slide comes from `deck_numbers.json` (regenerate it with
`cd backend && python -m scripts.metrics`). The keys are named below. The other facts here come straight from the data
files and can be re-counted at any time.

## 1. The one-line idea

> EMBER never shows a number without saying how much real NASA data backs it.

Every value gets a badge, generated from the data, never hand-labelled:

| Badge | Meaning | Where it comes from |
|---|---|---|
| 🟢 Measured | Inside conditions a PSI experiment actually tested | Envelope Guard: close to a real test row, at a tested gravity |
| 🟡 Interpolated | Between tested conditions | Inside the tested ranges, but not on a test (includes **all** partial gravity) |
| 🔴 Extrapolated | Outside every tested condition | Beyond the tested range on at least one axis (O₂, pressure, airflow, gravity) |

## 2. Why the Moon and Mars are always 🟡 (say this out loud; judges will ask)

- PSI has combustion data at **0 g** (ISS) and **1 g** (ground), and **none in between**. LUCI and FM2 are expected to add some.
- So anything at lunar (0.165 g) or Martian (0.38 g) gravity is interpolated **by rule**. EMBER refuses to call it measured.
- It's a feature, not a weakness: the data gap map shows exactly where future experiments are needed.

## 3. The Moon base atmosphere is real tested data, apart from gravity

- The planned Moon base / rover atmosphere is about 30% O₂ at 10.2 psi (70.3 kPa).
- NASA's Burning Rate Emulator (BRE, part of ACME) burned flames on the ISS at **exactly 10.2 psia**, and at 8.2 and 14.7 psia.
  Three of its atmospheres were NASA-selected habitat atmospheres (21% at 1 bar, 26.5% at 0.7 bar, 34% at 0.565 bar).
  Source: Dehghani 2022 and Wright 2021 (UMD), test tables.
- In EMBER, the Moon base atmosphere in still air is 🟢 **at 0 g** (nearest test `BRE-20261J1`: 29% O₂, 70.3 kPa).
  At lunar gravity it drops to 🟡. **Gravity is the only data gap.**

## 4. How we checked the data (credibility)

- `data/tested_conditions.csv`: **45 of 48** real test conditions are verified against their sources (count rows with
  `verified=true`). The 3 left are 1 g ground-lab rows whose lab pressure isn't stated in the paper.
- Every row cites a public source (NASA NTRS, DOI, or a university thesis). There are no placeholder citations.
- `data/VERIFICATION.md` lists, row by row, what each source **confirms** and what we **inferred**.
- **We changed our own data when the full papers disagreed:**
  - Two early ACME rows were wrong. Methane was only ever burned on the 25 mm burner, at 1 atm, so we replaced them with real test IDs.
  - We **removed** a smoke-size claim ("1.7× larger in low gravity") because the paper doesn't say what the 1.7 compares.
  - Unverifiable SAME-1 rows were dropped and replaced with three runs from NASA's flight log.

## 5. Witnesses (Ask EMBER) never make things up

- One witness agent per investigation. It answers **only** from that investigation's fact file, and every fact carries a citation.
- A fact without a citation is never loaded, so it can't reach an answer.
- An off-topic question ("best pizza topping?") gets "no witness has cited PSI data on this", not an invented answer.
- It works **fully offline**; the optional Claude phrasing is cached, and any sentence without a citation is dropped.
- Deck keys: `witness_accuracy`, `witness_citation_rate`. **Caveat to say:** we wrote the 15 test questions ourselves,
  so treat accuracy as an upper bound, not an independent benchmark.

## 6. Badge coverage: be upfront

- Deck keys: `badge_coverage_green_pct`, `badge_coverage_yellow_pct`, `badge_coverage_red_pct`. These are shares of the
  simulator's constants that are measured / fitted / assumed (`data/calibration.csv`).
- A large share is still `assumed`. **Say it plainly.** The point of EMBER is that you can see which numbers to trust.

## 7. Findings worth a slide (values from `deck_numbers.json`)

- **Gravity changes detection time** (`gravity_delay_s_0g`, `_moon`, `_mars`, `_1g`). At **0 g** the ceiling detector
  **never alarms within 300 s** (the value is empty on purpose; its note says so). Without buoyancy, smoke doesn't rise to
  the ceiling. That matches SAME: in microgravity, smoke transport is dominated by mixing.
- **Two-moment detectors reject regolith dust** (`dust_false_alarm_rate_single` vs `dust_false_alarm_rate_two_moment`),
  building on SAME's prototype MPASS sensor. DAFT measured ISS cabin air below 0.005 mg/m³ and below 15 particles/cm³,
  and showed that separating Velcro alone makes a particle spike.
- **Ghost Flame: "fire out" may be wrong** (`false_all_clear_rate`, liquid fuels only). FLEX found heptane droplets that
  keep burning as invisible cool flames after the visible flame goes out.

## 8. Demo tips

- Demo order (planet UI, #35, with auto-run from #39):
  1. **Mission setup:** Moon base → Save mission → Next. Leave **Ventilation on** checked.
  2. **Experiment explorer:** click Compare on SAME and DAFT → Next.
  3. **Ranking:** click "detection" (DAFT jumps to #1: airlock dust) → **Start project**.
  4. **Watch the agents.** No button: the Red vs Blue duel starts on its own, then the Ghost Flame liquid-fuel demo.
     Narrate the Agents feed round by round. In the demo part, point at "Camera could report 'out' while a cool flame
     still burns". The progress bar on **Insights / Report** shows how far along both runs are.
  5. **Ask EMBER** (right panel) while the agents run: one of the questions below. It shows the single best witness.
  6. **Insights / Report** (unlocks when both runs finish): top risks, fixes, the duel and Ghost Flame sections,
     gap map, and **Compare gravity** (Earth 132 s → Moon 254 s → 0 g never).
  7. Close the report and **click the dome** (or "Go inside the habitat") to see the 3D replay.
- Preset missions with ventilation on load both runs from cache, so Insights unlocks in well under a minute. A custom
  mission, or ventilation off, runs live (a few minutes), and Insights stays locked until it finishes. Use a preset.
- Good Ask EMBER questions (each answers with citations):
  - "How big are smoke particles in microgravity?" (SAME)
  - "How clean is the ISS cabin air?" (DAFT)
  - "Below what oxygen concentration do BRE flames put themselves out?" (ACME)
  - "Can a droplet keep burning invisibly after the visible flame goes out?" (FLEX)
- **Red picks methanol fires, even on cotton/PMMA missions.** The report header lists the mission's materials, but Red
  searches every material in the PSI data, so its top risks are methanol fires. Don't hide it; say it as a choice:
  > "Red isn't limited to what's on the packing list. It stress-tests every fuel the PSI experiments burned, because
  > the fire you didn't plan for is the dangerous one. Here, a low methanol fire is never detected in 300 seconds."
  If a judge asks: restricting Red to the mission's materials is a small change (pass the materials into the duel) that we held back so the demo build stayed frozen.
- Duels and reports for the presets are precomputed and committed, so they load instantly with no network.
  A **custom** mission or fire triggers a fresh duel (about a minute).
