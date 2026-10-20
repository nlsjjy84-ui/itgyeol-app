import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { G, Path, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import Madang from '../../ui/Madang';
import { TuhoJar, TuhoArrow } from '../../ui/Sprites';
import { useTapKey } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { nearestCue, gradeOff, tuhoRange, tuhoLanding } from '../../utils/folkTiming';
import { t as i18nT } from '../../i18n';

// 국립중앙박물관 관람객(가족·외국인·초등 고학년)을 생각해 다시 만든 세 놀이.
// 실제 놀이의 모습을 그대로 옮기고, 실패로 끝나지 않게 했다 — 놓쳐도 다음 신호에서 다시 하면 된다.
//   줄다리기  — "영~" 하고 숨을 고른 뒤 "차!" 소리에 맞춰 당긴다. 헝겊이 우리 쪽 선을 넘으면 이긴다.
//   투호      — 화살을 손가락으로 뒤로 당겼다 놓아 던진다(새총처럼). 점선이 날아갈 길.
//   고무줄놀이 — "하나·둘·셋·폴짝!" 구령의 「폴짝」에 맞춰 뛰어넘는다. 발목 → 무릎 → 허리로 높아진다.

const GY = 245; // 마당 땅 높이(Madang ground 0.72)
const INK = '#2a2420';

// 사람 하나 — (x, y)가 발. lean은 발을 축으로 기울기(도). face 1이면 오른쪽을 본다
function Kid({ x, y, color, lean = 0, face = 1, arm = 'rope', skin = '#f1d3b3' }) {
  const armPath = arm === 'rope' ? `M0 -30 L${12 * face} -26` : arm === 'up' ? `M0 -31 L${-7 * face} -44 M0 -31 L${8 * face} -44` : `M0 -30 L${10 * face} -20`;
  return (
    <G transform={`translate(${x} ${y}) rotate(${lean})`}>
      <Path d="M-5 0 L0 -17 L5 0" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={0} y1={-17} x2={0} y2={-34} stroke={color} strokeWidth={9} strokeLinecap="round" />
      <Path d={armPath} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={0} cy={-42} r={7} fill={skin} stroke={INK} strokeWidth={1} />
      <Path d="M-7 -43 Q0 -53 7 -43 Z" fill={INK} />
    </G>
  );
}

const Big = ({ x, y, s, size = 22, color = colors.ink, op = 1 }) => (
  <SvgText x={x} y={y} fontSize={size} fill={color} fontWeight="800" textAnchor="middle" opacity={op}>{s}</SvgText>
);

// ───────── 줄다리기 — "영~ 차!" ─────────
export function YeongchaGame({ color, onComplete, beatMs = 700 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const CYC = beatMs * 2; // "영"(한 박) + "차"(한 박)
  const LEAD = 1400; // 시작 뒤 첫 "영"까지(준비)
  const CHA0 = LEAD + beatMs; // 첫 "차" 시각
  const WIN = 1; // 헝겊이 이만큼 우리 쪽으로 오면 이긴다
  const fresh = () => ({ t: 0, pos: 0, vis: 0, used: -1, hitK: -1, lost: -1, good: 0, note: '', pull: 0, half: -1, start: Date.now(), done: false });
  const g = useRef(fresh());

  const pull = () => {
    const q = g.current;
    if (phase !== 'running' || q.done) return;
    const { k, off } = nearestCue(q.t, CHA0, CYC);
    q.pull = 1;
    // 한 번의 "영차"에는 처음 누른 것만 센다 — 마구 눌러서는 이길 수 없다
    if (k < 0 || k === q.used) return;
    q.used = k;
    const grade = gradeOff(off, beatMs * 0.24, beatMs * 0.42);
    if (grade === 'miss') {
      q.pos -= 0.02; // 박을 놓쳐도 아주 조금은 끌려온다
      q.note = off < 0 ? i18nT('조금 일러요 — "차!"를 기다렸다 당겨요') : i18nT('"차!" 소리에 맞춰 당겨 봐요');
      return;
    }
    q.hitK = k;
    q.good += 1;
    q.pos -= grade === 'good' ? 0.2 : 0.13;
    q.note = grade === 'good' ? i18nT('영차! 쭉 끌려온다 💪') : i18nT('좋아요! 조금만 더 딱 맞춰 봐요');
    play('stamp');
  };
  useTapKey(pull, phase === 'running');
  const pad = usePad({ onDown: () => pull() });

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt * 1000;
    // 구령 소리: 반 박마다 영(작게)·차(북)
    const half = q.t < LEAD ? -1 : Math.floor((q.t - LEAD) / beatMs);
    if (half !== q.half && half >= 0) {
      q.half = half;
      play(half % 2 === 0 ? 'tap' : 'drum');
    }
    // "차"가 지나도록 당기지 않으면 상대 편이 조금 끌어간다(그래도 우리 쪽 절반 안에서 멈춘다 — 지는 일은 없다)
    const passed = Math.floor((q.t - CHA0 - beatMs * 0.42) / CYC);
    if (passed >= 0 && passed !== q.lost) {
      q.lost = passed;
      if (q.hitK !== passed) {
        q.pos = Math.min(0.45, q.pos + 0.05);
        q.note = i18nT('상대 편이 당겨요! 다음 "차!"에 힘껏');
      }
    }
    q.vis += (q.pos - q.vis) * Math.min(1, dt * 7);
    q.pull = Math.max(0, q.pull - dt * 3);
    if (q.vis <= -WIN + 0.02) {
      q.done = true;
      setPhase('done');
      play('jing');
      onComplete({ success: true, score: q.good, elapsedMs: Date.now() - q.start });
      return;
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const dx = q.vis * 70;
  const ropeY = GY - 28;
  const u = q.t < LEAD ? -1 : ((q.t - LEAD) % CYC) / CYC; // 0~0.5 영, 0.5~1 차
  const isCha = u >= 0.5;
  const ring = u < 0 ? 0 : u < 0.5 ? 16 + 34 * (1 - u * 2) : 16;
  const lean = 8 + q.pull * 14;
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('헝겊이 우리 쪽 선을 넘으면 이겨요 · 영차 {p0}번', { p0: q.good })}
      hint={i18nT('"영~" 할 때 숨을 고르고, "차!" 할 때 화면이나 아래 단추를 톡 눌러 당겨요. 놓쳐도 다음 "차!"에 다시 당기면 돼요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#ece6d6' }]}>
        <Madang variant="yard" seed={21} ground={0.72} sun={false} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
            {/* 구령: 영 · 차 */}
            <Circle cx={105} cy={62} r={22} fill={phase === 'running' && u >= 0 && !isCha ? colors.hwang : colors.paper} stroke={INK} strokeWidth={2} />
            <Big x={105} y={70} s={i18nT('영~')} size={18} color={phase === 'running' && u >= 0 && !isCha ? '#fff' : INK} />
            <Circle cx={195} cy={62} r={22} fill={isCha ? colors.accent : colors.paper} stroke={colors.accent} strokeWidth={2} />
            <Big x={195} y={70} s={i18nT('차!')} size={18} color={isCha ? '#fff' : colors.accent} />
            {u >= 0 && !isCha ? <Circle cx={195} cy={62} r={ring + 6} fill="none" stroke={colors.accent} strokeWidth={2} strokeDasharray="4 3" /> : null}
            {q.t < LEAD && phase === 'running' ? <Big x={150} y={118} s={i18nT('준비…')} size={16} /> : null}
            {/* 바닥 선: 가운데 · 우리 쪽(왼쪽) · 상대 쪽(오른쪽) */}
            <Line x1={150} y1={GY - 6} x2={150} y2={GY + 30} stroke="#fff" strokeWidth={3} strokeDasharray="6 4" />
            <Line x1={80} y1={GY - 6} x2={80} y2={GY + 30} stroke={color} strokeWidth={4} />
            <Line x1={220} y1={GY - 6} x2={220} y2={GY + 30} stroke="#5a6b7a" strokeWidth={4} />
            <SvgText x={80} y={GY + 46} fontSize={11} fill={INK} fontWeight="700" textAnchor="middle">{i18nT('우리 편')}</SvgText>
            <SvgText x={220} y={GY + 46} fontSize={11} fill={INK} fontWeight="700" textAnchor="middle">{i18nT('상대 편')}</SvgText>
            {/* 줄과 사람 */}
            <Path d={`M${6 + dx} ${ropeY + 2} Q${150 + dx} ${ropeY + 8 - q.pull * 6} ${294 + dx} ${ropeY + 2}`} stroke="#b08a4a" strokeWidth={6} fill="none" strokeLinecap="round" />
            <Path d={`M${6 + dx} ${ropeY + 2} Q${150 + dx} ${ropeY + 8 - q.pull * 6} ${294 + dx} ${ropeY + 2}`} stroke="#7d5f33" strokeWidth={1.5} strokeDasharray="3 4" fill="none" />
            <Rect x={144 + dx} y={ropeY + 4} width={12} height={22} fill={colors.accent} />
            {[24, 48, 72].map((x) => <Kid key={`m${x}`} x={x + dx} y={GY} color={color} lean={-lean} face={1} />)}
            {[228, 252, 276].map((x) => <Kid key={`o${x}`} x={x + dx} y={GY} color="#5a6b7a" lean={8} face={-1} skin="#ecc9a6" />)}
          </Svg>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
      {phase === 'running' ? (
        <Pressable style={[st.bigTap, { backgroundColor: color }]} onPressIn={pull}>
          <Text style={st.bigTapTxt}>{i18nT('차! 당기기')}</Text>
        </Pressable>
      ) : null}
    </Shell>
  );
}

