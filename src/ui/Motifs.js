import React from 'react';
import Svg, { Circle, Path, G, Rect, Line } from 'react-native-svg';
import { colors } from '../theme';

// 태극 — 청·적 두 기운이 맞물린 모양
export function Taegeuk({ size = 40, a = colors.jeok, b = colors.cheong }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill={b} />
      <Path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2 Z" fill={a} />
      <Circle cx="50" cy="26" r="7" fill={b} />
      <Circle cx="50" cy="74" r="7" fill={a} />
    </Svg>
  );
}

// 구름무늬(서운문) — 한 줄로 이어 붙여 구분선처럼 쓴다
export function CloudBand({ width = 240, color = colors.accent, opacity = 0.9 }) {
  const n = Math.max(3, Math.round(width / 40));
  const items = [];
  for (let i = 0; i < n; i++) {
    const x = (i * 100) / n + 100 / n / 2;
    items.push(
      <G key={i} transform={`translate(${x - 8} 6)`}>
        <Path
          d="M2 14 C2 8 8 6 11 9 C12 3 21 3 22 10 C27 9 30 14 26 17 L6 17 C3 17 2 16 2 14 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <Path d="M10 13 C11 11 14 11 15 13" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <Svg width={width} height={26} viewBox="0 0 100 26" preserveAspectRatio="none" opacity={opacity}>
      {items}
    </Svg>
  );
}

// 단청 띠 — 청·적·황·백·흑 작은 마름모를 줄지어 놓는다
export function DancheongBand({ width = 240, height = 12 }) {
  const cols = [colors.cheong, colors.jeok, colors.hwang, colors.green, colors.ink];
  const n = Math.max(5, Math.round(width / 22));
  const w = 100 / n;
  return (
    <Svg width={width} height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <Rect x="0" y={height / 2 - 0.6} width="100" height="1.2" fill={colors.ink} opacity="0.55" />
      {Array.from({ length: n }).map((_, i) => {
        const cx = i * w + w / 2;
        return (
          <Path
            key={i}
            d={`M${cx} 0.6 L${cx + w * 0.34} ${height / 2} L${cx} ${height - 0.6} L${cx - w * 0.34} ${height / 2} Z`}
            fill={cols[i % cols.length]}
          />
        );
      })}
    </Svg>
  );
}

// 매듭 장식(국화매듭을 단순화) — 키링·결과물 머리에 단다
export function Knot({ size = 30, color = colors.jeok }) {
  return (
    <Svg width={size} height={size * 1.5} viewBox="0 0 40 60">
      <Path d="M20 0 L20 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="20" cy="22" r="9" fill="none" stroke={color} strokeWidth="3" />
      <Path d="M11 22 Q20 10 29 22 Q20 34 11 22 Z" fill={color} opacity="0.35" />
      <Path d="M20 31 C14 40 16 50 12 58 M20 31 C26 40 24 50 28 58" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// 빗금 문양(살창·완자문 단순형) — 배경 장식
export function LatticeCorner({ size = 56, color = colors.border }) {
  const lines = [];
  for (let i = 0; i <= 5; i++) {
    const p = (i * size) / 5;
    lines.push(<Line key={`a${i}`} x1={p} y1="0" x2="0" y2={p} stroke={color} strokeWidth="1" />);
    lines.push(<Line key={`b${i}`} x1={size - p} y1="0" x2={size} y2={p} stroke={color} strokeWidth="1" opacity="0.6" />);
  }
  return (
    <Svg width={size} height={size}>
      {lines}
    </Svg>
  );
}
