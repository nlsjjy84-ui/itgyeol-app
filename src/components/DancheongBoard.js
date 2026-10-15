import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Svg, { G, Rect, Polygon, Circle, Line, Path } from 'react-native-svg';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { COLORS, PAINTS, STEP_INFO } from '../data/dancheong';
import { initState, apply, cellAt, lineAt, GACHIL, TABUN } from '../utils/dancheongLogic';

// 단청 판 — 가칠 → 타분 → 채색 → 먹선·분선을 실제 순서대로.
// 판 좌표는 240×100(부재 하나), 화면 폭에 맞춰 키운다. 누른 자리는 좌표로 칸·선을 찾는다.
const VW = 240;
const VH = 100;
const RAW = '#cdb994'; // 칠하기 전 나무

export default function DancheongBoard({ stage, onDone, resetKey }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width - 32, 420);
  const H = (W * VH) / VW;
  const [st, setSt] = useState(initState());
  const [paint, setPaint] = useState('cheong');
  const [msg, setMsg] = useState('');
  const started = useRef(Date.now());
  const sent = useRef(false);

  useEffect(() => {
    setSt(initState());
    setMsg('');
    started.current = Date.now();
    sent.current = false;
  }, [resetKey]);

  const step = st.done ? null : stage.steps[st.step];

  useEffect(() => {
    if (st.done && !sent.current) {
      sent.current = true;
      play('jing');
      if (onDone) onDone({ mistakes: st.mistakes, elapsedMs: Date.now() - started.current, filled: st.filled });
    }
  }, [st.done, st.mistakes, st.filled, onDone]);

  const stRef = useRef(st);
  stRef.current = st;
  const act = (action) => {
    const r = apply(stage, stRef.current, action);
    stRef.current = r.state;
    setSt(r.state);
    if (r.ok) {
      play(action.type === 'tap' ? 'tap' : 'ok');
      setMsg('');
    } else if (r.why === 'wrong-color') {
      play('fail');
      setMsg(t('이 칸은 다른 색 자리예요. 칸 안의 작은 색 점을 봐요.'));
    } else if (r.why === 'wrong-step') {
      play('fail');
      const cur = stage.steps[stRef.current.step];
      setMsg(t('순서가 있어요. 지금은 「{p0}」 차례예요.', { p0: t(STEP_INFO[cur].name) }));
    }
  };

  // 누른 자리: 판의 화면 위치(measureInWindow)를 빼서 판 좌표로 바꾼다.
  // (locationX는 웹에서 눌린 무늬 조각 기준이라 쓰지 않는다)
  const boardRef = useRef(null);
  const onBoard = (e) => {
    if (!step) return;
    if (step === 'gachil' || step === 'tabun') return act({ type: 'tap' });
    const { pageX, pageY } = e.nativeEvent;
    const node = boardRef.current;
    if (!node || !node.measureInWindow) return undefined;
    node.measureInWindow((wx, wy, ww, wh) => {
      const pt = [((pageX - wx) / (ww || W)) * VW, ((pageY - wy) / (wh || H)) * VH];
      hit(pt);
    });
    return undefined;
  };
  const hit = (pt) => {
    const step = stage.steps[stRef.current.step];
    if (!step || stRef.current.done) return undefined;
    if (step === 'chae') {
      const id = cellAt(stage, pt);
      if (id) act({ type: 'fill', cell: id, color: paint });
      return undefined;
    }
    const id = lineAt(stage, pt, step) || lineAt(stage, pt, null);
    if (id) act({ type: 'line', line: id });
    return undefined;
  };

  // 가칠: 누를수록 바탕이 짙어진다. 타분: 누를수록 무늬 점선이 또렷해진다.
  const stepIdx = st.step;
  const idxOf = (k) => stage.steps.indexOf(k);
  const gachilDone = st.done || stepIdx > idxOf('gachil');
  const groundOpacity = gachilDone ? 1 : step === 'gachil' ? st.taps / GACHIL : 0;
  const hasTabun = idxOf('tabun') >= 0;
  const tabunLevel = !hasTabun ? 1 : st.done || stepIdx > idxOf('tabun') ? 1 : step === 'tabun' ? st.taps / TABUN : 0;
  const showTargets = step === 'chae';

  return (
    <View style={s.wrap}>
      <View style={s.steps}>
        {stage.steps.map((k, i) => (
          <View key={k} style={[s.stepChip, i === stepIdx && !st.done && s.stepOn, (i < stepIdx || st.done) && s.stepDone]}>
            <Text style={[s.stepTxt, (i === stepIdx && !st.done) || i < stepIdx || st.done ? s.stepTxtOn : null]}>
              {i + 1}. {t(STEP_INFO[k].name)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={s.how}>{st.done ? t('다 칠했어요! 단청 한 부재가 완성됐어요.') : t(STEP_INFO[step].how)}</Text>

      <Pressable ref={boardRef} onPress={onBoard} style={{ width: W, height: H }}>
        <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} pointerEvents="none">
          <Rect x={0} y={0} width={VW} height={VH} fill={RAW} />
          {/* 나뭇결 */}
          {[18, 37, 61, 79].map((y) => (
            <Line key={y} x1={0} y1={y} x2={VW} y2={y + 3} stroke="#b9a37a" strokeWidth={0.6} />
          ))}
          <Rect x={0} y={0} width={VW} height={VH} fill={COLORS.nok.hex} opacity={groundOpacity} />
          {/* 칸 — 타분 뒤에는 점선 윤곽, 칠한 칸은 색 */}
          {stage.cells.map((c) => {
            const fill = st.filled[c.id] ? COLORS[st.filled[c.id]].hex : 'none';
            const stroke = st.filled[c.id] ? 'none' : '#f6f0e2';
            const common = { fill, stroke, strokeWidth: 0.8, strokeDasharray: '1.5 1.5', opacity: st.filled[c.id] ? 1 : tabunLevel };
            const shape = c.circle ? (
              <Circle key={c.id} cx={c.circle[0]} cy={c.circle[1]} r={c.circle[2]} {...common} />
            ) : (
              <Polygon key={c.id} points={c.poly.map((p) => p.join(',')).join(' ')} {...common} />
            );
            if (!showTargets || st.filled[c.id]) return shape;
            const [mx, my] = c.circle ? c.circle : [c.poly.reduce((a, p) => a + p[0], 0) / c.poly.length, c.poly.reduce((a, p) => a + p[1], 0) / c.poly.length];
            return (
              <G key={c.id}>
                {shape}
                <Circle cx={mx} cy={my} r={2.4} fill={COLORS[c.color].hex} stroke="#f6f0e2" strokeWidth={0.5} />
              </G>
            );
          })}
          {/* 선 — 차례가 된 선은 점선, 그은 선은 실선 */}
          {stage.lines.map((l) => {
            const drawn = st.drawn[l.id];
            const turn = step === l.kind;
            if (!drawn && !turn) return null;
            const col = l.kind === 'meok' ? COLORS.heuk.hex : COLORS.baek.hex;
            const p = { stroke: col, strokeWidth: drawn ? 2 : 1.2, strokeDasharray: drawn ? undefined : '3 2', opacity: drawn ? 1 : 0.7, fill: 'none' };
            return l.seg ? (
              <Line key={l.id} x1={l.seg[0][0]} y1={l.seg[0][1]} x2={l.seg[1][0]} y2={l.seg[1][1]} {...p} />
            ) : (
              <Circle key={l.id} cx={l.circle[0]} cy={l.circle[1]} r={l.circle[2]} {...p} />
            );
          })}
          {/* 타분 중: 분주머니 */}
          {step === 'tabun' ? (
            <G>
              <Path d="M200 18 Q214 10 226 18 L222 40 Q213 46 204 40 Z" fill="#efe6d0" stroke="#8a6d3f" strokeWidth={1} />
              <Path d="M206 18 Q213 8 220 18" stroke="#8a6d3f" strokeWidth={1.2} fill="none" />
            </G>
          ) : null}
        </Svg>
      </Pressable>

      {step === 'chae' ? (
        <View style={s.palette}>
          {PAINTS.map((k) => (
            <Pressable key={k} onPress={() => { play('tap'); setPaint(k); }} style={[s.pot, paint === k && s.potOn]}>
              <View style={[s.swatch, { backgroundColor: COLORS[k].hex }]} />
              <Text style={s.potTxt}>{t(COLORS[k].name)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={s.msg}>{msg || (st.mistakes ? t('잘못 칠하려던 것 {p0}번', { p0: st.mistakes }) : ' ')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: 8 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  stepChip: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1.5, borderColor: colors.border, borderRadius: 3, backgroundColor: colors.paper },
  stepOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  stepDone: { borderColor: colors.green, backgroundColor: colors.green },
  stepTxt: { fontSize: 11.5, fontWeight: '700', color: colors.muted },
  stepTxtOn: { color: '#fff' },
  how: { fontSize: 13, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pot: { alignItems: 'center', padding: 6, borderWidth: 2, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.paper, minWidth: 54 },
  potOn: { borderColor: colors.ink, transform: [{ scale: 1.08 }] },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  potTxt: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 3 },
  msg: { fontSize: 12, color: colors.accentDeep, minHeight: 18, textAlign: 'center' },
});
