import React, { useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import Svg, { G, Path, Circle, Line, Rect, Ellipse, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { play } from '../../utils/sound';
import { useRaf, usePad, Shell, Sprite, STAGE_W, STAGE_H, rand, clamp, styles as S } from './common';
import { ART } from './gameArt';
import { t as i18nT } from '../../i18n';

// 2026-11-23 게임 방식 바꾸기 ② — 진짜 놀이 규칙에서 손짓을 가져왔다.
//   비석치기 — 문화체육관광부 「비사치기」 단계처럼 비석을 발등·무릎·어깨(훈장)·머리(떡장수)에 올려 옮긴다.
//              흔들리는 비석 밑으로 손가락(몸)을 옮겨 받치며 걸어가, 상대 비석 위에 떨어뜨린다.
//   자치기   — 알을 튀겨 쳐 낸 뒤 「몇 자?」를 직접 부른다. 많이 부르면 수비가 재서 0점, 적게 부르면 손해.
//   팽이치기 — 채로 치는 방향이 회전 방향과 같아야 빨라진다. 반대로 치면 멈춘다. 느려져 휘청일 때가 칠 때.
//   연날리기 — 누르면 얼레를 감아 오르지만 줄이 팽팽해진다. 센바람이 오면 풀어 줘야 끊기지 않는다. 끝은 연싸움.

const INK = '#2a2420';
const PAPER = '#f4efe3';
const Label = ({ x, y, s, size = 16, color = INK, op = 1, weight = '800' }) => (
  <SvgText x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor="middle" opacity={op}>{s}</SvgText>
);
function Lives({ n, max = 3 }) {
  return <G>{Array.from({ length: max }, (_, i) => <Circle key={i} cx={STAGE_W - 16 - i * 16} cy={16} r={5.5} fill={i < n ? colors.accent : '#d8cfbe'} />)}</G>;
}
function useKeys(map, enabled) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return undefined;
    const dn = (e) => { const f = ref.current[e.code]; if (!f || e.repeat) return; e.preventDefault(); f(true); };
    const up = (e) => { const f = ref.current[e.code]; if (!f) return; e.preventDefault(); f(false); };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [enabled]);
}
const end = (setPhase, onComplete, q, success, score) => {
  q.done = true;
  play(success ? 'jing' : 'fail');
  setTimeout(() => { setPhase('done'); onComplete({ success, score, elapsedMs: Date.now() - q.start }); }, 600);
};

