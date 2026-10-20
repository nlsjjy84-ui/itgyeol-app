import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, Image, Modal, Linking, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import { ARCHIVE } from '../data/archive';
import { colors, fonts } from '../theme';
import { t, getLang } from '../i18n';
import { ARCHIVE_NAMES } from '../data/archiveNames';
import { play } from '../utils/sound';
import { MaterialTab, ObjectTab, ShopTab } from './MaterialScreen';
import { CATALOG_STATS } from '../data/catalog';

// 전통 자료실 — 창작의 바탕이 되는 실제 전통(유물·문양·재료)을 모아 둔 곳.
// 이름·시대·재료는 박물관 기록에서만 가져오고, 사진마다 출처와 이용 조건을 붙인다.
// 라벨은 [ko, en, zh, ja] 순서
const L4 = (a) => a[{ ko: 0, en: 1, zh: 2, ja: 3 }[getLang()] ?? 0] || a[1];
export const CATS = [
  { id: 'royal', n: ['왕실·장신구', 'Royal & adornment', '王室·饰品', '王室・装身具'] },
  { id: 'ceramic', n: ['도자기', 'Ceramics', '陶瓷', '陶磁器'] },
  { id: 'wood', n: ['목공예·나전', 'Woodwork & lacquer', '木工艺·螺钿', '木工芸・螺鈿'] },
  { id: 'textile', n: ['옷·자수·매듭', 'Textiles & knots', '服饰·刺绣·绳结', '衣服・刺繍・組みひも'] },
  { id: 'scholar', n: ['문방·그림', 'Scholar’s study & painting', '文房·绘画', '文房具・絵画'] },
  { id: 'music', n: ['소리·놀이', 'Music & play', '声音·游戏', '音・遊び'] },
  { id: 'buddhist', n: ['불교 유산', 'Buddhist heritage', '佛教遗产', '仏教遺産'] },
  { id: 'metal', n: ['금속 공예', 'Metalwork', '金属工艺', '金属工芸'] },
  { id: 'motif', n: ['문양', 'Motifs', '纹样', '文様'] },
  { id: 'architecture', n: ['건축', 'Architecture', '建筑', '建築'] },
];
const MAT = { 청자: ['청자', 'Celadon', '青瓷', '青磁'], 백자: ['백자', 'White porcelain', '白瓷', '白磁'], 분청사기: ['분청사기', 'Buncheong', '粉青沙器', '粉青沙器'], '나전(자개)': ['나전(자개)', 'Mother-of-pearl', '螺钿（贝壳）', '螺鈿（貝）'],
  옻칠: ['옻칠', 'Lacquer', '漆', '漆'], 금: ['금', 'Gold', '金', '金'], 은: ['은', 'Silver', '银', '銀'], 청동: ['청동', 'Bronze', '青铜', '青銅'], 놋쇠: ['놋쇠', 'Brass', '黄铜', '真鍮'], 옥: ['옥', 'Jade', '玉', '玉'],
  '비단·자수': ['비단·자수', 'Silk & embroidery', '丝绸·刺绣', '絹・刺繍'], 나무: ['나무', 'Wood', '木', '木'], 종이: ['종이', 'Paper', '纸', '紙'], 말총: ['말총', 'Horsehair', '马鬃', '馬の毛'], 돌: ['돌', 'Stone', '石', '石'], '흙(토기)': ['흙(토기)', 'Earthenware', '陶土', '土器'] };
const MOT = { 용: ['용', 'Dragon', '龙', '竜'], 봉황: ['봉황', 'Phoenix', '凤凰', '鳳凰'], 학: ['학', 'Crane', '鹤', '鶴'], 연꽃: ['연꽃', 'Lotus', '莲花', '蓮'], 구름: ['구름', 'Cloud', '云', '雲'], 모란: ['모란', 'Peony', '牡丹', '牡丹'],
  '매화·대나무': ['매화·대나무', 'Plum & bamboo', '梅·竹', '梅・竹'], 물고기: ['물고기', 'Fish', '鱼', '魚'], 호랑이: ['호랑이', 'Tiger', '老虎', 'トラ'], 거북: ['거북', 'Turtle', '龟', '亀'], 태극: ['태극', 'Taegeuk', '太极', '太極'], 새: ['새', 'Bird', '鸟', '鳥'] };
