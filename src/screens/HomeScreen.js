import React, { useMemo } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { SITE_URL } from '../utils/carry';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import MascotDuo from '../components/MascotDuo';
import OhangPicker from '../components/OhangPicker';
import ThemeToggle from '../ui/ThemeToggle';
import StoryScene from '../ui/StoryScene';
import { useJourney } from '../context/JourneyContext';
import { QuickTourCard } from '../ui/QuickTour';
import { colors } from '../theme';
import Frame from '../ui/Frame';
import SealIcon from '../ui/SealIcon';
import { CloudBand, DancheongBand, Taegeuk } from '../ui/Motifs';
import { play } from '../utils/sound';
import { PART_OF_CARD } from '../data/book';
import { t } from '../i18n';
import LangToggle from '../ui/LangToggle';
import HomeNumbers from '../components/HomeNumbers';
import RelicHome from '../components/RelicHome';
import { HALL_BY_ID, hallPercent, clearsOf } from '../data/halls';
import { SCENE_REASON } from '../utils/pieceStore';
import { MATERIAL_BY_ID } from '../data/materialTree';
import { Swatch, matName, MATERIAL_COUNT } from './MaterialScreen';

// 판 도장 — 그림(누구나 알아봄) + 우리말 한 글자(도장 귀퉁이)
const SEAL = { jinbeop: ['circle', '진'], print: ['type', '글'], tbd: ['top', '놀'], hangul: ['blocks', '쌓'], talchum: ['mask', '탈'], mask: ['mask', '탈'], dancheong: ['colors', '색'], pattern: ['colors', '색'] };

const CARDS = [
  {
    id: 'jinbeop',
    why: '여럿이 한 몸처럼 움직이던 풍물·강강술래의 대형을 직접 짜 보며, 함께 맞추는 힘을 익혀요.',
    scene: '진법',
    title: '진법',
    eyebrow: '풍물 · 사물놀이',
    accent: '#3f6f8f',
    desc: '풍물·강강술래·역사 속 진법을 섞어 대형을 만들어보는 판',
    ready: true,
    route: 'Jinbeop',
  },
  {
    id: 'print',
    why: '소리 나는 입 모양을 본뜬 훈민정음의 원리대로 글자를 짓고, 새기고, 찍는 과정을 손으로 해 봐요.',
    scene: '훈민정음·인쇄',
    title: '훈민정음 · 인쇄',
    eyebrow: '문자 · 기록',
    accent: '#8a6d3f',
    desc: '글자를 짓고, 새기고, 찍어내는 판',
    ready: true,
    route: 'Print',
  },
  {
    id: 'tbd',
    why: '만든 사람이 10년 넘게 아이들과 해 온 전래놀이를 손끝으로 옮겨, 몸으로 놀던 방법을 익혀요.',
    scene: '전래놀이',
    title: '전래놀이',
    eyebrow: '10년 이상 현장 교육 경험',
    accent: '#c1592f',
    desc: '줄넘기·상모돌리기·구슬치기 같은 전래놀이 열두 가지를 손끝으로 즐기는 판',
    ready: true,
    route: 'Play',
  },
  {
    id: 'hangul',
    why: '자음·모음 블록을 쌓아 한 글자가 짜이는 원리를 놀면서 익혀요.',
    scene: '한글 테트리스',
    title: '한글 테트리스',
    eyebrow: '한글 · 자음 모음',
    accent: '#a23b5c',
    desc: '자음 ㄱ·ㄴ·ㄷ·ㅁ과 모음 ㅏ·ㅑ·ㅓ·ㅕ·ㅗ·ㅛ·ㅜ·ㅠ·ㅡ·ㅣ·ㅐ·ㅒ 블록을 쌓아 줄을 지우는 테트리스',
    ready: true,
    route: 'Hangul',
  },
  // 다섯·여섯 번째 판 — 같은 설계 방식(공통 설계 질문 → 자료 대조 → 단계)을 다른 전통 소재에 옮긴 판.
  // 탈춤: 봉산탈춤의 장단(굿거리·타령)과 깨끼춤 / 단청: 단청장의 작업 순서(가칠 → 타분 → 오색 → 분선).
  {
    id: 'talchum',
    why: '장단의 큰 박에 맞춰 춤추며 우리 가락의 박자를 몸으로 익혀요.',
    scene: '탈춤',
    title: '탈춤 · 가면극',
    eyebrow: '움직임 · 역할',
    accent: '#8a4f8a',
    desc: '굿거리·타령 장단의 큰 박에 맞춰 한삼을 뿌리고 깨끼춤을 추는 판',
    ready: true,
    route: 'Talchum',
  },
  {
    id: 'dancheong',
    why: '단청장이 실제로 칠하는 순서를 따라가며 오색에 담긴 뜻을 익혀요.',
    scene: '단청',
    title: '단청 · 전통 문양',
    eyebrow: '색 · 무늬',
    accent: '#2c7a6b',
    desc: '가칠 → 타분 → 오색 채색 → 분선, 단청장이 칠하는 순서대로 머리초를 완성하는 판',
    ready: true,
    route: 'Dancheong',
  },
];

