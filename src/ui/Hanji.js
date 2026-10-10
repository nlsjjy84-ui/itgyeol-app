import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

// 한지 질감 배경 — 닥나무 섬유를 닮은 아주 옅은 선을 한 번만 그려 깔아 둔다.
// (같은 값이 나오도록 고정 시드로 만든다.)
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export default function Hanji({ children, style, tone }) {
  const fibers = useMemo(() => {
    const r = rng(20261003);
    const out = [];
    for (let i = 0; i < 170; i++) {
      const x = r() * 100;
      const y = r() * 100;
      const len = 0.8 + r() * 2.2;
      const ang = r() * Math.PI;
      out.push({
        x1: x,
        y1: y,
        x2: x + Math.cos(ang) * len,
        y2: y + Math.sin(ang) * len * 0.6,
        o: 0.025 + r() * 0.05,
      });
    }
    return out;
  }, []);
  return (
    <View style={[{ flex: 1, backgroundColor: tone || colors.bg }, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Rect x="0" y="0" width="100" height="100" fill="transparent" />
          {fibers.map((f, i) => (
            <Line
              key={i}
              x1={f.x1}
              y1={f.y1}
              x2={f.x2}
              y2={f.y2}
              stroke={colors.fiber}
              strokeWidth="0.18"
              strokeOpacity={f.o}
            />
          ))}
        </Svg>
      </View>
      {children}
    </View>
  );
}
