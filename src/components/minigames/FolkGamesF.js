import React, { useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import Svg, { G, Path, Circle, Line, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { t as i18nT } from '../../i18n';

// 2026-11-23 「게임 방식을 바꿔라」 — 탭 한 번·꾹 누르기에서 벗어나, 손짓이 판마다 다른 놀이로 다시 짰다.
// 축: 풍물에서 상쇠가 가락을 부르면 치배가 받아 치듯 「부르면 → 받는다」(리듬 세상의 call & response와 같은 구조).
//   고무줄놀이 — 노래가 「안·밖·걸고·밟고」를 부르면 같은 순서를 박에 맞춰 밟는다. 줄이 발목→무릎→허리→겨드랑이로.
//   줄넘기     — 도는 줄 속으로 알맞은 때 쓸어서 들어가고, 부르는 대로 「콩(톡)·쌩쌩이(위로 쓸기)」를 뛰고, 쓸어서 나온다.
//   굴렁쇠     — 손가락이 막대 끝. 굴렁쇠 뒤에 대고 밀어 굽은 골목을 따라간다. 세게 밀면 휘청여 쓰러진다.
//   줄다리기   — 「영~」에는 꾹 버티고 「차!」에 아래로 확 당긴다. 상대편의 거짓 구호에 속아 당기면 끌려간다.

const INK = '#2a2420';
const PAPER = '#f4efe3';

// 손짓 읽기 — 톡(짧게 누름)인지, 어느 쪽으로 쓸었는지
function gesture(d, x, y) {
  const dx = x - d.x;
  const dy = y - d.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 18) return 'tap';
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// 키보드(웹) — 화살표·스페이스
function useKeys(map, enabled) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return undefined;
    const down = (e) => {
      const f = ref.current[e.code];
      if (!f || e.repeat) return;
      e.preventDefault();
      f(true);
    };
    const up = (e) => {
      const f = ref.current[e.code];
      if (!f) return;
      e.preventDefault();
      f(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [enabled]);
}

const Label = ({ x, y, s, size = 16, color = INK, op = 1, weight = '800' }) => (
  <SvgText x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor="middle" opacity={op}>{s}</SvgText>
);

function Lives({ n, max = 3 }) {
  return (
    <G>
      {Array.from({ length: max }, (_, i) => (
        <Circle key={i} cx={STAGE_W - 16 - i * 16} cy={16} r={5.5} fill={i < n ? colors.accent : '#d8cfbe'} />
      ))}
    </G>
  );
}

// ───────────────────────── 고무줄놀이 — 부르면 밟는다 ─────────────────────────
const GOMU_STEPS = ['밖', '걸고', '안', '밟고'];
const GOMU_LEVELS = [
  { name: '발목', len: 3, beat: 720, h: 18 },
  { name: '무릎', len: 4, beat: 660, h: 44 },
  { name: '허리', len: 5, beat: 610, h: 74 },
  { name: '겨드랑이', len: 6, beat: 570, h: 104 },
];
export function GomuStepGame({ color, onComplete, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const mk = (lv) => {
    const L = GOMU_LEVELS[lv];
    const seq = [];
    for (let i = 0; i < L.len; i++) {
      let s = Math.floor(Math.random() * 4);
      if (i > 0 && s === seq[i - 1] && Math.random() < 0.6) s = (s + 1 + Math.floor(Math.random() * 3)) % 4;
      seq.push(s);
    }
    return seq;
  };
  const fresh = () => ({ t: 0, lv: 0, seq: mk(0), t0: 900, idx: 0, lives: maxLives, flash: -1, flashT: 0, note: '', ok: -1, start: Date.now(), done: false, wait: 0 });
  const g = useRef(fresh());
  const L = () => GOMU_LEVELS[g.current.lv];
  // 부르기 시작 t0 → 박마다 하나씩 부르고, 두 박 쉬고(「너 차례!」) → 받는 차례
  const respAt = (q) => q.t0 + (q.seq.length + 2) * L().beat;

  const miss = (why) => {
    const q = g.current;
    q.lives -= 1;
    q.note = why;
    play('fail');
    if (q.lives <= 0) {
      q.done = true;
      setTimeout(() => { setPhase('done'); onComplete({ success: false, score: q.lv, elapsedMs: Date.now() - q.start }); }, 500);
      return;
    }
    // 같은 노래를 다시 부른다
    q.t0 = q.t + 900;
    q.idx = 0;
    q.lastCall = null;
  };
  const stepOn = (s) => {
    const q = g.current;
    if (phase !== 'running' || q.done || q.wait > 0) return;
    q.flash = s;
    q.flashT = 0.25;
    const r0 = respAt(q);
    if (q.t < r0 - L().beat * 0.45) { q.note = i18nT('아직 노래를 듣는 중이에요 — 「너 차례!」에 밟아요'); return; }
    const off = q.t - (r0 + q.idx * L().beat);
    if (Math.abs(off) > L().beat * 0.42) { miss(off < 0 ? i18nT('조금 일러요 — 박에 맞춰 밟아요') : i18nT('박을 놓쳤어요 — 다시 불러 줄게요')); return; }
    if (s !== q.seq[q.idx]) { miss(i18nT('「{a}」을(를) 밟을 차례였어요', { a: i18nT(GOMU_STEPS[q.seq[q.idx]]) })); return; }
    play(q.idx === q.seq.length - 1 ? 'ok' : 'tap');
    q.ok = q.idx;
    q.idx += 1;
    q.note = Math.abs(off) < L().beat * 0.2 ? i18nT('딱!') : i18nT('좋아요');
    if (q.idx >= q.seq.length) {
      if (q.lv >= GOMU_LEVELS.length - 1) {
        q.done = true;
        play('jing');
        setTimeout(() => { setPhase('done'); onComplete({ success: true, score: q.lives, elapsedMs: Date.now() - q.start }); }, 600);
        return;
      }
      q.lv += 1;
      q.seq = mk(q.lv);
      q.idx = 0;
      q.ok = -1;
      q.t0 = q.t + 1100;
      q.lastCall = null;
      q.note = i18nT('줄이 {a}까지 올라갔어요!', { a: i18nT(GOMU_LEVELS[q.lv].name) });
    }
  };
  const down = useRef(null);
  const pad = usePad({
    onDown: (x, y) => {
      down.current = { x, y };
      // 아래 네 칸 가운데 누른 칸
      if (y > 250) stepOn(clamp(Math.floor(x / (STAGE_W / 4)), 0, 3));
    },
  });
  useKeys({ ArrowLeft: (d) => d && stepOn(0), ArrowDown: (d) => d && stepOn(1), ArrowUp: (d) => d && stepOn(2), ArrowRight: (d) => d && stepOn(3) }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    q.t += dt * 1000;
    q.flashT = Math.max(0, q.flashT - dt);
    const B = L().beat;
    // 부르는 박마다 소리
    const ci = Math.floor((q.t - q.t0) / B);
    if (ci >= 0 && ci < q.seq.length && ci !== q.lastCall) { q.lastCall = ci; play('tap'); }
    if (ci === q.seq.length + 1 && q.lastCall !== 'go') { q.lastCall = 'go'; play('drum'); }
    // 받는 차례에 박을 그냥 흘려보내면 틀린 것
    const r0 = respAt(q);
    if (!q.done && q.idx < q.seq.length && q.t > r0 + q.idx * B + B * 0.45) miss(i18nT('박을 놓쳤어요 — 다시 불러 줄게요'));
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const lv = GOMU_LEVELS[q.lv];
  const B = lv.beat;
  const ci = Math.floor((q.t - q.t0) / B);
  const r0 = respAt(q);
  const calling = ci >= 0 && ci < q.seq.length;
  const yourTurn = q.t >= r0 - B * 0.5;
  const bandY = 238 - lv.h;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('{a} 높이 · {b}/{c}번째 노래', { a: i18nT(lv.name), b: q.lv + 1, c: GOMU_LEVELS.length })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: PAPER }]} testID="gomu-step">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Lives n={q.lives} />
          {/* 노래 — 부를 순서 */}
          <Label x={STAGE_W / 2} y={30} s={phase !== 'running' ? '' : yourTurn ? i18nT('너 차례!') : i18nT('노래를 들어요')} size={15} color={yourTurn ? colors.accent : INK} />
          {q.seq.map((s, i) => {
            const w = Math.min(46, (STAGE_W - 20) / q.seq.length - 6);
            const x = STAGE_W / 2 - (q.seq.length * (w + 6)) / 2 + i * (w + 6) + 3;
            const shown = phase === 'running' && (ci >= i || yourTurn);
            const now = calling && ci === i;
            const done = yourTurn && i < q.idx;
            const next = yourTurn && i === q.idx;
            return (
              <G key={i}>
                <Rect x={x} y={44} width={w} height={34} rx={6} fill={done ? '#3f7a52' : now ? colors.hwang : next ? '#fff3d6' : '#fff'} stroke={next ? colors.accent : INK} strokeWidth={next ? 2.5 : 1.2} />
                <Label x={x + w / 2} y={66} s={shown && !(yourTurn && !done && !next && i > q.idx && q.lv >= 2) ? i18nT(GOMU_STEPS[s]) : '?'} size={12} color={done ? '#fff' : INK} />
              </G>
            );
          })}
          {/* 고무줄 두 줄과 아이 */}
          <Line x1={20} y1={bandY} x2={STAGE_W - 20} y2={bandY} stroke="#b3322b" strokeWidth={3} />
          <Line x1={20} y1={bandY + 26} x2={STAGE_W - 20} y2={bandY + 26} stroke="#b3322b" strokeWidth={3} />
          <Label x={30} y={bandY - 6} s={i18nT(lv.name)} size={11} color="#b3322b" weight="700" />
          {(() => {
            const s = q.flashT > 0 ? q.flash : -1;
            const fx = [70, 120, 150, 185][s < 0 ? 2 : s];
            const fy = s === 0 ? 236 : s === 1 ? bandY : s === 3 ? bandY + 26 : bandY + 13;
            const hop = q.flashT > 0 ? Math.sin((q.flashT / 0.25) * Math.PI) * 18 : 0;
            return (
              <G>
                <Line x1={fx - 7} y1={fy - hop} x2={150} y2={150 - hop} stroke={INK} strokeWidth={3} />
                <Line x1={fx + 7} y1={fy - hop} x2={150} y2={150 - hop} stroke={INK} strokeWidth={3} />
                <Line x1={150} y1={150 - hop} x2={150} y2={118 - hop} stroke={color} strokeWidth={10} strokeLinecap="round" />
                <Circle cx={150} cy={104 - hop} r={10} fill="#f1d3b3" stroke={INK} strokeWidth={1} />
              </G>
            );
          })()}
          {/* 밟는 네 칸 */}
          {GOMU_STEPS.map((s, i) => {
            const w = STAGE_W / 4;
            const lit = q.flashT > 0 && q.flash === i;
            return (
              <G key={s}>
                <Rect x={i * w + 4} y={256} width={w - 8} height={76} rx={10} fill={lit ? color : '#fff'} stroke={INK} strokeWidth={1.5} />
                <Label x={i * w + w / 2} y={302} s={i18nT(s)} size={17} color={lit ? '#fff' : INK} />
              </G>
            );
          })}
          {q.note ? <Label x={STAGE_W / 2} y={244} s={q.note} size={12} color={colors.accentDeep || INK} weight="700" /> : null}
        </Svg>
      </View>
    </Shell>
  );
}

