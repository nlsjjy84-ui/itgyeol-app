import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle, Polygon, Line } from 'react-native-svg';
import { synthesizeAttention } from '../utils/attentionSynth';
import { OHANG } from '../data/formations';
import { colors } from '../theme';

const SIZE = 220;
const C = SIZE / 2;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function ohangColor(key) {
  const found = OHANG.find((o) => o.key === key);
  return found ? found.color : colors.accentDeep;
}

// 결정적인 "흔들림"을 주기 위한 아주 단순한 의사-난수 (매번 똑같이 재현된다).
function jitter(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// 부채(接扇) → 날개 : w=0이면 부챗살처럼 곧은 선, w=1이면 활처럼 휘어 깃털 가지가 돋는다.
// 진법(사람이 벌려 서는 대형 — 특히 학익진) 쪽 가중치가 클수록 더 날개에 가까워진다.
function FanWingLayer({ cx, cy, radius, w, color }) {
  // 살 수를 줄이고 펼침각을 좁혀서, 작은 키링 얼굴 안에서도 "부채/날개"로 읽히게 한다
  // (살이 많고 펼침각이 넓으면 작은 원 안에서 별표(asterisk)처럼 뭉쳐 보인다).
  const ribs = 5;
  const spread = lerp(34, 50, w); // w가 작을수록 좁은 부채, 클수록 넓게 펼쳐진 날개
  const nodes = [];
  for (let i = 0; i < ribs; i++) {
    const t = i / (ribs - 1);
    const angle = lerp(-spread, spread, t) * (Math.PI / 180);
    const bend = lerp(0, radius * 0.3, w) * (i % 2 === 0 ? 1 : -1);
    const tipX = cx + Math.sin(angle) * radius;
    const tipY = cy - Math.cos(angle) * radius;
    const ctrlX = cx + Math.sin(angle) * radius * 0.55 + Math.cos(angle) * bend;
    const ctrlY = cy - Math.cos(angle) * radius * 0.55 + Math.sin(angle) * bend;
    nodes.push(
      <Path
        key={`r${i}`}
        d={`M${cx},${cy} Q${ctrlX},${ctrlY} ${tipX},${tipY}`}
        stroke={color}
        strokeWidth={lerp(1.6, 3.2, w)}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
    );
    if (w > 0.45) {
      const barbLen = radius * 0.15 * w;
      const nx = cx + Math.sin(angle) * radius * 0.8 + Math.cos(angle) * bend * 0.75;
      const ny = cy - Math.cos(angle) * radius * 0.8 + Math.sin(angle) * bend * 0.75;
      nodes.push(
        <Line
          key={`b${i}`}
          x1={nx}
          y1={ny}
          x2={nx + Math.cos(angle) * barbLen}
          y2={ny + Math.sin(angle) * barbLen}
          stroke={color}
          strokeWidth={1.1}
          opacity={0.45 * w}
        />
      );
    }
  }
  const pivotR = lerp(6, 3.5, w);
  return (
    <G>
      {nodes}
      <Circle cx={cx} cy={cy} r={pivotR} fill={color} opacity={0.7} />
    </G>
  );
}

// 붓(둥글고 부드러운 붓촉) → 칼(좁고 날카로운 칼날) : w=0이면 볼록한 붓끝 윤곽,
// w=1이면 직선적이고 뾰족한 칼날 윤곽. 훈민정음·인쇄(글을 쓰는 붓) 쪽 가중치를 따른다.
function BrushSwordLayer({ cx, top, bottom, w, color }) {
  const baseWidth = lerp(15, 8, w);
  const tipWidth = lerp(9, 0.6, w);
  const bulge = lerp(7, 0.5, w);
  const mid = lerp(top, bottom, 0.52);
  const d = `
    M${cx - baseWidth / 2},${top}
    Q${cx - baseWidth / 2 - bulge},${mid} ${cx - tipWidth / 2},${bottom}
    L${cx + tipWidth / 2},${bottom}
    Q${cx + baseWidth / 2 + bulge},${mid} ${cx + baseWidth / 2},${top}
    Z
  `;
  return (
    <G>
      <Path d={d} fill={color} opacity={0.85} />
      <Line
        x1={cx}
        y1={top + 4}
        x2={cx}
        y2={bottom - 2}
        stroke="#fffbf3"
        strokeWidth={lerp(0, 1.4, w)}
        opacity={0.5}
      />
    </G>
  );
}

// 자모(흩어진 낱자처럼 들쭉날쭉한 점) → 도형(정돈된 다각형) : w=0이면 반경과 각도가
// 흐트러져 있고, w=1이면 정다각형 꼭짓점으로 또렷하게 정렬된다. 훈민정음(글자 조립)
// 쪽 가중치를 따른다 — 자모가 "글자"라는 질서로 맞춰지는 과정 그대로를 본뜬다.
function JamoShapeLayer({ cx, cy, radius, w, color, count = 6 }) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const jitterAngle = angle + (1 - w) * (jitter(i) - 0.5) * 1.3;
    const jitterR = radius * (0.5 + (1 - w) * 0.45 * jitter(i + 9));
    const r = lerp(jitterR, radius, w);
    pts.push([cx + Math.cos(jitterAngle) * r, cy + Math.sin(jitterAngle) * r]);
  }
  return (
    <G>
      <Polygon
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={lerp(1, 2.4, w)}
        opacity={0.45 + 0.4 * w}
      />
      {pts.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={lerp(5.2, 3.2, w)} fill={color} opacity={0.92} />
      ))}
    </G>
  );
}

// attempts(완성한 판들)를 어텐션으로 섞어 "부채→날개 / 붓→칼 / 자모→도형"을 한 화면에
// 겹쳐 그린다. 세 모티프의 선명도·형태는 synthesizeAttention이 실제로 계산한
// shapeWeights를 그대로 따른다 — 가중치가 클수록 그 모티프가 더 "변형된" 모습으로 보인다.
export default function TransformResultShape({ attempts, size = SIZE }) {
  if (!attempts || attempts.length === 0) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={C} cy={C} r={C - 4} fill="#fffbf3" stroke={colors.border} strokeWidth={1} />
        </Svg>
      </View>
    );
  }

  const synth = synthesizeAttention(attempts);
  const lastOhang = attempts[attempts.length - 1]?.ohangKey;
  const primaryColor = ohangColor(lastOhang);
  const { fanWing, brushSword, jamoShape } = synth.shapeWeights;

  // 세 모티프가 같은 중심점 위에 그대로 겹치면(특히 키링처럼 작은 얼굴 안에서) 별표처럼
  // 뭉쳐 보인다 — 그래서 수직으로 자리를 나눈다: 자모→도형(위) / 붓→칼(가운데, 짧게) /
  // 부채→날개(아래). 세 모티프가 각자의 구역에서 또렷하게 읽히게 하기 위한 배치다.
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={C} cy={C} r={C - 4} fill="#fffbf3" stroke={colors.border} strokeWidth={1} />
        <JamoShapeLayer cx={C} cy={C - 62} radius={28} w={jamoShape} color="#6b4f8a" count={6} />
        <BrushSwordLayer cx={C} top={C - 36} bottom={C + 30} w={brushSword} color="#2c3038" />
        <FanWingLayer cx={C} cy={C + 68} radius={46} w={fanWing} color={primaryColor} />
      </Svg>
    </View>
  );
}
