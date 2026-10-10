import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import Text from './Text';
import Frame from './Frame';
import SealButton from './SealButton';
import { CloudBand } from './Motifs';
import StoryScene from './StoryScene';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { t as i18nT } from '../i18n';

// ── 시간 설정 ─────────────────────────────────────────────
// 예전에는 판마다 7~16초라 읽고 이해하기도 전에 끝났다. 이제 기본 시간을 3배로 늘리고,
// 원하면 시간 제한 없이 천천히 해볼 수 있다. 판 안에서는 useTime()으로 읽는다.
export const TIME_SCALE = 3;
const TimeContext = createContext({ timed: true, scaleMs: (ms) => ms * TIME_SCALE, scaleSec: (s) => s * TIME_SCALE });

export function useTime() {
  return useContext(TimeContext);
}

function makeTime(timed) {
  return {
    timed,
    // 시간 제한이 없으면 사실상 끝나지 않는 큰 값을 돌려준다.
    scaleMs: (ms) => (timed ? ms * TIME_SCALE : 60 * 60 * 1000),
    scaleSec: (s) => (timed ? s * TIME_SCALE : 60 * 60),
  };
}

// ── 미션 안내 카드 ───────────────────────────────────────
// 한 판을 시작하기 전에 "이야기 한 줄 → 해야 할 일 한 줄 → 하는 방법 → 완성 예시"를 보여 준다.
// info = { kicker, title, story, mission, steps: [string], example: node, tip }
export function MissionCard({ info, onStart, onStartFree, startLabel }) {
  useEffect(() => {
    play('drum');
  }, []);
  return (
    <Frame style={styles.card}>
      {info.scene ? <StoryScene scene={info.scene} lines={info.lines} style={{ marginBottom: 12 }} /> : null}
      <Text style={styles.kicker}>{i18nT(info.kicker)}</Text>
      <Text brush style={styles.title}>
        {i18nT(info.title)}
      </Text>
      <View style={styles.cloud}>
        <CloudBand width={200} color={colors.accent} />
      </View>
      {info.story ? <Text style={styles.story}>{i18nT(info.story)}</Text> : null}
      <View style={styles.missionBox}>
        <Text style={styles.missionLabel}>{t('이번 미션')}</Text>
        <Text style={styles.mission}>{i18nT(info.mission)}</Text>
      </View>
      {info.example ? (
        <View style={styles.exampleWrap}>
          <Text style={styles.exampleLabel}>{t('완성하면 이렇게 돼요')}</Text>
          <View style={styles.example}>{info.example}</View>
        </View>
      ) : null}
      {info.steps && info.steps.length ? (
        <View style={styles.steps}>
          {info.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{i18nT(s)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {info.tip ? <Text style={styles.tip}>{i18nT(info.tip)}</Text> : null}
      <View style={styles.btns}>
        <SealButton label={startLabel || t('시작하기')} onPress={onStart} />
        <Pressable onPress={onStartFree} hitSlop={8} style={styles.free}>
          <Text style={styles.freeText}>{t('시간 제한 없이 천천히 해볼래요')}</Text>
        </Pressable>
      </View>
    </Frame>
  );
}

// ── 게이트 ────────────────────────────────────────────────
// 판(children)을 감싼다. 시작 버튼을 누르기 전에는 미션 카드만 보이고,
// resetKey가 바뀌면(다른 판으로 옮기면) 다시 미션 카드부터 보여 준다.
export default function MissionGate({ info, resetKey, children, startLabel, onModeSelect }) {
  const [mode, setMode] = useState(null); // null | 'timed' | 'free'
  useEffect(() => {
    setMode(null);
  }, [resetKey]);
  if (!mode) {
    return (
      <ScrollView contentContainerStyle={styles.gateScroll} showsVerticalScrollIndicator={false}>
        <MissionCard
          info={info}
          startLabel={startLabel}
          onStart={() => {
            setMode('timed');
            if (onModeSelect) onModeSelect('timed');
          }}
          onStartFree={() => {
            setMode('free');
            if (onModeSelect) onModeSelect('free');
          }}
        />
      </ScrollView>
    );
  }
  return <TimeContext.Provider value={makeTime(mode === 'timed')}>{children}</TimeContext.Provider>;
}

const styles = StyleSheet.create({
  gateScroll: { paddingBottom: 24 },
  card: { marginTop: 6 },
  kicker: { fontSize: 12, color: colors.accent, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  title: { fontSize: 38, color: colors.ink, textAlign: 'center', marginTop: 2, lineHeight: 46 },
  cloud: { alignItems: 'center', marginTop: 2, marginBottom: 6 },
  story: { fontSize: 14, color: colors.muted, lineHeight: 22, textAlign: 'center', marginBottom: 10 },
  missionBox: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  missionLabel: { fontSize: 11, color: colors.accentDeep, fontWeight: '700', letterSpacing: 2 },
  mission: { fontSize: 18, color: colors.ink, fontWeight: '700', lineHeight: 26, marginTop: 2 },
  exampleWrap: { alignItems: 'center', marginBottom: 10 },
  exampleLabel: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  example: { alignItems: 'center', justifyContent: 'center' },
  steps: { gap: 8, marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNo: {
    width: 24,
    height: 24,
    borderRadius: 3,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNoText: { color: colors.bg, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 22 },
  tip: { fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 10 },
  btns: { gap: 10, marginTop: 4 },
  free: { alignItems: 'center', paddingVertical: 6 },
  freeText: { fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
});
