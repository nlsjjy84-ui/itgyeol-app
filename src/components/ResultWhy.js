import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import { PatchChip } from './Jogakbo';
import { useJourney } from '../context/JourneyContext';
import { SCENE_ORDER } from './Jogakbo';
import { SCENE_TARGET, LEVEL_NAME } from '../utils/progress';
import { explainPatch, explainWhole } from '../utils/explain';
import { colors } from '../theme';

const GOLD = '#c9a24b';

// 완성도 막대 — 눈금: 50%(꽃수) · 60%(금빛 테두리) · 100%(이중 테두리)
export function Gauge({ percent, height = 10 }) {
  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${Math.max(2, percent)}%`, height }]} />
        {[50, 60].map((t) => (
          <View key={t} style={[styles.tick, { left: `${t}%`, height }]} />
        ))}
      </View>
      <View style={styles.tickRow}>
        <Text style={[styles.tickLabel, { right: '50%', paddingRight: 3 }]}>꽃수 50%</Text>
        <Text style={[styles.tickLabel, { left: '60%', paddingLeft: 3 }]}>금테 60%</Text>
        <Text style={[styles.tickLabel, { right: 0 }]}>이중 금테 100%</Text>
      </View>
    </View>
  );
}

// "왜 이런 결과물이 나왔을까요?" — 조각보를 그릴 때 실제로 쓴 값만 풀어서 보여 준다.
export default function ResultWhy({ attempts, seed }) {
  const { progress } = useJourney();
  const by = Object.fromEntries((attempts || []).map((a) => [a.sceneId, a]));
  const patches = SCENE_ORDER.map((id) => by[id]).filter(Boolean);
  const whole = explainWhole(patches, seed, progress.percent);
  return (
    <View style={styles.box}>
      <Text style={styles.title}>왜 이런 결과물이 나왔을까요?</Text>

      <View style={styles.gaugeCard}>
        <View style={styles.gaugeHead}>
          <Text style={styles.gaugeTitle}>작품 완성도</Text>
          <Text style={styles.gaugePct}>{progress.percent}%</Text>
        </View>
        <Gauge percent={progress.percent} />
        {SCENE_ORDER.map((id) => {
          const t = SCENE_TARGET[id];
          const n = progress.counts[id] || 0;
          return (
            <View key={id} style={styles.sceneRow}>
              <Text style={styles.sceneName}>{t.name}</Text>
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: `${Math.min(100, (n / t.l3) * 100)}%` }]} />
              </View>
              <Text style={styles.sceneLevel}>{n}/{t.l3} · {LEVEL_NAME[progress.levels[id]]}</Text>
            </View>
          );
        })}
        <Text style={styles.note}>
          같은 판을 되풀이하는 것보다 서로 다른 문제를 풀수록 완성도가 올라가요. 판마다 풀어야 하는 문제 수가 달라서, 많이 푼 판의 조각부터 먼저 정교해져요.
        </Text>
      </View>

      {patches.length === 0 ? (
        <Text style={styles.empty}>판을 하나 풀면 그 조각이 왜 그런 모양인지 여기에 풀어 드릴게요.</Text>
      ) : (
        patches.map((a) => (
          <View key={a.sceneId} style={styles.patchCard}>
            <PatchChip attempt={a} size={60} level={Math.max(1, progress.levels[a.sceneId] || 1)} />
            <View style={styles.patchText}>
              {explainPatch(a, progress.counts[a.sceneId] || 1).map((r) => (
                <Text key={r.k} style={styles.line}>
                  <Text style={styles.key}>{r.k}  </Text>
                  {r.v}
                </Text>
              ))}
            </View>
          </View>
        ))
      )}

      <View style={styles.patchCard}>
        <View style={styles.patchText}>
          <Text style={[styles.key, { marginBottom: 2 }]}>조각보 전체</Text>
          {whole.map((r) => (
            <Text key={r.k} style={styles.line}>
              <Text style={styles.key}>{r.k}  </Text>
              {r.v}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', marginTop: 14, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: 1, marginBottom: 8 },
  gaugeCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  gaugeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  gaugeTitle: { fontSize: 13, fontWeight: '800', color: colors.ink },
  gaugePct: { fontSize: 20, fontWeight: '800', color: colors.accent },
  track: { width: '100%', backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  fill: { backgroundColor: GOLD, borderRadius: 6 },
  tick: { position: 'absolute', top: 0, width: 1.5, backgroundColor: colors.paper },
  tickRow: { height: 16, marginTop: 3 },
  tickLabel: { position: 'absolute', fontSize: 10, color: colors.muted },
  sceneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sceneName: { width: 86, fontSize: 11.5, color: colors.ink, fontWeight: '700' },
  miniTrack: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
  sceneLevel: { width: 118, fontSize: 10.5, color: colors.muted },
  note: { marginTop: 10, fontSize: 11.5, color: colors.muted, lineHeight: 17 },
  patchCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  patchText: { flex: 1, gap: 4 },
  line: { fontSize: 12, color: colors.ink, lineHeight: 18 },
  key: { fontSize: 12, fontWeight: '800', color: colors.accent },
  empty: { fontSize: 12, color: colors.muted, marginBottom: 8 },
});
