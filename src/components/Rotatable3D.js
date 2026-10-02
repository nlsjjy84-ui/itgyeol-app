import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

// 손으로 드래그해서 360도 돌려볼 수 있는 입체 뷰어.
//
// 이전 버전은 앞면/뒷면 레이어 "각각"에 perspective를 따로 줬다. CSS 3D에서 perspective는
// 그걸 가진 엘리먼트 자신의 변환에만 적용되는 값이라, 앞/뒷면이 한 몸으로 도는 게 아니라
// 서로 다른 3D 공간에서 따로 회전하는 꼴이 됐다 — 그래서 입체감 없이 납작한 두 장이
// 따로 접히듯 보이는("종이 뒤집는 느낌") 문제가 있었다.
//
// 올바른 CSS 3D 카드-플립 구조로 다시 짰다:
//   1) 바깥 래퍼에 perspective를 한 번만 준다 — 자식들이 공유하는 하나의 3D 공간을 만든다.
//   2) 그 안의 "카드" 엘리먼트 하나에만 transformStyle: preserve-3d + rotateY를 준다.
//   3) 앞/뒷면은 그 카드 하나의 자식으로 두고, 뒷면은 애초에 180도 돌려서 붙여놓는다.
// 이러면 앞/뒷면이 실제로 한 덩어리처럼 함께 돌고, 옆에서 보일 때는 perspective에 의해
// 실제로 폭이 좁아지는(원근 축소) 진짜 입체 회전처럼 보인다.
export default function Rotatable3D({ front, back, width, height, autoRotate = true }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (autoRotate) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 9000, easing: Easing.linear }),
        -1,
        false
      );
    }
    return () => cancelAnimation(rotation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(rotation);
    })
    .onUpdate((e) => {
      rotation.value = rotation.value + e.changeX * 0.6;
    })
    .onEnd(() => {
      if (autoRotate) {
        rotation.value = withRepeat(
          withTiming(rotation.value + 360, { duration: 9000, easing: Easing.linear }),
          -1,
          false
        );
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
  }));

  return (
    <GestureDetector gesture={pan}>
      {/* perspective는 자식들이 공유할 하나의 3D 공간을 만든다 (react-native-web이 그대로 CSS로 전달) */}
      <View style={[styles.wrap, { width, height, perspective: 1100 }]}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={[styles.face, styles.front]}>{front}</View>
          <View style={[styles.face, styles.back]}>{back}</View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
  },
  face: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  front: {},
  back: {
    transform: [{ rotateY: '180deg' }],
  },
});
