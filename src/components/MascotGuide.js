import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import Mascot, { MASCOT_NAMES } from './Mascot';
import { colors } from '../theme';

// 마스코트 캐릭터가 말풍선으로 설명해주는 안내 바. 어느 화면에나 끼워 넣을 수 있다.
export default function MascotGuide({ which = 'pung', message, style }) {
  return (
    <View style={[styles.row, style]}>
      <Mascot which={which} size={46} />
      <View style={styles.bubble}>
        <Text style={styles.name}>{MASCOT_NAMES[which]}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  name: { fontSize: 10.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 2 },
  message: { fontSize: 11.5, color: colors.ink, lineHeight: 16 },
});
