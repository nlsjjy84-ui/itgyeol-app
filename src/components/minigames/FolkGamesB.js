import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useArrowHold, useTapKey } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Bar, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';

// ───────── 투호 — 팔이 천천히 흔들릴 때, 항아리 쪽으로 향한 순간 놓는다 ─────────
export function TuhoGame({ color, onComplete, arrows = 6, need = 3, periodSec = 3.4, zoneDeg = 14 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const THROW_Y = STAGE_H - 50;
  const JAR_Y = 70;
  const DY = THROW_Y - JAR_Y;
  const g = useRef({ t: 0, jarX: STAGE_W / 2, shot: 0, hit: 0, fly: null, last: null, start: 0 });

  const pickJar = () => rand(-70, 70) + STAGE_W / 2;
  const targetDeg = (jx) => (Math.atan2(jx - STAGE_W / 2, DY) * 180) / Math.PI;

  const release = () => {
    const q = g.current;
    if (phase !== 'running' || q.fly) return;
    const deg = 45 * Math.sin((q.t * 2 * Math.PI) / periodSec);
    const landX = STAGE_W / 2 + Math.tan((deg * Math.PI) / 180) * DY;
    q.fly = { p: 0, deg, landX };
    play('tap');
  };
  useTapKey(release, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (!q.fly) q.t += dt;
    else {
      q.fly.p += dt / 0.8;
      if (q.fly.p >= 1) {
        const ok = Math.abs(q.fly.landX - q.jarX) < 26;
        q.last = ok ? 'in' : 'out';
        if (ok) { q.hit += 1; play('stamp'); } else play('geomungo');
        q.shot += 1;
        q.fly = null;
        q.jarX = pickJar();
        if (q.hit >= need) {
          setPhase('done');
          onComplete({ success: true, score: q.shot, elapsedMs: Date.now() - q.start });
        } else if (q.shot >= arrows || q.shot - q.hit > arrows - need) {
          setPhase('done');
          onComplete({ success: false, score: q.hit, elapsedMs: Date.now() - q.start });
        }
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { t: 0, jarX: pickJar(), shot: 0, hit: 0, fly: null, last: null, start: Date.now() };
    setPhase('running');
  };
  const q = g.current;
  const deg = 45 * Math.sin((q.t * 2 * Math.PI) / periodSec);
  const want = targetDeg(q.jarX);
  const inZone = Math.abs(deg - want) <= zoneDeg;
  const armRad = (deg * Math.PI) / 180;
  const ax = STAGE_W / 2 + Math.sin(armRad) * 70;
  const ay = THROW_Y - Math.cos(armRad) * 70;
  let fx = ax;
  let fy = ay;
  if (q.fly) {
    const p = q.fly.p;
    fx = STAGE_W / 2 + (q.fly.landX - STAGE_W / 2) * p;
    fy = THROW_Y - (THROW_Y - JAR_Y) * p - Math.sin(p * Math.PI) * 70;
  }

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`항아리에 넣은 화살 ${q.hit}/${need} · 던진 화살 ${q.shot}/${arrows}`}
      hint="팔이 좌우로 천천히 흔들려요. 화살이 항아리를 향한 순간(초록 불이 켜질 때) '던지기'를 눌러요. (스페이스바도 돼요)"
    >
      <View style={S.stage}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Text style={[st.jar, { left: q.jarX - 24, top: JAR_Y - 40 }]}>🏺</Text>
          <View style={[st.mouth, { left: q.jarX - 26, top: JAR_Y - 6 }]} />
          <View style={[st.thrower, { left: STAGE_W / 2 - 17, top: THROW_Y - 20 }]} />
          <View style={[st.arm, { left: STAGE_W / 2 - 3, top: THROW_Y - 70, transform: [{ translateY: 35 }, { rotate: `${deg}deg` }, { translateY: -35 }] }]} />
          <View style={[st.arrow, { left: fx - 3, top: fy - 14, backgroundColor: q.fly ? colors.ink : color }]} />
          <View style={[st.lamp, { backgroundColor: inZone ? colors.green : colors.border }]}>
            <Text style={st.lampTxt}>{inZone ? '지금!' : '기다려요'}</Text>
          </View>
          {q.last ? <Text style={[st.result, { color: q.last === 'in' ? colors.green : colors.accent }]}>{q.last === 'in' ? '쏙 들어갔어요!' : '아깝게 빗나갔어요'}</Text> : null}
        </View>
      </View>
      {phase === 'running' ? (
        <Pressable style={[S.bigBtn, { backgroundColor: color, paddingHorizontal: 60 }]} onPress={release}>
          <Text style={S.bigBtnText}>던지기</Text>
        </Pressable>
      ) : null}
    </Shell>
  );
}

// ───────── 고무줄놀이 — 노래에 맞춰 발 모양을 기억해 따라 한다 ─────────
const PADS = [
  { id: 0, label: '왼쪽 밖', icon: '◀' },
  { id: 1, label: '가운데 안', icon: '■' },
  { id: 2, label: '오른쪽 밖', icon: '▶' },
];
const SYL = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱'];
export function GomuGame({ color, onComplete, rounds = 4, startLen = 3, maxMistakes = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [mode, setMode] = useState('show'); // show | input
  const [seq, setSeq] = useState([]);
  const [lit, setLit] = useState(-1);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState('');
  const timers = useRef([]);
  const startRef = useRef(0);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const showSeq = (s) => {
    clear();
    setMode('show');
    setPos(0);
    setMsg('잘 보세요');
    s.forEach((p, i) => {
      later(() => { setLit(p); play('tap'); }, 900 + i * 900);
      later(() => setLit(-1), 900 + i * 900 + 560);
    });
    later(() => { setMode('input'); setMsg('이제 따라 해 보세요'); }, 900 + s.length * 900 + 200);
  };

  const newRound = (r) => {
    const len = startLen + r;
    const s = [];
    for (let i = 0; i < len; i += 1) {
      let p = Math.floor(Math.random() * 3);
      if (i > 0 && p === s[i - 1] && Math.random() < 0.6) p = (p + 1) % 3;
      s.push(p);
    }
    setSeq(s);
    setRound(r);
    showSeq(s);
  };

  const start = () => {
    startRef.current = Date.now();
    setMistakes(0);
    setPhase('running');
    newRound(0);
  };

  const press = (id) => {
    if (phase !== 'running' || mode !== 'input') return;
    setLit(id);
    later(() => setLit(-1), 200);
    if (id === seq[pos]) {
      play('tap');
      const np = pos + 1;
      setPos(np);
      if (np >= seq.length) {
        play('stamp');
        if (round + 1 >= rounds) {
          setPhase('done');
          onComplete({ success: true, score: mistakes, elapsedMs: Date.now() - startRef.current });
        } else {
          setMsg('잘했어요! 한 줄 더 길어져요');
          setMode('show');
          later(() => newRound(round + 1), 900);
        }
      }
    } else {
      play('geomungo');
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= maxMistakes) {
        setPhase('done');
        onComplete({ success: false, score: round, elapsedMs: Date.now() - startRef.current });
      } else {
        setMsg('아깝게 틀렸어요. 같은 순서를 다시 보여 줄게요');
        setMode('show');
        later(() => showSeq(seq), 900);
      }
    }
  };

  useArrowHold(() => press(0), () => press(2), false);
  useTapKey(() => {}, false);
  useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'running') return undefined;
    const h = (e) => {
      const map = { ArrowLeft: 0, KeyA: 0, ArrowDown: 1, KeyS: 1, Space: 1, ArrowRight: 2, KeyD: 2 };
      if (map[e.code] !== undefined) { e.preventDefault(); press(map[e.code]); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`${round + 1}번째 노래 (${seq.length || startLen}걸음) · 틀린 횟수 ${mistakes}/${maxMistakes}`}
      hint="고무줄 넘는 발 모양이 불빛 순서대로 켜져요. 순서를 잘 기억했다가 같은 순서로 눌러요. 줄이 점점 길어져요."
    >
      <View style={[S.stage, { alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
        <View style={st.songRow}>
          {seq.map((p, i) => (
            <Text key={i} style={[st.syl, mode === 'input' && i < pos && { color: colors.green }]}>{SYL[i]}</Text>
          ))}
        </View>
        <Text style={[st.msg, { color }]}>{msg || '시작을 눌러요'}</Text>
        <View style={st.padRow}>
          {PADS.map((p) => (
            <Pressable
              key={p.id}
              style={[st.gpad, lit === p.id && { backgroundColor: color, transform: [{ scale: 1.1 }] }]}
              onPress={() => press(p.id)}
            >
              <Text style={[st.gIcon, lit === p.id && { color: '#fff' }]}>{p.icon}</Text>
              <Text style={[st.gLabel, lit === p.id && { color: '#fff' }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.band} />
      </View>
    </Shell>
  );
}

// ───────── 연날리기 — 손가락으로 연을 움직여 바람 길을 타고 오른다 ─────────
export function KiteSteerGame({ color, onComplete, limitSec = 25 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ x: STAGE_W / 2, tx: STAGE_W / 2, h: 0, t: 0, start: 0, bands: [] });
  const KY = STAGE_H - 120;

  const mkBands = () => [
    { c: 70, a: 55, w: 0.55, ph: 0 },
    { c: 150, a: 60, w: 0.4, ph: 2 },
    { c: 230, a: 50, w: 0.62, ph: 4 },
  ];
  const setX = (x) => { g.current.tx = clamp(x, 24, STAGE_W - 24); };
  const pad = usePad({ onDown: setX, onMove: setX, onUp: () => {} });
  useArrowHold(() => setX(g.current.tx - 9), () => setX(g.current.tx + 9), phase === 'running');

  const bandX = (b, t) => b.c + Math.sin(t * b.w + b.ph) * b.a * 0.55;

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.x += (q.tx - q.x) * Math.min(1, dt * 7);
    const inWind = q.bands.some((b) => Math.abs(bandX(b, q.t) - q.x) < 28);
    q.h = clamp(q.h + (inWind ? 9 : -2.5) * dt, 0, 100);
    q.inWind = inWind;
    if (q.h >= 100) {
      setPhase('done');
      onComplete({ success: true, score: Math.round(q.t), elapsedMs: Date.now() - q.start });
    } else if (q.t > limitSec) {
      setPhase('done');
      onComplete({ success: false, score: Math.round(q.h), elapsedMs: Date.now() - q.start });
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { x: STAGE_W / 2, tx: STAGE_W / 2, h: 0, t: 0, start: Date.now(), bands: mkBands(), inWind: false };
    setPhase('running');
  };
  const q = g.current;
  const kiteY = KY - q.h * 1.0;

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`연 높이 ${Math.round(q.h)}%${phase === 'running' ? ` · 남은 시간 ${Math.max(0, Math.ceil(limitSec - q.t))}초` : ''}`}
      hint="손가락(마우스)을 좌우로 움직여 연을 이끌어요. 바람이 부는 푸른 길 안에 있으면 연이 올라가요. 바람 길은 천천히 움직여요. (키보드는 ← →)"
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#dcecf5' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {q.bands.map((b, i) => (
            <View key={i} style={[st.wind, { left: bandX(b, q.t) - 28, opacity: 0.35 + 0.1 * Math.sin(q.t * 2 + i) }]}>
              {[0, 1, 2, 3, 4].map((k) => (
                <Text key={k} style={[st.windArrow, { top: ((q.t * 80 + k * 70 + i * 23) % 350) - 20 }]}>↑</Text>
              ))}
            </View>
          ))}
          <View style={[st.spool, { left: q.x - 14 }]}><Text style={{ fontSize: 22 }}>🧵</Text></View>
          <View style={[st.string, { left: q.x - 0.5, top: kiteY + 20, height: KY + 70 - kiteY }]} />
          <View style={[st.kite, { left: q.x - 22, top: kiteY - 24, backgroundColor: q.inWind ? color : '#e0b252', transform: [{ rotate: `${(q.tx - q.x) * 0.6}deg` }, { rotate: '45deg' }] }]} />
        </View>
      </View>
      <Bar value={q.h} color={color} />
    </Shell>
  );
}

// ───────── 굴렁쇠 — 세 갈래 길에서 굴렁쇠를 옮겨 돌부리를 피한다 ─────────
export function HoopGame({ color, onComplete, targetSec = 25, lives = 3, speed = 150 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ lane: 1, x: 1, obs: [], t: 0, spawn: 1, lives, hurt: 0, start: 0 });
  const LANE_W = STAGE_W / 3;
  const RING_Y = STAGE_H - 70;

  const move = (d) => {
    if (phase !== 'running') return;
    g.current.lane = clamp(g.current.lane + d, 0, 2);
    play('tap');
  };
  const pad = usePad({
    onDown: (x) => move(x < STAGE_W / 2 ? -1 : 1),
    onMove: () => {},
    onUp: () => {},
  });
  useArrowHold(() => {}, () => {}, false);
  useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'running') return undefined;
    const h = (e) => {
      if (e.repeat) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); move(-1); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); move(1); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.x += (q.lane - q.x) * Math.min(1, dt * 12);
    q.hurt = Math.max(0, q.hurt - dt);
    const sp = speed * (1 + q.t / 70);
    q.spawn -= dt;
    if (q.spawn <= 0) {
      q.spawn = rand(1.0, 1.6) * (150 / sp) * 1.1;
      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
      const n = Math.random() < 0.25 ? 2 : 1;
      for (let i = 0; i < n; i += 1) q.obs.push({ lane: lanes[i], y: -30, icon: Math.random() < 0.5 ? '🪨' : '🌿' });
    }
    q.obs.forEach((o) => { o.y += sp * dt; });
    q.obs = q.obs.filter((o) => {
      if (o.y > RING_Y - 22 && o.y < RING_Y + 22 && o.lane === Math.round(q.x) && q.hurt <= 0) {
        q.lives -= 1;
        q.hurt = 1;
        play('geomungo');
        return false;
      }
      return o.y < STAGE_H + 30;
    });
    if (q.lives <= 0) {
      setPhase('done');
      onComplete({ success: false, score: Math.round(q.t), elapsedMs: Date.now() - q.start });
    } else if (q.t >= targetSec) {
      setPhase('done');
      play('stamp');
      onComplete({ success: true, score: lives - q.lives, elapsedMs: Date.now() - q.start });
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { lane: 1, x: 1, obs: [], t: 0, spawn: 1, lives, hurt: 0, start: Date.now() };
    setPhase('running');
  };
  const q = g.current;
  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`달린 거리 ${Math.round((q.t / targetSec) * 100)}% · 기회 ${'♥'.repeat(Math.max(0, q.lives))}`}
      hint="화면의 왼쪽을 누르면 한 칸 왼쪽 길로, 오른쪽을 누르면 오른쪽 길로 가요. 돌부리와 풀덤불을 피해 끝까지 굴려요. (키보드는 ← →)"
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#efe3c8' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {[1, 2].map((i) => <View key={i} style={[st.laneLine, { left: i * LANE_W }]} />)}
          {q.obs.map((o, i) => <Text key={i} style={[st.obs, { left: o.lane * LANE_W + LANE_W / 2 - 16, top: o.y - 16 }]}>{o.icon}</Text>)}
          <View style={[st.hoop, { left: q.x * LANE_W + LANE_W / 2 - 22, top: RING_Y - 22, borderColor: color, opacity: q.hurt > 0 && Math.floor(q.hurt * 10) % 2 ? 0.3 : 1 }]} />
          <Text style={[st.stick, { left: q.x * LANE_W + LANE_W / 2 + 18, top: RING_Y - 6 }]}>｜</Text>
          <Text style={st.laneHint}>◀ 왼쪽 누르기        오른쪽 누르기 ▶</Text>
        </View>
      </View>
      <Bar value={(q.t / targetSec) * 100} color={color} />
    </Shell>
  );
}

