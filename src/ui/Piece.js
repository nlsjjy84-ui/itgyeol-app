import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Text from './Text';
import { colors } from '../theme';

// 놀이 말(조각) — 동그라미 대신 전통 소품 모양을 쓴다.
// shape: 'seal'(네모 도장) | 'flag'(깃발) | 'tile'(활자 조각) | 'coin'(엽전)
// 번호나 글자(label)를 가운데에 먹으로 쓴다.
export default function Piece({ shape = 'seal', size = 40, label, color = colors.accent, textColor, selected, style }) {
  const tc = textColor || (shape === 'tile' ? colors.ink : colors.baek);
  const fs = Math.round(size * 0.46);
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {shape === 'flag' ? (
        <Svg width={size} height={size} viewBox="0 0 40 40" style={StyleSheet.absoluteFill}>
          <Rect x="6" y="2" width="2.6" height="37" fill={colors.ink} />
          <Path d="M8.6 4 L36 4 L30 12 L36 20 L8.6 20 Z" fill={color} stroke={colors.ink} strokeWidth="1.2" />
        </Svg>
      ) : shape === 'coin' ? (
        <Svg width={size} height={size} viewBox="0 0 40 40" style={StyleSheet.absoluteFill}>
          <Circle cx="20" cy="20" r="18" fill={colors.gold} stroke={colors.ink} strokeWidth="1.5" />
          <Rect x="14" y="14" width="12" height="12" fill={colors.paper} stroke={colors.ink} strokeWidth="1.5" />
        </Svg>
      ) : (
        <View
          style={[
            styles.sq,
            {
              width: size,
              height: size,
              backgroundColor: shape === 'tile' ? colors.paper : color,
              borderColor: shape === 'tile' ? colors.ink : colors.accentDeep,
              borderWidth: shape === 'tile' ? 2 : 1.5,
              transform: [{ rotate: shape === 'seal' ? '-3deg' : '0deg' }],
            },
            selected && { borderColor: colors.hwang, borderWidth: 3 },
          ]}
        />
      )}
      {label !== undefined && label !== null && shape !== 'coin' ? (
        <Text
          brush={shape === 'seal'}
          style={{
            color: tc,
            fontSize: fs,
            fontWeight: '700',
            marginLeft: shape === 'flag' ? size * 0.12 : 0,
            marginTop: shape === 'flag' ? -size * 0.2 : 0,
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ sq: { position: 'absolute', borderRadius: 3 } });
