import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, G, Line, Path, Polyline, Ellipse, Text as SvgText } from 'react-native-svg';
import Text from './Text';
import { colors } from '../theme';
import { useRaf } from '../components/minigames/common';
import { t as i18nT } from '../i18n';
import { forDevice } from '../utils/touchText';

// ── 시범(하는 방법 보여 주기) ────────────────────────────────────
// 놀이를 시작하기 전에, 손가락 그림이 직접 해 보이는 짧은 움직임(3~4초, 계속 되풀이)을 보여 준다.
// 글로만 설명하면 처음 온 관람객(어린이·어르신·외국인)이 어디를 어떻게 누르는지 알기 어렵다.
// 움직임은 놀이 종류(kind)마다 하나씩 — 같은 kind는 여러 놀이가 함께 쓴다.
// 움직임의 단계(phase 0·1·2)가 아래 설명 줄(steps)과 짝지어져, 지금 하는 줄이 밝게 표시된다.
//
// demo = { kind, ...옵션 }   kind 목록과 쓰는 놀이는 아래 KINDS 주석 참고

const W = 320;
const H = 160;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a)); // t가 a~b 사이에서 0→1
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const mix = (a, b, u) => a + (b - a) * u;
const at = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];

// 손가락 그림 — (x, y)가 손끝. down이면 눌린 모양(살짝 내려감) + 물결
function Hand({ x, y, down, ink }) {
  const dy = down ? 2 : 0;
  return (
    <G transform={`translate(${x}, ${y + dy})`}>
      {down ? <Circle cx={0} cy={-dy} r={11} fill="none" stroke={colors.accent} strokeWidth={2} opacity={0.6} /> : null}
      <Rect x={-4.5} y={0} width={9} height={20} rx={4.5} fill="#fffaf2" stroke={ink} strokeWidth={1.4} />
      <Rect x={-11} y={15} width={22} height={19} rx={7} fill="#fffaf2" stroke={ink} strokeWidth={1.4} />
      <Ellipse cx={-12} cy={22} rx={4} ry={6} fill="#fffaf2" stroke={ink} strokeWidth={1.2} transform="rotate(-25 -12 22)" />
      <Line x1={-3} y1={18} x2={-3} y2={24} stroke={ink} strokeWidth={0.8} opacity={0.5} />
      <Line x1={3} y1={18} x2={3} y2={24} stroke={ink} strokeWidth={0.8} opacity={0.5} />
    </G>
  );
}

const Check = ({ x, y, show }) => (show ? (
  <G>
    <Circle cx={x} cy={y} r={12} fill={colors.green} />
    <Path d={`M${x - 6} ${y} l4 4 l8 -9`} stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" />
  </G>
) : null);

const Lbl = ({ x, y, s, size = 11, color, anchor = 'middle', bold }) => (
  <SvgText x={x} y={y} fontSize={size} fill={color || colors.ink} textAnchor={anchor} fontWeight={bold ? '700' : '400'}>{s}</SvgText>
);

// 손이 오른쪽 아래 밖에서 들어와 p에 닿는다
const enter = (t, a, b, p) => at([W + 20, H + 10], p, ease(seg(t, a, b)));

