/**
 * The four animated scenes of the site, drawn on a <canvas>: no image files, sharp at every size.
 * Each scene is a pure function of time so it can be tested without a browser.
 */
export type FxKind = 'sphere' | 'mesh' | 'stream' | 'core' | 'stars';
export type FxState = Record<string, unknown>;

type P3 = [number, number, number];
const TAU = Math.PI * 2;

function rnd(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export const SPHERE_NODES = 120;

/** Points spread evenly over a sphere, joined to their near neighbours. The same every time (seeded). */
function buildSphere(): { points: P3[]; edges: [number, number][] } {
  const r = rnd(7);
  const points: P3[] = [];
  for (let i = 0; i < SPHERE_NODES; i++) {
    const y = 1 - (2 * (i + 0.5)) / SPHERE_NODES;
    const rad = Math.sqrt(1 - y * y);
    const a = i * 2.39996 + r() * 0.5;
    points.push([Math.cos(a) * rad, y + (r() - 0.5) * 0.08, Math.sin(a) * rad]);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i][0] - points[j][0], dy = points[i][1] - points[j][1], dz = points[i][2] - points[j][2];
      if (dx * dx + dy * dy + dz * dz < 0.16) edges.push([i, j]);
    }
  }
  return { points, edges };
}
const SPHERE = buildSphere();
/** Shown on the HUD: the real number of links in the sphere. */
export const SPHERE_LINKS = SPHERE.edges.length;

/** Where the pointer is over a canvas, from -1 to 1 on each axis (0,0 = centre). Set by FxCanvas; absent on touch screens. */
function pointerOf(st: FxState): [number, number] | null {
  const p = st.pointer as [number, number] | undefined;
  if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
  return [Math.max(-1, Math.min(1, p[0])), Math.max(-1, Math.min(1, p[1]))];
}

