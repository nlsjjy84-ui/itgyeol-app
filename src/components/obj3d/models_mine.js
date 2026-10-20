import { senseSummary } from '../../utils/senseMath';
import { TRAD, motifLines } from '../../data/motifs';
import { THREE, mesh, group, rbox, tube, knot, tassel, texMat, getDna, smoothProfile } from './kit';
import { FORMATIONS } from '../../data/formations';
import { GLYPHS } from '../../data/glyphs';

// ───── 놀이가 모양을 빚는 물건 ─────
// 겉에 그림을 입히는 데서 그치지 않고, 판마다 남긴 행동이 입체의 한 부분이 된다.
//   진법        → 패의 윤곽(꽃잎 수)과 투각(뚫린 구멍) 자리 / 항아리의 참외 골 수
//   훈민정음·인쇄 → 맞춘 글자가 도드라진 낙관(양각 글자)
//   전래놀이     → 놀이마다 입체 부조 장식(방패연·팽이·새끼줄…), 한 놀이를 여러 번 하면 장식이 커진다
//   한글 테트리스 → 쌓은 블록이 꼭지(패를 거는 머리·항아리 뚜껑 손잡이)의 짜임이 된다
// 같은 기록이 아니면 같은 모양이 나오지 않는다. 출력 기준(1.5mm)을 지키도록 치수를 정했다:
// 패 지름 ≈ 2.0 단위가 약 40mm이므로 1 단위 ≈ 20mm — 판 두께 0.13(2.6mm), 구멍 지름 0.15(3mm),
// 부조 선 굵기 0.06(1.2mm)·높이 0.045(0.9mm), 글자 높이 0.045(0.9mm, 색으로 칠한 글자는 선 0.4mm까지 출력).

// deformObject는 돌려받은 물체 자체의 회전·위치를 버린다 → 기울여 보여 줄 물건은 한 겹 더 싸서 돌려준다
const wrap = (o) => { const w = new THREE.Group(); w.add(o); return w; };
export const recordRef = { v: null };

// 몸짓·표정·감탄사(동의한 사람만 기록됨) → 모양: 흥이 클수록 테두리 물결이 깊어지고, 웃음·감탄 횟수만큼 둘레 구슬이 는다
export function senseFx(log) {
  const s = senseSummary(log && log.senses);
  if (!s) return { wave: 1, extra: 0, s: null };
  return { wave: 1 + (s.camera ? Math.min(1, s.level * 1.6 + s.big * 0.03) * 0.9 : 0), extra: Math.min(12, s.smile + s.wow), s };
} // Obj3DViewer가 만들기 직전에 { attempts, log } 를 넣는다
const rec = () => recordRef.v || { attempts: [], log: null };

// 납작한 띠 테두리: 바깥·안쪽 반지름을 각도마다 정해(꽃잎 윤곽을 그대로 따라) 얇게 뽑는다.
// 둥근 고리(토러스)는 출력 두께를 맞출 때 통째로 커져 몸체 밖으로 떠 보이므로 쓰지 않는다.
function bandRing(rOut, rIn, h, mat, n = 160) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = rOut(a);
    if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const hole = new THREE.Path();
  for (let i = n; i >= 0; i -= 1) {
    const a = (i / n) * Math.PI * 2;
    const r = rIn(a);
    if (i === n) hole.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else hole.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: h * 0.3, bevelSize: Math.min(0.01, h * 0.3), bevelSegments: 2, curveSegments: 8 });
  return new THREE.Mesh(geo, mat);
}


const HANGUL_GLYPH = { st1: 'ㅣ', st2: 'ㅏ', st3: 'ㅁ', st4: 'ㄷ' };
const PRINT_WORD = {
  'jamo-sogo': '소고', 'jamo-binyeo': '비녀', 'jamo-bomul': '보물', 'jamo-pungmulnori': '풍물', 'jamo-munhwajae': '문화',
  'jamo-hangeulnal': '한글', metaltype: '직지', woodblock: '경판', mirror: '거울', sentence: '서문', shape: '꼴',
};
// 블록 쌓기 모양(한글 테트리스 단계마다) — [x, y] 칸
const BLOCKS = {
  st1: [[0, 0], [0, 1], [0, 2]],
  st2: [[0, 0], [0, 1], [1, 1], [0, 2]],
  st3: [[0, 0], [1, 0], [0, 1], [1, 1]],
  st4: [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2]],
};

function byScene(attempts) {
  return Object.fromEntries((attempts || []).map((a) => [a.sceneId, a]));
}
function gameCounts(log, attempts) {
  const has = (attempts || []).some((a) => a.sceneId === 'tbd');
  if (!has) return [];
  const bg = (log && log.byGame) || {};
  const list = Object.entries(bg).filter(([, n]) => n > 0);
  if (list.length === 0) {
    const a = (attempts || []).find((x) => x.sceneId === 'tbd');
    return a ? [[a.formationId, 1]] : [];
  }
  return list.sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 6);
}

// ───── 글자(양각) ─────
function parsePath(d) {
  const sp = new THREE.ShapePath();
  const tok = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
  let i = 0;
  let cmd = '';
  const n = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[MLQCZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === 'M') sp.moveTo(n(), n());
    else if (cmd === 'L') sp.lineTo(n(), n());
    else if (cmd === 'Q') { const a = n(); const b = n(); sp.quadraticCurveTo(a, b, n(), n()); }
    else if (cmd === 'C') { const a = n(); const b = n(); const c = n(); const dd = n(); sp.bezierCurveTo(a, b, c, dd, n(), n()); }
    else if (cmd === 'Z') { cmd = ''; }
    else i += 1;
  }
  return sp.toShapes(false);
}
const glyphCache = {};
function glyphGeo(ch, size, depth) {
  const g = GLYPHS[ch];
  if (!g) return null;
  const key = `${ch}|${size}|${depth}`;
  if (glyphCache[key]) return glyphCache[key].clone();
  const shapes = parsePath(g[0]);
  if (!shapes.length) return null;
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 6 });
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  geo.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
  const k = size / Math.max(b.max.x - b.min.x, b.max.y - b.min.y, 1e-6);
  geo.scale(k, k, 1);
  glyphCache[key] = geo;
  return geo.clone();
}

