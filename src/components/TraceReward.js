import React from 'react';
import { View, StyleSheet, Image, Pressable, Linking } from 'react-native';
import Text from '../ui/Text';
import { Dialogue } from '../ui/StoryScene';
import { useJourney } from '../context/JourneyContext';
import { useNavigation } from '@react-navigation/native';
import { afterLines } from '../data/book';
import { colors } from '../theme';
import { PLAY_GAMES } from '../data/playGames';
import { museumPick } from '../data/museumPicks';
import { CATALOG_IMAGES } from '../data/catalogImages';
import { HALLS, HALL_BY_ID, HALL_LEVEL, HALL_ODDS, hallPercent, hallLevel, toNextLevel, clearsOf as clearsFrom } from '../data/halls';
import { t as i18nT } from '../i18n';

// 한 판을 마친 순간 — 조각보 대신 「그 판의 전시실로 갈 유물 보따리」를 바로 보여 준다 (2026-11-23)
// 판 = 전시실의 문. 다른 문제를 많이 풀수록 전시실이 작은 진열장 → 상설전 → 특별전으로 자라고 귀한 유물이 더 잘 나온다.
export default function TraceReward({ sceneId, success, gameId, gameName, onOpen, onLeave }) {
  const { playLog, attempts } = useJourney();
  const nav = useNavigation();
  const clearsOf = (id) => clearsFrom(playLog, attempts, id);
  // 다음으로 채울 전시실 — 지금 판 말고 완성도가 가장 낮은 곳
  const nextHall = HALLS.filter((h) => h.id !== sceneId).sort((a, b) => clearsOf(a.id) - clearsOf(b.id))[0];
  let topGameName = null;
  if (sceneId === 'tbd' && playLog && playLog.byGame) {
    const top = Object.entries(playLog.byGame).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) topGameName = (PLAY_GAMES.find((g) => g.id === top[0]) || {}).name || null;
  }
  const talk = afterLines({ sceneId, gameId, success, playLog, gameName, topGameName });
  if (!success) return <Dialogue lines={talk} style={{ marginTop: 4 }} />;
  const hall = HALL_BY_ID[sceneId];
  const clears = Math.max(1, clearsOf(sceneId));
  const pct = hallPercent(clears);
  const lv = Math.max(1, hallLevel(clears));
  const odds = HALL_ODDS[lv];
  const step = toNextLevel(clears);
  return (
    <View style={styles.wrap}>
      {hall ? (
        <Pressable onPress={onOpen} disabled={!onOpen} accessibilityRole="button" testID="open-bundle" style={[styles.hero, { borderColor: hall.color }]}>
          <View style={[styles.seal, { backgroundColor: hall.color }]}>
            <Text style={styles.sealTxt}>{hall.mark}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.kicker, { color: hall.color }]}>{i18nT('{a} · {b}', { a: i18nT(hall.name), b: i18nT(HALL_LEVEL[lv]) })}</Text>
            <Text style={styles.heroTitle}>{i18nT('보따리에 진짜 유물 {n}점이 들었어요', { n: odds.n })}</Text>
            <Text style={styles.heroSub}>{i18nT(hall.sub)} · {i18nT('귀함 이상 {p}%', { p: odds.up })}</Text>
          </View>
          {onOpen ? <Text style={[styles.heroGo, { backgroundColor: hall.color }]}>{i18nT('풀기')}</Text> : null}
        </Pressable>
      ) : null}
      {hall ? (
        <View style={styles.pctRow} testID="hall-percent">
          <Text style={[styles.pctBig, { color: hall.color }]}>{pct}%</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pctTxt}>{i18nT('{a} 완성도 — 한 판에 +{s}%', { a: i18nT(hall.name), s: 20 })}</Text>
            <View style={styles.steps}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.stepBar, { backgroundColor: i * 20 <= pct ? hall.color : colors.border }]} />
              ))}
            </View>
          </View>
        </View>
      ) : null}
      <Text style={styles.stepHint}>
        {step
          ? i18nT('{n}판 더 깨면 「{a}」 — 귀한 유물이 더 잘 나와요.', { n: step.need, a: i18nT(HALL_LEVEL[step.next]) })
          : i18nT('「특별전」까지 열었어요! 가장 귀한 유물이 잘 나와요.')}
      </Text>
      {nextHall && (pct >= 100 || clearsOf(nextHall.id) === 0) ? (
        <Pressable
          testID="next-hall"
          accessibilityRole="button"
          onPress={() => { if (onLeave) onLeave(); nav.navigate(nextHall.route); }}
          style={[styles.nextHall, { borderColor: nextHall.color }]}
        >
          <Text style={[styles.nextHallMark, { color: nextHall.color }]}>{hallPercent(clearsOf(nextHall.id)) ? nextHall.mark : '🔒'}</Text>
          <Text style={styles.nextHallTxt}>
            {pct >= 100
              ? i18nT('{a}은 다 찼어요! 다음 전시실 {b} {p}% — {c} 판으로', { a: i18nT(hall.name), b: i18nT(nextHall.name), p: hallPercent(clearsOf(nextHall.id)), c: i18nT(nextHall.scene) })
              : i18nT('아직 닫힌 전시실 {b} — {c} 판을 깨면 문이 열려요', { b: i18nT(nextHall.name), c: i18nT(nextHall.scene) })}
          </Text>
          <Text style={[styles.nextHallGo, { color: nextHall.color }]}>›</Text>
        </Pressable>
      ) : null}
      <MuseumPick pick={museumPick(sceneId, gameId)} />
      <Dialogue lines={talk} />
    </View>
  );
}

