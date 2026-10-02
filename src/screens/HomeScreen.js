import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import MascotDuo from '../components/MascotDuo';
import OhangPicker from '../components/OhangPicker';
import { useJourney } from '../context/JourneyContext';
import { colors } from '../theme';

const CARDS = [
  {
    id: 'jinbeop',
    title: '진법',
    eyebrow: '풍물 · 사물놀이',
    accent: '#3f6f8f',
    desc: '풍물·강강술래·역사 속 진법을 섞어 대형을 만들어보는 판',
    ready: true,
    route: 'Jinbeop',
  },
  {
    id: 'print',
    title: '훈민정음 · 인쇄',
    eyebrow: '문자 · 기록',
    accent: '#8a6d3f',
    desc: '글자를 짓고, 새기고, 찍어내는 판',
    ready: true,
    route: 'Print',
  },
  {
    id: 'tbd',
    title: '전래놀이',
    eyebrow: '10년 이상 현장 교육 경험',
    accent: '#c1592f',
    desc: '줄넘기·상모돌리기·구슬치기 같은 전래놀이 열두 가지를 손끝으로 즐기는 판',
    ready: true,
    route: 'Play',
  },
];

export default function HomeScreen({ navigation }) {
  const { skills } = useJourney();
  // [1,2,3에 적용한 걸 결과물에도] 와 같은 논리 — 홈 화면의 두 캐릭터도 지금까지
  // 실제로 쌓인 숙련도(skills)를 시그모이드로 눌러 존재감(링 밝기)으로 드러낸다.
  const { pungValue, gyeolValue } = useMemo(() => {
    const jinbeopVals = [];
    const printVals = [];
    const playVals = [];
    Object.entries(skills || {}).forEach(([key, v]) => {
      if (key.startsWith('jinbeop:')) jinbeopVals.push(v);
      else if (key.startsWith('print:')) printVals.push(v);
      else playVals.push(v);
    });
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    return { pungValue: avg([...jinbeopVals, ...playVals]), gyeolValue: avg(printVals) };
  }, [skills]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* [스크롤 없어서 아래 카드가 잘리던 문제 수정] 전에는 ScrollView 없이 내용을
          그대로 쌓아서, 창 높이보다 콘텐츠가 길면(특히 오늘의 기운 팝오버까지 열면)
          "전래놀이" 카드 같은 아래쪽 내용이 화면 밖으로 잘린 채 스크롤할 방법이
          없었다. 전체를 ScrollView로 감싼다. */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>잇결</Text>
          <Text style={styles.title}>대한민국의 보물</Text>
        </View>
        {/* [오늘의 기운 선택 기능] 홈에서도 바로 보고 바꿀 수 있게 — 바꾸면 세 판 전체에 반영된다. */}
        <OhangPicker />
      </View>
      <Text style={styles.subtitle}>
        손끝으로 만나는 세 가지 전통 — 보고 끝나지 않고, 직접 만들어봅니다.
      </Text>

      <MascotDuo
        leftValue={pungValue}
        rightValue={gyeolValue}
        caption="안녕! 우리는 풍이와 결이야. 진법·훈민정음·전래놀이, 세 가지 전통을 함께 만들어보자!"
        size={64}
        style={{ marginTop: 18 }}
      />

      {/* 이 앱이 왜 만들어졌는지 — 마스코트의 말이 아니라 만든 사람의 실제 이력으로
          직접 말한다. 국악(사물놀이·풍물) 전공, 인천에서 10년 넘게 운영한 국악연구소,
          2015년에 직접 쓴 전래놀이 교육 교재 — 이 세 가지 장면은 그 경험에서 나왔다. */}
      <View style={styles.makerNote}>
        <Text style={styles.makerLabel}>만든 사람</Text>
        <Text style={styles.makerText}>
          사물놀이·풍물을 전공하고, 인천에서 10년 넘게 국악연구소를 운영하며 아이들에게
          국악과 전래놀이를 가르쳤습니다. 2015년에는 전래놀이 교육 교재를 직접 써서
          강사들을 교육하기도 했어요. 이 앱의 진법과 전래놀이 열두 가지는 그 현장 경험을
          그대로 옮긴 것입니다.
        </Text>
      </View>

      <View style={styles.list}>
        {CARDS.map((c) => (
          <Pressable
            key={c.id}
            disabled={!c.ready}
            style={[
              styles.card,
              { borderLeftColor: c.accent, borderLeftWidth: 5 },
              !c.ready && styles.cardDisabled,
            ]}
            onPress={() => c.ready && navigation.navigate(c.route)}
          >
            <Text style={[styles.cardEyebrow, { color: c.accent }]}>{c.eyebrow}</Text>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardDesc}>{c.desc}</Text>
            {!c.ready && <Text style={styles.soon}>준비 중</Text>}
          </Pressable>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 13, color: colors.accentDeep, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
  mascotIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  mascotPair: { flexDirection: 'row' },
  introBubble: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  introText: { fontSize: 12, color: colors.ink, lineHeight: 17, fontWeight: '600' },
  makerNote: {
    marginTop: 16,
    backgroundColor: colors.night,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  makerLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.accentSoft,
    letterSpacing: 2,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  makerText: { fontSize: 12.5, color: colors.bg, lineHeight: 19.5 },
  list: { marginTop: 20, gap: 14 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  cardDisabled: { opacity: 0.5 },
  cardEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  cardDesc: { fontSize: 12.5, color: colors.muted, marginTop: 6, lineHeight: 18 },
  soon: {
    marginTop: 10,
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
  },
});
