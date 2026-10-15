import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { G, Path, Ellipse, Circle, Rect, Line } from 'react-native-svg';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { MOVES } from '../data/talchum';
import { judgeTap, scoreDance, passed } from '../utils/talchumLogic';

// 탈춤 판 — 장단(큰 박 넷)이 울리면 박에 맞춰 춤사위 단추를 누른다.
// 처음 한 장단은 듣기(북 네 번), 그다음 stage.cycles 장단 동안 춤.
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

function Dancer({ pose, flick }) {
  const p = POSE[pose] || POSE.idle;
  const sx = 100;
  const sy = 92;
  const L = arm(sx - 18, sy, p.l[0], p.l[1], 26, 24);
  const R = arm(sx + 18, sy, p.r[0], p.r[1], 26, 24);
  return (
    <Svg width={200} height={210} viewBox="0 0 200 210">
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
  const total = stage.beatMs > 0 ? stage.cycles * 4 : 0;
  const [phase, setPhase] = useState('ready'); // ready → count → dance → done
  const [beat, setBeat] = useState(-COUNT_IN);
  const [pose, setPose] = useState('idle');
  const [flick, setFlick] = useState(null);
  const [cheer, setCheer] = useState('');
  const [hits, setHits] = useState(0);
  const [result, setResult] = useState(null);
  const t0 = useRef(0);
  const startAt = useRef(0);
  const taps = useRef([]);
  const used = useRef(new Set());
  const timers = useRef([]);

  const clear = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    clear();
    setPhase('ready');
    setBeat(-COUNT_IN);
    setPose('idle');
    setHits(0);
    setResult(null);
    setCheer('');
  }, [resetKey]);

  const finish = useCallback(() => {
    const score = scoreDance(taps.current, stage.beatMs, total);
    const win = passed(score, stage.pass);
    setResult({ ...score, win });
    setPhase('done');
    play(win ? 'jing' : 'geomungo');
    if (win && onDone) onDone({ score, elapsedMs: Date.now() - startAt.current });
  }, [stage, total, onDone]);

  const start = () => {
    clear();
    taps.current = [];
    used.current = new Set();
    setHits(0);
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

  const dance = useCallback(
    (move) => {
      setPose(move);
      setFlick(move);
      setTimeout(() => {
        setPose('idle');
        setFlick(null);
      }, Math.min(380, stage.beatMs * 0.6));
      if (phase !== 'dance' && phase !== 'count') return;
      const tt = Date.now() - t0.current;
      taps.current.push({ t: tt, move });
      const j = judgeTap(tt, stage.beatMs, total);
      if (j.grade === 'miss' || used.current.has(j.beat)) {
        setCheer('');
        return;
      }
      used.current.add(j.beat);
      setHits((n) => n + 1);
      setCheer(j.grade === 'good' ? t('얼씨구!') : t('좋다!'));
    },
    [phase, stage.beatMs, total]
  );

  // 웹: A·D·S·W 키로도 춤춘다
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const h = (e) => {
      if (e.repeat) return;
      const m = MOVES.find((mv) => e.code === `Key${mv.key.toUpperCase()}`);
      if (m) {
        e.preventDefault();
        dance(m.id);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dance]);

  const inBar = ((beat % 4) + 4) % 4;
  const bar = beat < 0 ? 0 : Math.floor(beat / 4) + 1;

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        <Text style={s.jangdan}>{t(stage.jangdan)} · {phase === 'count' && beat < 0 ? t('장단 듣기') : t('{p0} / {p1}장단', { p0: Math.min(bar, stage.cycles), p1: stage.cycles })}</Text>
        <View style={s.beats}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.beat, i === 0 && s.beatHead, (phase === 'count' || phase === 'dance') && inBar === i && s.beatOn]}>
              <Text style={[s.beatTxt, (phase === 'count' || phase === 'dance') && inBar === i && s.beatTxtOn]}>{i === 0 ? t('덩') : i + 1}</Text>
            </View>
          ))}
        </View>
        <Dancer pose={pose} flick={flick} />
        <Text style={s.cheer}>{cheer || ' '}</Text>
        <Text style={s.count}>{t('박에 맞춘 춤사위 {p0} / {p1}', { p0: hits, p1: stage.pass })}</Text>
      </View>

      {phase === 'ready' ? (
        <Pressable style={s.startBtn} onPress={start}>
          <Text style={s.startTxt}>{t('장단 시작')}</Text>
        </Pressable>
      ) : null}

      <View style={s.pad}>
        {MOVES.map((m) => (
          <Pressable key={m.id} style={({ pressed }) => [s.move, pressed && s.movePressed]} onPressIn={() => dance(m.id)}>
            <Text style={s.moveTxt}>{t(m.name)}</Text>
            {Platform.OS === 'web' ? <Text style={s.keyTxt}>{m.key.toUpperCase()}</Text> : null}
          </Pressable>
        ))}
      </View>

      {phase === 'done' && result ? (
        <View style={s.result}>
          <Text style={s.resultTitle}>{result.win ? t('한 판 잘 놀았다! 🎭') : t('조금만 더! 박을 들으며 다시 춰 봐요')}</Text>
          <Text style={s.resultTxt}>{t('얼씨구 {p0} · 좋다 {p1} · 놓침 {p2}', { p0: result.good, p1: result.ok, p2: result.miss })}</Text>
          <Text style={s.resultTxt}>{t('춤사위 {p0}가지를 섞어 췄어요.', { p0: result.variety })}</Text>
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

const s = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 420, alignItems: 'center', gap: 10 },
  stage: { width: '100%', alignItems: 'center', paddingVertical: 10, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper },
  jangdan: { fontSize: 13, fontWeight: '800', color: colors.ink },
  beats: { flexDirection: 'row', gap: 10, marginTop: 8 },
  beat: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  beatHead: { borderColor: colors.accent },
  beatOn: { backgroundColor: colors.accent, borderColor: colors.accent, transform: [{ scale: 1.15 }] },
  beatTxt: { fontSize: 13, fontWeight: '800', color: colors.muted },
  beatTxtOn: { color: '#fff' },
  cheer: { fontSize: 22, fontWeight: '800', color: colors.accent, height: 30 },
  count: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
  startBtn: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: colors.accent, borderRadius: 4 },
  startTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pad: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  move: { width: '47%', minHeight: 58, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, padding: 6 },
  movePressed: { backgroundColor: colors.accent, borderColor: colors.accent },
  moveTxt: { fontSize: 13, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  keyTxt: { fontSize: 10, color: colors.muted, marginTop: 2 },
  result: { width: '100%', alignItems: 'center', gap: 6, padding: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  resultTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  resultTxt: { fontSize: 12.5, color: colors.ink },
});
