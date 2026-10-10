import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, PanResponder } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';

// 새 전래놀이 미니게임들이 함께 쓰는 도구 — 프레임 루프, 손가락 패드, 공통 틀.

// 화면이 그려질 때마다(requestAnimationFrame) cb(dt초)를 부른다.
export function useRaf(cb, active) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let last = null;
    const loop = (t) => {
      if (last == null) last = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      ref.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

// 손가락/마우스로 누르고·끌고·떼는 패드. 좌표는 패드 왼쪽 위 기준.
export function usePad({ onDown, onMove, onUp }) {
  const ref = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const cbs = useRef({});
  cbs.current = { onDown, onMove, onUp };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const n = e.nativeEvent;
        const go = (x, y) => {
          origin.current = { x, y };
          cbs.current.onDown && cbs.current.onDown(n.pageX - x, n.pageY - y);
        };
        if (ref.current && ref.current.measureInWindow) ref.current.measureInWindow(go);
        else go(0, 0);
      },
      onPanResponderMove: (e) => {
        const n = e.nativeEvent;
        cbs.current.onMove && cbs.current.onMove(n.pageX - origin.current.x, n.pageY - origin.current.y);
      },
      onPanResponderRelease: (e) => {
        const n = e.nativeEvent;
        cbs.current.onUp && cbs.current.onUp(n.pageX - origin.current.x, n.pageY - origin.current.y);
      },
      onPanResponderTerminate: (e) => {
        const n = e.nativeEvent;
        cbs.current.onUp && cbs.current.onUp(n.pageX - origin.current.x, n.pageY - origin.current.y);
      },
    })
  ).current;
  return { ref, handlers: pan.panHandlers };
}

export const STAGE_W = 300;
export const STAGE_H = 340;

export function rand(a, b) {
  return a + Math.random() * (b - a);
}
export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// 시작/다시 하기 버튼 + 상단 안내 + 하단 힌트가 있는 공통 틀
export function Shell({ color, phase, onStart, hud, hint, children }) {
  return (
    <View style={styles.wrap}>
      {hud ? <Text style={styles.hud}>{hud}</Text> : null}
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={onStart}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Bar({ value, color, height = 10, width = STAGE_W }) {
  return (
    <View style={[styles.barTrack, { height, width }]}>
      <View style={{ width: `${clamp(value, 0, 100)}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', gap: 10, paddingVertical: 4 },
  hud: { fontSize: 15, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  hint: { fontSize: 12.5, color: colors.muted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 16, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stage: { width: STAGE_W, height: STAGE_H, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.paper, overflow: 'hidden' },
  barTrack: { borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' },
});
