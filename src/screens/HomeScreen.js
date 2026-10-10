import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import MascotDuo from '../components/MascotDuo';
import OhangPicker from '../components/OhangPicker';
import ThemeToggle from '../ui/ThemeToggle';
import StoryScene from '../ui/StoryScene';
import { useJourney } from '../context/JourneyContext';
import { colors } from '../theme';
import Frame from '../ui/Frame';
import { CloudBand, DancheongBand, Taegeuk } from '../ui/Motifs';
import { play } from '../utils/sound';

const HANJA = { jinbeop: '陣', print: '文', tbd: '遊', hangul: '塊', talchum: '面', mask: '面', dancheong: '彩', pattern: '彩' };

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
  {
    id: 'hangul',
    title: '한글 테트리스',
    eyebrow: '한글 · 자음 모음',
    accent: '#a23b5c',
    desc: '자음 ㄱ·ㄴ·ㄷ·ㅁ과 모음 ㅣ·ㅡ·ㅏ·ㅓ·ㅗ·ㅜ 블록을 쌓아 줄을 지우는 테트리스',
    ready: true,
    route: 'Hangul',
  },
  // [체험 확장 로드맵] 지금 세 판은 "국악 전공·전래놀이 교육 경력"에서 나온 것이고,
  // 같은 설계 방식(공통 설계 질문 추출 → WOZ로 검증 → 난이도 단계)을 다른 전통
  // 소재에도 그대로 적용할 수 있다는 걸 보여주기 위한 다음 판 예고. 아직 구현은
  // 안 했지만(ready:false → "준비 중" 배지), 무엇을, 왜 다음으로 고를지는 구체적으로
  // 적어 둔다 — 그냥 "더 많은 체험 예정"이라고만 하면 근거가 안 되기 때문.
  {
    id: 'talchum',
    title: '탈춤 · 가면극',
    eyebrow: '움직임 · 역할',
    accent: '#8a4f8a',
    desc: '하회탈·봉산탈 등 지역별 탈과 마당(과장)마다 정해진 역할·동작 규칙을 몸짓으로 따라 해보는 판',
    ready: false,
    route: null,
  },
  {
    id: 'dancheong',
    title: '단청 · 전통 문양',
    eyebrow: '색 · 무늬',
    accent: '#2c7a6b',
    desc: '오방색 규칙에 맞춰 단청·보자기·규방 문양의 색과 칸을 직접 배치해보는 판',
    ready: false,
    route: null,
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
      else if (key.startsWith('print:') || key.startsWith('hangul:')) printVals.push(v);
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
        <View style={{ flex: 1 }}>
          <View style={styles.logoRow}>
            <Taegeuk size={34} />
            <Text brush style={styles.logo}>잇결</Text>
          </View>
          <Text style={styles.title}>대한민국의 보물</Text>
        </View>
        {/* [오늘의 기운 선택 기능] 홈에서도 바로 보고 바꿀 수 있게 — 바꾸면 세 판 전체에 반영된다. */}
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <OhangPicker />
          <ThemeToggle />
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <CloudBand width={260} />
      </View>
      <Text style={styles.subtitle}>
        손끝으로 만나는 세 가지 전통 — 보고 끝나지 않고, 직접 만들어봅니다.
      </Text>

      <StoryScene scene="prologue" style={{ marginTop: 16 }} />

      <MascotDuo
        leftValue={pungValue}
        rightValue={gyeolValue}
        caption="판을 놀수록 우리 둘의 모습이 또렷해져."
        size={52}
        style={{ marginTop: 14 }}
      />

      {/* 이 앱이 왜 만들어졌는지 — 마스코트의 말이 아니라 만든 사람의 실제 이력으로
          직접 말한다. 국악(사물놀이·풍물) 전공, 인천에서 10년 넘게 운영한 국악연구소,
          2015년에 직접 쓴 전래놀이 교육 교재 — 이 세 가지 장면은 그 경험에서 나왔다. */}
      <Frame tone="dark" style={{ marginTop: 18 }}>
        <Text style={styles.makerLabel}>만든 사람</Text>
        <Text style={styles.makerText}>
          사물놀이·풍물을 전공하고, 인천에서 10년 넘게 국악연구소를 운영하며 아이들에게
          국악과 전래놀이를 가르쳤습니다. 2015년에는 전래놀이 교육 교재를 직접 써서
          강사들을 교육하기도 했어요. 이 앱의 진법과 전래놀이 열두 가지는 그 현장 경험을
          그대로 옮긴 것입니다.
        </Text>
      </Frame>

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <DancheongBand width={320} height={12} />
      </View>

      <View style={styles.exploreRow}>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Gallery'); }}>
          <Text style={styles.exploreTxt}>예시 작품 둘러보기</Text>
        </Pressable>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Taste', { again: true }); }}>
          <Text style={styles.exploreTxt}>떠오르는 것 다시 고르기</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {CARDS.filter((c) => c.ready).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              play('drum');
              navigation.navigate(c.route);
            }}
          >
            <Frame accent={c.accent} style={styles.cardFrame}>
              <View style={styles.cardRow}>
                <View style={[styles.hanja, { backgroundColor: c.accent }]}>
                  <Text brush style={styles.hanjaText}>{HANJA[c.id] || '傳'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardEyebrow, { color: c.accent }]}>{c.eyebrow}</Text>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardDesc}>{c.desc}</Text>
                </View>
              </View>
            </Frame>
          </Pressable>
        ))}
      </View>

      {/* [체험 확장 근거] "다른 방향의 체험도 할 수 있다"는 말만으로는 근거가 안 되므로,
          지금 세 판을 만든 같은 방식(전통 소재 → 공통 설계 질문 → 난이도 단계)을 다음에
          무엇에 적용할지 구체적으로 보여준다. */}
      <View style={styles.roadmapHeader}>
        <Text style={styles.roadmapTitle}>다음 체험, 준비 중</Text>
        <Text style={styles.roadmapHint}>
          진법·훈민정음·전래놀이를 만든 같은 방식 — 전통 소재에서 공통된 설계 질문을
          뽑아내고, 난이도 단계를 나누어 직접 해보게 만드는 방식 — 을 다른 전통 영역에도
          그대로 넓힐 수 있어요. 아래 두 가지가 다음 후보입니다.
        </Text>
      </View>
      <View style={styles.list}>
        {CARDS.filter((c) => !c.ready).map((c) => (
          <View key={c.id} style={styles.cardDisabled}>
            <Frame accent={c.accent} style={styles.cardFrame}>
              <View style={styles.cardRow}>
                <View style={[styles.hanja, { backgroundColor: c.accent }]}>
                  <Text brush style={styles.hanjaText}>{HANJA[c.id] || '傳'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardEyebrow, { color: c.accent }]}>{c.eyebrow}</Text>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardDesc}>{c.desc}</Text>
                  <Text style={styles.soon}>준비 중</Text>
                </View>
              </View>
            </Frame>
          </View>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exploreRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' },
  exploreBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  exploreTxt: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontSize: 54, color: colors.accent, lineHeight: 60 },
  cardFrame: { marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hanja: { width: 60, height: 60, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.accentDeep, transform: [{ rotate: '-3deg' }] },
  hanjaText: { color: colors.baek, fontSize: 38, lineHeight: 46 },
  safe: { flex: 1, backgroundColor: 'transparent' },
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
  makerText: { fontSize: 12.5, color: colors.onNight, lineHeight: 19.5 },
  list: { marginTop: 20, gap: 14 },
  roadmapHeader: { marginTop: 26, marginBottom: 2 },
  roadmapTitle: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  roadmapHint: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 17.5 },
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
