import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { G, Path, Ellipse, Circle, Rect, Line } from 'react-native-svg';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { MOVES } from '../data/talchum';
import { judgeTap, scoreChart, passed, OK_RATIO } from '../utils/talchumLogic';
import { useRaf } from './minigames/common';

// 탈춤 판 — 위에서 춤사위 카드가 내려오고, 카드가 장단 선에 닿는 박에 그 줄을 톡 누른다.
// 처음 한 장단은 듣기(북 네 번). 카드는 두 박 동안 내려오므로 듣는 동안 첫 카드가 미리 보인다.
// 줄을 누를 때마다 탈꾼이 그 춤사위로 춤춘다(맞든 틀리든) — 눌러 보는 것 자체가 재미가 되게.
const COUNT_IN = 4;

// 팔 자세: [어깨→팔꿈치 각도, 팔꿈치→손 각도] (도, 0 = 오른쪽, 90 = 아래)
const POSE = {
  idle: { l: [120, 100], r: [60, 80], lean: 0, leg: 0 },
  left: { l: [215, 250], r: [55, 75], lean: -6, leg: 0 },
  right: { l: [125, 105], r: [-35, -70], lean: 6, leg: 0 },
  kkaekki: { l: [165, 255], r: [15, -75], lean: 0, leg: 1 },
  turn: { l: [200, 160], r: [-20, 20], lean: 14, leg: 2 },
};

function arm(x, y, a1, a2, len1, len2) {
  const r = (d) => (d * Math.PI) / 180;
  const ex = x + Math.cos(r(a1)) * len1;
  const ey = y + Math.sin(r(a1)) * len1;
  const hx = ex + Math.cos(r(a2)) * len2;
  const hy = ey + Math.sin(r(a2)) * len2;
  return { ex, ey, hx, hy, dir: a2 };
}

// 한삼 — 손끝에서 길게 늘어진 흰 소매(바람에 휘는 모양)
function Hansam({ hx, hy, dir, flick }) {
  const r = (d) => (d * Math.PI) / 180;
  const L = flick ? 46 : 30;
  const bend = flick ? 18 : 8;
  const tx = hx + Math.cos(r(dir)) * L;
  const ty = hy + Math.sin(r(dir)) * L;
  const nx = Math.cos(r(dir + 90)) * bend;
  const ny = Math.sin(r(dir + 90)) * bend;
  const mx = (hx + tx) / 2 + nx;
  const my = (hy + ty) / 2 + ny;
  return (
    <Path
      d={`M${hx - 4} ${hy} Q${mx - 5} ${my} ${tx} ${ty} Q${mx + 5} ${my + 4} ${hx + 4} ${hy + 2} Z`}
      fill="#fbf8f0"
      stroke="#cfc6b2"
      strokeWidth={1}
    />
  );
}

