import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useArrowHold } from '../../utils/useTapKey';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Bar, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';

const PUNG = require('../../../assets/characters/pung_spin.png');

function angDiff(a, b) {
  let d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
}

// ───────── 상모돌리기 — 손가락으로 점을 따라 원을 그린다 ─────────
export function SangmoGame({ color, onComplete, limitSec = 20, speedDeg = 60, tolerance = 55 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ guide: 0, finger: null, hat: 0, progress: 0, t: 0, start: 0 });
  const CX = STAGE_W / 2;
  const CY = STAGE_H / 2 - 10;
  const R = 105;

  const setFinger = (x, y) => {
    const dx = x - CX;
    const dy = y - CY;
    if (Math.hypot(dx, dy) < 18) return;
    g.current.finger = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  };
  const pad = usePad({
    onDown: setFinger,
    onMove: setFinger,
    onUp: () => {},
  });
  useArrowHold(
    () => { g.current.finger = ((g.current.finger ?? g.current.guide) - 5 + 360) % 360; },
    () => { g.current.finger = ((g.current.finger ?? g.current.guide) + 5) % 360; },
    phase === 'running'
  );

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    const sp = speedDeg * (q.progress > 50 ? 1.3 : 1);
    q.guide = (q.guide + sp * dt) % 360;
    if (q.finger != null) {
      // 모자(상모)는 손가락 각도를 부드럽게 따라 돈다
      const d = ((q.finger - q.hat + 540) % 360) - 180;
      q.hat = (q.hat + d * Math.min(1, dt * 8) + 360) % 360;
      if (angDiff(q.finger, q.guide) <= tolerance) q.progress += dt * 14;
      else q.progress -= dt * 4;
    } else q.progress -= dt * 2;
    q.progress = clamp(q.progress, 0, 100);
    if (q.progress >= 100) {
      setPhase('done');
      onComplete({ success: true, score: Math.round(q.t), elapsedMs: Date.now() - q.start });
    } else if (q.t > limitSec) {
      setPhase('done');
      onComplete({ success: false, score: 0, elapsedMs: Date.now() - q.start });
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { guide: 0, finger: null, hat: 0, progress: 0, t: 0, start: Date.now() };
    setPhase('running');
  };
  const q = g.current;
  const rad = (q.guide * Math.PI) / 180;
  const gx = CX + Math.sin(rad) * R;
  const gy = CY - Math.cos(rad) * R;
  const follow = q.finger != null && angDiff(q.finger, q.guide) <= tolerance;
  const frad = ((q.finger ?? 0) * Math.PI) / 180;

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`상모가 도는 정도 ${Math.round(q.progress)}%`}
      hint="화면의 동그라미 위에서 손가락(마우스)을 눌러 빙글빙글 돌려요. 빛나는 점을 가까이 따라가면 상모가 돌아요. (키보드는 ← →)"
    >
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { cursor: 'pointer' }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.orbit, { left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: R, borderColor: color }]} />
          <Image source={PUNG} resizeMode="contain" style={[st.hat, { left: CX - 46, top: CY - 46, transform: [{ rotate: `${q.hat}deg` }] }]} />
          <View style={[st.guide, { left: gx - 15, top: gy - 15, backgroundColor: color, opacity: follow ? 1 : 0.8 }]} />
          {q.finger != null ? (
            <View style={[st.finger, { left: CX + Math.sin(frad) * R - 11, top: CY - Math.cos(frad) * R - 11, borderColor: follow ? colors.green : colors.accent }]} />
          ) : null}
        </View>
      </View>
      <Bar value={q.progress} color={follow ? colors.green : color} />
    </Shell>
  );
}

