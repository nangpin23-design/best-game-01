// All canvas drawing for STARPOST: the starfield, planets, station ring,
// rocket and trail, the HUD, and the title / pause / game-over / win screens.
// Palette: deep indigo space, amber station rings, teal rocket.

import { PLAYFIELD } from './levels.js';
import { mulberry32, range } from './random.js';

export function makeStars(seed, count = 150) {
  const rng = mulberry32(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: range(rng, 0, PLAYFIELD.w),
      y: range(rng, 0, PLAYFIELD.h),
      r: range(rng, 0.6, 2.2),
      tw: range(rng, 0, Math.PI * 2),
      warm: rng() < 0.25,
    });
  }
  return stars;
}

function drawBackground(ctx, stars, time) {
  const g = ctx.createLinearGradient(0, 0, 0, PLAYFIELD.h);
  g.addColorStop(0, '#0a0a24');
  g.addColorStop(0.55, '#101038');
  g.addColorStop(1, '#1a0f33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PLAYFIELD.w, PLAYFIELD.h);
  for (const s of stars) {
    const a = 0.45 + 0.4 * Math.sin(time * 1.6 + s.tw);
    ctx.globalAlpha = a;
    ctx.fillStyle = s.warm ? '#ffd9a0' : '#dfe8ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlanet(ctx, p, time) {
  const g = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y, p.r);
  g.addColorStop(0, p.color);
  g.addColorStop(1, '#141428');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  // Craters.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < 4; i++) {
    const ang = i * 1.7 + p.x;
    const cx = p.x + Math.cos(ang) * p.r * 0.45;
    const cy = p.y + Math.sin(ang) * p.r * 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, p.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  // Gravity hint ring, gently pulsing.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 14 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.name, p.x, p.y - p.r - 24);
}

function drawSun(ctx, sun, time) {
  const pulse = 1 + Math.sin(time * 3) * 0.02;
  const g = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.2, sun.x, sun.y, sun.r * 1.6);
  g.addColorStop(0, 'rgba(255,214,90,0.9)');
  g.addColorStop(0.5, 'rgba(255,140,40,0.45)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.r * pulse);
  core.addColorStop(0, '#fff3c4');
  core.addColorStop(0.6, '#ffb347');
  core.addColorStop(1, '#ff6a00');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE SUN — do not touch', sun.x, sun.y - sun.r - 24);
}

function drawStation(ctx, s, time) {
  const pulse = 1 + Math.sin(time * 2.4) * 0.05;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,179,71,0.35)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, s.r + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,179,71,0.16)';
  ctx.beginPath();
  ctx.arc(0, 0, s.r - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffd9a0';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DELIVER HERE', s.x, s.y - s.r - 16);
}

