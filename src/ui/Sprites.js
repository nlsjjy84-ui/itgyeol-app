import React from 'react';
import Svg, { Rect, Path, Circle, G, Line, Ellipse, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

// 전래놀이 물건 그림 — 네모·동그라미 대신 실제 모양을 단순하게 그린다.

// 딱지: 종이 두 장을 엇갈려 접은 모양(가운데 X자 접힘선 + 바람개비 무늬)
export function Ddakji({ size = 64, color = '#2b5f8e', back = '#c8982b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="4" y="4" width="56" height="56" rx="3" fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <Path d="M4 4 L32 32 L60 4 Z" fill={back} opacity="0.95" />
      <Path d="M4 60 L32 32 L60 60 Z" fill={back} opacity="0.75" />
      <Path d="M4 4 L60 60 M60 4 L4 60" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" />
      <Rect x="4" y="4" width="56" height="56" rx="3" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </Svg>
  );
}

// 방패연: 직사각형, 가운데 둥근 방구멍, 위쪽 꼭지 띠(색), 살대
export function BangpaeKite({ size = 48, color = '#b3322b' }) {
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 48 60">
      <Rect x="3" y="3" width="42" height="54" rx="1.5" fill="#fbf7ef" stroke="#3a2f25" strokeWidth="1.6" />
      <Rect x="3" y="3" width="42" height="11" fill={color} />
      <Path d="M3 57 L45 57 L45 49 Q24 54 3 49 Z" fill={color} opacity="0.55" />
      <Circle cx="24" cy="30" r="8.5" fill="none" stroke="#3a2f25" strokeWidth="1.4" />
      <Circle cx="24" cy="30" r="7.6" fill="rgba(120,170,210,0.35)" />
      <Line x1="24" y1="3" x2="24" y2="57" stroke="#3a2f25" strokeWidth="0.9" opacity="0.7" />
      <Line x1="3" y1="3" x2="45" y2="57" stroke="#3a2f25" strokeWidth="0.7" opacity="0.5" />
      <Line x1="45" y1="3" x2="3" y2="57" stroke="#3a2f25" strokeWidth="0.7" opacity="0.5" />
    </Svg>
  );
}

// 팽이(위에서 본 모습): 나무 결 동심원 + 오방색 띠 + 가운데 꼭지. spin(도)으로 돌아가는 느낌
export function TopView({ size = 52, color = '#b3322b', spin = 0 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      <Circle cx="26" cy="26" r="24" fill="#c99a62" stroke="#5a3d22" strokeWidth="2" />
      <G transform={`rotate(${spin} 26 26)`}>
        <Path d="M26 2 A24 24 0 0 1 50 26 L26 26 Z" fill={color} opacity="0.85" />
        <Path d="M26 50 A24 24 0 0 1 2 26 L26 26 Z" fill="#2b5f8e" opacity="0.8" />
        <Path d="M50 26 A24 24 0 0 1 26 50 L26 26 Z" fill="#c8982b" opacity="0.7" />
      </G>
      <Circle cx="26" cy="26" r="15" fill="none" stroke="#5a3d22" strokeWidth="1" opacity="0.6" />
      <Circle cx="26" cy="26" r="8" fill="none" stroke="#5a3d22" strokeWidth="1" opacity="0.6" />
      <Circle cx="26" cy="26" r="3.2" fill="#3a2a1a" />
    </Svg>
  );
}

// 비석치기 돌(세워 둔 납작한 돌): 둥근 머리 + 새김 선
export function StandStone({ width = 30, height = 48, fallen = false }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 30 48">
      <Path d="M3 46 L3 12 Q3 2 15 2 Q27 2 27 12 L27 46 Z" fill={fallen ? '#a3a79f' : '#7b766a'} stroke="#3f3b33" strokeWidth="1.5" />
      <Path d="M8 14 L22 14 M8 20 L19 20" stroke="#3f3b33" strokeWidth="1" opacity="0.5" />
      <Path d="M6 40 Q15 37 24 40" stroke="#fff" strokeWidth="1" opacity="0.25" fill="none" />
    </Svg>
  );
}

