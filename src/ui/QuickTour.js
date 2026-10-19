import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from './Text';
import { colors, fonts } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';

// 3분 둘러보기 — 처음 온 사람(면접관·전시 관람객)이 질문·그림책을 건너뛰고
// 놀이 한 판 → 예시 작품 → 전통 자료실 순서로 핵심만 빠르게 보게 한다.
// 순서를 정해 줄 뿐 점수·순위는 없다.
export function QuickTourStart({ onStart }) {
  return (
    <Pressable
      onPress={() => { play('tap'); onStart(); }}
      style={({ pressed }) => [st.start, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <Text style={st.startKicker}>{t('처음이라면')}</Text>
      <Text style={st.startTitle}>{t('3분 둘러보기')} →</Text>
      <Text style={st.startSub}>{t('질문과 그림책을 건너뛰고 놀이 한 판, 예시 작품, 전통 자료실을 차례로 봐요.')}</Text>
    </Pressable>
  );
}

export function QuickTourCard({ navigation, onClose }) {
  const steps = [
    { n: '1', title: t('놀이 한 판'), sub: t('전래놀이 하나를 짧게 해 봐요'), go: () => navigation.navigate('Play') },
    { n: '2', title: t('예시 작품'), sub: t('가상의 놀이 기록으로 빚은 예시 450점'), go: () => navigation.navigate('Gallery') },
    { n: '3', title: t('전통 자료실'), sub: t('작품의 바탕이 된 실제 유물 121점'), go: () => navigation.navigate('Archive') },
  ];
  return (
    <View style={st.card}>
      <View style={st.head}>
        <Text style={st.title}>{t('3분 둘러보기')}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('닫기')}>
          <Text style={st.close}>×</Text>
        </Pressable>
      </View>
      {steps.map((s) => (
        <Pressable
          key={s.n}
          onPress={() => { play('tap'); s.go(); }}
          style={({ pressed }) => [st.step, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
        >
          <View style={st.num}><Text style={st.numTxt}>{s.n}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.stepTitle}>{s.title}</Text>
            <Text style={st.stepSub}>{s.sub}</Text>
          </View>
          <Text style={st.arrow}>›</Text>
        </Pressable>
      ))}
      <Text style={st.note}>{t('다 보고 나면 아래 여섯 개의 판에서 마음대로 골라 놀아요.')}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  start: { borderRadius: 6, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.accentSoft, padding: 14, gap: 4, marginBottom: 14 },
  startKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.accent },
  startTitle: { fontSize: 18, color: colors.ink, fontFamily: fonts.serifBold },
  startSub: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  card: { borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.paper, padding: 14, gap: 8, marginTop: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, color: colors.ink, fontFamily: fonts.serifBold },
  close: { fontSize: 22, color: colors.muted, paddingHorizontal: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 4, backgroundColor: colors.accentSoft },
  num: { width: 26, height: 26, borderRadius: 3, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepTitle: { fontSize: 15, color: colors.ink, fontFamily: fonts.serifBold },
  stepSub: { fontSize: 12.5, color: colors.muted, lineHeight: 17 },
  arrow: { fontSize: 22, color: colors.accent },
  note: { fontSize: 12, color: colors.muted, lineHeight: 17 },
});
