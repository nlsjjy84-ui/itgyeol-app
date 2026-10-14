import React, { useContext } from 'react';
import { View } from 'react-native';
import Svg, { G, Rect, Circle, Line, Path, Text as SvgText, ClipPath, Defs, Polyline, LinearGradient, Stop } from 'react-native-svg';
import { FORMATIONS } from '../data/formations';
import { motifLines } from '../data/motifs';
import { fonts } from '../theme';
import { JourneyContext } from '../context/JourneyContext';

// 조각보 — 판 하나를 마칠 때마다 비단 조각 한 장이 생기고, 그 조각들을 이어 한 장의 보자기가 된다.
// 실제 조각보처럼 만든다: 가운데 판을 두고 둘레에 띠 조각을 덧대는 '회문(回文)' 짜임,
// 조각마다 다른 비단 색, 솔기를 따라 감침질 땀, 가운데에는 판마다 다른 수(繡) 무늬.
//   진법 → 진 모양대로 놓은 매듭 땀과 그 사이를 잇는 금실
//   훈민정음·인쇄 → 맞춘 글자를 새긴 낙관(붉은 도장)
//   전래놀이 → 그 놀이를 수놓은 둥근 단화(방패연·팽이·새끼줄…)
//   한글 테트리스 → 네 조각을 이은 블록 위에 금실로 놓은 자모
// 아직 안 한 판의 자리는 물들이지 않은 생모시로 남겨, 다음 조각이 붙을 곳을 보여 준다.
// 같은 시드면 항상 같은 모양이 나온다(재현 가능). 색은 화면 테마와 상관없이 늘 같은 비단 색이다.
// 같은 판에서 서로 다른 문제를 많이 풀수록 조각이 정교해진다.
//   1단계 비단 조각 → 2단계 홈질 테두리와 모서리 매듭 → 3단계 금박 테두리
//   전체 완성도가 50%를 넘으면 빈 띠에 꽃수가 놓이고, 60%에 금실 단, 100%에 이중 금실 단이 둘러진다.

// 전통 비단 색 (화면 테마와 무관하게 고정)
const SILK = {
  jjok: '#2d4a73', // 쪽빛
  gamcheong: '#1f3354', // 감청
  ok: '#8fbfb2', // 옥색
  cheongnok: '#2e7566', // 청록
  yeondu: '#a7bf63', // 연두
  songhwa: '#e3c65a', // 송화색
  chija: '#d29a35', // 치자색
  dahong: '#c3372c', // 다홍
  yeonji: '#a92f4c', // 연지
  bunhong: '#e3a2a1', // 분홍
  jaju: '#6b2d50', // 자주
  bora: '#76598a', // 보라
  meok: '#2a292d', // 먹
  misaek: '#efe3c8', // 미색
  eunhoe: '#c9c8bf', // 은회
  gal: '#8a5a3a', // 갈색
};
const RAMIE = '#e7dcc1'; // 생모시(물들이지 않은 천)
const GOLD = '#d1ad55'; // 금실
const GOLD_DEEP = '#a8822f';
const THREAD_LIGHT = '#f7efdc';
const SEAL = '#b8312a';

// 오행마다 어울리는 비단 색 묶음 — 첫 색이 가운데 판, 나머지가 둘레 띠
const FAMILY = {
  mok: ['cheongnok', 'yeondu', 'songhwa', 'ok', 'jaju'],
  hwa: ['dahong', 'bunhong', 'chija', 'yeonji', 'jjok'],
  to: ['chija', 'songhwa', 'gal', 'misaek', 'cheongnok'],
  geum: ['misaek', 'eunhoe', 'ok', 'bunhong', 'jjok'],
  su: ['jjok', 'ok', 'gamcheong', 'misaek', 'dahong'],
};
const FAMILY_KEYS = Object.keys(FAMILY);
const LIGHT_SILK = new Set(['misaek', 'eunhoe', 'songhwa', 'ok', 'bunhong', 'yeondu']);

// 한글 테트리스 단계 → 창살 가운데 새기는 자모(자음·모음)
const HANGUL_GLYPH = { st1: 'ㅣ', st2: 'ㅏ', st3: 'ㅁ', st4: 'ㄷ' };
const PRINT_WORD = {
  'jamo-sogo': '소고',
  'jamo-binyeo': '비녀',
  'jamo-bomul': '보물',
  'jamo-pungmulnori': '풍물',
  'jamo-munhwajae': '문화',
  'jamo-hangeulnal': '한글',
  metaltype: '직지',
  woodblock: '경판',
  mirror: '거울',
  sentence: '서문',
  shape: '꼴',
};

export const SCENE_ORDER = ['jinbeop', 'print', 'tbd', 'hangul'];

// 220×220 판 위에서 각 조각이 놓이는 자리
const BOXES = {
  jinbeop: { x: 0, y: 0, w: 120, h: 90 },
  print: { x: 120, y: 0, w: 100, h: 120 },
  tbd: { x: 0, y: 90, w: 120, h: 90 },
  hangul: { x: 120, y: 120, w: 100, h: 60 },
};
const FILLERS = [
  { x: 0, y: 180, w: 120, h: 40 },
  { x: 120, y: 180, w: 100, h: 40 },
];

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function familyOf(key, seed) {
  if (FAMILY[key]) return FAMILY[key];
  return FAMILY[FAMILY_KEYS[(seed >>> 3) % FAMILY_KEYS.length]];
}

