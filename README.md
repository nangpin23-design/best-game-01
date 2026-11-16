# STARPOST

The last postman of the starlanes. Slingshot your rocket around the planets
and land inside the amber station ring — three parcels per sector, five
sectors, one sun you must never touch.

## How to play

- **Drag back** from the rocket and **release** to launch. The dotted line
  previews your flight; it turns green when the shot is on target.
- Planets bend your flight with gravity. Asteroids and the sun destroy the
  rocket. Fly off the edge and the parcel is lost.
- Deliver all 5 parcels to finish. Faster deliveries earn a bigger bonus.
- **Enter** start / continue, **R** retry the sector, **P** pause, **M** mute.

## Run it

Serve `game/` with any static server and open `index.html` in desktop
Chrome. No build step, no network requests — everything is a file under
`game/` or drawn in code. Sound is synthesised live with Web Audio.

```
node serve.ts   # if present, or: python3 -m http.server --directory game 8080
```

## Files

- `game/index.html` — the page and canvas shell
- `game/src/main.js` — game loop, state machine, screenshot mode
- `game/src/levels.js` — the five sectors
- `game/src/physics.js` — gravity, collisions, trajectory preview, solver
- `game/src/render.js` — all canvas drawing and screens
- `game/src/input.js` — mouse drag aim and keyboard
- `game/src/audio.js` — procedural Web Audio sounds and music
- `game/src/random.js` — seeded random numbers
- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
