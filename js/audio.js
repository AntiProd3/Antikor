// Sons synthétisés avec la Web Audio API (aucun fichier audio).

import { save } from './save.js';

export const Sfx = (() => {
  let ac = null,
    master = null,
    nb = null;
  const last = {};
  function init() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.32;
      master.connect(ac.destination);
    } catch (e) {
      ac = null;
    }
  }
  function resume() {
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function can(n, gap) {
    const t = performance.now();
    if (last[n] && t - last[n] < gap) return false;
    last[n] = t;
    return true;
  }
  function tone(f, d, type = 'square', v = 0.15, slide = 1, delay = 0) {
    if (!ac || save.muted) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + d);
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + d + 0.03);
  }
  function noise(d, v = 0.3, f = 1200, type = 'lowpass', delay = 0) {
    if (!ac || save.muted) return;
    if (!nb) {
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const c = nb.getChannelData(0);
      for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + delay;
    const s = ac.createBufferSource();
    s.buffer = nb;
    const fl = ac.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(fl);
    fl.connect(g);
    g.connect(master);
    s.start(t0);
    s.stop(t0 + d + 0.03);
  }
  return {
    init,
    resume,
    shoot() {
      if (can('sh', 55)) tone(900 + Math.random() * 160, 0.05, 'square', 0.035, 0.5);
    },
    blast() {
      if (can('bl', 90)) {
        noise(0.12, 0.16, 1800);
        tone(180, 0.08, 'square', 0.05, 0.5);
      }
    },
    rail() {
      if (can('ra', 80)) {
        tone(1800, 0.2, 'sawtooth', 0.05, 0.2);
        noise(0.15, 0.1, 4000, 'highpass');
      }
    },
    hit() {
      if (can('hi', 35)) noise(0.035, 0.06, 3200, 'highpass');
    },
    kill() {
      if (can('ki', 30)) tone(260 + Math.random() * 240, 0.08, 'triangle', 0.09, 0.4);
    },
    gem(c) {
      if (can('ge', 26)) tone(620 * Math.pow(1.055, Math.min(c, 30)), 0.07, 'sine', 0.08, 1.02);
    },
    coin() {
      if (can('co', 60)) {
        tone(1320, 0.04, 'square', 0.035);
        tone(1760, 0.07, 'square', 0.035, 1, 0.04);
      }
    },
    boom() {
      if (can('bo', 70)) {
        noise(0.32, 0.28, 650);
        tone(110, 0.28, 'sine', 0.2, 0.45);
      }
    },
    fire() {
      if (can('fi', 90)) noise(0.3, 0.14, 900, 'bandpass');
    },
    zap() {
      if (can('za', 60)) {
        noise(0.07, 0.1, 5200, 'bandpass');
        tone(1500, 0.07, 'sawtooth', 0.035, 0.3);
      }
    },
    throw() {
      if (can('th', 80)) tone(500, 0.09, 'triangle', 0.05, 1.8);
    },
    drop() {
      if (can('dr', 80)) tone(300, 0.06, 'square', 0.04, 0.7);
    },
    launch() {
      if (can('la', 80)) noise(0.18, 0.1, 1400, 'bandpass');
    },
    spit() {
      if (can('sp', 120)) tone(240, 0.1, 'sine', 0.05, 1.6);
    },
    hurt() {
      if (can('hu', 140)) {
        tone(200, 0.2, 'sawtooth', 0.16, 0.4);
        noise(0.1, 0.1, 800);
      }
    },
    level() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.07, 1, i * 0.065));
    },
    buy() {
      tone(988, 0.07, 'square', 0.07);
      tone(1319, 0.12, 'square', 0.07, 1, 0.06);
    },
    deny() {
      tone(150, 0.14, 'square', 0.08, 0.8);
    },
    boss() {
      tone(70, 1, 'sawtooth', 0.16, 0.7);
      tone(74, 1, 'sawtooth', 0.12, 0.7);
      noise(0.6, 0.12, 300);
    },
    wave() {
      tone(392, 0.1, 'square', 0.06);
      tone(587, 0.16, 'square', 0.06, 1, 0.1);
    },
    chest() {
      [784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.1, 'triangle', 0.09, 1, i * 0.05));
    },
    heal() {
      tone(660, 0.1, 'sine', 0.08, 1.5);
      tone(880, 0.12, 'sine', 0.07, 1.4, 0.08);
    },
    click() {
      tone(1200, 0.025, 'square', 0.03);
    },
    clear() {
      [523, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, 1, i * 0.09));
    },
    dash() {
      noise(0.3, 0.18, 500);
    },
    slash() {
      if (can('sl', 80)) {
        noise(0.1, 0.14, 3400, 'highpass');
        tone(1400, 0.09, 'sawtooth', 0.04, 0.35);
      }
    },
    unbox() {
      [392, 494, 587, 740].forEach((f, i) => tone(f, 0.09, 'square', 0.05, 1, i * 0.07));
    },
    reveal(r) {
      const n = [
        [523, 659],
        [523, 659, 784],
        [523, 659, 784, 1047],
        [392, 523, 659, 784, 1047, 1319],
        [262, 392, 523, 659, 784, 1047, 1319, 1568],
      ][r] || [523];
      n.forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, 1, i * 0.07));
      if (r >= 3) noise(0.5, 0.12, 2400, 'bandpass', 0.1);
    },
    evo() {
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.06, 1, i * 0.06));
    },
    over() {
      [392, 311, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, 1, i * 0.16));
    },
  };
})();
