import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { fonts } from '../theme';

// 앱 전체 글자는 이 Text를 쓴다 — 굵기(fontWeight)에 맞춰 명조 계열 서체를 자동으로 고른다.
// brush 속성을 주면 붓글씨체(큰 제목·도장 글씨용)를 쓴다.
export default function Text({ style, brush, ...rest }) {
  const flat = StyleSheet.flatten(style) || {};
  const w = flat.fontWeight;
  let family = fonts.serif;
  if (brush) family = fonts.brush;
  else if (w === '800' || w === '900') family = fonts.serifHeavy;
  else if (w === 'bold' || w === '700' || w === '600') family = fonts.serifBold;
  // 서체 자체가 굵기를 담고 있으므로 fontWeight는 지워서 가짜 굵기(이중 굵기)를 막는다.
  const { fontWeight, ...restStyle } = flat;
  return <RNText {...rest} style={[{ fontFamily: family }, restStyle]} />;
}
