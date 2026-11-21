// 홈 맨 위 — 새 장르 「유물 합체」 입구. 실제 유물 조각이 날아와 합체하는 장면이 계속 돌아간다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import SealButton from '../ui/SealButton';
import HapcheStage from './HapcheStage';
import { colors } from '../theme';
import { t } from '../i18n';
import { buildTimeline, autoAssign } from '../utils/hapche';
import { starterKeys, usePieces, dailyState } from '../utils/pieceStore';
import { PIECES } from '../data/pieces';
import { FRAMES, TRANSFORMS } from '../data/frames';

// 자동 테스트에서는 홈의 합체 장면을 멈춰 둔다(다른 테스트가 느려지지 않게) — 사람이 볼 때는 계속 돈다
const STILL = typeof navigator !== 'undefined' && !!navigator.webdriver;
const DEMO = ['guardian', 'skyship', 'dragon', 'jet', 'suit', 'flower', 'turtle', 'haechi'];

export default function HapcheHome({ navigation }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const [i, setI] = useState(() => Math.floor(Math.random() * DEMO.length));
  const owned = Object.keys(store.owned || {}).length;
  const tl = useMemo(() => {
    const id = DEMO[i % DEMO.length];
    const keys = starterKeys(1000 + i * 7).concat(PIECES.filter((p, j) => j % 97 === i % 97).map((p) => p.k));
    return buildTimeline(id, autoAssign(id, keys), { seed: 11 + i, scene: '잇결' });
  }, [i]);
  const size = Math.min(width - 64, 420);
  return (
    <Frame accent="#e0a43a" style={{ marginTop: 16 }}>
      <Text style={st.eyebrow}>{t('새 장르 · 유물 합체')}</Text>
      <Text style={st.title}>{t('진짜 유물 조각을 모아, 합체하고, 변신시켜요')}</Text>
      <Text style={st.desc}>
        {t('놀이를 마치면 박물관 유물 조각 보따리를 받아요. 조각마다 머리·날개·바퀴 같은 자리가 있어서, 합체 틀 {a}가지와 변형 {b}가지로 나만의 작품을 만들고 자막이 붙은 영상으로 남겨요.', {
          a: FRAMES.length,
          b: TRANSFORMS.length,
        })}
      </Text>
      <View style={{ marginTop: 10 }}>
        <HapcheStage tl={tl} size={size} sound={false} autoPlay={!STILL} onEnd={() => setI((x) => x + 1)} />
      </View>
      <Text style={st.count}>{t('조각 {n}점 · 내가 모은 조각 {m}점', { n: PIECES.length, m: owned })}</Text>
      <View style={st.btns}>
        {owned && dailyState().ready ? (
          <SealButton label={t('오늘의 보따리 받기 — {n}일째', { n: dailyState().nextStreak })} onPress={() => navigation.navigate('Pack', { daily: true })} />
        ) : !owned ? (
          <SealButton label={t('첫 보따리 받기')} onPress={() => navigation.navigate('Pack')} />
        ) : (
          <Text style={st.count}>{t('오늘의 보따리는 받았어요 · {n}일째 이어서', { n: dailyState().streak })}</Text>
        )}
        <View style={st.row}>
          <SealButton style={{ flex: 1 }} label={t('합체 작업대')} variant="ink" onPress={() => navigation.navigate('Workshop')} />
          <SealButton style={{ flex: 1 }} label={t('조각 도감')} variant="paper" onPress={() => navigation.navigate('Dex')} />
        </View>
      </View>
    </Frame>
  );
}

const st = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '700', color: '#b9781a' },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 2 },
  desc: { fontSize: 14, color: colors.ink, marginTop: 6, lineHeight: 21 },
  count: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
  btns: { gap: 8, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8 },
});