// ───────────────────────── 줄넘기 — 들어가고, 부르는 대로 뛰고, 나온다 ─────────────────────────
const CALLS = [
  { k: 'kong', s: '콩', g: 'tap' },
  { k: 'ssaeng', s: '쌩쌩이', g: 'up' },
];
export function RopeEnterGame({ color, onComplete, jumps = 6, cycleMs = 1100, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const mkCalls = () => Array.from({ length: jumps }, (_, i) => (i === 0 ? CALLS[0] : Math.random() < 0.38 ? CALLS[1] : CALLS[0]));
  const fresh = () => ({ t: 0, stage: 'out', calls: mkCalls(), n: 0, lives: maxLives, hop: 0, hopBig: false, x: 46, note: i18nT('줄이 위로 올라갈 때 오른쪽으로 쓸어 들어가요'), checked: 0, did: -1, start: Date.now(), done: false });
  const g = useRef(fresh());
  // 줄의 각 — 0이면 땅(발밑), 0.5면 머리 위
  const ph = (t) => ((t / cycleMs) % 1 + 1) % 1;
  const lose = (why) => {
    const q = g.current;
    q.lives -= 1;
    q.note = why;
    play('fail');
    if (q.lives <= 0) {
      q.done = true;
      setTimeout(() => { setPhase('done'); onComplete({ success: false, score: q.n, elapsedMs: Date.now() - q.start }); }, 500);
    }
  };
  const act = (gst) => {
    const q = g.current;
    if (phase !== 'running' || q.done) return;
    const p = ph(q.t);
    if (q.stage === 'out' || q.stage === 'exit') {
      if (gst !== 'right') { q.note = q.stage === 'out' ? i18nT('오른쪽으로 쓸어서 줄 안으로 들어가요') : i18nT('다 뛰었어요! 오른쪽으로 쓸어서 나가요'); return; }
      // 줄이 머리 위(0.3~0.75)에 있을 때 들어가고 나가야 걸리지 않는다
      if (p < 0.3 || p > 0.75) { lose(i18nT('줄이 내려올 때 들어가서 걸렸어요 — 줄이 위로 올라갈 때!')); return; }
      if (q.stage === 'out') {
        q.stage = 'in';
        q.x = 150;
        // 들어온 박의 다음 발밑부터 센다
        q.checked = Math.floor((q.t - cycleMs * 0.23) / cycleMs) + (ph(q.t) < 0.5 ? 0 : 0);
        q.did = -1;
        q.note = i18nT('들어왔어요! 부르는 대로 뛰어요');
        play('ok');
      } else {
        q.stage = 'gone';
        q.x = 260;
        q.done = true;
        play('jing');
        setTimeout(() => { setPhase('done'); onComplete({ success: true, score: q.lives, elapsedMs: Date.now() - q.start }); }, 600);
      }
      return;
    }
    if (q.stage !== 'in') return;
    // 줄이 발밑(0 근처)을 지나는 박에 뛴다
    const k = Math.round(q.t / cycleMs);
    const off = q.t - k * cycleMs;
    if (Math.abs(off) > cycleMs * 0.22 || k === q.did) { q.note = i18nT('줄이 발밑에 올 때 뛰어요'); return; }
    const c = q.calls[q.n];
    if (gst !== c.g) { lose(c.g === 'up' ? i18nT('「쌩쌩이」는 위로 크게 쓸어 높이 뛰어요') : i18nT('「콩」은 톡 짧게 뛰어요')); q.did = k; return; }
    q.did = k;
    q.hop = 1;
    q.hopBig = c.g === 'up';
    q.n += 1;
    play(c.g === 'up' ? 'gong' : 'tap');
    q.note = i18nT('{a}번 넘었어요', { a: q.n });
    if (q.n >= jumps) { q.stage = 'exit'; q.note = i18nT('다 뛰었어요! 줄이 위로 갈 때 오른쪽으로 쓸어서 나가요'); }
  };
  const down = useRef(null);
  const pad = usePad({
    onDown: (x, y) => { down.current = { x, y, t: Date.now() }; },
    onUp: (x, y) => { if (down.current) act(gesture(down.current, x, y)); down.current = null; },
  });
  useKeys({ Space: (d) => d && act('tap'), ArrowUp: (d) => d && act('up'), ArrowRight: (d) => d && act('right') }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    q.t += dt * 1000;
    q.hop = Math.max(0, q.hop - dt / (q.hopBig ? 0.55 : 0.35));
    // 줄 안에서 뛰지 않고 줄이 발밑을 지나면 걸린다 — 판정 구간이 닫힌 마지막 박 m
    if (q.stage === 'in' && !q.done) {
      const m = Math.floor((q.t - cycleMs * 0.23) / cycleMs);
      if (m > q.checked) {
        q.checked = m;
        if (q.did !== m) lose(i18nT('줄에 걸렸어요! 부르는 대로 뛰어요'));
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const p = ph(q.t);
  // 줄 모양 — 아래(0)·위(0.5) 사이를 돈다. 화면에서는 위아래로 출렁이는 곡선
  const ropeY = 250 - (1 - Math.cos(p * Math.PI * 2)) * 0.5 * 190;
  const front = p < 0.25 || p > 0.75;
  const hopH = Math.sin((1 - q.hop) * Math.PI) * (q.hop > 0 ? (q.hopBig ? 46 : 22) : 0);
  const cur = q.stage === 'in' ? q.calls[q.n] : null;
  const nxt = q.stage === 'in' ? q.calls[q.n + 1] : null;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('{a}/{b}번 · {c}', { a: q.n, b: jumps, c: q.stage === 'out' ? i18nT('들어가기') : q.stage === 'in' ? i18nT('뛰기') : i18nT('나가기') })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: PAPER }]} testID="rope-enter">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Lives n={q.lives} />
          <Rect x={0} y={262} width={STAGE_W} height={STAGE_H - 262} fill="#e6dcc6" />
          {/* 부르는 소리 */}
          {cur ? (
            <G>
              <Label x={STAGE_W / 2} y={40} s={i18nT(cur.s) + '!'} size={26} color={cur.g === 'up' ? colors.accent : INK} />
              <Label x={STAGE_W / 2} y={60} s={cur.g === 'up' ? i18nT('위로 크게 쓸기') : i18nT('톡')} size={12} color="#7a6f60" weight="700" />
              {nxt ? <Label x={STAGE_W - 40} y={40} s={i18nT('다음 {a}', { a: i18nT(nxt.s) })} size={11} color="#9a8f80" weight="700" /> : null}
            </G>
          ) : null}
          {/* 줄 돌리는 두 사람 */}
          {[22, STAGE_W - 22].map((x) => (
            <G key={x}>
              <Line x1={x} y1={262} x2={x} y2={214} stroke={INK} strokeWidth={4} />
              <Circle cx={x} cy={204} r={9} fill="#f1d3b3" stroke={INK} />
            </G>
          ))}
          {!front ? <Path d={`M26 222 Q150 ${ropeY * 2 - 222} ${STAGE_W - 26} 222`} stroke="#8a5a2b" strokeWidth={3.5} fill="none" /> : null}
          {/* 아이 */}
          <G transform={`translate(${q.x} ${262 - hopH})`}>
            <Line x1={-6} y1={0} x2={0} y2={-20} stroke={INK} strokeWidth={3} />
            <Line x1={6} y1={0} x2={0} y2={-20} stroke={INK} strokeWidth={3} />
            <Line x1={0} y1={-20} x2={0} y2={-42} stroke={color} strokeWidth={10} strokeLinecap="round" />
            <Circle cx={0} cy={-54} r={9} fill="#f1d3b3" stroke={INK} />
          </G>
          {front ? <Path d={`M26 222 Q150 ${ropeY * 2 - 222} ${STAGE_W - 26} 222`} stroke="#8a5a2b" strokeWidth={3.5} fill="none" /> : null}
          {/* 들어가고 나갈 때 알맞은지 */}
          {q.stage === 'out' || q.stage === 'exit' ? (
            <Rect x={20} y={300} width={STAGE_W - 40} height={14} rx={7} fill={p > 0.3 && p < 0.75 ? '#3f7a52' : '#d8cfbe'} />
          ) : null}
          {q.stage === 'out' || q.stage === 'exit' ? <Label x={STAGE_W / 2} y={333} s={p > 0.3 && p < 0.75 ? i18nT('지금! → 쓸기') : i18nT('기다려요')} size={13} /> : null}
          <Label x={STAGE_W / 2} y={q.stage === 'in' ? 300 : 290} s={q.note} size={11.5} color="#5f574c" weight="700" />
        </Svg>
      </View>
    </Shell>
  );
}