// 솔기 땀의 색 — 밝은 비단에는 짙은 실, 짙은 비단에는 밝은 실
function threadOn(silkName) {
  return LIGHT_SILK.has(silkName) ? 'rgba(60,40,30,0.55)' : 'rgba(250,240,220,0.75)';
}

// 비단 조각 한 장: 바탕 + 결(가는 빛줄) + 솔기 + 감침질 땀
function SilkPiece({ r, name, k }) {
  const fill = SILK[name] || RAMIE;
  const sheen = [];
  const n = Math.max(2, Math.round(Math.min(r.w, r.h) / 14));
  for (let i = 1; i < n; i += 1) {
    const yy = r.y + (r.h * i) / n;
    sheen.push(<Line key={i} x1={r.x + 1} y1={yy} x2={r.x + r.w - 1} y2={yy} stroke="#ffffff" strokeWidth={0.5} opacity={0.07} />);
  }
  const ins = 2.6;
  return (
    <G key={k}>
      <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill={fill} />
      <Rect x={r.x} y={r.y} width={r.w} height={Math.min(4, r.h / 4)} fill="#ffffff" opacity={0.08} />
      {sheen}
      <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="rgba(20,15,10,0.45)" strokeWidth={0.9} />
      {r.w > 10 && r.h > 10 ? (
        <Rect
          x={r.x + ins}
          y={r.y + ins}
          width={r.w - ins * 2}
          height={r.h - ins * 2}
          fill="none"
          stroke={threadOn(name)}
          strokeWidth={0.7}
          strokeDasharray="1.4 2.2"
        />
      ) : null}
    </G>
  );
}

// 회문 짜임: 가운데 판 + 둘레 띠 네 개(긴 띠는 한 번 더 나눈다)
function cutPieces(box, seed) {
  const r = rng(seed ^ 0x5bd1e995);
  const { x, y, w, h } = box;
  const m = Math.max(8, Math.min(w, h) * (0.13 + r() * 0.08));
  const c = { x: x + m, y: y + m, w: w - m * 2, h: h - m * 2 };
  const ring = [];
  const topFull = r() < 0.5; // 위·아래 띠가 모서리까지 덮는지, 옆 띠가 덮는지
  if (topFull) {
    ring.push({ x, y, w, h: m }, { x, y: y + h - m, w, h: m });
    ring.push({ x, y: y + m, w: m, h: h - m * 2 }, { x: x + w - m, y: y + m, w: m, h: h - m * 2 });
  } else {
    ring.push({ x: x + m, y, w: w - m * 2, h: m }, { x: x + m, y: y + h - m, w: w - m * 2, h: m });
    ring.push({ x, y, w: m, h }, { x: x + w - m, y, w: m, h });
  }
  const out = [];
  ring.forEach((p) => {
    const long = Math.max(p.w, p.h);
    if (long > 70 && r() < 0.8) {
      const t = 0.32 + r() * 0.36;
      if (p.w > p.h) out.push({ x: p.x, y: p.y, w: p.w * t, h: p.h }, { x: p.x + p.w * t, y: p.y, w: p.w * (1 - t), h: p.h });
      else out.push({ x: p.x, y: p.y, w: p.w, h: p.h * t }, { x: p.x, y: p.y + p.h * t, w: p.w, h: p.h * (1 - t) });
    } else out.push(p);
  });
  return { center: c, ring: out, rand: r };
}

// 전래놀이 수 무늬 — 놀이 기호가 아니라 놀이와 짝지은 전통 문양(덩굴·나비·태극·구름 등)을 실로 놓은 선으로 그린다.
// 선 자료는 src/data/motifs.js 하나를 3D 부조와 함께 쓴다(위가 +y라 화면에서는 뒤집는다).
function playMotif(id, cx, cy, s, col) {
  const sw = Math.max(1.2, s * 0.06);
  const d = motifLines(id)
    .filter((l) => l.length > 1)
    .map((l) => l.map(([x, y], i) => `${i ? 'L' : 'M'}${(cx + x * s).toFixed(1)} ${(cy - y * s).toFixed(1)}`).join(' '))
    .join(' ');
  return <Path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
}

// 단화(둥근 수 무늬) 바탕: 짙은 원판 + 금실 테 + 둘레 꽃땀
function Medallion({ cx, cy, r, ground, children }) {
  const dots = [];
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    dots.push(<Circle key={i} cx={cx + Math.cos(a) * (r + 3.2)} cy={cy + Math.sin(a) * (r + 3.2)} r={1.1} fill={GOLD} />);
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ground} />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth={1.4} />
      <Circle cx={cx} cy={cy} r={r - 3} fill="none" stroke={GOLD} strokeWidth={0.5} opacity={0.7} />
      {dots}
      {children}
    </G>
  );
}

// 매듭 땀(작은 네 잎 매듭)
function KnotStitch({ x, y, r, col }) {
  return (
    <G>
      {[0, 1, 2, 3].map((i) => (
        <Circle key={i} cx={x + Math.cos((i * Math.PI) / 2 + Math.PI / 4) * r * 0.55} cy={y + Math.sin((i * Math.PI) / 2 + Math.PI / 4) * r * 0.55} r={r * 0.5} fill={col} />
      ))}
      <Circle cx={x} cy={y} r={r * 0.35} fill={THREAD_LIGHT} />
    </G>
  );
}