// 국립중앙박물관에서 만나요 — 놀이와 이어지는 소장품 하나
function MuseumPick({ pick }) {
  if (!pick) return null;
  const img = pick.img && CATALOG_IMAGES[pick.img];
  const body = (
    <View style={styles.museum}>
      {img ? <Image source={img} style={styles.museumImg} resizeMode="cover" /> : <View style={[styles.museumImg, styles.museumIcon]}><Text style={styles.museumIconTxt}>🏛</Text></View>}
      <View style={styles.museumTxt}>
        <Text style={styles.museumKicker}>{i18nT('국립중앙박물관에서 만나요')}</Text>
        <Text style={styles.museumName}>{i18nT(pick.name)}{pick.era ? ` · ${i18nT(pick.era)}` : ''}</Text>
        <Text style={styles.whyLine}>{i18nT(pick.note)}</Text>
        {pick.link ? <Text style={styles.museumLink}>{i18nT('e뮤지엄에서 자세히 보기 ↗')}</Text> : null}
      </View>
    </View>
  );
  return pick.link ? (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(pick.link).catch(() => {})}>{body}</Pressable>
  ) : body;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 2, backgroundColor: colors.paper, marginTop: 4 },
  seal: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  sealTxt: { fontSize: 26, color: '#fff', fontWeight: '800' },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  heroSub: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  heroGo: { color: '#fff', fontWeight: '800', fontSize: 15, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, overflow: 'hidden' },
  nextHall: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 10, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: colors.paper },
  nextHallMark: { fontSize: 22, fontWeight: '800', width: 30, textAlign: 'center' },
  nextHallTxt: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink, lineHeight: 19 },
  nextHallGo: { fontSize: 24, fontWeight: '800' },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  pctBig: { fontSize: 30, fontWeight: '800', minWidth: 78, textAlign: 'right' },
  pctTxt: { fontSize: 12, color: colors.ink, fontWeight: '700' },
  steps: { flexDirection: 'row', gap: 4, marginTop: 6 },
  stepBar: { flex: 1, height: 8, borderRadius: 4 },
  stepHint: { fontSize: 12, color: colors.ink, marginTop: 6, lineHeight: 17, textAlign: 'center' },
  museum: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.paper },
  museumImg: { width: 64, height: 64, borderRadius: 6, backgroundColor: colors.bg },
  museumIcon: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  museumIconTxt: { fontSize: 28 },
  museumTxt: { flex: 1, minWidth: 0, gap: 2 },
  museumKicker: { fontSize: 11, fontWeight: '800', color: colors.accentDeep, letterSpacing: 1 },
  museumName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  museumLink: { fontSize: 12, fontWeight: '700', color: colors.accent, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  col: { alignItems: 'center', gap: 5 },
  plus: { fontSize: 20, color: colors.accent, fontWeight: '700' },
  why: {
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    gap: 4,
  },
  whyTitle: { fontSize: 12, fontWeight: '800', color: colors.accent },
  whyLine: { fontSize: 11.5, color: colors.ink, lineHeight: 17 },
  gaugeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  cap: { fontSize: 11.5, color: colors.muted },
});