// 낙관(양각): 도드라진 네모 테 + 글자. 오른쪽 줄부터 위→아래로 읽는다.
function sealRelief(word, size, mat, h) {
  const g = new THREE.Group();
  const chars = Array.from(word);
  const cols = chars.length > 2 ? 2 : 1;
  const rows = Math.ceil(chars.length / cols);
  const bar = size * 0.07;
  [[0, size / 2 - bar / 2, size, bar], [0, -size / 2 + bar / 2, size, bar], [size / 2 - bar / 2, 0, bar, size], [-size / 2 + bar / 2, 0, bar, size]].forEach(([x, y, w, hh]) =>
    g.add(mesh(new THREE.BoxGeometry(w, hh, h), mat, [x, y, h / 2]))
  );
  const inner = size - bar * 2.6;
  const cell = inner / Math.max(rows, cols);
  chars.forEach((ch, i) => {
    const col = cols === 1 ? 0 : cols - 1 - Math.floor(i / rows);
    const row = cols === 1 ? i : i % rows;
    const geo = glyphGeo(ch, cell * 0.86, h);
    if (!geo) return;
    const x = cols === 1 ? 0 : -inner / 2 + cell * (col + 0.5);
    const y = inner / 2 - (inner / rows) * (row + 0.5);
    g.add(mesh(geo, mat, [x, y, 0]));
  });
  return g;
}

// ───── 전래놀이 부조: 선 그림(단위 상자 -0.5~0.5)을 관(tube)으로 도드라지게 ─────
// 놀이 → 전통 문양 선(src/data/motifs.js). 화면 무늬와 같은 선으로 3D 부조를 만든다.
export const MOTIF_LINES = Object.fromEntries(Object.keys(TRAD).map((k) => [k, () => motifLines(k)]));
function motifRelief(id, size, mat, h) {
  const make = MOTIF_LINES[id] || MOTIF_LINES.yeonnaligi;
  const g = new THREE.Group();
  const r = Math.max(0.03, size * 0.045);
  make().forEach((line) => {
    if (line.length < 2) return;
    const pts = line.map(([x, y]) => [x * size, y * size, h * 0.35]);
    if (pts.length === 2) pts.splice(1, 0, [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2, h * 0.35]);
    g.add(tube(pts, r, mat, Math.max(8, pts.length * 3)));
  });
  return g;
}

// 한글 테트리스 블록 꼭지(정육면체를 쌓은 모양) — 위쪽 블록에 고리 구멍 자리
function blockKnob(stage, cube, mat) {
  const g = new THREE.Group();
  const cells = BLOCKS[stage] || BLOCKS.st1;
  const xs = cells.map(([x]) => x);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  cells.forEach(([x, y]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(cube * 0.96, cube * 0.96, cube * 0.96), mat);
    b.position.set((x - cx) * cube, y * cube + cube / 2, 0);
    g.add(b);
  });
  return g;
}


// 진법 점들 → 패의 투각 구멍 자리(둘레 0.58R~0.8R, 구멍 사이 벽이 두께 기준을 넘도록 가까운 점은 하나로)
export function holePositions(pts, R = 1) {
  const holes = [];
  if (!pts || !pts.length) return holes;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const maxr = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)), 1e-3);
  pts.forEach((p) => {
    const dx = p.x - cx;
    const dy = -(p.y - cy);
    const rr = Math.hypot(dx, dy) / maxr;
    const ang = Math.atan2(dy, dx);
    const rad = R * (0.58 + 0.22 * rr);
    const hx = Math.cos(ang) * rad;
    const hy = Math.sin(ang) * rad;
    if (holes.every(([x, y]) => Math.hypot(x - hx, y - hy) > 0.24 * R)) holes.push([hx, hy]);
  });
  return holes.slice(0, 12);
}

// 기록 → 이 물건에 들어간 것들(설명 화면과 3D가 같은 계산을 쓴다)
export function shapeFacts(attempts, log) {
  const by = byScene(attempts);
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const pts = (f && f.positions) || [];
  const games = gameCounts(log, attempts);
  return {
    formation: f ? f.name : null,
    petals: pts.length ? Math.min(12, Math.max(5, pts.length)) : 0,
    holes: holePositions(pts).length,
    word: by.print ? PRINT_WORD[by.print.formationId] || '글' : null,
    games,
    stage: by.hangul ? by.hangul.formationId : null,
    blocks: by.hangul ? (BLOCKS[by.hangul.formationId] || BLOCKS.st1).length : 0,
    glyph: by.hangul ? HANGUL_GLYPH[by.hangul.formationId] || 'ㅏ' : null,
    lotus: pts.length ? Math.min(12, Math.max(6, pts.length)) : 8,
    seeds: Math.max(1, Math.min(12, games.reduce((s, [, n]) => s + n, 0) || 1)),
    beads: 16 + games.length * 2 + (by.hangul ? (BLOCKS[by.hangul.formationId] || BLOCKS.st1).length : 0) * 2 + senseFx(log).extra,
    sense: senseFx(log),
  };
}