// ───────────────────────── 비석치기 — 몸에 올려 옮기기 ─────────────────────────
// part: 비석을 올린 곳(높이 y와 흔들림 세기)
// y: 비석을 올린 높이(그림 키 130px 기준, 발밑에서 위로)
const KID_H = 130;
const BI_STAGES = [
  { name: '발등', y: -8, dx: 12, k: 0.9 },
  { name: '무릎', y: -40, dx: 8, k: 1.25 },
  { name: '배', y: -62, dx: 10, k: 1.5 },
  { name: '어깨(훈장)', y: -88, dx: -10, k: 1.85 },
  { name: '머리(떡장수)', y: -128, dx: 0, k: 2.2 },
];
export function BiseokCarryGame({ color, onComplete, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const newTarget = () => rand(110, 190);
  const fresh = () => { const tx = newTarget(); return { t: 0, st: 0, kx: tx, ky: 318, sx: tx, th: 0, w: 0, fx: null, tx, walking: true, drop: 0, dropX: 0, fell: 0, lives: maxLives, note: i18nT('비석이 기우는 쪽으로 손가락을 옮겨 받쳐요'), start: Date.now(), done: false, keys: {} }; };
  const g = useRef(fresh());
  const reset = (q) => { q.ky = 318; q.th = 0; q.w = 0; q.kx = q.tx; q.sx = q.tx; q.walking = true; q.drop = 0; };
  const fail = (why) => {
    const q = g.current;
    q.lives -= 1;
    q.note = why;
    play('fail');
    if (q.lives <= 0) { end(setPhase, onComplete, q, false, q.st); return; }
    q.fell = 0.8;
  };
  const release = () => {
    const q = g.current;
    if (phase !== 'running' || q.done || q.walking || q.drop > 0 || q.fell > 0) return;
    // 비석이 떨어지는 자리 — 몸 위치 + 기울기만큼 옆
    q.dropX = q.sx;
    q.drop = 1;
  };
  const pad = usePad({
    onDown: (x) => { g.current.fx = x; if (!g.current.walking) release(); },
    onMove: (x) => { g.current.fx = x; },
    onUp: () => {},
  });
  useKeys({ ArrowLeft: (d) => { g.current.keys.l = d; }, ArrowRight: (d) => { g.current.keys.r = d; }, Space: (d) => d && release() }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (typeof window !== 'undefined') window.__game = q; // 자동 시험(e2e)이 상태를 읽는 곳
    if (q.done) return;
    q.t += dt;
    const P = BI_STAGES[q.st];
    if (q.fell > 0) {
      q.fell -= dt;
      if (q.fell <= 0) { reset(q); q.note = i18nT('다시 올려놓았어요. 천천히 받쳐요'); }
      force((n) => n + 1);
      return;
    }
    // 비석은 걸음마다 흔들려 옆으로 미끄러진다. 비석 밑으로 몸(손가락)을 옮겨 받친다 — 접시 위 구슬 받치기처럼
    if (q.fx != null) q.kx += (clamp(q.fx, 30, 270) - q.kx) * Math.min(1, dt * 10);
    if (q.keys.l) q.kx -= 150 * dt;
    if (q.keys.r) q.kx += 150 * dt;
    q.kx = clamp(q.kx, 30, 270);
    const rel = q.sx - q.kx;
    const step = q.walking ? Math.sin(q.t * 9) * 14 : 0;
    q.w += (rel * 0.8 * P.k + rand(-1, 1) * 30 * P.k + step - (q.sx - q.tx) * 0.25 - q.w * 0.6) * dt;
    q.sx += q.w * dt;
    q.th = clamp(rel / 22, -1, 1) * 0.62;
    if (Math.abs(rel) > 22) { fail(i18nT('비석이 떨어졌어요! 기우는 쪽으로 몸을 옮겨 받쳐요')); return; }
    if (q.walking) {
      q.ky -= 34 * dt;
      if (q.ky <= 200) { q.walking = false; q.note = i18nT('비석 위에 왔어요! 상대 비석 위에서 톡 눌러 떨어뜨려요'); }
    }
    if (q.drop > 0) {
      q.drop -= dt * 2.2;
      if (q.drop <= 0) {
        if (Math.abs(q.dropX - q.tx) < 18) {
          play('clank_stone');
          if (q.st >= BI_STAGES.length - 1) { q.note = i18nT('떡장수까지 다 넘어뜨렸어요!'); end(setPhase, onComplete, q, true, q.lives); return; }
          q.st += 1;
          q.tx = newTarget();
          reset(q);
          q.note = i18nT('넘어뜨렸어요! 이번엔 {a}에 올려요', { a: i18nT(BI_STAGES[q.st].name) });
        } else {
          fail(i18nT('빗나갔어요 — 상대 비석 바로 위에서 떨어뜨려요'));
        }
      }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const P = BI_STAGES[q.st];
  const sx = q.sx;
  const sy = q.ky + P.y - 4;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('{a}단계 · {b}', { a: q.st + 1, b: i18nT(P.name) })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#e8dcc0' }]} testID="biseok-carry">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Lives n={q.lives} />
          {/* 단계 */}
          {BI_STAGES.map((b, i) => (
            <G key={b.name}>
              <Circle cx={22 + i * 22} cy={18} r={7} fill={i < q.st ? '#3f7a52' : i === q.st ? color : '#d8cfbe'} />
            </G>
          ))}
          <Line x1={0} y1={160} x2={STAGE_W} y2={160} stroke="#b8a888" strokeWidth={1} strokeDasharray="5 5" />
          {/* 상대 비석 */}
          <Rect x={q.tx - 9} y={112} width={18} height={30} rx={3} fill="#8d8476" stroke={INK} strokeWidth={1.2} />
          <Ellipse cx={q.tx} cy={144} rx={14} ry={3} fill="rgba(0,0,0,0.2)" />
          {/* 내 비석 */}
          {q.fell > 0 ? (
            <Rect x={sx - 12} y={q.ky - 6} width={24} height={9} rx={2} fill="#6f675b" />
          ) : q.drop > 0 ? (
            <G transform={`translate(${q.dropX} ${sy + (128 - sy) * (1 - q.drop)}) rotate(${(q.th * 180) / Math.PI * q.drop})`}>
              <Rect x={-12} y={-5} width={24} height={9} rx={2} fill="#6f675b" stroke={INK} strokeWidth={1} />
            </G>
          ) : null}
          {/* 기울기 */}
          <Rect x={STAGE_W / 2 - 60} y={STAGE_H - 22} width={120} height={8} rx={4} fill="#d8cfbe" />
          <Circle cx={STAGE_W / 2 + clamp(q.th / 0.62, -1, 1) * 58} cy={STAGE_H - 18} r={6} fill={Math.abs(q.th) > 0.42 ? colors.accent : '#3f7a52'} />
          <Label x={STAGE_W / 2} y={60} s={q.note} size={11} color={INK} weight="700" />
        </Svg>
        <Sprite art={ART.carry} x={q.kx} y={q.ky} h={KID_H} />
        {/* 비석은 아이 앞에 보이게 한 번 더(그림 위) */}
        {q.fell > 0 || q.drop > 0 ? null : (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: STAGE_H }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
              <G transform={`translate(${sx} ${sy}) rotate(${(q.th * 180) / Math.PI})`}>
                <Rect x={-13} y={-5} width={26} height={9} rx={2} fill="#6f675b" stroke={INK} strokeWidth={1} />
              </G>
            </Svg>
          </View>
        )}
      </View>
    </Shell>
  );
}

// ───────────────────────── 자치기 — 쳐 내고 「몇 자?」 부르기 ─────────────────────────
const JA = 6; // 화면에서 1자(px) — 들판을 멀리 보이게 작게
export function JachigiCallGame({ color, onComplete, rounds = 3, goal = 90 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => ({ t: 0, step: 'pop', r: 0, total: 0, alY: 0, alV: 0, dist: 0, fly: 0, call: 20, note: i18nT('위로 쓸어 알을 튀겨 올려요'), start: Date.now(), done: false, msg: '' });
  const g = useRef(fresh());
  const down = useRef(null);
  const nextRound = (q) => {
    q.r += 1;
    if (q.r >= rounds) { end(setPhase, onComplete, q, q.total >= goal, q.total); return; }
    q.step = 'pop';
    q.alY = 0;
    q.alV = 0;
    q.note = i18nT('{a}번째 — 위로 쓸어 알을 튀겨 올려요', { a: q.r + 1 });
  };
  const confirm = () => {
    const q = g.current;
    if (q.step !== 'call') return;
    const actual = Math.round(q.dist);
    if (q.call <= actual) {
      q.total += q.call;
      q.msg = i18nT('수비가 재 보니 {a}자 — 인정! +{b}자', { a: actual, b: q.call });
      play('ok');
    } else {
      q.msg = i18nT('수비가 재 보니 {a}자밖에 안 돼요 — 0점', { a: actual });
      play('fail');
    }
    q.step = 'show';
    setTimeout(() => nextRound(g.current), 1600);
  };
  const act = (kind, sp) => {
    const q = g.current;
    if (phase !== 'running' || q.done) return;
    if (q.step === 'pop' && kind === 'up') {
      q.step = 'air';
      q.alV = 300;
      q.alY = 0;
      q.note = i18nT('알이 떴어요! 내려올 때 옆으로 휙 쓸어 쳐요');
      play('tap');
    } else if (q.step === 'air' && (kind === 'left' || kind === 'right')) {
      // 가장 높이 뜬 뒤 막 내려오는 때(알 속도 -60~-160)가 좋다
      const good = q.alV < -40 && q.alV > -190;
      const timing = good ? 1 - Math.abs(q.alV + 110) / 120 : 0.25;
      q.dist = clamp(18 + timing * 52 * clamp(sp, 0.6, 1.3) + rand(-4, 4), 6, 82);
      q.step = 'fly';
      q.fly = 0;
      q.note = good ? i18nT('딱! 멀리 날아가요') : i18nT('맞기는 했는데 힘이 덜 실렸어요');
      play('drum');
    }
  };
  const pad = usePad({
    onDown: (x, y) => { down.current = { x, y, t: Date.now() }; },
    onUp: (x, y) => {
      const d = down.current;
      down.current = null;
      if (!d) return;
      const q = g.current;
      const dx = x - d.x;
      const dy = y - d.y;
      if (q.step === 'call') {
        // 부르기 — 위·아래 칸과 「불렀다」
        if (y > 270 && x > 200) confirm();
        else if (Math.abs(dy) > 10) { q.call = clamp(q.call - Math.round(dy / 6), 1, 99); }
        else if (y < 200) q.call = clamp(q.call + (x > 150 ? 1 : -1), 1, 99);
        return;
      }
      const dist = Math.hypot(dx, dy);
      if (dist < 18) return;
      const sp = dist / Math.max(60, Date.now() - d.t) / 0.9;
      act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy < 0 ? 'up' : 'down', sp);
    },
  });
  useKeys({
    ArrowUp: (d) => { if (!d) return; if (g.current.step === 'call') g.current.call = clamp(g.current.call + 1, 1, 99); else act('up', 1); },
    ArrowDown: (d) => { if (d && g.current.step === 'call') g.current.call = clamp(g.current.call - 1, 1, 99); },
    ArrowRight: (d) => d && act('right', 1),
    Enter: (d) => d && confirm(),
  }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt;
    if (q.step === 'air') {
      q.alV -= 520 * dt;
      q.alY += q.alV * dt;
      if (q.alY <= 0) { q.alY = 0; q.step = 'pop'; q.note = i18nT('알이 떨어졌어요 — 다시 튀겨 올려요'); }
    }
    if (q.step === 'fly') {
      q.fly = Math.min(1, q.fly + dt * 0.8);
      if (q.fly >= 1) { q.step = 'call'; q.call = 20; q.note = i18nT('몇 자일까요? 위아래로 쓸어 부르고 「불렀다」'); }
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  // 들판 — 아래가 가깝고 위가 멀다(원근). 자 눈금은 10자마다만 흐리게
  const yOf = (d) => 300 - (d / 90) * 240;
  const scale = (d) => 1 - (d / 90) * 0.55;
  const landY = yOf(q.dist * (q.step === 'fly' ? q.fly : 1));
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('{a}/{b}번 · 모은 거리 {c}자 / {d}자', { a: Math.min(q.r + 1, rounds), b: rounds, c: q.total, d: goal })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#d9e4c4' }]} testID="jachigi-call">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          {[10, 20, 30, 40, 50, 60, 70, 80].map((d) => (
            <G key={d}>
              <Line x1={150 - 120 * scale(d)} y1={yOf(d)} x2={150 + 120 * scale(d)} y2={yOf(d)} stroke="#b9c7a2" strokeWidth={d % 20 === 0 ? 1.2 : 0.6} />
              {d % 20 === 0 ? <Label x={150 + 128 * scale(d)} y={yOf(d) + 4} s={String(d)} size={9} color="#8fa080" weight="600" /> : null}
            </G>
          ))}
          {/* 구멍과 긴 자 — 1자의 길이 */}
          <Ellipse cx={150} cy={302} rx={14} ry={4} fill="#5d4b36" />
          <Rect x={196} y={318} width={JA * 9} height={5} fill="#8a5a2b" />
          <Label x={196 + JA * 4.5} y={334} s={i18nT('긴 자 = 1자')} size={9} color="#5f574c" weight="700" />
          {/* 알 */}
          {q.step === 'pop' || q.step === 'air' ? <Rect x={140} y={292 - q.alY * 0.4} width={20} height={5} rx={2} fill="#a0703c" transform={`rotate(${q.step === 'air' ? q.t * 900 : -12} 150 ${294 - q.alY * 0.4})`} /> : null}
          {q.step === 'fly' || q.step === 'call' || q.step === 'show' ? (
            <G>
              <Path d={`M150 296 Q150 ${landY - 60} 150 ${landY}`} stroke="#a0703c" strokeWidth={1} strokeDasharray="3 4" fill="none" opacity={0.6} />
              <Rect x={150 - 8 * scale(q.dist)} y={landY - 2} width={16 * scale(q.dist)} height={4} rx={2} fill="#a0703c" />
            </G>
          ) : null}
          {q.step === 'show' ? <Line x1={150} y1={300} x2={150} y2={yOf(q.dist)} stroke={colors.accent} strokeWidth={2} /> : null}
          {/* 부르기 */}
          {q.step === 'call' ? (
            <G>
              <Rect x={70} y={40} width={160} height={70} rx={12} fill="#fff" stroke={INK} strokeWidth={1.5} />
              <Label x={150} y={92} s={i18nT('{a}자', { a: q.call })} size={34} color={color} />
              <Label x={92} y={82} s="−" size={26} />
              <Label x={208} y={82} s="+" size={26} />
              <Rect x={204} y={276} width={88} height={40} rx={10} fill={color} />
              <Label x={248} y={302} s={i18nT('불렀다')} size={15} color="#fff" />
            </G>
          ) : null}
          {q.msg && q.step === 'show' ? <Label x={150} y={70} s={q.msg} size={13} color={INK} /> : null}
          <Label x={150} y={24} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
        <Sprite art={ART.jachigi} x={112} y={318} h={110} />
      </View>
    </Shell>
  );
}