// 다섯 잎 꽃수
function FlowerStitch({ x, y, r, petal, heart }) {
  return (
    <G>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <Circle key={i} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.42} fill={petal} />;
      })}
      <Circle cx={x} cy={y} r={r * 0.32} fill={heart} />
    </G>
  );
}

// 조각 하나(비단 조각들 + 가운데 수 무늬)를 그린다. box는 그려질 자리.
export function PatchArt({ attempt, box, empty = false, level = 1, plain = false }) {
  const { x, y, w, h } = box;
  if (empty || !attempt) {
    const lines = [];
    for (let i = 1; i < 6; i += 1) {
      lines.push(<Line key={i} x1={x + 2} y1={y + (h * i) / 6} x2={x + w - 2} y2={y + (h * i) / 6} stroke="#b9ab8a" strokeWidth={0.4} opacity={0.45} />);
    }
    return (
      <G>
        <Rect x={x} y={y} width={w} height={h} fill={RAMIE} />
        {lines}
        <Rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="none" stroke="#9c8d6c" strokeWidth={1} strokeDasharray="3 3" />
        {[0, 1, 2].map((i) => (
          <Circle key={i} cx={x + w / 2 - 8 + i * 8} cy={y + h / 2} r={1.7} fill="#9c8d6c" />
        ))}
      </G>
    );
  }
  const seed = (attempt.seed || 1) >>> 0;
  const fam = familyOf(attempt.ohangKey, seed);
  const { center: c, ring, rand } = cutPieces(box, seed);
  const out = [];
  // 둘레 띠: 같은 색이 나란히 붙지 않게 돌려 가며
  const off = Math.floor(rand() * 4);
  ring.forEach((p, i) => {
    const name = fam[1 + ((i + off) % (fam.length - 1))];
    out.push(<SilkPiece key={`r${i}`} k={`r${i}`} r={p} name={name} />);
  });
  // 낙관은 미색 바탕 위에 찍어야 서화처럼 보인다
  const centerName = attempt.sceneId === 'print' ? 'misaek' : fam[0];
  out.push(<SilkPiece key="c" k="c" r={c} name={centerName} />);
  // 바탕만(plain): 수 무늬는 그리지 않는다 — 나만의 패·항아리는 무늬가 그림이 아니라 입체(투각·양각·부조)로 들어간다
  if (plain) return <G>{out}</G>;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const s = Math.min(c.w, c.h);
  const tilt = Math.floor(rand() * 7) - 3;
  const lightCenter = LIGHT_SILK.has(centerName);
  const thread = lightCenter ? GOLD_DEEP : GOLD;

  if (attempt.sceneId === 'jinbeop') {
    const f = FORMATIONS.find((q) => q.id === attempt.formationId);
    const pts = (f && f.positions) || [];
    const px = pts.map((p) => [c.x + 7 + p.x * (c.w - 14), c.y + 6 + p.y * (c.h - 12)]);
    if (px.length > 1) {
      out.push(<Polyline key="line" points={px.map((p) => p.join(',')).join(' ')} fill="none" stroke={thread} strokeWidth={1.1} strokeDasharray="2 1.6" />);
    }
    const kr = Math.max(2.4, Math.min(4.2, s / (px.length > 10 ? 12 : 9)));
    px.forEach(([qx, qy], i) => out.push(<KnotStitch key={`d${i}`} x={qx} y={qy} r={kr} col={lightCenter ? SILK.dahong : THREAD_LIGHT} />));
  } else if (attempt.sceneId === 'print') {
    const word = PRINT_WORD[attempt.formationId] || '글';
    const chars = Array.from(word);
    const sz = s * 0.48; // 낙관은 작고 단정하게
    const cols = chars.length > 2 ? 2 : 1;
    const rows = Math.ceil(chars.length / cols);
    const cell = (sz - 8) / Math.max(rows, cols);
    const fs = cell * 0.86;
    out.push(
      <G key="seal" rotation={tilt} origin={`${cx}, ${cy}`}>
        <Rect x={cx - sz / 2} y={cy - sz / 2} width={sz} height={sz} rx={1.5} fill={SEAL} />
        <Rect x={cx - sz / 2 + 2.5} y={cy - sz / 2 + 2.5} width={sz - 5} height={sz - 5} fill="none" stroke={SILK.misaek} strokeWidth={1.3} />
        {chars.map((ch, i) => {
          // 낙관 글자는 오른쪽 줄부터 위에서 아래로 읽는다
          const col = cols === 1 ? 0 : cols - 1 - Math.floor(i / rows);
          const row = cols === 1 ? i : i % rows;
          const gx = cols === 1 ? cx : cx - sz / 2 + 4 + cell * (col + 0.5);
          const gy = cy - sz / 2 + 4 + ((sz - 8) / rows) * (row + 0.5) + fs * 0.34;
          return (
            <SvgText key={i} x={gx} y={gy} fontSize={fs} fontFamily={fonts.serifHeavy} fill={SILK.misaek} textAnchor="middle">
              {ch}
            </SvgText>
          );
        })}
      </G>
    );
    // 낙관 옆 세로 먹 글씨 줄(제발) 흉내 — 가는 먹선 두 줄
    out.push(<Line key="ink1" x1={c.x + 6} y1={c.y + 6} x2={c.x + 6} y2={c.y + c.h * 0.6} stroke={SILK.meok} strokeWidth={1} opacity={0.45} strokeDasharray="3 2" />);
  } else if (attempt.sceneId === 'hangul') {
    // 한글 테트리스 → 아자(亞字) 창살: 쌓은 단계만큼 살이 촘촘해진다(창호의 전통 살 무늬)
    const n = { st1: 2, st2: 3, st3: 4, st4: 5 }[attempt.formationId] || 3;
    const L = Math.min(c.w, c.h) * 0.8;
    const x0 = cx - L / 2;
    const y0 = cy - L / 2;
    const stroke = thread; // 금실로 놓은 창살
    out.push(<Rect key="fr" x={x0} y={y0} width={L} height={L} fill="none" stroke={stroke} strokeWidth={1.4} />);
    for (let i = 1; i <= n; i += 1) {
      const t = (i / (n + 1)) * L;
      out.push(<Line key={`v${i}`} x1={x0 + t} y1={y0} x2={x0 + t} y2={y0 + L} stroke={stroke} strokeWidth={0.6} opacity={0.6} />);
      out.push(<Line key={`h${i}`} x1={x0} y1={y0 + t} x2={x0 + L} y2={y0 + t} stroke={stroke} strokeWidth={0.6} opacity={0.6} />);
    }
    const a = L * 0.18;
    const b = L * 0.34;
    const P = [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]];
    out.push(<Path key="ah" d={`M${P.map(([px, py]) => `${(cx + px).toFixed(1)} ${(cy + py).toFixed(1)}`).join(' L')} Z`} fill="none" stroke={stroke} strokeWidth={1.6} />);
    out.push(
      <SvgText key="jm" x={cx} y={cy + L * 0.11} fontSize={L * 0.32} fontFamily={fonts.serifHeavy} fill={stroke} textAnchor="middle">
        {HANGUL_GLYPH[attempt.formationId] || 'ㅏ'}
      </SvgText>
    );
  } else {
    const r = s * 0.42;
    const ground = lightCenter ? SILK.gamcheong : SILK.misaek;
    const col = lightCenter ? SILK.songhwa : SILK.dahong;
    out.push(
      <Medallion key="md" cx={cx} cy={cy} r={r} ground={ground}>
        <G rotation={tilt} origin={`${cx}, ${cy}`}>{playMotif(attempt.formationId, cx, cy, r * 1.55, col)}</G>
      </Medallion>
    );
  }
  // 완성도에 따른 장식 — 수 무늬 위에 얹힌다
  if (level >= 2) {
    const ix = x + 1.6;
    const iy = y + 1.6;
    const iw = w - 3.2;
    const ih = h - 3.2;
    out.push(<Rect key="stitch" x={ix} y={iy} width={iw} height={ih} fill="none" stroke={THREAD_LIGHT} strokeWidth={0.9} strokeDasharray="3 2" opacity={0.85} />);
    [[c.x, c.y], [c.x + c.w, c.y], [c.x, c.y + c.h], [c.x + c.w, c.y + c.h]].forEach(([qx, qy], i) => {
      out.push(<KnotStitch key={`k${i}`} x={qx} y={qy} r={2.4} col={SILK.dahong} />);
    });
  }
  if (level >= 3) {
    out.push(
      <G key="gold">
        <Rect x={c.x - 1.2} y={c.y - 1.2} width={c.w + 2.4} height={c.h + 2.4} fill="none" stroke={GOLD} strokeWidth={1.8} />
        <Rect x={c.x + 1.6} y={c.y + 1.6} width={c.w - 3.2} height={c.h - 3.2} fill="none" stroke={GOLD} strokeWidth={0.6} />
      </G>
    );
  }
  return <G>{out}</G>;
}