const LIC = { KOGL1: ['공공누리 제1유형', 'KOGL Type 1', '韩国公共许可第1类（KOGL）', '韓国公共ライセンス第1類（KOGL）'], CC0: ['CC0', 'CC0', 'CC0', 'CC0'], 'Public domain': ['퍼블릭 도메인', 'Public domain', '公有领域', 'パブリックドメイン'] };
const DES = { 국보: ['국보', 'National Treasure', '国宝', '国宝'], 보물: ['보물', 'Treasure', '宝物', '宝物'], 국가민속문화유산: ['국가민속문화유산', 'National Folklore Heritage', '国家民俗文化遗产', '国家民俗文化遺産'], 국가무형유산: ['국가무형유산', 'National Intangible Heritage', '国家非物质遗产', '国家無形遺産'] };
const BY = { '메트로폴리탄 미술관': ['메트로폴리탄 미술관', 'The Metropolitan Museum of Art', '大都会艺术博物馆', 'メトロポリタン美術館'], '클리블랜드 미술관': ['클리블랜드 미술관', 'Cleveland Museum of Art', '克利夫兰艺术博物馆', 'クリーブランド美術館'] };
const KOGL_BY = ['국립중앙박물관 · 국가유산청', 'National Museum of Korea / Korea Heritage Service', '韩国国立中央博物馆 · 国家遗产厅', '韓国国立中央博物館・国家遺産庁'];
const lab = (map, k) => (map[k] ? L4(map[k]) : k);
const catName = (c) => L4(c.n);
const MAT_EN = MAT; const MOT_EN = MOT; // 아래 코드 호환

export const entryName = (e) => {
  const l = getLang();
  if (l === 'ko') return e.ko;
  if ((l === 'zh' || l === 'ja') && ARCHIVE_NAMES[e.key]) return ARCHIVE_NAMES[e.key][l === 'zh' ? 0 : 1];
  if ((l === 'zh' || l === 'ja') && e.zh) return l === 'zh' ? e.zh : e.ja;
  return e.en;
};
export function entryCredit(e) {
  const by = e.lic === 'KOGL1' ? L4(KOGL_BY) : lab(BY, e.by);
  return [by, lab(LIC, e.lic)].filter(Boolean).join(' · ');
}

const count = (key) => {
  const m = {};
  ARCHIVE.forEach((e) => (e[key] || []).forEach((x) => { m[x] = (m[x] || 0) + 1; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k]) => k);
};

