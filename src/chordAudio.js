/* ──────────────────────────────────────────────────────────────
   chordAudio.js — 留声机和弦发声模块（自包含，不依赖任何外部库）
   读 gramophone 的 chord 字符串 → 解析成音 → Web Audio 发声。
   chord 数据是只读源，本模块只读不改。

   要调音，改下面 CONFIG 就好（音色 / 起音收尾 / 速度 / 混响 / 音区）。
   ────────────────────────────────────────────────────────────── */

const CONFIG = {
  oscType: "triangle",   // 'sine'(最暖最钝) | 'triangle'(暖) | 'sawtooth'/'square'(亮/尖)
  beatsPerChord: 2,      // 每个和弦持续几拍（越大越慢、越"留声机"）
  attack: 0.09,          // 起音秒数（越大越柔不戳耳）
  release: 0.55,         // 收尾秒数（越大越绵长有余韵）
  master: 0.16,          // 总音量 0~1（防止多音叠加爆音）
  rootMidi: 50,          // 和弦根音落在哪个音区（50≈D3，越大越高越亮）
  bassMidi: 36,          // 斜杠低音(/E /F#)的音区（36≈C2，垫底）
  reverb: 0.16,          // 混响湿度 0~1（0=干，越大越空灵像在房间里）
  reverbSeconds: 1.9,    // 混响尾巴长度
  style: "arp",          // 'pad'=整块按下去（糊、各天难分） | 'arp'=琶音铺开（大小调一耳朵分得清）
  arpRatio: 0.5,         // arp 每个音间隔 = 这个比例 × 一拍（越小越急促）
};

