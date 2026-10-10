import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import Text from '../ui/Text';
import { t as i18nT } from '../i18n';

// 풍물(사물놀이) 계열 진법을 완성했을 때 터지는 연출 한가운데 실제로 등장시키는
// 상모돌리기 원화 — 포트폴리오 PPT에 있던 일러스트를 그대로 크롭해 쓴 것.
const PUNG_SPIN_IMAGE = require('../../assets/characters/pung_spin.png');

const BURST_ICONS = ['🥁', '🔔', '✨', '🎉', '🪘', '✨'];

// 완성했을 때 터지는 연출 효과.
// variant='burst'  — 진법(1번)용: 진법 종류(풍물/강강술래/역사진법)에 맞는 소품이 중심에서 사방으로 흩어지며 반짝인다.
// variant='stamp'  — 훈민정음·인쇄(2번)용: 도장을 쾅 찍는 듯한 효과.
// 충격감(juice)을 위해 두 효과 모두 완성 순간에 번지는 충격파 링을 함께 그린다.
// nonce가 바뀔 때마다(=완성할 때마다) 애니메이션이 처음부터 다시 재생된다.
export default function CompletionEffect({
  nonce = 0,
  variant = 'burst',
  color = '#c1592f',
  label,
  icons,
  showPerformer = false,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const prevNonce = useRef(0);

  useEffect(() => {
    if (!nonce || nonce === prevNonce.current) return;
    prevNonce.current = nonce;
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: variant === 'stamp' ? 220 : 420,
        useNativeDriver: true,
      }),
      Animated.delay(280),
      Animated.timing(anim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  if (!nonce) return null;

  // 충격파 링 — 어떤 variant든 완성 순간 "쿵" 하고 퍼지는 느낌을 더해 타격감을 준다.
  const ringScale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.4, 1.4] });
  const ringOpacity = anim.interpolate({ inputRange: [0, 0.08, 0.5, 1], outputRange: [0, 0.8, 0, 0] });
  const shockwave = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { borderColor: color, opacity: ringOpacity, transform: [{ scale: ringScale }] },
      ]}
    />
  );

  if (variant === 'stamp') {
    const scale = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [2.4, 0.9, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] });
    const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '-8deg'] });
    return (
      <View pointerEvents="none" style={styles.overlay}>
        {shockwave}
        <Animated.View
          style={[
            styles.stamp,
            { borderColor: color, opacity, transform: [{ scale }, { rotate }] },
          ]}
        >
          <Text style={[styles.stampText, { color }]}>{i18nT(label || '완성')}</Text>
        </Animated.View>
      </View>
    );
  }

  const glowOpacity = anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.85, 0] });
  const glowScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] });
  const labelOpacity = anim.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const iconSet = icons && icons.length ? icons : BURST_ICONS;

  // 풍물 계열 진법을 완성하면 가운데서 실제 상모돌리기 캐릭터가 한 바퀴 돌며 등장한다.
  const performerScale = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.2, 1.15, 1, 0.7] });
  const performerOpacity = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const performerSpin = anim.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '15deg'] });

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {shockwave}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, backgroundColor: color, transform: [{ scale: glowScale }] },
        ]}
      />
      {showPerformer && (
        <Animated.Image
          source={PUNG_SPIN_IMAGE}
          resizeMode="contain"
          style={[
            styles.performer,
            {
              opacity: performerOpacity,
              transform: [{ scale: performerScale }, { rotate: performerSpin }],
            },
          ]}
        />
      )}
      {iconSet.map((ic, i) => {
        const angle = (Math.PI * 2 * i) / iconSet.length - Math.PI / 2;
        const dx = Math.cos(angle) * 64;
        const dy = Math.sin(angle) * 64;
        const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const op = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
        const sc = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.icon,
              { opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] },
            ]}
          >
            {ic}
          </Animated.Text>
        );
      })}
      {label ? (
        <Animated.Text style={[styles.label, { opacity: labelOpacity, color }]}>{label}</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  glow: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  performer: { position: 'absolute', width: 120, height: 120 },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
  },
  icon: { position: 'absolute', fontSize: 28 },
  label: { position: 'absolute', top: '36%', fontSize: 18, fontWeight: '800' },
  stamp: {
    borderWidth: 6,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  stampText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
});