const st = StyleSheet.create({
  jar: { position: 'absolute', fontSize: 44 },
  mouth: { position: 'absolute', width: 52, height: 12, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(0,0,0,0.25)' },
  thrower: { position: 'absolute', width: 34, height: 40, borderRadius: 14, backgroundColor: '#3b3d40' },
  arm: { position: 'absolute', width: 6, height: 70, borderRadius: 3, backgroundColor: '#8a6d3f' },
  arrow: { position: 'absolute', width: 6, height: 28, borderRadius: 3 },
  lamp: { position: 'absolute', left: STAGE_W / 2 - 40, top: 14, width: 80, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lampTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  result: { position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontWeight: '800', fontSize: 14 },
  songRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 12 },
  syl: { fontSize: 13, fontWeight: '800', color: colors.muted },
  msg: { fontSize: 15, fontWeight: '800' },
  padRow: { flexDirection: 'row', gap: 10 },
  gpad: { width: 86, height: 100, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', gap: 6 },
  gIcon: { fontSize: 28, color: colors.ink },
  gLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  band: { width: 240, height: 6, borderRadius: 3, backgroundColor: '#c1592f', opacity: 0.55 },
  wind: { position: 'absolute', top: 0, width: 56, height: STAGE_H, backgroundColor: 'rgba(88,160,210,0.28)', borderRadius: 34, overflow: 'hidden' },
  windArrow: { position: 'absolute', left: 20, fontSize: 20, fontWeight: '800', color: '#3b78a8' },
  spool: { position: 'absolute', top: STAGE_H - 52 },
  string: { position: 'absolute', width: 1.5, backgroundColor: 'rgba(60,60,60,0.5)' },
  kite: { position: 'absolute', width: 44, height: 44, borderWidth: 3, borderColor: '#fff' },
  laneLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.12)' },
  obs: { position: 'absolute', fontSize: 30 },
  hoop: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 6 },
  stick: { position: 'absolute', fontSize: 30, fontWeight: '800', color: '#8a6d3f' },
  laneHint: { position: 'absolute', bottom: 8, width: '100%', textAlign: 'center', fontSize: 12, fontWeight: '800', color: colors.muted },
});