// ───── 나만의 노리개 패 ─────
export const mineNorigae = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const d = getDna();
  const R = 1.0;
  const T = 0.13;
  // 1) 윤곽: 진법 인원 수만큼 꽃잎(없으면 형태 유전자 꽃잎)
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const pts = (f && f.positions) || [];
  const lobes = pts.length ? Math.min(12, Math.max(5, pts.length)) : d.lobes || 0;
  const fx = senseFx(log);
  const amp = lobes ? (0.05 + (d.lobeAmp || 0.07) * 0.6) * fx.wave : 0;
  const outline = new THREE.Shape();
  const N = 180;
  for (let i = 0; i <= N; i += 1) {
    const a = (i / N) * Math.PI * 2 + Math.PI / 2;
    const r = R * (1 + amp * Math.cos(lobes * (a - Math.PI / 2)));
    if (i === 0) outline.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else outline.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  // 2) 투각: 진 모양 그대로 둘레(0.56R~0.8R)에 구멍을 뚫는다 — 가운데는 낙관·부조 자리
  const holes = holePositions(pts, R);
  holes.forEach(([x, y]) => {
    const hp = new THREE.Path();
    hp.absarc(x, y, 0.075, 0, Math.PI * 2, true);
    outline.holes.push(hp);
  });
  const face = texMat(tex, { rough: 0.6 });
  const geo = new THREE.ExtrudeGeometry(outline, { depth: T, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 60 });
  geo.translate(0, 0, -T / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, [face, m.gold]));
  const z = T / 2 + 0.02;
  // 3) 가운데: 낙관(양각) — 없으면 가장 많이 한 놀이의 부조
  const games = gameCounts(log, attempts);
  const seal = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.5 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd1ad55, roughness: 0.45 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 64), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.7 }));
  disc.rotation.x = Math.PI / 2;
  disc.position.z = z;
  g.add(disc);
  if (by.print) {
    const sr = sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.42, seal, 0.045);
    sr.position.z = z + 0.015;
    g.add(sr);
  } else if (games.length) {
    const mr = motifRelief(games[0][0], 0.72, seal, 0.045);
    mr.position.z = z + 0.015;
    g.add(mr);
  }
  const ring = bandRing(() => 0.53, () => 0.47, 0.03, goldM);
  ring.position.z = z - 0.015;
  g.add(ring);
  // 4) 뒷면: 놀이마다 부조 — 한 놀이를 여러 번 했으면 크게
  const back = new THREE.Group();
  games.forEach(([id, n], i) => {
    const a = Math.PI / 2 + (i / Math.max(1, games.length)) * Math.PI * 2;
    const sz = 0.32 + Math.min(4, n) * 0.04;
    const r = games.length === 1 ? 0 : 0.5;
    const mr = motifRelief(id, sz, goldM, 0.045);
    mr.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    back.add(mr);
  });
  if (by.hangul) {
    const ch = glyphGeo(HANGUL_GLYPH[by.hangul.formationId] || 'ㅏ', 0.34, 0.045);
    if (ch) back.add(mesh(ch, goldM, [0, 0, 0]));
  }
  back.rotation.y = Math.PI;
  back.position.z = -z;
  g.add(back);
  // 5) 꼭지: 한글 테트리스 블록(없으면 둥근 고리 받침)
  const top = new THREE.Group();
  if (by.hangul) {
    const k = blockKnob(by.hangul.formationId, 0.1, m.gold);
    top.add(k);
  } else {
    top.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 24), m.gold, [0, 0.09, 0]));
  }
  top.position.y = R * (1 + amp) - 0.04;
  g.add(top);
  // 6) 매듭과 술(진짜 실)
  const kn = knot(0.12, m.silkRed, m.gold);
  kn.position.set(0, -R * (1 + amp) - 0.12, 0);
  g.add(kn);
  const ts = tassel(1.6, 0.34, m.silkRed, m.gold, 30);
  ts.position.set(0, -R * (1 + amp) - 0.5, 0);
  g.add(ts);
  return g;
};