// ───────── 구슬치기 — 뒤로 당겼다 놓아 튕기고, 구슬끼리 부딪힌다 ─────────
export function MarbleGame({ color, onComplete, targets = 3, shots = 8 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const CX = STAGE_W / 2;
  const CY = 150;
  const RING = 125;
  const MR = 11;
  const g = useRef({ m: [], pull: null, shots: 0, captured: 0, moving: false, start: 0 });

  const mk = () => {
    const arr = [{ x: CX, y: CY + RING - 10, vx: 0, vy: 0, me: true, out: false }];
    for (let i = 0; i < targets; i += 1) {
      let x;
      let y;
      let ok = false;
      let tries = 0;
      while (!ok && tries < 40) {
        const a = rand(0, Math.PI * 2);
        const r = rand(10, RING * 0.55);
        x = CX + Math.cos(a) * r;
        y = CY + Math.sin(a) * r - 10;
        ok = arr.every((o) => Math.hypot(o.x - x, o.y - y) > MR * 3);
        tries += 1;
      }
      arr.push({ x, y, vx: 0, vy: 0, me: false, out: false });
    }
    return arr;
  };

  const pad = usePad({
    onDown: (x, y) => {
      const me = g.current.m[0];
      if (g.current.moving || !me) return;
      if (Math.hypot(x - me.x, y - me.y) < 46) g.current.pull = { x, y };
    },
    onMove: (x, y) => {
      if (g.current.pull) g.current.pull = { x, y };
    },
    onUp: () => {
      const q = g.current;
      if (!q.pull) return;
      const me = q.m[0];
      let dx = me.x - q.pull.x;
      let dy = me.y - q.pull.y;
      const len = Math.hypot(dx, dy);
      q.pull = null;
      if (len < 12) return;
      const pow = Math.min(len, 110) / 110;
      const sp = 150 + pow * 470;
      me.vx = (dx / len) * sp;
      me.vy = (dy / len) * sp;
      q.moving = true;
      q.shots += 1;
      play('tap');
    },
  });

  useRaf((dt) => {
    const q = g.current;
    if (q.moving) {
      const m = q.m;
      m.forEach((b) => {
        if (b.out && !b.me) return;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const f = Math.max(0, 1 - 1.7 * dt);
        b.vx *= f;
        b.vy *= f;
      });
      for (let i = 0; i < m.length; i += 1) {
        for (let j = i + 1; j < m.length; j += 1) {
          const a = m[i];
          const b = m[j];
          if ((a.out && !a.me) || (b.out && !b.me)) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < MR * 2) {
            const nx = dx / d;
            const ny = dy / d;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel > 0) {
              a.vx -= rel * nx;
              a.vy -= rel * ny;
              b.vx += rel * nx;
              b.vy += rel * ny;
              play('tap');
            }
            const ov = (MR * 2 - d) / 2;
            a.x -= nx * ov;
            a.y -= ny * ov;
            b.x += nx * ov;
            b.y += ny * ov;
          }
        }
      }
      m.forEach((b) => {
        if (!b.me && !b.out && Math.hypot(b.x - CX, b.y - (CY - 10)) > RING + MR * 0.5) {
          b.out = true;
          q.captured += 1;
          play('stamp');
        }
      });
      const still = m.every((b) => (b.out && !b.me) || Math.hypot(b.vx, b.vy) < 10);
      if (still) {
        q.moving = false;
        const me = m[0];
        me.vx = 0;
        me.vy = 0;
        me.x = CX;
        me.y = CY + RING - 10; // 다음 판은 다시 바깥 줄에서 시작
        if (q.captured >= targets) {
          setPhase('done');
          onComplete({ success: true, score: q.shots, elapsedMs: Date.now() - q.start });
        } else if (q.shots >= shots) {
          setPhase('done');
          onComplete({ success: false, score: q.captured, elapsedMs: Date.now() - q.start });
        }
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { m: mk(), pull: null, shots: 0, captured: 0, moving: false, start: Date.now() };
    setPhase('running');
  };
  const q = g.current;
  const me = q.m[0];
  let aim = null;
  if (q.pull && me) {
    const dx = me.x - q.pull.x;
    const dy = me.y - q.pull.y;
    const len = Math.hypot(dx, dy) || 1;
    aim = { ux: dx / len, uy: dy / len, pow: Math.min(len, 110) / 110 };
  }

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`밖으로 튕겨 낸 구슬 ${q.captured}/${targets} · 남은 기회 ${Math.max(0, shots - q.shots)}번`}
      hint="아래쪽 내 구슬(색 구슬)을 꾹 눌러 뒤로 끌었다가 놓으면 반대쪽으로 튕겨요. 많이 끌수록 세게 가요. 동그라미 안의 구슬을 밖으로 내보내요."
    >
      <View ref={pad.ref} {...pad.handlers} style={S.stage}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[st.ring, { left: CX - RING, top: CY - 10 - RING, width: RING * 2, height: RING * 2, borderRadius: RING }]} />
          {q.m.map((b, i) =>
            b.out && !b.me ? null : (
              <View
                key={i}
                style={[st.marble, { left: b.x - MR, top: b.y - MR, width: MR * 2, height: MR * 2, borderRadius: MR, backgroundColor: b.me ? color : ['#3f6f8f', '#6b8f3c', '#8a4f8a', '#b08a4a'][i % 4] }]}
              />
            )
          )}
          {aim && me
            ? [1, 2, 3, 4, 5].map((k) => (
                <View
                  key={k}
                  style={[st.dot, { left: me.x + aim.ux * k * (14 + aim.pow * 14) - 3, top: me.y + aim.uy * k * (14 + aim.pow * 14) - 3 }]}
                />
              ))
            : null}
        </View>
      </View>
    </Shell>
  );
}