// 조각 하나만 따로 보여 주는 작은 카드 (결과 설명·타임라인용)
export function PatchChip({ attempt, size = 72, empty = false, level = 1 }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <PatchArt attempt={attempt} box={{ x: 0, y: 0, w: 100, h: 100 }} empty={empty} level={level} />
        <Rect x={0.75} y={0.75} width={98.5} height={98.5} fill="none" stroke="#3b3530" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

// 조각보 전체. attempts = 지금까지 마친 판들(순서 무관 — sceneId로 자리를 찾는다).
export default function Jogakbo({ attempts, size = 220, shape = 'circle', progress, craft = 'jogakbo', plain = false }) {
  const ctx = useContext(JourneyContext);
  if (craft && craft !== 'jogakbo' && CRAFTS[craft]) return <CraftArt attempts={attempts} size={size} shape={shape} progress={progress || (ctx && ctx.progress)} craft={craft} plain={plain} />;
  const prog = progress || (ctx && ctx.progress) || { levels: {}, counts: {}, percent: 0 };
  const pct = prog.percent || 0;
  const lvl = (id) => Math.max(1, (prog.levels && prog.levels[id]) || 1);
  const list = attempts || [];
  const by = Object.fromEntries(list.map((a) => [a.sceneId, a]));
  const solved = SCENE_ORDER.filter((id) => by[id]);
  const seed = solved.reduce((h, id) => (Math.imul(h ^ (by[id].seed >>> 0), 16777619) >>> 0), 2166136261);
  const rand = rng(seed);
  // 빈 띠 조각 색: 이미 이은 조각들의 오행 색 묶음에서 고른다
  const pool = solved.length ? solved.map((id) => familyOf(by[id].ohangKey, by[id].seed >>> 0)).flat() : ['misaek'];
  const fillerPieces = FILLERS.map((b, i) => {
    const on = solved.length >= 2 + i;
    const t = 0.35 + rand() * 0.3;
    const parts = b.w > 90 ? [{ x: b.x, y: b.y, w: b.w * t, h: b.h }, { x: b.x + b.w * t, y: b.y, w: b.w * (1 - t), h: b.h }] : [b];
    return parts.map((p, j) => ({ p, name: on ? pool[Math.floor(rand() * pool.length)] : null, on, key: `f${i}${j}` }));
  }).flat();
  const clipId = `jgb${size}${shape}`;
  const knot = (cx, cy, col) => (
    <G>
      <Path d={`M${cx} ${cy - 7} L${cx + 7} ${cy} L${cx} ${cy + 7} L${cx - 7} ${cy} Z`} fill={col} stroke={GOLD} strokeWidth={1.2} />
      <Circle cx={cx} cy={cy} r={1.8} fill={THREAD_LIGHT} />
    </G>
  );
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          <ClipPath id={clipId}>
            {shape === 'circle' ? <Circle cx={110} cy={110} r={108} /> : <Rect x={0} y={0} width={220} height={220} rx={6} />}
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Rect x={0} y={0} width={220} height={220} fill={RAMIE} />
          {SCENE_ORDER.map((id) => (
            <PatchArt key={id} attempt={by[id]} box={BOXES[id]} empty={!by[id]} level={lvl(id)} plain={plain} />
          ))}
          {fillerPieces.map(({ p, name, on, key }) =>
            on ? (
              <SilkPiece key={key} k={key} r={p} name={name} />
            ) : (
              <G key={key}>
                <Rect x={p.x} y={p.y} width={p.w} height={p.h} fill={RAMIE} />
                <Rect x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke="rgba(20,15,10,0.25)" strokeWidth={0.8} />
              </G>
            )
          )}
          {pct >= 50
            ? fillerPieces
                .filter((f) => f.on)
                .map(({ p, name, key }) => (
                  <FlowerStitch
                    key={`fl${key}`}
                    x={p.x + p.w / 2}
                    y={p.y + p.h / 2}
                    r={Math.min(9, p.h * 0.24)}
                    petal={LIGHT_SILK.has(name) ? SILK.dahong : SILK.bunhong}
                    heart={GOLD}
                  />
                ))
            : null}
          {/* 조각이 이어지는 자리마다 매듭 */}
          {solved.length >= 2 ? knot(120, 90, SILK.dahong) : null}
          {solved.length >= 3 ? knot(120, 120, SILK.jjok) : null}
          {solved.length >= 4 ? knot(120, 180, SILK.chija) : null}
        </G>
        {/* 보자기 가장자리 단(감청 비단으로 두른 테) */}
        {shape === 'circle' ? (
          <G>
            <Circle cx={110} cy={110} r={106.5} fill="none" stroke={SILK.gamcheong} strokeWidth={4} />
            <Circle cx={110} cy={110} r={106.5} fill="none" stroke={THREAD_LIGHT} strokeWidth={0.6} strokeDasharray="1.5 2.5" opacity={0.8} />
          </G>
        ) : (
          <G>
            <Rect x={2} y={2} width={216} height={216} rx={5} fill="none" stroke={SILK.gamcheong} strokeWidth={4} />
            <Rect x={2} y={2} width={216} height={216} rx={5} fill="none" stroke={THREAD_LIGHT} strokeWidth={0.6} strokeDasharray="1.5 2.5" opacity={0.8} />
          </G>
        )}
        {pct >= 60 ? (
          shape === 'circle' ? (
            <G>
              <Circle cx={110} cy={110} r={101.5} fill="none" stroke={GOLD} strokeWidth={pct >= 100 ? 2.4 : 1.6} />
              {pct >= 100 ? <Circle cx={110} cy={110} r={98} fill="none" stroke={GOLD} strokeWidth={0.9} strokeDasharray="2 3" /> : null}
            </G>
          ) : (
            <G>
              <Rect x={6.5} y={6.5} width={207} height={207} rx={4} fill="none" stroke={GOLD} strokeWidth={pct >= 100 ? 2.4 : 1.6} />
              {pct >= 100 ? <Rect x={10} y={10} width={200} height={200} rx={3} fill="none" stroke={GOLD} strokeWidth={0.9} strokeDasharray="2 3" /> : null}
            </G>
          )
        ) : null}
      </Svg>
    </View>
  );
}

