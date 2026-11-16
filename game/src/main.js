// STARPOST: the game loop, state machine and screenshot mode.
//
// States: title -> ready -> aiming -> flying -> delivered -> (next level | win)
// A lost parcel returns to ready with one fewer parcel; none left ends the run.
// ?shot=start|play|win|lose renders one fixed scene for screenshots.
// window.__starpost exposes the game for automated play-testing.

import { LEVELS, PARCELS_PER_LEVEL, PLAYFIELD } from './levels.js';
import { stepRocket, stepAsteroids, simulatePath, solveLaunch, launchVelocity } from './physics.js';
import { SoundBank } from './audio.js';
import { attachInput } from './input.js';
import { makeStars, drawWorld, drawHUD, drawTitle, drawDelivered, drawGameOver, drawWin, drawPaused } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = PLAYFIELD.w;
canvas.height = PLAYFIELD.h;

const sounds = new SoundBank();

function freshLevelState(index, seed) {
  const def = LEVELS[index];
  // Deep-copy the mutable parts (asteroids move) so a retry is a clean level.
  return {
    ...def,
    planets: def.planets.map((p) => ({ ...p })),
    asteroids: def.asteroids.map((a) => ({ ...a })),
    station: { ...def.station },
    pad: { ...def.pad },
    seed,
  };
}

const game = {
  state: 'title',
  paused: false,
  levelIndex: 0,
  level: freshLevelState(0, 1001),
  stars: makeStars(1001),
  rocket: { x: 0, y: 0, vx: 0, vy: 0 },
  trail: [],
  aim: null,
  preview: null,
  parcelsLeft: PARCELS_PER_LEVEL,
  delivered: 0,
  score: 0,
  scoreAtLevelStart: 0,
  levelTime: 0,
  totalTime: 0,
  flightTime: 0,
  lastBonus: 0,
  deliveredTimer: 0,
  time: 0,
};

function parkRocket() {
  game.rocket = { x: game.level.pad.x, y: game.level.pad.y - 16, vx: 0, vy: 0 };
  game.trail = [];
  game.aim = null;
  game.preview = null;
}

function loadLevel(index) {
  game.levelIndex = index;
  game.level = freshLevelState(index, 1001 + index * 77);
  game.stars = makeStars(1001 + index * 77);
  game.parcelsLeft = PARCELS_PER_LEVEL;
  game.levelTime = 0;
  game.scoreAtLevelStart = game.score;
  parkRocket();
  game.state = 'ready';
}

function startGame() {
  game.score = 0;
  game.delivered = 0;
  game.totalTime = 0;
  loadLevel(0);
  sounds.ensure();
  sounds.startMusic();
}

function retryLevel() {
  game.score = game.scoreAtLevelStart;
  loadLevel(game.levelIndex);
}

function launchRocket(vx, vy) {
  game.rocket.vx = vx;
  game.rocket.vy = vy;
  game.flightTime = 0;
  game.state = 'flying';
  game.aim = null;
  game.preview = null;
  sounds.launch();
}

function onDelivered() {
  const timeBonus = Math.max(0, Math.round((game.level.par - game.levelTime) * 5));
  game.lastBonus = 1000 + timeBonus;
  game.score += game.lastBonus;
  game.delivered += 1;
  game.state = 'delivered';
  game.deliveredTimer = 1.7;
  sounds.chime();
}

function onParcelLost() {
  game.parcelsLeft -= 1;
  sounds.crash();
  if (game.parcelsLeft <= 0) {
    game.state = 'gameover';
  } else {
    parkRocket();
    game.state = 'ready';
  }
}

function advanceAfterDelivery() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'win';
    sounds.win();
  } else {
    loadLevel(game.levelIndex + 1);
  }
}