// ───────────────────────── 굴렁쇠 — 막대로 밀며 골목을 따라간다 ─────────────────────────
const HOOP_Y = 250;
function alley(d) {
  return 150 + Math.sin(d / 140) * 62 + Math.sin(d / 57) * 18;
}
export function HoopPathGame({ color, onComplete, goal = 2200, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => {
    const stones = [];
    for (let d = 380; d < goal - 120; d += rand(210, 330)) stones.push({ d, off: rand(-26, 26) });
    return { t: 0, d: 0, x: 150, v: 0, wob: 0, lean: 0, lives: maxLives, fx: null, fy: null, keys: {}, stones, hit: -1, note: i18nT('굴렁쇠 바로 아래에 손가락을 대고 밀어요'), start: Date.now(), done: false, fall: 0 };
  };
  const g = useRef(fresh());
  const pad = usePad({
    onDown: (x, y) => { g.current.fx = x; g.current.fy = y; },
    onMove: (x, y) => { g.current.fx = x; g.current.fy = y; },
    onUp: () => { g.current.fx = null; g.current.fy = null; },
  });
  useKeys({
    ArrowLeft: (d) => { g.current.keys.l = d; },
    ArrowRight: (d) => { g.current.keys.r = d; },
    ArrowUp: (d) => { g.current.keys.u = d; },
  }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt;
    if (q.fall > 0) {
      q.fall -= dt;
      if (q.fall <= 0) { q.wob = 0; q.v = 0; q.x = alley(q.d); q.note = i18nT('다시 일으켜 세웠어요. 살살 밀어요'); }
      force((n) => n + 1);
      return;
    }
    // 막대 끝(손가락)이 굴렁쇠 아래 가까이 있어야 민다 — 너무 멀면 힘이 안 닿고, 바짝 붙여 세게 밀면 휘청인다
    let push = 0;
    let steer = 0;
    if (q.fx != null) {
      const dy = q.fy - HOOP_Y;
      const dx = q.fx - q.x;
      if (dy > 6 && dy < 110 && Math.abs(dx) < 70) {
        // 바짝 붙일수록 세게 민다 — 알맞은 거리는 굴렁쇠 아래 30~70
        push = clamp((110 - dy) / 85, 0, 1.25);
        steer = dx * 3; // 막대를 옆으로 옮기면 굴렁쇠가 그쪽으로 따라간다
      } else if (dy <= 6) q.note = i18nT('굴렁쇠 위가 아니라 아래에 막대를 대요');
    }
    if (q.keys.u) push = 0.75;
    if (q.keys.l) steer = -60;
    if (q.keys.r) steer = 60;
    q.v += (push * 260 - q.v * 0.9) * dt;
    q.v = Math.max(0, q.v);
    q.x += steer * dt * (0.3 + q.v / 260);
    q.d += q.v * dt;
    // 너무 빠르면 휘청, 알맞으면 바로 선다
    const fast = q.v > 270;
    const cx = alley(q.d);
    const out = Math.abs(q.x - cx) > 46;
    q.wob += ((fast ? 0.55 : 0) + (out ? 0.9 : 0) - (q.v > 40 && !fast && !out ? 0.45 : 0.08)) * dt;
    // 돌부리
    q.stones.forEach((s, i) => {
      if (i !== q.hit && Math.abs(q.d - s.d) < 10 && Math.abs(q.x - (alley(s.d) + s.off)) < 22) {
        q.hit = i;
        q.wob += 0.45;
        q.v *= 0.5;
        play('clank_stone');
        q.note = i18nT('돌부리에 걸렸어요!');
      }
    });
    q.wob = clamp(q.wob, 0, 1.2);
    q.lean = Math.sin(q.t * 9) * q.wob * 22;
    if (fast) q.note = i18nT('너무 세게 밀었어요 — 휘청여요');
    else if (out) q.note = i18nT('골목 밖이에요 — 길 가운데로');
    if (q.wob >= 1) {
      q.lives -= 1;
      play('fail');
      q.note = i18nT('굴렁쇠가 쓰러졌어요!');
      if (q.lives <= 0) {
        q.done = true;
        setTimeout(() => { setPhase('done'); onComplete({ success: false, score: Math.round(q.d), elapsedMs: Date.now() - q.start }); }, 500);
      } else q.fall = 0.9;
    }
    if (q.d >= goal) {
      q.done = true;
      play('jing');
      setTimeout(() => { setPhase('done'); onComplete({ success: true, score: q.lives, elapsedMs: Date.now() - q.start }); }, 500);
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  // 골목 — 화면 위쪽이 앞(먼 곳)
  const pts = [];
  for (let y = 0; y <= STAGE_H; y += 10) pts.push([y, alley(q.d + (HOOP_Y - y))]);
  const left = pts.map(([y, x], i) => `${i ? 'L' : 'M'}${x - 50} ${y}`).join(' ');
  const right = pts.map(([y, x], i) => `${i ? 'L' : 'M'}${x + 50} ${y}`).join(' ');
  const road = pts.map(([y, x], i) => `${i ? 'L' : 'M'}${x - 50} ${y}`).join(' ') + ' ' + [...pts].reverse().map(([y, x]) => `L${x + 50} ${y}`).join(' ') + ' Z';
  const pct = Math.min(100, Math.round((q.d / goal) * 100));
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('골목 끝까지 {a}%', { a: pct })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#cfc3a6' }]} testID="hoop-path">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Path d={road} fill="#efe6d0" />
          <Path d={left} stroke="#8a7a5c" strokeWidth={3} fill="none" />
          <Path d={right} stroke="#8a7a5c" strokeWidth={3} fill="none" />
          {q.stones.map((s, i) => {
            const y = HOOP_Y - (s.d - q.d);
            if (y < -20 || y > STAGE_H + 20) return null;
            return <Ellipse key={i} cx={alley(s.d) + s.off} cy={y} rx={11} ry={7} fill="#7d7468" stroke={INK} strokeWidth={1} />;
          })}
          {/* 굴렁쇠 */}
          <G transform={`translate(${q.x} ${HOOP_Y}) rotate(${q.fall > 0 ? 80 : q.lean})`}>
            <Ellipse cx={0} cy={-24} rx={9} ry={24} fill="none" stroke="#5a4632" strokeWidth={4} />
            <Line x1={-3} y1={-24 + Math.sin(q.d / 8) * 22} x2={3} y2={-24 - Math.sin(q.d / 8) * 22} stroke="#5a4632" strokeWidth={1.5} />
          </G>
          {/* 막대 — 손가락 위치까지 */}
          {q.fx != null ? <Line x1={q.fx} y1={q.fy} x2={q.x} y2={HOOP_Y - 6} stroke={color} strokeWidth={4} strokeLinecap="round" /> : null}
          {/* 휘청임 */}
          <Rect x={12} y={12} width={110} height={10} rx={5} fill="#e8e0cf" />
          <Rect x={12} y={12} width={110 * clamp(q.wob, 0, 1)} height={10} rx={5} fill={q.wob > 0.66 ? colors.accent : q.wob > 0.33 ? colors.hwang : '#3f7a52'} />
          <Label x={67} y={36} s={i18nT('휘청임')} size={10} color="#5f574c" weight="700" />
          <Lives n={q.lives} />
          <Label x={STAGE_W / 2} y={STAGE_H - 10} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
      </View>
    </Shell>
  );
}

// ───────────────────────── 줄다리기 — 영~(버티기) 차!(당기기), 거짓 구호에 속지 않기 ─────────────────────────
// 박마다 구호 하나: 'y'(영~) · 'c'(차!) · 'f'(상대편 거짓 「영… 차!」 — 우리 편 구호가 아니다)
const ROUNDS = [
  ['y', 'c'],
  ['y', 'c'],
  ['y', 'y', 'c'],
  ['y', 'f', 'y', 'c'],
  ['y', 'c'],
  ['y', 'y', 'f', 'c'],
  ['y', 'f', 'c'],
];
export function TugCallGame({ color, onComplete, beatMs = 720 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const seq = () => {
    const out = [];
    for (let i = 0; i < 6; i++) out.push(...ROUNDS[Math.floor(Math.random() * ROUNDS.length)]);
    return out;
  };
  const LEAD = 1200;
  const fresh = () => ({ t: 0, calls: seq(), pos: 0, hold: false, judged: -1, pulled: -1, flash: 0, note: i18nT('「영~」에는 화면을 꾹 누르고 버텨요'), start: Date.now(), done: false });
  const g = useRef(fresh());
  const idxAt = (t) => Math.floor((t - LEAD) / beatMs);
  const end = (win) => {
    const q = g.current;
    q.done = true;
    play(win ? 'jing' : 'fail');
    setTimeout(() => { setPhase('done'); onComplete({ success: win, score: Math.round(q.pos * 100), elapsedMs: Date.now() - q.start }); }, 600);
  };
  const pullNow = () => {
    const q = g.current;
    if (phase !== 'running' || q.done) return;
    const i = Math.round((q.t - LEAD) / beatMs);
    const off = q.t - (LEAD + i * beatMs);
    const c = q.calls[i];
    if (i < 0 || !c || i === q.pulled) return;
    q.pulled = i;
    if (c === 'c' && Math.abs(off) < beatMs * 0.4) {
      q.pos += Math.abs(off) < beatMs * 0.2 ? 0.17 : 0.11;
      q.flash = 1;
      q.note = i18nT('영차! 끌어왔어요');
      play('drum');
    } else if (c === 'f') {
      q.pos -= 0.16;
      q.note = i18nT('상대편 구호에 속았어요! 우리 편 「차!」에만 당겨요');
      play('fail');
    } else {
      q.pos -= 0.08;
      q.note = i18nT('너무 일찍 당겼어요 — 「차!」까지 버텨요');
      play('fail');
    }
    if (q.pos >= 1) end(true);
    if (q.pos <= -1) end(false);
  };
  const down = useRef(null);
  const pad = usePad({
    onDown: (x, y) => { down.current = { x, y }; g.current.hold = true; },
    onUp: (x, y) => {
      g.current.hold = false;
      if (down.current && gesture(down.current, x, y) === 'down') pullNow();
      down.current = null;
    },
  });
  useKeys({ Space: (d) => { g.current.hold = d; }, ArrowDown: (d) => d && pullNow() }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt * 1000;
    q.flash = Math.max(0, q.flash - dt * 3);
    const i = idxAt(q.t);
    const c = q.calls[i];
    if (i >= 0 && i !== q.lastBeat) { q.lastBeat = i; if (c) play(c === 'c' ? 'gong' : c === 'f' ? 'clank_wood' : 'tap'); }
    // 「영~」 박의 한가운데에 버티고 있지 않으면 조금 끌려간다
    const mid = LEAD + i * beatMs + beatMs * 0.5;
    if (c === 'y' && q.t >= mid && q.judged !== i) {
      q.judged = i;
      if (!q.hold) { q.pos -= 0.05; q.note = i18nT('「영~」에는 꾹 눌러 버텨요'); }
    }
    // 「차!」를 그냥 보내면 상대가 당긴다
    if (c === 'c' && q.t > LEAD + i * beatMs + beatMs * 0.45 && q.pulled !== i && q.judged !== i) {
      q.judged = i;
      q.pos -= 0.09;
      q.note = i18nT('「차!」에 아래로 확 쓸어 당겨요');
    }
    if (i >= q.calls.length) end(q.pos > 0);
    if (q.pos <= -1) end(false);
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const i = idxAt(q.t);
  const c = q.calls[i];
  const call = !c ? '' : c === 'y' ? i18nT('영~') : c === 'c' ? i18nT('차!') : i18nT('(상대편) 차!');
  const ribbon = 150 - q.pos * 110;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('헝겊을 우리 쪽 선 너머로')} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: PAPER }]} testID="tug-call">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Label x={STAGE_W / 2} y={74} s={call} size={c === 'c' ? 40 : 30} color={c === 'c' ? colors.accent : c === 'f' ? '#2b5f8e' : INK} />
          <Label x={STAGE_W / 2} y={100} s={c === 'y' ? i18nT('꾹 버티기') : c === 'c' ? i18nT('아래로 확!') : c === 'f' ? i18nT('속지 마요') : ''} size={12} color="#7a6f60" weight="700" />
          {/* 다음 구호들 */}
          {q.calls.slice(Math.max(0, i + 1), i + 4).map((n, k) => (
            <Label key={k} x={STAGE_W / 2 + 60 + k * 30} y={130} s={n === 'y' ? i18nT('영') : n === 'c' ? i18nT('차') : '?'} size={12} color="#b9ae9c" />
          ))}
          <Line x1={40} y1={170} x2={40} y2={260} stroke="#3f7a52" strokeWidth={2} strokeDasharray="4 4" />
          <Line x1={STAGE_W - 40} y1={170} x2={STAGE_W - 40} y2={260} stroke="#2b5f8e" strokeWidth={2} strokeDasharray="4 4" />
          <Line x1={0} y1={215} x2={STAGE_W} y2={215} stroke="#8a5a2b" strokeWidth={6} />
          <Rect x={ribbon - 7} y={200} width={14} height={30} fill={colors.accent} />
          {/* 우리 편(왼쪽)·상대편(오른쪽) */}
          {[0, 1, 2].map((k) => (
            <G key={k} transform={`translate(${18 + k * 18} 250) rotate(${q.hold ? -18 : -6 - q.flash * 20})`}>
              <Line x1={0} y1={0} x2={0} y2={-30} stroke={color} strokeWidth={8} strokeLinecap="round" />
              <Circle cx={0} cy={-40} r={7} fill="#f1d3b3" stroke={INK} />
            </G>
          ))}
          {[0, 1, 2].map((k) => (
            <G key={k} transform={`translate(${STAGE_W - 18 - k * 18} 250) rotate(12)`}>
              <Line x1={0} y1={0} x2={0} y2={-30} stroke="#2b5f8e" strokeWidth={8} strokeLinecap="round" />
              <Circle cx={0} cy={-40} r={7} fill="#f1d3b3" stroke={INK} />
            </G>
          ))}
          <Label x={40} y={282} s={i18nT('우리 편')} size={11} color="#3f7a52" />
          <Label x={STAGE_W - 40} y={282} s={i18nT('상대편')} size={11} color="#2b5f8e" />
          <Label x={STAGE_W / 2} y={316} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
      </View>
    </Shell>
  );
}
