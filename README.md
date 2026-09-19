# Michael’s March Madness

**A little logic. A lot of madness.** A browser-based bracket workbench: pick teams, dial up the uncertainty, and build a bracket that feels like yours.

## Demo

[Open the app](https://michaelsanders08.github.io/MichaelsMarchMadness/) or run locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
# Open http://127.0.0.1:4173
```

No package install, API key, account, or backend. ES modules need an HTTP server; opening index.html as a file will not work.

1. Pick an underdog in South.
2. Leave personality on Balanced and choose **Fill the rest**.
3. Review the Final Four; your manual pick remains intact.
4. Change an earlier result. Incompatible downstream picks clear automatically.
5. Export the bracket, reload, or print every region to PDF.

## Included

- Complete 64-team, 63-game tournament with region tabs and a Final Four view.
- Manual selection, clearing, dependency-aware advancement, and next-unpicked navigation.
- Reproducible seeded fills that preserve manual picks.
- Chalk, Balanced, and Chaos personalities.
- Local persistence; JSON export/import includes the field, settings, and picks.
- Custom field editor with validation (64 unique ids; seeds 1–16 in each region).
- Responsive, keyboard-operable controls, reduced-motion support, and print layout.
- No analytics, sports API, betting integration, or account infrastructure.

## Data and method

The default is the **2025 men's field after the First Four**, transcribed from the [official NCAA bracket](https://www.ncaa.com/brackets/print/basketball-men/d1/2025). It is a historical snapshot, not a current feed. No official scores, branding, or logos are reproduced. Region pairings follow that field: South–West and East–Midwest. Custom fields retain those pairings.

Chalk picks the lower seed, breaking equal seeds with seeded randomness. Balanced uses `1 / (1 + exp((seedA - seedB) / 4))` for team A. Chaos makes every matchup a 50/50 draw. Intermediate chaos values interpolate between these points. These are **uncalibrated heuristics**, not estimates based on real team performance. A given field, starting picks, seed, and personality produces the same completed bracket. The generator consumes one draw per game, including preselected games.

Editing a winner recomputes validity throughout the tournament. When an opponent becomes unknown, that later game's pick clears even if its other participant is unchanged. This avoids keeping decisions for unformed matchups.

Local storage is device/browser-specific; export before switching devices or clearing browser data. Malformed imports leave the current state untouched. Text from imports is rendered safely. Initial typography uses Google Fonts with local fallbacks; gameplay does not make network requests.

## Verify

Requires Node 20+ for tests only:

```sh
npm test
```

Tests cover tournament shape, deterministic fills, manual picks, downstream invalidation, chalk behavior, symmetric probabilities, field validation, export roundtrips, and invalid selections. GitHub Actions runs the same suite.

GitHub Pages serves the root of `main`. All app URLs are relative so project-site hosting works. MIT licensed. Independent project; not affiliated with the NCAA.

## Follow the tournament

Switch from **My predictions** to **Record results** to enter actual winners on a separate board. Scoring uses 1–2–4–8–16–32 points by round (192 maximum). Earned points, remaining potential and a round breakdown update after each result; an eliminated predicted champion loses its future potential immediately. Export includes both boards. Earlier version 1 exports still import. Results are manual; the app does not claim a live feed or enforce contest locks. Changing the field clears both boards.
