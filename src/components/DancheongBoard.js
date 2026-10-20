import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Svg, { G, Rect, Polygon, Circle, Line, Path, Polyline, Ellipse } from 'react-native-svg';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { COLORS, PAINTS, STEP_INFO } from '../data/dancheong';
import { usePad } from './minigames/common';
import { initState, apply, cellAt, lineAt, gachilCover, tabunCover, BRUSH_R, POUNCE_R, GW, GH } from '../utils/dancheongLogic';

// 단청 판 — 단청장이 일하는 순서와 손놀림을 그대로 따른다.
//  ① 가칠: 붓으로 판을 문질러 바탕을 뇌록으로 칠한다(칠한 만큼 색이 덮인다)
//  ② 타분: 구멍 뚫린 도본(무늬 종이)을 대고 분주머니로 톡톡 두드리면, 두드린 자리에 무늬 점선이 찍힌다
//  ③ 채색: 색을 고르고, 그 색 점이 찍힌 칸을 눌러 메운다(색칠놀이)
//  ④ 먹선·분선: 점선을 따라 손가락으로 쭉 그어 선을 긋는다
// 판 좌표는 240×100(부재 하나), 화면 폭에 맞춰 키운다.
// 끌 수 없는 환경(키보드·보조 기기)을 위해, 그냥 누르기만 해도 가칠·타분·선 긋기가 진행된다.
const VW = 240;
const VH = 100;
const RAW = '#cdb994'; // 칠하기 전 나무

const centroid = (c) => (c.circle ? [c.circle[0], c.circle[1]] : [c.poly.reduce((a, p) => a + p[0], 0) / c.poly.length, c.poly.reduce((a, p) => a + p[1], 0) / c.poly.length]);
const lineMid = (l) => (l.seg ? [(l.seg[0][0] + l.seg[1][0]) / 2, (l.seg[0][1] + l.seg[1][1]) / 2] : [l.circle[0], l.circle[1] - l.circle[2]]);