// ───── 나만의 항아리 ─────
export const mineJar = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const d = getDna();
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const ribs = f && f.positions ? Math.min(12, Math.max(5, f.positions.length)) : 0;
  // 1) 몸 윤곽: 형태 유전자로 배·목을 바꾸고, 진법 인원 수만큼 참외처럼 골을 낸다
  const belly = 1 + (d.belly || 0) * 0.8;
  const neck = 1 - Math.max(-0.4, Math.min(0.4, (d.neck || 0) * 0.25));
  let prof = [[0, 0], [0.5, 0], [0.62, 0.05], [0.86, 0.3], [1.04 * belly, 0.8], [1.02 * belly, 1.15], [0.86, 1.48], [0.56 * neck, 1.74], [0.46 * neck, 1.82], [0.5 * neck, 1.92], [0.48 * neck, 1.98], [0, 1.98]];
  prof = smoothProfile(prof, 6);
  const seg = 96;
  const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const pos = geo.attributes.position;
  if (ribs) {
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const zz = pos.getZ(i);
      const w = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (y - 0.1) / 1.5))));
      const a = Math.atan2(zz, x);
      const s = 1 - 0.045 * w * (1 - Math.cos(ribs * a)) / 2;
      pos.setX(i, x * s);
      pos.setZ(i, zz * s);
    }
  }
  geo.computeVertexNormals();
  const body = new THREE.MeshPhysicalMaterial({ color: 0x9cc4ae, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, body));
  // 2) 배에 두른 무늬 띠(세 폭)
  const j0 = Math.floor(prof.length * 0.3);
  const j1 = Math.floor(prof.length * 0.62);
  const band = new THREE.LatheGeometry(prof.slice(j0, j1 + 1).map(([x, y]) => new THREE.Vector2(x * 1.006, y)), seg);
  if (ribs) {
    const bp = band.attributes.position;
    for (let i = 0; i < bp.count; i += 1) {
      const x = bp.getX(i);
      const y = bp.getY(i);
      const zz = bp.getZ(i);
      const w = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (y - 0.1) / 1.5))));
      const a = Math.atan2(zz, x);
      const s = 1 - 0.045 * w * (1 - Math.cos(ribs * a)) / 2;
      bp.setX(i, x * s);
      bp.setZ(i, zz * s);
    }
    band.computeVertexNormals();
  }
  g.add(new THREE.Mesh(band, texMat(tex, { rough: 0.5, repeat: [3, 1] })));
  // 어깨 높이의 몸 반지름(부조를 붙일 자리)
  const yS = 1.12; // 배 위쪽(몸이 거의 곧게 서는 곳)에 붙인다
  const rAt = (y) => {
    for (let i = 1; i < prof.length; i += 1) {
      if (prof[i][1] >= y) {
        const [x0, y0] = prof[i - 1];
        const [x1, y1] = prof[i];
        return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
      }
    }
    return 0.5;
  };
  const rS = rAt(yS) * (ribs ? 0.985 : 1);
  const seal = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0x2f3330, roughness: 0.5 }); // 흑상감처럼 짙은 부조
  const place = (obj, ang, y, r) => {
    const hold = new THREE.Group();
    obj.position.z = 0;
    hold.add(obj);
    hold.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r);
    hold.rotation.order = 'YXZ';
    hold.rotation.y = ang;
    hold.rotation.x = -0.18; // 몸 기울기만큼 살짝 뒤로 눕혀 붙인다
    return hold;
  };
  // 3) 앞 어깨: 낙관(양각)
  if (by.print) g.add(place(sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.3, seal, 0.045), 0, yS + 0.05, rS - 0.03));
  // 4) 어깨 둘레: 놀이마다 흰 흙 상감처럼 도드라진 부조
  const games = gameCounts(log, attempts);
  games.forEach(([id, n], i) => {
    const ang = ((i + 1) / (games.length + 1)) * Math.PI * 2;
    const sz = 0.3 + Math.min(4, n) * 0.035;
    g.add(place(motifRelief(id, sz, white, 0.045), ang, yS, rS - 0.035));
  });
  // 5) 뚜껑과 꼭지: 한글 테트리스 블록
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.52 * neck, 0.5 * neck, 0.08, 64), body);
  lid.position.y = 2.02;
  g.add(lid);
  if (by.hangul) {
    // 쌓은 블록을 뚜껑 위에 눕혀 손잡이로 — 위에서 보면 그 블록 모양
    const k = blockKnob(by.hangul.formationId, 0.12, body);
    k.rotation.x = -Math.PI / 2;
    k.position.y = 2.06;
    const kb = new THREE.Box3().setFromObject(k);
    k.position.z -= (kb.min.z + kb.max.z) / 2;
    g.add(k);
  } else {
    g.add(mesh(new THREE.SphereGeometry(0.1, 24, 16), body, [0, 2.12, 0]));
  }
  g.position.y = -1.05;
  return group(g);
};

// ───── 나만의 배지 ─────
// 지름 약 32mm, 두께 3mm 풀컬러 출력 + 뒷면 금속 핀(진짜 부품).
// 진법 → 꽃잎 테두리와 둘레의 볼록 점(진 모양 그대로), 맞춘 글자 → 가운데 양각 낙관(없으면 가장 많이 한 놀이 부조),
// 한글 테트리스 → 아래쪽에 도드라진 자모.
export const mineBadge = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const d = getDna();
  const R = 1.0;
  const T = 0.18;
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const pts = (f && f.positions) || [];
  const lobes = pts.length ? Math.min(12, Math.max(5, pts.length)) : d.lobes || 8;
  const amp = (0.06 + (d.lobeAmp || 0.07) * 0.5) * senseFx(log).wave;
  const outline = new THREE.Shape();
  for (let i = 0; i <= 180; i += 1) {
    const a = (i / 180) * Math.PI * 2 + Math.PI / 2;
    const r = R * (1 + amp * Math.cos(lobes * (a - Math.PI / 2)));
    if (i === 0) outline.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else outline.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(outline, { depth: T, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 60 });
  geo.translate(0, 0, -T / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, [texMat(tex, { rough: 0.55 }), m.gold]));
  const z = T / 2 + 0.03;
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd1ad55, roughness: 0.45 });
  const seal = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.5 });
  // 둘레 금테
  const edge = (a) => R * (1 + amp * Math.cos(lobes * (a - Math.PI / 2)));
  const rim = bandRing((a) => edge(a) * 0.95, (a) => edge(a) * 0.87, 0.03, goldM);
  rim.position.z = T / 2 + 0.005;
  g.add(rim);
  // 진 모양 그대로 볼록 점(둘레 띠 위)
  holePositions(pts, R * 1.02).forEach(([x, y]) => g.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), goldM, [x * 1.05, y * 1.05, z])));
  // 가운데 원판 + 낙관(양각) 또는 놀이 부조
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.03, 64), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.7 }));
  disc.rotation.x = Math.PI / 2;
  disc.position.z = z;
  g.add(disc);
  const games = gameCounts(log, attempts);
  if (by.print) {
    const sr = sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.66, seal, 0.05);
    sr.position.z = z + 0.015;
    g.add(sr);
  } else if (games.length) {
    const mr = motifRelief(games[0][0], 0.76, seal, 0.05);
    mr.position.z = z + 0.015;
    g.add(mr);
  }
  if (by.hangul) {
    const ch = glyphGeo(HANGUL_GLYPH[by.hangul.formationId] || 'ㅏ', 0.2, 0.05);
    if (ch) g.add(mesh(ch, goldM, [0, -0.7, z - 0.01]));
  }
  // 뒷면 핀(쇠 부품 — 출력하지 않는다)
  const pin = new THREE.Group();
  pin.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.03), m.silver, [0, 0.1, 0]));
  pin.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), m.silver, [-0.45, 0.1, -0.01], [Math.PI / 2, 0, 0]));
  pin.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), m.silver, [0.42, 0.1, -0.01], [Math.PI / 2, 0, 0]));
  pin.position.z = -T / 2 - 0.05;
  pin.userData.real = 'metal';
  g.add(pin);
  return g;
};