function drawSphere(c: CanvasRenderingContext2D, w: number, h: number, t: number, st: FxState): void {
  const R = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
  // The sphere leans toward the pointer, easing a little each frame.
  const p = pointerOf(st) ?? [0, 0];
  const lean = (st.lean as [number, number] | undefined) ?? [0, 0];
  lean[0] += (p[0] - lean[0]) * 0.06;
  lean[1] += (p[1] - lean[1]) * 0.06;
  st.lean = lean;
  const yaw = t * 0.22 + lean[0] * 0.7, tilt = 0.38 + lean[1] * 0.45;
  const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(tilt), sb = Math.sin(tilt);
  const q: P3[] = SPHERE.points.map((p) => {
    const x = p[0] * ca + p[2] * sa, z0 = -p[0] * sa + p[2] * ca;
    const y = p[1] * cb - z0 * sb, z = p[1] * sb + z0 * cb;
    const s = R * (1 + 0.16 * z);
    return [cx + x * s, cy + y * s, z];
  });

  const core = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
  core.addColorStop(0, 'rgba(160,123,255,0.55)');
  core.addColorStop(0.5, 'rgba(88,224,232,0.12)');
  core.addColorStop(1, 'rgba(88,224,232,0)');
  c.fillStyle = core;
  c.beginPath(); c.arc(cx, cy, R * 0.9, 0, TAU); c.fill();

  // Radar ticks
  c.lineWidth = 1; c.strokeStyle = '#58E0E8'; c.globalAlpha = 0.35;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU + t * 0.05, r1 = R * 1.3, r2 = R * (i % 6 === 0 ? 1.4 : 1.34);
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke();
  }
  // Reticle arcs
  c.globalAlpha = 0.9; c.lineWidth = 2; c.shadowColor = '#58E0E8'; c.shadowBlur = 12;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cx, cy, R * 1.22, t * 0.4 + i * 2.094, t * 0.4 + i * 2.094 + 0.9); c.stroke(); }
  c.strokeStyle = '#FF2FB3'; c.shadowColor = '#FF2FB3';
  c.beginPath(); c.arc(cx, cy, R * 1.14, -t * 0.6, -t * 0.6 + 0.5); c.stroke();
  c.shadowBlur = 0; c.lineWidth = 1;
  // Orbits with a satellite each
  for (let k = 0; k < 2; k++) {
    const tilt = k === 0 ? -0.35 : 0.5, oa = t * (k === 0 ? 0.5 : -0.35) + k * 2, color = k === 0 ? '#A07BFF' : '#58E0E8';
    c.strokeStyle = color; c.globalAlpha = 0.5;
    c.beginPath(); c.ellipse(cx, cy, R * 1.5, R * 0.42, tilt, 0, TAU); c.stroke();
    const ox = Math.cos(oa) * R * 1.5, oy = Math.sin(oa) * R * 0.42;
    c.globalAlpha = 1; c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 14;
    c.beginPath(); c.arc(cx + ox * Math.cos(tilt) - oy * Math.sin(tilt), cy + ox * Math.sin(tilt) + oy * Math.cos(tilt), 4, 0, TAU); c.fill();
    c.shadowBlur = 0;
  }
  // Far links, then near links with a glow
  c.strokeStyle = '#BFE9F2'; c.globalAlpha = 0.16; c.beginPath();
  for (const [i, j] of SPHERE.edges) if (q[i][2] + q[j][2] <= 0) { c.moveTo(q[i][0], q[i][1]); c.lineTo(q[j][0], q[j][1]); }
  c.stroke();
  c.globalAlpha = 0.75; c.shadowColor = '#58E0E8'; c.shadowBlur = 8; c.beginPath();
  for (const [i, j] of SPHERE.edges) if (q[i][2] + q[j][2] > 0) { c.moveTo(q[i][0], q[i][1]); c.lineTo(q[j][0], q[j][1]); }
  c.stroke();
  c.fillStyle = '#EEF0FF';
  for (const p of q) {
    c.globalAlpha = 0.35 + (0.65 * (p[2] + 1)) / 2;
    c.beginPath(); c.arc(p[0], p[1], 1 + (1.5 * (p[2] + 1)) / 2, 0, TAU); c.fill();
  }
  // Amber pulses travelling along links: the AI reading the data
  c.fillStyle = '#FFC83D'; c.shadowColor = '#FFC83D'; c.shadowBlur = 12; c.globalAlpha = 1;
  for (let k = 0; k < 14; k++) {
    const phase = t * 0.7 + k * 0.3;
    const [i, j] = SPHERE.edges[(k * 37 + Math.floor(phase) * 11) % SPHERE.edges.length];
    const f = phase % 1;
    c.beginPath(); c.arc(q[i][0] + (q[j][0] - q[i][0]) * f, q[i][1] + (q[j][1] - q[i][1]) * f, 2.2, 0, TAU); c.fill();
  }
  c.shadowBlur = 0; c.globalAlpha = 1;
}

function drawMesh(c: CanvasRenderingContext2D, w: number, h: number, t: number, st: FxState): void {
  const cols = 13, rows = 7;
  if (!st.jitter) {
    const r = rnd(11);
    st.jitter = Array.from({ length: cols * rows }, () => [(r() - 0.5) * 0.6, (r() - 0.5) * 0.6, r() * 6.28]);
  }
  const jitter = st.jitter as P3[];
  const g: [number, number][] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const jt = jitter[j * cols + i], u = (i + jt[0]) / (cols - 1), v = (j + jt[1]) / (rows - 1);
      const wave = Math.sin(u * 5 + t * 0.5 + jt[2] * 0.2) * 0.5 + Math.cos(v * 4 - t * 0.35) * 0.5;
      g.push([w * (u * 1.2 - 0.1), h * (0.12 + 0.7 * v + 0.16 * u + 0.1 * wave)]);
    }
  }
  const at = (i: number, j: number) => g[j * cols + i];
  c.strokeStyle = '#EEF0FF'; c.lineWidth = 1; c.globalAlpha = 0.28; c.beginPath();
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const o = at(i, j);
      const link = (p: [number, number]) => { c.moveTo(o[0], o[1]); c.lineTo(p[0], p[1]); };
      if (i + 1 < cols) link(at(i + 1, j));
      if (j + 1 < rows) link(at(i, j + 1));
      if (i + 1 < cols && j + 1 < rows && (i + j) % 2 === 0) link(at(i + 1, j + 1));
      if (i > 0 && j + 1 < rows && (i + j) % 2 === 1) link(at(i - 1, j + 1));
    }
  }
  c.stroke();
  c.fillStyle = '#EEF0FF';
  g.forEach((p, i) => {
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.5 + jitter[i][2]);
    c.beginPath(); c.arc(p[0], p[1], 1.6, 0, TAU); c.fill();
  });
  c.globalAlpha = 1;
}

