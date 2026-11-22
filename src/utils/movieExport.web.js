// 웹: 합체 영상을 실제 영상 파일(mp4 또는 webm)로 저장한다.
// 앱 화면과 같은 대본(hapche.js)을 캔버스에 다시 그리고, 효과음까지 섞어 녹화한다. 자막은 영상 안에 새긴다.
import { Asset } from 'expo-asset';
import { poseAt, subAt, tagsAt, idleBob, threadAt, camAt, villainAt, creditOf, sceneKind, sceneAt } from './hapche';
import { PIECE_BY_K } from '../data/pieces';
import { t } from '../i18n';

const SFX = {
  fly: require('../../assets/sfx/fly.wav'),
  clank: require('../../assets/sfx/clank.wav'),
  lock: require('../../assets/sfx/lock.wav'),
  shine: require('../../assets/sfx/shine.wav'),
  transform: require('../../assets/sfx/transform.wav'),
  daegeum: require('../../assets/sfx/daegeum_start.wav'),
  bgm: require('../../assets/sfx/bgm_hapche.wav'),
  clankMetal: require('../../assets/sfx/clank_metal.wav'),
  clankClay: require('../../assets/sfx/clank_clay.wav'),
  clankStone: require('../../assets/sfx/clank_stone.wav'),
  clankWood: require('../../assets/sfx/clank_wood.wav'),
};
const CLANK_OF = { 쇠: 'clankMetal', 금: 'clankMetal', 흙: 'clankClay', 돌: 'clankStone', 옥: 'clankStone', 뼈: 'clankStone', 나무: 'clankWood', 종이: 'clankWood', 천: 'clankWood' };

export function canExport() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!document.createElement('canvas').captureStream;
}

function pickMime() {
  const MR = window.MediaRecorder;
  const list = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find((m) => MR.isTypeSupported && MR.isTypeSupported(m)) || '';
}

function loadImg(mod) {
  return new Promise((resolve) => {
    const uri = Asset.fromModule(mod).uri;
    const im = new window.Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = uri;
  });
}

