import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../theme';

const SIZE = 36;
const TAP_SLOP = 6; // 이보다 적게 움직였다면 드래그가 아니라 "선택"으로 처리한다

export default function Dot({
  id,
  x,
  y,
  resetSignal,
  onDragEnd,
  onDragStart,
  onSelect,
  selected,
  forcePos,
  forceSignal,
  label,
  rotateDeg = 0,
  tintColor,
}) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);
  const startX = useSharedValue(x);
  const startY = useSharedValue(y);

  // 부모가 위치를 초기화(새 시도 시작)할 때 애니메이션으로 되돌아가도록
  useEffect(() => {
    translateX.value = withTiming(x, { duration: 260 });
    translateY.value = withTiming(y, { duration: 260 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // 키보드 조작(화살표 이동·Enter로 빈 자리에 넣기)으로 부모가 위치를 강제로 옮길 때
  useEffect(() => {
    if (!forcePos || forceSignal === undefined) return;
    translateX.value = withTiming(forcePos.x, { duration: 220 });
    translateY.value = withTiming(forcePos.y, { duration: 220 });
    if (onDragEnd) onDragEnd(id, forcePos.x, forcePos.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceSignal]);

  const reportStart = () => {
    if (onDragStart) onDragStart(id);
  };
  const reportEnd = (fx, fy) => {
    if (onDragEnd) onDragEnd(id, fx, fy);
  };
  const reportSelect = () => {
    if (onSelect) onSelect(id);
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(reportStart)();
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      const moved = Math.hypot(e.translationX, e.translationY);
      if (moved < TAP_SLOP) {
        // 거의 움직이지 않았다면 드래그가 아니라 클릭으로 보고, 자리는 그대로 두고 "선택"만 한다
        translateX.value = startX.value;
        translateY.value = startY.value;
        runOnJS(reportSelect)();
      } else {
        runOnJS(reportEnd)(translateX.value, translateY.value);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - SIZE / 2 },
      { translateY: translateY.value - SIZE / 2 },
      { rotate: `${rotateDeg}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.dot,
          tintColor && { borderColor: tintColor },
          selected && styles.dotSelected,
          style,
        ]}
      >
        <Text style={[styles.label, tintColor && { color: tintColor }]}>
          {label !== undefined ? label : id + 1}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentDeep,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dotSelected: {
    borderWidth: 3,
    borderColor: '#2f8f4e',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentDeep,
  },
});