/** "VISIONQUEST" in 8-bit ASCII: the stream is the team's name, not random digits. */
const BITS = '0101011001001001010100110100100101001111010011100101000101010101010001010101001101010100';

function drawStream(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const lanes = 20, per = 34, fx = w * 0.5, fy = h * 0.3;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let k = 0; k < lanes; k++) {
    const lane = (k / (lanes - 1)) * 2 - 1, speed = 0.035 + (0.02 * ((k * 7) % 5)) / 5;
    for (let i = 0; i < per; i++) {
      const d = (i / per + t * speed) % 1, d2 = d * d;
      const x = fx - Math.pow(d, 1.5) * w * 0.62 + lane * (0.015 + 0.55 * d2) * w + Math.sin(d * 2.4) * w * 0.07 * (1 - d);
      const y = fy + Math.pow(d, 1.7) * h * 0.75;
      c.globalAlpha = Math.min(1, 0.08 + 0.8 * d) * (d > 0.9 ? (1 - d) * 10 : 1) * 0.6;
      c.fillStyle = (i + k) % 9 === 0 ? '#58E0E8' : '#BFD6F2';
      c.font = `${(3 + 24 * d2).toFixed(1)}px 'JetBrains Mono', monospace`;
      c.fillText(BITS.charAt((k * 13 + i * 5) % BITS.length), x, y);
    }
  }
  c.globalAlpha = 1;
}

function drawCore(c: CanvasRenderingContext2D, w: number, h: number, t: number, st: FxState): void {
  const S = Math.min(w, h * 0.9) * 0.021, cx = w / 2, cy = h * 0.42 + S * 2, R = S * 10;
  const grad = c.createLinearGradient(cx - S * 18, 0, cx + S * 18, 0);
  grad.addColorStop(0, '#FF2FB3'); grad.addColorStop(0.4, '#A07BFF'); grad.addColorStop(0.7, '#5B8CFF'); grad.addColorStop(1, '#58E0E8');
  if (!st.pins) {
    const r = rnd(23);
    st.pins = Array.from({ length: 30 }, () => [r() * 2 - 1, r(), r() * 6.28]);
  }
  c.strokeStyle = grad; c.fillStyle = grad; c.lineWidth = 1;
  for (const pin of st.pins as P3[]) {
    const x = cx + pin[0] * S * 19, top = cy - S * 19 + pin[1] * S * 10, len = S * (8 + 14 * pin[1]);
    c.globalAlpha = 0.25; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top + len); c.stroke();
    c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2 + pin[2]); c.beginPath(); c.arc(x, top, 2, 0, TAU); c.fill();
  }
  // Seven voice rings: integer multiples of the angle so each ring closes on itself
  const wave = (a: number, ph: number) => Math.sin(a * 6 + t * 2.2 + ph) * 0.5 + Math.sin(a * 11 - t * 3.1 + ph * 2) * 0.3 + Math.sin(a * 3 + t * 1.3) * 0.2;
  for (let k = 0; k < 7; k++) {
    c.globalAlpha = 0.3 + 0.1 * k; c.lineWidth = k === 6 ? 2 : 1; c.beginPath();
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * TAU, r = R * (0.72 + k * 0.045) + wave(a, k * 0.5) * S * (0.6 + k * 0.35);
      if (i === 0) c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.closePath(); c.stroke();
  }
  c.lineWidth = 2; c.globalAlpha = 0.9; c.shadowColor = '#A07BFF'; c.shadowBlur = 14;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cx, cy, R * 1.45, -t * 0.5 + i * 2.094, -t * 0.5 + i * 2.094 + 1.1); c.stroke(); }
  c.shadowBlur = 0; c.lineWidth = 1; c.globalAlpha = 0.4;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU + t * 0.08, r2 = R * (i % 5 === 0 ? 1.72 : 1.64);
    c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 1.58, cy + Math.sin(a) * R * 1.58); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke();
  }
  // Voice bars
  c.lineWidth = 3; c.lineCap = 'round'; c.globalAlpha = 1;
  for (let i = -4; i <= 4; i++) {
    const bar = S * (1 + 4.5 * Math.abs(Math.sin(t * 2.6 + i * 0.9)) * (1 - Math.abs(i) / 6));
    c.beginPath(); c.moveTo(cx + i * S * 1.3, cy - bar); c.lineTo(cx + i * S * 1.3, cy + bar); c.stroke();
  }
  c.lineCap = 'butt';
  // Holo platform
  const py = cy + S * 20;
  c.shadowColor = '#5B8CFF'; c.shadowBlur = 18;
  c.beginPath(); c.ellipse(cx, py, S * 17, S * 3.4, 0, 0, TAU); c.stroke();
  c.shadowBlur = 0; c.lineWidth = 1; c.globalAlpha = 0.6;
  c.beginPath(); c.ellipse(cx, py, S * 12, S * 2.3, 0, 0, TAU); c.stroke();
  c.globalAlpha = 1;
}