// ───────── 팽이치기 — 기울어진 쪽을 쳐서 바로 세운다 ─────────
export function TopGame({ color, onComplete, targetHits = 12, lives = 3, drift = 0.28 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ lean: 0, dir: 1, t: 0, flip: 1.6, hits: 0, lives, fx: 0, start: 0, spin: 0 });

  const finishIf = () => {
    const q = g.current;
    if (q.hits >= targetHits) {
      setPhase('done');
      onComplete({ success: true, score: q.hits, elapsedMs: Date.now() - q.start });
    } else if (q.lives <= 0) {
      setPhase('done');
      onComplete({ success: false, score: q.hits, elapsedMs: Date.now() - q.start });
    }
  };

  const hit = (side) => {
    const q = g.current;
    if (phase !== 'running') return;
    const leaning = q.lean >= 0 ? 1 : -1;
    if (Math.abs(q.lean) > 0.12 && side === leaning) {
      q.lean *= 0.15;
      q.hits += 1;
      q.fx = 1;
      play('tap');
    } else {
      q.lean += side * 0.3; // 엉뚱한 쪽을 치면 오히려 더 기운다
      q.fx = -1;
      play('geomungo');
    }
    finishIf();
    force((n) => n + 1);
  };
  useArrowHold(() => hit(-1), () => hit(1), false);

  useRaf((dt) => {
    const q = g.current;
    q.t += dt;
    q.spin = (q.spin + dt * 900) % 360;
    q.flip -= dt;
    if (q.flip <= 0) {
      q.dir = Math.random() < 0.5 ? -1 : 1;
      q.flip = rand(1.2, 2.4);
    }
    const sp = drift * (1 + q.hits * 0.06);
    q.lean += (q.lean === 0 ? q.dir : Math.sign(q.lean) * 0.6 + q.dir * 0.4) * sp * dt;
    q.fx *= 0.9;
    if (Math.abs(q.lean) >= 1) {
      q.lives -= 1;
      q.lean = 0;
      play('geomungo');
      finishIf();
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { lean: 0, dir: 1, t: 0, flip: 1.6, hits: 0, lives, fx: 0, start: Date.now(), spin: 0 };
    setPhase('running');
  };
  const q = g.current;
  const tilt = q.lean * 38;
  const side = q.lean >= 0 ? 1 : -1;

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`바로 세운 횟수 ${q.hits}/${targetHits} · 남은 기회 ${'♥'.repeat(Math.max(0, q.lives))}`}
      hint="팽이가 기우는 쪽 화면을 눌러 채로 쳐서 세워요. 반대쪽을 치면 더 기울어요."
    >
      <View style={S.stage}>
        <View style={st.topFloor} />
        <View style={[st.topZone, { left: 0, backgroundColor: q.lean < -0.12 ? 'rgba(193,89,47,0.16)' : 'transparent' }]}>
          <Pressable style={st.zonePress} onPress={() => hit(-1)}><Text style={st.zoneTxt}>◀ 왼쪽을 쳐요</Text></Pressable>
        </View>
        <View style={[st.topZone, { right: 0, backgroundColor: q.lean > 0.12 ? 'rgba(193,89,47,0.16)' : 'transparent' }]}>
          <Pressable style={st.zonePress} onPress={() => hit(1)}><Text style={st.zoneTxt}>오른쪽을 쳐요 ▶</Text></Pressable>
        </View>
        <View pointerEvents="none" style={[st.topWrap, { transform: [{ rotate: `${tilt}deg` }] }]}>
          <View style={[st.topBody, { backgroundColor: color }]}>
            <View style={[st.topStripe, { transform: [{ rotate: `${q.spin}deg` }] }]} />
            <View style={[st.topStripe, { transform: [{ rotate: `${q.spin + 90}deg` }], backgroundColor: '#fff' }]} />
          </View>
          <View style={st.topTip} />
        </View>
        {Math.abs(q.lean) > 0.12 ? (
          <Text pointerEvents="none" style={[st.leanTxt, side > 0 ? { right: 30 } : { left: 30 }]}>{side > 0 ? '→ 기울어요!' : '← 기울어요!'}</Text>
        ) : null}
      </View>
    </Shell>
  );
}

