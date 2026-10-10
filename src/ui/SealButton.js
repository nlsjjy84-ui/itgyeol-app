import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Text from './Text';
import { colors } from '../theme';
import { play } from '../utils/sound';

// 도장 같은 단추 — 네모진 붉은 판에 흰 글씨, 누르면 살짝 눌린다.
// variant: 'seal'(붉은 도장) | 'ink'(먹) | 'paper'(한지·보조)
export default function SealButton({ label, onPress, variant = 'seal', style, small, disabled, sound = 'tap' }) {
  const bg = variant === 'seal' ? colors.accent : variant === 'ink' ? colors.ink : colors.paper;
  const fg = variant === 'paper' ? colors.ink : colors.baek;
  const edge = variant === 'seal' ? colors.accentDeep : variant === 'ink' ? '#000' : colors.border;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (sound) play(sound);
        if (onPress) onPress();
      }}
      style={({ pressed }) => [
        styles.wrap,
        { backgroundColor: edge, opacity: disabled ? 0.45 : 1 },
        pressed && { transform: [{ translateY: 2 }] },
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            small && styles.faceSmall,
            { backgroundColor: bg, borderColor: edge, marginBottom: pressed ? 0 : 3 },
          ]}
        >
          <Text style={[styles.label, small && styles.labelSmall, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 5, alignSelf: 'stretch' },
  face: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  label: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  labelSmall: { fontSize: 14 },
});