function Dancer({ pose, flick, size = 200 }) {
  const p = POSE[pose] || POSE.idle;
  const sx = 100;
  const sy = 92;
  const L = arm(sx - 18, sy, p.l[0], p.l[1], 26, 24);
  const R = arm(sx + 18, sy, p.r[0], p.r[1], 26, 24);
  return (
    <Svg width={size} height={(size * 210) / 200} viewBox="0 0 200 210">
      <Ellipse cx={100} cy={200} rx={48} ry={6} fill="rgba(0,0,0,0.12)" />
      <G rotation={p.lean} origin="100, 150">
        {/* 다리 — 깨끼·돌기에서 한쪽 무릎을 든다 */}
        <Path d={`M92 150 L${p.leg === 2 ? 74 : 88} ${p.leg ? 172 : 196}`} stroke="#f3eee3" strokeWidth={10} strokeLinecap="round" />
        <Path d={`M108 150 L${p.leg === 1 ? 124 : 112} ${p.leg === 1 ? 176 : 196}`} stroke="#f3eee3" strokeWidth={10} strokeLinecap="round" />
        {/* 웃옷(더거리) */}
        <Path d="M78 88 Q100 80 122 88 L128 152 Q100 160 72 152 Z" fill="#2c7a64" stroke="#1d4f41" strokeWidth={1.5} />
        <Path d="M96 86 L100 152 L104 86" fill="#b8312a" opacity={0.9} />
        {/* 팔 */}
        <Path d={`M${sx - 18} ${sy} L${L.ex} ${L.ey} L${L.hx} ${L.hy}`} stroke="#2c7a64" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d={`M${sx + 18} ${sy} L${R.ex} ${R.ey} L${R.hx} ${R.hy}`} stroke="#2c7a64" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Hansam hx={L.hx} hy={L.hy} dir={L.dir} flick={flick === 'left' || flick === 'kkaekki' || flick === 'turn'} />
        <Hansam hx={R.hx} hy={R.hy} dir={R.dir} flick={flick === 'right' || flick === 'kkaekki' || flick === 'turn'} />
        {/* 탈 — 붉은 바탕, 검은 눈썹, 흰 눈, 크게 벌린 입(특정 탈을 본뜨지 않은 단순한 모양) */}
        <Ellipse cx={100} cy={58} rx={24} ry={29} fill="#b8312a" stroke="#6e1c17" strokeWidth={1.5} />
        <Path d="M82 47 Q89 41 96 47" stroke="#1d1b19" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <Path d="M104 47 Q111 41 118 47" stroke="#1d1b19" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <Circle cx={90} cy={55} r={4.2} fill="#fbf8f0" />
        <Circle cx={110} cy={55} r={4.2} fill="#fbf8f0" />
        <Circle cx={90} cy={55} r={1.8} fill="#1d1b19" />
        <Circle cx={110} cy={55} r={1.8} fill="#1d1b19" />
        <Ellipse cx={100} cy={73} rx={8} ry={pose === 'idle' ? 3 : 5} fill="#3a0f0c" />
        <Circle cx={84} cy={66} r={2.4} fill="#e3b23c" />
        <Circle cx={116} cy={66} r={2.4} fill="#e3b23c" />
        <Path d="M78 40 Q100 22 122 40" stroke="#1d1b19" strokeWidth={5} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

export default function TalchumDance({ stage, onDone, resetKey }) {
  const chart = stage.chart || [];
  const lanes = stage.lanes || ['left', 'right'];
  const total = (stage.bars ? stage.bars.length : stage.cycles) * 4;
  const byBeat = useRef(new Map());
  byBeat.current = new Map(chart.map((n) => [n.beat, n]));
  const [phase, setPhase] = useState('ready'); // ready → count → dance → done
  const [beat, setBeat] = useState(-COUNT_IN);
  const [pos, setPos] = useState(-COUNT_IN - 1); // 지금 몇 번째 박인지(소수) — 카드 위치
  const [pose, setPose] = useState('idle');
  const [flick, setFlick] = useState(null);
  const [cheer, setCheer] = useState('');
  const [hitSet, setHitSet] = useState(() => new Set());
  const [flash, setFlash] = useState(null); // { lane, at }
  const [result, setResult] = useState(null);
  const t0 = useRef(0);
  const startAt = useRef(0);
  const taps = useRef([]);
  const timers = useRef([]);
  const running = phase === 'count' || phase === 'dance';

  useRaf(() => setPos((Date.now() - t0.current) / stage.beatMs), running);

  const clear = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    clear();
    setPhase('ready');
    setBeat(-COUNT_IN);
    setPos(-COUNT_IN - 1);
    setPose('idle');
    setHitSet(new Set());
    setResult(null);
    setCheer('');
  }, [resetKey]);

  const finish = useCallback(() => {
    const score = scoreChart(taps.current, stage.beatMs, chart);
    const win = passed(score, stage.pass);
    setResult({ ...score, win });
    setPhase('done');
    play(win ? 'jing' : 'geomungo');
    if (win && onDone) onDone({ score, elapsedMs: Date.now() - startAt.current });
  }, [stage, chart, onDone]);

  const start = () => {
    clear();
    taps.current = [];
    setHitSet(new Set());
    setResult(null);
    setCheer('');
    setPhase('count');
    play('daegeum');
    const now = Date.now();
    startAt.current = now;
    t0.current = now + 600 + COUNT_IN * stage.beatMs;
    for (let i = -COUNT_IN; i < total; i += 1) {
      const at = 600 + (i + COUNT_IN) * stage.beatMs;
      timers.current.push(
        setTimeout(() => {
          setBeat(i);
          if (i === 0) setPhase('dance');
          play(((i % 4) + 4) % 4 === 0 ? 'drum' : 'tap');
        }, at)
      );
    }
    timers.current.push(setTimeout(finish, 600 + (total + COUNT_IN) * stage.beatMs + stage.beatMs * 0.4));
  };

  // 줄을 누름 — 가운데(깨끼) 줄은 그 박의 카드가 '뛰어 돌기'면 돌기로 친다
  const dance = useCallback(
    (lane) => {
      const tt = Date.now() - t0.current;
      const j = judgeTap(tt, stage.beatMs, total);
      const note = j.grade !== 'miss' ? byBeat.current.get(j.beat) : null;
      const move = lane === 'kkaekki' && note && note.move === 'turn' ? 'turn' : lane;
      setPose(move);
      setFlick(move);
      setTimeout(() => {
        setPose('idle');
        setFlick(null);
      }, Math.min(380, stage.beatMs * 0.6));
      if (phase !== 'dance' && phase !== 'count') return;
      taps.current.push({ t: tt, move });
      if (!note || note.move !== move) {
        setCheer('');
        return;
      }
      setHitSet((prev) => {
        if (prev.has(j.beat)) return prev;
        const n = new Set(prev);
        n.add(j.beat);
        return n;
      });
      setFlash({ lane, at: Date.now() });
      setCheer(j.grade === 'good' ? t('얼씨구!') : t('좋다!'));
    },
    [phase, stage.beatMs, total]
  );

  // 웹: A(왼)·S(깨끼)·D(오른) 키로도 춤춘다. W는 가운데 줄
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const h = (e) => {
      if (e.repeat) return;
      const m = MOVES.find((mv) => e.code === `Key${mv.key.toUpperCase()}`);
      if (!m) return;
      const lane = m.id === 'turn' ? 'kkaekki' : m.id;
      if (!lanes.includes(lane)) return;
      e.preventDefault();
      dance(lane);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dance, lanes]);

  const inBar = ((beat % 4) + 4) % 4;
  const hits = hitSet.size;
  const laneOf = (move) => (move === 'turn' ? 'kkaekki' : move);
  const showCards = running || phase === 'ready';
  const b = phase === 'ready' ? -COUNT_IN - 1 : pos;

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        <View style={s.head}>
          <Dancer pose={pose} flick={flick} size={112} />
          <View style={s.headInfo}>
            <Text style={s.jangdan}>{t(stage.jangdan)}</Text>
            <View style={s.beats}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[s.beat, i === 0 && s.beatHead, running && inBar === i && s.beatOn]}>
                  <Text style={[s.beatTxt, running && inBar === i && s.beatTxtOn]}>{i === 0 ? t('덩') : i + 1}</Text>
                </View>
              ))}
            </View>
            <Text style={s.sub}>{phase === 'count' && beat < 0 ? t('장단 듣기') : t('맞힌 카드 {p0} / {p1}', { p0: hits, p1: stage.pass })}</Text>
            <Text style={s.cheer}>{cheer || ' '}</Text>
          </View>
        </View>

        <View style={s.road}>
          {lanes.map((lane, li) => {
            const flashOn = flash && flash.lane === lane && Date.now() - flash.at < 260;
            return (
              <Pressable
                key={lane}
                accessibilityRole="button"
                accessibilityLabel={t(LANE_NAME[lane])}
                onPressIn={() => dance(lane)}
                style={[s.lane, li > 0 && s.laneSep]}
              >
                <View style={[s.hitLine, flashOn && s.hitLineOn]} />
                {showCards
                  ? chart
                      .filter((n) => laneOf(n.move) === lane)
                      .map((n) => {
                        const ahead = n.beat - b; // 선에 닿기까지 남은 박
                        if (ahead > TRAVEL + 0.2 || ahead < -0.9) return null;
                        const hit = hitSet.has(n.beat);
                        if (hit) return null;
                        const late = ahead < -OK_RATIO;
                        const y = HIT_Y - (ahead / TRAVEL) * (HIT_Y + CARD_H);
                        return (
                          <View key={n.beat} style={[s.card, { top: y - CARD_H / 2, backgroundColor: CARD_COLOR[n.move] }, late && s.cardLate]}>
                            <Text style={s.cardTxt}>{t(LANE_NAME[n.move])}</Text>
                          </View>
                        );
                      })
                  : null}
                <View style={s.laneFoot}>
                  <Text style={s.laneTxt}>{t(LANE_NAME[lane])}</Text>
                  {Platform.OS === 'web' ? <Text style={s.keyTxt}>{KEY_OF[lane]}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={s.help}>{t('카드가 빨간 장단 선에 닿을 때 그 줄을 톡!')}</Text>
      </View>

      {phase === 'ready' ? (
        <Pressable style={s.startBtn} onPress={start}>
          <Text style={s.startTxt}>{t('장단 시작')}</Text>
        </Pressable>
      ) : null}

      {phase === 'done' && result ? (
        <View style={s.result}>
          <Text style={s.resultTitle}>{result.win ? t('한 판 잘 놀았다! 🎭') : t('조금만 더! 카드가 선에 닿을 때를 기다렸다 눌러 봐요')}</Text>
          <Text style={s.resultTxt}>{t('카드 {p0}장 가운데 {p1}장을 맞혔어요 (얼씨구 {p2} · 좋다 {p3})', { p0: result.notes, p1: result.hits, p2: result.good, p3: result.ok })}</Text>
          {!result.win ? (
            <Pressable style={s.startBtn} onPress={start}>
              <Text style={s.startTxt}>{t('다시 추기')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// 카드가 내려오는 길 — 카드는 TRAVEL 박 동안 위에서 장단 선까지 내려온다
const ROAD_H = 250;
const HIT_Y = 186;
const CARD_H = 40;
const TRAVEL = 2;
const LANE_NAME = { left: '왼 한삼', right: '오른 한삼', kkaekki: '깨끼', turn: '뛰어 돌기' };
const CARD_COLOR = { left: '#2c7a64', right: '#2f5d9e', kkaekki: '#b8312a', turn: '#c8982b' };
const KEY_OF = { left: 'A', kkaekki: 'S', right: 'D' };

const s = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 420, alignItems: 'center', gap: 10 },
  stage: { width: '100%', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, gap: 6 },
  head: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  headInfo: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  jangdan: { fontSize: 13, fontWeight: '800', color: colors.ink },
  beats: { flexDirection: 'row', gap: 8 },
  beat: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  beatHead: { borderColor: colors.accent },
  beatOn: { backgroundColor: colors.accent, borderColor: colors.accent, transform: [{ scale: 1.15 }] },
  beatTxt: { fontSize: 12, fontWeight: '800', color: colors.muted },
  beatTxtOn: { color: '#fff' },
  sub: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
  cheer: { fontSize: 22, fontWeight: '800', color: colors.accent, height: 30 },
  road: { width: '100%', height: ROAD_H, flexDirection: 'row', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, overflow: 'hidden' },
  lane: { flex: 1, height: '100%', position: 'relative' },
  laneSep: { borderLeftWidth: 1, borderLeftColor: colors.border },
  hitLine: { position: 'absolute', left: 0, right: 0, top: HIT_Y - 2, height: 4, backgroundColor: colors.accent, opacity: 0.55 },
  hitLineOn: { opacity: 1, height: 10, top: HIT_Y - 5 },
  card: { position: 'absolute', left: 8, right: 8, height: CARD_H, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fbf8f0' },
  cardLate: { opacity: 0.3 },
  cardTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  laneFoot: { position: 'absolute', left: 0, right: 0, bottom: 0, height: ROAD_H - HIT_Y - 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.border },
  laneTxt: { fontSize: 14, fontWeight: '800', color: colors.ink },
  keyTxt: { fontSize: 10, color: colors.muted },
  help: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  startBtn: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: colors.accent, borderRadius: 4 },
  startTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  result: { width: '100%', alignItems: 'center', gap: 6, padding: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  resultTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  resultTxt: { fontSize: 12.5, color: colors.ink, textAlign: 'center' },
});
