// 「왜 여기 있나요?」 — 화면·기능마다 무엇을 하는 곳이고 왜 필요한지 한두 줄로 알려 준다.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { t } from '../i18n';

export default function WhyBox({ text, style, testID = 'why-box' }) {
  return (
    <View style={[st.box, style]} testID={testID}>
      <Text style={st.q}>{t('왜 여기 있나요?')}</Text>
      <Text style={st.a}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  box: { backgroundColor: '#f3ede1', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#8a6a3b', gap: 3 },
  q: { fontSize: 12, fontWeight: '800', color: '#8a6a3b' },
  a: { fontSize: 14, color: '#2a241c', lineHeight: 21 },
});
