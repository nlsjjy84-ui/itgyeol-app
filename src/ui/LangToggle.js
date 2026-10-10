import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './Text';
import { LANGS } from '../i18n';
import { useLangSwitch } from '../i18n/LangContext';
import { colors } from '../theme';
import { play } from '../utils/sound';

// 언어 고르기 — 준비된 언어만 보인다(중국어·일본어는 언어팩이 채워지면 자동으로 나타난다).
export default function LangToggle({ style }) {
  const { lang, change } = useLangSwitch();
  return (
    <View style={[st.row, style]}>
      {LANGS.filter((l) => l.ready).map((l) => (
        <Pressable
          key={l.id}
          accessibilityRole="button"
          accessibilityLabel={l.label}
          onPress={() => {
            if (l.id === lang) return;
            play('tap');
            change(l.id);
          }}
          style={[st.chip, l.id === lang && st.on]}
        >
          <Text style={[st.txt, l.id === lang && st.txtOn]}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  on: { backgroundColor: colors.ink, borderColor: colors.ink },
  txt: { fontSize: 11, color: colors.ink, fontWeight: '600' },
  txtOn: { color: colors.paper },
});
