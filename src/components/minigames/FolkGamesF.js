import React, { useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import Svg, { G, Path, Circle, Line, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Sprite, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { ART } from './gameArt';
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
          {/* 땅과 고무줄 — 양쪽 아이 다리에 건 두 줄(뒤쪽 줄은 조금 높고 가늘게) */}
          <Rect x={0} y={236} width={STAGE_W} height={18} fill="#e6dcc6" />
          <Line x1={34} y1={bandY - 9} x2={STAGE_W - 34} y2={bandY - 9} stroke="#b3322b" strokeWidth={2} opacity={0.65} />
          <Line x1={34} y1={bandY} x2={STAGE_W - 34} y2={bandY} stroke="#c0392b" strokeWidth={3.2} />
          <Label x={STAGE_W / 2 + 92} y={bandY - 14} s={i18nT(lv.name)} size={11} color="#b3322b" weight="700" />
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
        <Sprite art={ART.holder} x={30} y={240} h={150} />
        <Sprite art={ART.holder} x={STAGE_W - 30} y={240} h={150} flip />
        <Sprite art={ART.step} x={150} y={240 - (q.flashT > 0 ? Math.sin((q.flashT / 0.25) * Math.PI) * 16 : 0)} h={136} />
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
  const ropeY = 262 - (1 - Math.cos(p * Math.PI * 2)) * 0.5 * 238;
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
          {/* 줄 — 양쪽 아이 손에서 손으로. 발밑(아래)과 머리 위(위) 사이를 돈다 */}
          <Path d={`M52 172 Q150 ${ropeY * 2 - 172} ${STAGE_W - 52} 172`} stroke="#8a5a2b" strokeWidth={front ? 4 : 2.6} fill="none" opacity={front ? 1 : 0.7} />
          {/* 들어가고 나갈 때 알맞은지 */}
          {q.stage === 'out' || q.stage === 'exit' ? (
            <Rect x={20} y={300} width={STAGE_W - 40} height={14} rx={7} fill={p > 0.3 && p < 0.75 ? '#3f7a52' : '#d8cfbe'} />
          ) : null}
          {q.stage === 'out' || q.stage === 'exit' ? <Label x={STAGE_W / 2} y={333} s={p > 0.3 && p < 0.75 ? i18nT('지금! → 쓸기') : i18nT('기다려요')} size={13} /> : null}
          <Label x={STAGE_W / 2} y={q.stage === 'in' ? 300 : 290} s={q.note} size={11.5} color="#5f574c" weight="700" />
        </Svg>
        <Sprite art={ART.turner} x={30} y={262} h={150} />
        <Sprite art={ART.turner} x={STAGE_W - 30} y={262} h={150} flip />
        <Sprite art={ART.jump} x={q.x} y={262 - hopH} h={118} />
        {front ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: STAGE_H }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
              <Path d={`M52 172 Q150 ${ropeY * 2 - 172} ${STAGE_W - 52} 172`} stroke="#8a5a2b" strokeWidth={4} fill="none" />
            </Svg>
          </View>
        ) : null}
      </View>
    </Shell>
  );
}

