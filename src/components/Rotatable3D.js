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
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

// 손으로 드래그해서 360도 돌려볼 수 있는 입체 뷰어.
//
// [네이티브 호환 재작성] 이전 버전은 바깥 래퍼에 perspective를, 안쪽 "카드" 한 장에
// transformStyle: 'preserve-3d' + rotateY를 주고, 앞/뒷면을 그 카드의 절대 위치 자식으로
// 겹쳐 backfaceVisibility로 숨기는 방식이었다. 이건 웹(react-native-web이 그대로 CSS
// perspective/transform-style/backface-visibility로 변환)에서는 그럴듯하게 보이지만,
// 실제 네이티브(안드로이드·iOS)에서는 "여러 자식이 부모의 3D 공간을 공유한다"는
// transform-style: preserve-3d 개념 자체가 기본 지원되지 않는다 — 그래서 네이티브에서는
// 입체감(원근 축소) 없이 앞/뒷면이 납작하게 뒤집히는 "종이 뒤집기"처럼 보였다.
//
// 지금 방식은 웹·네이티브 모두 동일하게 지원되는 두 가지만 쓴다:
//   1) perspective는 "따로 떨어진 스타일 값"이 아니라 transform 배열의 원소로 — 각 면
//      자신의 transform에 [{ perspective }, { rotateY }]를 함께 넣는다. 이건 RN 공식
//      문서가 권장하는, 네이티브에서도 실제로 원근 축소가 일어나는 방식이다.
//   2) 앞/뒷면을 "하나의 3D 카드"로 묶지 않고, 각자 자기 각도(뒷면 = 앞면 + 180도)로
//      독립적으로 돌리면서, 지금 보는 쪽이 어느 면인지는 opacity로 전환한다(90도/270도
//      경계에서 교차 전환). backfaceVisibility도 보조로 같이 줘서, 그걸 지원하는 플랫폼
//      에서는 더 깔끔한 경계를 덤으로 얻는다.
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

  // 0~360 범위로 접어넣은 각도에서, 지금 "앞면이 보이는 쪽"인지를 0~1 연속값으로 계산.
  // 89~91도, 269~271도 사이에서만 짧게 교차 전환해 깜빡임 없이 자연스럽게 넘어간다.
  const frontStyle = useAnimatedStyle(() => {
    const deg = ((rotation.value % 360) + 360) % 360;
    const opacity = interpolate(
      deg,
      [0, 89, 91, 269, 271, 360],
      [1, 1, 0, 0, 1, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ perspective: 1100 }, { rotateY: `${rotation.value}deg` }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const deg = ((rotation.value % 360) + 360) % 360;
    const opacity = interpolate(
      deg,
      [0, 89, 91, 269, 271, 360],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ perspective: 1100 }, { rotateY: `${rotation.value + 180}deg` }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.wrap, { width, height }]}>
        <Animated.View style={[styles.face, frontStyle]}>{front}</Animated.View>
        <Animated.View style={[styles.face, backStyle]}>{back}</Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
