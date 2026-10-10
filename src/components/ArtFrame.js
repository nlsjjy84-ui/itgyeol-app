import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import Text from '../ui/Text';
import { DancheongBand } from '../ui/Motifs';
import { colors } from '../theme';

// 결과물을 족자·액자처럼 꾸미는 틀 — 한지 바탕에 살창(격자) 무늬, 이중 테두리,
// 위아래 단청 띠, 모서리 구름무늬, 그리고 붉은 낙관(도장)을 찍는다.
// 결과물 그림 자체(수학적으로 만들어진 모양)는 건드리지 않고 그 둘레만 전통 양식으로 감싼다.
function Cloud({ x, y, flip }) {
  return (
    <Path
      transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
      d="M0 14 C0 8 6 6 9 9 C10 3 19 3 20 10 C25 9 28 14 24 17 L4 17 C1 17 0 16 0 14 Z"
      fill="none"
      stroke={colors.accent}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  );
}

export default function ArtFrame({ children, size = 220, seal = '잇결' }) {
  const W = size + 56;
  const lines = [];
  const step = 14;
  for (let i = -W; i < W * 2; i += step) {
    lines.push(<Line key={`a${i}`} x1={i} y1="0" x2={i + W} y2={W + 60} stroke={colors.border} strokeWidth="0.6" opacity="0.35" />);
    lines.push(<Line key={`b${i}`} x1={i} y1={W + 60} x2={i + W} y2="0" stroke={colors.border} strokeWidth="0.6" opacity="0.35" />);
  }
  return (
    <View style={[styles.outer, { width: W }]}>
      <View style={styles.inner}>
        <View style={styles.bandWrap}>
          <DancheongBand width={W - 28} height={10} />
        </View>
        <View style={styles.artArea}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              {lines}
            </Svg>
          </View>
          <View style={styles.cloudRow} pointerEvents="none">
            <Svg width={W - 28} height={22}>
              <Cloud x={2} y={2} />
              <Cloud x={W - 30} y={2} flip />
            </Svg>
          </View>
          <View style={styles.artCenter}>{children}</View>
          <View style={styles.sealWrap} pointerEvents="none">
            <View style={styles.seal}>
              <Text brush style={styles.sealText}>{seal}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bandWrap}>
          <DancheongBand width={W - 28} height={10} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'center', borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.paper, borderRadius: 3, padding: 5 },
  inner: { borderWidth: 1.5, borderColor: colors.accent, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', gap: 6 },
  bandWrap: { alignItems: 'center' },
  artArea: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#f1e7cf', overflow: 'hidden' },
  cloudRow: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  artCenter: { alignItems: 'center', justifyContent: 'center' },
  sealWrap: { position: 'absolute', right: 8, bottom: 8 },
  seal: { width: 38, height: 38, backgroundColor: colors.accent, borderRadius: 3, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }], borderWidth: 1, borderColor: colors.accentDeep, opacity: 0.92 },
  sealText: { color: colors.baek, fontSize: 18, lineHeight: 20, textAlign: 'center' },
});
