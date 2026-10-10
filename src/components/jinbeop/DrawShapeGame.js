import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import SealButton from '../../ui/SealButton';
import { play } from '../../utils/sound';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '../../theme';
import { similarityToTemplate } from '../../utils/shapeMatch';
import { formationTemplate } from '../../data/formations';

const BASE_DRAW_MS = 15000;
const SUCCESS_THRESHOLD = 62;

// 기와밟기 — "그릴 수도 있잖아, 내가 그렸는데 어떤 거랑 비슷하다고 말할 수도 있잖아"라는
// 요청을 그대로 구현한 놀이. 정답이냐 아니냐를 가르지 않고, 제한 시간(15초) 안에 손으로
// 직접 모양을 그려보면 그 궤적을 실제 기와밟기 대형(완만한 아치)과 비교해 "몇 % 닮았는지"로
// 말해준다 — 드래그로 점을 맞추는 다른 진법들과는 완전히 다른 조작 방식.
export default function DrawShapeGame({ formationId, closed = false, color, streak = 0, onSuccess, onFail }) {
  const { timed, scaleMs } = useTime();
  const [phase, setPhase] = useState('ready'); // ready | drawing | result
  const [points, setPoints] = useState([]);
  const DRAW_MS = scaleMs(BASE_DRAW_MS);
  const [remainingMs, setRemainingMs] = useState(DRAW_MS);
  const [resultPct, setResultPct] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const phaseRef = useRef('ready');
  const pointsRef = useRef([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const deadlineRef = useRef(0);
  const timerRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const template = formationTemplate(formationId) || [];

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const finishDrawing = () => {
    if (phaseRef.current !== 'drawing') return;
    timerRef.current && clearInterval(timerRef.current);
    const raw = pointsRef.current;
    const sizeNow = sizeRef.current;
    if (raw.length < 2 || !sizeNow.width || !sizeNow.height) {
      phaseRef.current = 'ready';
      setPhase('ready');
      onFail && onFail('그림을 거의 그리지 못했어요. 다시 한 번 그려볼까요?');
      return;
    }
    const normalized = raw.map((p) => ({ x: p.x / sizeNow.width, y: p.y / sizeNow.height }));
    const pct = similarityToTemplate(normalized, template, { closed });
    phaseRef.current = 'result';
    setResultPct(pct);
    setPhase('result');
    const elapsed = Date.now() - sessionStartRef.current;
    if (pct >= SUCCESS_THRESHOLD) {
      onSuccess && onSuccess(elapsed);
    } else {
      onFail && onFail(`이번엔 ${pct}% 비슷했어요. 조금 더 비슷하게 그려볼까요?`);
    }
  };
  const finishRef = useRef(finishDrawing);
  finishRef.current = finishDrawing;

  const start = () => {
    pointsRef.current = [];
    setPoints([]);
    setResultPct(null);
    sessionStartRef.current = Date.now();
    deadlineRef.current = Date.now() + DRAW_MS;
    setRemainingMs(DRAW_MS);
    phaseRef.current = 'drawing';
    setPhase('drawing');
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) {
        clearInterval(timerRef.current);
        setRemainingMs(0);
        finishRef.current();
      } else {
        setRemainingMs(left);
      }
    }, 100);
  };

  const startStroke = (x, y) => {
    pointsRef.current = [{ x, y }];
    setPoints(pointsRef.current);
  };
  const addPoint = (x, y) => {
    pointsRef.current = [...pointsRef.current, { x, y }];
    setPoints(pointsRef.current);
  };

  // 한 획으로 다 그리지 못해도(손을 뗐다 다시 그려도) 괜찮도록, 새로 짚을 때마다
  // 그 순간의 궤적을 새로 시작한다 — 15초 안에서는 몇 번이든 다시 그려볼 수 있다.
  const pan = Gesture.Pan()
    .onBegin((e) => {
      if (phaseRef.current !== 'drawing') return;
      runOnJS(startStroke)(e.x, e.y);
    })
    .onUpdate((e) => {
      if (phaseRef.current !== 'drawing') return;
      runOnJS(addPoint)(e.x, e.y);
    });

  const onCanvasLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { width, height };
    setCanvasSize({ width, height });
  };

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const success = phase === 'result' && resultPct >= SUCCESS_THRESHOLD;

  // 미션 안내에서 이미 '시작하기'를 눌렀으므로 바로 시작한다(실패·완료 뒤에만 다시 시작 버튼이 보인다).
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'drawing'
          ? `그리는 중 · ${timed ? `⏱ ${remainingSec}초` : '시간 제한 없음'}`
          : phase === 'result'
          ? `${resultPct}% 비슷해요`
          : timed ? `제한 시간 ${Math.round(DRAW_MS / 1000)}초 동안 이 모양을 손으로 그려보세요` : '시간 제한 없이 이 모양을 손으로 그려보세요'}
      </Text>

      <GestureDetector gesture={pan}>
        <View style={styles.canvas} onLayout={onCanvasLayout}>
          {template.length > 0 &&
            canvasSize.width > 0 &&
            template.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.guideDot,
                  { left: p.x * canvasSize.width - 1.5, top: p.y * canvasSize.height - 1.5 },
                ]}
              />
            ))}
          {canvasSize.width > 0 && points.length > 1 && (
            <Svg width={canvasSize.width} height={canvasSize.height} style={StyleSheet.absoluteFill}>
              <Polyline
                points={polylineStr}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          {phase === 'drawing' && points.length === 0 && (
            <Text style={styles.canvasHint}>여기를 손가락(또는 마우스)으로 눌러서 그려보세요</Text>
          )}
          {phase === 'result' && (
            <Text style={success ? styles.flashHit : styles.flashMiss}>
              {success ? '많이 닮았어요!' : `${resultPct}% 비슷해요 — 조금 더 가까이 그려볼까요?`}
            </Text>
          )}
        </View>
      </GestureDetector>

      {phase === 'drawing' && (
        <View style={styles.timeTrack}>
          <View
            style={[
              styles.timeFill,
              { width: `${Math.max(0, Math.min(100, (remainingMs / DRAW_MS) * 100))}%`, backgroundColor: color },
            ]}
          />
        </View>
      )}

      {phase !== 'drawing' && (
        <SealButton label={phase === 'result' ? '다시 그려보기' : '그리기 시작'} onPress={start} sound="drum" style={{ marginTop: 6, minWidth: 200 }} />
      )}
      {phase === 'drawing' && (
        <Pressable style={[styles.submitBtn, { borderColor: color }]} onPress={finishDrawing}>
          <Text style={[styles.submitBtnText, { color }]}>다 그렸어요</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  roundText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 8, textAlign: 'center' },
  canvas: {
    width: '100%',
    maxWidth: 320,
    height: 260,
    position: 'relative',
    backgroundColor: colors.borderSoft,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  guideDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  canvasHint: {
    position: 'absolute',
    top: '50%',
    left: 12,
    right: 12,
    marginTop: -16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  flashHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  timeTrack: {
    width: '100%',
    maxWidth: 300,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  timeFill: { height: '100%' },
  bigBtn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  submitBtnText: { fontWeight: '700', fontSize: 13 },
});
