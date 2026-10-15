import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { t as i18nT } from '../i18n';

const SCENES = [
  { id: 'Jinbeop', label: '진법 판으로' },
  { id: 'Print', label: '훈민정음·인쇄 판으로' },
  { id: 'Play', label: '전래놀이 판으로' },
  { id: 'Hangul', label: '한글 테트리스 판으로' },
  { id: 'Talchum', label: '탈춤 판으로' },
  { id: 'Dancheong', label: '단청 판으로' },
];

// 한 판만 계속 하지 않아도 되도록 — 다른 판으로 바로 건너간다. (현재 판은 빼고 보여 준다.)
export default function OtherScenes({ current, navigation, onGo }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.cap}>{i18nT('다른 판도 해 볼까요?')}</Text>
      <View style={styles.row}>
        {SCENES.filter((s) => s.id !== current).map((s) => (
          <Pressable
            key={s.id}
            style={styles.btn}
            onPress={() => {
              if (onGo) onGo();
              navigation.navigate(s.id);
            }}
          >
            <Text style={styles.txt}>{i18nT(s.label)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 6, alignItems: 'center' },
  cap: { fontSize: 11.5, color: colors.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.paper },
  txt: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