// ───────────────────────── 팽이치기 — 도는 방향으로 채찍질 ─────────────────────────
export function PaengiWhipGame({ color, onComplete, holdSec = 30 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => ({ t: 0, dir: Math.random() < 0.5 ? 1 : -1, spin: 1, ang: 0, cx: 150, cy: 190, vx: 0, vy: 0, lash: null, lashT: 0, good: 0, note: i18nT('팽이가 도는 방향으로 채찍을 휙 쓸어요'), start: Date.now(), done: false, switchAt: 10 });
  const g = useRef(fresh());
  const down = useRef(null);
  const whip = (x0, y0, x1, y1) => {
    const q = g.current;
    if (phase !== 'running' || q.done) return;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const L = Math.hypot(dx, dy);
    if (L < 30) return;
    // 채찍이 팽이 몸통을 스쳤는지(선분과 중심 거리)
    const tt = clamp(((q.cx - x0) * dx + (q.cy - y0) * dy) / (L * L), 0, 1);
    const px = x0 + dx * tt;
    const py = y0 + dy * tt;
    const dist = Math.hypot(q.cx - px, q.cy - py);
    q.lash = { x0, y0, x1, y1 };
    q.lashT = 0.25;
    if (dist > 46) { q.note = i18nT('채찍이 팽이에 닿지 않았어요 — 팽이를 가로질러 쓸어요'); return; }
    // 화면에서 시계 방향(+1)으로 감기는지: 쓸기 방향 × (중심 - 시작점)
    const cross = dx * (q.cy - y0) - dy * (q.cx - x0);
    const imparts = cross > 0 ? 1 : -1;
    const wobbling = q.spin < 0.45;
    if (imparts === q.dir) {
      q.spin = clamp(q.spin + (wobbling ? 0.42 : 0.24), 0, 1.25);
      q.good += 1;
      q.note = wobbling ? i18nT('딱 때맞춰 쳤어요! 쌩쌩 돌아요') : i18nT('좋아요 — 휘청일 때 치면 더 세져요');
      play(wobbling ? 'ok' : 'tap');
      // 세게 치면 팽이가 밀려난다
      q.vx += dx * 0.25;
      q.vy += dy * 0.25;
    } else {
      q.spin = Math.max(0, q.spin - 0.3);
      q.note = i18nT('반대로 쳤어요! 팽이가 느려져요 — 도는 방향 화살표를 봐요');
      play('fail');
    }
  };
  const pad = usePad({
    onDown: (x, y) => { down.current = { x, y }; },
    onUp: (x, y) => { if (down.current) whip(down.current.x, down.current.y, x, y); down.current = null; },
  });
  // 키보드: ← → 로 위쪽을 가로지르는 채찍
  useKeys({
    ArrowRight: (d) => d && whip(g.current.cx - 70, g.current.cy - 20, g.current.cx + 70, g.current.cy - 20),
    ArrowLeft: (d) => d && whip(g.current.cx + 70, g.current.cy - 20, g.current.cx - 70, g.current.cy - 20),
  }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt;
    q.lashT = Math.max(0, q.lashT - dt);
    q.spin -= dt * (0.085 + q.t * 0.0025);
    q.ang += q.dir * q.spin * 900 * dt;
    q.cx += q.vx * dt;
    q.cy += q.vy * dt;
    q.vx *= 1 - dt * 2.5;
    q.vy *= 1 - dt * 2.5;
    q.cx = clamp(q.cx, 50, 250);
    q.cy = clamp(q.cy, 90, 280);
    // 중간에 다른 팽이(반대로 도는 팽이)로 바뀐다
    if (q.t > q.switchAt) {
      q.switchAt += 10;
      q.dir = -q.dir;
      q.spin = Math.max(q.spin, 0.8);
      q.note = i18nT('새 팽이! 이번엔 반대로 돌아요');
      play('drum');
    }
    if (q.spin <= 0) { q.note = i18nT('팽이가 쓰러졌어요'); end(setPhase, onComplete, q, false, Math.round(q.t)); return; }
    if (q.t >= holdSec) { end(setPhase, onComplete, q, true, q.good); return; }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const wob = q.spin < 0.45 ? (0.45 - q.spin) * 40 * Math.sin(q.t * 14) : 0;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={i18nT('{a}초 동안 돌리기 · {b}초 남음', { a: holdSec, b: Math.max(0, Math.ceil(holdSec - q.t)) })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#dfe6ea' }]} testID="paengi-whip">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          {/* 얼음판 */}
          <Ellipse cx={150} cy={190} rx={135} ry={120} fill="#eef3f6" stroke="#c4d0d8" strokeWidth={2} />
          {/* 팽이 */}
          <G transform={`translate(${q.cx} ${q.cy}) rotate(${wob})`}>
            <Ellipse cx={0} cy={20} rx={22} ry={5} fill="rgba(0,0,0,0.18)" />
            <Circle cx={0} cy={0} r={26} fill="#c99a5b" stroke={INK} strokeWidth={1.5} />
            <G transform={`rotate(${q.ang})`}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <Path key={a} d={`M0 0 L${Math.cos((a * Math.PI) / 180) * 26} ${Math.sin((a * Math.PI) / 180) * 26}`} stroke={a % 120 === 0 ? colors.accent : '#2b5f8e'} strokeWidth={4} />
              ))}
            </G>
            <Circle cx={0} cy={0} r={5} fill={INK} />
          </G>
          {/* 도는 방향 화살표 */}
          <Path d={q.dir > 0 ? 'M160 70 A40 18 0 0 1 220 70' : 'M220 70 A40 18 0 0 0 160 70'} stroke={colors.accent} strokeWidth={3} fill="none" />
          <Polygon points={q.dir > 0 ? '220,70 210,62 212,74' : '160,70 170,62 168,74'} fill={colors.accent} />
          <Label x={190} y={50} s={q.dir > 0 ? i18nT('시계 방향으로 돌아요') : i18nT('시계 반대 방향으로 돌아요')} size={12} color={colors.accent} />
          {q.lashT > 0 && q.lash ? <Line x1={q.lash.x0} y1={q.lash.y0} x2={q.lash.x1} y2={q.lash.y1} stroke="#7a4b12" strokeWidth={3} strokeLinecap="round" opacity={q.lashT * 4} /> : null}
          {/* 도는 힘 */}
          <Rect x={20} y={20} width={110} height={10} rx={5} fill="#cdd6dc" />
          <Rect x={20} y={20} width={110 * clamp(q.spin, 0, 1)} height={10} rx={5} fill={q.spin < 0.45 ? colors.accent : '#3f7a52'} />
          <Label x={75} y={44} s={q.spin < 0.45 ? i18nT('휘청 — 지금 쳐요!') : i18nT('도는 힘')} size={10} color={q.spin < 0.45 ? colors.accent : '#5f574c'} weight="700" />
          <Label x={150} y={STAGE_H - 12} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
      </View>
    </Shell>
  );
}

