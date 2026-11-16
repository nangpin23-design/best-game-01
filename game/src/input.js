// Mouse and keyboard input for STARPOST. The mouse drags back from the
// rocket to aim (a slingshot); releasing launches. The keyboard starts,
// restarts, pauses and mutes. Coordinates are translated from the page into
// the 1280x800 playfield.

import { PLAYFIELD } from './levels.js';

export function attachInput(canvas, handlers) {
  const toField = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PLAYFIELD.w,
      y: ((event.clientY - rect.top) / rect.height) * PLAYFIELD.h,
    };
  };

  let dragging = false;

  canvas.addEventListener('mousedown', (event) => {
    const p = toField(event);
    dragging = true;
    handlers.onAimStart(p);
  });
  window.addEventListener('mousemove', (event) => {
    if (!dragging) return;
    handlers.onAimMove(toField(event));
  });
  window.addEventListener('mouseup', (event) => {
    if (!dragging) return;
    dragging = false;
    handlers.onAimEnd(toField(event));
  });
  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const p = toField(event.touches[0]);
    dragging = true;
    handlers.onAimStart(p);
  }, { passive: false });
  window.addEventListener('touchmove', (event) => {
    if (!dragging) return;
    event.preventDefault();
    handlers.onAimMove(toField(event.touches[0]));
  }, { passive: false });
  window.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    handlers.onAimEnd(null);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      handlers.onConfirm();
    } else if (key === 'r') {
      handlers.onRestart();
    } else if (key === 'p' || key === 'escape') {
      handlers.onPause();
    } else if (key === 'm') {
      handlers.onMute();
    }
  });
}