export default function DancheongBoard({ stage, onDone, resetKey }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width - 32, 420);
  const H = (W * VH) / VW;
  const [st, setSt] = useState(initState());
  const [paint, setPaint] = useState('cheong');
  const [msg, setMsg] = useState('');
  const [strokes, setStrokes] = useState([]); // 가칠 붓자국(판 좌표 점 목록들)
  const [live, setLive] = useState(null); // 지금 긋고 있는 길
  const [pounces, setPounces] = useState([]); // 분주머니로 두드린 자리
  const [finger, setFinger] = useState(null);
  const started = useRef(Date.now());
  const sent = useRef(false);

  useEffect(() => {
    setSt(initState());
    setMsg('');
    setStrokes([]);
    setLive(null);
    setPounces([]);
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
  const stepAt = useRef(0); // 단계가 바뀐 때 — 막 바뀐 직후의 손놀림(앞 단계 버릇)은 실수로 세지 않는다
  const act = (action, quiet) => {
    if ((action.type === 'fill' || action.type === 'stroke') && Date.now() - stepAt.current < 700) return { ok: false };
    const r = apply(stage, stRef.current, action);
    const before = stRef.current.step;
    if (r.state.step !== before) stepAt.current = Date.now();
    stRef.current = r.state;
    setSt(r.state);
    if (r.ok) {
      if (!quiet || r.state.step !== before || r.state.done) play(r.state.step !== before || r.state.done ? 'ok' : 'tap');
      setMsg('');
    } else if (r.why === 'wrong-color') {
      play('fail');
      setMsg(t('이 칸은 다른 색 자리예요. 칸 안의 작은 색 점을 봐요.'));
    } else if (r.why === 'wrong-step') {
      play('fail');
      const cur = stage.steps[stRef.current.step];
      setMsg(t('순서가 있어요. 지금은 「{p0}」 차례예요.', { p0: t(STEP_INFO[cur].name) }));
    } else if (r.why === 'not-target' && (action.type === 'stroke')) {
      setMsg(t('점선을 따라 처음부터 끝까지 쭉 그어 봐요.'));
    }
    return r;
  };

  // 손가락 길 → 판 좌표
  const toBoard = (x, y) => [Math.max(0, Math.min(VW, (x / W) * VW)), Math.max(0, Math.min(VH, (y / H) * VH))];
  const path = useRef(null);
  const pad = usePad({
    onDown: (x, y) => {
      const p = toBoard(x, y);
      path.current = [p];
      setFinger(p);
      const k = stage.steps[stRef.current.step];
      if (k === 'gachil' || k === 'meok' || k === 'bun') setLive([p]);
    },
    onMove: (x, y) => {
      if (!path.current) return;
      const p = toBoard(x, y);
      const last = path.current[path.current.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
      path.current.push(p);
      setFinger(p);
      const k = stage.steps[stRef.current.step];
      if (k === 'gachil') {
        setLive(path.current.slice());
        // 칠하는 동안에도 덮인 정도가 바로 오르게, 몇 점마다 반영
        if (path.current.length % 6 === 0) act({ type: 'brush', pts: path.current.slice(-8) }, true);
      } else if (k === 'meok' || k === 'bun') setLive(path.current.slice());
    },
    onUp: (x, y) => {
      const pts = path.current || [];
      path.current = null;
      setFinger(null);
      setLive(null);
      if (!pts.length) return;
      const k = stage.steps[stRef.current.step];
      if (!k || stRef.current.done) return;
      const p = pts[pts.length - 1];
      const moved = pts.length > 2;
      if (k === 'gachil') {
        setStrokes((s) => [...s, pts]);
        act({ type: 'brush', pts }, true);
        if (!moved) act({ type: 'tap' }, true); // 누르기만 해도(보조 기기) 조금씩
      } else if (k === 'tabun') {
        setPounces((s) => [...s, p]);
        play('tap');
        act({ type: 'pounce', pt: p }, true);
        if (!moved) act({ type: 'tap' }, true);
      } else if (k === 'chae') {
        const id = cellAt(stage, p);
        if (id) act({ type: 'fill', cell: id, color: paint });
      } else if (k === 'meok' || k === 'bun') {
        if (moved) act({ type: 'stroke', pts });
        else {
          // 누르기만 했을 때: 그 자리 선 하나(보조 기기)
          const id = lineAt(stage, p, k) || lineAt(stage, p, null);
          if (id) act({ type: 'line', line: id });
        }
      }
    },
  });

  const stepIdx = st.step;
  const idxOf = (k) => stage.steps.indexOf(k);
  const gachilDone = st.done || stepIdx > idxOf('gachil');
  const hasTabun = idxOf('tabun') >= 0;
  const tabunDone = !hasTabun || st.done || stepIdx > idxOf('tabun');
  const showTargets = step === 'chae';
  // 타분: 두드린 자리 가까이의 무늬만 보인다
  const revealed = (pt) => tabunDone || (step === 'tabun' && pounces.some((q) => Math.hypot(q[0] - pt[0], q[1] - pt[1]) <= POUNCE_R + 6));
  const pct = step === 'gachil' ? Math.round(gachilCover(st) * 100) : step === 'tabun' ? Math.round(tabunCover(st) * 100) : null;
  const linesLeft = step === 'meok' || step === 'bun' ? stage.lines.filter((l) => l.kind === step && !st.drawn[l.id]).length : 0;
  const inkCol = step === 'meok' ? COLORS.heuk.hex : COLORS.baek.hex;

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

      <View ref={pad.ref} {...pad.handlers} style={[s.board, { width: W, height: H }]}>
        <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} pointerEvents="none">
          <Rect x={0} y={0} width={VW} height={VH} fill={RAW} />
          {/* 나뭇결 */}
          {[18, 37, 61, 79].map((y) => (
            <Line key={y} x1={0} y1={y} x2={VW} y2={y + 3} stroke="#b9a37a" strokeWidth={0.6} />
          ))}
          {/* 가칠: 붓자국 그대로, 다 칠하면 고르게 */}
          {gachilDone ? <Rect x={0} y={0} width={VW} height={VH} fill={COLORS.nok.hex} /> : null}
          {!gachilDone
            ? [...strokes, ...(live && step === 'gachil' ? [live] : [])].map((pts, i) => (
              <Polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={COLORS.nok.hex} strokeWidth={BRUSH_R * 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
            ))
            : null}
          {/* 칸 — 타분으로 드러난 점선 윤곽, 칠한 칸은 색 */}
          {stage.cells.map((c) => {
            const shown = revealed(centroid(c));
            if (!shown && !st.filled[c.id]) return null;
            const fill = st.filled[c.id] ? COLORS[st.filled[c.id]].hex : 'none';
            const common = { fill, stroke: st.filled[c.id] ? 'none' : '#f6f0e2', strokeWidth: 0.8, strokeDasharray: '1.2 1.6' };
            const shape = c.circle ? (
              <Circle key={c.id} cx={c.circle[0]} cy={c.circle[1]} r={c.circle[2]} {...common} />
            ) : (
              <Polygon key={c.id} points={c.poly.map((p) => p.join(',')).join(' ')} {...common} />
            );
            if (!showTargets || st.filled[c.id]) return shape;
            const [mx, my] = centroid(c);
            return (
              <G key={c.id}>
                {shape}
                <Circle cx={mx} cy={my} r={2.6} fill={COLORS[c.color].hex} stroke="#f6f0e2" strokeWidth={0.5} />
              </G>
            );
          })}
          {/* 선 — 차례가 된 선은 점선(긋기 안내), 그은 선은 실선 */}
          {stage.lines.map((l) => {
            const drawn = st.drawn[l.id];
            const turn = step === l.kind;
            if (!drawn && !turn) return null;
            const col = l.kind === 'meok' ? COLORS.heuk.hex : COLORS.baek.hex;
            const p = { stroke: col, strokeWidth: drawn ? 2 : 1.2, strokeDasharray: drawn ? undefined : '3 2', opacity: drawn ? 1 : 0.8, fill: 'none' };
            const shape = l.seg ? (
              <Line key={l.id} x1={l.seg[0][0]} y1={l.seg[0][1]} x2={l.seg[1][0]} y2={l.seg[1][1]} {...p} />
            ) : (
              <Circle key={l.id} cx={l.circle[0]} cy={l.circle[1]} r={l.circle[2]} {...p} />
            );
            if (drawn || !turn) return shape;
            // 시작점 표시
            const st0 = l.seg ? l.seg[0] : [l.circle[0], l.circle[1] - l.circle[2]];
            return (
              <G key={l.id}>
                {shape}
                <Circle cx={st0[0]} cy={st0[1]} r={2.4} fill={colors.accent} />
              </G>
            );
          })}
          {/* 지금 긋는 선 */}
          {live && (step === 'meok' || step === 'bun') ? (
            <Polyline points={live.map((p) => p.join(',')).join(' ')} fill="none" stroke={inkCol} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {/* 타분: 구멍 뚫린 도본(무늬 종이)을 판 위에 대고 두드린다 */}
          {step === 'tabun' ? (
            <G>
              <Rect x={4} y={3} width={VW - 8} height={VH - 6} fill="#f6f0e2" opacity={0.45} stroke="#8a6d3f" strokeWidth={0.6} />
              {pounces.map((q, i) => (
                <Circle key={i} cx={q[0]} cy={q[1]} r={POUNCE_R * 0.55} fill="#ffffff" opacity={0.18} />
              ))}
            </G>
          ) : null}
          {/* 손에 든 도구: 가칠은 붓, 타분은 분주머니 */}
          {finger && step === 'gachil' ? (
            <G transform={`translate(${finger[0]} ${finger[1]}) rotate(-35)`}>
              <Rect x={-2} y={-34} width={4} height={26} rx={1} fill="#7a5a33" />
              <Path d="M-5 -9 Q0 4 5 -9 Z" fill={COLORS.nok.hex} stroke="#2e2a24" strokeWidth={0.5} />
            </G>
          ) : null}
          {step === 'tabun' ? (
            <G transform={`translate(${(finger || pounces[pounces.length - 1] || [200, 30])[0]} ${(finger || pounces[pounces.length - 1] || [200, 30])[1] - 4})`}>
              <Path d="M-10 -4 Q0 -12 10 -4 L7 12 Q0 17 -7 12 Z" fill="#efe6d0" stroke="#8a6d3f" strokeWidth={0.9} />
              <Path d="M-5 -5 Q0 -13 5 -5" stroke="#8a6d3f" strokeWidth={1.1} fill="none" />
            </G>
          ) : null}
        </Svg>
      </View>

      {pct != null ? (
        <View style={s.meter}>
          <View style={[s.meterFill, { width: `${pct}%`, backgroundColor: step === 'gachil' ? COLORS.nok.hex : '#c8b18a' }]} />
          <Text style={s.meterTxt}>{step === 'gachil' ? t('칠한 정도 {p0}%', { p0: pct }) : t('옮긴 무늬 {p0}%', { p0: pct })}</Text>
        </View>
      ) : null}
      {linesLeft ? <Text style={s.left}>{t('남은 선 {p0}개 · 빨간 점에서 시작해 점선을 따라 쭉', { p0: linesLeft })}</Text> : null}

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
  board: { borderWidth: 2, borderColor: colors.ink, overflow: 'hidden', userSelect: 'none', touchAction: 'none' },
  meter: { width: '80%', height: 22, borderRadius: 11, backgroundColor: colors.borderSoft, overflow: 'hidden', justifyContent: 'center' },
  meterFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  meterTxt: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.ink },
  left: { fontSize: 12, color: colors.ink, textAlign: 'center' },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pot: { alignItems: 'center', padding: 6, borderWidth: 2, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.paper, minWidth: 54 },
  potOn: { borderColor: colors.ink, transform: [{ scale: 1.08 }] },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  potTxt: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 3 },
  msg: { fontSize: 12, color: colors.accentDeep, minHeight: 18, textAlign: 'center' },
});
