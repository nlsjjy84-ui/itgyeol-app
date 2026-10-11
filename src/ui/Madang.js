import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Path, G, Line, Ellipse } from 'react-native-svg';
import { colors, getThemeMode } from '../theme';

// 놀이 마당 배경 — 모든 놀이판 뒤에 깔리는 그림.
//  yard  : 옆에서 본 마당 (하늘·해·먼 산·담장·흙바닥·풀) — 줄넘기·투호·자치기·비석치기·굴렁쇠 등
//  court : 위에서 본 흙마당 (가운데 밝은 흙·자갈·멍석 테두리) — 구슬·팽이·딱지·상모·진법
//  sky   : 하늘 (구름 문양·먼 산 아래) — 연날리기
//  hanji : 한지 바탕 (섬유 결·옅은 정간) — 고무줄 순서·글자 판
// ground: 땅이 시작되는 높이(0~1, 위에서부터). 놀이가 그리는 땅선과 맞추고 싶을 때만 바꾼다.

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function palette() {
  const dark = getThemeMode() === 'dark';
  return dark
    ? { sky1: '#141b22', sky2: '#1f2a33', sun: '#e9d9a8', sunO: 0.85, hill1: '#2c3a44', hill2: '#24313a', wall: '#2e2a26', roof: '#3b4650', earth1: '#3a3128', earth2: '#2d261f', grass: '#4f7a5c', pebble: '#57493b', line: colors.gold, cloud: '#9fb0b8', court1: '#3d342a', court2: '#2b241d', mat: '#5a4a35' }
    : { sky1: '#f4ece0', sky2: '#fbf7ef', sun: colors.jeok, sunO: 0.78, hill1: '#c9d2cc', hill2: '#aebcb4', wall: '#e3d6bf', roof: '#5b646b', earth1: '#e6d3ad', earth2: '#d8c194', grass: '#7c9a6a', pebble: '#b9a27a', line: colors.accent, cloud: '#ffffff', court1: '#efe0c0', court2: '#dcc79c', mat: '#c4a676' };
}

