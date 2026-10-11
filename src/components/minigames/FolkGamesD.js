import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import Madang from '../../ui/Madang';
import { Ddakji, TopView, TuhoJar, TuhoArrow } from '../../ui/Sprites';
import { useTapKey } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Bar, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { t as i18nT } from '../../i18n';

// 놀이마다 "조작 동작"이 전부 달라야 한다는 피드백으로 새로 만든 4개.
//   팽이치기 — 돌아다니는 팽이를 "찾아서 콕" 눌러 채로 친다 (목표물 누르기)
//   딱지치기 — 겨누고 높이 들었다 내리쳐 상대 딱지를 뒤집는다 (실제 넘겨먹기 규칙)
//   투호     — 각도·힘 두 줄을 직접 맞춘 뒤 던진다 (값 조절)
//   자치기   — 막대가 튀는 방향으로 휙 쓸어 친다 (방향 반응)

// ───────── 팽이치기 ─────────
export function TopChaseGame({ color, onComplete, targetHits = 14, lives = 3, drift = 0.34 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const R = 138;
  const C = { x: STAGE_W / 2, y: STAGE_H / 2 };
  const fresh = () => ({ x: C.x, y: C.y, vx: rand(-30, 30), vy: rand(-30, 30), spin: 60, hits: 0, lives, start: Date.now(), ang: 0, flash: 0, note: '', t: 0 });
  const g = useRef(fresh());

  const pad = usePad({
    onDown: (x, y) => {
      const q = g.current;
      if (phase !== 'running') return;
      const d = Math.hypot(x - q.x, y - q.y);
      if (d <= 46) {
        q.hits += 1;
        q.spin = clamp(q.spin + 26, 0, 100);
        // 맞은 팽이는 가운데 쪽으로 살짝 돌아온다
        const dx = C.x - q.x;
        const dy = C.y - q.y;
        const l = Math.hypot(dx, dy) || 1;
        q.vx = (dx / l) * 60 + rand(-25, 25);
        q.vy = (dy / l) * 60 + rand(-25, 25);
        q.flash = 0.25;
        q.note = i18nT('착!');
        play('tap');
        if (q.hits >= targetHits) {
          setPhase('done');
          onComplete({ success: true, score: q.lives, elapsedMs: Date.now() - q.start });
        }
      } else {
        q.spin = clamp(q.spin - 6, 0, 100);
        q.note = i18nT('헛쳤어요');
      }
    },
  });

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.ang += (80 + q.spin * 8) * dt;
    // 돌이 약해질수록 더 휘청이며 멀리 돌아다닌다
    const wob = (1.2 - q.spin / 100) * 260 * drift;
    q.vx += rand(-1, 1) * wob * dt * 6;
    q.vy += rand(-1, 1) * wob * dt * 6;
    const sp = Math.hypot(q.vx, q.vy);
    const maxSp = 40 + wob * 0.55;
    if (sp > maxSp) { q.vx *= maxSp / sp; q.vy *= maxSp / sp; }
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.spin = clamp(q.spin - 11 * dt, 0, 100);
    q.flash = Math.max(0, q.flash - dt);
    const out = Math.hypot(q.x - C.x, q.y - C.y) > R - 14;
    if (q.spin <= 0 || out) {
      q.lives -= 1;
      play('geomungo');
      q.note = out ? i18nT('선 밖으로 나갔어요') : i18nT('팽이가 쓰러졌어요');
      if (q.lives <= 0) {
        setPhase('done');
        onComplete({ success: false, score: q.hits, elapsedMs: Date.now() - q.start });
        return;
      }
      q.x = C.x; q.y = C.y; q.vx = 0; q.vy = 0; q.spin = 60;
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('친 횟수 {p0}/{p1} · 기회 {p2}', { p0: q.hits, p1: targetHits, p2: '♥'.repeat(Math.max(0, q.lives)) })}
      hint={i18nT('팽이가 여기저기 돌아다녀요. 팽이를 콕 눌러 채로 치면 힘이 붙어요. 힘이 떨어지거나 선 밖으로 나가면 쓰러져요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#efe6cf' }]}>
        <Madang variant="court" seed={41} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.ring, { left: C.x - R, top: C.y - R, width: R * 2, height: R * 2, borderRadius: R }]} />
          <View style={[st.topShadow, { left: q.x - 24, top: q.y + 14 }]} />
          <View style={{ position: 'absolute', left: q.x - 26, top: q.y - 26, opacity: q.flash > 0 ? 0.7 : 1 }}>
            <TopView size={52} color={color} spin={q.ang} />
          </View>
          <View style={st.spinWrap}><Bar value={q.spin} color={q.spin < 25 ? '#b3382c' : color} width={120} height={8} /></View>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
    </Shell>
  );
}

