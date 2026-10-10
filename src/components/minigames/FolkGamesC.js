import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useHoldKey } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Bar, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { t as i18nT } from '../../i18n';

// ───────── 비석치기 — 손가락으로 쓸어 던져 세워 둔 비석을 쓰러뜨린다 ─────────
export function StoneFlickGame({ color, onComplete, stones = 3, throws = 8 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const HOME = { x: STAGE_W / 2, y: STAGE_H - 44 };
  const g = useRef({ stand: [], drag: null, fly: null, threw: 0, down: 0, start: 0, note: '' });

  const mk = () => {
    const arr = [];
    const ys = [70, 120, 170];
    for (let i = 0; i < stones; i += 1) arr.push({ x: rand(60, STAGE_W - 60), y: ys[i % 3] + rand(-8, 8), fallen: false, rot: 0 });
    return arr;
  };
  const range = (len) => Math.min(len, 160) * 1.5;

  const pad = usePad({
    onDown: (x, y) => {
      const q = g.current;
      if (q.fly || phase !== 'running') return;
      if (Math.hypot(x - HOME.x, y - HOME.y) < 60) q.drag = { x0: x, y0: y, x, y };
    },
    onMove: (x, y) => { if (g.current.drag) { g.current.drag.x = x; g.current.drag.y = y; } },
    onUp: (x, y) => {
      const q = g.current;
      if (!q.drag) return;
      const dx = x - q.drag.x0;
      const dy = y - q.drag.y0;
      const len = Math.hypot(dx, dy);
      q.drag = null;
      if (len < 20 || dy > -8) { q.note = i18nT('위쪽으로 쓸어 올려야 던져져요'); return; }
      const r = range(len);
      q.fly = { p: 0, from: { ...HOME }, to: { x: HOME.x + (dx / len) * r, y: HOME.y + (dy / len) * r } };
      q.threw += 1;
      q.note = '';
      play('tap');
    },
  });

  useRaf((dt) => {
    const q = g.current;
    if (q.fly) {
      q.fly.p += dt / 0.55;
      if (q.fly.p >= 1) {
        const t = q.fly.to;
        let hit = false;
        q.stand.forEach((s) => {
          if (!s.fallen && Math.hypot(s.x - t.x, s.y - t.y) < 30) { s.fallen = true; hit = true; q.down += 1; }
        });
        q.note = hit ? i18nT('맞았어요! 비석이 쓰러졌어요') : i18nT('아깝게 빗나갔어요');
        play(hit ? 'stamp' : 'geomungo');
        q.fly = null;
        if (q.down >= stones) {
          setPhase('done');
          onComplete({ success: true, score: q.threw, elapsedMs: Date.now() - q.start });
        } else if (q.threw >= throws) {
          setPhase('done');
          onComplete({ success: false, score: q.down, elapsedMs: Date.now() - q.start });
        }
      }
    }
    q.stand.forEach((s) => { if (s.fallen && s.rot < 80) s.rot = Math.min(80, s.rot + dt * 260); });
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { stand: mk(), drag: null, fly: null, threw: 0, down: 0, start: Date.now(), note: '' };
    setPhase('running');
  };
  const q = g.current;
  let aim = null;
  if (q.drag) {
    const dx = q.drag.x - q.drag.x0;
    const dy = q.drag.y - q.drag.y0;
    const len = Math.hypot(dx, dy);
    if (len > 10) aim = { x: HOME.x + (dx / len) * range(len), y: HOME.y + (dy / len) * range(len) };
  }
  let sx = HOME.x;
  let sy = HOME.y;
  let sc = 1;
  if (q.fly) {
    const p = q.fly.p;
    sx = q.fly.from.x + (q.fly.to.x - q.fly.from.x) * p;
    sy = q.fly.from.y + (q.fly.to.y - q.fly.from.y) * p - Math.sin(p * Math.PI) * 40;
    sc = 1 + Math.sin(p * Math.PI) * 0.5;
  }

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('쓰러뜨린 비석 {p0}/{p1} · 남은 돌 {p2}개', { p0: q.down, p1: stones, p2: Math.max(0, throws - q.threw) })}
      hint={i18nT('아래의 내 돌을 눌러 위쪽으로 쓸어 올리며 놓으면 던져져요. 멀리 쓸수록 멀리 날아가요. 점선 끝이 떨어질 자리예요.')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#efe6cf' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {q.stand.map((s, i) => (
            <View key={i} style={[st.stone, { left: s.x - 15, top: s.y - 24, backgroundColor: s.fallen ? '#9aa09b' : '#6f6a5f', transform: [{ translateY: s.fallen ? 14 : 0 }, { rotate: `${s.rot}deg` }] }]} />
          ))}
          {aim ? (
            <>
              <View style={[st.landing, { left: aim.x - 14, top: aim.y - 14, borderColor: color }]} />
              {[0.25, 0.5, 0.75].map((k) => <View key={k} style={[st.dot, { left: HOME.x + (aim.x - HOME.x) * k - 3, top: HOME.y + (aim.y - HOME.y) * k - 3 }]} />)}
            </>
          ) : null}
          <View style={[st.myStone, { left: sx - 14, top: sy - 10, backgroundColor: color, transform: [{ scale: sc }] }]} />
          <Text style={st.note}>{i18nT(q.note)}</Text>
        </View>
      </View>
    </Shell>
  );
}

