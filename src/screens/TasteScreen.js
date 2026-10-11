import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { useJourney } from '../context/JourneyContext';
import { TASTE_GROUPS, TASTE_KEYWORDS } from '../data/taste';
import { matchWorks } from '../data/mockWorks';
import { MockCard, MockDetail } from '../components/MockWorks';
import { play } from '../utils/sound';
import { t } from '../i18n';
import LangToggle from '../ui/LangToggle';
import { QuickTourStart } from '../ui/QuickTour';

// 시작하기 전에 — "대한민국 전통문화 하면 뭐가 떠오르세요?"
// 사전지식이 없어도 들어올 수 있게: 하나도 안 골라도 되고, 건너뛸 수 있다.
// 이 답은 결과의 모양을 정하지 않는다(결과는 놀이 행동의 흔적으로만). 비슷한 예시를 미리 보여 주는 데에만 쓴다.
export default function TasteScreen({ navigation, route }) {
  const { taste, setTaste, book, markBook } = useJourney();
  const again = route && route.params && route.params.again;
  const [picks, setPicks] = useState(taste && taste.picks ? taste.picks : []);
  // 단계는 화면 주소(params)에 둔다 — 예시 전체 보기에 갔다 돌아와도 같은 자리에 있게
  const step = route && route.params && route.params.step === 2 ? 2 : 1;
  const setStep = (n) => navigation.setParams({ step: n });
  const [open, setOpen] = useState(null);
  const matches = useMemo(() => matchWorks(picks, 12), [picks]);
  const labelOf = useMemo(() => Object.fromEntries(TASTE_KEYWORDS.map((k) => [k.id, k.label])), []);

  const toggle = (id) => {
    play('tap');
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  // 3분 둘러보기: 질문과 그림책 프롤로그를 본 것으로 두고 홈의 둘러보기 카드로 바로 간다.
  const startTour = () => {
    setTaste([]);
    markBook({ prologue: true });
    navigation.replace('Home', { tour: true });
  };
  const goHome = () => (book && !book.prologue ? navigation.replace('Book', { part: 'prologue', then: 'Home' }) : navigation.replace('Home'));

  if (step === 2) {
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.wrap}>
          <Pressable onPress={() => setStep(1)} hitSlop={10} style={st.back} accessibilityRole="button">
            <Text style={st.backTxt}>{t('‹ 다시 고르기')}</Text>
          </Pressable>
          <Text style={st.kicker}>{t('예시 둘러보기')}</Text>
          <Text style={st.q}>{t('이런 작품이 놓일 수 있어요')}</Text>
          <Text style={st.sub}>
            {picks.length
              ? t('떠오른 {list}{more}와 닿아 있는 예시예요.', { list: picks.slice(0, 3).map((p) => labelOf[p]).join(' · '), more: picks.length > 3 ? t(' 외 {n}개', { n: picks.length - 3 }) : '' })
              : t('고른 게 없어서 여러 갈래를 고르게 보여 드려요.')}
          </Text>
          <View style={st.grid}>
            {matches.map((w) => (
              <MockCard key={w.id} work={w} size={100} onPress={setOpen} />
            ))}
          </View>
          <Text style={st.note}>{t('예시는 가상의 놀이 기록으로 빚은 모양이에요. 내 작품은 내가 놀이에서 남긴 흔적으로만 정해져요.')}</Text>
          <Pressable style={st.ghost} onPress={() => navigation.navigate('Gallery')}>
            <Text style={st.ghostTxt}>{t('예시 전체 둘러보기')}</Text>
          </Pressable>
          <Pressable style={st.primary} onPress={goHome}>
            <Text style={st.primaryTxt}>{t('놀이하러 가기')}</Text>
          </Pressable>
        </ScrollView>
        <MockDetail work={open} onClose={() => setOpen(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={st.kicker}>{again ? t('다시 떠올려 보기') : t('시작하기 전에')}</Text>
          <LangToggle />
        </View>
        {!again && <QuickTourStart onStart={startTour} />}
        <Text style={st.q}>{t('대한민국 전통문화, 하면 뭐가 떠오르세요?')}</Text>
        <Text style={st.sub}>
          {t('하나여도, 여러 개여도, 하나도 안 떠올라도 괜찮아요. 떠오른 걸 눌러 두면 닿아 있는 예시 작품을 먼저 보여 드려요. 답은 이 기기에만 남아요.')}
        </Text>
        {TASTE_GROUPS.map((g) => (
          <View key={g.id} style={st.group}>
            <Text style={st.gLabel}>{g.label}</Text>
            <View style={st.chips}>
              {g.keywords.map((kw) => {
                const on = picks.includes(kw.id);
                return (
                  <Pressable key={kw.id} style={[st.chip, on && st.chipOn]} onPress={() => toggle(kw.id)}>
                    <Text style={[st.chipTxt, on && st.chipTxtOn]}>{kw.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={st.bar}>
        <Pressable
          style={st.skip}
          onPress={() => {
            setTaste([]);
            goHome();
          }}
        >
          <Text style={st.skipTxt}>{t('건너뛰기')}</Text>
        </Pressable>
        <Pressable
          style={st.primaryBar}
          onPress={() => {
            setTaste(picks);
            setStep(2);
          }}
        >
          <Text style={st.primaryTxt}>{picks.length ? t('{n}개 떠올랐어요 · 예시 보기', { n: picks.length }) : t('떠오르는 게 없어요 · 예시 보기')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  backTxt: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 20, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  kicker: { fontSize: 12, fontWeight: '800', color: colors.accentDeep, letterSpacing: 1 },
  q: { fontSize: 24, fontWeight: '800', color: colors.ink, lineHeight: 32 },
  sub: { fontSize: 13.5, color: colors.muted, lineHeight: 21 },
  group: { gap: 8, marginTop: 6 },
  gLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { fontSize: 13, color: colors.ink },
  chipTxtOn: { color: '#fff', fontWeight: '800' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, flexDirection: 'row', gap: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  skip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  skipTxt: { color: colors.ink, fontWeight: '700' },
  primaryBar: { flex: 1, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primaryTxt: { color: '#fff', fontWeight: '800' },
  ghost: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.paper },
  ghostTxt: { color: colors.ink, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 4 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center' },
});
