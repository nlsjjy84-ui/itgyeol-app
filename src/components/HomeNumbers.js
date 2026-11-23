import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import { colors, fonts } from '../theme';
import { PIECES } from '../data/pieces';
import { PLAY_GAMES } from '../data/playGames';
import { LANGS, t } from '../i18n';
import { play } from '../utils/sound';

// 홈 첫 화면 맨 위 — 글보다 숫자를 먼저 보여 준다.
// 숫자는 모두 앱 안의 실제 자료에서 센다(손으로 적은 숫자가 아님).
const BOARD_COUNT = 5; // 진법 · 훈민정음·인쇄 · 한글 테트리스 · 탈춤 · 단청 (전래놀이는 놀이 수로 따로 셈)
const SCENES = ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong'];
const BAR_COLORS = [colors.accent, colors.cheong, colors.hwang, colors.green, colors.gold];

export default function HomeNumbers({ attempts = [], exhibit = [], onGallery, onResult, onHall }) {
  const { width } = useWindowDimensions();
  const basis = width >= 700 ? '22%' : '46%'; // 넓은 화면은 한 줄에 넷
  const solved = SCENES.filter((id) => attempts.some((a) => a.sceneId === id)).length;

  const tiles = [
    { big: t('3~5분'), small: t('한 판에 걸리는 시간') },
    { big: t('{n}판', { n: SCENES.length }), small: t('놀이 판 (전래놀이 판 안에 놀이 {g}가지)', { g: PLAY_GAMES.length }) },
    { big: t('{n}점', { n: PIECES.length.toLocaleString('ko-KR') }), small: t('놀이로 얻는 진짜 유물 (박물관 4곳)') },
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

      {/* 예시 작품 통계(옛 예시 450점)는 2026-11-22 새 설계도에 따라 뺐다 — 새 변형 예시로 다시 만든다 */}
      {solved > 0 || exhibit.length > 0 ? (
        <View style={styles.mine}>
          <Text style={styles.mineLabel}>{t('내 기록')}</Text>
          <Text style={styles.mineText}>
            {t('열린 전시실 {s} / {n}', { s: solved, n: SCENES.length })}  ·  {t('전시 신청 {e}점', { e: exhibit.length })}
          </Text>
          {solved > 0 && onResult ? (
            <Pressable onPress={() => { play('tap'); onResult(); }} hitSlop={8}>
              <Text style={styles.more}>{t('나의 박물관 ›')}</Text>
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
