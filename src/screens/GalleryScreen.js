import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { useJourney } from '../context/JourneyContext';
import { TASTE_GROUPS } from '../data/taste';
import { MOCK_WORKS as ALL_WORKS, matchWorks } from '../data/mockWorks';
import { visibleWorks } from '../utils/operator';

const MOCK_WORKS = visibleWorks(ALL_WORKS);
import { MockCard, MockDetail } from '../components/MockWorks';
import ScreenHeader from '../ui/ScreenHeader';
import { t } from '../i18n';

// 예시 작품 둘러보기 — 갈래별로 모아 본다. 순위도 점수도 없고, 그저 이런 모양들이 나올 수 있다는 구경이다.
export default function GalleryScreen({ navigation }) {
  const { taste } = useJourney();
  const [groupId, setGroupId] = useState('all');
  const [kwId, setKwId] = useState(null);
  const [open, setOpen] = useState(null);
  const group = TASTE_GROUPS.find((g) => g.id === groupId);
  const list = useMemo(() => {
    if (kwId) return MOCK_WORKS.filter((w) => w.main === kwId || w.tags.includes(kwId)).sort((a, b) => (b.main === kwId) - (a.main === kwId));
    if (groupId === 'mine') return matchWorks((taste && taste.picks) || [], 40);
    if (group) return MOCK_WORKS.filter((w) => group.keywords.some((k) => k.id === w.main));
    return MOCK_WORKS;
  }, [groupId, kwId, group, taste]);
  const hasMine = taste && taste.picks && taste.picks.length > 0;

  return (
    <SafeAreaView style={st.safe}>
      <ScreenHeader title="예시 둘러보기" sub={t('가상의 놀이 기록으로 빚은 예시 {n}점', { n: MOCK_WORKS.length })} onBack={() => navigation.goBack()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabs}>
        {[{ id: 'all', label: t('전체') }, ...(hasMine ? [{ id: 'mine', label: t('내가 떠올린 것') }] : []), ...TASTE_GROUPS.map((g) => ({ id: g.id, label: g.label }))].map((t) => (
          <Pressable key={t.id} style={[st.tab, groupId === t.id && st.tabOn]} onPress={() => { setGroupId(t.id); setKwId(null); }}>
            <Text style={[st.tabTxt, groupId === t.id && { color: '#fff' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {group ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.subTabs}>
          {group.keywords.map((k) => (
            <Pressable key={k.id} style={[st.sub, kwId === k.id && st.subOn]} onPress={() => setKwId(kwId === k.id ? null : k.id)}>
              <Text style={[st.subTxt, kwId === k.id && { color: '#fff' }]}>{k.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <ScrollView contentContainerStyle={st.grid}>
        {list.map((w) => (
          <MockCard key={w.id} work={w} size={104} onPress={setOpen} />
        ))}
        {list.length === 0 ? <Text style={st.empty}>{t('아직 이 갈래의 예시가 없어요.')}</Text> : null}
      </ScrollView>
      <MockDetail work={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  tabs: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabTxt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  subTabs: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  sub: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.paper },
  subOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  subTxt: { fontSize: 12, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', padding: 14, paddingBottom: 40 },
  empty: { color: colors.muted, padding: 20 },
});