// ───────── 딱지치기 — 내 딱지로 내리쳐 상대 딱지 뒤집기(넘겨먹기) ─────────
// 실제 규칙(넘겨먹기): 바닥에 놓인 상대 딱지를 내 딱지로 내리쳐 뒤집으면 딴다.
// 높이 들어 칠수록 세지만 손이 흔들려 덜 정확하다. 한가운데를 치면 눌리기만 하고,
// 가장자리를 쳐야 바람과 반동으로 넘어간다. 양면딱지는 두 번 넘겨야 딴다.
const DDAKJI_RED = require('../../../assets/sprites/ddakji_red.png');
const DDAKJI_BLUE = require('../../../assets/sprites/ddakji_blue.png');
export function DdakjiFanGame({ color, onComplete, rounds = 3, timeSec = 9, doubleSided = false }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const R = 36; // 상대 딱지 반지름(대략)
  const NEED = [0.45, 0.55, 0.65];
  const spawn = () => ({ x: rand(80, 220), y: rand(150, 230), rot: rand(-30, 30), hits: 0 });
  const fresh = () => ({ flipped: 0, tries: rounds * 3 + 2, aimX: 150, aimY: 190, h: 0, holding: false, t: 0, opp: spawn(), anim: null, flipT: 0, note: '', start: Date.now() });
  const g = useRef(fresh());

  const setAim = (x, y) => { const q = g.current; q.aimX = clamp(x, 30, 270); q.aimY = clamp(y + 40, 110, 300); };
  const pad = usePad({
    onDown: (x, y) => { if (phase === 'running') setAim(x, y); },
    onMove: (x, y) => { if (phase === 'running') setAim(x, y); },
    onUp: () => {},
  });

  const wob = (q) => {
    const amp = 3 + 30 * q.h * q.h;
    return { dx: Math.sin(q.t * 7.1) * amp, dy: Math.cos(q.t * 5.3) * amp * 0.8 };
  };
  const press = () => { const q = g.current; if (phase !== 'running' || q.anim) return; q.holding = true; q.note = ''; };
  const release = () => {
    const q = g.current;
    if (phase !== 'running' || !q.holding || q.anim) return;
    q.holding = false;
    const w = wob(q);
    q.anim = { t: 0, x: q.aimX + w.dx, y: q.aimY + w.dy, from: q.h, power: 0.2 + 0.8 * q.h };
    q.tries -= 1;
  };
  const resolve = (q) => {
    const a = q.anim;
    const d = Math.hypot(a.x - q.opp.x, a.y - q.opp.y) / R;
    const need = NEED[Math.min(q.flipped, NEED.length - 1)];
    play('stamp');
    if (d > 1.35) q.note = i18nT('빗나갔어요 — 상대 딱지 쪽으로 겨눠요');
    else if (a.power < need) q.note = i18nT('힘이 약해요 — 더 높이 들어 올려 쳐요');
    else if (d < 0.4) q.note = i18nT('한가운데를 쳐서 눌리기만 했어요 — 가장자리를 노려요');
    else {
      q.opp.hits += 1;
      q.flipT = 1;
      const needHits = doubleSided ? 2 : 1;
      if (q.opp.hits >= needHits) {
        q.flipped += 1;
        q.note = i18nT('넘어갔다! 딱지를 땄어요');
        play('ok');
        if (q.flipped >= rounds) {
          q.anim = null; q.h = 0;
          setPhase('done');
          onComplete({ success: true, score: q.flipped, elapsedMs: Date.now() - q.start });
          return;
        }
        setTimeout(() => { g.current.opp = spawn(); }, 700);
      } else q.note = i18nT('한 번 넘겼어요! 양면딱지는 한 번 더');
    }
    q.anim = null; q.h = 0;
    if (q.tries <= 0) {
      play('geomungo');
      setPhase('done');
      onComplete({ success: false, score: q.flipped, elapsedMs: Date.now() - q.start });
    }
  };

  // 키보드: 화살표로 겨누고, 스페이스바를 누르고 있다가 떼면 내리친다
  React.useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'running') return undefined;
    const down = (e) => {
      const q = g.current;
      if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); }
      if (e.code === 'ArrowLeft') q.aimX = clamp(q.aimX - 8, 30, 270);
      if (e.code === 'ArrowRight') q.aimX = clamp(q.aimX + 8, 30, 270);
      if (e.code === 'ArrowUp') q.aimY = clamp(q.aimY - 8, 110, 300);
      if (e.code === 'ArrowDown') q.aimY = clamp(q.aimY + 8, 110, 300);
    };
    const up = (e) => { if (e.code === 'Space') { e.preventDefault(); release(); } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [phase]);

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    if (q.holding) q.h = Math.min(1, q.h + dt * 0.75);
    q.flipT = Math.max(0, q.flipT - dt * 1.6);
    if (q.anim) { q.anim.t += dt; if (q.anim.t >= 0.2) resolve(q); }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const w = wob(q);
  const lift = q.anim ? q.anim.from * (1 - q.anim.t / 0.2) : q.h;
  const myX = q.anim ? q.aimX + (q.anim.x - q.aimX) * (q.anim.t / 0.2) : q.aimX + w.dx;
  const myY = q.anim ? q.aimY + (q.anim.y - q.aimY) * (q.anim.t / 0.2) : q.aimY + w.dy;
  const mySize = 62 + lift * 40;
  const flipScale = q.flipT > 0 ? Math.cos(q.flipT * Math.PI) : 1; // 1 → -1 → 1
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('딴 딱지 {p0}/{p1} · 남은 기회 {p2}번', { p0: q.flipped, p1: rounds, p2: Math.max(0, q.tries) })}
      hint={i18nT('손가락으로 끌어 겨누고, 아래 단추를 꾹 눌러 딱지를 높이 들었다가 떼면 내리쳐요. 높을수록 세지만 손이 흔들려요. 상대 딱지의 가장자리를 쳐야 넘어가요. (키보드: 화살표로 겨누고 스페이스바 꾹)')}
    >
      <View ref={pad.ref} {...pad.handlers} style={S.stage}>
        <Madang variant="court" seed={42} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* 바닥의 상대 딱지 */}
          <View style={{ position: 'absolute', left: q.opp.x - 44, top: q.opp.y - 34, width: 88, height: 76, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${q.opp.rot}deg` }, { scaleY: flipScale }] }}>
            <Image source={DDAKJI_BLUE} style={{ width: 84, height: 84 * 0.93, opacity: q.opp.hits > 0 && doubleSided ? 0.75 : 1 }} resizeMode="contain" />
          </View>
          {/* 내 딱지가 떨어질 자리(그림자) */}
          <View style={{ position: 'absolute', left: myX - 20, top: myY - 6, width: 40, height: 12, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.14)', transform: [{ scale: 0.6 + lift * 0.7 }] }} />
          {/* 들어 올린 내 딱지 */}
          <View style={{ position: 'absolute', left: myX - mySize / 2, top: myY - mySize * 0.9 - lift * 70, transform: [{ rotate: `${-20 + lift * 25}deg` }] }}>
            <Image source={DDAKJI_RED} style={{ width: mySize, height: mySize * 0.93 }} resizeMode="contain" />
          </View>
          {q.anim && q.anim.t > 0.15 ? <Text style={[st.note, { top: q.anim.y - 70, left: q.anim.x - 30, width: 60, fontSize: 22 }]}>{i18nT('탁!')}</Text> : null}
          <View style={st.windTrack}>
            <View style={[st.windFill, { height: `${lift * 100}%`, backgroundColor: lift > 0.7 ? '#b3382c' : color }]} />
            <View style={[st.windLine, { bottom: `${((NEED[Math.min(q.flipped, NEED.length - 1)] - 0.2) / 0.8) * 100}%` }]} />
          </View>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
      {phase === 'running' ? (
        <Pressable
          style={[S.bigBtn, { backgroundColor: q.holding ? colors.accentDeep : color, paddingHorizontal: 40 }]}
          onPressIn={press}
          onPressOut={release}
        >
          <Text style={S.bigBtnText}>{i18nT(q.holding ? '떼면 내리쳐요!' : '꾹 눌러 들어 올리기')}</Text>
        </Pressable>
      ) : null}
    </Shell>
  );
}

// ───────── 투호 — 각도와 힘을 직접 맞춰 던지기 ─────────
export function TuhoDialGame({ color, onComplete, arrows = 7, need = 4, zoneDeg = 11 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const TOL = clamp(zoneDeg / 200, 0.035, 0.1);
  const X0 = 36;
  const GY = 232;
  const RMAX = STAGE_W - 40 - X0; // 최대 사거리(픽셀)
  const newJar = () => rand(0.38, 0.86);
  const fresh = () => ({ ang: 45, pow: 50, jar: newJar(), fly: null, last: null, thrown: 0, hits: 0, start: Date.now(), note: '', grab: null });
  const g = useRef(fresh());

  const rangeOf = (ang, pow) => Math.pow(pow / 100, 2) * Math.sin((2 * ang * Math.PI) / 180);

  const pad = usePad({
    onDown: (x, y) => {
      const q = g.current;
      if (phase !== 'running' || q.fly) return;
      if (y < 254) return;
      q.grab = x < 150 ? 'ang' : 'pow';
      setFromX(q, x);
    },
    onMove: (x) => { const q = g.current; if (q.grab && !q.fly) setFromX(q, x); },
    onUp: () => { g.current.grab = null; },
  });
  const setFromX = (q, x) => {
    if (q.grab === 'ang') q.ang = Math.round(clamp(((x - 14) / 120) * 80 + 5, 5, 85));
    else q.pow = Math.round(clamp(((x - 166) / 120) * 100, 5, 100));
  };

  const throwIt = () => {
    const q = g.current;
    if (phase !== 'running' || q.fly) return;
    const r = clamp(rangeOf(q.ang, q.pow), 0, 1);
    q.fly = { p: 0, r, h: 30 + Math.sin((q.ang * Math.PI) / 180) * (Math.pow(q.pow / 100, 2) * 150) };
    q.thrown += 1;
    play('tap');
  };
  useTapKey(throwIt, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.fly) {
      q.fly.p += dt / 0.9;
      if (q.fly.p >= 1) {
        const diff = Math.abs(q.fly.r - q.jar);
        q.last = q.fly.r;
        const hit = diff <= TOL;
        // 병 아가리(가운데)에 들어가면 「입」, 조금 비껴 옆 구멍에 걸리면 「귀」 — 둘 다 들어간 것으로 센다
        if (hit) { q.hits += 1; q.note = diff <= TOL * 0.55 ? i18nT('쏙! 병 입에 들어갔다 🏺') : i18nT('귀에 쏙! 옆 구멍에 꽂혔어요'); play('stamp'); } else { q.note = q.fly.r < q.jar ? i18nT('짧았어 — 힘이나 각도를 키워 보자') : i18nT('길었어 — 조금 줄여 보자'); play('geomungo'); }
        q.fly = null;
        q.jar = newJar();
        if (q.hits >= need) { setPhase('done'); onComplete({ success: true, score: q.thrown, elapsedMs: Date.now() - q.start }); return; }
        if (q.thrown >= arrows) { setPhase('done'); onComplete({ success: false, score: q.hits, elapsedMs: Date.now() - q.start }); return; }
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const jarX = X0 + q.jar * RMAX;
  let ax = X0, ay = GY - 8;
  if (q.fly) {
    ax = X0 + q.fly.r * RMAX * q.fly.p;
    ay = GY - 8 - Math.sin(q.fly.p * Math.PI) * q.fly.h;
  }
  const slider = (label, val, lo, hi, x) => (
    <View style={[st.dial, { left: x }]}>
      <Text style={st.dialLabel}>{i18nT(label)} {i18nT(val)}{i18nT(label === '각도' ? '°' : '')}</Text>
      <View style={st.dialTrack}><View style={[st.dialKnob, { left: `${((val - lo) / (hi - lo)) * 100}%`, backgroundColor: color }]} /></View>
    </View>
  );
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('들어간 화살 {p0}/{p1} · 남은 화살 {p2}개', { p0: q.hits, p1: need, p2: Math.max(0, arrows - q.thrown) })}
      hint={i18nT('아래 두 줄을 눌러 끌어 각도와 힘을 정하고 \'던지기\'를 눌러요. 항아리는 던질 때마다 다른 거리에 놓여요. 지난 화살이 떨어진 자리(점)를 보고 고쳐 보자.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#ece6d6' }]}>
        <Madang variant="yard" seed={43} ground={0.682} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.ground, { top: GY }]} />
          <View style={[st.thrower, { left: X0 - 14, top: GY - 34 }]} />
          <View style={{ position: 'absolute', left: jarX - 20, top: GY - 62 }}><TuhoJar width={40} height={64} /></View>
          {q.last != null ? <View style={[st.lastDot, { left: X0 + q.last * RMAX - 4, top: GY - 4 }]} /> : null}
          <View style={{ position: 'absolute', left: ax - 15, top: ay - 4, transform: [{ rotate: q.fly ? `${(q.fly.p - 0.5) * 120}deg` : `-${q.ang}deg` }] }}><TuhoArrow length={30} color={color} /></View>
          {slider('각도', q.ang, 5, 85, 14)}
          {slider(i18nT('힘'), q.pow, 5, 100, 166)}
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
      <Pressable style={[st.throwBtn, { backgroundColor: color }]} onPress={throwIt}>
        <Text style={st.throwTxt}>{i18nT('던지기')}</Text>
      </Pressable>
    </Shell>
  );
}

// ───────── 자치기 — 알을 튀겨 올리고, 공중에서 쳐서, 날아간 거리를 '자'로 잰다 ─────────
// 실제 규칙: 구멍 위에 걸쳐 놓은 짧은 알을 긴 자로 튀겨 올린 뒤 공중에서 세게 쳐서 멀리 보낸다.
// 날아간 거리를 긴 자로 재어 점수로 삼고, 수비가 알을 받아 내면 그 점수는 없어진다.
const JA_PX = 22; // 화면에서 1자 길이(px)
export function JachigiSwipeGame({ color, onComplete, targetHits = 10, maxMiss = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const TARGET = targetHits * 3; // 모아야 할 자 수
  const HOLE_X = 58;
  const GROUND = 252;
  const fresh = () => ({ step: 'pop', tries: maxMiss + 4, total: 0, down: null, al: { y: 0, v: 0, air: false }, fly: null, note: '', last: null, start: Date.now(), t: 0, fielder: rand(150, 250) });
  const g = useRef(fresh());

  const endTry = (q, ja, caught) => {
    q.tries -= 1;
    if (caught) { q.note = i18nT('수비가 알을 받았어요! 이번 점수는 없어요'); play('geomungo'); }
    else if (ja > 0) { q.total += ja; q.note = i18nT('{p0}자 날아갔어요!', { p0: ja }); play('ok'); }
    q.last = caught ? 0 : ja;
    q.step = 'pop';
    q.al = { y: 0, v: 0, air: false };
    q.fielder = rand(150, 250);
    if (q.total >= TARGET) { setPhase('done'); onComplete({ success: true, score: q.total, elapsedMs: Date.now() - q.start }); return; }
    if (q.tries <= 0) { setPhase('done'); onComplete({ success: false, score: q.total, elapsedMs: Date.now() - q.start }); }
  };

  const pad = usePad({
    onDown: (x, y) => { g.current.down = { x, y, t: Date.now() }; },
    onUp: (x, y) => {
      const q = g.current;
      if (phase !== 'running' || !q.down || q.fly) return;
      const dx = x - q.down.x;
      const dy = y - q.down.y;
      const dt = Math.max(60, Date.now() - q.down.t);
      q.down = null;
      const speed = Math.hypot(dx, dy) / dt; // px/ms
      if (q.step === 'pop') {
        // 1단계 — 위로 휙: 알을 튀겨 올린다
        if (dy < -30 && -dy > Math.abs(dx)) {
          if (speed < 0.35) { q.note = i18nT('너무 약해요 — 더 빠르게 위로 쓸어 올려요'); play('tap'); return; }
          q.al = { y: 0, v: Math.min(560, 260 + speed * 260), air: true };
          q.step = 'hit';
          q.note = i18nT('떴다! 떨어지기 전에 옆으로 휙 쳐요');
          play('tap');
        } else q.note = i18nT('먼저 위로 휙 쓸어 올려 알을 튀겨요');
        return;
      }
      if (q.step === 'hit' && q.al.air) {
        // 2단계 — 옆으로 휙: 공중의 알을 친다. 알이 허리 높이(최고점 근처)일 때 가장 잘 맞는다.
        if (Math.abs(dx) < 30) return;
        const peak = (q.al.vmax || q.al.v) ** 2 / (2 * 900);
        const hRatio = peak > 0 ? q.al.y / peak : 0;
        const timing = clamp(1 - Math.abs(hRatio - 0.75) * 1.6, 0.15, 1);
        const pow = clamp(speed / 1.6, 0.25, 1);
        const ja = Math.max(1, Math.round((4 + 14 * pow) * timing + rand(-1, 1)));
        const low = timing < 0.55;
        const landX = HOLE_X + ja * JA_PX;
        const caught = low && Math.abs(landX - q.fielder) < 34 && Math.random() < 0.7;
        q.fly = { t: 0, ja, caught, h: 40 + 90 * timing, x0: HOLE_X, y0: GROUND - 8 - q.al.y };
        q.note = '';
        play('stamp');
      }
    },
  });

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    if (q.al.air && !q.fly) {
      if (!q.al.vmax) q.al.vmax = q.al.v;
      q.al.y += q.al.v * dt;
      q.al.v -= 900 * dt;
      if (q.al.y <= 0) { q.al = { y: 0, v: 0, air: false }; q.note = i18nT('알이 떨어졌어요 — 다시 튀겨 올려요'); q.step = 'pop'; play('tap'); }
    }
    if (q.fly) {
      q.fly.t += dt;
      if (q.fly.t >= 0.9) { const f = q.fly; q.fly = null; endTry(q, f.ja, f.caught); }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  let alX = HOLE_X;
  let alY = GROUND - 8 - q.al.y;
  let alRot = q.al.air ? q.t * 900 : 0;
  if (q.fly) {
    const p = Math.min(1, q.fly.t / 0.9);
    const endX = Math.min(285, q.fly.x0 + q.fly.ja * JA_PX);
    alX = q.fly.x0 + (endX - q.fly.x0) * p;
    alY = q.fly.y0 + (GROUND - 8 - q.fly.y0) * p - Math.sin(p * Math.PI) * q.fly.h;
    alRot = q.fly.t * 1200;
  }
  const ticks = [];
  for (let j = 5; HOLE_X + j * JA_PX < 296; j += 5) ticks.push(j);
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('모은 거리 {p0}/{p1}자 · 남은 기회 {p2}번', { p0: q.total, p1: TARGET, p2: Math.max(0, q.tries) })}
      hint={i18nT('① 화면을 위로 휙 쓸어 구멍 위의 알을 튀겨 올려요. ② 알이 떠 있을 때 옆으로 휙 쓸어 쳐요. 알이 가장 높이 떴다가 조금 내려올 때 치면 멀리 가요. 낮게 날아가면 수비가 받을 수 있어요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={S.stage}>
        <Madang variant="yard" seed={44} ground={GROUND / 340} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* 자 눈금 */}
          {ticks.map((j) => (
            <View key={j} style={{ position: 'absolute', left: HOLE_X + j * JA_PX - 1, top: GROUND + 4, width: 2, height: 8, backgroundColor: 'rgba(60,40,20,0.45)' }}>
              <Text style={{ position: 'absolute', top: 8, left: -10, width: 22, textAlign: 'center', fontSize: 9, color: '#5a4630' }}>{j}</Text>
            </View>
          ))}
          {/* 구멍 */}
          <View style={{ position: 'absolute', left: HOLE_X - 18, top: GROUND - 3, width: 36, height: 9, borderRadius: 18, backgroundColor: '#4a3726' }} />
          {/* 수비 */}
          <View style={{ position: 'absolute', left: q.fielder - 12, top: GROUND - 46, alignItems: 'center' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#e8c9a0', borderWidth: 1.5, borderColor: '#3a2a1a' }} />
            <View style={{ width: 22, height: 28, marginTop: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#3f6f8f' }} />
            <Text style={{ fontSize: 9, color: '#3a2a1a', marginTop: 1 }}>{i18nT('수비')}</Text>
          </View>
          {/* 긴 자(채) */}
          <View style={{ position: 'absolute', left: HOLE_X - 50, top: GROUND - 30, width: 74, height: 7, borderRadius: 3, backgroundColor: '#8a5a2b', borderWidth: 1, borderColor: '#4a2f15', transform: [{ rotate: q.step === 'hit' ? '-35deg' : '18deg' }] }} />
          {/* 짧은 알 */}
          <View style={{ position: 'absolute', left: alX - 15, top: alY - 3, width: 30, height: 7, borderRadius: 3, backgroundColor: '#b07a45', borderWidth: 1, borderColor: '#5a3a1a', transform: [{ rotate: `${alRot}deg` }] }} />
          {q.last != null && !q.fly ? <View style={{ position: 'absolute', left: HOLE_X + q.last * JA_PX - 3, top: GROUND - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#b3382c' }} /> : null}
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
    </Shell>
  );
}

const st = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 3, borderColor: '#b9a77d', borderStyle: 'dashed' },
  top: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  topStripe: { position: 'absolute', width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.35)' },
  topShadow: { position: 'absolute', width: 48, height: 12, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.12)' },
  spinWrap: { position: 'absolute', left: 90, bottom: 8 },
  note: { position: 'absolute', top: 6, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: '800', color: colors.ink },
  card: { position: 'absolute', fontSize: 72 },
  gust: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#7aa0b8' },
  windTrack: { position: 'absolute', right: 10, top: 40, bottom: 40, width: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'visible', justifyContent: 'flex-end' },
  windFill: { width: '100%', borderRadius: 8 },
  windLine: { position: 'absolute', left: -6, right: -6, height: 3, backgroundColor: '#b3382c' },
  ground: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#8b7b55' },
  thrower: { position: 'absolute', width: 28, height: 34, borderRadius: 10, backgroundColor: '#7d6b4d' },
  jar: { position: 'absolute', width: 32, height: 44, borderRadius: 12, backgroundColor: '#a9553a', alignItems: 'center' },
  jarMouth: { width: 22, height: 6, borderRadius: 4, backgroundColor: '#4a2a1d', marginTop: -2 },
  arrow: { position: 'absolute', width: 24, height: 4, borderRadius: 2 },
  lastDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#b3382c' },
  dial: { position: 'absolute', top: 262, width: 120 },
  dialLabel: { fontSize: 12, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  dialTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center' },
  dialKnob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, marginLeft: -9, top: -4 },
  throwBtn: { minWidth: 160, alignItems: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  throwTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hole: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.12)' },
  glyph: { position: 'absolute', width: 60, textAlign: 'center', fontSize: 52, fontWeight: '900' },
  stick: { position: 'absolute', width: 44, height: 8, borderRadius: 4 },
  timerTrack: { position: 'absolute', left: 20, right: 20, bottom: 14, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 4 },
});