// ───────────────────────── 연날리기 — 얼레 감고 풀기, 끝은 연싸움 ─────────────────────────
export function KiteReelGame({ color, onComplete, lives: maxLives = 3 }) {
  const [phase, setPhase] = useState('ready');
  const [, force] = useState(0);
  const fresh = () => ({ t: 0, alt: 0.12, ten: 0.2, hold: false, gust: 0, nextGust: 2.5, lives: maxLives, snapT: 0, fight: false, cross: 0, cut: 0, ox: 230, note: i18nT('꾹 눌러 얼레를 감으면 연이 올라가요'), start: Date.now(), done: false });
  const g = useRef(fresh());
  const pad = usePad({ onDown: () => { g.current.hold = true; }, onUp: () => { g.current.hold = false; } });
  useKeys({ Space: (d) => { g.current.hold = d; } }, phase === 'running');

  useRaf((dt) => {
    const q = g.current;
    if (q.done) return;
    q.t += dt;
    if (q.snapT > 0) {
      q.snapT -= dt;
      if (q.snapT <= 0) { q.alt = 0.12; q.ten = 0.2; q.note = i18nT('새 연을 띄웠어요. 센바람엔 풀어 줘요'); }
      force((n) => n + 1);
      return;
    }
    // 센바람
    if (q.gust <= 0 && q.t > q.nextGust) { q.gust = rand(1.4, 2.4); q.nextGust = q.t + q.gust + rand(2, 3.6); }
    const gusty = q.gust > 0;
    if (gusty) q.gust -= dt;
    if (q.hold) {
      q.ten += (gusty ? 0.5 : 0.17) * dt;
      q.alt += (gusty ? 0.02 : 0.085) * dt;
    } else {
      q.ten -= 0.35 * dt;
      q.alt += (gusty ? 0.11 : -0.05) * dt; // 센바람에 풀면 바람을 타고 높이 오른다
    }
    q.ten = clamp(q.ten, 0, 1.05);
    q.alt = clamp(q.alt, 0.05, 1);
    if (!q.fight) q.note = gusty ? (q.hold ? i18nT('센바람! 풀어 줘요 — 줄이 팽팽해요') : i18nT('바람을 타고 올라가요!')) : q.hold ? i18nT('감는 중 — 연이 올라가요') : i18nT('꾹 눌러 감아요');
    if (q.ten >= 1) {
      q.lives -= 1;
      play('fail');
      q.note = i18nT('줄이 끊어졌어요!');
      if (q.lives <= 0) { end(setPhase, onComplete, q, false, Math.round(q.alt * 100)); return; }
      q.snapT = 1;
      q.fight = false;
      q.cut = 0;
    }
    // 하늘 끝에 닿으면 연싸움 — 상대 연 줄과 겹친 동안 팽팽하게(60~95%) 버티면 상대 줄이 끊긴다
    if (!q.fight && q.alt >= 0.95) { q.fight = true; q.note = i18nT('연싸움! 줄이 겹칠 때 팽팽하게 당겨 끊어요'); play('drum'); }
    if (q.fight) {
      q.ox = 150 + Math.sin(q.t * 0.6) * 95;
      q.cross = Math.abs(q.ox - 150) < 42 ? 1 : 0;
      if (q.cross && q.ten > 0.6 && q.ten < 0.97) {
        q.cut += dt;
        q.note = i18nT('겹쳤어요 — 그대로 팽팽하게!');
        if (q.cut >= 1.4) { q.note = i18nT('상대 연 줄을 끊었어요!'); end(setPhase, onComplete, q, true, q.lives); return; }
      } else if (q.cross) q.note = i18nT('겹쳤어요! 꾹 당겨 줄을 팽팽하게');
      else q.note = i18nT('상대 연이 다가와요 — 줄이 겹칠 때를 기다려요');
    }
    force((n) => n + 1);
  }, phase === 'running');

  const start = () => { g.current = fresh(); setPhase('running'); };
  const q = g.current;
  const kx = 150 + Math.sin(q.t * 1.3) * 18;
  const ky = 300 - q.alt * 250;
  const gusty = q.gust > 0;
  return (
    <Shell color={color} phase={phase} onStart={start} hud={q.fight ? i18nT('연싸움!') : i18nT('높이 {a}%', { a: Math.round(q.alt * 100) })} hint="">
      <View ref={pad.ref} {...pad.handlers} style={[S.stage, { backgroundColor: '#cfe3ef' }]} testID="kite-reel">
        <Svg width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
          <Lives n={q.lives} />
          {/* 센바람 줄기 */}
          {gusty ? [60, 110, 160, 210].map((y, i) => <Path key={y} d={`M${((q.t * 160 + i * 70) % 360) - 60} ${y} q30 -8 60 0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.9} />) : null}
          {/* 상대 연 */}
          {q.fight ? (
            <G>
              <Line x1={300} y1={300} x2={q.ox} y2={96} stroke="#555" strokeWidth={1} />
            </G>
          ) : null}
          {/* 내 연과 줄 — 팽팽할수록 곧게 */}
          {q.snapT > 0 ? null : (
            <G>
              <Path d={`M52 282 Q${(52 + kx) / 2 + (1 - q.ten) * 40} ${(282 + ky) / 2 + (1 - q.ten) * 60} ${kx} ${ky}`} stroke={q.ten > 0.8 ? colors.accent : '#5f574c'} strokeWidth={q.ten > 0.8 ? 2 : 1.2} fill="none" />
            </G>
          )}

          {/* 줄 팽팽함 */}
          <Rect x={STAGE_W - 30} y={60} width={12} height={220} rx={6} fill="#e9eef1" stroke="#b8c4cc" />
          <Rect x={STAGE_W - 30} y={60 + 220 * (1 - clamp(q.ten, 0, 1))} width={12} height={220 * clamp(q.ten, 0, 1)} rx={6} fill={q.ten > 0.8 ? colors.accent : q.ten > 0.6 ? colors.hwang : '#3f7a52'} />
          <Label x={STAGE_W - 24} y={296} s={i18nT('팽팽')} size={10} color="#5f574c" weight="700" />
          <Label x={150} y={STAGE_H - 10} s={q.note} size={11.5} color={INK} weight="700" />
        </Svg>
        {q.snapT > 0 ? null : <Sprite art={ART.kite_obj} x={kx} y={ky + 30} h={62} rot={Math.sin(q.t * 2.1) * 6} />}
        {q.fight ? <Sprite art={ART.kite_obj} x={q.ox} y={98} h={46} rot={Math.sin(q.t * 1.7) * 8} opacity={0.9} /> : null}
        <Sprite art={ART.kitekid} x={34} y={STAGE_H - 4} h={96} />
      </View>
    </Shell>
  );
}
