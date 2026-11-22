// 합체 전시관 — 박물관 큰 화면·키오스크에 띄워 두는 화면. 이 기기에서 만든 합체 작품(없으면 예시 작품)의
// 영상이 차례로 계속 재생되고, 옆의 QR을 찍으면 내 폰에서 그 영상을 보거나 바로 만들기를 시작할 수 있다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SafeAreaView, useWindowDimensions, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Text from '../ui/Text';
import HapcheStage from '../components/HapcheStage';
import { t } from '../i18n';
import { usePieces, starterKeys } from '../utils/pieceStore';
import { buildTimeline, autoAssign, creditOf } from '../utils/hapche';
import { movieUrl } from '../utils/movieLink';
import { SITE_URL } from '../utils/carry';
import { PIECES } from '../data/pieces';

const DEMO_FRAMES = ['guardian', 'skyship', 'dragon', 'jet', 'suit', 'haechi', 'turtle', 'flower', 'train', 'fortress', 'rocket', 'submarine'];

function demoWorks() {
  return DEMO_FRAMES.map((id, i) => {
    const keys = starterKeys(300 + i * 13).concat(PIECES.filter((p, j) => j % 53 === (i * 7) % 53).map((p) => p.k));
    return { frameId: id, assign: autoAssign(id, keys), seed: 100 + i, demo: true };
  });
}

export default function HapcheWallScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const store = usePieces();
  const works = useMemo(() => {
    const mine = (store.works || []).map((w) => ({ frameId: w.frameId, assign: w.assign, layout: w.layout, seed: w.seed, title: w.title }));
    return mine.length >= 3 ? mine : [...mine, ...demoWorks()];
  }, [store]);
  const [i, setI] = useState(0);
  const w = works[i % works.length];
  const tl = useMemo(() => buildTimeline(w.frameId, w.assign || {}, { seed: w.seed, layout: w.layout, scene: '잇결', morphFrom: w.morphFrom }), [i, works]);
  const wide = width > height * 1.1;
  const size = Math.min(wide ? height - 60 : width - 24, wide ? width * 0.62 : 760);
  return (
    <SafeAreaView style={st.safe}>
      <View style={[st.wrap, { flexDirection: wide ? 'row' : 'column' }]}>
        <HapcheStage key={i} tl={tl} size={size} sound={false} onEnd={() => setTimeout(() => setI((x) => x + 1), 1500)} />
        <View style={[st.side, wide ? { width: Math.min(360, width - size - 60) } : { width: size }]}>
          <Text style={st.eyebrow}>{t('잇결 · 유물 합체 전시관')}</Text>
          <Text style={st.title} brush>
            {tl.title.full}
          </Text>
          <Text style={st.meta}>
            {t('작품 {a} / {b}', { a: (i % works.length) + 1, b: works.length })}
            {w.demo ? ' · ' + t('예시 작품') : ''}
          </Text>
          <View style={st.qrRow}>
            <View style={st.qrBox}>
              <QRCode value={movieUrl(w)} size={120} />
              <Text style={st.qrTxt}>{t('이 영상을 내 폰으로')}</Text>
            </View>
            <View style={st.qrBox}>
              <QRCode value={SITE_URL} size={120} />
              <Text style={st.qrTxt}>{t('나도 만들어 보기')}</Text>
            </View>
          </View>
          <Text style={st.credit}>{t('유물 사진') + ': ' + creditOf(tl.museums)}</Text>
          <Pressable onPress={() => navigation.goBack()} style={st.exit}>
            <Text style={st.exitTxt}>{t('전시관 닫기')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e151b' },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 12 },
  side: { gap: 10 },
  eyebrow: { color: '#e0a43a', fontSize: 14, fontWeight: '700' },
  title: { color: '#f6e7c4', fontSize: 26 },
  meta: { color: '#9fb0b8', fontSize: 13 },
  qrRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  qrBox: { backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', gap: 6 },
  qrTxt: { color: '#1b2227', fontSize: 12, fontWeight: '700' },
  credit: { color: '#6f8088', fontSize: 11, marginTop: 6 },
  exit: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#ffffff33' },
  exitTxt: { color: '#9fb0b8', fontSize: 12 },
});
