import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse, Line, G } from 'react-native-svg';
import Text from './Text';
import { colors } from '../theme';

// 도장 아이콘 — 그림(누구나 알아보는 모양) + 우리말 한 글자(도장 귀퉁이).
// 아이·외국인은 그림으로, 한국어 사용자는 글자로 바로 알아본다.
function Picto({ kind, s, fg }) {
  const sw = 2.2; // 선 굵기(24 기준)
  const p = { stroke: fg, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  let body = null;
  switch (kind) {
    case 'book': // 펼친 그림책
      body = (
        <G {...p}>
          <Path d="M12 6.5C9.5 5 6 4.6 3 5v13c3-.4 6.5 0 9 1.5 2.5-1.5 6-1.9 9-1.5V5c-3-.4-6.5 0-9 1.5z" />
          <Line x1="12" y1="6.5" x2="12" y2="19.5" />
        </G>
      );
      break;
    case 'jar': // 달항아리 — 전통 자료실
      body = (
        <G {...p}>
          <Path d="M9 4h6M9.5 4c0 1.6-5.5 3-5.5 8.5S7.8 20 12 20s8-2 8-7.5S14.5 5.6 14.5 4" />
          <Path d="M5.2 12.5h13.6" strokeOpacity={0.55} />
        </G>
      );
      break;
    case 'quilt': // 조각보 — 예시 작품
      body = (
        <G {...p}>
          <Rect x="4" y="4" width="16" height="16" rx="1" />
          <Path d="M4 11h9M13 4v16M13 14h7M8.5 11v9" />
        </G>
      );
      break;
    case 'idea': // 말풍선 + 반짝 — 떠오르는 것 다시 고르기
      body = (
        <G {...p}>
          <Path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" />
          <Path d="M12 8v4M10 10h4" />
        </G>
      );
      break;
    case 'circle': // 원진 — 둥글게 선 사람들
      body = (
        <G>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            return <Circle key={i} cx={12 + Math.cos(a) * 7.5} cy={12 + Math.sin(a) * 7.5} r={1.9} fill={fg} />;
          })}
          <Circle cx="12" cy="12" r="2.2" fill="none" stroke={fg} strokeWidth={1.4} />
        </G>
      );
      break;
    case 'type': // 활자 한 벌
      body = (
        <G {...p}>
          <Rect x="3.5" y="5" width="7.5" height="7.5" rx="0.8" />
          <Rect x="13" y="5" width="7.5" height="7.5" rx="0.8" />
          <Rect x="8.2" y="14" width="7.5" height="6" rx="0.8" />
          <Path d="M5.5 7.3h3.5v3M15 7.3v3h3.5" />
        </G>
      );
      break;
    case 'top': // 팽이
      body = (
        <G {...p}>
          <Path d="M4 9.5h16L12 21z" />
          <Ellipse cx="12" cy="9.5" rx="8" ry="2.6" />
          <Line x1="12" y1="3" x2="12" y2="7" />
        </G>
      );
      break;
    case 'blocks': // 쌓은 블록
      body = (
        <G {...p}>
          <Rect x="4" y="13" width="6" height="6" />
          <Rect x="10" y="13" width="6" height="6" />
          <Rect x="10" y="7" width="6" height="6" />
          <Rect x="16" y="13" width="4" height="6" />
          <Path d="M7 4v4" />
        </G>
      );
      break;
    case 'mask': // 탈
      body = (
        <G {...p}>
          <Path d="M12 3c4.5 0 7.5 3.2 7.5 8.2 0 5.2-3.5 9.8-7.5 9.8S4.5 16.4 4.5 11.2C4.5 6.2 7.5 3 12 3z" />
          <Path d="M8 10.2q1.4-1.4 2.8 0M13.2 10.2q1.4-1.4 2.8 0M9 15.5q3 2.2 6 0" />
        </G>
      );
      break;
    case 'colors': // 오방색 띠 — 단청
      body = (
        <G>
          {['#2b5f8e', '#b3322b', '#c8982b', '#f3efe6', '#1b2227'].map((c, i) => (
            <Rect key={i} x={3.5 + i * 3.5} y="4" width="3" height="16" rx="0.6" fill={c} stroke={fg} strokeWidth={0.6} />
          ))}
        </G>
      );
      break;
    default:
      body = <Circle cx="12" cy="12" r="7" {...p} />;
  }
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

export default function SealIcon({ kind, letter, size = 60, bg = colors.accent, fg = colors.baek, tilt = true, style }) {
  // 도장 안에 그림(위)과 우리말 한 글자(아래)를 함께 넣는다.
  const pic = Math.round(size * (letter ? 0.46 : 0.62));
  const fs = Math.round(size * 0.42);
  return (
    <View
      style={[
        st.seal,
        { width: size, height: size, backgroundColor: bg },
        tilt && { transform: [{ rotate: '-3deg' }] },
        style,
      ]}
    >
      <Picto kind={kind} s={pic} fg={fg} />
      {letter ? (
        <Text brush style={{ color: fg, fontSize: fs, lineHeight: Math.round(fs * 1.05), marginTop: -Math.round(size * 0.02) }}>
          {letter}
        </Text>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  seal: { borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.25)', overflow: 'hidden' },
});