// ───── 물건별 전통 기법 ─────
// 놀이 기록이 무늬를 정하는 방식(판마다 자리·진 모양·낙관 글자·놀이 수 무늬·자모)은 조각보와 똑같다.
// 다만 물건의 재료에 맞는 전통 기법으로 입힌다.
//   청자 상감(매병) — 비색 바탕에 흰 흙·검은 흙을 메워 넣은 선과 무늬
//   백자 청화(달항아리) — 흰 바탕에 코발트 푸른 안료로 그린 무늬
//   나전칠기(소반·반닫이·필통) — 검은 옻칠 바탕에 자개(조개껍데기)를 오려 붙인 무늬와 끊음질 선
//   단청(한옥·석탑·소고·장구·북) — 뇌록 바탕에 붉은 주홍·청·황 띠와 흰 긋기선
//   입사(거울·자물쇠·가락지·범종·먹) — 검은 쇠 바탕에 금실·은실을 박아 넣은 선
export const CRAFTS = {
  sanggam: { name: '청자 상감', ground: '#8fb9a3', ground2: '#9cc4ae', line: '#f4f1e4', ink: '#2f3330', accent: '#a8322d', frame: '#f4f1e4', soft: 0.85 },
  cheonghwa: { name: '백자 청화', ground: '#f3f1ea', ground2: '#eceae1', line: '#2c4f8c', ink: '#2c4f8c', accent: '#2c4f8c', frame: '#2c4f8c', soft: 0.9 },
  najeon: { name: '나전칠기', ground: '#17110f', ground2: '#21170f', line: 'url(#pearl)', ink: 'url(#pearl)', accent: '#c9a24b', frame: '#c9a24b', soft: 1 },
  dancheong: { name: '단청', ground: '#3f7d6a', ground2: '#2f6a8f', line: '#f6f0e2', ink: '#1d1b19', accent: '#b8312a', frame: '#e3b23c', soft: 1 },
  ipsa: { name: '금은 입사', ground: '#26282b', ground2: '#2e3033', line: '#d9dde2', ink: '#d9dde2', accent: '#d1ad55', frame: '#d1ad55', soft: 1 },
};
// 단청 판 바탕을 판마다 바꿔 칠한다(뇌록·청·주홍·장단)
const DAN_PANELS = ['#3f7d6a', '#2f5d8c', '#b8312a', '#3f7d6a'];