// ───── 나만의 수막새 ─────
// 신라 수막새(기와 끝 둥근 막새)의 짜임: 바깥 둘레 띠(주연)와 구슬 무늬(연주문), 연꽃잎, 가운데 연밥.
// 지름 약 45mm 회흑색 기와빛으로 출력하고 뒷면에 자석(진짜 부품)을 붙인다 — 냉장고 자석·장식판으로 쓴다.
//   진법 → 연꽃잎 수, 놀이 횟수 합 → 연밥 씨앗 수(맞춘 글자가 있으면 연밥 자리에 양각 글자),
//   전래놀이 가짓수·한글 테트리스 블록 → 둘레 구슬 수
export const mineSumak = ({ m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const petals = f && f.positions ? Math.min(12, Math.max(6, f.positions.length)) : 8;
  const games = gameCounts(log, attempts);
  const plays = games.reduce((s, [, n]) => s + n, 0);
  const blocks = by.hangul ? (BLOCKS[by.hangul.formationId] || BLOCKS.st1).length : 0;
  const beads = 16 + games.length * 2 + blocks * 2 + senseFx(log).extra;
  const clay = new THREE.MeshStandardMaterial({ color: 0x5d6062, roughness: 0.85 });
  const clayLight = new THREE.MeshStandardMaterial({ color: 0x7c8082, roughness: 0.8 });
  const g = new THREE.Group();
  const R = 1.0;
  const T = 0.22;
  g.add(mesh(new THREE.CylinderGeometry(R, R, T, 96), clay, [0, 0, 0], [Math.PI / 2, 0, 0]));
  const zf = T / 2;
  // 주연(바깥 둘레 띠)
  g.add(mesh(new THREE.TorusGeometry(0.93, 0.07, 12, 96), clayLight, [0, 0, zf]));
  g.add(mesh(new THREE.TorusGeometry(0.7, 0.03, 10, 96), clayLight, [0, 0, zf]));
  // 연주문(구슬)
  for (let i = 0; i < beads; i += 1) {
    const a = (i / beads) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.045, 14, 10), clayLight, [Math.cos(a) * 0.81, Math.sin(a) * 0.81, zf + 0.01]));
  }
  // 연꽃잎: 볼록한 잎 + 잎 가운데 능선
  for (let i = 0; i < petals; i += 1) {
    const a = (i / petals) * Math.PI * 2 + Math.PI / 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 14), clayLight);
    leaf.scale.set(0.55, 1, 0.28);
    leaf.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46, zf + 0.01);
    leaf.rotation.z = a - Math.PI / 2;
    g.add(leaf);
  }
  // 연밥(가운데)
  g.add(mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 48), clayLight, [0, 0, zf + 0.03], [Math.PI / 2, 0, 0]));
  if (by.print) {
    const sr = sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.34, clay, 0.04);
    sr.position.z = zf + 0.06;
    g.add(sr);
  } else {
    const n = Math.max(1, Math.min(12, plays || 1));
    for (let i = 0; i < n; i += 1) {
      const r = i === 0 ? 0 : i < 7 ? 0.11 : 0.18;
      const k = i === 0 ? 0 : i < 7 ? i - 1 : i - 7;
      const cnt = i < 7 ? 6 : 6;
      const a = (k / cnt) * Math.PI * 2 + (i >= 7 ? Math.PI / 6 : 0);
      g.add(mesh(new THREE.SphereGeometry(0.035, 12, 10), clay, [Math.cos(a) * r, Math.sin(a) * r, zf + 0.07]));
    }
  }
  // 뒷면 자석(진짜 부품)
  const mag = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32), m.iron, [0, 0, -T / 2 - 0.025], [Math.PI / 2, 0, 0]);
  mag.userData.real = 'metal';
  g.add(mag);
  return g;
};

