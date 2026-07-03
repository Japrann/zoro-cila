/* =========================================================================
   sounds.js — tiny synthesized sound effects via Web Audio API.
   No external audio files needed, which keeps the PWA lightweight and
   makes the whole game work fully offline.
   ========================================================================= */

const GameSounds = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    // iOS/Android require resume after a user gesture
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.15, delay = 0, glideTo = null }) {
    if (muted) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    if (glideTo) {
      osc.frequency.linearRampToValueAtTime(glideTo, c.currentTime + delay + duration);
    }
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.02);
  }

  return {
    setMuted(v) { muted = v; },
    isMuted() { return muted; },

    /* light "tick" for card flip */
    flip() {
      tone({ freq: 520, duration: 0.09, type: 'triangle', gain: 0.12 });
    },

    /* cheerful two-note chime for a correct match */
    match() {
      tone({ freq: 660, duration: 0.14, type: 'sine', gain: 0.16 });
      tone({ freq: 880, duration: 0.22, type: 'sine', gain: 0.16, delay: 0.1 });
    },

    /* soft descending "bonk" for a wrong match */
    wrong() {
      tone({ freq: 260, duration: 0.22, type: 'sine', gain: 0.13, glideTo: 160 });
    },

    /* little victory fanfare */
    victory() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => tone({ freq: f, duration: 0.28, type: 'sine', gain: 0.15, delay: i * 0.13 }));
    },

    /* soft pop for buttons */
    pop() {
      tone({ freq: 700, duration: 0.08, type: 'sine', gain: 0.1, glideTo: 900 });
    }
  };
})();