export function ArchiveDetail({ entry, onClose }) {
  if (!entry) return null;
  const en = getLang() !== 'ko';
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ gap: 6 }}>
            <Image source={entry.img} style={st.big} resizeMode="contain" accessibilityLabel={entryName(entry)} />
            <Text style={st.h}>{entryName(entry)}</Text>
            {getLang() !== 'en' ? <Text style={st.sub}>{entry.en}</Text> : null}
            <Text style={st.meta}>
              {[entry.des ? lab(DES, entry.des) : '', entry.date].filter(Boolean).join(' · ')}
            </Text>
            {entry.mat.length || entry.mot.length ? (
              <View style={st.tagRow}>
                {entry.mat.map((m) => <Text key={m} style={st.tag}>{lab(MAT, m)}</Text>)}
                {entry.mot.map((m) => <Text key={m} style={[st.tag, st.tagMot]}>{lab(MOT, m)}</Text>)}
              </View>
            ) : null}
            <Text style={st.credit}>{t('사진')}: {entryCredit(entry)}</Text>
            <Pressable onPress={() => Linking.openURL(entry.page).catch(() => {})}>
              <Text style={st.link}>{t('원본 자료 보기 ›')}</Text>
            </Pressable>
            <Pressable style={st.close} onPress={onClose}>
              <Text style={st.closeTxt}>{t('닫기')}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ArchiveScreen({ navigation, route }) {
  const rp = (route && route.params) || {};
  const en = getLang() !== 'ko';
  const [view, setView] = useState(rp.view || 'photo'); // photo(자료 사진) | mat(재료) | obj(물건 갈래) | shop(만드는 곳)
  const [mode, setMode] = useState('cat'); // cat | mot | mat
  const [pick, setPick] = useState(null);
  const [open, setOpen] = useState(null);
  const { width } = useWindowDimensions();
  const cols = width > 700 ? 5 : 3;
  const size = Math.floor((Math.min(width, 900) - 36 - (cols - 1) * 8) / cols);

  const chips = useMemo(() => {
    if (mode === 'cat') return CATS.filter((c) => ARCHIVE.some((e) => e.cat === c.id)).map((c) => ({ id: c.id, label: catName(c) }));
    if (mode === 'mot') return count('mot').map((m) => ({ id: m, label: lab(MOT, m) }));
    return count('mat').map((m) => ({ id: m, label: lab(MAT, m) }));
  }, [mode, en]);
  const list = useMemo(() => {
    if (!pick) return ARCHIVE;
    if (mode === 'cat') return ARCHIVE.filter((e) => e.cat === pick);
    return ARCHIVE.filter((e) => (e[mode] || []).includes(pick));
  }, [mode, pick]);

  return (
    <SafeAreaView style={st.safe}>
      <ScreenHeader title="전통 자료실" sub={t('창작의 바탕이 되는 실제 전통 {n}점', { n: ARCHIVE.length })} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={st.wrap}>
        {/* 자료실 하나 안에서: 대표 사진 / 재료(재료 갈래 › 재료 › 실물·만드는 곳) / 물건 갈래(폴더 안의 폴더) / 만드는 곳 */}
        <View style={[st.modeRow, { marginBottom: 12 }]}>
          {[['photo', t('대표 사진')], ['mat', t('재료')], ['obj', t('물건 갈래')], ['shop', t('만드는 곳')]].map(([id, label]) => (
            <Pressable key={id} style={[st.mode, view === id && st.modeOn]} onPress={() => { play('tap'); setView(id); }}>
              <Text style={[st.modeTxt, view === id && st.modeTxtOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {view !== 'photo' ? <Text style={st.intro}>{t('문화유산 {a} · 박물관 소장품 {b} · 만드는 곳 {c}', { a: (CATALOG_STATS.wd + CATALOG_STATS.kowiki).toLocaleString(), b: CATALOG_STATS.em.toLocaleString(), c: CATALOG_STATS.shops.toLocaleString() })}</Text> : null}
        {view === 'mat' ? <MaterialTab initialLeaf={rp.leaf} pick={false} choice={{ base: null, accent: null }} setChoice={() => {}} /> : null}
        {view === 'obj' ? <ObjectTab /> : null}
        {view === 'shop' ? <ShopTab /> : null}
        {view === 'photo' ? (<>
        <Text style={st.intro}>
          {t('잇결의 작품은 이 자료들에서 출발해요. 유물의 모양, 문양, 재료를 직접 보고 비교해 보세요. 사진은 모두 박물관·국가기관이 자유 이용을 허락한 것이에요.')}
        </Text>
        <View style={st.modeRow}>
          {[['cat', t('분야')], ['mot', t('문양')], ['mat', t('재료')]].map(([id, label]) => (
            <Pressable key={id} style={[st.mode, mode === id && st.modeOn]} onPress={() => { play('tap'); setMode(id); setPick(null); }}>
              <Text style={[st.modeTxt, mode === id && st.modeTxtOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.chips}>
          <Pressable style={[st.chip, !pick && st.chipOn]} onPress={() => setPick(null)}>
            <Text style={[st.chipTxt, !pick && st.chipTxtOn]}>{t('전체')} {ARCHIVE.length}</Text>
          </Pressable>
          {chips.map((c) => (
            <Pressable key={c.id} style={[st.chip, pick === c.id && st.chipOn]} onPress={() => { play('tap'); setPick(pick === c.id ? null : c.id); }}>
              <Text style={[st.chipTxt, pick === c.id && st.chipTxtOn]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.grid}>
          {list.map((e) => (
            <Pressable key={e.key} style={{ width: size }} onPress={() => setOpen(e)}>
              <View style={[st.thumb, { width: size, height: size }]}>
                <Image source={e.img} style={{ width: size - 6, height: size - 6 }} resizeMode="contain" />
                {e.des ? <Text style={st.badge}>{lab(DES, e.des)}</Text> : null}
              </View>
              <Text style={st.name} numberOfLines={2}>{entryName(e)}</Text>
              {e.mat && e.mat.length ? <Text style={st.nameSub} numberOfLines={1}>{e.mat.map((m) => lab(MAT, m)).join(' · ')}</Text> : null}
            </Pressable>
          ))}
        </View>
        </>) : null}
      </ScrollView>
      <ArchiveDetail entry={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { padding: 18, paddingTop: 6, paddingBottom: 60, maxWidth: 940, width: '100%', alignSelf: 'center' },
  intro: { fontSize: 12.5, color: colors.muted, lineHeight: 19, marginBottom: 10 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  mode: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: colors.ink },
  modeOn: { backgroundColor: colors.ink },
  modeTxt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  modeTxtOn: { color: colors.paper },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { fontSize: 12, color: colors.ink },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { borderRadius: 4, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderBottomWidth: 3, borderBottomColor: colors.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', top: 4, left: 4, fontSize: 9.5, color: '#fff', backgroundColor: 'rgba(179,50,43,0.9)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, overflow: 'hidden' },
  name: { fontSize: 12, color: colors.ink, marginTop: 5, lineHeight: 16, fontFamily: fonts.serifBold },
  nameSub: { fontSize: 10.5, color: colors.muted, marginTop: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  sheet: { backgroundColor: colors.paper, borderRadius: 6, borderTopWidth: 4, borderTopColor: colors.accent, padding: 16, width: '100%', maxWidth: 460, maxHeight: '90%', borderWidth: 1, borderColor: colors.border },
  big: { width: '100%', height: 300, backgroundColor: '#ffffff', borderRadius: 4 },
  h: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 6 },
  sub: { fontSize: 12, color: colors.muted },
  meta: { fontSize: 12, color: colors.accentDeep },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { fontSize: 11, color: colors.ink, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tagMot: { borderColor: colors.accent, color: colors.accent },
  credit: { fontSize: 11, color: colors.muted, marginTop: 4 },
  link: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  close: { marginTop: 8, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 4, backgroundColor: colors.ink, borderBottomWidth: 3, borderBottomColor: '#000' },
  closeTxt: { color: colors.paper, fontWeight: '700' },
});
