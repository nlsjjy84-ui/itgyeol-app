import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import SealButton from '../../ui/SealButton';
import { play } from '../../utils/sound';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';

const TURN_MS_BASE = 2400;

// 고사리꺾기 — 실제 자료 기준(강강술래 놀이 진행 방식): 다 같이 동시에 자리를 바꾸는
// 게 아니라, 손 잡고 앉은 줄에서 맨 앞사람부터 "한 명씩 차례로" 옆 사람 팔 위를
// 넘어가야 줄 전체가 안으로 말려든다. 그래서 동시 드래그가 아니라, 차례를 지켜
// 한 명씩 순서대로 넘기는 놀이로 만든다 — 순서를 틀리거나 제 박자 안에 못 넘기면
// 처음부터 다시 시작한다(실제 놀이에서 줄이 끊어지는 것과 같은 느낌).
export default function GosariVaultGame({ peopleCount = 10, targetPositions, color, streak = 0, onSuccess, onFail }) {
  const { timed, scaleMs } = useTime();
  const initialOrder = Array.from({ length: peopleCount }, (_, i) => i);
  const [order, setOrder] = useState(initialOrder);
  const [vaulted, setVaulted] = useState([]);
  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [turnMs, setTurnMs] = useState(TURN_MS_BASE);
  const [flash, setFlash] = useState(null);
  const [flashMsg, setFlashMsg] = useState('');

  const orderRef = useRef(order);
  orderRef.current = order;
  const sessionStartRef = useRef(Date.now());
  const turnTimerRef = useRef(null);
  const turnDeadlineRef = useRef(0);
  const flashTimeoutRef = useRef(null);

  const turnLimit = scaleMs(Math.max(1100, TURN_MS_BASE - streak * 140));

  useEffect(
    () => () => {
      turnTimerRef.current && clearInterval(turnTimerRef.current);
      flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    },
    []
  );

  const resetLine = () => {
    setOrder(Array.from({ length: peopleCount }, (_, i) => i));
    setVaulted([]);
  };

  const armTurnTimer = () => {
    turnTimerRef.current && clearInterval(turnTimerRef.current);
    turnDeadlineRef.current = Date.now() + turnLimit;
    setTurnMs(turnLimit);
    turnTimerRef.current = setInterval(() => {
      const left = turnDeadlineRef.current - Date.now();
      if (left <= 0) {
        clearInterval(turnTimerRef.current);
        failTurn('박자를 놓쳤어요! 처음부터 다시 넘어가볼까요.');
      } else {
        setTurnMs(left);
      }
    }, 80);
  };

  const start = () => {
    resetLine();
    setPhase('playing');
    setFlash(null);
    sessionStartRef.current = Date.now();
    armTurnTimer();
  };

  const showFlash = (key, msg, ms = 700) => {
    setFlash(key);
    setFlashMsg(msg || '');
    flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), ms);
  };

  const failTurn = (msg) => {
    turnTimerRef.current && clearInterval(turnTimerRef.current);
    showFlash('wrong', msg);
    resetLine();
    setPhase('ready');
    onFail && onFail(msg);
  };

  const vaultFront = () => {
    if (phase !== 'playing') return;
    turnTimerRef.current && clearInterval(turnTimerRef.current);
    const front = orderRef.current[0];
    const rest = orderRef.current.slice(1);
    setOrder(rest);
    setVaulted((v) => {
      const next = [...v, front];
      if (next.length >= peopleCount) {
        const elapsed = Date.now() - sessionStartRef.current;
        setPhase('done');
        showFlash('success', '', 1200);
        onSuccess && onSuccess(elapsed);
      } else {
        armTurnTimer();
      }
      return next;
    });
  };

  const tapPerson = (id) => {
    if (phase !== 'playing') return;
    if (id === orderRef.current[0]) {
      vaultFront();
    } else {
      failTurn(`아직 ${orderRef.current[0] + 1}번 차례예요. 순서를 지켜주세요.`);
    }
  };

  useTapKey(vaultFront, phase === 'playing');

  const turnRatio = Math.max(0, Math.min(1, turnMs / turnLimit));
  const positions = targetPositions || [];

  // 미션 안내에서 이미 '시작하기'를 눌렀으므로 바로 시작한다(실패·완료 뒤에만 다시 시작 버튼이 보인다).
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'playing'
          ? `넘어간 ${vaulted.length} / ${peopleCount}명 · 지금 차례: ${order[0] + 1}번`
          : '맨 앞사람부터 차례로 옆 사람 팔 위를 넘어가 보세요'}
      </Text>

      <View style={styles.line}>
        {order.map((id, i) => (
          <Pressable
            key={id}
            onPress={() => tapPerson(id)}
            style={[styles.person, i === 0 && phase === 'playing' && { borderColor: color, borderWidth: 3 }]}
          >
            <Text style={styles.personText}>{id + 1}</Text>
          </Pressable>
        ))}
      </View>

      {phase === 'playing' && (
        <View style={styles.turnTrack}>
          <View style={[styles.turnFill, { width: `${turnRatio * 100}%`, backgroundColor: color }]} />
        </View>
      )}

      <View style={styles.spiralField}>
        {vaulted.map((id, i) => {
          const p = positions[i] || positions[positions.length - 1] || { x: 0.5, y: 0.5 };
          return (
            <View
              key={id}
              style={[
                styles.spiralDot,
                { left: `${p.x * 100}%`, top: `${p.y * 100}%`, borderColor: color, backgroundColor: color },
              ]}
            >
              <Text style={styles.spiralDotText}>{id + 1}</Text>
            </View>
          );
        })}
        {flash === 'success' && <Text style={styles.flashHit}>고사리꺾기 완성! 줄이 다 말려들었어요</Text>}
      </View>

      {flash === 'wrong' && <Text style={styles.flashMiss}>{flashMsg}</Text>}

      {phase !== 'playing' && (
        <SealButton label={phase === 'done' ? '다시 꺾어보기' : '시작하기'} onPress={start} sound="drum" style={{ marginTop: 6, minWidth: 200 }} />
      )}
      {phase === 'playing' && (
        <Text style={styles.hint}>스페이스바(또는 맨 앞사람 클릭)로 지금 차례인 사람을 넘기세요</Text>
      )}
    </View>
  );
}

const PERSON_SIZE = 28;
const SPIRAL_DOT_SIZE = 20;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  roundText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 10, textAlign: 'center' },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    maxWidth: 360,
    marginBottom: 8,
  },
  person: {
    width: PERSON_SIZE,
    height: PERSON_SIZE,
    borderRadius: 4,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  turnTrack: {
    width: '100%',
    maxWidth: 300,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  turnFill: { height: '100%' },
  spiralField: {
    width: '100%',
    maxWidth: 260,
    height: 170,
    position: 'relative',
    backgroundColor: colors.borderSoft,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
    marginBottom: 10,
  },
  spiralDot: {
    position: 'absolute',
    width: SPIRAL_DOT_SIZE,
    height: SPIRAL_DOT_SIZE,
    borderRadius: SPIRAL_DOT_SIZE / 2,
    marginLeft: -SPIRAL_DOT_SIZE / 2,
    marginTop: -SPIRAL_DOT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralDotText: { fontSize: 9.5, fontWeight: '800', color: '#fff' },
  flashHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: { fontSize: 12.5, fontWeight: '800', color: colors.accent, marginBottom: 8, textAlign: 'center' },
  hint: { fontSize: 11, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  bigBtn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
