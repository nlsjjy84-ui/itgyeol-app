import React, { useContext } from 'react';
import { View } from 'react-native';
import Svg, { G, Rect, Circle, Line, Path, Text as SvgText, ClipPath, Defs, Polyline } from 'react-native-svg';
import { FORMATIONS, ohangByKey } from '../data/formations';
import { colors, fonts } from '../theme';
import { JourneyContext } from '../context/JourneyContext';

// 조각보 — 판 하나를 마칠 때마다 조각 한 장이 생기고, 그 조각들이 이어져 한 장의 전통 창작물이 된다.
//   진법 → 진 모양을 찍은 조각 (사람 자리가 점으로 남는다)
//   훈민정음·인쇄 → 낙관(도장) 조각 (직접 맞춘 글자가 새겨진다)
//   전래놀이 → 놀이 글자를 새긴 인장 조각
// 아직 안 한 판의 자리는 빈 조각(점선)으로 남아서, 다음 판이 이어 붙을 곳을 보여 준다.
// 같은 시드면 항상 같은 모양이 나온다(재현 가능).
// 같은 판에서 '서로 다른 문제'를 많이 풀수록 완성도가 올라가 조각이 더 정교해진다.
//   1단계 바탕 조각 → 2단계 수놓은 조각(실땀 + 모서리 십자수) → 3단계 금실 조각(금실 이중 테두리 + 금 징)
//   전체 완성도(%)가 오르면 빈 천이 짙어지고, 50%부터 꽃수가 놓이며, 60%에 금빛 테두리, 100%에 이중 금빛 테두리가 둘러진다.
const GOLD = '#c9a24b';

const PAPER = '#fffbf3'; // 조각 천 — 어떤 테마에서도 작품은 밝은 천 위에 놓인다
const INK = '#1b2227';

const PRINT_WORD = {
  'jamo-sogo': '소고',
  'jamo-binyeo': '비녀',
  'jamo-bomul': '보물',
  'jamo-pungmulnori': '풍물놀이',
  'jamo-munhwajae': '문화재',
  'jamo-hangeulnal': '한글날',
  metaltype: '活',
  woodblock: '板',
};

const PLAY_HANJA = {
  julneomgi: '跳',
  juldarigi: '索',
  sangmo: '舞',
  guseulchigi: '珠',
  paengi: '螺',
  jachigi: '尺',
  biseok: '碑',
  tuho: '壺',
  ddakji: '牌',
  gomugojul: '繩',
  yeonnaligi: '鳶',
  gullyeongsoe: '輪',
};

export const SCENE_ORDER = ['jinbeop', 'print', 'tbd'];

// 220×220 판 위에서 각 조각이 놓이는 자리
const BOXES = {
  jinbeop: { x: 0, y: 0, w: 120, h: 100 },
  print: { x: 120, y: 0, w: 100, h: 150 },
  tbd: { x: 0, y: 100, w: 120, h: 120 },
};
const FILLERS = [
  { x: 120, y: 150, w: 50, h: 70 },
  { x: 170, y: 150, w: 50, h: 70 },
];

function ohangColor(key) {
  const o = ohangByKey ? ohangByKey(key) : null;
  return (o && o.color) || colors.accent;
}

function pick(seed, n, shift = 0) {
  return ((seed >>> shift) % n + n) % n;
}

