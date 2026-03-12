/**
 * Optional luxury sound effects for The Peacock Club.
 * Sounds are only played if the user has opted in via localStorage.
 */

const SOUND_ENABLED_KEY = "peacock-sounds-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) === "true";
}

export function toggleSound(): boolean {
  const newState = !isSoundEnabled();
  localStorage.setItem(SOUND_ENABLED_KEY, String(newState));
  return newState;
}

/** Play a subtle chime on transaction success */
export function playConfirmSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.type = "sine";
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported or blocked
  }
}

/** Play a subtle alert tone */
export function playAlertSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.type = "sine";
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 400);
  } catch {
    // Audio not supported or blocked
  }
}