/** Drifting points that link to their neighbours and to the pointer: the page background. */
function drawStars(c: CanvasRenderingContext2D, w: number, h: number, t: number, st: FxState): void {
  if (!st.stars) {
    const r = rnd(41), n = Math.max(30, Math.min(110, Math.round((w * h) / 14000)));
    st.stars = Array.from({ length: n }, () => [r(), r(), (r() - 0.5) * 0.012, (r() - 0.5) * 0.012, 0.6 + r() * 1.4, r() * 6.28]);
  }
  const wrap = (v: number) => ((v % 1) + 1) % 1;
  const pts = (st.stars as number[][]).map((s) => [wrap(s[0] + s[2] * t) * w, wrap(s[1] + s[3] * t) * h, s[4], s[5]]);
  const reach = 130;
  c.lineWidth = 1; c.strokeStyle = '#A9B0E0';
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < reach) {
        c.globalAlpha = (1 - d / reach) * 0.22;
        c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[j][0], pts[j][1]); c.stroke();
      }
    }
  }
  const p = pointerOf(st);
  if (p) {
    const px = (p[0] * 0.5 + 0.5) * w, py = (p[1] * 0.5 + 0.5) * h;
    c.strokeStyle = '#58E0E8';
    for (const s of pts) {
      const d = Math.hypot(s[0] - px, s[1] - py);
      if (d < 190) {
        c.globalAlpha = (1 - d / 190) * 0.6;
        c.beginPath(); c.moveTo(px, py); c.lineTo(s[0], s[1]); c.stroke();
      }
    }
  }
  pts.forEach((s, i) => {
    c.fillStyle = i % 9 === 0 ? '#58E0E8' : i % 13 === 0 ? '#A07BFF' : '#EEF0FF';
    c.globalAlpha = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.2 + s[3]));
    c.beginPath(); c.arc(s[0], s[1], s[2], 0, TAU); c.fill();
  });
  c.globalAlpha = 1;
}

/** Draws one frame of a scene. `state` belongs to one canvas and keeps per-scene random values between frames. */
export function drawFx(kind: FxKind, c: CanvasRenderingContext2D, w: number, h: number, time: number, state: FxState): void {
  const t = Math.max(0, time); // scenes index arrays by time: never go below zero
  if (kind === 'sphere') drawSphere(c, w, h, t, state);
  else if (kind === 'stars') drawStars(c, w, h, t, state);
  else if (kind === 'mesh') drawMesh(c, w, h, t, state);
  else if (kind === 'stream') drawStream(c, w, h, t);
  else drawCore(c, w, h, t, state);
}
