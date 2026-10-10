import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from './Text';
import { DancheongBand } from './Motifs';
import { colors } from '../theme';
import { play } from '../utils/sound';

// 화면 맨 위 — 뒤로가기(도장 같은 네모) + 붓글씨 제목 + 단청 띠
export default function ScreenHeader({ title, sub, onBack, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={() => {
              play('tap');
              onBack();
            }}
            style={styles.back}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹ 홈</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text brush style={styles.title}>
            {title}
          </Text>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
        {right || null}
      </View>
      <View style={styles.band}>
        <DancheongBand width={320} height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.paper,
  },
  backText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  title: { fontSize: 32, color: colors.ink, lineHeight: 38 },
  sub: { fontSize: 12, color: colors.muted },
  band: { marginTop: 6, alignItems: 'center' },
});