// ───── 나만의 낙관 도장 ─────
// 진짜 찍히는 도장: 도장면에 맞춘 글자를 거꾸로(좌우 반전) 도드라지게 새긴다. 글자가 없으면 한글 테트리스 자모,
// 그것도 없으면 가장 많이 한 놀이 무늬를 새긴다. 몸통 옆면은 조각보 바탕, 손잡이는 한글 테트리스 블록(없으면
// 진법 인원 수만큼 꽃잎이 진 둥근 손잡이). 크기 약 2×2×4cm, 풀컬러 3D 출력. 화면은 도장면이 보이게 눕혀 보여 준다.
export const mineStamp = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const W = 1.0;
  const H = 1.7;
  const g = new THREE.Group();
  const side = texMat(tex, { rough: 0.6 });
  const ink = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.55, side: THREE.DoubleSide });
  // 도장면 바탕은 돌 색, 새긴 글자·테두리만 인주 빛 — 찍히는 부분이 한눈에 보인다
  const stoneFace = new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), [side, side, m.gold, stoneFace, side, side]);
  body.position.y = H / 2;
  g.add(body);
  // 도장면(아래): 테두리 + 거꾸로 새긴 글자
  const face = new THREE.Group();
  const bar = 0.08;
  [[0, W / 2 - bar / 2, W - 0.04, bar], [0, -W / 2 + bar / 2, W - 0.04, bar], [W / 2 - bar / 2, 0, bar, W - 0.04], [-W / 2 + bar / 2, 0, bar, W - 0.04]].forEach(([x, y, w, h]) =>
    face.add(mesh(new THREE.BoxGeometry(w, h, 0.08), ink, [x, y, 0.04]))
  );
  const inner = W - bar * 2.8;
  const word = by.print ? PRINT_WORD[by.print.formationId] || '글' : null;
  if (word) {
    const chars = Array.from(word);
    const cols = chars.length > 2 ? 2 : 1;
    const rows = Math.ceil(chars.length / cols);
    const cell = inner / Math.max(rows, cols);
    chars.forEach((ch, i) => {
      const col = cols === 1 ? 0 : cols - 1 - Math.floor(i / rows);
      const row = cols === 1 ? i : i % rows;
      const geo = glyphGeo(ch, cell * 0.9, 0.08);
      if (!geo) return;
      const x = cols === 1 ? 0 : -inner / 2 + cell * (col + 0.5);
      const y = inner / 2 - (inner / rows) * (row + 0.5);
      face.add(mesh(geo, ink, [x, y, 0]));
    });
  } else if (by.hangul) {
    const geo = glyphGeo(HANGUL_GLYPH[by.hangul.formationId] || 'ㅏ', inner * 0.8, 0.08);
    if (geo) face.add(mesh(geo, ink, [0, 0, 0]));
  } else {
    const games = gameCounts(log, attempts);
    face.add(motifRelief(games.length ? games[0][0] : 'ddakji', inner * 0.9, ink, 0.08));
  }
  // 찍으면 바로 읽히도록 좌우를 뒤집어 새긴다
  face.scale.x = -1;
  face.rotation.x = Math.PI / 2;
  face.position.y = 0;
  g.add(face);
  // 손잡이
  if (by.hangul) {
    const k = blockKnob(by.hangul.formationId, 0.26, m.gold);
    k.position.y = H;
    g.add(k);
  } else {
    const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
    const lobes = f && f.positions ? Math.min(12, Math.max(5, f.positions.length)) : 6;
    const sh = new THREE.Shape();
    for (let i = 0; i <= 120; i += 1) {
      const a = (i / 120) * Math.PI * 2;
      const r = 0.36 * (1 + 0.12 * senseFx(log).wave * Math.cos(lobes * a));
      if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const knob = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 }), m.gold);
    knob.rotation.x = -Math.PI / 2;
    knob.position.y = H;
    g.add(knob);
  }
  // 도장면이 보이도록 앞으로 눕힌다
  const hold = new THREE.Group();
  hold.add(g);
  g.position.y = -H / 2;
  hold.rotation.x = -1.5;
  return wrap(hold);
};

