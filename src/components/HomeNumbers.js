import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import { colors, fonts } from '../theme';
import { MOCK_WORKS } from '../data/mockWorks';
import { ARCHIVE } from '../data/archive';
import { PLAY_GAMES } from '../data/playGames';
import { CATALOG } from './obj3d/catalog';
import { LANGS, t } from '../i18n';
import { play } from '../utils/sound';
import { countWorks } from '../utils/works';

// 홈 첫 화면 맨 위 — 글보다 숫자를 먼저 보여 준다.
// 숫자는 모두 앱 안의 실제 자료에서 센다(손으로 적은 숫자가 아님).
const BOARD_COUNT = 5; // 진법 · 훈민정음·인쇄 · 한글 테트리스 · 탈춤 · 단청 (전래놀이는 놀이 수로 따로 셈)
const SCENES = ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong'];
const BAR_COLORS = [colors.accent, colors.cheong, colors.hwang, colors.green, colors.gold];

export default function HomeNumbers({ attempts = [], exhibit = [], onGallery, onResult, onHall }) {
  const works = useMemo(() => countWorks(MOCK_WORKS), []);
  const { width } = useWindowDimensions();
  const basis = width >= 700 ? '22%' : '46%'; // 넓은 화면은 한 줄에 넷
  const rows = useMemo(() => {
    const label = Object.fromEntries(CATALOG.map((g) => [g.id, g.label]));
    return Object.entries(works.byGroup)
      .sort((a, b) => b[1] - a[1])
      .map(([id, n], i) => ({ id, n, label: label[id] || id, color: BAR_COLORS[i % BAR_COLORS.length] }));
  }, [works]);
  const max = rows.length ? rows[0].n : 1;
  const solved = SCENES.filter((id) => attempts.some((a) => a.sceneId === id)).length;

  const tiles = [
    { big: t('3~5분'), small: t('한 판에 걸리는 시간') },
    { big: t('{n}가지', { n: BOARD_COUNT + PLAY_GAMES.length }), small: t('놀이 (판 {b} + 전래놀이 {g})', { b: BOARD_COUNT, g: PLAY_GAMES.length }) },
    { big: t('{n}점', { n: ARCHIVE.length }), small: t('전통 자료') },
    { big: t('{n}개', { n: LANGS.filter((l) => l.ready).length }), small: t('언어') },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.tiles}>
        {tiles.map((x) => (
          <View key={x.small} style={[styles.tile, { flexBasis: basis }]}>
            <Text style={styles.big}>{x.big}</Text>
            <Text style={styles.small}>{x.small}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={() => { play('tap'); if (onGallery) onGallery(); }}>
        <Frame style={{ marginTop: 12 }}>
          <View style={styles.headRow}>
            <Text style={styles.headBig}>{t('예시 작품 {n}점', { n: works.total })}</Text>
            <Text style={styles.headSame}>{t('똑같은 작품 {n}점', { n: works.same })}</Text>
          </View>
          <Text style={styles.headSub}>{t('어떤 물건으로 가져갔나')}</Text>
          <View style={styles.bars}>
            {rows.map((r) => (
              <View key={r.id} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>{r.label}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(2, (r.n / max) * 100)}%`, backgroundColor: r.color }]} />
                </View>
                <Text style={styles.barNum}>{r.n}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>{t('놀이 기록이 다르면 모양과 색이 달라져요. 마음에 들면 내 작품도 전시될 수 있어요.')}</Text>
          <Text style={styles.more}>{t('예시 작품 둘러보기 ›')}</Text>
        </Frame>
      </Pressable>

      {solved > 0 || exhibit.length > 0 ? (
        <View style={styles.mine}>
          <Text style={styles.mineLabel}>{t('내 기록')}</Text>
          <Text style={styles.mineText}>
            {t('완성한 판 {s} / 4', { s: solved })}  ·  {t('전시 신청 {e}점', { e: exhibit.length })}
          </Text>
          {solved > 0 && onResult ? (
            <Pressable onPress={() => { play('tap'); onResult(); }} hitSlop={8}>
              <Text style={styles.more}>{t('내 결과물 보기 ›')}</Text>
            </Pressable>
          ) : null}
          {exhibit.length > 0 && onHall ? (
            <Pressable onPress={() => { play('tap'); onHall(); }} hitSlop={8}>
              <Text style={styles.more}>{t('전시관 ›')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: colors.ink,
    borderRadius: 4,
    backgroundColor: colors.paper,
  },
  big: { fontSize: 24, fontFamily: fonts.serifBold, color: colors.accent, lineHeight: 30 },
  small: { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 16 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  headBig: { fontSize: 17, fontFamily: fonts.serifBold, color: colors.ink },
  headSame: { fontSize: 13, fontWeight: '800', color: colors.accent },
  headSub: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  bars: { marginTop: 10, gap: 7 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 92, fontSize: 12, color: colors.ink, fontWeight: '700' },
  track: { flex: 1, height: 12, backgroundColor: colors.borderSoft, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  barNum: { width: 34, textAlign: 'right', fontSize: 12, color: colors.ink, fontWeight: '800' },
  note: { fontSize: 12, color: colors.ink, marginTop: 10, lineHeight: 18 },
  more: { fontSize: 12, color: colors.accent, fontWeight: '800', marginTop: 4 },
  mine: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  mineLabel: { fontSize: 11, fontWeight: '800', color: colors.baek, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, overflow: 'hidden' },
  mineText: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
});
