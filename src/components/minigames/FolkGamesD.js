import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Bar, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { t as i18nT } from '../../i18n';

// 놀이마다 "조작 동작"이 전부 달라야 한다는 피드백으로 새로 만든 4개.
//   팽이치기 — 돌아다니는 팽이를 "찾아서 콕" 눌러 채로 친다 (목표물 누르기)
//   딱지치기 — 손가락을 좌우로 빠르게 흔들어 "바람"을 일으켜 딱지를 뒤집는다 (흔들기)
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
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.ring, { left: C.x - R, top: C.y - R, width: R * 2, height: R * 2, borderRadius: R }]} />
          <View style={[st.topShadow, { left: q.x - 24, top: q.y + 14 }]} />
          <View style={[st.top, { left: q.x - 26, top: q.y - 26, backgroundColor: q.flash > 0 ? '#fff' : color, borderColor: color, transform: [{ rotate: `${q.ang}deg` }] }]}>
            <View style={st.topStripe} />
            <View style={[st.topStripe, { transform: [{ rotate: '90deg' }] }]} />
          </View>
          <View style={st.spinWrap}><Bar value={q.spin} color={q.spin < 25 ? '#b3382c' : color} width={120} height={8} /></View>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
    </Shell>
  );
}

// ───────── 딱지치기 — 흔들어서 바람 일으키기 ─────────
export function DdakjiFanGame({ color, onComplete, rounds = 3, timeSec = 9, myIcon = '🟦', oppIcon = '🟧' }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const NEED = [58, 70, 82];
  const fresh = () => ({ round: 0, wind: 0, hold: 0, flipped: 0, left: timeSec, lastX: null, lastKeySide: 0, start: Date.now(), flip: 0, note: '', won: 0 });
  const g = useRef(fresh());

  const win = (q) => {
    q.flipped += 1;
    q.flip = 1;
    q.note = i18nT('뒤집었다!');
    play('stamp');
    q.round += 1;
    q.wind = 0; q.hold = 0; q.left = timeSec;
    if (q.round >= rounds) {
      setPhase('done');
      onComplete({ success: true, score: q.flipped, elapsedMs: Date.now() - q.start });
    }
  };

  const addWind = (amt) => { g.current.wind = clamp(g.current.wind + amt, 0, 100); };
  const pad = usePad({
    onDown: (x) => { g.current.lastX = x; },
    onMove: (x) => {
      const q = g.current;
      if (phase !== 'running') return;
      if (q.lastX != null) addWind(Math.abs(x - q.lastX) * 0.12);
      q.lastX = x;
    },
    onUp: () => { g.current.lastX = null; },
  });
  // 키보드: ← → 를 번갈아 눌러도 부채질
  React.useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'running') return undefined;
    const h = (e) => {
      const side = e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0;
      if (!side) return;
      const q = g.current;
      if (side !== q.lastKeySide) addWind(10);
      q.lastKeySide = side;
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase]);

  useRaf((dt) => {
    const q = g.current;
    const need = NEED[Math.min(q.round, NEED.length - 1)];
    q.wind = clamp(q.wind - 34 * dt, 0, 100);
    q.flip = Math.max(0, q.flip - dt * 1.5);
    q.left -= dt;
    if (q.wind >= need) q.hold += dt; else q.hold = Math.max(0, q.hold - dt * 0.8);
    if (q.hold >= 0.55) { win(q); }
    else if (q.left <= 0) {
      play('geomungo');
      setPhase('done');
      onComplete({ success: false, score: q.flipped, elapsedMs: Date.now() - q.start });
      return;
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const need = NEED[Math.min(q.round, NEED.length - 1)];
  const lift = clamp(q.wind / 100, 0, 1);
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('뒤집은 딱지 {p0}/{p1} · 남은 시간 {p2}초', { p0: q.flipped, p1: rounds, p2: Math.max(0, Math.ceil(q.left)) })}
      hint={i18nT('화면 위에서 손가락을 좌우로 빠르게 휙휙 흔들어 바람을 일으켜요. 바람이 선(목표) 위로 올라가 잠깐 버티면 상대 딱지가 뒤집혀요. (키보드는 ← → 번갈아)')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#e9e0cb' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Text style={[st.card, { left: 150 - 36, top: 140, transform: [{ rotate: `${-lift * 18}deg` }, { scaleY: q.flip > 0 ? 1 - q.flip * 0.9 : 1 }] }]}>{i18nT(oppIcon)}</Text>
          <Text style={[st.card, { left: 70, top: 60, fontSize: 40, opacity: 0.9 }]}>{i18nT(myIcon)}</Text>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[st.gust, { top: 190 + i * 22, left: 40 + lift * 160 * (i + 1) * 0.5, opacity: 0.15 + lift * 0.6, width: 50 + lift * 90 }]} />
          ))}
          <View style={st.windTrack}>
            <View style={[st.windFill, { height: `${q.wind}%`, backgroundColor: q.wind >= need ? '#3f8a4f' : color }]} />
            <View style={[st.windLine, { bottom: `${need}%` }]} />
          </View>
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
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
        if (hit) { q.hits += 1; q.note = i18nT('쏙! 들어갔다 🏺'); play('stamp'); } else { q.note = q.fly.r < q.jar ? i18nT('짧았어 — 힘이나 각도를 키워 보자') : i18nT('길었어 — 조금 줄여 보자'); play('geomungo'); }
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
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.ground, { top: GY }]} />
          <View style={[st.thrower, { left: X0 - 14, top: GY - 34 }]} />
          <View style={[st.jar, { left: jarX - 16, top: GY - 44 }]}><View style={st.jarMouth} /></View>
          {q.last != null ? <View style={[st.lastDot, { left: X0 + q.last * RMAX - 4, top: GY - 4 }]} /> : null}
          <View style={[st.arrow, { left: ax - 12, top: ay - 2, backgroundColor: color }]} />
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