function CraftPanel({ box, c, craft, empty, k }) {
  const { x, y, w, h } = box;
  const fill = craft === 'dancheong' ? DAN_PANELS[k % DAN_PANELS.length] : k % 2 ? c.ground2 : c.ground;
  const out = [<Rect key="p" x={x} y={y} width={w} height={h} fill={fill} />];
  if (craft === 'dancheong') {
    // 머리초처럼 겹겹이 긋는 색띠: 흰·먹·황·주홍
    [['#f6f0e2', 3], ['#1d1b19', 1.2], ['#e3b23c', 2.4], ['#b8312a', 1.6]].reduce((ins, [col, t]) => {
      out.push(<Rect key={col + ins} x={x + ins + t / 2} y={y + ins + t / 2} width={w - 2 * ins - t} height={h - 2 * ins - t} fill="none" stroke={col} strokeWidth={t} />);
      return ins + t;
    }, 0);
  } else if (craft === 'najeon') {
    // 끊음질: 자개 띠를 끊어 붙인 두 줄 선
    out.push(<Rect key="b1" x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke="url(#pearl)" strokeWidth={1.6} strokeDasharray="6 2" />);
    out.push(<Rect key="b2" x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke="#c9a24b" strokeWidth={0.6} />);
  } else {
    // 상감·청화·입사: 이중 테두리 선
    out.push(<Rect key="b1" x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke={c.line} strokeWidth={1.4} />);
    out.push(<Rect key="b2" x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke={c.line} strokeWidth={0.6} />);
  }
  if (empty) {
    out.push(<Rect key="e" x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="none" stroke={c.line} strokeWidth={0.8} strokeDasharray="2 3" opacity={0.6} />);
  }
  return <G>{out}</G>;
}

// 기법마다 다른 작은 꽃 도장(국화문·매화·자개 꽃)
function CraftFlower({ x, y, r, c, craft }) {
  if (craft === 'najeon') {
    return (
      <G>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return <Circle key={i} cx={x + Math.cos(a) * r * 0.6} cy={y + Math.sin(a) * r * 0.6} r={r * 0.45} fill="url(#pearl)" />;
        })}
        <Circle cx={x} cy={y} r={r * 0.3} fill="#c9a24b" />
      </G>
    );
  }
  const petal = craft === 'dancheong' ? '#f6f0e2' : c.line;
  const heart = craft === 'sanggam' ? c.ink : craft === 'dancheong' ? '#e3b23c' : c.accent;
  return (
    <G>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return <Circle key={i} cx={x + Math.cos(a) * r * 0.62} cy={y + Math.sin(a) * r * 0.62} r={r * 0.36} fill="none" stroke={petal} strokeWidth={Math.max(0.7, r * 0.18)} />;
      })}
      <Circle cx={x} cy={y} r={r * 0.3} fill={heart} />
    </G>
  );
}