function Yard({ p, ground, seed, sun }) {
  const gy = ground * 340;
  const r = rng(seed);
  const tufts = Array.from({ length: 9 }).map(() => ({ x: 10 + r() * 280, y: gy + 14 + r() * (340 - gy - 22), s: 0.7 + r() * 0.6 }));
  const pebbles = Array.from({ length: 14 }).map(() => ({ x: r() * 300, y: gy + 6 + r() * (340 - gy - 8), rx: 1.4 + r() * 2.4 }));
  return (
    <G>
      <Defs>
        <LinearGradient id="ysky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.sky1} />
          <Stop offset="1" stopColor={p.sky2} />
        </LinearGradient>
        <LinearGradient id="yearth" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.earth1} />
          <Stop offset="1" stopColor={p.earth2} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height={gy} fill="url(#ysky)" />
      {sun ? <Circle cx="238" cy={Math.min(62, gy * 0.32)} r="24" fill={p.sun} opacity={p.sunO} /> : null}
      {/* 먼 산 두 겹 — 수묵 느낌 */}
      <Path d={`M0 ${gy - 34} C 40 ${gy - 78}, 70 ${gy - 70}, 104 ${gy - 44} S 170 ${gy - 92}, 214 ${gy - 52} S 270 ${gy - 70}, 300 ${gy - 46} L300 ${gy} L0 ${gy} Z`} fill={p.hill1} opacity="0.9" />
      <Path d={`M0 ${gy - 16} C 50 ${gy - 44}, 92 ${gy - 30}, 132 ${gy - 18} S 214 ${gy - 46}, 300 ${gy - 20} L300 ${gy} L0 ${gy} Z`} fill={p.hill2} opacity="0.9" />
      {/* 낮은 흙담 + 기와 지붕선 */}
      <Rect x="0" y={gy - 14} width="300" height="14" fill={p.wall} />
      <Path d={`M-4 ${gy - 14} L304 ${gy - 14} L300 ${gy - 19} L0 ${gy - 19} Z`} fill={p.roof} />
      {Array.from({ length: 16 }).map((_, i) => (
        <Path key={i} d={`M${i * 20} ${gy - 19} q10 -4 20 0`} stroke={p.roof} strokeWidth="2.2" fill="none" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <Rect key={`b${i}`} x={18 + i * 50} y={gy - 10} width="14" height="6" rx="1" fill={p.roof} opacity="0.18" />
      ))}
      {/* 흙바닥 */}
      <Rect x="0" y={gy} width="300" height={340 - gy} fill="url(#yearth)" />
      <Line x1="0" y1={gy + 0.5} x2="300" y2={gy + 0.5} stroke={p.roof} strokeOpacity="0.25" strokeWidth="1" />
      {pebbles.map((q, i) => (
        <Ellipse key={`p${i}`} cx={q.x} cy={q.y} rx={q.rx} ry={q.rx * 0.6} fill={p.pebble} opacity="0.55" />
      ))}
      {tufts.map((t, i) => (
        <Path
          key={`t${i}`}
          d={`M${t.x} ${t.y} l${-3 * t.s} ${-7 * t.s} M${t.x} ${t.y} l0 ${-9 * t.s} M${t.x} ${t.y} l${3 * t.s} ${-7 * t.s}`}
          stroke={p.grass}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}

function Court({ p, seed }) {
  const r = rng(seed);
  const pebbles = Array.from({ length: 34 }).map(() => ({ x: 14 + r() * 272, y: 14 + r() * 312, rx: 1 + r() * 2.6, o: 0.3 + r() * 0.4 }));
  const scuffs = Array.from({ length: 7 }).map(() => ({ x: 30 + r() * 240, y: 30 + r() * 280, w: 18 + r() * 30, a: r() * 180 }));
  return (
    <G>
      <Defs>
        <RadialGradient id="cearth" cx="50%" cy="50%" r="70%">
          <Stop offset="0" stopColor={p.court1} />
          <Stop offset="1" stopColor={p.court2} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="340" fill="url(#cearth)" />
      {scuffs.map((s, i) => (
        <Path key={`s${i}`} d={`M${s.x} ${s.y} q${s.w / 2} -4 ${s.w} 0`} stroke={p.pebble} strokeOpacity="0.35" strokeWidth="1.2" fill="none" transform={`rotate(${s.a} ${s.x} ${s.y})`} />
      ))}
      {pebbles.map((q, i) => (
        <Ellipse key={`p${i}`} cx={q.x} cy={q.y} rx={q.rx} ry={q.rx * 0.7} fill={p.pebble} opacity={q.o} />
      ))}
      {/* 멍석 테두리 — 짚을 엮은 결 */}
      <Rect x="5" y="5" width="290" height="330" fill="none" stroke={p.mat} strokeWidth="6" strokeDasharray="5 3" opacity="0.7" />
      <Rect x="11" y="11" width="278" height="318" fill="none" stroke={p.mat} strokeWidth="1" opacity="0.6" />
    </G>
  );
}

function Sky({ p, seed }) {
  const r = rng(seed);
  const clouds = Array.from({ length: 5 }).map(() => ({ x: 20 + r() * 240, y: 20 + r() * 200, s: 0.7 + r() * 0.7 }));
  const sky1 = getThemeMode() === 'dark' ? '#16212b' : '#d9e9f2';
  const sky2 = getThemeMode() === 'dark' ? '#22313c' : '#f3f7f4';
  return (
    <G>
      <Defs>
        <LinearGradient id="ssky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky1} />
          <Stop offset="1" stopColor={sky2} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="340" fill="url(#ssky)" />
      {/* 전통 구름 문양(운문) — 소용돌이 두 개를 이은 모양 */}
      {clouds.map((c, i) => (
        <G key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`} opacity="0.75">
          <Path d="M0 10 q0 -10 10 -10 q10 0 10 8 q4 -6 10 -2 q6 4 2 10 Z" fill={p.cloud} />
          <Path d="M8 6 q4 -4 7 0 M22 8 q3 -3 5 0" stroke={colors.cheong} strokeOpacity="0.35" strokeWidth="1" fill="none" />
        </G>
      ))}
      <Path d="M0 316 C 50 286, 90 294, 130 308 S 220 282, 300 304 L300 340 L0 340 Z" fill={p.hill1} opacity="0.9" />
      <Path d="M0 330 C 70 314, 140 322, 190 330 S 260 318, 300 326 L300 340 L0 340 Z" fill={p.hill2} />
    </G>
  );
}

function HanjiBg({ p, seed }) {
  const r = rng(seed);
  const fibers = Array.from({ length: 120 }).map(() => {
    const x = r() * 300;
    const y = r() * 340;
    const a = r() * Math.PI;
    const l = 3 + r() * 8;
    return { x, y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l, o: 0.06 + r() * 0.1 };
  });
  return (
    <G>
      <Rect x="0" y="0" width="300" height="340" fill={colors.paper} />
      {fibers.map((f, i) => (
        <Line key={i} x1={f.x} y1={f.y} x2={f.x2} y2={f.y2} stroke={colors.fiber} strokeWidth="0.7" strokeOpacity={f.o} />
      ))}
      <Rect x="8" y="8" width="284" height="324" fill="none" stroke={p.line} strokeOpacity="0.35" strokeWidth="1" />
    </G>
  );
}

export default function Madang({ variant = 'yard', ground = 0.72, seed = 7, sun = true, style }) {
  const p = palette();
  const body = useMemo(() => {
    switch (variant) {
      case 'court':
        return <Court p={p} seed={seed} />;
      case 'sky':
        return <Sky p={p} seed={seed} />;
      case 'hanji':
        return <HanjiBg p={p} seed={seed} />;
      default:
        return <Yard p={p} ground={ground} seed={seed} sun={sun} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, ground, seed, sun, getThemeMode()]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 340" preserveAspectRatio="none">
        {body}
      </Svg>
    </View>
  );
}