// ───── 나만의 책갈피 ─────
// 얇은 황동 판(0.5mm, 약 3×12cm)을 부식·레이저로 잘라 만드는 책갈피 — 3D 출력이 아니라 금속 가공이다.
// 윗머리: 진법 인원 수만큼 물결진 꽃잎 머리. 몸통: 진 모양(사람 자리)을 위에서 아래로 늘어놓은 투각 구멍,
// 놀이 가짓수만큼 가로 마디(부식선). 흥(몸짓)이 클수록 머리 물결이 깊어진다. 맨 위 구멍에 진짜 술을 단다.
// 글자는 새기지 않는다(뜻 없는 단어가 들어가지 않게).
export const mineBookmark = ({ m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const fx = senseFx(log);
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const pts = (f && f.positions) || [];
  const lobes = pts.length ? Math.min(9, Math.max(3, Math.round(pts.length / 2))) : 5;
  const games = gameCounts(log, attempts);
  const W = 0.62;
  const H = 2.5;
  const top = H / 2;
  const bot = -H / 2;
  const r = 0.06;
  const sh = new THREE.Shape();
  // 아래 둥근 모서리부터 시계 반대 방향
  sh.moveTo(-W / 2 + r, bot);
  sh.lineTo(W / 2 - r, bot);
  sh.quadraticCurveTo(W / 2, bot, W / 2, bot + r);
  sh.lineTo(W / 2, top - 0.22);
  // 머리: 물결진 꽃잎 가장자리(좌우로 W 폭)
  const N = 90;
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const x = W / 2 - t * W;
    const wave = Math.abs(Math.sin(t * Math.PI * lobes));
    const y = top - 0.22 + 0.1 + Math.sin(t * Math.PI) * 0.12 + wave * 0.07 * fx.wave;
    sh.lineTo(x, y);
  }
  sh.lineTo(-W / 2, bot + r);
  sh.quadraticCurveTo(-W / 2, bot, -W / 2 + r, bot);
  // 술 구멍
  const hole = new THREE.Path();
  hole.absarc(0, top - 0.1, 0.055, 0, Math.PI * 2, true); // 위 가장자리와 2mm 넘게 띄운다(얇으면 부식 때 끊어짐)
  sh.holes.push(hole);
  // 진 모양 투각: 사람 자리를 몸통 안 세로 칸(폭 W*0.6, 높이 H*0.55)에 맞춰 뚫는다
  if (pts.length) {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => -p.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const bw = W * 0.56;
    const bh = H * 0.5;
    const placed = [];
    pts.forEach((p) => {
      const px = p.x;
      const py = -p.y;
      const hx = x1 > x0 ? ((px - x0) / (x1 - x0) - 0.5) * bw : 0;
      const hy = (y1 > y0 ? ((py - y0) / (y1 - y0) - 0.5) * bh : 0) + 0.12;
      if (placed.every(([qx, qy]) => Math.hypot(qx - hx, qy - hy) > 0.11)) placed.push([hx, hy]);
    });
    placed.slice(0, 14).forEach(([hx, hy]) => {
      const hp = new THREE.Path();
      hp.absarc(hx, hy, 0.035, 0, Math.PI * 2, true);
      sh.holes.push(hp);
    });
  }
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a04a, roughness: 0.28, metalness: 0.95, side: THREE.DoubleSide });
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 24 }), brass);
  const g = new THREE.Group();
  g.add(plate);
  // 부식선: 테두리 안쪽 선 + 놀이 가짓수만큼 아래쪽 가로 마디(짙게 삭은 금속 색)
  const etch = new THREE.MeshStandardMaterial({ color: 0x6b5220, roughness: 0.6, metalness: 0.5 });
  etch.userData.fixed = true; // 부식(새김) 자리는 어떤 쇠를 골라도 짙게 삭은 빛으로 남는다
  const z = 0.0255;
  const inW = W - 0.1;
  const inTop = top - 0.2;
  const inBot = bot + 0.05;
  const LW = 0.016; // 새김선 폭: 실물 약 0.77mm(에칭 최소 0.7mm 이상)
  const etchRects = [[0, inBot, inW, LW], [-inW / 2, (inTop + inBot) / 2, LW, inTop - inBot], [inW / 2, (inTop + inBot) / 2, LW, inTop - inBot]];
  const n = Math.max(1, Math.min(6, games.length || 1));
  for (let i = 0; i < n; i += 1) etchRects.push([0, bot + 0.18 + i * 0.09, inW * 0.7, LW]);
  etchRects.forEach(([x, y, w, h]) => g.add(mesh(new THREE.BoxGeometry(w, h, 0.002), etch, [x, y, z])));
  // 에칭 도안(2D): 자르는 윤곽·구멍과 새김 칸을 그대로 넘긴다 — 출력용 파일을 만들 때 .svg(mm)로 함께 나온다
  g.userData.plan2d = {
    mmPerUnit: 30 / W,
    outline: sh.getPoints(24).map((p) => [p.x, p.y]),
    holes: sh.holes.map((hp) => hp.getPoints(24).map((p) => [p.x, p.y])),
    etch: etchRects,
  };
  // 맨 위 구멍의 진짜 술(고리 → 매듭 → 술)
  const cord = new THREE.Group();
  // 구멍에서 위로 올라 고리를 만든 뒤 옆으로 늘어진다(실처럼 아래로 처지게)
  const sx = W / 2 + 0.16;
  cord.add(tube([[0, top - 0.1, 0.012], [0.04, top + 0.16, 0.02], [0.2, top + 0.24, 0.02], [sx - 0.03, top + 0.12, 0.01], [sx, top - 0.08, 0]], 0.016, m.silkRed, 24));
  const ts = tassel(0.75, 0.2, m.silkRed, m.gold, 22);
  ts.position.set(sx, top - 0.08, 0);
  cord.add(ts);
  cord.userData.real = 'thread';
  g.add(cord);
  g.rotation.z = -0.18;
  g.rotation.y = 0.35;
  const w = wrap(g);
  w.userData.deform = 0; // 황동 판은 정해진 크기(30×120mm)로 자른다 — 모양은 꽃잎 수·물결·투각·마디로 달라진다
  return w;
};

// ───── 나만의 문진 ─────
// 책상에 두는 비석 모양 문진(높이 약 7cm, 풀컬러 3D 출력). 받침돌 층수 = 마친 판 수,
// 비신 앞면 = 맞춘 글자 낙관과 놀이 부조, 머릿돌(이수) 위 = 한글 테트리스 블록 또는 진법 꽃잎 구슬.
export const mineStele = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const stone = new THREE.MeshStandardMaterial({ color: 0x8d8f8a, roughness: 0.85 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x6f716c, roughness: 0.85 });
  const g = new THREE.Group();
  const tiers = Math.max(1, Math.min(4, (attempts || []).length));
  let y = 0;
  for (let i = 0; i < tiers; i += 1) {
    const w = 1.5 - i * 0.12;
    const h = 0.16;
    g.add(mesh(new THREE.BoxGeometry(w, h, w * 0.62), i % 2 ? stoneDark : stone, [0, y + h / 2, 0]));
    y += h;
  }
  const bw = 0.9;
  const bh = 1.6;
  const bd = 0.28;
  const face = texMat(tex, { rough: 0.7 });
  const slabBody = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [stone, stone, stone, stone, face, stone]);
  slabBody.position.y = y + bh / 2;
  g.add(slabBody);
  const zf = bd / 2 + 0.005;
  const seal = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2f3330, roughness: 0.55 });
  if (by.print) {
    const sr = sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.32, seal, 0.04);
    sr.position.set(0, y + bh * 0.68, zf);
    g.add(sr);
  }
  const games = gameCounts(log, attempts);
  games.slice(0, 3).forEach(([id, n], i) => {
    const sz = 0.22 + Math.min(4, n) * 0.025;
    const mr = motifRelief(id, sz, dark, 0.04);
    const cols = Math.min(3, games.length);
    mr.position.set((i - (cols - 1) / 2) * 0.28, y + bh * 0.25, zf);
    g.add(mr);
  });
  // 머릿돌(이수): 둥근 지붕
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, bd + 0.08, 48, 1, false, 0, Math.PI), stoneDark);
  cap.rotation.z = Math.PI / 2;
  cap.rotation.y = Math.PI / 2;
  cap.position.y = y + bh;
  g.add(cap);
  if (by.hangul) {
    const k = blockKnob(by.hangul.formationId, 0.16, stone);
    k.position.y = y + bh + 0.48;
    g.add(k);
  } else {
    g.add(mesh(new THREE.SphereGeometry(0.12, 20, 14), stone, [0, y + bh + 0.58, 0]));
  }
  g.position.y = -1.2;
  return g;
};

