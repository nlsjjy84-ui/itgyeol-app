import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

// 놀이판 바닥 — 먹선 테두리 + 아주 옅은 정간(井間) 격자. 점·원 대신 판 자체에 전통 느낌을 준다.
// grid: 격자 칸 수(0이면 선 없음)
export default function Board({ children, style, grid = 6, tone }) {
  return (
    <View style={[styles.board, tone && { backgroundColor: tone }, style]}>
      {grid > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Array.from({ length: grid - 1 }).map((_, i) => {
              const p = ((i + 1) * 100) / grid;
              return (
                <React.Fragment key={i}>
                  <Line x1={p} y1="0" x2={p} y2="100" stroke={colors.border} strokeWidth="0.35" strokeOpacity="0.55" />
                  <Line x1="0" y1={p} x2="100" y2={p} stroke={colors.border} strokeWidth="0.35" strokeOpacity="0.55" />
                </React.Fragment>
              );
            })}
            <Rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke={colors.accent} strokeWidth="0.5" strokeOpacity="0.5" />
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#e6d8b6',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