function CraftMotif({ attempt, box, c, craft, level }) {
  const { x, y, w, h } = box;
  const m = Math.min(w, h) * 0.14 + 4;
  const ib = { x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m };
  const cx = ib.x + ib.w / 2;
  const cy = ib.y + ib.h / 2;
  const s = Math.min(ib.w, ib.h);
  const seed = (attempt.seed || 1) >>> 0;
  const tilt = (seed % 7) - 3;
  const ink = c.ink;
  const out = [];
  if (attempt.sceneId === 'jinbeop') {
    const f = FORMATIONS.find((q) => q.id === attempt.formationId);
    const pts = (f && f.positions) || [];
    const px = pts.map((p) => [ib.x + 4 + p.x * (ib.w - 8), ib.y + 4 + p.y * (ib.h - 8)]);
    if (px.length > 1) out.push(<Polyline key="l" points={px.map((p) => p.join(',')).join(' ')} fill="none" stroke={craft === 'sanggam' ? ink : c.line} strokeWidth={0.9} />);
    const r = Math.max(2.6, Math.min(4.4, s / (px.length > 10 ? 11 : 8)));
    px.forEach(([qx, qy], i) => out.push(<CraftFlower key={`f${i}`} x={qx} y={qy} r={r} c={c} craft={craft} />));
  } else if (attempt.sceneId === 'print') {
    const word = PRINT_WORD[attempt.formationId] || '글';
    const chars = Array.from(word);
    const sz = s * 0.5; // 낙관은 작고 단정하게 — 그림 한쪽에 찍는 인장 크기
    const cols = chars.length > 2 ? 2 : 1;
    const rows = Math.ceil(chars.length / cols);
    const cell = (sz - 8) / Math.max(rows, cols);
    const fs = cell * 0.86;
    // 글자를 새긴 네모 — 상감은 흰 흙, 청화는 푸른 테, 나전은 자개 판, 단청은 주홍 판, 입사는 금선
    const plateFill = craft === 'cheonghwa' ? 'none' : craft === 'najeon' ? 'url(#pearl)' : craft === 'dancheong' ? '#b8312a' : craft === 'ipsa' ? 'none' : c.line;
    const glyph = craft === 'cheonghwa' ? c.line : craft === 'najeon' ? '#17110f' : craft === 'dancheong' ? '#f6f0e2' : craft === 'ipsa' ? c.accent : ink;
    out.push(
      <G key="seal" rotation={tilt} origin={`${cx}, ${cy}`}>
        <Rect x={cx - sz / 2} y={cy - sz / 2} width={sz} height={sz} rx={1.5} fill={plateFill} stroke={craft === 'ipsa' ? c.accent : c.line} strokeWidth={1.4} />
        {chars.map((ch, i) => {
          const col = cols === 1 ? 0 : cols - 1 - Math.floor(i / rows);
          const row = cols === 1 ? i : i % rows;
          const gx = cols === 1 ? cx : cx - sz / 2 + 4 + cell * (col + 0.5);
          const gy = cy - sz / 2 + 4 + ((sz - 8) / rows) * (row + 0.5) + fs * 0.34;
          return (
            <SvgText key={i} x={gx} y={gy} fontSize={fs} fontFamily={fonts.serifHeavy} fill={glyph} textAnchor="middle">
              {ch}
            </SvgText>
          );
        })}
      </G>
    );
  } else if (attempt.sceneId === 'hangul') {
    // 한글 테트리스 → 아자(亞字) 창살: 쌓은 단계만큼 살이 촘촘해진다(창호의 전통 살 무늬)
    const n = { st1: 2, st2: 3, st3: 4, st4: 5 }[attempt.formationId] || 3;
    const L = Math.min(ib.w, ib.h) * 0.86;
    const x0 = cx - L / 2;
    const y0 = cy - L / 2;
    const stroke = craft === 'najeon' ? '#c9a24b' : craft === 'dancheong' ? '#f6f0e2' : craft === 'ipsa' ? c.accent : c.line;
    out.push(<Rect key="fr" x={x0} y={y0} width={L} height={L} fill="none" stroke={stroke} strokeWidth={1.4} />);
    for (let i = 1; i <= n; i += 1) {
      const t = (i / (n + 1)) * L;
      out.push(<Line key={`v${i}`} x1={x0 + t} y1={y0} x2={x0 + t} y2={y0 + L} stroke={stroke} strokeWidth={0.6} opacity={0.6} />);
      out.push(<Line key={`h${i}`} x1={x0} y1={y0 + t} x2={x0 + L} y2={y0 + t} stroke={stroke} strokeWidth={0.6} opacity={0.6} />);
    }
    const a = L * 0.18;
    const b = L * 0.34;
    const P = [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]];
    out.push(<Path key="ah" d={`M${P.map(([px, py]) => `${(cx + px).toFixed(1)} ${(cy + py).toFixed(1)}`).join(' L')} Z`} fill="none" stroke={stroke} strokeWidth={1.6} />);
    out.push(
      <SvgText key="jm" x={cx} y={cy + L * 0.11} fontSize={L * 0.32} fontFamily={fonts.serifHeavy} fill={stroke} textAnchor="middle">
        {HANGUL_GLYPH[attempt.formationId] || 'ㅏ'}
      </SvgText>
    );
  } else {
    const r = s * 0.42;
    const col = craft === 'najeon' ? 'url(#pearl)' : craft === 'sanggam' ? ink : craft === 'dancheong' ? '#f6f0e2' : c.line;
    out.push(<Circle key="o" cx={cx} cy={cy} r={r} fill="none" stroke={craft === 'ipsa' || craft === 'najeon' ? c.accent : c.line} strokeWidth={1.3} />);
    out.push(<Circle key="o2" cx={cx} cy={cy} r={r - 3} fill="none" stroke={craft === 'ipsa' || craft === 'najeon' ? c.accent : c.line} strokeWidth={0.5} />);
    out.push(<G key="m" rotation={tilt} origin={`${cx}, ${cy}`}>{playMotif(attempt.formationId, cx, cy, r * 1.55, col)}</G>);
  }
  if (level >= 2) {
    [[ib.x, ib.y], [ib.x + ib.w, ib.y], [ib.x, ib.y + ib.h], [ib.x + ib.w, ib.y + ib.h]].forEach(([qx, qy], i) =>
      out.push(<CraftFlower key={`k${i}`} x={qx} y={qy} r={3} c={c} craft={craft} />)
    );
  }
  if (level >= 3) out.push(<Rect key="g3" x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} fill="none" stroke="#d1ad55" strokeWidth={1.6} />);
  return <G>{out}</G>;
}

