// Flight physics for STARPOST: gravity from every planet and the sun,
// collision tests, the dotted trajectory preview, and a solver that searches
// for a launch velocity that delivers (used by the play-test hook).

import { PLAYFIELD, ROCKET_RADIUS } from './levels.js';

// Gravity constant: with mass 1.0, a rocket 250 px out feels about 350 px/s^2.
export const G = 2.2e7;
export const MAX_LAUNCH_SPEED = 760;
export const LAUNCH_POWER = 2.2;
export const OFFSCREEN_MARGIN = 90;

function gravityAt(x, y, level) {
  let ax = 0;
  let ay = 0;
  for (const p of level.planets) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d2 = dx * dx + dy * dy + 400; // softened so the pull never explodes
    const pull = (G * p.mass) / d2;
    const d = Math.sqrt(d2);
    ax += (dx / d) * pull;
    ay += (dy / d) * pull;
  }
  if (level.sun) {
    const dx = level.sun.x - x;
    const dy = level.sun.y - y;
    const d2 = dx * dx + dy * dy + 400;
    const pull = (G * level.sun.mass) / d2;
    const d = Math.sqrt(d2);
    ax += (dx / d) * pull;
    ay += (dy / d) * pull;
  }
  return { ax, ay };
}

// Outcome of one flight step: 'flying' | 'delivered' | 'crashed' | 'lost'.
// Mutates rocket {x, y, vx, vy} in place.
export function stepRocket(rocket, level, dt) {
  const { ax, ay } = gravityAt(rocket.x, rocket.y, level);
  rocket.vx += ax * dt;
  rocket.vy += ay * dt;
  rocket.x += rocket.vx * dt;
  rocket.y += rocket.vy * dt;

  const s = level.station;
  const ds = Math.hypot(rocket.x - s.x, rocket.y - s.y);
  if (ds < s.r * 0.9) return 'delivered';

  for (const p of level.planets) {
    if (Math.hypot(rocket.x - p.x, rocket.y - p.y) < p.r + ROCKET_RADIUS) {
      return 'crashed';
    }
  }
  if (level.sun && Math.hypot(rocket.x - level.sun.x, rocket.y - level.sun.y) < level.sun.r + ROCKET_RADIUS) {
    return 'crashed';
  }
  for (const a of level.asteroids) {
    if (Math.hypot(rocket.x - a.x, rocket.y - a.y) < a.r + ROCKET_RADIUS) {
      return 'crashed';
    }
  }
  if (
    rocket.x < -OFFSCREEN_MARGIN ||
    rocket.x > PLAYFIELD.w + OFFSCREEN_MARGIN ||
    rocket.y < -OFFSCREEN_MARGIN ||
    rocket.y > PLAYFIELD.h + OFFSCREEN_MARGIN
  ) {
    return 'lost';
  }
  return 'flying';
}

// Move the asteroids for dt seconds; they drift and bounce off the walls.
export function stepAsteroids(level, dt) {
  for (const a of level.asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x < a.r || a.x > PLAYFIELD.w - a.r) a.vx *= -1;
    if (a.y < a.r || a.y > PLAYFIELD.h - a.r) a.vy *= -1;
    a.x = Math.max(a.r, Math.min(PLAYFIELD.w - a.r, a.x));
    a.y = Math.max(a.r, Math.min(PLAYFIELD.h - a.r, a.y));
  }
}

// Simulate a flight from (x, y) with velocity (vx, vy) and return the path
// points plus the outcome. Asteroids are frozen at their current spots so
// the preview matches what the player sees when they release. Uses the same
// 1/120 s fixed step as the game loop, so the preview is the real flight.
export function simulatePath(x, y, vx, vy, level, steps = 600, dt = 1 / 120) {
  const probe = { x, y, vx, vy };
  const points = [];
  let outcome = 'flying';
  for (let i = 0; i < steps; i++) {
    outcome = stepRocket(probe, level, dt);
    if (i % 3 === 0) points.push({ x: probe.x, y: probe.y });
    if (outcome !== 'flying') break;
  }
  return { points, outcome };
}

// Search a coarse grid of launch directions and speeds for one that
// delivers. Launches from the parked rocket spot, 16 px above the pad —
// the same spot the game launches from. Returns {vx, vy} or null.
// Used by the play-test hook.
export function solveLaunch(level) {
  const pad = level.pad;
  for (let speed = 180; speed <= MAX_LAUNCH_SPEED; speed += 20) {
    for (let deg = 0; deg < 360; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;
      const { outcome } = simulatePath(pad.x, pad.y - 16, vx, vy, level, 720);
      if (outcome === 'delivered') return { vx, vy };
    }
  }
  return null;
}

// Launch velocity for a drag: pull back from the rocket, release, and the
// rocket flies the opposite way. Returns null for a drag too short to count.
export function launchVelocity(rocketX, rocketY, pointerX, pointerY) {
  const dx = rocketX - pointerX;
  const dy = rocketY - pointerY;
  const len = Math.hypot(dx, dy);
  if (len < 18) return null;
  const speed = Math.min(len * LAUNCH_POWER, MAX_LAUNCH_SPEED);
  return { vx: (dx / len) * speed, vy: (dy / len) * speed };
}