// 조각 하나(천 + 새김)를 그린다. box는 그려질 자리.
export function PatchArt({ attempt, box, empty = false, level = 1 }) {
  const { x, y, w, h } = box;
  if (empty || !attempt) {
    return (
      <G>
        <Rect x={x} y={y} width={w} height={h} fill={PAPER} opacity={0.55} />
        <Rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="none" stroke="#9aa6a2" strokeWidth={1.4} strokeDasharray="4 4" />
        {[0, 1, 2].map((i) => (
          <Circle key={i} cx={x + w / 2 - 8 + i * 8} cy={y + h / 2} r={1.8} fill="#9aa6a2" />
        ))}
      </G>
    );
  }
  const base = ohangColor(attempt.ohangKey);
  const seed = attempt.seed || 1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const tilt = pick(seed, 7, 3) - 3;
  const out = [
    <Rect key="cloth" x={x} y={y} width={w} height={h} fill={PAPER} />,
    <Rect key="tint" x={x} y={y} width={w} height={h} fill={base} opacity={0.2} />,
    <Rect key="in" x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="none" stroke={base} strokeWidth={1.2} opacity={0.7} />,
  ];
  if (attempt.sceneId === 'jinbeop') {
    const f = FORMATIONS.find((q) => q.id === attempt.formationId);
    const pts = (f && f.positions) || [];
    const px = pts.map((p) => [x + 16 + p.x * (w - 32), y + 14 + p.y * (h - 28)]);
    if (px.length > 1) {
      out.push(
        <Polyline
          key="line"
          points={px.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke={base}
          strokeWidth={1.4}
          opacity={0.55}
        />
      );
    }
    px.forEach(([qx, qy], i) =>
      out.push(<Circle key={`d${i}`} cx={qx} cy={qy} r={Math.max(3.2, Math.min(w, h) / 24)} fill={base} />)
    );
  } else if (attempt.sceneId === 'print') {
    const word = PRINT_WORD[attempt.formationId] || '印';
    const chars = Array.from(word);
    const s = Math.min(w, h) * 0.52;
    const fs = chars.length === 1 ? s * 0.78 : Math.min(s * 0.5, (s - 8) / chars.length * 1.05);
    out.push(
      <G key="seal" rotation={tilt} origin={`${cx}, ${cy}`}>
        <Rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={3} fill={colors.jeok} />
        <Rect x={cx - s / 2 + 3} y={cy - s / 2 + 3} width={s - 6} height={s - 6} rx={2} fill="none" stroke="#fffbf3" strokeWidth={1.2} opacity={0.8} />
        {chars.map((c, i) => (
          <SvgText
            key={i}
            x={cx}
            y={cy - s / 2 + (s / (chars.length + 0.0)) * (i + 0.5) + fs * 0.35}
            fontSize={fs}
            fontFamily={fonts.serifHeavy}
            fill="#fffbf3"
            textAnchor="middle"
          >
            {c}
          </SvgText>
        ))}
      </G>
    );
  } else {
    const ch = PLAY_HANJA[attempt.formationId] || '遊';
    const r = Math.min(w, h) * 0.3;
    out.push(
      <G key="play" rotation={tilt} origin={`${cx}, ${cy}`}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={base} strokeWidth={2.4} />
        <Circle cx={cx} cy={cy} r={r - 5} fill={base} opacity={0.16} />
        <SvgText x={cx} y={cy + r * 0.42} fontSize={r * 1.25} fontFamily={fonts.serifHeavy} fill={INK} textAnchor="middle">
          {ch}
        </SvgText>
        {[0, 1, 2, 3].map((i) => (
          <Line
            key={i}
            x1={cx + Math.cos((i * Math.PI) / 2 + 0.78) * (r + 4)}
            y1={cy + Math.sin((i * Math.PI) / 2 + 0.78) * (r + 4)}
            x2={cx + Math.cos((i * Math.PI) / 2 + 0.78) * (r + 9)}
            y2={cy + Math.sin((i * Math.PI) / 2 + 0.78) * (r + 9)}
            stroke={base}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </G>
    );
  }
  // 완성도에 따른 장식 — 새김 위에 얹힌다
  if (level >= 2) {
    const ix = x + 9;
    const iy = y + 9;
    const iw = w - 18;
    const ih = h - 18;
    out.push(
      <Rect key="stitch" x={ix} y={iy} width={iw} height={ih} fill="none" stroke={base} strokeWidth={1.3} strokeDasharray="2.5 3" opacity={0.95} />
    );
    [[ix, iy], [ix + iw, iy], [ix, iy + ih], [ix + iw, iy + ih]].forEach(([qx, qy], i) => {
      out.push(
        <G key={`x${i}`}>
          <Line x1={qx - 3} y1={qy - 3} x2={qx + 3} y2={qy + 3} stroke={colors.jeok} strokeWidth={1.4} strokeLinecap="round" />
          <Line x1={qx + 3} y1={qy - 3} x2={qx - 3} y2={qy + 3} stroke={colors.jeok} strokeWidth={1.4} strokeLinecap="round" />
        </G>
      );
    });
  }
  if (level >= 3) {
    out.push(
      <G key="gold">
        <Rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="none" stroke={GOLD} strokeWidth={2.2} />
        <Rect x={x + 5.5} y={y + 5.5} width={w - 11} height={h - 11} fill="none" stroke={GOLD} strokeWidth={0.9} />
        {[[x + 2, y + 2], [x + w - 2, y + 2], [x + 2, y + h - 2], [x + w - 2, y + h - 2]].map(([qx, qy], i) => (
          <Circle key={i} cx={qx} cy={qy} r={3} fill={GOLD} stroke="#fffbf3" strokeWidth={0.8} />
        ))}
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
        <Rect x={0.75} y={0.75} width={98.5} height={98.5} fill="none" stroke="#8d9a96" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

// 조각보 전체. attempts = 지금까지 마친 판들(순서 무관 — sceneId로 자리를 찾는다).
export default function Jogakbo({ attempts, size = 220, shape = 'circle', progress }) {
  const ctx = useContext(JourneyContext);
  const prog = progress || (ctx && ctx.progress) || { levels: {}, counts: {}, percent: 0 };
  const pct = prog.percent || 0;
  const lvl = (id) => Math.max(1, (prog.levels && prog.levels[id]) || 1);
  const list = attempts || [];
  const by = Object.fromEntries(list.map((a) => [a.sceneId, a]));
  const solved = SCENE_ORDER.filter((id) => by[id]);
  const seed = solved.reduce((h, id) => (Math.imul(h ^ (by[id].seed >>> 0), 16777619) >>> 0), 2166136261);
  const fill = [colors.cheong, colors.jeok, colors.hwang, colors.green];
  const fillerColor = FILLERS.map((_, i) => fill[pick(seed, 4, i * 5)]);
  const clipId = `jgb${size}${shape}`;
  const stitch = { stroke: GOLD, strokeWidth: 1.4, strokeDasharray: '3 3' };
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          <ClipPath id={clipId}>
            {shape === 'circle' ? <Circle cx={110} cy={110} r={108} /> : <Rect x={0} y={0} width={220} height={220} rx={10} />}
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Rect x={0} y={0} width={220} height={220} fill={PAPER} />
          {SCENE_ORDER.map((id) => (
            <PatchArt key={id} attempt={by[id]} box={BOXES[id]} empty={!by[id]} level={lvl(id)} />
          ))}
          {FILLERS.map((b, i) => (
            <G key={`f${i}`}>
              <Rect x={b.x} y={b.y} width={b.w} height={b.h} fill={PAPER} />
              <Rect x={b.x} y={b.y} width={b.w} height={b.h} fill={fillerColor[i]} opacity={solved.length >= 2 + i ? 0.28 + 0.4 * (pct / 100) : 0.1} />
              {pct >= 50 && solved.length >= 2 + i ? (
                <G>
                  {[0, 1, 2, 3].map((k) => (
                    <Circle
                      key={k}
                      cx={b.x + b.w / 2 + Math.cos((k * Math.PI) / 2) * 7}
                      cy={b.y + b.h / 2 + Math.sin((k * Math.PI) / 2) * 7}
                      r={4.2}
                      fill="none"
                      stroke={colors.jeok}
                      strokeWidth={1.4}
                    />
                  ))}
                  <Circle cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={3} fill={GOLD} />
                </G>
              ) : null}
              {[0, 1, 2].map((k) => (
                <Line key={k} x1={b.x + 8} y1={b.y + 14 + k * 20} x2={b.x + b.w - 8} y2={b.y + 14 + k * 20} stroke={PAPER} strokeWidth={1.2} opacity={0.7} />
              ))}
            </G>
          ))}
          {/* 박음질(바느질) 선 */}
          <Line x1={0} y1={100} x2={120} y2={100} {...stitch} />
          <Line x1={120} y1={0} x2={120} y2={220} {...stitch} />
          <Line x1={120} y1={150} x2={220} y2={150} {...stitch} />
          <Line x1={170} y1={150} x2={170} y2={220} {...stitch} />
          {/* 조각이 이어지는 자리마다 매듭 */}
          {solved.length >= 2 ? (
            <G>
              <Path d="M120 91 L129 100 L120 109 L111 100 Z" fill={colors.jeok} stroke="#c9a24b" strokeWidth={1.4} />
              <Circle cx={120} cy={100} r={2} fill="#fffbf3" />
            </G>
          ) : null}
          {solved.length >= 3 ? (
            <G>
              <Path d="M120 141 L129 150 L120 159 L111 150 Z" fill={colors.cheong} stroke="#c9a24b" strokeWidth={1.4} />
              <Circle cx={120} cy={150} r={2} fill="#fffbf3" />
            </G>
          ) : null}
        </G>
        {shape === 'circle' ? (
          <Circle cx={110} cy={110} r={107} fill="none" stroke="#8d9a96" strokeWidth={2} />
        ) : (
          <Rect x={1} y={1} width={218} height={218} rx={10} fill="none" stroke="#8d9a96" strokeWidth={2} />
        )}
        {pct >= 60 ? (
          shape === 'circle' ? (
            <G>
              <Circle cx={110} cy={110} r={103} fill="none" stroke={GOLD} strokeWidth={pct >= 100 ? 3 : 2} />
              {pct >= 100 ? <Circle cx={110} cy={110} r={97} fill="none" stroke={GOLD} strokeWidth={1.2} strokeDasharray="2 4" /> : null}
            </G>
          ) : (
            <G>
              <Rect x={5} y={5} width={210} height={210} rx={8} fill="none" stroke={GOLD} strokeWidth={pct >= 100 ? 3 : 2} />
              {pct >= 100 ? <Rect x={11} y={11} width={198} height={198} rx={6} fill="none" stroke={GOLD} strokeWidth={1.2} strokeDasharray="2 4" /> : null}
            </G>
          )
        ) : null}
      </Svg>
    </View>
  );
}
