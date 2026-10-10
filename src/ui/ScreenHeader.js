import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from './Text';
import { DancheongBand } from './Motifs';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { play } from '../utils/sound';

// 화면 맨 위 — 뒤로가기(도장 같은 네모) + 붓글씨 제목 + 단청 띠
const SCENES = [
  { id: 'Jinbeop', label: '진법' },
  { id: 'Print', label: '훈민정음·인쇄' },
  { id: 'Play', label: '전래놀이' },
];

// 한 판에 갇히지 않도록 — 지금 판을 강조하고 다른 판으로 바로 건너가는 띠
function SceneSwitch({ current }) {
  const nav = useNavigation();
  return (
    <View style={styles.switchRow}>
      {SCENES.map((s) => (
        <Pressable
          key={s.id}
          style={[styles.pill, s.id === current && styles.pillOn]}
          onPress={() => {
            if (s.id === current) return;
            play('tap');
            nav.navigate(s.id);
          }}
        >
          <Text style={[styles.pillText, s.id === current && styles.pillTextOn]}>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ScreenHeader({ title, sub, onBack, right, scene }) {
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
      {scene ? <SceneSwitch current={scene} /> : null}
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
  switchRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.paper },
  pillOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  pillTextOn: { color: '#fff' },
});
