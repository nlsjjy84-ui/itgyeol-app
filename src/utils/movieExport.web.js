// 웹: 합체 영상을 실제 영상 파일(mp4 또는 webm)로 저장한다.
// 앱 화면과 같은 대본(hapche.js)을 캔버스에 다시 그리고, 효과음까지 섞어 녹화한다. 자막은 영상 안에 새긴다.
import { Asset } from 'expo-asset';
import { poseAt, subAt, tagsAt, idleBob, threadAt, camAt, villainAt } from './hapche';
import { PIECE_BY_K } from '../data/pieces';
import { t } from '../i18n';

const SFX = {
  fly: require('../../assets/sfx/fly.wav'),
  clank: require('../../assets/sfx/clank.wav'),
  lock: require('../../assets/sfx/lock.wav'),
  shine: require('../../assets/sfx/shine.wav'),
  transform: require('../../assets/sfx/transform.wav'),
  daegeum: require('../../assets/sfx/daegeum_start.wav'),
};

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
    wrap(ctx, tl.title.full, S - 40).forEach((ln, i) => ctx.fillText(ln, S / 2, S * 0.06 + i * S * 0.065));
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
  ctx.fillText(t('유물 사진: {a} (공공누리 제1유형) · 잇결', { a: (tl.museums || []).join('·') }), S - 14, S - 12 - S * 0.0);
  ctx.restore();
}

// 영상 파일 만들기 — 진행률(0~1)을 알려 주고, 끝나면 {blob, url, ext}를 돌려준다
export async function exportMovie(tl, { size = 720, fps = 30, onProgress } = {}) {
  if (!canExport()) return { ok: false, reason: 'unsupported' };
  const imgs = {};
  await Promise.all([...new Set(tl.events.map((e) => e.k))].map(async (k) => (imgs[k] = await loadImg(PIECE_BY_K[k].img))));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
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
  const playS = (id, n) => {
    if (!actx || fired.has(id) || !bufs[n]) return;
    fired.add(id);
    const src = actx.createBufferSource();
    src.buffer = bufs[n];
    src.connect(bufs.__dest);
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
      drawFrame(ctx, size, tl, imgs, Math.min(time, tl.dur));
      if (time > 0.15) playS('open', tl.isTransform ? 'transform' : 'daegeum');
      tl.events.forEach((e, i) => {
        if (time >= e.start && i % 2 === 0) playS('f' + e.start, 'fly');
        if (time >= e.end) playS('c' + e.end, 'clank');
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

export function downloadBlob(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
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