function wrap(ctx, text, maxW) {
  const out = [];
  let line = '';
  for (const ch of String(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = ch;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

// 출동 장면(영상용) — 화면(HapcheStage Scenery)과 같은 모양
function pill(ctx, x, y, w, h) {
  const r = Math.min(w, h) / 2;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}
function drawScenery(ctx, kind, a, time, S) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  if (kind === 'sea') {
    ctx.fillStyle = 'rgba(253,243,196,0.85)';
    ctx.beginPath();
    ctx.arc(S * 0.12, S * 0.2, S * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ['rgba(45,111,143,0.85)', 'rgba(36,93,122,0.85)', 'rgba(27,74,99,0.85)'].forEach((c, i) => {
      ctx.fillStyle = c;
      pill(ctx, -S * 0.2 + Math.sin(time * (1.2 + i * 0.3) + i) * S * 0.06, S * (0.74 + i * 0.08), S * 1.4, S * 0.3);
    });
  } else if (kind === 'sky') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) {
      const x = ((((i * 0.31 + 0.1) - time * 0.04 * (1 + i * 0.2)) % 1.3) + 1.3) % 1.3 - 0.2;
      pill(ctx, x * S, S * (0.12 + ((i * 0.23) % 0.7)), S * (0.22 + (i % 2) * 0.08), S * 0.07);
    }
  } else if (kind === 'space') {
    ctx.fillStyle = 'rgba(91,74,138,0.8)';
    ctx.beginPath();
    ctx.arc(S * 0.17, S * 0.73, S * 0.11, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.abs(Math.sin(time * 3 + i))) + ')';
      ctx.fillRect(((i * 53) % 100) * S / 100, ((i * 37) % 100) * S / 100, 2, 2);
    }
  } else {
    ctx.fillStyle = 'rgba(246,196,106,0.75)';
    ctx.beginPath();
    ctx.arc(S * 0.125, S * 0.195, S * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(63,107,67,0.85)';
    pill(ctx, -S * 0.2, S * 0.8, S * 0.8, S * 0.5);
    ctx.fillStyle = 'rgba(53,92,57,0.9)';
    pill(ctx, S * 0.4, S * 0.84, S * 0.9, S * 0.5);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const WHO_COLOR = { 풍이: '#e0a43a', 결이: '#6fb0d8', 함께: '#f0e6d0' };

export function drawFrame(ctx, S, tl, imgs, time) {
  const k = S / 1000;
  ctx.save();
  ctx.fillStyle = tl.frame.bg || '#1b2530';
  ctx.fillRect(0, 0, S, S);
  const done = time >= tl.titleT;
  ctx.strokeStyle = 'rgba(255,255,255,' + (done ? 0.11 : 0.06) + ')';
  ctx.lineWidth = 2 * k * 1.5;
  for (let i = 0; i < 9; i++) {
    const y = (i + 0.5) * (S / 9);
    ctx.beginPath();
    for (let x = -20; x <= S + 20; x += 20) ctx.lineTo(x + Math.sin(time * 0.8 + i) * 18, y + Math.sin(x / 60 + i) * 3);
    ctx.stroke();
  }
  // 밤의 박물관 — 바닥, 진열장, 조명
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, S * 0.83, S, S * 0.17);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  [0.04, 0.8].forEach((x) => {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(S * x, S * 0.5, S * 0.16, S * 0.33);
    ctx.strokeRect(S * x, S * 0.5, S * 0.16, S * 0.33);
  });
  [-14, 14].forEach((deg, i) => {
    ctx.save();
    ctx.translate(S * (0.46 + i * 0.08), S * 0.45);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.fillStyle = 'rgba(255,242,204,' + ((done ? 0.16 : 0.06) + 0.03 * Math.sin(time * 2 + i)) + ')';
    ctx.fillRect(-S * 0.08, -S * 0.55, S * 0.16, S * 1.1);
    ctx.restore();
  });
  if (time >= tl.lockT) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(S / 2, S * 0.89, S * 0.28, S * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawScenery(ctx, sceneKind(tl.frame.id), sceneAt(tl, time), time, S);
  if (tl.frame.stars)
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(time * 2 + i))) + ')';
      ctx.fillRect(((i * 137) % 100) * S / 100, ((i * 71) % 100) * S / 100, 3, 3);
    }
  const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.45);
  g.addColorStop(0, 'rgba(255,217,138,' + (done ? 0.3 + 0.06 * Math.sin(time * 3) : 0.1) + ')');
  g.addColorStop(1, 'rgba(255,217,138,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  if (tl.frame.person) {
    ctx.fillStyle = 'rgba(0,0,0,0.33)';
    roundRect(ctx, 430 * k, 120 * k, 140 * k, 780 * k, 70 * k);
    ctx.fill();
  }
  // 속도선
  tl.events.forEach((e) => {
    if (time < e.start || time >= e.end) return;
    const p = poseAt(e, time);
    ctx.fillStyle = 'rgba(255,243,194,' + 0.5 * (1 - p.p) + ')';
    ctx.fillRect(Math.min(p.x, e.to.x) * k, p.y * k, Math.abs(e.to.x - p.x) * k + 30, 3);
  });
  const bob = idleBob(tl, time) * k;
  const shake = time >= tl.lockT && time < tl.lockT + 0.35 ? Math.sin(time * 90) * 6 : 0;
  const vv = villainAt(tl, time);
  if (vv) {
    const scatter = time >= tl.lockT ? (time - tl.lockT) * 900 : 0;
    ctx.save();
    ctx.fillStyle = tl.villain.color;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const cx = 800 - Math.min(1, (time - 1.5) / 2.2) * 120 + Math.cos(a) * (70 + scatter) + Math.sin(time * 2 + i) * 10;
      const cy = 170 + Math.sin(a) * (45 + scatter * 0.7);
      ctx.globalAlpha = 0.55 * vv;
      ctx.beginPath();
      ctx.arc(cx * k, cy * k, (60 + (i % 3) * 18) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  const cam = camAt(tl, time);
  ctx.save();
  ctx.translate(S / 2 + shake, S / 2 + bob);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.cx * k, -cam.cy * k);
  const bobSave = bob;
  (tl.threads || []).forEach((th, i) => {
    const f = threadAt(th, time);
    if (!f) return;
    ctx.save();
    ctx.globalAlpha = time >= tl.lockT ? 0.55 + 0.35 * Math.abs(Math.sin(time * 4 + i)) : 0.85;
    ctx.strokeStyle = '#f2c75c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(th.a.x * k, th.a.y * k);
    ctx.lineTo((th.a.x + (th.b.x - th.a.x) * f) * k, (th.a.y + (th.b.y - th.a.y) * f) * k);
    ctx.stroke();
    ctx.restore();
  });
  [...tl.events]
    .sort((a, b) => a.z - b.z)
    .forEach((e) => {
      const p = poseAt(e, time);
      const im = imgs[e.k];
      if (!p || !im) return;
      const w = e.w * k * p.s;
      const h = e.h * k * p.s;
      const spin = e.spin && done ? (time - tl.titleT) * 360 : 0;
      ctx.save();
      ctx.translate(p.x * k, p.y * k);
      ctx.rotate(((p.rot + spin) * Math.PI) / 180);
      ctx.scale(e.flip ? -1 : 1, e.flipY ? -1 : 1);
      ctx.globalAlpha = e.ghost ? 0.55 : 1;
      if (e.fire && p.landed) {
        ctx.fillStyle = 'rgba(255,138,42,' + (0.6 + 0.4 * Math.abs(Math.sin(time * 18))) + ')';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.5, w * 0.35, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      if (p.landed && time - e.end < 0.25) {
        ctx.strokeStyle = 'rgba(255,246,200,0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    });
  ctx.restore();
  void bobSave;
  if (time >= tl.lockT && time < tl.lockT + 0.6) {
    ctx.fillStyle = 'rgba(255,248,232,' + (1 - (time - tl.lockT) / 0.6) * 0.85 + ')';
    ctx.fillRect(0, 0, S, S);
  }
  ctx.textBaseline = 'top';
  if (done) {
    ctx.font = `700 ${Math.round(S * 0.052)}px "Gowun Batang", "Nanum Myeongjo", serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff4d6';
    // 조각과 겹쳐도 읽히게 제목 뒤에 반투명 띠를 깐다(화면과 같게)
    const tlines = wrap(ctx, tl.title.full, S * 0.82);
    const tw = Math.max(...tlines.map((ln) => ctx.measureText(ln).width)) + S * 0.05;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(12,14,18,0.55)';
    const th = tlines.length * S * 0.065 + S * 0.02;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(S / 2 - tw / 2, S * 0.03, tw, th, S * 0.03);
      ctx.fill();
    } else ctx.fillRect(S / 2 - tw / 2, S * 0.03, tw, th);
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff4d6';
    tlines.forEach((ln, i) => ctx.fillText(ln, S / 2, S * 0.04 + i * S * 0.065));
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = 'left';
  tagsAt(tl, time)
    .slice(-2)
    .forEach((tg, i) => {
      ctx.font = `600 ${Math.round(S * 0.028)}px sans-serif`;
      const txt = tg.slot + '  ' + tg.text;
      const w = Math.min(S * 0.8, ctx.measureText(txt).width + 24);
      ctx.fillStyle = 'rgba(0,0,0,0.66)';
      roundRect(ctx, 12, 12 + i * S * 0.05, w, S * 0.042, 12);
      ctx.fill();
      ctx.fillStyle = '#f0c45a';
      ctx.fillText(tg.slot, 24, 12 + i * S * 0.05 + S * 0.007);
      ctx.fillStyle = '#fff';
      ctx.fillText(tg.text, 24 + ctx.measureText(tg.slot + '  ').width, 12 + i * S * 0.05 + S * 0.007, w - 40);
    });
  const sub = subAt(tl, time);
  if (sub) {
    ctx.font = `500 ${Math.round(S * 0.036)}px sans-serif`;
    const lines = wrap(ctx, sub.text, S - 60);
    const lh = S * 0.048;
    const bh = lh * lines.length + S * 0.06;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    roundRect(ctx, 12, S - bh - 14, S - 24, bh, 14);
    ctx.fill();
    ctx.font = `700 ${Math.round(S * 0.026)}px sans-serif`;
    ctx.fillStyle = WHO_COLOR[sub.who] || '#fff';
    ctx.fillText(t(sub.who), 28, S - bh - 4);
    ctx.font = `500 ${Math.round(S * 0.036)}px sans-serif`;
    ctx.fillStyle = '#fff';
    lines.forEach((ln, i) => ctx.fillText(ln, 28, S - bh - 4 + S * 0.035 + i * lh));
  }
  // 출처 — 영상에도 박물관 이름을 남긴다(공공누리 출처 표시)
  ctx.font = `400 ${Math.round(S * 0.018)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(t('유물 사진') + ': ' + creditOf(tl.museums || []) + ' · ' + t('잇결'), S - 14, S - 12);
  ctx.restore();
}

// 영상 파일 만들기 — 진행률(0~1)을 알려 주고, 끝나면 {blob, url, ext}를 돌려준다
export async function exportMovie(tl, { size = 720, fps = 30, onProgress, vertical = false } = {}) {
  if (!canExport()) return { ok: false, reason: 'unsupported' };
  const imgs = {};
  await Promise.all([...new Set(tl.events.map((e) => e.k))].map(async (k) => (imgs[k] = await loadImg(PIECE_BY_K[k].img))));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = vertical ? Math.round((size * 16) / 9) : size;
  const ctx = canvas.getContext('2d');
  // 세로 영상(쇼츠·릴스): 정사각 장면을 가운데 두고 위에 제목, 아래에 잇결 표시
  const sq = vertical ? document.createElement('canvas') : null;
  if (sq) {
    sq.width = size;
    sq.height = size;
  }
  const paint = (time) => {
    if (!vertical) return drawFrame(ctx, size, tl, imgs, time);
    drawFrame(sq.getContext('2d'), size, tl, imgs, time);
    const Hh = canvas.height;
    ctx.fillStyle = tl.frame.bg || '#1b2530';
    ctx.fillRect(0, 0, size, Hh);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(sq, -size * 0.4, -size * 0.1, size * 1.8, Hh * 1.2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, size, Hh);
    const top = (Hh - size) / 2;
    ctx.drawImage(sq, 0, top, size, size);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6e7c4';
    ctx.font = `700 ${Math.round(size * 0.06)}px "Gowun Batang", serif`;
    ctx.fillText(t('유물 합체'), size / 2, top * 0.45);
    ctx.font = `500 ${Math.round(size * 0.034)}px sans-serif`;
    ctx.fillStyle = '#ffffffcc';
    ctx.fillText(tl.title.full, size / 2, top * 0.45 + size * 0.07, size - 40);
    ctx.font = `500 ${Math.round(size * 0.03)}px sans-serif`;
    ctx.fillText(t('잇결 · 진짜 박물관 유물로 만든 작품'), size / 2, top + size + (Hh - top - size) * 0.5);
  };
  const stream = canvas.captureStream(fps);
  // 소리 섞기
  let actx = null;
  const bufs = {};
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = actx.createMediaStreamDestination();
    await Promise.all(
      Object.entries(SFX).map(async ([n, mod]) => {
        const res = await fetch(Asset.fromModule(mod).uri);
        bufs[n] = await actx.decodeAudioData(await res.arrayBuffer());
      })
    );
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    bufs.__dest = dest;
  } catch (e) {
    actx = null;
  }
  const mime = pickMime();
  const rec = new window.MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
  const chunks = [];
  rec.ondataavailable = (ev) => ev.data && ev.data.size && chunks.push(ev.data);
  const fired = new Set();
  const playS = (id, n, vol = 1) => {
    if (!actx || fired.has(id) || !bufs[n]) return;
    fired.add(id);
    const src = actx.createBufferSource();
    src.buffer = bufs[n];
    const g = actx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(bufs.__dest);
    src.start();
  };
  return new Promise((resolve) => {
    rec.onstop = () => {
      const type = rec.mimeType || mime || 'video/webm';
      const blob = new Blob(chunks, { type });
      if (actx) actx.close().catch(() => {});
      resolve({ ok: true, blob, url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm' });
    };
    rec.start(250);
    const t0 = performance.now();
    const total = tl.dur + 0.8;
    const step = () => {
      const time = (performance.now() - t0) / 1000;
      paint(Math.min(time, tl.dur));
      if (time > 0.02) playS('bgm', 'bgm', 0.45);
      if (time > 16) playS('bgm2', 'bgm', 0.45);
      if (time > 0.15) playS('open', tl.isTransform ? 'transform' : 'daegeum');
      tl.events.forEach((e, i) => {
        if (time >= e.start && i % 2 === 0) playS('f' + e.start, 'fly');
        if (time >= e.end) playS('c' + e.end, CLANK_OF[(PIECE_BY_K[e.k] || {}).power] || 'clank');
      });
      if (time >= tl.lockT) playS('lock', 'lock');
      if (time >= tl.titleT) playS('shine', 'shine');
      if (onProgress) onProgress(Math.min(1, time / total));
      if (time < total) requestAnimationFrame(step);
      else rec.stop();
    };
    requestAnimationFrame(step);
  });
}

// 한글 파일 이름은 브라우저·운영체제에 따라 「download」로 바뀌어 받아지는 일이 있다(시험에서 확인) —
// 받는 파일 이름은 늘 영문으로 만들고, 날짜·시각을 붙여 겹치지 않게 한다.
const KO_WORD = [['잇결', 'itgyeol'], ['작품사진', 'photo'], ['종이키트', 'paperkit'], ['이야기', 'story'], ['세로', 'vertical']];
export function safeName(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  let base = dot > 0 ? name.slice(0, dot) : name;
  KO_WORD.forEach(([k, e]) => (base = base.split(k).join(e)));
  base = base.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'itgyeol';
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  return `${base}_${stamp}${ext}`;
}
export function downloadBlob(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName(name);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // 브라우저가 파일 이름을 읽기 전에 지우면 「download」라는 이름으로 받아진다 — 잠시 뒤에 치운다
  setTimeout(() => a.remove(), 4000);
}

// 자막 파일(.srt) — 영상과 같은 자막을 따로 쓸 수 있게
export function srtOf(tl) {
  const ts = (s) => {
    const ms = Math.round(s * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms / 60000) % 60)).padStart(2, '0');
    const sec = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');
    return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`;
  };
  return tl.subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${t(s.who)}: ${s.text}\n`).join('\n');
}

// 종이 변형 키트 도안(A4) — 합체 작품의 조각을 합체 순서대로 번호를 매겨 오려 붙일 수 있게 한 장에 담는다.
// 위: 완성 모습과 조립 순서, 아래: 조각마다 오리는 선(점선)과 풀칠 날개, 번호·자리 이름·유물 이름.
export async function paperKit(tl) {
  const W = 2480;
  const H = 3508; // A4 300dpi
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const imgs = {};
  await Promise.all([...new Set(tl.events.map((e) => e.k))].map(async (k) => (imgs[k] = await loadImg(PIECE_BY_K[k].img))));
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1b2227';
  ctx.font = '700 96px "Gowun Batang", serif';
  ctx.fillText(t('종이 변형 키트'), 140, 210);
  ctx.font = '500 56px sans-serif';
  ctx.fillText(tl.title.full, 140, 300, W - 280);
  ctx.font = '400 40px sans-serif';
  ctx.fillStyle = '#5d6a70';
  ctx.fillText(t('① 점선을 따라 오려요  ② 회색 날개에 풀칠해요  ③ 번호 순서대로 완성 그림처럼 붙여요'), 140, 380, W - 280);
  // 완성 그림
  const fin = document.createElement('canvas');
  fin.width = 900;
  fin.height = 900;
  drawFrame(fin.getContext('2d'), 900, tl, imgs, tl.dur);
  ctx.drawImage(fin, 140, 440, 900, 900);
  // 조립 순서
  const order = [];
  tl.events.forEach((e) => {
    if (!order.find((o) => o.k === e.k && o.slot === e.slot)) order.push(e);
  });
  ctx.fillStyle = '#1b2227';
  ctx.font = '700 52px sans-serif';
  ctx.fillText(t('조립 순서'), 1120, 500);
  ctx.font = '400 38px sans-serif';
  order.slice(0, 16).forEach((e, i) => {
    const p = PIECE_BY_K[e.k];
    ctx.fillText(`${i + 1}. ${t(e.slot || '')} — ${p.name}`.slice(0, 34), 1120, 580 + i * 50);
  });
  // 조각 오리기 판
  const cell = 520;
  const cols = 4;
  order.slice(0, 16).forEach((e, i) => {
    const im = imgs[e.k];
    if (!im) return;
    const cx = 140 + (i % cols) * (cell + 30);
    const cy = 1440 + Math.floor(i / cols) * (cell + 60);
    if (cy + cell > H - 80) return;
    const ar = im.width / im.height;
    const w = ar >= 1 ? cell - 80 : (cell - 80) * ar;
    const h = ar >= 1 ? (cell - 80) / ar : cell - 80;
    const x = cx + (cell - w) / 2;
    const y = cy + (cell - h) / 2;
    ctx.fillStyle = '#d9d4ca';
    ctx.fillRect(x - 18, y + h, w + 36, 40); // 풀칠 날개
    ctx.drawImage(im, x, y, w, h);
    ctx.setLineDash([16, 12]);
    ctx.strokeStyle = '#1b2227';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 18, y - 10, w + 36, h + 50);
    ctx.setLineDash([]);
    ctx.fillStyle = '#b3322b';
    ctx.beginPath();
    ctx.arc(cx + 40, cy + 40, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cx + 40, cy + 54);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1b2227';
    ctx.font = '400 30px sans-serif';
    ctx.fillText(PIECE_BY_K[e.k].name.slice(0, 16), cx, cy + cell + 30, cell);
  });
  ctx.fillStyle = '#5d6a70';
  ctx.font = '400 30px sans-serif';
  ctx.fillText(t('유물 사진') + ': ' + creditOf(tl.museums || []) + ' · ' + t('잇결'), 140, H - 60);
  return new Promise((resolve) => c.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/png'));
}

// 이야기 영상(프롤로그·판 입구) 파일로 저장 — 화면의 이야기 영상과 같은 구성: 움직이는 배경, 풍이·결이, 떠다니는 유물, 자막.
// 고르는 장면은 「가만히 있기」(기본 대답)로 이어 간다.
export async function exportStory({ part, pages, resolve, art, chars, charAr, floatersFor, onProgress, size = 720 }) {
  if (!canExport()) return { ok: false };
  const script = [];
  let t0 = 0;
  const dur = (txt) => Math.max(2.6, Math.min(6.8, 1.6 + String(txt).length * 0.075));
  const pageSpans = [];
  pages.forEach((pg, pi) => {
    const start = t0;
    const lines = resolve(pg.lines).concat(pg.input ? resolve(pg.input.react[pg.input.silent] || []) : []);
    lines.forEach((ln) => {
      script.push({ pi, who: ln.who, text: ln.text, t0, t1: t0 + dur(ln.text) });
      t0 += dur(ln.text);
    });
    pageSpans.push({ pi, start, end: t0 });
  });
  const total = t0 + 0.8;
  const W = size;
  const H = Math.round(size * 1.05);
  const arts = await Promise.all(pages.map((pg) => loadImg(art[pg.art] || art.gate)));
  const ch = { pung: await loadImg(chars.pung), gyeol: await loadImg(chars.gyeol) };
  const floats = await Promise.all(pages.map(async (pg, pi) => Promise.all(floatersFor(part, 4, pi * 31 + part.length * 7).map((p) => loadImg(p.img)))));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(30);
  let actx = null;
  let dest = null;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    dest = actx.createMediaStreamDestination();
    const buf = await actx.decodeAudioData(await (await fetch(Asset.fromModule(SFX.bgm).uri)).arrayBuffer());
    const play = (at) => {
      const s = actx.createBufferSource();
      s.buffer = buf;
      const g = actx.createGain();
      g.gain.value = 0.35;
      s.connect(g);
      g.connect(dest);
      s.start(actx.currentTime + at);
    };
    for (let at = 0; at < total; at += 16) play(at);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  } catch (e) {
    actx = null;
  }
  const mime = pickMime();
  const rec = new window.MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
  const chunks = [];
  rec.ondataavailable = (ev) => ev.data && ev.data.size && chunks.push(ev.data);
  const draw = (time) => {
    const span = pageSpans.find((s) => time >= s.start && time < s.end) || pageSpans[pageSpans.length - 1];
    const pi = span.pi;
    const local = time - span.start;
    const prog = Math.min(1, local / Math.max(4, span.end - span.start));
    const im = arts[pi];
    ctx.fillStyle = '#0b1016';
    ctx.fillRect(0, 0, W, H);
    if (im) {
      const artW = H * (im.width / im.height) * 1.12;
      const panX = -(artW - W) * (pi % 2 ? 1 - prog : prog);
      const z = 1.04 + 0.08 * prog;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(im, panX, -H * 0.04, artW, H * 1.08);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(11,16,22,0.25)';
    ctx.fillRect(0, 0, W, H);
    (floats[pi] || []).forEach((fim, i) => {
      if (!fim) return;
      const enter = Math.min(1, Math.max(0, (local - 0.4 - i * 0.35) / 0.8));
      const sz = W * (0.17 + (i % 2) * 0.04);
      const x = [0.1, 0.72, 0.36, 0.84][i] * W;
      const y = [0.1, 0.16, 0.05, 0.42][i] * H + Math.sin(time * 1.2 + i * 1.7) * 10 + (1 - enter) * -120;
      ctx.globalAlpha = enter * 0.95;
      const ar = fim.width / fim.height;
      const w = ar >= 1 ? sz : sz * ar;
      const h = ar >= 1 ? sz / ar : sz;
      ctx.drawImage(fim, x - w / 2, y + (sz - h) / 2, w, h);
      ctx.globalAlpha = 1;
    });
    const line = script.find((s) => time >= s.t0 && time < s.t1);
    ['pung', 'gyeol'].forEach((who, i) => {
      const img = ch[who];
      if (!img) return;
      const on = line && line.who === who;
      const cw = W * (who === 'gyeol' ? 0.34 : 0.28);
      const chh = cw / charAr[who];
      const hop = on ? Math.abs(Math.sin(time * 9)) * 6 : 0;
      ctx.globalAlpha = on || !line ? 1 : 0.62;
      const x = i === 0 ? W * 0.03 : W - W * 0.03 - cw;
      ctx.drawImage(img, x, H - H * 0.21 - chh - hop + Math.sin(time * 2 + i * 2) * 4, cw, chh);
      ctx.globalAlpha = 1;
    });
    if (local < 3.2) {
      ctx.globalAlpha = local < 2.6 ? 1 : 1 - (local - 2.6) / 0.6;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.font = `600 ${Math.round(W * 0.034)}px "Gowun Batang", serif`;
      const place = t(pages[pi].place || '');
      roundRect(ctx, 16, 22, ctx.measureText(place).width + 24, W * 0.055, 8);
      ctx.fill();
      ctx.fillStyle = '#f6e7c4';
      ctx.textBaseline = 'top';
      ctx.fillText(place, 28, 28);
      ctx.globalAlpha = 1;
    }
    if (line) {
      ctx.font = `500 ${Math.round(W * 0.036)}px sans-serif`;
      const lines = wrap(ctx, line.text, W - 64);
      const lh = W * 0.05;
      const bh = lh * lines.length + W * 0.07;
      ctx.fillStyle = 'rgba(0,0,0,0.77)';
      roundRect(ctx, 12, H - bh - 12, W - 24, bh, 14);
      ctx.fill();
      ctx.textBaseline = 'top';
      ctx.font = `700 ${Math.round(W * 0.026)}px sans-serif`;
      ctx.fillStyle = line.who === 'pung' ? '#e0a43a' : '#6fb0d8';
      ctx.fillText(t(line.who === 'pung' ? '풍이' : '결이'), 28, H - bh);
      ctx.font = `500 ${Math.round(W * 0.036)}px sans-serif`;
      ctx.fillStyle = '#fff';
      lines.forEach((ln, i) => ctx.fillText(ln, 28, H - bh + W * 0.038 + i * lh));
    }
  };
  return new Promise((resolve2) => {
    rec.onstop = () => {
      const type = rec.mimeType || mime || 'video/webm';
      const blob = new Blob(chunks, { type });
      if (actx) actx.close().catch(() => {});
      resolve2({ ok: true, url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm' });
    };
    rec.start(250);
    const start = performance.now();
    const step = () => {
      const time = (performance.now() - start) / 1000;
      draw(Math.min(time, total - 0.01));
      if (onProgress) onProgress(Math.min(1, time / total));
      if (time < total) requestAnimationFrame(step);
      else rec.stop();
    };
    requestAnimationFrame(step);
  });
}

// 작품 사진(포스터) — 합체가 끝나고 출동 장면이 다 펼쳐진 순간을 1080×1080 PNG 한 장으로
export async function posterPng(tl, { size = 1080 } = {}) {
  const imgs = {};
  await Promise.all([...new Set(tl.events.map((e) => e.k))].map(async (k) => (imgs[k] = await loadImg(PIECE_BY_K[k].img))));
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  drawFrame(c.getContext('2d'), size, tl, imgs, Math.min(tl.dur - 0.05, tl.titleT + 2.4));
  return new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : null), 'image/png'));
}