// 투호 병: 긴 목 + 둥근 몸통, 목 양옆에 둥근 귀(옆 구멍). 청동 빛 그라데이션
export function TuhoJar({ width = 40, height = 64 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 64">
      <Defs>
        <LinearGradient id="tjb" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#4d3a22" />
          <Stop offset="0.35" stopColor="#b08a4a" />
          <Stop offset="0.6" stopColor="#7d5f33" />
          <Stop offset="1" stopColor="#3a2b18" />
        </LinearGradient>
      </Defs>
      {/* 귀 두 개 */}
      <Rect x="3" y="10" width="7" height="12" rx="3" fill="url(#tjb)" stroke="#2a1f10" strokeWidth="0.8" />
      <Rect x="30" y="10" width="7" height="12" rx="3" fill="url(#tjb)" stroke="#2a1f10" strokeWidth="0.8" />
      <Ellipse cx="6.5" cy="10.5" rx="3" ry="1.4" fill="#1d150a" />
      <Ellipse cx="33.5" cy="10.5" rx="3" ry="1.4" fill="#1d150a" />
      {/* 목 */}
      <Path d="M14 4 L26 4 L25 26 L15 26 Z" fill="url(#tjb)" stroke="#2a1f10" strokeWidth="0.8" />
      <Ellipse cx="20" cy="4" rx="6.5" ry="2" fill="#1d150a" stroke="#b08a4a" strokeWidth="0.8" />
      {/* 몸통 */}
      <Path d="M15 26 C 4 30, 2 44, 6 54 C 10 62, 30 62, 34 54 C 38 44, 36 30, 25 26 Z" fill="url(#tjb)" stroke="#2a1f10" strokeWidth="0.9" />
      <Path d="M8 40 Q20 44 32 40" stroke="#e2c88a" strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <Rect x="12" y="60" width="16" height="3" rx="1" fill="#3a2b18" />
    </Svg>
  );
}

// 투호 화살: 가는 대나무 살 + 깃
export function TuhoArrow({ length = 30, color = '#b3322b' }) {
  return (
    <Svg width={length} height={8} viewBox={`0 0 ${length} 8`}>
      <Line x1="2" y1="4" x2={length - 2} y2="4" stroke="#c9a46a" strokeWidth="1.8" />
      <Path d={`M${length - 8} 4 L${length - 2} 1 L${length - 2} 7 Z`} fill={color} />
      <Path d="M2 4 L6 2.5 L6 5.5 Z" fill="#5a3d22" />
    </Svg>
  );
}

// 유리구슬: 빛 반사 + 안의 무늬(꽃잎)
export function Marble({ size = 22, color = '#2b8f6a' }) {
  const id = `mg${color.replace('#', '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Defs>
        <RadialGradient id={id} cx="38%" cy="32%" r="70%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <Stop offset="0.25" stopColor={color} stopOpacity="0.55" />
          <Stop offset="1" stopColor={color} stopOpacity="0.95" />
        </RadialGradient>
      </Defs>
      <Circle cx="11" cy="11" r="10" fill={`url(#${id})`} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      <Path d="M11 11 C 7 6, 14 5, 11 11 C 16 9, 16 15, 11 11 C 12 16, 6 15, 11 11" fill={color} opacity="0.9" />
      <Circle cx="7.5" cy="6.8" r="2.2" fill="#fff" opacity="0.85" />
    </Svg>
  );
}

// 굴렁쇠: 쇠테(은빛 그라데이션) — 굴렁대는 따로
export function HoopRing({ size = 52, spin = 0 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      <Defs>
        <LinearGradient id="hr" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#e9ecef" />
          <Stop offset="0.5" stopColor="#7d858c" />
          <Stop offset="1" stopColor="#c9ced3" />
        </LinearGradient>
      </Defs>
      <Circle cx="26" cy="26" r="22" fill="none" stroke="#3b4148" strokeWidth="6" />
      <Circle cx="26" cy="26" r="22" fill="none" stroke="url(#hr)" strokeWidth="4" />
      <G transform={`rotate(${spin} 26 26)`}>
        <Circle cx="26" cy="4" r="1.6" fill="#fff" opacity="0.8" />
        <Circle cx="26" cy="48" r="1.2" fill="#fff" opacity="0.5" />
      </G>
    </Svg>
  );
}