// ───── 나만의 코스터 ─────
// 지름 약 9cm, 두께 4mm 풀컬러 출력. 컵이 놓이는 가운데는 평평하게(무늬는 색으로만 인쇄),
// 둘레 테만 내 놀이로 빚는다: 진법 → 꽃잎 테두리, 놀이 가짓수·블록 → 테 위 구슬, 맞춘 글자 → 테의 낙관.
// 컵 바깥 바닥만 닿으므로 음식이 직접 닿지 않는다.
export const mineCoaster = ({ tex, m }) => {
  const { attempts, log } = rec();
  const by = byScene(attempts);
  const f = by.jinbeop ? FORMATIONS.find((q) => q.id === by.jinbeop.formationId) : null;
  const lobes = f && f.positions ? Math.min(12, Math.max(6, f.positions.length)) : 8;
  const games = gameCounts(log, attempts);
  const blocks = by.hangul ? (BLOCKS[by.hangul.formationId] || BLOCKS.st1).length : 0;
  const fx = senseFx(log);
  const R = 1.0;
  const T = 0.09;
  const sh = new THREE.Shape();
  for (let i = 0; i <= 200; i += 1) {
    const a = (i / 200) * Math.PI * 2;
    const r = R * (1 + 0.045 * fx.wave * Math.cos(lobes * a));
    if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  // 윗면(뚜껑 면)에 무늬를 바로 인쇄한다 — 따로 붙인 판이 아니라 코스터 몸체의 윗면 자체가 풀컬러 출력면이다
  const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 80 });
  const uv = geo.attributes.uv;
  const RR = R * 1.06;
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, (uv.getX(i) + RR) / (2 * RR), (uv.getY(i) + RR) / (2 * RR));
  uv.needsUpdate = true;
  const base = new THREE.Mesh(geo, [texMat(tex, { rough: 0.55 }), m.woodDark]);
  const g = new THREE.Group();
  g.add(base);
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd1ad55, roughness: 0.45 });
  const band = bandRing(() => 0.72, () => 0.66, 0.025, goldM);
  band.position.z = T + 0.012;
  g.add(band);
  const beads = 12 + games.length * 2 + blocks * 2 + fx.extra;
  for (let i = 0; i < beads; i += 1) {
    const a = (i / beads) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.035, 12, 10), goldM, [Math.cos(a) * 0.84, Math.sin(a) * 0.84, T + 0.03]));
  }
  if (by.print) {
    const sr = sealRelief(PRINT_WORD[by.print.formationId] || '글', 0.2, new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.5 }), 0.03);
    sr.position.set(0, -0.84, T + 0.02);
    g.add(sr);
  }
  g.rotation.x = -0.9;
  return wrap(g);
};

// ───── 도자기 잔·수저받침(전사 인쇄) ─────
// 음식·입이 닿는 물건이라 출력하지 않는다. 모양은 정해진 백자이고, 내 무늬 띠와 낙관을 전사지로 구워 입힌다.
function sealDecal(word, size) {
  const g = new THREE.Group();
  if (!word) return g;
  const red = new THREE.MeshStandardMaterial({ color: 0xb8312a, roughness: 0.35 });
  const chars = Array.from(word);
  g.add(mesh(new THREE.PlaneGeometry(size, size * (chars.length > 2 ? 1 : chars.length === 1 ? 1 : 1.6)), red));
  const white = new THREE.MeshStandardMaterial({ color: 0xf6efe0, roughness: 0.4 });
  chars.slice(0, 2).forEach((ch, i) => {
    const geo = glyphGeo(ch, size * 0.62, 0.001);
    if (geo) g.add(mesh(geo, white, [0, chars.length === 1 ? 0 : (0.5 - i) * size * 0.72, 0.002]));
  });
  return g;
}
export const ceramicCup = ({ tex, m }) => {
  const { attempts } = rec();
  const by = byScene(attempts);
  const prof = [[0, 0], [0.42, 0], [0.46, 0.04], [0.5, 0.12], [0.62, 0.5], [0.72, 0.95], [0.74, 1.0], [0.7, 1.0], [0.68, 0.96], [0.58, 0.5], [0.4, 0.14], [0, 0.14]];
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72), m.porcelain));
  const band = new THREE.LatheGeometry([[0.635, 0.55], [0.68, 0.75], [0.712, 0.9]].map(([x, y]) => new THREE.Vector2(x * 1.008, y)), 72);
  g.add(new THREE.Mesh(band, texMat(tex, { rough: 0.35, repeat: [4, 1] })));
  const word = by.print ? PRINT_WORD[by.print.formationId] || '글' : null;
  const d = sealDecal(word, 0.16);
  d.position.set(0, 0.32, 0.555);
  d.rotation.x = -0.25;
  g.add(d);
  g.position.y = -0.5;
  return g;
};
export const ceramicSpoonRest = ({ tex, m }) => {
  const { attempts } = rec();
  const by = byScene(attempts);
  const g = new THREE.Group();
  const body = rbox(1.4, 0.22, 0.5, m.porcelain, 0.1);
  g.add(body);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), texMat(tex, { rough: 0.35 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.112;
  g.add(top);
  const word = by.print ? PRINT_WORD[by.print.formationId] || '글' : null;
  const d = sealDecal(word, 0.12);
  d.position.set(0.55, 0, 0.252);
  g.add(d);
  g.rotation.x = 0.5;
  return wrap(g);
};