// ───────── 자치기 — 막대가 튀는 방향으로 휙 쓸어 치기 ─────────
const DIRS = [
  { key: 'up', glyph: '▲', dx: 0, dy: -1, label: '위' },
  { key: 'down', glyph: '▼', dx: 0, dy: 1, label: '아래' },
  { key: 'left', glyph: '◀', dx: -1, dy: 0, label: '왼쪽' },
  { key: 'right', glyph: '▶', dx: 1, dy: 0, label: '오른쪽' },
];
export function JachigiSwipeGame({ color, onComplete, targetHits = 10, maxMiss = 3, windowMs = 1500 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => ({ dir: DIRS[Math.floor(Math.random() * 4)], t: 0, win: windowMs / 1000, hits: 0, miss: 0, down: null, start: Date.now(), note: '', flash: 0 });
  const g = useRef(fresh());

  const next = (q) => {
    let d = DIRS[Math.floor(Math.random() * 4)];
    if (d.key === q.dir.key) d = DIRS[(DIRS.indexOf(d) + 1 + Math.floor(Math.random() * 3)) % 4];
    q.dir = d;
    q.t = 0;
    q.win = Math.max(0.55, q.win * 0.94);
  };
  const failOne = (q, msg) => {
    q.miss += 1;
    q.note = msg;
    play('geomungo');
    if (q.miss >= maxMiss) {
      setPhase('done');
      onComplete({ success: false, score: q.hits, elapsedMs: Date.now() - q.start });
      return true;
    }
    next(q);
    return false;
  };

  const pad = usePad({
    onDown: (x, y) => { g.current.down = { x, y }; },
    onUp: (x, y) => {
      const q = g.current;
      if (phase !== 'running' || !q.down) return;
      const dx = x - q.down.x;
      const dy = y - q.down.y;
      q.down = null;
      if (Math.hypot(dx, dy) < 36) return;
      const got = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (got === q.dir.key) {
        q.hits += 1;
        q.note = i18nT('딱! 멀리 날아갔어요');
        q.flash = 0.3;
        play('stamp');
        if (q.hits >= targetHits) {
          setPhase('done');
          onComplete({ success: true, score: q.hits, elapsedMs: Date.now() - q.start });
          return;
        }
        next(q);
      } else {
        failOne(q, i18nT('{p0}이 아니에요', { p0: i18nT(DIRS.find((d) => d.key === got).label) }));
      }
    },
  });

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.flash = Math.max(0, q.flash - dt);
    if (q.t >= q.win) { if (failOne(q, i18nT('늦었어요'))) return; }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const left = clamp(1 - q.t / q.win, 0, 1);
  const stickX = 150 + q.dir.dx * (30 + (1 - left) * 70);
  const stickY = 150 + q.dir.dy * (30 + (1 - left) * 70);
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('멀리 보낸 횟수 {p0}/{p1} · 실수 {p2}/{p3}', { p0: q.hits, p1: targetHits, p2: q.miss, p3: maxMiss })}
      hint={i18nT('막대(새끼)가 튀어 오르는 쪽으로 손가락을 휙 쓸어 쳐요. 시간이 지나면 막대가 떨어져요. 갈수록 빨라져요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#e8e1c8' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.hole, { left: 150 - 24, top: 150 - 24 }]} />
          <Text style={[st.glyph, { color, opacity: 0.25 + left * 0.75, left: 150 - 30, top: 150 - 46 }]}>{i18nT(q.dir.glyph)}</Text>
          <View style={[st.stick, { left: stickX - 22, top: stickY - 4, transform: [{ rotate: q.dir.dy ? '90deg' : '0deg' }], backgroundColor: q.flash > 0 ? '#fff' : '#8a5a2b' }]} />
          <View style={st.timerTrack}><View style={[st.timerFill, { width: `${left * 100}%`, backgroundColor: left < 0.3 ? '#b3382c' : color }]} /></View>
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