attachInput(canvas, {
  onAimStart(p) {
    sounds.ensure();
    if (game.state === 'title') { startGame(); return; }
    if (game.state === 'delivered') return;
    if (game.state === 'gameover' || game.state === 'win') { retryLevel(); return; }
    if (game.state === 'ready' || game.state === 'aiming') {
      game.state = 'aiming';
      game.aim = p;
      game.preview = null;
    }
  },
  onAimMove(p) {
    if (game.state !== 'aiming') return;
    game.aim = p;
    const v = launchVelocity(game.rocket.x, game.rocket.y, p.x, p.y);
    game.preview = v
      ? simulatePath(game.rocket.x, game.rocket.y, v.vx, v.vy, game.level)
      : null;
  },
  onAimEnd(p) {
    if (game.state !== 'aiming') return;
    const v = p ? launchVelocity(game.rocket.x, game.rocket.y, p.x, p.y) : null;
    if (v) launchRocket(v.vx, v.vy);
    else {
      game.state = 'ready';
      game.aim = null;
      game.preview = null;
    }
  },
  onConfirm() {
    sounds.ensure();
    if (game.state === 'title') startGame();
    else if (game.state === 'delivered') advanceAfterDelivery();
    else if (game.state === 'gameover') retryLevel();
    else if (game.state === 'win') startGame();
  },
  onRestart() {
    if (game.state === 'title') return;
    if (game.state === 'win') startGame();
    else retryLevel();
  },
  onPause() {
    if (['ready', 'aiming', 'flying'].includes(game.state)) {
      game.paused = !game.paused;
    }
  },
  onMute() {
    sounds.toggleMute();
  },
});

function step(dt) {
  game.time += dt;
  if (game.paused) return;
  if (game.state === 'flying') {
    game.levelTime += dt;
    game.totalTime += dt;
    game.flightTime += dt;
    stepAsteroids(game.level, dt);
    const outcome = stepRocket(game.rocket, game.level, dt);
    game.trail.push({ x: game.rocket.x, y: game.rocket.y });
    if (game.trail.length > 120) game.trail.shift();
    if (outcome === 'delivered') onDelivered();
    else if (outcome === 'crashed' || outcome === 'lost') onParcelLost();
    // A rocket caught in a stable orbit never comes home: 8 s of fuel,
    // then the parcel is lost.
    else if (game.flightTime > 8) onParcelLost();
  } else if (game.state === 'ready' || game.state === 'aiming') {
    game.levelTime += dt;
    game.totalTime += dt;
    stepAsteroids(game.level, dt);
  } else if (game.state === 'delivered') {
    game.deliveredTimer -= dt;
    if (game.deliveredTimer <= 0) advanceAfterDelivery();
  }
}

function render() {
  ctx.clearRect(0, 0, PLAYFIELD.w, PLAYFIELD.h);
  if (game.state === 'title') {
    drawTitle(ctx, game);
    return;
  }
  drawWorld(ctx, game, game.time);
  drawHUD(ctx, game);
  if (game.state === 'delivered') drawDelivered(ctx, game);
  else if (game.state === 'gameover') drawGameOver(ctx, game);
  else if (game.state === 'win') drawWin(ctx, game);
  if (game.paused) drawPaused(ctx);
}

// Screenshot mode: ?shot=start|play|win|lose renders one fixed, readable
// scene with no animation, for the entry's screenshots.
function applyShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  game.time = 1.0;
  if (shot === 'start') {
    game.state = 'title';
  } else if (shot === 'play') {
    loadLevel(1);
    game.state = 'aiming';
    game.delivered = 1;
    game.score = 1450;
    game.parcelsLeft = 2;
    game.levelTime = 12;
    parkRocket();
    const solution = solveLaunch(game.level);
    if (solution) {
      game.aim = {
        x: game.rocket.x - solution.vx / 2.2,
        y: game.rocket.y - solution.vy / 2.2,
      };
      game.preview = simulatePath(game.rocket.x, game.rocket.y, solution.vx, solution.vy, game.level);
    }
  } else if (shot === 'win') {
    loadLevel(4);
    game.state = 'win';
    game.delivered = 5;
    game.score = 6840;
    game.totalTime = 187;
  } else if (shot === 'lose') {
    loadLevel(2);
    game.state = 'gameover';
    game.delivered = 2;
    game.score = 2310;
    game.parcelsLeft = 0;
  }
  render();
  return true;
}

// Play-test hook: drives the game from the browser console or CDP.
window.__starpost = {
  game,
  LEVELS,
  solveLaunch: (level) => solveLaunch(level || game.level),
  launchSolution() {
    const solution = solveLaunch(game.level);
    if (!solution) return null;
    launchRocket(solution.vx, solution.vy);
    return solution;
  },
  reset: startGame,
};

if (!applyShotMode()) {
  // Fixed 1/120 s timestep: the flight integrates exactly like the
  // trajectory preview, so what the player aims at is what flies.
  const STEP = 1 / 120;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 8) {
      step(STEP);
      acc -= STEP;
      n++;
    }
    if (n === 8) acc = 0;
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
