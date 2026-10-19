import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Image, useWindowDimensions, ScrollView } from 'react-native';
import Text from '../ui/Text';
import Jogakbo from '../components/Jogakbo';
import { workTitle } from '../components/MockWorks';
import { MOCK_WORKS, MOCK_IMAGES } from '../data/mockWorks';
import { useJourney } from '../context/JourneyContext';
import { colors, fonts } from '../theme';
import { t } from '../i18n';
import { play } from '../utils/sound';
import { wallQueue } from '../utils/exhibit';
import useLive from '../utils/useLive';

// 박물관 전시 화면(큰 화면, 시연) — 전시해도 된다고 고른 작품 중 담당자가 "걸기"한 작품이 한 점씩 크게 넘어간다.
// 걸린 작품이 없을 때는 예시 작품(가상 기록)으로 채운다. 이름 대신 별명과 나라만 보인다.
// 담당자 칸: 전시 대기 작품을 보고 걸거나 내린다. 걸면 손님의 전시관 화면이 "전시 중"으로 바뀐다.
// 잇결 서버로 이어져, 여러 손님 기기의 신청이 이 큰 화면에 모인다(4초마다 새로 읽음). 서버가 안 열리면 이 기기 것만 보인다.
const SLIDE_MS = 7000;
const CAPTION = ['관람객이 놀이로 빚은 작품', 'Made by a visitor through play', '观众通过游戏创作的作品', '来館者が遊びでつくった作品'];

export default function ExhibitWallScreen({ navigation }) {
  const { exhibit, setExhibit, refreshExhibit } = useJourney();
  const online = useLive(refreshExhibit, 4000);
  const { width, height } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [staff, setStaff] = useState(false);
  const fillers = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    return Array.from({ length: 8 }, (_, k) => MOCK_WORKS[(day * 37 + k * 53) % MOCK_WORKS.length]);
  }, []);
  const queue = useMemo(() => wallQueue(exhibit, fillers), [exhibit, fillers]);
  const waiting = (exhibit || []).filter((e) => e.status !== 'showing');
  useEffect(() => {
    if (staff || queue.length < 2) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % queue.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [staff, queue.length]);
  const cur = queue[i % Math.max(1, queue.length)];
  const art = Math.min(width * 0.8, height * 0.55, 520);

  return (
    <View style={st.wall}>
      <View style={st.head}>
        <Text style={st.brand}>{t('잇결 전시')}</Text>
        <View style={st.headBtns}>
          <Pressable onPress={() => { play('tap'); setStaff((v) => !v); }} hitSlop={8}>
            <Text style={st.headLink}>{staff ? t('전시 화면으로') : t('담당자 · 걸기 {n}', { n: waiting.length })}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={st.headLink}>{t('닫기')}</Text>
          </Pressable>
        </View>
      </View>

      {staff ? (
        <ScrollView contentContainerStyle={st.staff}>
          <Text style={st.staffH}>{t('전시 대기 {n}점', { n: waiting.length })}</Text>
          {waiting.length === 0 ? <Text style={st.staffTxt}>{t('대기 중인 작품이 없어요.')}</Text> : null}
          {(exhibit || []).map((e) => (
            <View key={e.code} style={st.staffRow}>
              <View style={st.staffArt}>{e.attempts && e.attempts.length ? <Jogakbo attempts={e.attempts} size={72} /> : null}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.staffNick}>{e.nick || t('손님')} · {t(e.country || '그 밖의 나라')}</Text>
                <Text style={st.staffTxt}>{e.status === 'showing' ? t('전시 중') : t('전시 대기')}</Text>
              </View>
              <Pressable
                style={[st.staffBtn, e.status === 'showing' && st.staffBtnOff]}
                onPress={() => { play('stamp'); setExhibit(e.code, { status: e.status === 'showing' ? 'waiting' : 'showing' }); }}
              >
                <Text style={st.staffBtnTxt}>{e.status === 'showing' ? t('내리기') : t('걸기')}</Text>
              </Pressable>
            </View>
          ))}
          <Text style={st.staffTxt}>
            {online === false ? t('서버에 이어지지 않아 이 기기의 신청만 보여요.') : t('잇결 서버에 모인 여러 기기의 신청이에요. 걸면 손님 화면도 "전시 중"으로 바뀌어요.')}
          </Text>
        </ScrollView>
      ) : cur ? (
        <View style={st.stage}>
          <View style={[st.frame, { width: art + 28, height: art + 28 }]}>
            {cur.kind === 'visitor' ? (
              <Jogakbo attempts={cur.entry.attempts || []} size={art} />
            ) : (
              <Image source={MOCK_IMAGES[cur.work.id]} style={{ width: art, height: art }} resizeMode="contain" />
            )}
          </View>
          <Text style={st.title}>{cur.kind === 'visitor' ? `${cur.entry.nick || t('손님')} · ${t(cur.entry.country || '그 밖의 나라')}` : workTitle(cur.work)}</Text>
          <Text style={st.sub}>{cur.kind === 'visitor' ? CAPTION.join('  ·  ') : t('예시 작품 · 가상의 놀이 기록으로 만든 모양')}</Text>
          <View style={st.dots}>
            {queue.map((q, k) => (
              <View key={q.key} style={[st.dot, k === i % queue.length && st.dotOn]} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wall: { flex: 1, backgroundColor: '#0d1114' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  brand: { fontSize: 18, fontFamily: fonts.serifBold, color: '#d6a94c', letterSpacing: 2 },
  headBtns: { flexDirection: 'row', gap: 18 },
  headLink: { fontSize: 12.5, fontWeight: '800', color: '#f3efe6' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  frame: { padding: 14, borderWidth: 3, borderColor: '#d6a94c', backgroundColor: '#f6f1e6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: fonts.serifBold, color: '#f3efe6', marginTop: 18, textAlign: 'center' },
  sub: { fontSize: 12.5, color: '#b9b2a2', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3a4249' },
  dotOn: { backgroundColor: '#d6a94c' },
  staff: { padding: 20, gap: 10 },
  staffH: { fontSize: 16, fontFamily: fonts.serifBold, color: '#f3efe6' },
  staffTxt: { fontSize: 12, color: '#b9b2a2', lineHeight: 18 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderColor: '#3a4249', borderRadius: 4 },
  staffArt: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f1e6' },
  staffNick: { fontSize: 14, fontWeight: '800', color: '#f3efe6' },
  staffBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 4, backgroundColor: colors.accent },
  staffBtnOff: { backgroundColor: '#3a4249' },
  staffBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
