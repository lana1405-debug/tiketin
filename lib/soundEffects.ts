/**
 * Retro Synth Sound Effects Utility
 * Powered by browser-native Web Audio API. No external MP3 dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Short retro high-frequency beep for clicks and tab transitions
 */
export function playClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (err) {
    console.error("Audio failed:", err);
  }
}

/**
 * Very short tick sound for wheel rotation clicks
 */
export function playTick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.015);
  } catch (err) {
    console.error("Audio failed:", err);
  }
}

/**
 * Ascending retro arpeggio for point prizes (C5 -> E5 -> G5 -> C6)
 */
export function playWinPoints() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const notes = [523.25, 659.25, 784.00, 1046.50];
    const duration = 0.12;
    const gap = 0.08;

    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * gap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.error("Audio failed:", err);
  }
}

/**
 * Merrier retro fanfare for grand prizes (Voucher wins)
 */
export function playWinVoucher() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.08 },
      { freq: 659.25, time: 0.08, dur: 0.08 },
      { freq: 784.00, time: 0.16, dur: 0.08 },
      { freq: 1046.50, time: 0.24, dur: 0.2 },
      { freq: 784.00, time: 0.44, dur: 0.08 },
      { freq: 1046.50, time: 0.52, dur: 0.35 }
    ];

    notes.forEach((note) => {
      const startTime = ctx.currentTime + note.time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.dur);
    });
  } catch (err) {
    console.error("Audio failed:", err);
  }
}

/**
 * Buzzing sad descending trombone slide for Zonk results
 */
export function playZonk() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const notes = [196.00, 185.00, 174.61, 164.81]; // G3, F#3, F3, E3
    const duration = 0.22;

    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";

      if (index === 3) {
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(110.00, startTime + 0.55);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.55);
      } else {
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      }
    });
  } catch (err) {
    console.error("Audio failed:", err);
  }
}
