// 나의 박물관 — 놀이로 모은 진짜 유물을 진열장에 전시한다. 이름표에는 그 유물에 담긴 뜻.
// 유물을 누르면 「물건 만들기」에서 그 유물의 쓰임·무늬로 오늘의 물건을 고른다.
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image, Pressable, Linking, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import WhyBox from '../ui/WhyBox';
import Vitrine from '../components/Vitrine';
import { t } from '../i18n';
import { usePieces, removeCraft } from '../utils/pieceStore';
import { PIECE_BY_K, RARITY } from '../data/pieces';
import { HALLS, STORAGE, HALL_LEVEL, groupByHall, hallTotals, hallIdOf, hallPercent, hallLevel, clearsOf as clearsFrom } from '../data/halls';
import { useJourney } from '../context/JourneyContext';
import { MEANING, MOTIF } from '../data/pieceMeaning';
import { CRAFT_SHOTS, relicPage } from '../data/craftShots';
import { pieceName } from '../utils/pieceName';

// 이름표 한 줄 — 무늬·모양의 뜻이 있으면 그것을, 없으면 종류의 뜻
export function labelLine(k) {
  const w = (MEANING[k] && MEANING[k].w) || [];
  const pick = w.find((id) => !id.startsWith('t_')) || w[0];
  return pick && MOTIF[pick] ? t(MOTIF[pick].m) : '';
}

// 쓰임 한 줄 — 종류(t_)의 뜻
function useLine(k) {
  const w = (MEANING[k] && MEANING[k].w) || [];
  const id = w.find((x) => x.startsWith('t_'));
  return id && MOTIF[id] ? t(MOTIF[id].m) : '';
}

const RARE_COLOR = ['#c8c0ae', '#e0a43a', '#c0392b'];

// 유물 크게 보기 — 화면 가득 유물 하나, 이름표와 쓰임·무늬의 뜻을 천천히 읽는다. ‹ › 로 같은 전시실 유물을 넘긴다.
function Lightbox({ list, at, onAt, onClose, onCraft, color }) {
  const { width, height } = useWindowDimensions();
  const k = list[at];
  const p = PIECE_BY_K[k];
  if (!p) return null;
  const big = Math.min(width * 0.8, height * 0.5, 520);
  const mean = labelLine(k);
  const use = useLine(k);
  return (
    <View style={st.lb} testID="lightbox">
      <Pressable style={st.lbClose} onPress={onClose} accessibilityLabel={t('닫기')} testID="lightbox-close"><Text style={st.lbX}>✕</Text></Pressable>
      <View style={[st.lbStage, { height: big + 40 }]}>
        <View style={[st.lbGlow, { width: big * 1.12, height: big * 1.12, borderRadius: big }]} />
        <Image source={p.img} style={{ width: big, height: big }} resizeMode="contain" />
      </View>
      <View style={st.lbLabel}>
        <Text style={[st.lbRare, { color: RARE_COLOR[p.rare] }]}>{t(RARITY[p.rare])}</Text>
        <Text style={st.lbName}>{pieceName(p)}</Text>
        <Text style={st.lbMeta}>{[t(p.era), t(p.by)].filter(Boolean).join(' · ')}</Text>
        {use ? <Text style={st.lbLine}>{use}</Text> : null}
        {mean && mean !== use ? <Text style={[st.lbLine, { color: '#f0d9a8' }]}>{mean}</Text> : null}
        <View style={st.lbBtns}>
          <Pressable onPress={() => onAt((at - 1 + list.length) % list.length)} style={st.lbNav} accessibilityLabel={t('앞 유물')}><Text style={st.lbNavT}>‹</Text></Pressable>
          <Text style={st.lbCount}>{at + 1} / {list.length}</Text>
          <Pressable onPress={() => onAt((at + 1) % list.length)} style={st.lbNav} accessibilityLabel={t('다음 유물')} testID="lightbox-next"><Text style={st.lbNavT}>›</Text></Pressable>
        </View>
        <View style={st.lbBtns}>
          <SealButton small label={t('이 유물로 오늘의 물건 만들기')} onPress={() => onCraft(k)} />
          {p.page ? <SealButton small variant="paper" label={t('박물관 원본 ↗')} onPress={() => Linking.openURL(p.page).catch(() => {})} /> : null}
        </View>
      </View>
    </View>
  );
}

