import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import Mascot, { MASCOT_NAMES } from './Mascot';
import { colors } from '../theme';

// 시그모이드 — 입력값(스킬 레이팅이나 어텐션 비중처럼 범위가 들쭉날쭉한 실수)을
// 0~1 사이의 "밝기"로 눌러주는 실제 활성화 함수. 캐릭터가 움직이지 않아도, 지금까지
// 쌓인 실제 숫자(그 판에 얼마나 주목했는지/얼마나 숙련됐는지)가 캐릭터의 "존재감"
// (링 두께·불투명도)을 실제로 바꾼다 — 장식이 아니라 계산된 값이 화면에 드러나는 것.
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// 풍이·결이를 "말풍선 앞 작은 원" 보조 아이콘이 아니라, 화면의 주인공으로 나란히
// 세운다. 이모티콘이 아니라 실제 수채화 캐릭터 원화를 쓰고, 둘 다 함께 보여준다.
export default function MascotDuo({
  leftWhich = 'pung',
  rightWhich = 'gyeol',
  leftValue = 0,
  rightValue = 0,
  caption,
  size = 76,
  style,
}) {
  const leftGlow = sigmoid(leftValue);
  const rightGlow = sigmoid(rightValue);
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.stage}>
        <Character which={leftWhich} glow={leftGlow} size={size} />
        <Character which={rightWhich} glow={rightGlow} size={size} />
      </View>
      {!!caption && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{caption}</Text>
        </View>
      )}
    </View>
  );
}

function Character({ which, glow, size }) {
  return (
    <View style={styles.charCol}>
      <View
        style={[
          styles.glowRing,
          {
            width: size + 14,
            height: size + 14,
            borderRadius: (size + 14) / 2,
            borderWidth: 2 + glow * 3,
            opacity: 0.35 + glow * 0.55,
          },
        ]}
      >
        <Mascot which={which} size={size} />
      </View>
      <Text style={styles.charName}>{MASCOT_NAMES[which]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', marginBottom: 14 },
  stage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 22,
  },
  charCol: { alignItems: 'center' },
  glowRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.accent,
  },
  charName: {
    marginTop: 6,
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.accentDeep,
  },
  bubble: {
    marginTop: 10,
    maxWidth: '92%',
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  bubbleText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
});
