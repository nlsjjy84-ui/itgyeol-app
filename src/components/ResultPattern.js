import React from 'react';
import Svg, { G, Ellipse, Circle, Rect, Polygon } from 'react-native-svg';
import { derivePatternParams, combineSeed } from '../utils/resultSeed';
import { palette3 } from '../utils/color';
import { OHANG } from '../data/formations';

const SIZE = 240;
const CENTER = SIZE / 2;

function ohangColor(key) {
  const found = OHANG.find((o) => o.key === key);
  return found ? found.color : '#c1592f';
}

// 씬(sceneId)마다 완전히 다른 "조각 모양"을 그린다 — 전에는 꽃잎 하나(타원)의
// 개수·크기만 바뀌어서 어떤 판을 완성했든 결과물이 늘 "꽃" 하나로 수렴해 보였다.
// 이제는 어떤 판을 조합했는지가 숫자가 아니라 조각의 생김새 자체로 드러난다.
//   진법(jinbeop) — 사람이 자리를 잡아 이루는 대형처럼, 둥글고 유기적인 꽃잎.
//   훈민정음·인쇄(print) — 활자를 짜 넣는 식자판처럼, 각지고 반듯한 사각 블록.
//   전래놀이(tbd) — 몸을 던져 노는 놀이처럼, 뾰족하고 튀는 별 모양 조각.
function ScenePiece({ sceneId, cx, cy, len, width, color }) {
  if (sceneId === 'print') {
    const w = Math.max(5, width);
    const h = Math.max(6, len);
    return (
      <Rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={Math.min(w, h) * 0.18}
        fill={color}
        opacity={0.88}
      />
    );
  }
  if (sceneId === 'hangul') {
    return (
      <Rect x={cx - width * 0.7} y={cy - len / 2} width={width * 1.4} height={len} rx={2} fill={color} opacity={0.9} rotation={45} origin={`${cx}, ${cy}`} />
    );
  }
  if (sceneId === 'tbd') {
    const w2 = Math.max(4, width * 0.62);
    const points = [
      `${cx},${cy - len / 2}`,
      `${cx + w2},${cy - len * 0.08}`,
      `${cx + w2 * 0.55},${cy + len / 2}`,
      `${cx - w2 * 0.55},${cy + len / 2}`,
      `${cx - w2},${cy - len * 0.08}`,
    ].join(' ');
    return <Polygon points={points} fill={color} opacity={0.9} />;
  }
  // jinbeop(기본)
  return (
    <Ellipse cx={cx} cy={cy} rx={Math.max(4, width / 2)} ry={len / 2} fill={color} opacity={0.85} />
  );
}

// 완성한 판(attempt) 하나를 "조각 모양의 고리 한 겹"으로 그린다.
// ringIndex가 커질수록 바깥쪽 고리가 되어, 판을 거칠수록 문양이 커지고 겹겹이 쌓인다.
function PatternRing({ attempt, ringIndex, ringCount }) {
  const { petals, rotation, innerRatio, twist, petalWidth } = derivePatternParams(attempt.seed);
  const colors = palette3(ohangColor(attempt.ohangKey));
  const outerR = (SIZE / 2 - 10) * ((ringIndex + 1) / ringCount);
  const innerR = outerR * innerRatio;
  const pieceLen = (outerR - innerR) * 0.95;
  const pieceWidth = Math.max(4, petalWidth * outerR);
  const cy = CENTER - innerR - pieceLen / 2;

  return (
    <G rotation={rotation} origin={`${CENTER}, ${CENTER}`}>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (360 / petals) * i * twist;
        const color = colors[i % colors.length];
        return (
          <G key={i} rotation={angle} origin={`${CENTER}, ${CENTER}`}>
            <ScenePiece
              sceneId={attempt.sceneId}
              cx={CENTER}
              cy={cy}
              len={pieceLen}
              width={pieceWidth}
              color={color}
            />
          </G>
        );
      })}
    </G>
  );
}

// attempts: 이번에 보여줄 결과 조합 (판 1개만 = 단독 결과, 2~3개 = 연결된 결과).
// 몇 개를 어떤 순서로 묶느냐에 따라 매번 다른 모양이 나오도록, 묶음 전체에
// 한 번 더 회전을 줘서 "연결하면 달라지는" 느낌을 더한다.
export default function ResultPattern({ attempts, size = SIZE }) {
  const list = attempts && attempts.length > 0 ? attempts : [];
  const ringCount = Math.max(1, list.length);
  const comboRotation = list.length > 1 ? combineSeed(list) % 360 : 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Circle cx={CENTER} cy={CENTER} r={SIZE / 2 - 2} fill="#fffbf3" />
      <G rotation={comboRotation} origin={`${CENTER}, ${CENTER}`}>
        {list.map((attempt, idx) => (
          <PatternRing
            key={`${attempt.sceneId}-${attempt.seed}`}
            attempt={attempt}
            ringIndex={list.length - 1 - idx}
            ringCount={ringCount}
          />
        ))}
      </G>
      <Circle cx={CENTER} cy={CENTER} r={6} fill="#26313c" opacity={0.6} />
    </Svg>
  );
}