/* ── 音名 → 半音(0~11) ── */
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/* 把一个和弦符号解析成根音半音、低音半音、各音程(相对根音的半音) */
function parseSymbol(raw) {
  if (!raw) return null;
  // 统一记号：♭→b，全角等
  let s = raw.replace(/♭/g, "b").replace(/＃/g, "#").trim();

  // 斜杠低音： D/F#
  let bassPc = null;
  const slash = s.split("/");
  if (slash.length === 2) {
    const bm = slash[1].trim().match(/^([A-G])(#|b)?/);
    if (bm) bassPc = (PC[bm[1]] + (bm[2] === "#" ? 1 : bm[2] === "b" ? -1 : 0) + 12) % 12;
    s = slash[0].trim();
  }

  // 根音
  const rm = s.match(/^([A-G])(#|b)?/);
  if (!rm) return null;
  const rootPc = (PC[rm[1]] + (rm[2] === "#" ? 1 : rm[2] === "b" ? -1 : 0) + 12) % 12;
  const q = s.slice(rm[0].length); // 剩下的就是和弦性质，如 maj7 / m9 / 7sus4 / m7b5

  const ints = new Set([0]);
  const isMaj7 = /maj7|maj9|maj11|maj13|Δ/.test(q);
  const isMinor = /^m(?!aj)/.test(q) || /^min/.test(q);
  const isDim = /dim|°|ø/.test(q) || /m7b5/.test(q);
  const isAug = /aug|\+/.test(q);
  const sus2 = /sus2/.test(q);
  const sus4 = /sus4|sus(?!2)/.test(q);

  // 三度
  if (sus2) ints.add(2);
  else if (sus4) ints.add(5);
  else if (isMinor || isDim) ints.add(3);
  else ints.add(4);

  // 五度
  if (isDim || /b5/.test(q)) ints.add(6);
  else if (isAug) ints.add(8);
  else ints.add(7);

  // 七度
  if (isMaj7) ints.add(11);
  else if (/7|9|11|13/.test(q)) ints.add(10);

  // 六度
  if (/6/.test(q)) ints.add(9);

  // 张力音
  if (/9/.test(q)) ints.add(14);
  if (/11/.test(q)) ints.add(17);
  if (/13/.test(q)) ints.add(21);

  // 变化音
  if (/b9/.test(q)) { ints.delete(14); ints.add(13); }
  if (/#9/.test(q)) { ints.delete(14); ints.add(15); }
  if (/#11/.test(q)) { ints.delete(17); ints.add(18); }

  return { rootPc, bassPc, intervals: [...ints] };
}

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* 一个和弦 → 一组频率（含可选斜杠低音） */
function symbolToFreqs(sym) {
  const p = parseSymbol(sym);
  if (!p) return [];
  const freqs = p.intervals.map((iv) => midiToFreq(CONFIG.rootMidi + p.rootPc + iv));
  if (p.bassPc != null) freqs.unshift(midiToFreq(CONFIG.bassMidi + p.bassPc));
  return freqs;
}

/* ── 音频引擎 ── */
let ctx = null;
let convolver = null;
let current = null; // { nodes:[], timer, onEnded }

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // 程序生成一个柔和混响脉冲（衰减白噪声）
    const len = Math.floor(ctx.sampleRate * CONFIG.reverbSeconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    convolver = ctx.createConvolver();
    convolver.buffer = buf;
  }
  return ctx;
}

export function isSupported() {
  return typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
}

export function stopProgression() {
  if (!current) return;
  clearTimeout(current.timer);
  const cb = current.onEnded;
  try {
    current.nodes.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch {} });
  } catch {}
  current = null;
  if (cb) cb();
}

/**
 * 播放一段和弦进行。
 * @param {string[]} chords  已解析好的和弦符号数组（GramophonePage 的 parsedChord.chords）
 * @param {number}   bpm
 * @param {object}   opts    { onEnded }
 * @returns {boolean} 是否成功开始
 */
export function playProgression(chords, bpm, opts = {}) {
  if (!isSupported() || !chords || !chords.length) return false;
  stopProgression(); // 同一时间只放一段

  const c = getCtx();
  if (c.state === "suspended") c.resume();

  const masterIn = c.createGain();
  masterIn.gain.value = CONFIG.master;

  // 干 + 湿（混响）并联
  const dry = c.createGain(); dry.gain.value = 1 - CONFIG.reverb;
  const wet = c.createGain(); wet.gain.value = CONFIG.reverb;
  masterIn.connect(dry).connect(c.destination);
  masterIn.connect(wet).connect(convolver).connect(c.destination);

  const beat = 60 / (bpm || 72);
  const chordDur = beat * CONFIG.beatsPerChord;
  const nodes = [];
  const t0 = c.currentTime + 0.05;

  chords.forEach((sym, ci) => {
    const freqs = symbolToFreqs(sym);
    if (!freqs.length) return;
    const start = t0 + ci * chordDur;
    const per = 1 / Math.sqrt(freqs.length); // 音越多每个越轻，避免叠加爆音
    // arp 间隔跟着拍子走 → 不同 bpm 真的有快慢；并保证琶音铺完不超过这个和弦的时长
    const arpStep = CONFIG.style === "arp"
      ? Math.min(beat * CONFIG.arpRatio, (chordDur * 0.85) / Math.max(freqs.length, 1))
      : 0;

    freqs.forEach((f, ni) => {
      const osc = c.createOscillator();
      osc.type = CONFIG.oscType;
      osc.frequency.value = f;
      const g = c.createGain();
      const onset = start + ni * arpStep;
      const hold = onset + chordDur;
      g.gain.setValueAtTime(0, onset);
      g.gain.linearRampToValueAtTime(per, onset + CONFIG.attack);
      g.gain.setValueAtTime(per, hold);
      g.gain.linearRampToValueAtTime(0, hold + CONFIG.release);
      osc.connect(g).connect(masterIn);
      osc.start(onset);
      osc.stop(hold + CONFIG.release + 0.02);
      nodes.push(osc);
    });
  });

  const total = chordDur * chords.length + CONFIG.release + 0.1;
  current = {
    nodes,
    onEnded: opts.onEnded || null,
    timer: setTimeout(() => { current = null; if (opts.onEnded) opts.onEnded(); }, total * 1000),
  };
  return true;
}