// ── 놀이 종류별 움직임 ────────────────────────────────────────
// 각 함수는 (t초, 옵션) → { node: 그림, hand: {x,y,down}, phase }
const KINDS = {
  // 끌어다 놓기 — 진법(일자진·방진), 훈민정음(자모·식자·목판)
  drag: { len: 3.4, f: (t, o, ink) => {
    const A = [70, 110], B = [240, 58];
    const u = ease(seg(t, 0.8, 2.0));
    const piece = t < 0.8 ? A : at(A, B, u);
    const down = t >= 0.55 && t < 2.1;
    const hand = t < 0.55 ? { ...xy(enter(t, 0, 0.55, A)), down: false } : t < 2.1 ? { ...xy(piece), down } : { ...xy(at(B, [B[0] + 40, B[1] + 50], seg(t, 2.1, 2.7))), down: false };
    const done = t >= 2.1;
    return {
      phase: t < 0.8 ? 0 : t < 2.1 ? 1 : 2, hand,
      node: (
        <G>
          <Rect x={B[0] - 18} y={B[1] - 18} width={36} height={36} rx={4} fill="none" stroke={colors.fiber} strokeDasharray="4 3" strokeWidth={1.5} />
          <Rect x={piece[0] - 16} y={piece[1] - 16} width={32} height={32} rx={4} fill={o.color || colors.hwang} stroke={ink} strokeWidth={1.2} />
          <Lbl x={piece[0]} y={piece[1] + 5} s={o.label || '1'} size={15} color="#fff" bold />
          <Check x={B[0] + 26} y={B[1] - 20} show={done} />
        </G>
      ),
    };
  } },
  // 하나 누르고 다른 하나 누르면 자리 바꾸기·짝짓기 — 진법(원진), 훈민정음(상형 원리)
  swap: { len: 3.4, f: (t, o, ink) => {
    const A = [90, 80], B = [230, 80];
    const s = ease(seg(t, 1.7, 2.3));
    const pa = o.match ? A : at(A, B, s), pb = o.match ? B : at(B, A, s);
    const hand = t < 0.6 ? { ...xy(enter(t, 0, 0.6, A)), down: false } : t < 1.0 ? { ...xy(A), down: t > 0.75 } : t < 1.5 ? { ...xy(at(A, B, ease(seg(t, 1.0, 1.4)))), down: false } : { ...xy(B), down: t > 1.5 && t < 1.75 };
    const hiA = t > 0.75, hiB = t > 1.5;
    return {
      phase: t < 1.0 ? 0 : t < 1.8 ? 1 : 2, hand,
      node: (
        <G>
          {o.match ? <Line x1={A[0]} y1={A[1]} x2={mix(A[0], B[0], seg(t, 1.6, 2.1))} y2={B[1]} stroke={colors.accent} strokeWidth={2.5} /> : null}
          <Circle cx={pa[0]} cy={pa[1]} r={20} fill={hiA ? colors.accentSoft : colors.paper} stroke={hiA ? colors.accent : ink} strokeWidth={2} />
          <Lbl x={pa[0]} y={pa[1] + 5} s={o.a || '3'} size={15} bold />
          <Circle cx={pb[0]} cy={pb[1]} r={20} fill={hiB ? colors.accentSoft : colors.paper} stroke={hiB ? colors.accent : ink} strokeWidth={2} />
          <Lbl x={pb[0]} y={pb[1] + 5} s={o.match ? i18nT(o.b) : o.b || '1'} size={o.match ? 10 : 15} bold />
          <Check x={160} y={130} show={t > 2.3} />
        </G>
      ),
    };
  } },
  // 차례대로 누르기 — 진법(고사리꺾기), 훈민정음(서문 조판), 단청 칠하기
  tapSeq: { len: 3.6, f: (t, o, ink) => {
    const n = o.n || 4;
    const pts = Array.from({ length: n }, (_, i) => [60 + (i * 200) / (n - 1), 80 + (i % 2 ? -22 : 22)]);
    const tt = [0.7, 1.3, 1.9, 2.5, 3.0].slice(0, n);
    let k = tt.findIndex((x) => t < x);
    if (k < 0) k = n;
    const target = pts[Math.min(n - 1, k)];
    const prev = pts[Math.max(0, k - 1)];
    const pos = k === 0 ? enter(t, 0, tt[0] - 0.1, target) : k >= n ? at(pts[n - 1], [pts[n - 1][0] + 30, 150], seg(t, tt[n - 1] + 0.2, tt[n - 1] + 0.7)) : at(prev, target, ease(seg(t, tt[k - 1] + 0.1, tt[k] - 0.1)));
    const down = tt.some((x) => t >= x - 0.12 && t < x + 0.08);
    return {
      phase: k === 0 ? 0 : k < n ? 1 : 2, hand: { ...xy(pos), down },
      node: (
        <G>
          {pts.map((p, i) => {
            const on = t >= tt[i];
            const fill = on ? ((o.colors && o.colors[i]) || colors.accent) : colors.paper;
            return (
              <G key={i}>
                <Circle cx={p[0]} cy={p[1]} r={18} fill={fill} stroke={ink} strokeWidth={1.6} />
                <Lbl x={p[0]} y={p[1] + 5} s={(o.labels && o.labels[i]) || String(i + 1)} size={13} color={on ? '#fff' : ink} bold />
              </G>
            );
          })}
          <Check x={290} y={30} show={t >= tt[n - 1] + 0.1} />
        </G>
      ),
    };
  } },
  // 길 따라 그리기 — 진법(을자진: 구불구불 길, 기와밟기: 기와 곡선)
  trace: { len: 3.6, f: (t, o, ink) => {
    const P = (u) => (o.shape === 'roof'
      ? [40 + u * 240, 110 - Math.sin(u * Math.PI) * 55 + Math.sin(u * Math.PI * 3) * 4]
      : [40 + u * 240, 80 + Math.sin(u * Math.PI * 2.5) * 38]);
    const u = seg(t, 0.8, 2.8);
    const pts = Array.from({ length: 41 }, (_, i) => P(i / 40));
    const drawn = pts.filter((_, i) => i / 40 <= u);
    const hp = t < 0.8 ? enter(t, 0, 0.7, P(0)) : t < 2.9 ? P(u) : at(P(1), [P(1)[0], 150], seg(t, 2.9, 3.4));
    return {
      phase: t < 0.8 ? 0 : t < 2.8 ? 1 : 2, hand: { ...xy(hp), down: t >= 0.8 && t < 2.9 },
      node: (
        <G>
          <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.fiber} strokeWidth={o.shape === 'roof' ? 2 : 16} strokeDasharray={o.shape === 'roof' ? '5 4' : undefined} opacity={o.shape === 'roof' ? 1 : 0.25} strokeLinecap="round" />
          {drawn.length > 1 ? <Polyline points={drawn.map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.accent} strokeWidth={4} strokeLinecap="round" /> : null}
          <Circle cx={P(0)[0]} cy={P(0)[1]} r={6} fill={colors.green} />
          <Lbl x={P(0)[0]} y={P(0)[1] + 22} s={i18nT('출발')} size={10} />
          <Check x={P(1)[0]} y={P(1)[1] - 22} show={t >= 2.8} />
        </G>
      ),
    };
  } },
  // 학익진: 한쪽 날개를 끌어 벌리면 반대쪽도 거울처럼
  wing: { len: 3.4, f: (t, o, ink) => {
    const u = ease(seg(t, 0.8, 2.1));
    const tip = [mix(200, 280, u), mix(80, 45, u)];
    const left = [320 - tip[0], tip[1]];
    const hand = t < 0.8 ? { ...xy(enter(t, 0, 0.75, [200, 80])), down: false } : t < 2.2 ? { ...xy(tip), down: true } : { ...xy(at(tip, [tip[0] + 20, 140], seg(t, 2.2, 2.8))), down: false };
    return {
      phase: t < 0.8 ? 0 : t < 2.1 ? 1 : 2, hand,
      node: (
        <G>
          <Line x1={160} y1={95} x2={285} y2={45} stroke={colors.fiber} strokeDasharray="4 3" strokeWidth={2} />
          <Line x1={160} y1={95} x2={35} y2={45} stroke={colors.fiber} strokeDasharray="4 3" strokeWidth={2} />
          <Line x1={160} y1={95} x2={tip[0]} y2={tip[1]} stroke={colors.cheong} strokeWidth={6} strokeLinecap="round" />
          <Line x1={160} y1={95} x2={left[0]} y2={left[1]} stroke={colors.cheong} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={160} cy={100} r={14} fill={colors.accent} />
          <Check x={160} y={40} show={t >= 2.1} />
        </G>
      ),
    };
  } },
  // 구슬치기: 내 구슬을 뒤로 끌었다 놓으면 튕겨 나간다
  sling: { len: 3.4, f: (t, o, ink) => {
    const rest = [160, 100];
    const pull = ease(seg(t, 0.8, 1.6));
    const shot = seg(t, 1.7, 2.1);
    const me = t < 1.7 ? [160, mix(100, 140, pull)] : [160, mix(140, 52, ease(shot))];
    const hit = t > 2.1;
    const other = hit ? [mix(160, 230, seg(t, 2.1, 2.6)), mix(40, 10, seg(t, 2.1, 2.6))] : [160, 40];
    const hand = t < 0.8 ? { ...xy(enter(t, 0, 0.75, rest)), down: false } : t < 1.7 ? { ...xy([me[0], me[1]]), down: true } : { ...xy(at([160, 140], [200, 150], seg(t, 1.7, 2.2))), down: false };
    return {
      phase: t < 0.8 ? 0 : t < 1.7 ? 1 : 2, hand,
      node: (
        <G>
          <Circle cx={160} cy={70} r={60} fill="none" stroke={colors.fiber} strokeWidth={1.5} />
          {t > 0.8 && t < 1.7 ? <Line x1={160} y1={100} x2={me[0]} y2={me[1]} stroke={colors.accent} strokeWidth={2} strokeDasharray="3 3" /> : null}
          <Circle cx={other[0]} cy={other[1]} r={9} fill={colors.cheong} />
          <Circle cx={me[0]} cy={me[1]} r={10} fill={colors.hwang} stroke={ink} strokeWidth={1} />
          <Check x={270} y={30} show={t > 2.6} />
        </G>
      ),
    };
  } },
  // 비석치기: 돌을 위로 휙 쓸어 던지기
  flick: { len: 3.2, f: (t, o, ink) => {
    const st0 = [160, 135];
    const fly = ease(seg(t, 1.1, 1.7));
    const stone = t < 1.1 ? st0 : [mix(160, 200, fly), mix(135, 50, fly) - Math.sin(fly * Math.PI) * 20];
    const tip = t > 1.7 ? seg(t, 1.7, 2.0) : 0;
    const hand = t < 0.6 ? { ...xy(enter(t, 0, 0.55, st0)), down: false } : t < 1.1 ? { ...xy(at(st0, [168, 90], ease(seg(t, 0.75, 1.1)))), down: t > 0.6 && t < 1.05 } : { ...xy(at([168, 90], [230, 150], seg(t, 1.1, 1.6))), down: false };
    return {
      phase: t < 0.75 ? 0 : t < 1.7 ? 1 : 2, hand,
      node: (
        <G>
          <Line x1={160} y1={130} x2={200} y2={50} stroke={colors.fiber} strokeDasharray="3 4" strokeWidth={1.5} />
          <G transform={`rotate(${tip * 70} 206 62)`}>
            <Rect x={196} y={28} width={20} height={34} rx={6} fill="#8d8f8a" stroke={ink} strokeWidth={1} />
          </G>
          <Ellipse cx={stone[0]} cy={stone[1]} rx={10} ry={7} fill="#6f716c" />
          <Check x={260} y={30} show={t > 2.0} />
        </G>
      ),
    };
  } },
  // 자치기: 위로 휙 → 알이 뜨면 옆으로 휙
  swipeUpSide: { len: 3.6, f: (t, o, ink) => {
    const up = seg(t, 0.9, 1.4), side = seg(t, 1.8, 2.5);
    const egg = t < 1.8 ? [110, mix(125, 60, ease(up))] : [mix(110, 300, side), mix(60, 25, side) - Math.sin(side * Math.PI) * 15];
    const hand = t < 0.6 ? { ...xy(enter(t, 0, 0.55, [110, 135])), down: false } : t < 1.4 ? { ...xy(at([110, 135], [110, 85], ease(seg(t, 0.8, 1.2)))), down: t < 1.25 } : t < 1.8 ? { ...xy(at([110, 85], [70, 70], seg(t, 1.4, 1.75))), down: false } : { ...xy(at([70, 70], [180, 65], ease(seg(t, 1.8, 2.1)))), down: t < 2.05 };
    return {
      phase: t < 1.4 ? 0 : t < 2.1 ? 1 : 2, hand,
      node: (
        <G>
          <Line x1={0} y1={135} x2={W} y2={135} stroke={colors.fiber} strokeWidth={1.5} />
          <Ellipse cx={110} cy={136} rx={16} ry={4} fill="#5a4a3a" opacity={0.6} />
          <Rect x={egg[0] - 12} y={egg[1] - 3} width={24} height={6} rx={3} fill="#a07c4f" stroke={ink} strokeWidth={0.8} />
          {[200, 250, 300].map((x, i) => <Lbl key={x} x={x} y={150} s={`${(i + 1) * 5}${i18nT('자')}`} size={9} color={colors.muted} />)}
          <Check x={290} y={30} show={t > 2.6} />
        </G>
      ),
    };
  } },
  // 상모돌리기: 빛나는 점을 따라 빙글빙글
  circle: { len: 3.6, f: (t, o, ink) => {
    const c = [160, 78], r = 52;
    const a = -Math.PI / 2 + Math.max(0, t - 0.6) * 2.6;
    const dot = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
    const ha = a - 0.25;
    const hp = t < 0.6 ? enter(t, 0, 0.55, [c[0] + Math.cos(-Math.PI / 2 - 0.25) * r, c[1] + Math.sin(-Math.PI / 2 - 0.25) * r]) : [c[0] + Math.cos(ha) * r, c[1] + Math.sin(ha) * r];
    const g = seg(t, 0.8, 3.2);
    return {
      phase: t < 0.8 ? 0 : t < 3.0 ? 1 : 2, hand: { ...xy(hp), down: t >= 0.6 },
      node: (
        <G>
          <Circle cx={c[0]} cy={c[1]} r={r} fill="none" stroke={colors.green} strokeDasharray="5 4" strokeWidth={2} />
          <Circle cx={dot[0]} cy={dot[1]} r={9} fill={colors.hwang} stroke="#fff" strokeWidth={2} />
          <Rect x={60} y={146} width={200} height={7} rx={3.5} fill={colors.borderSoft} />
          <Rect x={60} y={146} width={200 * g} height={7} rx={3.5} fill={colors.green} />
        </G>
      ),
    };
  } },
  // 팽이치기: 돌아다니는 팽이를 콕 눌러 치기
  tapTarget: { len: 3.6, f: (t, o, ink) => {
    const P = (s) => [160 + Math.cos(s * 1.3) * 80, 75 + Math.sin(s * 2.1) * 35];
    const top = P(t);
    const hits = [1.2, 2.4];
    const k = hits.findIndex((x) => t < x);
    const target = P(hits[Math.max(0, k)] || hits[1]);
    const hp = t < 1.0 ? enter(t, 0, 1.05, P(1.2)) : k === 1 ? at(P(1.2), P(2.4), ease(seg(t, 1.35, 2.3))) : k < 0 ? at(P(2.4), [P(2.4)[0] + 30, 150], seg(t, 2.6, 3.1)) : target;
    const down = hits.some((x) => t >= x - 0.1 && t < x + 0.1);
    const power = 0.3 + 0.3 * (t > 1.2) + 0.3 * (t > 2.4);
    return {
      phase: t < 1.2 ? 0 : t < 2.4 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          <Circle cx={160} cy={75} r={70} fill="none" stroke={colors.fiber} strokeDasharray="4 4" />
          <G transform={`rotate(${t * 720} ${top[0]} ${top[1]})`}>
            <Circle cx={top[0]} cy={top[1]} r={13} fill={colors.hwang} stroke={ink} strokeWidth={1} />
            <Line x1={top[0] - 13} y1={top[1]} x2={top[0] + 13} y2={top[1]} stroke={colors.accent} strokeWidth={3} />
          </G>
          <Rect x={110} y={146} width={100} height={7} rx={3.5} fill={colors.borderSoft} />
          <Rect x={110} y={146} width={100 * power} height={7} rx={3.5} fill={colors.green} />
        </G>
      ),
    };
  } },
  // 딱지치기: 꾹 눌러 들어 올렸다가 떼면 내리치기
  holdRelease: { len: 3.6, f: (t, o, ink) => {
    const lift = t < 0.8 ? 0 : t < 2.0 ? ease(seg(t, 0.8, 1.9)) : 1 - ease(seg(t, 2.0, 2.15));
    const me = [150, mix(105, 35, lift)];
    const flip = t > 2.2 ? seg(t, 2.2, 2.6) : 0;
    const hand = t < 0.8 ? { ...xy(enter(t, 0, 0.75, [260, 120])), down: false } : t < 2.0 ? { ...xy([260, 120]), down: true } : { ...xy(at([260, 120], [290, 150], seg(t, 2.0, 2.4))), down: false };
    return {
      phase: t < 0.8 ? 0 : t < 2.0 ? 1 : 2, hand,
      node: (
        <G>
          <G transform={`translate(160 125) scale(1 ${Math.cos(flip * Math.PI)})`}>
            <Rect x={-26} y={-9} width={52} height={18} fill={flip > 0.5 ? colors.cheong : colors.accent} stroke={ink} strokeWidth={1} />
          </G>
          <Rect x={me[0] - 24} y={me[1] - 8} width={48} height={16} fill={colors.cheong} stroke={ink} strokeWidth={1} transform={`rotate(-12 ${me[0]} ${me[1]})`} />
          <Rect x={244} y={40} width={10} height={70} rx={5} fill={colors.borderSoft} />
          <Rect x={244} y={110 - 70 * lift} width={10} height={70 * lift} rx={5} fill={colors.hwang} />
          <Lbl x={260} y={145} s={i18nT('꾹')} size={11} bold />
          <Check x={210} y={110} show={t > 2.6} />
        </G>
      ),
    };
  } },
  // 굴렁쇠: 꾹 누르면 빨라지고 떼면 느려진다 — 바늘을 초록 칸에
  hold: { len: 3.6, f: (t, o, ink) => {
    const v = t < 0.7 ? 0.2 : t < 2.4 ? mix(0.2, 0.6, ease(seg(t, 0.7, 1.4))) : mix(0.6, 0.35, seg(t, 2.4, 3.0));
    const hand = t < 0.7 ? { ...xy(enter(t, 0, 0.65, [110, 110])), down: false } : t < 2.4 ? { ...xy([110, 110]), down: true } : { ...xy(at([110, 110], [140, 150], seg(t, 2.4, 2.8))), down: false };
    const roll = t * 200 * v;
    return {
      phase: t < 0.7 ? 0 : t < 2.4 ? 1 : 2, hand,
      node: (
        <G>
          <Line x1={0} y1={128} x2={230} y2={128} stroke={colors.fiber} />
          <G transform={`rotate(${roll} 70 98)`}>
            <Circle cx={70} cy={98} r={30} fill="none" stroke="#8d8f8a" strokeWidth={5} />
            <Line x1={70} y1={68} x2={70} y2={128} stroke="#8d8f8a" strokeWidth={1} opacity={0.4} />
          </G>
          <Rect x={262} y={20} width={22} height={120} rx={4} fill={colors.borderSoft} />
          <Rect x={262} y={50} width={22} height={34} fill={colors.green} opacity={0.55} />
          <Rect x={258} y={140 - 120 * v - 2} width={30} height={4} fill={colors.accent} />
          <Lbl x={273} y={155} s={i18nT('속도')} size={9} />
        </G>
      ),
    };
  } },
  // 연날리기: 손가락을 좌우로 움직여 바람 길 안에
  steer: { len: 3.8, f: (t, o, ink) => {
    const band = 160 + Math.sin(t * 1.6) * 60;
    const hx = t < 0.7 ? null : band + Math.sin(t * 5) * 6;
    const hp = t < 0.7 ? enter(t, 0, 0.65, [160, 140]) : [hx, 140];
    const h = seg(t, 0.8, 3.6);
    return {
      phase: t < 0.8 ? 0 : t < 3.2 ? 1 : 2, hand: { ...xy(hp), down: t >= 0.7 },
      node: (
        <G>
          <Rect x={band - 28} y={0} width={56} height={H} fill={colors.cheong} opacity={0.15} />
          <Line x1={hp[0]} y1={140} x2={hp[0]} y2={mix(100, 30, h) + 18} stroke={ink} strokeWidth={0.8} />
          <Rect x={hp[0] - 14} y={mix(100, 30, h) - 18} width={28} height={34} fill="#f3efe6" stroke={ink} strokeWidth={1} />
          <Circle cx={hp[0]} cy={mix(100, 30, h) - 2} r={6} fill={colors.accent} />
          <Rect x={20} y={20} width={7} height={120} rx={3.5} fill={colors.borderSoft} />
          <Rect x={20} y={140 - 120 * h} width={7} height={120 * h} rx={3.5} fill={colors.green} />
        </G>
      ),
    };
  } },
  // 박자 맞추기: 움직이는 점이 「여기!」에 들어올 때 톡 — 줄넘기
  beat: { len: 3.6, f: (t, o, ink) => {
    const per = 1.6;
    const ph = ((t + 0.2) % per) / per;
    const dot = [40 + ph * 240, 80];
    const zone = [205, 245];
    const inZone = dot[0] > zone[0] && dot[0] < zone[1];
    const down = inZone && t > 0.7;
    return {
      phase: t < 0.9 ? 0 : t < 2.6 ? 1 : 2, hand: { ...xy(t < 0.7 ? enter(t, 0, 0.65, [225, 125]) : [225, 125]), down },
      node: (
        <G>
          <Line x1={40} y1={80} x2={280} y2={80} stroke={colors.fiber} strokeWidth={2} />
          <Rect x={zone[0]} y={60} width={zone[1] - zone[0]} height={40} rx={6} fill={colors.green} opacity={0.2} stroke={colors.green} />
          <Lbl x={225} y={54} s={i18nT('여기!')} size={11} color={colors.green} bold />
          <Circle cx={dot[0]} cy={dot[1]} r={9} fill={colors.accent} />
          {down ? <Check x={270} y={40} show /> : null}
          {o.label ? <Lbl x={160} y={145} s={i18nT(o.label)} size={10} color={colors.muted} /> : null}
        </G>
      ),
    };
  } },
  // 번갈아 누르기 — 줄다리기(왼발·오른발)
  alt: { len: 3.4, f: (t, o, ink) => {
    const L = [100, 125], R = [220, 125];
    const taps = [0.8, 1.15, 1.5, 1.85, 2.2, 2.55];
    const k = taps.filter((x) => t >= x).length;
    const side = k % 2 === 0 ? L : R;
    const hp = t < 0.8 ? enter(t, 0, 0.75, L) : side;
    const down = taps.some((x) => t >= x - 0.08 && t < x + 0.08);
    const pos = mix(160, 220, k / taps.length);
    return {
      phase: t < 0.8 ? 0 : t < 2.6 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          <Line x1={20} y1={50} x2={300} y2={50} stroke="#a07c4f" strokeWidth={6} strokeLinecap="round" />
          <Line x1={250} y1={30} x2={250} y2={70} stroke={colors.accent} strokeWidth={2} strokeDasharray="3 3" />
          <Rect x={pos - 4} y={40} width={8} height={20} fill={colors.accent} />
          <Rect x={L[0] - 40} y={L[1] - 18} width={80} height={36} rx={6} fill={k % 2 === 1 ? colors.accentSoft : colors.paper} stroke={ink} />
          <Lbl x={L[0]} y={L[1] + 5} s={i18nT('왼발')} size={12} bold />
          <Rect x={R[0] - 40} y={R[1] - 18} width={80} height={36} rx={6} fill={k % 2 === 0 && k > 0 ? colors.accentSoft : colors.paper} stroke={ink} />
          <Lbl x={R[0]} y={R[1] + 5} s={i18nT('오른발')} size={12} bold />
        </G>
      ),
    };
  } },
  // 기억했다 따라 누르기 — 고무줄놀이
  memory: { len: 4.2, f: (t, o, ink) => {
    const pads = [[80, 95], [160, 95], [240, 95]];
    const seq = [0, 2, 1];
    const show = [0.3, 0.8, 1.3];
    const rep = [2.0, 2.6, 3.2];
    const lit = (i) => show.some((x, j) => seq[j] === i && t >= x && t < x + 0.35) || rep.some((x, j) => seq[j] === i && t >= x - 0.1 && t < x + 0.2);
    const k = rep.filter((x) => t >= x + 0.15).length;
    const tgt = pads[seq[Math.min(2, k)]];
    const hp = t < 1.8 ? enter(t, 1.2, 1.9, pads[seq[0]]) : k >= 3 ? at(pads[seq[2]], [200, 150], seg(t, 3.4, 3.8)) : at(pads[seq[Math.max(0, k - 1)]], tgt, ease(seg(t, k ? rep[k - 1] + 0.2 : 1.8, rep[k] - 0.1)));
    const down = rep.some((x) => t >= x - 0.1 && t < x + 0.15);
    return {
      phase: t < 1.8 ? 0 : t < 3.3 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          {pads.map((p, i) => (
            <G key={i}>
              <Rect x={p[0] - 30} y={p[1] - 28} width={60} height={56} rx={8} fill={lit(i) ? colors.hwang : colors.paper} stroke={ink} strokeWidth={1.4} />
              <Lbl x={p[0]} y={p[1] + 5} s={['◀', '■', '▶'][i]} size={16} />
            </G>
          ))}
          <Lbl x={160} y={40} s={t < 1.8 ? i18nT('잘 봐 👀') : i18nT('따라 해 봐!')} size={12} color={colors.green} bold />
          <Check x={290} y={40} show={t > 3.4} />
        </G>
      ),
    };
  } },
  // 막대 두 개 맞추고 던지기 — 투호(각도·힘)
  sliders: { len: 3.8, f: (t, o, ink) => {
    const a = ease(seg(t, 0.7, 1.3)), p = ease(seg(t, 1.6, 2.2));
    const fly = seg(t, 2.6, 3.3);
    const h1 = [mix(40, 100, a), 130], h2 = [mix(180, 230, p), 130];
    const hp = t < 0.6 ? enter(t, 0, 0.55, [40, 130]) : t < 1.4 ? h1 : t < 1.55 ? at(h1, [180, 130], seg(t, 1.4, 1.55)) : t < 2.3 ? h2 : at(h2, [270, 100], ease(seg(t, 2.3, 2.55)));
    const down = (t > 0.65 && t < 1.35) || (t > 1.6 && t < 2.25) || (t > 2.5 && t < 2.62);
    const arrow = [mix(40, 192, fly), 85 - Math.sin(fly * Math.PI) * 45 + fly * 5];
    return {
      phase: t < 1.4 ? 0 : t < 2.5 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          <Path d="M182 92 q8 -8 16 0 l4 28 h-24 z" fill="#8a6a3a" stroke={ink} strokeWidth={1} />
          {fly > 0 ? <Line x1={arrow[0] - 14} y1={arrow[1] + 4} x2={arrow[0]} y2={arrow[1]} stroke={ink} strokeWidth={2} /> : null}
          <Line x1={20} y1={130} x2={130} y2={130} stroke={colors.borderSoft} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={h1[0]} cy={h1[1]} r={8} fill={colors.green} />
          <Lbl x={75} y={150} s={i18nT('각도')} size={9} />
          <Line x1={160} y1={130} x2={250} y2={130} stroke={colors.borderSoft} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={h2[0]} cy={h2[1]} r={8} fill={colors.green} />
          <Lbl x={205} y={150} s={i18nT('힘')} size={9} />
          <Rect x={250} y={88} width={52} height={22} rx={4} fill={colors.green} />
          <Lbl x={276} y={103} s={i18nT('던지기')} size={10} color="#fff" bold />
          <Check x={190} y={60} show={t > 3.3} />
        </G>
      ),
    };
  } },
  // 한글 테트리스: 옆으로 밀어 옮기고, 톡 돌리고, 아래로 휙
  tetris: { len: 4.2, f: (t, o, ink) => {
    const C = 14, gx = 110, gy = 8;
    const col = t < 1.0 ? 2 : t < 1.5 ? mix(2, 4, seg(t, 1.0, 1.4)) : 4;
    const rotated = t > 2.0;
    const fall = t < 2.6 ? Math.min(3, Math.floor(t / 0.7)) : mix(3, 8, ease(seg(t, 2.7, 3.0)));
    const cells = rotated ? [[0, 0], [1, 0], [2, 0], [0, 1]] : [[0, 0], [1, 0], [1, 1], [1, 2]];
    const bx = gx + Math.round(col) * C, by = gy + fall * C;
    const block = [bx + C, by + C];
    const hp = t < 0.8 ? enter(t, 0, 0.75, [block[0], block[1] + 50]) : t < 1.5 ? [mix(block[0] - 20, block[0], seg(t, 0.8, 1.0)), by + 60] : t < 2.2 ? [block[0], by + 30] : t < 2.95 ? [block[0], mix(by + 20, by + 70, seg(t, 2.6, 2.9))] : at([block[0], by + 70], [250, 150], seg(t, 3.0, 3.4));
    const down = (t > 0.85 && t < 1.45) || (t > 1.9 && t < 2.05) || (t > 2.55 && t < 2.95);
    return {
      phase: t < 1.6 ? 0 : t < 2.3 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          <Rect x={gx} y={gy} width={C * 8} height={C * 10} fill="none" stroke={colors.fiber} />
          <Rect x={gx} y={gy + C * 9} width={C * 8} height={C} fill={colors.borderSoft} />
          {cells.map(([cx, cy], i) => <Rect key={i} x={bx + cx * C} y={by + cy * C} width={C - 1} height={C - 1} fill="#e05a47" />)}
          <Lbl x={60} y={60} s={t < 1.6 ? i18nT('← 밀기 →') : t < 2.3 ? i18nT('톡 = 돌리기') : i18nT('↓ 휙 = 쭉')} size={11} color={colors.accent} bold />
        </G>
      ),
    };
  } },
  // 거울 글자 고르기 — 금속활자
  mirror: { len: 3.2, f: (t, o, ink) => {
    const opts = [[70, 110], [130, 110], [190, 110], [250, 110]];
    const right = 2;
    const hp = t < 1.0 ? enter(t, 0, 0.95, opts[right]) : t < 1.8 ? opts[right] : at(opts[right], [260, 150], seg(t, 1.8, 2.3));
    const g = o.glyph || '가';
    return {
      phase: t < 0.6 ? 0 : t < 1.4 ? 1 : 2, hand: { ...xy(hp), down: t > 1.1 && t < 1.4 },
      node: (
        <G>
          <Rect x={136} y={14} width={48} height={48} rx={4} fill="#8a7a55" />
          <SvgText x={160} y={50} fontSize={30} fill="#f3efe6" textAnchor="middle" transform="translate(320 0) scale(-1 1)">{g}</SvgText>
          {opts.map((p, i) => (
            <G key={i}>
              <Rect x={p[0] - 22} y={p[1] - 22} width={44} height={44} rx={4} fill={t > 1.3 && i === right ? colors.accentSoft : colors.paper} stroke={ink} />
              <SvgText x={i === 0 || i === 3 ? 320 - p[0] : p[0]} y={p[1] + 9 - (i === 1 ? 0 : 0)} fontSize={22} fill={ink} textAnchor="middle" transform={i === 0 || i === 3 ? 'translate(320 0) scale(-1 1)' : i === 1 ? `rotate(180 ${p[0]} ${p[1]})` : undefined}>{g}</SvgText>
            </G>
          ))}
          <Check x={290} y={40} show={t > 1.4} />
        </G>
      ),
    };
  } },
  // 탈춤: 북이 「덩」 칠 때 춤사위 단추를 톡
  beatMoves: { len: 4.0, f: (t, o, ink) => {
    const beats = [0.6, 1.2, 1.8, 2.4, 3.0];
    const k = beats.filter((x) => t >= x).length;
    const dong = k > 0 && (k - 1) % 4 === 0;
    const btns = [[90, 130], [230, 130]];
    const press = (t >= 0.55 && t < 0.75) || (t >= 2.95 && t < 3.15);
    const which = t < 2 ? 0 : 1;
    const hp = t < 0.5 ? enter(t, 0, 0.5, btns[0]) : t < 2.6 ? at(btns[0], btns[which], ease(seg(t, 2.0, 2.6))) : btns[1];
    const arm = press ? -60 : -10;
    return {
      phase: t < 0.6 ? 0 : t < 2.9 ? 1 : 2, hand: { ...xy(hp), down: press },
      node: (
        <G>
          {['덩', '2', '3', '4'].map((s, i) => {
            const on = k > 0 && (k - 1) % 4 === i;
            return (
              <G key={s}>
                <Circle cx={40 + i * 34} cy={30} r={13} fill={on ? (i === 0 ? colors.accent : colors.hwang) : colors.paper} stroke={ink} />
                <Lbl x={40 + i * 34} y={35} s={i === 0 ? i18nT('덩') : s} size={11} color={on ? '#fff' : ink} bold />
              </G>
            );
          })}
          <Circle cx={240} cy={34} r={10} fill={colors.accent} />
          <Rect x={232} y={44} width={16} height={34} rx={4} fill={colors.green} />
          <G transform={`rotate(${which === 0 ? arm : -10} 234 50)`}><Rect x={206} y={47} width={28} height={6} rx={3} fill="#f3efe6" stroke={ink} strokeWidth={0.6} /></G>
          <G transform={`rotate(${which === 1 ? -arm : 10} 246 50)`}><Rect x={246} y={47} width={28} height={6} rx={3} fill="#f3efe6" stroke={ink} strokeWidth={0.6} /></G>
          {btns.map((b, i) => (
            <G key={i}>
              <Rect x={b[0] - 50} y={b[1] - 16} width={100} height={32} rx={4} fill={press && which === i ? colors.accentSoft : colors.paper} stroke={ink} />
              <Lbl x={b[0]} y={b[1] + 5} s={i === 0 ? i18nT('왼 한삼') : i18nT('오른 한삼')} size={11} bold />
            </G>
          ))}
          {dong ? <Lbl x={130} y={70} s={i18nT('지금!')} size={12} color={colors.accent} bold /> : null}
        </G>
      ),
    };
  } },
  // 줄다리기: "영~"에 동그라미가 줄어들고 "차!"에 닿을 때 톡 → 줄이 우리 쪽으로
  pull: { len: 4.4, f: (t, o, ink) => {
    const C = 1.4;
    const u = (t % C) / C;
    const cha = u >= 0.5;
    const tapNow = cha && u < 0.62;
    const pulls = Math.min(3, Math.floor((t + 0.7) / C));
    const dx = -pulls * 12;
    const hp = t < 0.5 ? enter(t, 0, 0.5, [160, 128]) : [160, 128];
    return {
      phase: t < 1.2 ? 0 : t < 3.6 ? 1 : 2, hand: { ...xy(hp), down: tapNow && t > 0.5 },
      node: (
        <G>
          <Circle cx={115} cy={34} r={16} fill={!cha ? colors.hwang : colors.paper} stroke={ink} />
          <Lbl x={115} y={39} s={i18nT('영~')} size={12} color={!cha ? '#fff' : ink} bold />
          <Circle cx={205} cy={34} r={16} fill={cha ? colors.accent : colors.paper} stroke={colors.accent} strokeWidth={1.6} />
          <Lbl x={205} y={39} s={i18nT('차!')} size={12} color={cha ? '#fff' : colors.accent} bold />
          {!cha ? <Circle cx={205} cy={34} r={20 + 24 * (1 - u * 2)} fill="none" stroke={colors.accent} strokeDasharray="3 3" /> : null}
          <Line x1={160} y1={112} x2={160} y2={150} stroke={ink} strokeDasharray="4 3" opacity={0.5} />
          <Line x1={110} y1={112} x2={110} y2={150} stroke={colors.green} strokeWidth={3} />
          <Line x1={20 + dx} y1={92} x2={300 + dx} y2={92} stroke="#b08a4a" strokeWidth={5} strokeLinecap="round" />
          <Rect x={155 + dx} y={94} width={10} height={16} fill={colors.accent} />
          {[40, 62, 84].map((x) => <G key={x} transform={`translate(${x + dx} 112) rotate(${tapNow ? -20 : -8})`}><Line x1={0} y1={0} x2={0} y2={-26} stroke={colors.green} strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-32} r={6} fill="#f1d3b3" stroke={ink} /></G>)}
          {[236, 258, 280].map((x) => <G key={x} transform={`translate(${x + dx} 112) rotate(8)`}><Line x1={0} y1={0} x2={0} y2={-26} stroke="#5a6b7a" strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-32} r={6} fill="#ecc9a6" stroke={ink} /></G>)}
          {tapNow && t > 0.5 ? <Lbl x={160} y={70} s={i18nT('영차!')} size={13} color={colors.accent} bold /> : null}
          <Check x={290} y={34} show={t >= 3.6} />
        </G>
      ),
    };
  } },
  // 투호: 누른 채 뒤로 당기면 점선(날아갈 길)이 보이고, 놓으면 화살이 병에 쏙
  tuho: { len: 4.0, f: (t, o, ink) => {
    const A = [62, 104];
    const B = [36, 128];
    const pu = ease(seg(t, 0.7, 1.6));
    const hp = t < 0.6 ? enter(t, 0, 0.6, A) : t < 1.9 ? at(A, B, pu) : B;
    const fl = seg(t, 1.9, 2.7);
    const path = (p) => [mix(A[0], 236, p), mix(A[1], 104, p) - Math.sin(p * Math.PI) * 62];
    const ar = t < 1.9 ? at(A, [mix(A[0], B[0], 0.4), mix(A[1], B[1], 0.4)], pu) : path(fl);
    const nx = t < 1.9 ? [ar[0] + 10, ar[1] - 9] : path(Math.min(1, fl + 0.03));
    const rot = (Math.atan2(nx[1] - ar[1], nx[0] - ar[0]) * 180) / Math.PI;
    return {
      phase: t < 1.6 ? 0 : t < 2.7 ? 1 : 2, hand: t < 2.1 ? { ...xy(hp), down: t > 0.6 && t < 1.9 } : null,
      node: (
        <G>
          <Line x1={0} y1={140} x2={W} y2={140} stroke={ink} opacity={0.4} />
          <G transform="translate(40 140)"><Line x1={0} y1={0} x2={0} y2={-24} stroke={colors.green} strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-30} r={6} fill="#f1d3b3" stroke={ink} /></G>
          <Path d="M226 140 C214 128 214 116 230 110 L230 98 L242 98 L242 110 C258 116 258 128 246 140 Z" fill="#9b7a42" stroke="#3a2b18" />
          <Rect x={222} y={100} width={6} height={9} rx={2} fill="#7d5f33" stroke="#3a2b18" strokeWidth={0.6} />
          <Rect x={244} y={100} width={6} height={9} rx={2} fill="#7d5f33" stroke="#3a2b18" strokeWidth={0.6} />
          {t > 0.9 && t < 1.9 ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((p) => { const q = path(p * pu); return <Circle key={p} cx={q[0]} cy={q[1]} r={2.4} fill={colors.accent} />; }) : null}
          {t < 2.75 ? <G transform={`translate(${ar[0]} ${ar[1]}) rotate(${rot})`}><Line x1={-14} y1={0} x2={14} y2={0} stroke="#c9a46a" strokeWidth={2} /><Path d="M14 0 L8 -3 L8 3 Z" fill={colors.accent} /></G> : <Line x1={236} y1={86} x2={236} y2={102} stroke="#c9a46a" strokeWidth={2} />}
          {t >= 2.7 ? <Lbl x={236} y={76} s={i18nT('쏙!')} size={13} color={colors.accent} bold /> : null}
          <Lbl x={130} y={30} s={t < 1.9 ? i18nT('뒤로 당기면 점선이 보여요') : i18nT('놓으면 날아가요')} size={11} color={colors.accent} bold />
          <Check x={290} y={34} show={t >= 2.8} />
        </G>
      ),
    };
  } },
  // 고무줄: 하나·둘·셋 하고 「폴짝!」에 톡 → 뛰어넘기. 두 번 넘으면 줄이 올라간다
  gomu: { len: 4.4, f: (t, o, ink) => {
    const b = Math.floor(t / 0.5) % 4;
    const jumps = [1.5, 3.5];
    const j = jumps.find((x) => t >= x && t < x + 0.45);
    const ju = j != null ? (t - j) / 0.45 : 0;
    const high = t >= 2.2;
    const bandY = high ? 112 : 128;
    const up = j != null ? Math.sin(ju * Math.PI) * (high ? 46 : 30) : 0;
    const hp = t < 0.6 ? enter(t, 0, 0.6, [250, 128]) : [250, 128];
    const names = ['하나', '둘', '셋', '폴짝!'];
    return {
      phase: t < 1.4 ? 0 : t < 3.9 ? 1 : 2, hand: { ...xy(hp), down: j != null && ju < 0.3 },
      node: (
        <G>
          {names.map((n, i) => (
            <G key={n}>
              <Rect x={34 + i * 64} y={14} width={56} height={26} rx={5} fill={b === i ? (i === 3 ? colors.accent : colors.hwang) : colors.paper} stroke={i === 3 ? colors.accent : ink} />
              <Lbl x={62 + i * 64} y={32} s={i18nT(n)} size={11} color={b === i ? '#fff' : i === 3 ? colors.accent : ink} bold />
            </G>
          ))}
          <Line x1={0} y1={140} x2={W} y2={140} stroke={ink} opacity={0.4} />
          <G transform="translate(40 140)"><Line x1={0} y1={0} x2={0} y2={-24} stroke="#5a6b7a" strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-30} r={6} fill="#f1d3b3" stroke={ink} /></G>
          <G transform="translate(200 140)"><Line x1={0} y1={0} x2={0} y2={-24} stroke="#5a6b7a" strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-30} r={6} fill="#ecc9a6" stroke={ink} /></G>
          <Line x1={46} y1={bandY} x2={194} y2={bandY} stroke={colors.accent} strokeWidth={2.5} />
          <Lbl x={214} y={bandY + 4} s={high ? i18nT('무릎') : i18nT('발목')} size={10} color={colors.accent} bold anchor="start" />
          <G transform={`translate(120 ${140 - up})`}><Line x1={0} y1={0} x2={0} y2={-24} stroke={colors.green} strokeWidth={7} strokeLinecap="round" /><Circle cx={0} cy={-30} r={6} fill="#f1d3b3" stroke={ink} /></G>
          <Check x={290} y={70} show={t >= 3.9} />
        </G>
      ),
    };
  } },
  // 탈춤: 춤사위 카드가 위에서 내려오고, 장단 선에 닿는 순간 그 줄을 톡
  lanes: { len: 4.6, f: (t, o, ink) => {
    const LX = [125, 215];
    const HY = 112;
    const notes = [[1.6, 0], [2.4, 1], [3.2, 0]]; // [선에 닿는 시각, 줄]
    const fall = 1.1;
    const hitAt = notes.findIndex(([a]) => t >= a - 0.06 && t < a + 0.16);
    const nextI = notes.findIndex(([a]) => t < a + 0.16);
    const target = nextI < 0 ? notes[2] : notes[nextI];
    const tp = [LX[target[1]], 136];
    const hp = t < 0.9 ? enter(t, 0.2, 0.9, [LX[0], 136]) : nextI <= 0 ? [LX[0], 136] : at([LX[notes[nextI - 1][1]], 136], tp, ease(seg(t, notes[nextI - 1][0] + 0.2, target[0] - 0.25)));
    const done = notes.filter(([a]) => t >= a).length;
    const beatOn = t < 1.2 ? Math.floor(t / 0.3) % 4 : -1;
    return {
      phase: t < 1.2 ? 0 : t < 3.5 ? 1 : 2, hand: { ...xy(hp), down: hitAt >= 0 },
      node: (
        <G>
          {['덩', '2', '3', '4'].map((sx, i) => (
            <G key={sx}>
              <Circle cx={36} cy={28 + i * 26} r={10} fill={beatOn === i ? (i === 0 ? colors.accent : colors.hwang) : colors.paper} stroke={ink} />
              <Lbl x={36} y={32 + i * 26} s={i === 0 ? i18nT('덩') : sx} size={9} color={beatOn === i ? '#fff' : ink} bold />
            </G>
          ))}
          {t < 1.2 ? <Lbl x={36} y={150} s={i18nT('장단 듣기')} size={9} color={colors.accent} bold /> : null}
          <Rect x={80} y={8} width={180} height={146} fill={colors.bg} stroke={colors.border} />
          <Line x1={170} y1={8} x2={170} y2={154} stroke={colors.border} />
          <Rect x={80} y={HY - 2} width={180} height={hitAt >= 0 ? 7 : 4} fill={colors.accent} opacity={hitAt >= 0 ? 1 : 0.55} />
          {notes.map(([a, l], i) => {
            const u = (t - (a - fall)) / fall; // 0 위 → 1 선
            if (u < 0 || t >= a + 0.05) return null;
            const y = mix(-10, HY, u);
            return (
              <G key={i}>
                <Rect x={LX[l] - 38} y={y - 13} width={76} height={26} rx={5} fill={l === 0 ? colors.green : '#2f5d9e'} stroke="#fbf8f0" strokeWidth={1.5} />
                <Lbl x={LX[l]} y={y + 4} s={l === 0 ? i18nT('왼 한삼') : i18nT('오른 한삼')} size={10} color="#fff" bold />
              </G>
            );
          })}
          <Rect x={81} y={122} width={178} height={31} fill={colors.paper} />
          <Lbl x={LX[0]} y={142} s={i18nT('왼 한삼')} size={10} bold />
          <Lbl x={LX[1]} y={142} s={i18nT('오른 한삼')} size={10} bold />
          {hitAt >= 0 || (t >= 1.6 && t < 3.5 && notes.some(([a]) => t >= a && t < a + 0.45)) ? <Lbl x={LX[notes[Math.max(0, done - 1)][1]]} y={HY - 22} s={i18nT('얼씨구!')} size={13} color={colors.accent} bold /> : null}
          <Lbl x={292} y={70} s={`${done}/3`} size={16} bold />
          <Check x={292} y={100} show={t >= 3.5} />
        </G>
      ),
    };
  } },
  // 단청: ① 붓으로 문질러 바탕칠 → ② 도본 위를 분주머니로 톡톡(무늬가 찍힘) → ③ 점선 따라 선 긋기
  paint: { len: 5.0, f: (t, o, ink) => {
    const zig = [[40, 30], [280, 30], [280, 55], [40, 55], [40, 80], [280, 80], [280, 105], [40, 105], [40, 130], [280, 130]];
    const zu = seg(t, 0.5, 1.9);
    const n = zig.length - 1;
    const k = Math.min(n - 1, Math.floor(zu * n));
    const brushTip = zu >= 1 ? zig[n] : at(zig[k], zig[k + 1], zu * n - k);
    const painted = [...zig.slice(0, k + 1), brushTip];
    const taps = [[110, 70], [160, 60], [210, 80]];
    const tt = [2.3, 2.7, 3.1];
    const nt = tt.filter((x) => t >= x).length;
    const line = seg(t, 3.6, 4.5);
    const hp = t < 0.5 ? enter(t, 0, 0.45, zig[0]) : t < 2.0 ? brushTip : t < 3.3 ? taps[Math.min(2, Math.max(0, tt.findIndex((x) => t < x + 0.25)))] : t < 3.6 ? at(taps[2], [70, 120], seg(t, 3.3, 3.55)) : [mix(70, 250, line), 120];
    const down = (t > 0.5 && t < 1.95) || tt.some((x) => t >= x - 0.1 && t < x + 0.08) || (t > 3.6 && t < 4.55);
    return {
      phase: t < 2.0 ? 0 : t < 3.4 ? 1 : 2, hand: { ...xy(hp), down },
      node: (
        <G>
          <Rect x={30} y={20} width={260} height={120} fill="#cdb994" />
          {t < 2.0 ? <Polyline points={painted.map((q) => q.join(',')).join(' ')} fill="none" stroke={colors.green} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" /> : <Rect x={30} y={20} width={260} height={120} fill={colors.green} />}
          {t > 2.0 && t < 3.4 ? <Rect x={34} y={24} width={252} height={112} fill="#f6f0e2" opacity={0.4} /> : null}
          {taps.slice(0, t >= 3.4 ? 3 : nt).map((q, i) => (
            <G key={i}>
              <Circle cx={q[0]} cy={q[1]} r={20} fill="none" stroke="#f3efe6" strokeDasharray="2 2" />
              <Circle cx={q[0]} cy={q[1]} r={9} fill="none" stroke="#f3efe6" strokeDasharray="2 2" />
            </G>
          ))}
          {t > 3.4 ? <Line x1={70} y1={120} x2={250} y2={120} stroke="#f3efe6" strokeDasharray="4 3" opacity={0.7} /> : null}
          {t > 3.6 ? <Line x1={70} y1={120} x2={mix(70, 250, line)} y2={120} stroke="#1b2227" strokeWidth={3} /> : null}
          {t > 2.0 && t < 3.4 ? <Path d={`M${hp[0] - 10} ${hp[1] - 30} q10 -8 20 0 l-3 16 q-7 5 -14 0 z`} fill="#efe6d0" stroke="#8a6d3f" strokeWidth={1} /> : null}
          <Lbl x={160} y={155} s={t < 2.0 ? i18nT('① 붓으로 문질러 바탕칠') : t < 3.4 ? i18nT('② 분주머니로 톡톡 — 무늬가 찍혀요') : i18nT('③ 점선 따라 선 긋기')} size={11} color={colors.accent} bold />
        </G>
      ),
    };
  } },
};
const xy = (p) => ({ x: p[0], y: p[1] });