function drawAsteroid(ctx, a) {
  ctx.fillStyle = '#8d8fa8';
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(a.x - a.r * 0.3, a.y - a.r * 0.25, a.r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(a.x + a.r * 0.35, a.y + a.r * 0.3, a.r * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawPad(ctx, pad) {
  ctx.fillStyle = '#2c2c54';
  ctx.fillRect(pad.x - 34, pad.y - 6, 68, 12);
  ctx.fillStyle = '#3ec6b8';
  ctx.fillRect(pad.x - 34, pad.y - 10, 68, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LAUNCH PAD', pad.x, pad.y + 30);
}

function drawRocket(ctx, rocket) {
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(Math.atan2(rocket.vy, rocket.vx) + Math.PI / 2);
  // Body.
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(8, 8);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  // Window.
  ctx.fillStyle = '#3ec6b8';
  ctx.beginPath();
  ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Fins.
  ctx.fillStyle = '#ff7a59';
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-13, 14);
  ctx.lineTo(-5, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.lineTo(13, 14);
  ctx.lineTo(5, 12);
  ctx.closePath();
  ctx.fill();
  // Flame.
  const flick = 8 + Math.random() * 8;
  ctx.fillStyle = 'rgba(255,170,60,0.9)';
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(0, 12 + flick);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTrail(ctx, trail) {
  if (trail.length < 2) return;
  ctx.strokeStyle = 'rgba(62,198,184,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
  ctx.stroke();
}

function drawAim(ctx, rocket, aim, preview) {
  if (!aim) return;
  // Slingshot band from rocket to pointer.
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rocket.x, rocket.y);
  ctx.lineTo(aim.x, aim.y);
  ctx.stroke();
  // Dotted preview path.
  if (preview && preview.points.length > 1) {
    ctx.fillStyle = preview.outcome === 'delivered' ? '#7dffb0' : 'rgba(255,255,255,0.75)';
    for (let i = 0; i < preview.points.length; i += 2) {
      const p = preview.points[i];
      ctx.globalAlpha = Math.max(0.15, 0.9 - (i / preview.points.length) * 0.7);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (preview.outcome === 'delivered') {
      ctx.fillStyle = '#7dffb0';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ON TARGET — release!', rocket.x, rocket.y - 34);
    }
  }
}

export function drawWorld(ctx, game, time) {
  const level = game.level;
  drawBackground(ctx, game.stars, time);
  drawPad(ctx, level.pad);
  for (const p of level.planets) drawPlanet(ctx, p, time);
  if (level.sun) drawSun(ctx, level.sun, time);
  drawStation(ctx, level.station, time);
  for (const a of level.asteroids) drawAsteroid(ctx, a);
  drawTrail(ctx, game.trail);
  if (game.state === 'aiming' || game.state === 'ready') {
    drawAim(ctx, game.rocket, game.aim, game.preview);
  }
  if (game.state === 'flying' || game.state === 'delivered') {
    drawRocket(ctx, game.rocket);
  } else if (game.state === 'aiming' || game.state === 'ready') {
    // Rocket parked on the pad, pointing up.
    drawRocket(ctx, { x: level.pad.x, y: level.pad.y - 16, vx: 0, vy: -1 });
  }
}

export function drawHUD(ctx, game) {
  const level = game.level;
  ctx.fillStyle = 'rgba(6,6,26,0.72)';
  ctx.fillRect(0, 0, PLAYFIELD.w, 54);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SECTOR ${game.levelIndex + 1}/5 — ${level.name}`, 18, 34);
  ctx.textAlign = 'center';
  // Parcels as little envelopes.
  ctx.fillText('PARCELS', 560, 34);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < game.parcelsLeft ? '#ffb347' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(620 + i * 26, 22, 20, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(620 + i * 26, 22, 20, 14);
  }
  ctx.fillStyle = '#e8f4ff';
  ctx.fillText(`DELIVERED ${game.delivered}/5`, 800, 34);
  ctx.fillText(`SCORE ${game.score}`, 980, 34);
  ctx.fillText(`TIME ${Math.floor(game.levelTime)}s`, 1150, 34);
  // Tip line at the bottom.
  ctx.fillStyle = 'rgba(232,244,255,0.75)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(level.tip, PLAYFIELD.w / 2, PLAYFIELD.h - 16);
  // Fuel bar while flying: 8 s per launch.
  if (game.state === 'flying') {
    const frac = Math.max(0, 1 - game.flightTime / 8);
    const bw = 220;
    const bx = (PLAYFIELD.w - bw) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(bx, 62, bw, 6);
    ctx.fillStyle = frac > 0.35 ? '#3ec6b8' : '#ff7a59';
    ctx.fillRect(bx, 62, bw * frac, 6);
    ctx.fillStyle = 'rgba(232,244,255,0.8)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FUEL', PLAYFIELD.w / 2, 82);
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6,6,26,0.82)';
  const w = 640;
  const h = 120 + lines.length * 34;
  const x = (PLAYFIELD.w - w) / 2;
  const y = (PLAYFIELD.h - h) / 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, PLAYFIELD.w / 2, y + 62);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, PLAYFIELD.w / 2, y + 108 + i * 34);
  });
}

export function drawTitle(ctx, game) {
  drawWorld(ctx, { ...game, state: 'ready', aim: null, preview: null, trail: [] }, game.time);
  ctx.fillStyle = 'rgba(6,6,26,0.45)';
  ctx.fillRect(0, 0, PLAYFIELD.w, PLAYFIELD.h);
  ctx.fillStyle = '#ffd9a0';
  ctx.font = '800 84px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STARPOST', PLAYFIELD.w / 2, 250);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('The last postman of the starlanes. Slingshot your rocket', PLAYFIELD.w / 2, 300);
  ctx.fillText('around the planets and land inside the amber ring.', PLAYFIELD.w / 2, 332);
  ctx.fillStyle = '#3ec6b8';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText('Drag back from the rocket — release to launch', PLAYFIELD.w / 2, 400);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('5 sectors  •  3 parcels each  •  R restart  •  P pause  •  M mute', PLAYFIELD.w / 2, 440);
  ctx.fillStyle = '#ffb347';
  ctx.font = '800 24px system-ui, sans-serif';
  const blink = 0.6 + 0.4 * Math.sin(game.time * 3);
  ctx.globalAlpha = blink;
  ctx.fillText('CLICK OR PRESS ENTER TO START', PLAYFIELD.w / 2, 520);
  ctx.globalAlpha = 1;
}

export function drawDelivered(ctx, game) {
  panel(ctx, 'DELIVERED!', [
    `Sector ${game.levelIndex + 1} complete — parcel safely in the ring.`,
    `Bonus +${game.lastBonus}  •  Score ${game.score}`,
    game.levelIndex + 1 < 5 ? 'Click or press Enter for the next sector.' : '',
  ], '#7dffb0');
}

export function drawGameOver(ctx, game) {
  panel(ctx, 'OUT OF PARCELS', [
    `You delivered ${game.delivered} of 5 parcels.`,
    `Final score ${game.score}`,
    'Press R or click to try the sector again.',
  ], '#ff7a59');
}

export function drawWin(ctx, game) {
  panel(ctx, 'ALL DELIVERED!', [
    'Every parcel reached its station. The starlanes are open again.',
    `Final score ${game.score}  •  Total time ${Math.floor(game.totalTime)}s`,
    'Press R or click to play again.',
  ], '#ffb347');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,6,26,0.6)';
  ctx.fillRect(0, 0, PLAYFIELD.w, PLAYFIELD.h);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', PLAYFIELD.w / 2, PLAYFIELD.h / 2);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Press P to resume', PLAYFIELD.w / 2, PLAYFIELD.h / 2 + 40);
}