// ───────────────────────── 굴렁쇠 — 옆에서 본 골목, 채를 대는 자리로 밀고 누르고 들어 넘긴다 ─────────────────────────
// 실제 굴렁쇠처럼 채(ㄷ자 끝)를 바퀴 어디에 대느냐가 조종이다.
//   바퀴 아래 뒤쪽에 대면 → 앞으로 민다(오르막에 필요)
//   바퀴 위쪽에 대면 → 눌러 늦춘다(내리막에 필요)
//   돌부리 앞에서는 위로 끌어 「들어 넘긴다」
const GROUND = 268;
const HOOP_R = 26;
const HOOP_X = 178;
function terrain(d) {
  // 오르막·내리막이 번갈아 오는 골목 — 기울기(+ 오르막)
  const seg = Math.floor(d / 260);
  const kind = [0, 1, 0, -1, 1, 0, -1, -1, 0, 1, 0, -1][seg % 12];
  return kind;
}
function groundY(d) {
  let y = 0;
  for (let x = 0; x < d; x += 20) y -= terrain(x) * 20 * 0.18;
  return y;
}
export function HoopPathGame({ color, onComplete, goal = 2600, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => {
    const stones = [];
    for (let d = 420; d < goal - 160; d += rand(260, 420)) stones.push(d);
    return { t: 0, d: 0, v: 60, c: 0.3, wob: 0, lives: maxLives, stones, hit: -1, lifted: -1, keys: {}, note: i18nT('손가락을 위아래로 움직여 채를 대는 자리를 바꿔요'), start: Date.now(), done: false, fall: 0, spin: 0 };
  };
  const g = useRef(fresh());
  const setC = (y) => {
    // 손가락 높이 → 채를 대는 자리(0 바퀴 아래 · 1 바퀴 위)
    g.current.c = clamp((GROUND - y) / (HOOP_R * 2 + 30), 0, 1);
  };
  const pad = usePad({ onDown: (x, y) => setC(y), onMove: (x, y) => setC(y) });
  useKeys({ ArrowUp: (d) => { g.current.keys.u = d; }, ArrowDown: (d) => { g.current.keys.d = d; } }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt;
    if (q.keys.u) q.c = clamp(q.c + dt * 1.6, 0, 1);
    if (q.keys.d) q.c = clamp(q.c - dt * 1.6, 0, 1);
    if (q.fall > 0) {
      q.fall -= dt;
      if (q.fall <= 0) { q.wob = 0; q.v = 50; q.note = i18nT('다시 굴려요. 길을 미리 보고 채를 옮겨요'); }
      force((n) => n + 1);
      return;
    }
    const slope = terrain(q.d + 30);
    // 채 자리: 아래(0)는 밀기, 위(1)는 누르기. 오르막은 속도를 깎고 내리막은 붙인다
    const push = (0.5 - q.c) * 2; // +1 민다 · -1 누른다
    q.v += (push * 120 - slope * 95 - (q.v - 90) * 0.35) * dt;
    q.v = clamp(q.v, 0, 260);
    q.d += q.v * dt;
    q.spin += (q.v * dt) / HOOP_R;
    // 너무 느리면 쓰러지고, 너무 빠르면 튄다
    const slow = q.v < 45;
    const fast = q.v > 175;
    q.wob += ((slow ? 0.7 : 0) + (fast ? 0.6 : 0) - (!slow && !fast ? 0.35 : 0)) * dt;
    if (slow) q.note = slope > 0 ? i18nT('오르막이에요 — 채를 바퀴 아래에 대고 밀어요') : i18nT('너무 느려요 — 아래쪽을 밀어요');
    else if (fast) q.note = slope < 0 ? i18nT('내리막이에요 — 채를 바퀴 위에 대고 눌러요') : i18nT('너무 빨라요 — 위쪽을 눌러 늦춰요');
    else q.note = i18nT('좋아요 — 앞길을 보고 채를 옮겨요');
    // 돌부리 — 지나가는 순간 채가 위쪽(0.72 이상)이면 들어 넘긴다
    q.stones.forEach((sd, i) => {
      if (i !== q.hit && i !== q.lifted && q.d > sd - 6 && q.d < sd + 6) {
        if (q.c >= 0.72) { q.lifted = i; q.note = i18nT('들어 넘겼어요!'); play('tap'); }
        else { q.hit = i; q.wob += 0.5; q.v *= 0.55; play('clank_stone'); q.note = i18nT('돌부리에 걸렸어요 — 돌 앞에서는 위로 들어 넘겨요'); }
      }
    });
    q.wob = clamp(q.wob, 0, 1.2);
    if (q.wob >= 1) {
      q.lives -= 1;
      play('fail');
      q.note = i18nT('굴렁쇠가 쓰러졌어요!');
      if (q.lives <= 0) { q.done = true; setTimeout(() => { setPhase('done'); onComplete({ success: false, score: Math.round(q.d), elapsedMs: Date.now() - q.start }); }, 500); }
      else q.fall = 1;
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
  const base = groundY(q.d);
  const gy = (x) => GROUND + (groundY(q.d + (x - HOOP_X)) - base);
  const pts = [];
  for (let x = -10; x <= STAGE_W + 10; x += 10) pts.push(`${x} ${gy(x)}`);
  const ground = `M-10 ${STAGE_H} L${pts.join(' L')} L${STAGE_W + 10} ${STAGE_H} Z`;
  const hy = gy(HOOP_X) - HOOP_R;
  // 채가 닿는 자리 — 바퀴 뒤쪽 테두리, 아래(210°)에서 위(120°)까지
  const ang = ((210 - q.c * 90) * Math.PI) / 180;
  const cx = HOOP_X + Math.cos(ang) * HOOP_R;
  const cy = hy - Math.sin(ang) * HOOP_R;
  const lean = q.fall > 0 ? 70 : Math.sin(q.t * 10) * q.wob * 16;
  const pct = Math.min(100, Math.round((q.d / goal) * 100));
  const ahead = terrain(q.d + 140);
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('골목 끝까지 {a}%', { a: pct })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#efe6d0' }]} testID="hoop-path">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          {/* 돌담 */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = ((i * 46 - q.d * 0.5) % 414 + 414) % 414 - 40;
            return <Rect key={i} x={x} y={150} width={42} height={22} rx={8} fill="#d6cab0" stroke="#b9ab8c" />;
          })}
          <Path d={ground} fill="#d9c9a3" stroke="#a8946c" strokeWidth={2} />
          {q.stones.map((sd, i) => {
            const x = HOOP_X + (sd - q.d);
            if (x < -20 || x > STAGE_W + 20) return null;
            return <Ellipse key={i} cx={x} cy={gy(x) - 5} rx={12} ry={7} fill="#7d7468" stroke={INK} strokeWidth={1} />;
          })}
          {/* 굴렁쇠 */}
          <G transform={`rotate(${lean} ${HOOP_X} ${gy(HOOP_X)})`}>
            <Circle cx={HOOP_X} cy={hy} r={HOOP_R} fill="none" stroke="#4a3a28" strokeWidth={4.5} />
            {[0, 1, 2].map((k) => {
              const a2 = q.spin + (k * Math.PI * 2) / 3;
              return <Line key={k} x1={HOOP_X} y1={hy} x2={HOOP_X + Math.cos(a2) * (HOOP_R - 3)} y2={hy + Math.sin(a2) * (HOOP_R - 3)} stroke="#4a3a28" strokeWidth={1} opacity={0.35} />;
            })}
          </G>
          {/* 채 — 아이 손에서 바퀴 뒤쪽 테두리까지 */}
          {q.fall > 0 ? null : <Line x1={118} y1={gy(96) - 70} x2={cx} y2={cy} stroke="#7a4b12" strokeWidth={3.5} strokeLinecap="round" />}
          {/* 앞길 알림 */}
          <Label x={STAGE_W - 52} y={58} s={ahead > 0 ? i18nT('오르막 ↗') : ahead < 0 ? i18nT('내리막 ↘') : i18nT('평지 →')} size={13} color={ahead > 0 ? '#2b5f8e' : ahead < 0 ? colors.accent : '#5f574c'} />
          {/* 채 자리 눈금 */}
          <Rect x={12} y={190} width={8} height={70} rx={4} fill="#e2d6bd" />
          <Circle cx={16} cy={260 - q.c * 70} r={6} fill={color} />
          <Label x={30} y={196} s={i18nT('누르기')} size={9} color="#5f574c" weight="700" />
          <Label x={28} y={262} s={i18nT('밀기')} size={9} color="#5f574c" weight="700" />
          {/* 휘청임 */}
          <Rect x={12} y={12} width={110} height={10} rx={5} fill="#e8e0cf" />
          <Rect x={12} y={12} width={110 * clamp(q.wob, 0, 1)} height={10} rx={5} fill={q.wob > 0.66 ? colors.accent : q.wob > 0.33 ? colors.hwang : '#3f7a52'} />
          <Label x={67} y={36} s={i18nT('휘청임')} size={10} color="#5f574c" weight="700" />
          <Lives n={q.lives} />
          <Label x={STAGE_W / 2} y={STAGE_H - 10} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
        <Sprite art={ART.hoopkid} x={96} y={gy(96) + 2} h={128} rot={-4} />
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
          <Rect x={0} y={262} width={STAGE_W} height={STAGE_H - 262} fill="#e6dcc6" />
          <Line x1={0} y1={205} x2={STAGE_W} y2={205} stroke="#8a5a2b" strokeWidth={7} />
          <Line x1={0} y1={203} x2={STAGE_W} y2={203} stroke="#b07d48" strokeWidth={2} strokeDasharray="6 5" />
          <Rect x={ribbon - 7} y={190} width={14} height={32} fill={colors.accent} />
          <Label x={56} y={282} s={i18nT('우리 편')} size={11} color="#3f7a52" />
          <Label x={STAGE_W - 56} y={282} s={i18nT('상대편')} size={11} color="#2b5f8e" />
          <Label x={STAGE_W / 2} y={316} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
        {[{ x: 34, k: 0 }, { x: 78, k: 1 }].map((m) => (
          <Sprite key={m.k} art={q.flash > 0.3 ? ART.tug_pull : ART.tug_hold} x={m.x - q.pos * 8} y={262} h={120} flip rot={q.hold ? -8 : -3} />
        ))}
        {[{ x: STAGE_W - 34, k: 0 }, { x: STAGE_W - 78, k: 1 }].map((m) => (
          <Sprite key={m.k} art={ART.tug_opp} x={m.x - q.pos * 8} y={262} h={120} flip rot={6} />
        ))}
      </View>
    </Shell>
  );
}