export default function HomeScreen({ navigation, route }) {
  const { skills, book, attempts, exhibit, carried, materials, playLog } = useJourney();
  const mBase = materials && materials.base ? MATERIAL_BY_ID[materials.base] : null;
  const mAccent = materials && materials.accent ? MATERIAL_BY_ID[materials.accent] : null;
  const { width: winW } = useWindowDimensions();
  // 넓은 화면(키오스크·태블릿)에서는 맨 위에 "내 폰으로" QR을 띄워 줄을 줄인다.
  const kiosk = winW >= 700;
  // [1,2,3에 적용한 걸 결과물에도] 와 같은 논리 — 홈 화면의 두 캐릭터도 지금까지
  // 실제로 쌓인 숙련도(skills)를 시그모이드로 눌러 존재감(링 밝기)으로 드러낸다.
  const { pungValue, gyeolValue } = useMemo(() => {
    const jinbeopVals = [];
    const printVals = [];
    const playVals = [];
    Object.entries(skills || {}).forEach(([key, v]) => {
      if (key.startsWith('jinbeop:')) jinbeopVals.push(v);
      else if (key.startsWith('print:') || key.startsWith('hangul:') || key.startsWith('dancheong:')) printVals.push(v);
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
          <Text style={styles.title}>{t('대한민국의 보물')}</Text>
        </View>
        {/* [오늘의 기운 선택 기능] 홈에서도 바로 보고 바꿀 수 있게 — 바꾸면 세 판 전체에 반영된다. */}
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <LangToggle />
          <OhangPicker />
          <ThemeToggle />
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <CloudBand width={260} />
      </View>
      <Text style={styles.subtitle}>
        {t('손끝으로 만나는 여섯 가지 전통 — 보고 끝나지 않고, 직접 만들어봅니다.')}
      </Text>
      {carried ? (
        <Pressable onPress={() => { play('stamp'); navigation.navigate('Museum'); }}>
          <Frame accent={colors.green} style={{ marginTop: 14 }}>
            <Text style={styles.carryTitle}>{t('박물관에서 모은 기록을 가져왔어요')}</Text>
            <Text style={styles.carryText}>{t('집에서도 판을 더 놀면 전시실이 계속 자라요. 눌러서 나의 박물관을 보세요 ›')}</Text>
          </Frame>
        </Pressable>
      ) : null}
      {kiosk ? (
        <Pressable onPress={() => navigation.navigate('Kiosk')}>
          <Frame style={{ marginTop: 14 }}>
            <View style={styles.kioskRow}>
              <View style={styles.kioskQr}>
                <QRCode value={SITE_URL} size={96} color="#1b2227" backgroundColor="#ffffff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.carryTitle}>{t('줄 서지 말고 내 폰으로')}</Text>
                <Text style={styles.carryText}>{t('QR을 찍으면 구경하면서 할 수 있어요. 결과물은 굿즈숍에서 찾거나 택배로 받아요.')}</Text>
              </View>
            </View>
          </Frame>
        </Pressable>
      ) : null}
      {route && route.params && route.params.tour ? (
        <QuickTourCard navigation={navigation} onClose={() => navigation.setParams({ tour: false })} />
      ) : null}

      {/* 2026-11-22 새 설계: 놀이가 메인 — 판 카드를 맨 위로. 합체·이야기 장면·풍이결이·재료 고르기 칸은 홈에서 뺌. */}
      <Text style={styles.sectionLabel}>{t('오늘 놀 판 — 판을 깨면 진짜 유물을 얻어요')}</Text>
      <View style={styles.list}>
        {CARDS.filter((c) => c.ready).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              play('drum');
              // 처음 들어가는 판이면 그림책 입구 이야기를 먼저 보여 준다.
              const part = PART_OF_CARD[c.id];
              if (part && book && !book.gates[part]) navigation.navigate('Book', { part, then: c.route });
              else navigation.navigate(c.route);
            }}
          >
            <Frame accent={c.accent} style={styles.cardFrame}>
              <View style={styles.cardRow}>
                <SealIcon kind={(SEAL[c.id] || [])[0]} letter={(SEAL[c.id] || [null, '전'])[1]} size={64} bg={c.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardEyebrow, { color: c.accent }]}>{t(c.eyebrow)}</Text>
                  <Text style={styles.cardTitle}>{t(c.title)}</Text>
                  <Text style={styles.cardDesc}>{t(c.desc)}</Text>
                  {c.why ? (
                    <Text style={styles.cardWhy}>
                      <Text style={styles.cardWhyTag}>{t('왜 하나요')} · </Text>
                      {t(c.why)}
                    </Text>
                  ) : null}
                  {c.scene && SCENE_REASON[c.scene] ? (
                    <Text style={styles.cardWhy}>
                      <Text style={styles.cardWhyTag}>{t('받는 유물')} · </Text>
                      {t(SCENE_REASON[c.scene])}
                    </Text>
                  ) : null}
                  {HALL_BY_ID[c.id] ? (() => {
                    const pc = hallPercent(clearsOf(playLog, attempts, c.id));
                    return (
                      <View style={styles.hallRow} testID={'card-hall-' + c.id}>
                        <Text style={[styles.hallTag, { color: HALL_BY_ID[c.id].color }]}>{t(HALL_BY_ID[c.id].name)} {pc}%</Text>
                        <View style={styles.hallBar}><View style={[styles.hallBarIn, { width: pc + '%', backgroundColor: HALL_BY_ID[c.id].color }]} /></View>
                      </View>
                    );
                  })() : null}
                </View>
              </View>
            </Frame>
          </Pressable>
        ))}
      </View>


      <RelicHome navigation={navigation} />

      {/* 숫자로 보는 잇결 — 판·자료·언어·예시 작품. 판을 먼저 보여 준 뒤 아래에 둔다(정리 2026-10-26). */}
      <HomeNumbers attempts={attempts} exhibit={exhibit} onGallery={() => navigation.navigate('Gallery')} onResult={() => navigation.navigate('Museum')} onHall={() => navigation.navigate('Exhibit')} />

      {/* 이 앱이 왜 만들어졌는지 — 마스코트의 말이 아니라 만든 사람의 실제 이력으로
          직접 말한다. 국악(사물놀이·풍물) 전공, 인천에서 10년 넘게 운영한 국악연구소,
          2015년에 직접 쓴 전래놀이 교육 교재 — 이 세 가지 장면은 그 경험에서 나왔다. */}
      <Frame tone="dark" style={{ marginTop: 18 }}>
        <Text style={styles.makerLabel}>{t('만든 사람')}</Text>
        <Text style={styles.makerText}>
          {t('사물놀이·풍물을 전공하고, 인천에서 10년 넘게 국악연구소를 운영하며 아이들에게 국악과 전래놀이를 가르쳤습니다. 2015년에는 전래놀이 교육 교재를 직접 써서 강사들을 교육하기도 했어요. 이 앱의 진법과 전래놀이 열두 가지는 그 현장 경험을 그대로 옮긴 것입니다.')}
        </Text>
      </Frame>

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <DancheongBand width={320} height={12} />
      </View>

      <View style={styles.exploreRow}>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Book', { part: 'prologue', then: 'Home' }); }}>
          <SealIcon kind="book" letter="책" size={48} tilt={false} />
          <Text style={styles.exploreTxt}>{t('그림책 다시 읽기')}</Text>
        </Pressable>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Archive'); }}>
          <SealIcon kind="jar" letter="보" size={48} tilt={false} />
          <Text style={styles.exploreTxt}>{t('전통 자료실')}</Text>
        </Pressable>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Exhibit'); }}>
          <SealIcon kind="frame" letter="전" size={48} tilt={false} />
          <Text style={styles.exploreTxt}>{t('잇결 전시관')}</Text>
        </Pressable>
        <Pressable style={styles.exploreBtn} onPress={() => { play('tap'); navigation.navigate('Kiosk'); }}>
          <SealIcon kind="phone" letter="폰" size={48} tilt={false} />
          <Text style={styles.exploreTxt}>{t('내 폰으로 하기 QR')}</Text>
        </Pressable>
      </View>

      {/* [체험 확장 근거] "다른 방향의 체험도 할 수 있다"는 말만으로는 근거가 안 되므로,
          지금 세 판을 만든 같은 방식(전통 소재 → 공통 설계 질문 → 난이도 단계)을 다음에
          무엇에 적용할지 구체적으로 보여준다. */}
      {/* 2026-11-22: 준비 중인 판이 없으면(여섯 판 모두 열림) 빈 「다음 체험」 칸을 보이지 않는다 */}
      {CARDS.some((c) => !c.ready) ? (<>
      <View style={styles.roadmapHeader}>
        <Text style={styles.roadmapTitle}>{t('다음 체험, 준비 중')}</Text>
        <Text style={styles.roadmapHint}>
          {t('진법·훈민정음·전래놀이를 만든 같은 방식 — 전통 소재에서 공통된 설계 질문을 뽑아내고, 난이도 단계를 나누어 직접 해보게 만드는 방식 — 을 다른 전통 영역에도 그대로 넓힐 수 있어요. 아래 두 가지가 다음 후보입니다.')}
        </Text>
      </View>
      <View style={styles.list}>
        {CARDS.filter((c) => !c.ready).map((c) => (
          <View key={c.id} style={styles.cardDisabled}>
            <Frame accent={c.accent} style={styles.cardFrame}>
              <View style={styles.cardRow}>
                <SealIcon kind={(SEAL[c.id] || [])[0]} letter={(SEAL[c.id] || [null, '전'])[1]} size={64} bg={c.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardEyebrow, { color: c.accent }]}>{t(c.eyebrow)}</Text>
                  <Text style={styles.cardTitle}>{t(c.title)}</Text>
                  <Text style={styles.cardDesc}>{t(c.desc)}</Text>
                  <Text style={styles.soon}>{t('준비 중')}</Text>
                </View>
              </View>
            </Frame>
          </View>
        ))}
      </View>
      </>) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  carryTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  carryText: { fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 },
  kioskRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kioskQr: { padding: 6, backgroundColor: '#ffffff', borderRadius: 3 },
  exploreRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 4, marginBottom: 10, flexWrap: 'wrap' },
  exploreBtn: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4, borderWidth: 1.5, borderBottomWidth: 3, borderColor: colors.ink, backgroundColor: colors.paper },
  exploreIcon: { fontSize: 24, color: colors.accent, lineHeight: 28, width: 26, textAlign: 'center' },
  exploreTxt: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink, lineHeight: 18 },
  matRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionLabel: { marginTop: 22, fontSize: 13.5, fontWeight: '800', color: colors.ink, letterSpacing: 0.5 },
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
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4, wordBreak: 'keep-all' },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
  cardWhy: { fontSize: 13, color: colors.ink, marginTop: 5, lineHeight: 19 },
  cardWhyTag: { fontWeight: '800', color: '#8a6a3b' },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  hallTag: { fontSize: 12, fontWeight: '800', minWidth: 96 },
  hallBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#e6dccb', overflow: 'hidden' },
  hallBarIn: { height: 6, borderRadius: 3 },
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
  list: { marginTop: 10, gap: 14 },
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
