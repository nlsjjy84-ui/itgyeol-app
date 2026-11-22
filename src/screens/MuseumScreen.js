// 나의 박물관 — 놀이로 모은 진짜 유물을 진열장에 전시한다. 이름표에는 그 유물에 담긴 뜻.
// 유물을 누르면 「물건 만들기」에서 그 유물의 쓰임·무늬로 오늘의 물건을 고른다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image, Pressable, Linking, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import WhyBox from '../ui/WhyBox';
import Vitrine from '../components/Vitrine';
import { t } from '../i18n';
import { usePieces, removeCraft } from '../utils/pieceStore';
import { PIECE_BY_K } from '../data/pieces';
import { MEANING, MOTIF } from '../data/pieceMeaning';
import { CRAFT_SHOTS, relicPage } from '../data/craftShots';
import { pieceName } from '../utils/pieceName';

// 이름표 한 줄 — 무늬·모양의 뜻이 있으면 그것을, 없으면 종류의 뜻
export function labelLine(k) {
  const w = (MEANING[k] && MEANING[k].w) || [];
  const pick = w.find((id) => !id.startsWith('t_')) || w[0];
  return pick && MOTIF[pick] ? MOTIF[pick].m : '';
}

export default function MuseumScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const keys = useMemo(() => (store.order || []).filter((k) => PIECE_BY_K[k]), [store]);
  const [n, setN] = useState(24);
  const col = width > 760 ? 4 : width > 520 ? 3 : 2;
  const size = Math.floor((Math.min(width, 1100) - 32 - (col - 1) * 12) / col);
  const crafts = (store.crafts || []).filter((c) => PIECE_BY_K[c.k]);
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('나의 박물관')} sub={t('놀이로 모은 진짜 유물 {n}점', { n: keys.length })} onBack={() => navigation.goBack()} />
        <WhyBox text={t('모은 유물을 목록이 아니라 박물관처럼 전시해 두고, 이름표에서 그 유물에 담긴 뜻을 읽는 곳이에요. 유물을 누르면 그 유물의 원래 쓰임과 무늬의 뜻에서 오늘 쓰는 물건을 만들어요.')} />

        {keys.length === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyTxt}>{t('아직 전시할 유물이 없어요. 놀이 판을 깨면 진짜 유물을 받아요.')}</Text>
            <SealButton label={t('놀이하러 가기')} onPress={() => navigation.navigate('Home')} />
          </View>
        ) : (
          <>
            <Text style={st.h}>{t('진열장')}</Text>
            <View style={st.grid} testID="museum-grid">
              {keys.slice(0, n).map((k) => (
                <Vitrine key={k} p={PIECE_BY_K[k]} size={size} line={labelLine(k)} testID={'vitrine-' + k} onPress={() => navigation.navigate('Craft', { k })} />
              ))}
            </View>
            {keys.length > n ? <SealButton variant="paper" label={t('더 보기 ({n}점 남음)', { n: keys.length - n })} onPress={() => setN(n + 24)} /> : null}
          </>
        )}

        {crafts.length ? (
          <>
            <Text style={st.h}>{t('내가 만든 물건')}</Text>
            <View style={st.crafts} testID="my-crafts">
              {crafts.map((c) => (
                <View key={c.k + c.to} style={st.craft}>
                  <Pressable onPress={() => navigation.navigate('Craft', { k: c.k })} style={st.craftIn}>
                    <Image source={PIECE_BY_K[c.k].img} style={st.craftImg} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={st.craftTo}>{t(c.to)}</Text>
                      <Text style={st.craftFrom} numberOfLines={1}>{pieceName(PIECE_BY_K[c.k])}</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeCraft(c.k, c.to)} accessibilityLabel={t('빼기')}>
                    <Text style={st.x}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={st.h}>{t('작업실 시제품')}</Text>
        <WhyBox text={t('국립중앙박물관이 공개한 유물 3D 스캔으로, 물건이 실제로 어떻게 보일지 실사로 만들어 본 사진이에요. 유물을 사진으로 오려 붙이지 않고 진짜 모양 그대로 조명 아래 놓았어요.')} />
        <View style={st.shots} testID="craft-shots">
          {CRAFT_SHOTS.map((s) => (
            <View key={s.id} style={[st.shot, { width: width > 760 ? (Math.min(width, 1100) - 32 - 12) / 2 : '100%' }]}>
              <Image source={s.img} style={st.shotImg} resizeMode="cover" />
              <View style={st.shotBody}>
                <Text style={st.shotTo}>{t(s.to)}</Text>
                <Text style={st.shotRelic}>{t(s.relic)}</Text>
                <Text style={st.shotWhy}>{t(s.why)}</Text>
                <Text style={st.link} onPress={() => Linking.openURL(relicPage(s.relicId))}>
                  {t('국립중앙박물관 원본 · 3D 데이터(공공누리)')} ↗
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { padding: 16, gap: 12, maxWidth: 1100, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  h: { fontSize: 18, fontWeight: '800', color: '#1d1915', marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { padding: 20, alignItems: 'center', gap: 12 },
  emptyTxt: { fontSize: 15, textAlign: 'center', color: '#3b3127' },
  crafts: { gap: 8 },
  craft: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 8, gap: 8, borderWidth: 1, borderColor: '#e6dccb' },
  craftIn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  craftImg: { width: 44, height: 44 },
  craftTo: { fontSize: 15, fontWeight: '800', color: '#1d1915' },
  craftFrom: { fontSize: 12, color: '#7a6f60' },
  x: { fontSize: 16, color: '#9a8f80', padding: 6 },
  shots: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shot: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e6dccb' },
  shotImg: { width: '100%', aspectRatio: 1 },
  shotBody: { padding: 12, gap: 4 },
  shotTo: { fontSize: 17, fontWeight: '800', color: '#1d1915' },
  shotRelic: { fontSize: 12, color: '#8a6a3b', fontWeight: '700' },
  shotWhy: { fontSize: 14, color: '#2a241c', lineHeight: 21 },
  link: { fontSize: 12, color: '#3f7a52', textDecorationLine: 'underline', marginTop: 4 },
});
