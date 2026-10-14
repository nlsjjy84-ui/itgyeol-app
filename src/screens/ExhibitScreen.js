import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import ScreenHeader from '../ui/ScreenHeader';
import Jogakbo from '../components/Jogakbo';
import { MockCard, MockDetail } from '../components/MockWorks';
import { MOCK_WORKS } from '../data/mockWorks';
import { useJourney } from '../context/JourneyContext';
import { colors, fonts } from '../theme';
import { t } from '../i18n';
import { play } from '../utils/sound';

// 잇결 전시관 — 전시해도 된다고 고른 작품만 걸린다.
// 위: 내가 신청한 작품(전시 대기 중), 아래: 지금 걸려 있는 작품(시연용 예시).
// 박물관 전시 화면(ExhibitWall, 시연)에서 담당자가 걸면 "전시 중"으로 바뀐다. 지금은 같은 기기 안의 모의 연결이다.
const WALL = 24;

export default function ExhibitScreen({ navigation }) {
  const { exhibit, setExhibit, attempts } = useJourney();
  const [open, setOpen] = useState(null);
  const mine = useMemo(() => [...(exhibit || [])].sort((a, b) => (b.at || 0) - (a.at || 0)), [exhibit]);
  // 매일 다른 작품이 걸리는 것처럼 — 날짜로 시작 위치를 돌린다
  const wall = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * 37) % MOCK_WORKS.length;
    return Array.from({ length: WALL }, (_, i) => MOCK_WORKS[(start + i * 17) % MOCK_WORKS.length]);
  }, []);

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content}>
        <ScreenHeader title="잇결 전시관" sub={t('전시해도 된다고 고른 작품만 걸려요')} onBack={() => navigation.goBack()} />

        <Pressable onPress={() => { play('tap'); navigation.navigate('ExhibitWall'); }} style={st.wallBtn}>
          <Text style={st.wallBtnTxt}>{t('박물관 전시 화면 열기 (큰 화면 · 시연) ›')}</Text>
        </Pressable>
        <Text style={st.h}>{t('내가 신청한 작품 {n}점', { n: mine.length })}</Text>
        {mine.length === 0 ? (
          <Frame style={{ marginTop: 8 }}>
            <Text style={st.emptyTxt}>{t('아직 신청한 작품이 없어요. 결과 화면의 "이 작품을 전시해도 돼요"를 고르면 여기 올라와요.')}</Text>
            {attempts.length > 0 ? (
              <Pressable onPress={() => { play('tap'); navigation.navigate('Result'); }} hitSlop={8}>
                <Text style={st.link}>{t('내 결과물 보기 ›')}</Text>
              </Pressable>
            ) : null}
          </Frame>
        ) : (
          <View style={st.mineList}>
            {mine.map((e) => (
              <Frame key={e.code} style={st.mineCard}>
                <View style={st.mineRow}>
                  <View style={st.mineArt}>
                    {e.attempts && e.attempts.length ? <Jogakbo attempts={e.attempts} size={104} /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[st.badge, e.status === 'showing' && st.badgeOn]}>{e.status === 'showing' ? t('전시 중') : t('전시 대기 중')}</Text>
                    <Text style={st.nick} numberOfLines={1}>{e.nick ? e.nick : t('손님')}</Text>
                    <Text style={st.meta}>{t(e.country || '그 밖의 나라')} · #{String(e.code).slice(-6)}</Text>
                    <Text style={st.meta}>{e.status === 'showing' ? t('박물관 전시 화면에 걸려 있어요.') : t('걸리면 이 화면에서 "전시 중"으로 바뀌어요.')}</Text>
                    <Pressable onPress={() => { play('tap'); setExhibit(e.code, null); }} hitSlop={8}>
                      <Text style={st.cancel}>{t('전시 신청 취소')}</Text>
                    </Pressable>
                  </View>
                </View>
              </Frame>
            ))}
          </View>
        )}

        <View style={st.wall}>
          <Text style={st.wallTitle}>{t('지금 걸려 있는 작품')}</Text>
          <Text style={st.wallSub}>{t('시연용 예시예요. 실제 전시에서는 동의한 관람객의 작품이 이 자리에 걸려요.')}</Text>
          <View style={st.grid}>
            {wall.map((w) => (
              <View key={w.id} style={st.gilt}>
                <MockCard work={w} size={84} onPress={setOpen} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <MockDetail work={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 40 },
  h: { fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: 14 },
  emptyTxt: { fontSize: 12.5, color: colors.ink, lineHeight: 19 },
  link: { fontSize: 12.5, color: colors.accent, fontWeight: '800', marginTop: 8 },
  mineList: { gap: 10, marginTop: 8 },
  mineCard: {},
  mineRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mineArt: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  badgeOn: { backgroundColor: colors.green },
  wallBtn: { marginTop: 12, paddingVertical: 11, alignItems: 'center', borderRadius: 4, backgroundColor: colors.night, borderWidth: 1.5, borderColor: colors.gold },
  wallBtnTxt: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  badge: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: colors.baek, backgroundColor: colors.hwang, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, overflow: 'hidden' },
  nick: { fontSize: 17, fontFamily: fonts.serifBold, color: colors.ink, marginTop: 6 },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 16 },
  cancel: { fontSize: 11.5, color: colors.accent, fontWeight: '700', marginTop: 6, textDecorationLine: 'underline' },
  wall: { marginTop: 22, backgroundColor: colors.night, borderRadius: 4, padding: 14, borderWidth: 2, borderColor: colors.gold },
  wallTitle: { fontSize: 16, fontFamily: fonts.serifBold, color: colors.gold },
  wallSub: { fontSize: 11.5, color: colors.onNight, marginTop: 4, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 },
  gilt: { padding: 3, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 3, backgroundColor: colors.paper },
});