// ───────── 투호 — 뒤로 당겼다 놓아 던지기 ─────────
// 실제 투호: 일정한 거리에서 화살을 던져 병의 입(가운데 아가리)이나 귀(목 옆 구멍)에 넣는다.
export function TuhoPullGame({ color, onComplete, need = 3, zoneDeg = 11 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const TOL = clamp(zoneDeg / 180, 0.045, 0.09);
  const X0 = 46;
  const Y0 = GY - 44; // 화살을 쥔 손 높이
  const RMAX = STAGE_W - 40 - X0;
  const MOUTH_Y = GY - 60;
  const fresh = () => ({ jar: rand(0.45, 0.72), drag: null, fly: null, last: null, thrown: 0, hits: 0, streak: 0, note: '', start: Date.now() });
  const g = useRef(fresh());

  const aim = (dx, dy) => {
    // 당긴 쪽의 반대로 날아간다. 많이 당길수록 세다
    const len = Math.hypot(dx, dy);
    const pow = clamp((len / 120) * 100, 0, 100);
    const ang = clamp((Math.atan2(dy, -dx) * 180) / Math.PI, 12, 80);
    return { pow, ang };
  };
  const pathAt = (r, h, p) => [X0 + r * RMAX * p, Y0 + (MOUTH_Y - Y0) * p - Math.sin(p * Math.PI) * h];
  const heightOf = (ang, pow) => 24 + Math.sin((ang * Math.PI) / 180) * Math.pow(pow / 100, 2) * 160;

  const pad = usePad({
    onDown: (x, y) => {
      const q = g.current;
      if (phase !== 'running' || q.fly) return;
      q.drag = { sx: x, sy: y, dx: 0, dy: 0 };
    },
    onMove: (x, y) => {
      const q = g.current;
      if (!q.drag) return;
      q.drag.dx = x - q.drag.sx;
      q.drag.dy = y - q.drag.sy;
    },
    onUp: () => {
      const q = g.current;
      const d = q.drag;
      q.drag = null;
      if (!d || phase !== 'running' || q.fly) return;
      const { pow, ang } = aim(d.dx, d.dy);
      if (pow < 10) { q.note = i18nT('화살을 누른 채 뒤(왼쪽 아래)로 쭉 당겼다가 놓아요'); return; }
      const r = clamp(tuhoRange(ang, pow), 0, 1.05);
      q.fly = { p: 0, r, h: heightOf(ang, pow), ang };
      q.thrown += 1;
      play('tap');
    },
  });

  useRaf((dt) => {
    const q = g.current;
    if (q.fly) {
      q.fly.p += dt / 0.85;
      if (q.fly.p >= 1) {
        const res = tuhoLanding(q.fly.r, q.jar, TOL);
        q.last = q.fly.r;
        q.fly = null;
        if (res === 'mouth' || res === 'ear') {
          q.hits += 1;
          q.streak = 0;
          q.note = res === 'mouth' ? i18nT('쏙! 병 입에 들어갔다 🏺') : i18nT('귀에 쏙! 옆 구멍에 꽂혔어요');
          play('stamp');
          if (q.hits >= need) { setPhase('done'); onComplete({ success: true, score: q.thrown, elapsedMs: Date.now() - q.start }); return; }
          q.jar = rand(0.45, 0.8);
          q.last = null;
        } else {
          q.streak += 1;
          q.note = res === 'short' ? i18nT('짧았어요 — 조금 더 당겨 봐요') : i18nT('길었어요 — 조금 덜 당겨 봐요');
          // 세 번 연달아 빗나가면 병을 조금 가까이 옮겨 준다
          if (q.streak >= 3 && q.jar > 0.4) { q.jar = Math.max(0.38, q.jar - 0.1); q.streak = 0; q.last = null; q.note = i18nT('병을 조금 가까이 옮겼어요. 다시 해 봐요!'); }
          play('geomungo');
        }
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const jarX = X0 + q.jar * RMAX;
  // 끄는 동안: 날아갈 길(앞쪽 60%)을 점선으로
  let preview = null;
  let arrow = { x: X0, y: Y0, rot: -40 };
  if (q.drag && !q.fly) {
    const { pow, ang } = aim(q.drag.dx, q.drag.dy);
    const r = clamp(tuhoRange(ang, pow), 0, 1.05);
    const h = heightOf(ang, pow);
    const pts = [];
    for (let p = 0.06; p <= 0.6; p += 0.06) pts.push(pathAt(r, h, p));
    preview = pts;
    const pl = Math.min(1, Math.hypot(q.drag.dx, q.drag.dy) / 120) * 18;
    arrow = { x: X0 - Math.cos((ang * Math.PI) / 180) * pl, y: Y0 + Math.sin((ang * Math.PI) / 180) * pl, rot: -ang };
  } else if (q.fly) {
    const [x, y] = pathAt(q.fly.r, q.fly.h, q.fly.p);
    const [x2, y2] = pathAt(q.fly.r, q.fly.h, Math.min(1, q.fly.p + 0.02));
    arrow = { x, y, rot: (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI };
  }
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('병에 넣은 화살 {p0}/{p1} · 던진 화살 {p2}개', { p0: q.hits, p1: need, p2: q.thrown })}
      hint={i18nT('화면을 누른 채 뒤(왼쪽 아래)로 당겼다가 놓으면 화살이 날아가요. 많이 당길수록 멀리 가고, 점선이 날아갈 길이에요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#ece6d6' }]}>
        <Madang variant="yard" seed={43} ground={0.72} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
            <Kid x={X0 - 16} y={GY} color={color} face={1} arm="throw" />
            {preview ? preview.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.6} fill={colors.accent} opacity={1 - i * 0.08} />) : null}
            {q.last != null ? <Circle cx={X0 + q.last * RMAX} cy={GY - 2} r={4} fill={colors.accent} /> : null}
            {q.drag ? <Line x1={X0} y1={Y0} x2={arrow.x} y2={arrow.y} stroke={INK} strokeWidth={1} strokeDasharray="2 2" /> : null}
          </Svg>
          <View style={{ position: 'absolute', left: jarX - 20, top: GY - 64 }}><TuhoJar width={40} height={64} /></View>
          <View style={{ position: 'absolute', left: arrow.x - 15, top: arrow.y - 4, transform: [{ rotate: `${arrow.rot}deg` }] }}><TuhoArrow length={30} color={color} /></View>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
    </Shell>
  );
}

// ───────── 고무줄놀이 — 하나·둘·셋·폴짝! ─────────
// 실제 고무줄놀이: 두 사람이 고무줄을 잡고, 노래·구령에 맞춰 뛰어넘는다. 발목 → 무릎 → 허리로 줄을 올린다.
const LEVELS = [
  { name: '발목', h: 14 },
  { name: '무릎', h: 30 },
  { name: '허리', h: 50 },
];
const COUNT = ['하나', '둘', '셋', '폴짝!'];
export function GomuJumpGame({ color, onComplete, beatMs = 620, perLevel = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const BAR = beatMs * 4; // 구령 한 바퀴
  const LEAD = 900;
  const JUMP0 = LEAD + beatMs * 3; // 첫 "폴짝" 시각
  const fresh = () => ({ t: 0, lv: 0, n: 0, used: -1, okK: -1, checked: -1, beat: -1, jump: 0, jumpOk: false, caught: 0, note: '', start: Date.now(), done: false });
  const g = useRef(fresh());

  const hop = () => {
    const q = g.current;
    if (phase !== 'running' || q.done || q.jump > 0) return;
    const { k, off } = nearestCue(q.t, JUMP0, BAR);
    q.jump = 1;
    // 한 번의 "폴짝"에는 처음 누른 것만 센다
    const grade = k >= 0 && k !== q.used ? gradeOff(off, beatMs * 0.26, beatMs * 0.45) : 'miss';
    if (k >= 0) q.used = k;
    q.jumpOk = grade !== 'miss';
    if (!q.jumpOk) { q.note = off < 0 ? i18nT('조금 일러요 — "폴짝!"에 뛰어요') : i18nT('"폴짝!"에 맞춰 뛰어요'); return; }
    q.okK = k;
    q.n += 1;
    q.note = grade === 'good' ? i18nT('폴짝! 딱 맞았어요') : i18nT('넘었어요!');
    play('ok');
    if (q.n >= perLevel) {
      if (q.lv >= LEVELS.length - 1) {
        q.done = true;
        setTimeout(() => { setPhase('done'); play('jing'); onComplete({ success: true, score: q.caught, elapsedMs: Date.now() - q.start }); }, 450);
        return;
      }
      q.lv += 1;
      q.n = 0;
      q.note = i18nT('줄이 {p0}까지 올라갔어요!', { p0: i18nT(LEVELS[q.lv].name) });
    }
  };
  useTapKey(hop, phase === 'running');
  const pad = usePad({ onDown: () => hop() });

  useRaf((dt) => {
    const q = g.current;
    q.t += dt * 1000;
    const beat = q.t < LEAD ? -1 : Math.floor((q.t - LEAD) / beatMs);
    if (beat !== q.beat && beat >= 0) {
      q.beat = beat;
      play(beat % 4 === 3 ? 'drum' : 'tap');
    }
    // "폴짝"이 지나도록 뛰지 않았으면 — 고무줄이 발에 걸린다(끝나지 않고 다음 구령에 다시)
    const passed = Math.floor((q.t - JUMP0 - beatMs * 0.45) / BAR);
    if (passed >= 0 && passed !== q.checked) {
      q.checked = passed;
      if (q.okK !== passed && !q.done) { q.caught += 1; q.note = i18nT('고무줄이 발에 걸렸어요! 다음 "폴짝!"에 다시'); }
    }
    q.jump = Math.max(0, q.jump - dt / 0.45);
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const lv = LEVELS[q.lv];
  const bandY = GY - lv.h;
  const beatIn = q.t < LEAD ? -1 : Math.floor((q.t - LEAD) / beatMs) % 4;
  const up = Math.sin((1 - q.jump) * Math.PI) * (q.jump > 0 ? (q.jumpOk ? lv.h + 26 : 10) : 0);
  const jx = 150 + (q.jump > 0 && q.jumpOk ? (0.5 - q.jump) * 40 : 0);
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('{p0} 높이 · {p1}/{p2}번 넘기', { p0: i18nT(lv.name), p1: q.n, p2: perLevel })}
      hint={i18nT('"하나·둘·셋" 하고 "폴짝!" 할 때 화면이나 단추를 톡 눌러 뛰어넘어요. 걸려도 다음 "폴짝!"에 다시 하면 돼요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#ece6d6' }]}>
        <Madang variant="yard" seed={9} ground={0.72} sun={false} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
            {/* 구령 넷 */}
            {COUNT.map((c, i) => {
              const on = phase === 'running' && beatIn === i;
              const last = i === 3;
              return (
                <G key={c}>
                  <Rect x={18 + i * 68} y={34} width={60} height={34} rx={6} fill={on ? (last ? colors.accent : colors.hwang) : colors.paper} stroke={last ? colors.accent : INK} strokeWidth={last ? 2.5 : 1.5} />
                  <Big x={48 + i * 68} y={57} s={i18nT(c)} size={last ? 15 : 14} color={on ? '#fff' : last ? colors.accent : INK} />
                </G>
              );
            })}
            {/* 높이 눈금 */}
            {LEVELS.map((L, i) => (
              <G key={L.name}>
                <Line x1={286} y1={GY - L.h} x2={296} y2={GY - L.h} stroke={i === q.lv ? colors.accent : INK} strokeWidth={2} />
                <SvgText x={282} y={GY - L.h + 4} fontSize={10} fill={i === q.lv ? colors.accent : INK} fontWeight={i === q.lv ? '800' : '400'} textAnchor="end">{i18nT(L.name)}</SvgText>
              </G>
            ))}
            {/* 줄 잡은 두 사람 + 고무줄 */}
            <Kid x={30} y={GY} color="#5a6b7a" face={1} arm="hold" />
            <Kid x={252} y={GY} color="#5a6b7a" face={-1} arm="hold" skin="#ecc9a6" />
            <Path d={`M40 ${bandY} Q${jx} ${bandY + (q.jump > 0 && !q.jumpOk ? 10 : q.caught && q.jump === 0 ? 2 : 0)} 242 ${bandY}`} stroke={colors.accent} strokeWidth={2.5} fill="none" />
            <Kid x={jx} y={GY - up} color={color} face={1} arm={q.jump > 0 && q.jumpOk ? 'up' : 'hold'} />
          </Svg>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
      {phase === 'running' ? (
        <Pressable style={[st.bigTap, { backgroundColor: color }]} onPressIn={hop}>
          <Text style={st.bigTapTxt}>{i18nT('폴짝!')}</Text>
        </Pressable>
      ) : null}
    </Shell>
  );
}

const st = StyleSheet.create({
  note: { position: 'absolute', left: 0, right: 0, top: 92, textAlign: 'center', fontSize: 14, fontWeight: '800', color: colors.ink, paddingHorizontal: 10 },
  bigTap: { minWidth: 220, alignItems: 'center', paddingVertical: 16, borderRadius: 6, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  bigTapTxt: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
});