export default function HowToDemo({ demo, steps, compact }) {
  const k = KINDS[demo && demo.kind];
  const [t, setT] = useState(0);
  useRaf((dt) => setT((x) => (k ? (x + dt) % (k.len + 0.8) : 0)), !!k);
  if (!k) return null;
  const tt = Math.min(t, k.len);
  const ink = colors.ink;
  const fr = k.f(tt, demo, ink);
  const list = steps || [];
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{i18nT('이렇게 해요')}</Text>
      <View style={styles.stage}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          <Rect x={0} y={0} width={W} height={H} fill={colors.paper} />
          {fr.node}
          {fr.hand ? <Hand x={fr.hand.x} y={fr.hand.y} down={fr.hand.down} ink={ink} /> : null}
        </Svg>
      </View>
      {!compact && list.length ? (
        <View style={styles.steps}>
          {list.map((s, i) => {
            const on = i === Math.round((fr.phase * (list.length - 1)) / 2); // 시범의 세 단계를 설명 줄 수에 고르게 맞춘다
            return (
              <View key={i} style={[styles.stepRow, on && styles.stepOn]}>
                <View style={[styles.no, on && { backgroundColor: colors.accent }]}>
                  <Text style={styles.noTxt}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepTxt, on && styles.stepTxtOn]}>{forDevice(i18nT(s))}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const DEMO_KINDS = Object.keys(KINDS);

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, color: colors.accentDeep, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  stage: { width: '100%', aspectRatio: W / H, borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.paper },
  steps: { gap: 6, marginTop: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
  stepOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  no: { width: 24, height: 24, borderRadius: 3, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  noTxt: { color: colors.bg, fontSize: 13, fontWeight: '700' },
  stepTxt: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 22 },
  stepTxtOn: { fontWeight: '700' },
});