// ───────── 비석치기 — 몸 위에 돌을 얹고 균형을 잡아 걷기 ─────────
const POSES = ['발등', '무릎', '어깨', '머리'];
export function StoneBalanceGame({ color, onComplete, holdSec = 4, maxDrops = 6 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const g = useRef({ stage: 0, x: 0, v: 0, prog: 0, drops: 0, push: 0, noise: 0, nt: 0, start: 0, keyL: 0, keyR: 0 });
  const WIDTHS = [0.5, 0.42, 0.34, 0.28];

  const setPush = (x) => { g.current.push = x < STAGE_W / 2 ? -1 : 1; };
  const pad = usePad({ onDown: setPush, onMove: setPush, onUp: () => { g.current.push = 0; } });
  useArrowHold(() => { g.current.keyL = Date.now() + 90; }, () => { g.current.keyR = Date.now() + 90; }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    q.nt -= dt;
    if (q.nt <= 0) {
      q.noise = rand(-1, 1);
      q.nt = rand(0.35, 0.8);
    }
    let push = q.push;
    const now = Date.now();
    if (q.keyL > now) push = -1;
    if (q.keyR > now) push = 1;
    const acc = q.noise * (0.55 + q.stage * 0.18) + push * 1.5 + q.x * 0.4; // 가운데에서 멀수록 더 쏠린다
    q.v = (q.v + acc * dt) * Math.max(0, 1 - 1.2 * dt);
    q.x += q.v * dt;
    const zone = WIDTHS[q.stage];
    if (Math.abs(q.x) <= zone) q.prog += dt / holdSec;
    else q.prog = Math.max(0, q.prog - dt / 3);
    if (Math.abs(q.x) >= 1) {
      q.drops += 1;
      q.x = 0;
      q.v = 0;
      q.prog = 0;
      play('geomungo');
      if (q.drops > maxDrops) {
        setPhase('done');
        onComplete({ success: false, score: q.stage, elapsedMs: Date.now() - q.start });
        return;
      }
    }
    if (q.prog >= 1) {
      play('stamp');
      q.stage += 1;
      q.prog = 0;
      q.x = 0;
      q.v = 0;
      if (q.stage >= POSES.length) {
        setPhase('done');
        onComplete({ success: true, score: q.drops, elapsedMs: Date.now() - q.start });
        return;
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => {
    g.current = { stage: 0, x: 0, v: 0, prog: 0, drops: 0, push: 0, noise: 0, nt: 0, start: Date.now(), keyL: 0, keyR: 0 };
    setPhase('running');
  };
  const q = g.current;
  const zone = WIDTHS[Math.min(q.stage, 3)];
  const BW = STAGE_W - 40;

  return (
    <Shell
      color={color}
      phase={phase}
      onStart={start}
      hud={`지금 돌을 ${POSES[Math.min(q.stage, 3)]} 위에 올렸어요 (${Math.min(q.stage + 1, 4)}/4) · 떨어뜨린 횟수 ${q.drops}`}
      hint="화면의 왼쪽을 누르면 돌이 왼쪽으로, 오른쪽을 누르면 오른쪽으로 밀려요. 초록 칸 안에 돌을 두면 게이지가 차요. (키보드는 ← →)"
    >
      <View ref={pad.ref} {...pad.handlers} style={S.stage}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={st.ladder}>
            {POSES.map((p, i) => (
              <View key={p} style={[st.rung, i < q.stage && { backgroundColor: colors.green }, i === q.stage && { backgroundColor: color }]}>
                <Text style={[st.rungTxt, (i <= q.stage) && { color: '#fff' }]}>{p}</Text>
              </View>
            ))}
          </View>
          <View style={[st.balBar, { left: 20, width: BW }]}>
            <View style={[st.balZone, { left: (BW / 2) * (1 - zone), width: BW * zone }]} />
            <View style={[st.balStone, { left: BW / 2 + (BW / 2) * clamp(q.x, -1, 1) - 17 }]}>
              <Text style={{ fontSize: 22 }}>🪨</Text>
            </View>
          </View>
          <View style={[st.balProg, { left: 20, width: BW }]}>
            <View style={{ width: `${q.prog * 100}%`, height: '100%', backgroundColor: colors.green, borderRadius: 6 }} />
          </View>
          <Text style={st.balTxt}>◀ 왼쪽 누르기 · 오른쪽 누르기 ▶</Text>
        </View>
      </View>
    </Shell>
  );
}

const st = StyleSheet.create({
  orbit: { position: 'absolute', borderWidth: 3, borderStyle: 'dashed', opacity: 0.45 },
  hat: { position: 'absolute', width: 92, height: 92 },
  guide: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#fff' },
  finger: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  ring: { position: 'absolute', borderWidth: 3, borderColor: '#8a6b3c', backgroundColor: 'rgba(214,190,140,0.25)' },
  marble: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  topFloor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: 'rgba(176,138,74,0.22)' },
  topZone: { position: 'absolute', top: 0, bottom: 0, width: '50%', justifyContent: 'flex-end' },
  zonePress: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 14 },
  zoneTxt: { fontSize: 12.5, fontWeight: '800', color: colors.muted },
  topWrap: { position: 'absolute', left: STAGE_W / 2 - 40, top: 100, width: 80, height: 150, alignItems: 'center', justifyContent: 'flex-end' },
  topBody: { width: 80, height: 62, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  topStripe: { position: 'absolute', width: 80, height: 8, backgroundColor: 'rgba(0,0,0,0.25)' },
  topTip: { width: 10, height: 30, backgroundColor: '#3b3d40', borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  leanTxt: { position: 'absolute', top: 24, fontSize: 15, fontWeight: '800', color: colors.accent },
  ladder: { position: 'absolute', left: 20, top: 24, right: 20, flexDirection: 'row', gap: 8 },
  rung: { flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  rungTxt: { fontSize: 13, fontWeight: '800', color: colors.ink },
  balBar: { position: 'absolute', top: 150, height: 44, borderRadius: 22, backgroundColor: colors.border },
  balZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(107,143,60,0.45)', borderRadius: 22 },
  balStone: { position: 'absolute', top: 4, width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  balProg: { position: 'absolute', top: 214, height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
  balTxt: { position: 'absolute', bottom: 18, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: '800', color: colors.muted },
});
