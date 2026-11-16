// The five sectors of STARPOST. Each level names a launch pad, one target
// station ring, the planets whose gravity bends the flight, drifting
// asteroids, and an optional sun. Coordinates are in the 1280x800 playfield.
// mass is relative: 1.0 bends a fast rocket noticeably, 1.6 is a heavy pull.

export const PLAYFIELD = { w: 1280, h: 800 };

export const LEVELS = [
  {
    name: 'First Route',
    tip: 'Drag back from the rocket and release to launch. Land inside the amber ring.',
    pad: { x: 180, y: 640 },
    station: { x: 1080, y: 180, r: 48 },
    planets: [
      { x: 640, y: 420, r: 70, mass: 1.0, color: '#7a5cff', name: 'Violet' },
    ],
    asteroids: [],
    sun: null,
    par: 25,
  },
  {
    name: 'Twin Wells',
    tip: 'Two planets pull at once — thread the gap between them.',
    pad: { x: 150, y: 650 },
    station: { x: 1120, y: 150, r: 46 },
    planets: [
      { x: 500, y: 300, r: 60, mass: 0.9, color: '#3ec6b8', name: 'Teal' },
      { x: 850, y: 560, r: 56, mass: 0.9, color: '#ff7a59', name: 'Coral' },
    ],
    asteroids: [
      { x: 640, y: 120, vx: 26, vy: 34, r: 16 },
    ],
    sun: null,
    par: 30,
  },
  {
    name: 'The Long Way',
    tip: 'A heavy planet sits in the middle. Use its pull, do not touch it.',
    pad: { x: 140, y: 160 },
    station: { x: 1140, y: 660, r: 46 },
    planets: [
      { x: 640, y: 400, r: 92, mass: 1.6, color: '#c98a4b', name: 'Amber Giant' },
      { x: 300, y: 610, r: 44, mass: 0.7, color: '#7a5cff', name: 'Violet' },
      { x: 980, y: 220, r: 44, mass: 0.7, color: '#3ec6b8', name: 'Teal' },
    ],
    asteroids: [
      { x: 420, y: 200, vx: -30, vy: 22, r: 14 },
      { x: 900, y: 560, vx: 24, vy: -28, r: 18 },
    ],
    sun: null,
    par: 35,
  },
  {
    name: 'Sun Slingshot',
    tip: 'The sun is a wall of fire — swing around it, never into it.',
    pad: { x: 150, y: 400 },
    station: { x: 1130, y: 400, r: 46 },
    planets: [
      { x: 400, y: 180, r: 40, mass: 0.6, color: '#3ec6b8', name: 'Teal' },
      { x: 880, y: 620, r: 40, mass: 0.6, color: '#ff7a59', name: 'Coral' },
    ],
    asteroids: [
      { x: 640, y: 120, vx: 34, vy: 0, r: 15 },
      { x: 640, y: 680, vx: -34, vy: 0, r: 15 },
    ],
    sun: { x: 640, y: 400, r: 108, mass: 2.4 },
    par: 35,
  },
  {
    name: 'Asteroid Belt',
    tip: 'Four rocks cross the lane. Time your launch between them.',
    pad: { x: 160, y: 640 },
    station: { x: 1100, y: 170, r: 46 },
    planets: [
      { x: 480, y: 380, r: 64, mass: 1.0, color: '#7a5cff', name: 'Violet' },
      { x: 820, y: 300, r: 50, mass: 0.8, color: '#c98a4b', name: 'Amber Giant' },
    ],
    asteroids: [
      { x: 300, y: 200, vx: 30, vy: 26, r: 15 },
      { x: 700, y: 600, vx: -26, vy: -30, r: 17 },
      { x: 950, y: 480, vx: -34, vy: 18, r: 14 },
      { x: 560, y: 120, vx: 20, vy: 36, r: 16 },
    ],
    sun: null,
    par: 40,
  },
];

export const PARCELS_PER_LEVEL = 3;
export const ROCKET_RADIUS = 9;
