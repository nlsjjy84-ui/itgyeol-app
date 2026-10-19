import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import Jogakbo, { PatchChip } from './Jogakbo';
import { Dialogue } from '../ui/StoryScene';
import { useJourney } from '../context/JourneyContext';
import { afterLines } from '../data/book';
import { Gauge } from './ResultWhy';
import { explainPatch } from '../utils/explain';
import { SCENE_TARGET, LEVEL_NAME, nextHint } from '../utils/progress';
import { colors } from '../theme';
import { PLAY_GAMES } from '../data/playGames';
import { SCENE_ORDER, EXTRA_SCENES } from './Jogakbo';

// 조각보 칸 수 = 처음 네 판 + 나중에 더한 탈춤·단청 (예전에는 4로 나와 "1/4"처럼 보였다)
const TOTAL_PIECES = SCENE_ORDER.length + EXTRA_SCENES.length;
import { t as i18nT } from '../i18n';

const SCENE_NAME = { jinbeop: '진법', print: '인쇄', tbd: '놀이', hangul: '한글 테트리스', talchum: '탈춤', dancheong: '단청' };

// 한 판을 마친 순간 — 방금 생긴 조각, 지금까지 이어진 조각보, 풍이·결이의 반응을 보여 준다.
export default function TraceReward({ sceneId, success, gameId, gameName }) {
  const { attempts, progress, playLog } = useJourney();
  // 제일 자주 한 놀이(전래놀이만) — 판 뒤 한 줄에 쓰인다
  let topGameName = null;
  if (sceneId === 'tbd' && playLog && playLog.byGame) {
    const top = Object.entries(playLog.byGame).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) topGameName = (PLAY_GAMES.find((g) => g.id === top[0]) || {}).name || null;
  }
  const talk = afterLines({ sceneId, gameId, success, playLog, gameName, topGameName });
  if (!success) return <Dialogue lines={talk} style={{ marginTop: 4 }} />;
  const mine = attempts.find((a) => a.sceneId === sceneId);
  const n = new Set(attempts.map((a) => a.sceneId)).size;
  const cnt = (progress.counts && progress.counts[sceneId]) || 1;
  const lv = Math.max(1, (progress.levels && progress.levels[sceneId]) || 1);
  const why = mine ? explainPatch(mine, cnt) : null;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.col}>
          <PatchChip attempt={mine} size={64} level={lv} />
          <Text style={styles.cap}>{i18nT('방금 생긴')} {i18nT(SCENE_NAME[sceneId])} {i18nT('조각')}</Text>
        </View>
        <Text style={styles.plus}>→</Text>
        <View style={styles.col}>
          <Jogakbo attempts={attempts} size={104} />
          <Text style={styles.cap}>{i18nT('이어진 조각보 ·')} {i18nT(n)}/{i18nT(TOTAL_PIECES)}</Text>
        </View>
      </View>
      {why ? (
        <View style={styles.why}>
          <Text style={styles.whyTitle}>{i18nT('왜 이런 조각이 나왔을까요?')}</Text>
          <Text style={styles.whyLine}>{i18nT(why[0].v)}</Text>
          <Text style={styles.whyLine}>{i18nT(why[1].v)}</Text>
          <View style={styles.gaugeHead}>
            <Text style={styles.whyTitle}>{i18nT('작품 완성도')} {i18nT(progress.percent)}%</Text>
            <Text style={styles.cap}>{i18nT(SCENE_TARGET[sceneId].name)} · {i18nT(LEVEL_NAME[lv])}</Text>
          </View>
          <Gauge percent={progress.percent} height={8} />
          <Text style={styles.whyLine}>{nextHint(sceneId, cnt)}</Text>
        </View>
      ) : null}
      <Dialogue lines={talk} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 2 },
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
