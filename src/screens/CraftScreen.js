// 물건 만들기 — 유물 하나의 「원래 쓰임 → 오늘의 쓰임」, 「무늬의 뜻 → 누구에게」를 이어 오늘의 물건을 고른다.
// 아무 유물에나 붙는 물건은 내지 않는다. 죽은 이를 모신 유물은 물건으로 바꾸지 않고 까닭을 알려 준다.
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image, Linking } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import WhyBox from '../ui/WhyBox';
import Vitrine from '../components/Vitrine';
import { t } from '../i18n';
import { usePieces, saveCraft } from '../utils/pieceStore';
import { PIECE_BY_K } from '../data/pieces';
import { MEANING, MOTIF } from '../data/pieceMeaning';
import { CRAFT_SHOTS } from '../data/craftShots';
import { craftIdeas } from '../utils/craft';
import { pieceName } from '../utils/pieceName';
import { labelLine } from './MuseumScreen';

// 「원래 쓰임」 줄과 겹치지 않게 — 「…이라, 」 앞(원래 쓰임 설명)은 떼고 오늘의 쓰임만 보인다
// 「원래 쓰임」은 이 물건의 까닭 앞부분(이 유물에 맞는 말)을 먼저 쓰고, 없으면 종류 설명의 첫 문장만 쓴다
const origPart = (why, typeM) => {
  const m = String(why).match(/^(.*?)(?:이라|라|여서|해서), /);
  if (m && m[1].length >= 6) return m[1];
  const first = String(typeM || '').split(/(?<=요\.)\s/)[0];
  return first;
};
const todayPart = (why) => {
  const m = String(why).match(/^(.*?(?:이라|라|여서|해서)), (.*)$/);
  return m ? m[2] : why;
};

export default function CraftScreen({ navigation, route }) {
  const k = route.params && route.params.k;
  const p = PIECE_BY_K[k];
  const store = usePieces();
  if (!p) {
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.wrap}>
          <ScreenHeader title={t('물건 만들기')} onBack={() => navigation.goBack()} />
          <Text>{t('유물을 찾지 못했어요.')}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  const r = craftIdeas(k);
  const w = (MEANING[k] && MEANING[k].w) || [];
  const saved = new Set((store.crafts || []).filter((c) => c.k === k).map((c) => c.to));
  const shots = CRAFT_SHOTS.filter((s) => s.k === k);
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('물건 만들기')} sub={pieceName(p)} onBack={() => navigation.goBack()} />
        <WhyBox text={t('유물은 원래 쓰임이 있고, 무늬와 모양에는 바라는 뜻이 있어요. 그 쓰임을 오늘의 물건으로 잇고, 그 뜻으로 누구에게 줄지 정해요. 그래서 물건마다 「왜 이 유물이 이 물건이 됐는지」가 함께 적혀 있어요.')} />
        <View style={st.top}>
          <Vitrine p={p} size={190} line={labelLine(k)} />
          <View style={st.meanings} testID="craft-meanings">
            <Text style={st.h2}>{t('이 유물에 담긴 것')}</Text>
            {w.map((id) =>
              MOTIF[id] ? (
                <Text key={id} style={st.mean}>
                  <Text style={st.b}>{MOTIF[id].n}</Text> — {MOTIF[id].m}
                </Text>
              ) : null,
            )}
          </View>
        </View>

        {r.none ? (
          <View style={st.none} testID="craft-none">
            <Text style={st.noneTxt}>{t(r.none)}</Text>
          </View>
        ) : (
          <View style={st.list} testID="craft-ideas">
            {r.crafts.map((c) => (
              <View key={c.to} style={st.card}>
                <Text style={st.to}>{t(c.to)}</Text>
                <View style={st.step}>
                  <Text style={st.tag}>{t('원래 쓰임')}</Text>
                  <Text style={st.stepTxt}>{r.type ? t(origPart(c.why, r.type.m)) : t('박물관 사진 그대로')}</Text>
                </View>
                <View style={st.step}>
                  <Text style={[st.tag, st.tagTo]}>{t('오늘의 물건')}</Text>
                  <Text style={st.stepTxt}>{r.type ? todayPart(c.why) : c.why}</Text>
                </View>
                {c.gift ? (
                  <View style={st.step}>
                    <Text style={[st.tag, st.tagGift]}>{t('누구에게')}</Text>
                    <Text style={st.stepTxt}>
                      {t('「{m}」 무늬는 {why} — {who} 주기 좋아요.', { m: c.gift.motif.n, why: t(c.gift.why), who: t(c.gift.who) })}
                    </Text>
                  </View>
                ) : null}
                <SealButton
                  small
                  variant={saved.has(c.to) ? 'paper' : 'ink'}
                  label={saved.has(c.to) ? t('내 물건에 담았어요') : t('이 물건 내 박물관에 담기')}
                  onPress={() => saveCraft(k, c.to)}
                />
              </View>
            ))}
          </View>
        )}

        {shots.length ? (
          <>
            <Text style={st.h2}>{t('작업실 시제품 — 박물관 3D 스캔으로 만든 실사')}</Text>
            {shots.map((s) => (
              <View key={s.id} style={st.shot}>
                <Image source={s.img} style={st.shotImg} resizeMode="cover" />
                <View style={{ paddingHorizontal: 14, gap: 6 }}>
                  <Text style={st.to}>{t(s.to)}</Text>
                  <Text style={st.stepTxt}>{t(s.why)}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        <View style={{ gap: 8, marginTop: 8 }}>
          <SealButton variant="paper" label={t('박물관 원본 페이지 열기')} onPress={() => Linking.openURL(p.page)} />
          <SealButton variant="paper" label={t('나의 박물관으로')} onPress={() => navigation.navigate('Museum')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { padding: 16, gap: 12, maxWidth: 760, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' },
  meanings: { flex: 1, minWidth: 220, gap: 6 },
  h2: { fontSize: 16, fontWeight: '800', color: '#1d1915', marginTop: 4 },
  mean: { fontSize: 14, color: '#2a241c', lineHeight: 21 },
  b: { fontWeight: '800' },
  none: { backgroundColor: '#efe9df', borderRadius: 12, padding: 14 },
  noneTxt: { fontSize: 15, color: '#2a241c', lineHeight: 23 },
  list: { gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: '#e6dccb' },
  to: { fontSize: 19, fontWeight: '800', color: '#1d1915' },
  step: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tag: { fontSize: 11, fontWeight: '800', color: '#fff', backgroundColor: '#7a6f60', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden', minWidth: 62, textAlign: 'center' },
  tagTo: { backgroundColor: '#b9781a' },
  tagGift: { backgroundColor: '#3f7a52' },
  stepTxt: { flex: 1, fontSize: 14, color: '#2a241c', lineHeight: 21 },
  shot: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e6dccb', gap: 6, paddingBottom: 12 },
  shotImg: { width: '100%', aspectRatio: 1 },
});