export default function MuseumScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const { playLog, attempts } = useJourney();
  const clearsOf = (id) => clearsFrom(playLog, attempts, id);
  const keys = useMemo(() => (store.order || []).filter((k) => PIECE_BY_K[k]), [store]);
  const groups = useMemo(() => groupByHall(keys), [keys]);
  const totals = hallTotals();
  const want = route && route.params && route.params.hall;
  const first = want || (keys.length ? hallIdOf(keys[0]) : 'jinbeop');
  const [sel, setSel] = useState(first);
  useEffect(() => { if (want) setSel(want); }, [want]);
  const [n, setN] = useState(24);
  const [box, setBox] = useState(null); // 크게 보는 유물 순번
  const col = width > 760 ? 4 : width > 520 ? 3 : 2;
  const size = Math.floor((Math.min(width, 1100) - 32 - (col - 1) * 12) / col);
  const crafts = (store.crafts || []).filter((c) => PIECE_BY_K[c.k]);
  const all = [...HALLS, STORAGE];
  const hall = all.find((h) => h.id === sel) || HALLS[0];
  const mine = groups[hall.id] || [];
  const lv = hall.id === 'storage' ? 0 : hallLevel(clearsOf(hall.id));
  const pct = hall.id === 'storage' ? null : hallPercent(clearsOf(hall.id));
  const open = hall.id === 'storage' ? mine.length > 0 : lv > 0 || mine.length > 0;
  const tileW = width > 760 ? Math.floor((Math.min(width, 1100) - 32 - 6 * 8) / 7) : Math.floor((Math.min(width, 1100) - 32 - 3 * 8) / 4);
  const opened = HALLS.filter((h) => clearsOf(h.id) > 0 || (groups[h.id] || []).length > 0).length;
  const total = Math.round(HALLS.reduce((a, h) => a + hallPercent(clearsOf(h.id)), 0) / HALLS.length);
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('나의 박물관')} sub={t('박물관 완성도 {p}% · 열린 전시실 {a} / 6 · 진짜 유물 {n}점', { p: total, a: opened, n: keys.length })} onBack={() => navigation.goBack()} />
        <WhyBox text={t('여섯 놀이 판은 여섯 전시실의 문이에요. 판을 깨면 그 전시실에 놓을 진짜 유물이 보따리에 들고, 전시실 완성도가 20%씩 올라요. 작은 진열장 → 상설전 → 특별전(100%)으로 자랄수록 귀한 유물이 더 잘 나와요.')} />

        {/* 박물관 안내도 — 전시실 여섯 곳과 수장고 */}
        <Text style={st.h}>{t('박물관 안내도')}</Text>
        <View style={st.map} testID="hall-map">
          {all.map((h) => {
            const cnt = (groups[h.id] || []).length;
            const hl = h.id === 'storage' ? 0 : hallLevel(clearsOf(h.id));
            const isOpen = h.id === 'storage' ? cnt > 0 : hl > 0 || cnt > 0;
            const on = h.id === sel;
            return (
              <Pressable
                key={h.id}
                testID={'hall-' + h.id}
                onPress={() => { setSel(h.id); setN(24); }}
                style={[st.tile, { width: tileW, borderColor: on ? h.color : '#e3d9c6', backgroundColor: on ? h.color : '#fffaf0' }]}
              >
                <Text style={[st.tileMark, { color: on ? '#fff' : isOpen ? h.color : '#b9ae9c' }]}>{isOpen ? h.mark : '🔒'}</Text>
                <Text style={[st.tileName, on && { color: '#fff' }]} numberOfLines={1}>{t(h.name)}</Text>
                <Text style={[st.tileN, on && { color: '#fff' }]}>{h.id === 'storage' ? t('{n}점', { n: cnt }) : hallPercent(clearsOf(h.id)) + '%'}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 고른 전시실 */}
        <View style={[st.hallHead, { backgroundColor: hall.color, borderColor: lv >= 3 ? '#e0a43a' : hall.color }]} testID="hall-head">
          <Text style={st.hallMark}>{hall.mark}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.hallName}>{t(hall.name)}{hall.id !== 'storage' ? ' · ' + t(HALL_LEVEL[lv]) : ''}</Text>
            <Text style={st.hallSub}>{t(hall.sub)}</Text>
            {pct !== null ? <Text style={st.hallPct}>{t('완성도 {p}%', { p: pct })}</Text> : null}
            {pct !== null ? <View style={st.bar}><View style={[st.barIn, { width: Math.max(2, pct) + '%' }]} /></View> : null}
            <Text style={st.hallCnt}>{t('모은 유물 {a}점 / 이 전시실 유물 {b}점', { a: mine.length, b: totals[hall.id] })}</Text>
          </View>
        </View>
        {hall.route ? (
          <SealButton
            variant={open ? 'paper' : undefined}
            label={open ? t('{a} 판에서 유물 더 받기', { a: t(hall.scene) }) : t('{a} 판을 깨면 문이 열려요 — 하러 가기', { a: t(hall.scene) })}
            onPress={() => navigation.navigate(hall.route)}
          />
        ) : null}

        {open && !mine.length ? <Text style={st.closed}>{t('문이 열렸어요. 보따리를 풀면 이 전시실에 유물이 놓여요.')}</Text> : null}
        {open ? (
          <>
            <View style={st.grid} testID="museum-grid">
              {mine.slice(0, n).map((k, i) => (
                <Vitrine key={k} p={PIECE_BY_K[k]} size={size} line={labelLine(k)} testID={'vitrine-' + k} onPress={() => setBox(i)} />
              ))}
            </View>
            {mine.length > n ? <SealButton variant="paper" label={t('더 보기 ({n}점 남음)', { n: mine.length - n })} onPress={() => setN(n + 24)} /> : null}
          </>
        ) : (
          <View style={st.empty}>
            <Text style={st.closed}>{t('아직 문이 닫혀 있어요.')}</Text>
          </View>
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
        {attempts.length ? (
          <SealButton variant="paper" testID="goods-link" label={t('놀이 기록으로 굿즈 주문 · 전시 신청 ›')} onPress={() => navigation.navigate('Result')} />
        ) : null}
      </ScrollView>
      {box !== null && mine[box] ? (
        <Lightbox list={mine} at={box} onAt={setBox} onClose={() => setBox(null)} color={hall.color} onCraft={(k) => { setBox(null); navigation.navigate('Craft', { k }); }} />
      ) : null}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  map: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { borderWidth: 2, borderRadius: 12, paddingVertical: 8, alignItems: 'center', gap: 2 },
  tileMark: { fontSize: 24, fontWeight: '800' },
  tileName: { fontSize: 12, fontWeight: '800', color: '#1d1915' },
  tileN: { fontSize: 11, color: '#7a6f60' },
  hallHead: { flexDirection: 'row', gap: 14, alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 3, marginTop: 4 },
  hallMark: { fontSize: 46, color: '#fff', fontWeight: '800', width: 64, textAlign: 'center' },
  hallName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  hallSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  hallPct: { fontSize: 18, color: '#fff', fontWeight: '800', marginTop: 8 },
  hallCnt: { fontSize: 13, color: '#fff', fontWeight: '700', marginTop: 8 },
  bar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 6, overflow: 'hidden' },
  barIn: { height: 6, backgroundColor: '#fff' },
  closed: { fontSize: 15, color: '#7a6f60' },
  lb: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#14110e', alignItems: 'center', justifyContent: 'center', padding: 16 },
  lbClose: { position: 'absolute', top: 14, right: 14, padding: 10, zIndex: 2 },
  lbX: { fontSize: 24, color: '#e9e1d2' },
  lbStage: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  lbGlow: { position: 'absolute', backgroundColor: 'rgba(255,233,194,0.08)' },
  lbLabel: { maxWidth: 640, width: '100%', alignItems: 'center', gap: 6, marginTop: 8 },
  lbRare: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  lbName: { fontSize: 26, fontWeight: '800', color: '#fbf6ec', textAlign: 'center' },
  lbMeta: { fontSize: 14, color: '#bfb3a0' },
  lbLine: { fontSize: 16, color: '#e9e1d2', textAlign: 'center', lineHeight: 24 },
  lbBtns: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' },
  lbNav: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#5a5045', alignItems: 'center', justifyContent: 'center' },
  lbNavT: { fontSize: 26, color: '#e9e1d2', lineHeight: 30 },
  lbCount: { fontSize: 14, color: '#bfb3a0', minWidth: 60, textAlign: 'center' },
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
