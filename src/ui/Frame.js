import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

// 병풍·편액처럼 이중 테두리를 두른 패널. 모서리에 작은 네모 장식을 단다.
export default function Frame({ children, style, tone = 'light', accent }) {
  const line = accent || colors.accent;
  const dark = tone === 'dark';
  return (
    <View
      style={[
        styles.outer,
        { borderColor: dark ? colors.gold : colors.ink, backgroundColor: dark ? colors.night : colors.paper },
        style,
      ]}
    >
      <View style={[styles.inner, { borderColor: dark ? colors.gold : line }]} pointerEvents="none" />
      {['tl', 'tr', 'bl', 'br'].map((k) => (
        <View key={k} pointerEvents="none" style={[styles.corner, styles[k], { backgroundColor: dark ? colors.gold : line }]} />
      ))}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 2, borderRadius: 4, padding: 0 },
  inner: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderWidth: 1, borderRadius: 2 },
  content: { padding: 14 },
  corner: { position: 'absolute', width: 7, height: 7 },
  tl: { top: 1, left: 1 },
  tr: { top: 1, right: 1 },
  bl: { bottom: 1, left: 1 },
  br: { bottom: 1, right: 1 },
});