// 빈 띠 자리: 기법마다 다른 띠 무늬(상감 여의두·청화 물결·자개 점·단청 색띠·입사 점선)
function CraftBand({ b, c, craft, on, k }) {
  const out = [<Rect key="p" x={b.x} y={b.y} width={b.w} height={b.h} fill={craft === 'dancheong' ? DAN_PANELS[(k + 1) % 4] : c.ground2} />];
  out.push(<Rect key="b" x={b.x + 2} y={b.y + 2} width={b.w - 4} height={b.h - 4} fill="none" stroke={craft === 'najeon' ? '#c9a24b' : c.line} strokeWidth={0.8} />);
  if (on) {
    const n = Math.max(3, Math.round(b.w / 22));
    for (let i = 0; i < n; i += 1) {
      const xx = b.x + (b.w * (i + 0.5)) / n;
      const yy = b.y + b.h / 2;
      if (craft === 'cheonghwa') {
        out.push(<Path key={i} d={`M${xx - 9} ${yy + 3} Q${xx - 4.5} ${yy - 6} ${xx} ${yy + 3} T${xx + 9} ${yy + 3}`} fill="none" stroke={c.line} strokeWidth={1.2} />);
      } else if (craft === 'dancheong') {
        out.push(<Rect key={i} x={xx - 6} y={yy - 6} width={12} height={12} transform={`rotate(45 ${xx} ${yy})`} fill={['#b8312a', '#e3b23c', '#2f5d8c'][i % 3]} stroke="#f6f0e2" strokeWidth={1} />);
      } else if (craft === 'sanggam') {
        out.push(<Path key={i} d={`M${xx - 7} ${yy + 4} Q${xx} ${yy - 9} ${xx + 7} ${yy + 4} Q${xx} ${yy - 1} ${xx - 7} ${yy + 4} Z`} fill="none" stroke={c.line} strokeWidth={1.1} />);
      } else {
        out.push(<CraftFlower key={i} x={xx} y={yy} r={Math.min(6, b.h * 0.18)} c={c} craft={craft} />);
      }
    }
  }
  return <G>{out}</G>;
}

function CraftArt({ attempts, size, shape, progress, craft, plain = false }) {
  const c = CRAFTS[craft];
  const prog = progress || { levels: {}, percent: 0 };
  const pct = prog.percent || 0;
  const lvl = (id) => Math.max(1, (prog.levels && prog.levels[id]) || 1);
  const by = Object.fromEntries((attempts || []).map((a) => [a.sceneId, a]));
  const solved = SCENE_ORDER.filter((id) => by[id]);
  const clipId = `cr${craft}${size}${shape}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          <LinearGradient id="pearl" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f7eefc" />
            <Stop offset="0.35" stopColor="#c9ecec" />
            <Stop offset="0.65" stopColor="#f6d9e6" />
            <Stop offset="1" stopColor="#e6f3d6" />
          </LinearGradient>
          <ClipPath id={clipId}>
            {shape === 'circle' ? <Circle cx={110} cy={110} r={108} /> : <Rect x={0} y={0} width={220} height={220} rx={6} />}
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Rect x={0} y={0} width={220} height={220} fill={c.ground} />
          {SCENE_ORDER.map((id, i) => (
            <CraftPanel key={id} box={BOXES[id]} c={c} craft={craft} empty={!by[id]} k={i} />
          ))}
          {SCENE_ORDER.map((id) => (by[id] && !plain ? <CraftMotif key={`m${id}`} attempt={by[id]} box={BOXES[id]} c={c} craft={craft} level={lvl(id)} /> : null))}
          {FILLERS.map((b, i) => (
            <CraftBand key={`f${i}`} b={b} c={c} craft={craft} on={solved.length >= 2 + i} k={i} />
          ))}
        </G>
        {shape === 'circle' ? (
          <Circle cx={110} cy={110} r={106.5} fill="none" stroke={c.frame} strokeWidth={3} />
        ) : (
          <Rect x={2} y={2} width={216} height={216} rx={5} fill="none" stroke={c.frame} strokeWidth={3} />
        )}
        {pct >= 60 ? (
          shape === 'circle' ? (
            <Circle cx={110} cy={110} r={101.5} fill="none" stroke="#d1ad55" strokeWidth={pct >= 100 ? 2.4 : 1.6} />
          ) : (
            <Rect x={6.5} y={6.5} width={207} height={207} rx={4} fill="none" stroke="#d1ad55" strokeWidth={pct >= 100 ? 2.4 : 1.6} />
          )
        ) : null}
      </Svg>
    </View>
  );
}