// ───────── 굴렁쇠 — 누르는 힘으로 속도를 맞춰 굴러가게 한다 ─────────
export function HoopSpeedGame({ color, onComplete, targetSec = 14, lives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ t: 0, v: 20, push: false, stab: 60, lives, ang: 0, off: 0, prog: 0, start: 0, bandC: 55 });

  const hold = (on) => { g.current.push = on; };
  const pad = usePad({ onDown: () => hold(true), onMove: () => {}, onUp: () => hold(false) });
  useHoldKey(() => hold(true), () => hold(false), phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.v = clamp(q.v + (q.push ? 48 : -26) * dt, 0, 100);
    q.bandC = 52 + 26 * Math.sin(q.t * 0.55);
    const inBand = Math.abs(q.v - q.bandC) <= 15;
    q.inBand = inBand;
    q.stab = clamp(q.stab + (inBand ? 14 : -20) * dt, 0, 100);
    q.ang += q.v * 6 * dt;
    q.off = (q.off + q.v * 2.2 * dt) % 60;
    if (inBand) q.prog += dt / targetSec;
    if (q.stab <= 0) {
      q.lives -= 1;
      q.stab = 60;
      play('geomungo');
      if (q.lives <= 0) {
        setPhase('done');
        onComplete({ success: false, score: Math.round(q.prog * 100), elapsedMs: Date.now() - q.start });
        return;
      }
    }
    if (q.prog >= 1) {
      play('stamp');
      setPhase('done');
      onComplete({ success: true, score: lives - q.lives, elapsedMs: Date.now() - q.start });
      return;
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { t: 0, v: 20, push: false, stab: 60, lives, ang: 0, off: 0, prog: 0, start: Date.now(), bandC: 55, inBand: false };
    setPhase('running');
  };
  const q = g.current;
  const GAUGE_H = 230;
  const yOf = (val) => GAUGE_H - (val / 100) * GAUGE_H;

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={i18nT('굴러간 길 {p0}% · 기회 {p1}', { p0: Math.round(q.prog * 100), p1: '♥'.repeat(Math.max(0, q.lives)) })}
      hint={i18nT('화면을 꾹 누르면 굴렁쇠가 빨라지고, 떼면 느려져요. 오른쪽 초록 칸(오르내려요) 안에 속도를 맞춰요. 벗어나면 비틀거려요. (스페이스바 꾹)')}
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#e8efe0' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={st.ground} />
          {[0, 1, 2, 3, 4, 5].map((i) => <View key={i} style={[st.dash, { left: ((i * 60 - q.off + 360) % 360) - 30 }]} />)}
          <View style={[st.bigHoop, { borderColor: color, transform: [{ rotate: `${q.ang}deg` }, { translateX: (100 - q.stab) / 14 * (Math.sin(q.t * 18) > 0 ? 1 : -1) }] }]}>
            <View style={[st.spoke, { backgroundColor: color }]} />
            <View style={[st.spoke, { backgroundColor: color, transform: [{ rotate: '90deg' }] }]} />
          </View>
          <View style={[st.gauge, { top: 40, height: GAUGE_H }]}>
            <View style={[st.band, { top: yOf(q.bandC + 15), height: (30 / 100) * GAUGE_H, backgroundColor: q.inBand ? 'rgba(107,143,60,0.7)' : 'rgba(107,143,60,0.35)' }]} />
            <View style={[st.needle, { top: yOf(q.v) - 3, backgroundColor: color }]} />
          </View>
          <Text style={st.gLabel}>{i18nT('속도')}</Text>
          <View style={st.stabTrack}><View style={{ width: `${q.stab}%`, height: '100%', backgroundColor: q.stab > 40 ? colors.green : colors.accent, borderRadius: 5 }} /></View>
          <Text style={st.stabTxt}>{i18nT('균형')}</Text>
        </View>
      </View>
      {phase === 'running' ? (
        <View
          style={[S.bigBtn, { backgroundColor: q.push ? colors.accentDeep : color, paddingHorizontal: 60 }]}
        >
          <Text style={S.bigBtnText}>{i18nT(q.push ? '굴리는 중!' : '꾹 눌러서 굴려요')}</Text>
        </View>
      ) : null}
    </Shell>
  );
}

const st = StyleSheet.create({
  stone: { position: 'absolute', width: 30, height: 48, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  myStone: { position: 'absolute', width: 28, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  landing: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderStyle: 'dashed' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  note: { position: 'absolute', top: 10, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: '800', color: colors.accent },
  ground: { position: 'absolute', left: 0, right: 0, top: 220, height: 6, backgroundColor: '#8a7a55' },
  dash: { position: 'absolute', top: 236, width: 30, height: 4, borderRadius: 2, backgroundColor: 'rgba(138,122,85,0.6)' },
  bigHoop: { position: 'absolute', left: 60, top: 110, width: 110, height: 110, borderRadius: 55, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  spoke: { position: 'absolute', width: 94, height: 3 },
  gauge: { position: 'absolute', right: 26, width: 30, borderRadius: 15, backgroundColor: colors.border, overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0, borderRadius: 4 },
  needle: { position: 'absolute', left: -2, right: -2, height: 6, borderRadius: 3 },
  gLabel: { position: 'absolute', right: 26, top: 16, width: 30, textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.muted },
  stabTrack: { position: 'absolute', left: 20, right: 90, bottom: 32, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  stabTxt: { position: 'absolute', left: 20, bottom: 12, fontSize: 11, fontWeight: '800', color: colors.muted },
});
