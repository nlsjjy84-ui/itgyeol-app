import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, Image, Linking, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import { colors, fonts } from '../theme';
import { t, getLang } from '../i18n';
import { play } from '../utils/sound';
import { useJourney } from '../context/JourneyContext';
import { MATERIAL_GROUPS, MATERIAL_BY_ID } from '../data/materialTree';
import { MATERIAL_NAMES, suggestMaterials } from '../data/materialNames';
import { OBJECT_TREE, SHOPS, CATALOG_STATS, itemLink } from '../data/catalog';
import { CATALOG_IMAGES } from '../data/catalogImages';
import { MATERIAL_SHOTS } from '../data/materialShots';
import { allowedGroups, allowedSuggest, allowResin } from '../utils/operator';

// 운영사가 받는 재료만(src/config/operator.js)
const GROUPS = allowedGroups(MATERIAL_GROUPS);

// 소재 목록 — 잇결 결과물이 출발하는 실제 전통 재료·유물·만드는 곳.
// 폴더 안의 폴더처럼: 재료 갈래 › 재료 › 실물·만드는 곳 / 물건 갈래 › 작은 갈래 › 물건.
// mode=pick 이면 놀이 전에 바탕 재료와 무늬 재료를 고르는 화면으로 쓴다(고른 재료가 결과물 3D 재질이 된다).
// 운영사(업체·박물관)는 같은 목록에서 키오스크·앱에 올릴 소재를 고른다 — 자료를 바꾸면 화면도 바로 바뀐다.

const LI = { en: 0, zh: 1, ja: 2 };
export const matName = (id, ko) => {
  const l = getLang();
  return l === 'ko' || !MATERIAL_NAMES[id] ? ko : MATERIAL_NAMES[id][LI[l]] || ko;
};
const SRC = { wd: '문화유산', wiki: '위키백과', em: '박물관 소장품' };

export const MATERIAL_COUNT = GROUPS.reduce((a, g) => a + g.items.length, 0);

export function Swatch({ look, size = 34 }) {
  if (!look) return null;
  const shine = look.metal ? 0.75 : look.clear ? 0.6 : Math.max(0.08, 0.45 - look.rough * 0.4);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: look.color, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' }}>
      {look.irid ? (
        <>
          <View style={{ position: 'absolute', left: -size * 0.2, top: size * 0.15, width: size, height: size * 0.3, backgroundColor: '#e9d3ef', opacity: 0.8, transform: [{ rotate: '-30deg' }] }} />
          <View style={{ position: 'absolute', left: 0, top: size * 0.55, width: size * 1.2, height: size * 0.25, backgroundColor: '#cfe9da', opacity: 0.8, transform: [{ rotate: '-30deg' }] }} />
        </>
      ) : null}
      {look.inlay ? <View style={{ position: 'absolute', left: size * 0.2, top: size * 0.45, width: size * 0.6, height: 2, backgroundColor: look.inlay }} /> : null}
      {look.grain ? <View style={{ position: 'absolute', left: 0, top: size * 0.3, width: size, height: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} /> : null}
      <View style={{ position: 'absolute', left: size * 0.2, top: size * 0.14, width: size * 0.32, height: size * 0.22, borderRadius: size, backgroundColor: '#fff', opacity: shine }} />
      <View style={{ position: 'absolute', left: 0, bottom: 0, width: size, height: size * 0.35, backgroundColor: '#000', opacity: 0.18 }} />
    </View>
  );
}

function ItemRow({ it }) {
  const [name, src, era, coll, , use, img, desig, unesco] = it;
  return (
    <Pressable style={st.row} onPress={() => Linking.openURL(itemLink(it)).catch(() => {})}>
      {img && CATALOG_IMAGES[img] ? <Image source={CATALOG_IMAGES[img]} style={st.rowImg} resizeMode="cover" /> : <View style={[st.rowImg, st.rowImgEmpty]} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.rowName} numberOfLines={2}>{name}</Text>
        <Text style={st.rowMeta} numberOfLines={1}>{[t(SRC[src]), desig, era, coll].filter(Boolean).join(' · ')}</Text>
        <View style={st.tagRow}>
          {unesco ? <Text style={[st.tag, st.tagUn]}>{unesco}</Text> : null}
          {use === 1 ? <Text style={[st.tag, st.tagFree]}>{t('바로 쓸 수 있음')}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function Photos({ items }) {
  const { width } = useWindowDimensions();
  const withImg = items.filter((x) => x[6] && CATALOG_IMAGES[x[6]]).slice(0, 12);
  if (!withImg.length) return null;
  const cols = width > 700 ? 6 : 3;
  const size = Math.floor((Math.min(width, 940) - 36 - (cols - 1) * 8) / cols);
  return (
    <View style={st.grid}>
      {withImg.map((it) => (
        <Pressable key={it[4]} style={{ width: size }} onPress={() => Linking.openURL(itemLink(it)).catch(() => {})}>
          <Image source={CATALOG_IMAGES[it[6]]} style={{ width: size, height: size, borderRadius: 6, backgroundColor: '#fff' }} resizeMode="cover" />
          <Text style={st.gridName} numberOfLines={2}>{it[0]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Folder({ title, count, open, onToggle, children, depth = 0, right }) {
  return (
    <View style={{ marginLeft: depth * 14 }}>
      <Pressable style={st.folder} onPress={() => { play('tap'); onToggle(); }}>
        <Text style={st.caret}>{open ? '▾' : '▸'}</Text>
        {right}
        <Text style={[st.folderTxt, depth > 0 && st.folderTxtSub]} numberOfLines={1}>{title}</Text>
        {count !== undefined ? <Text style={st.count}>{count.toLocaleString()}</Text> : null}
      </Pressable>
      {open ? <View>{children}</View> : null}
    </View>
  );
}

function ShopList({ kinds }) {
  const list = SHOPS.filter((s) => kinds.includes(s[1])).slice(0, 30);
  if (!list.length) return null;
  return (
    <View>
      <Text style={st.h3}>{t('이 재료를 다루는 곳')}</Text>
      {list.map((s, i) => (
        <View key={s[0] + i} style={st.shop}>
          <Text style={st.shopName}>{s[0]} <Text style={st.shopKind}>{s[1]}</Text></Text>
          <Text style={st.rowMeta}>{[s[2], s[3]].filter(Boolean).join(' · ')}</Text>
          {s[4] ? <Text style={st.link} onPress={() => Linking.openURL('https://' + s[4]).catch(() => {})}>{s[4]}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function MaterialTab({ pick, choice, setChoice, initialLeaf }) {
  const [open, setOpen] = useState(() => ({ [initialLeaf && MATERIAL_BY_ID[initialLeaf] ? MATERIAL_BY_ID[initialLeaf].groupId : GROUPS[0].id]: true }));
  const [leaf, setLeaf] = useState(initialLeaf || null);
  const sel = leaf ? MATERIAL_BY_ID[leaf] : null;
  return (
    <View>
      {(pick ? GROUPS : MATERIAL_GROUPS).map((g) => (
        <Folder key={g.id} title={matName(g.id, g.name)} count={g.items.reduce((a, m) => a + m.count, 0)} open={!!open[g.id]} onToggle={() => setOpen({ ...open, [g.id]: !open[g.id] })}>
          {g.items.map((m) => {
            const on = leaf === m.id;
            const role = choice.base === m.id ? t('바탕') : choice.accent === m.id ? t('무늬') : '';
            return (
              <View key={m.id}>
                <Pressable style={[st.leaf, on && st.leafOn]} onPress={() => { play('tap'); setLeaf(on ? null : m.id); }}>
                  <Swatch look={m.look} size={28} />
                  <Text style={[st.leafTxt, on && st.leafTxtOn]} numberOfLines={1}>{matName(m.id, m.name)}</Text>
                  {role ? <Text style={st.role}>{role}</Text> : null}
                  <Text style={st.count}>{m.count.toLocaleString()}</Text>
                </Pressable>
                {on ? (
                  <View style={st.detail}>
                    <View style={st.detailHead}>
                      {MATERIAL_SHOTS[m.id] ? (
                        <View style={st.shotBox}>
                          <Image source={MATERIAL_SHOTS[m.id]} style={st.shot} resizeMode="contain" />
                        </View>
                      ) : <Swatch look={m.look} size={64} />}
                      <View style={{ flex: 1 }}>
                        <Text style={st.h2}>{matName(m.id, m.name)}</Text>
                        <Text style={st.note}>{m.note}</Text>
                        {MATERIAL_SHOTS[m.id] ? <Text style={st.shotCap}>{t('그림은 이 재료로 만든 나만의 노리개 패예요.')}</Text> : null}
                      </View>
                    </View>
                    {pick ? (
                      <View style={st.pickRow}>
                        <Pressable style={[st.pickBtn, choice.base === m.id && st.pickBtnOn]} onPress={() => { play('stamp'); setChoice({ ...choice, base: choice.base === m.id ? null : m.id, accent: choice.accent === m.id ? null : choice.accent }); }}>
                          <Text style={[st.pickTxt, choice.base === m.id && st.pickTxtOn]}>{t('바탕 재료로')}</Text>
                        </Pressable>
                        <Pressable style={[st.pickBtn, choice.accent === m.id && st.pickBtnOn]} onPress={() => { play('stamp'); setChoice({ ...choice, accent: choice.accent === m.id ? null : m.id, base: choice.base === m.id ? null : choice.base }); }}>
                          <Text style={[st.pickTxt, choice.accent === m.id && st.pickTxtOn]}>{t('무늬 재료로')}</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    <Text style={st.h3}>{t('이 재료로 만든 실물')} · {m.count.toLocaleString()}</Text>
                    <Photos items={m.samples} />
                    {m.samples.slice(0, 16).map((it) => <ItemRow key={it[4]} it={it} />)}
                    <ShopList kinds={m.shopKinds} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </Folder>
      ))}
      {sel ? null : <Text style={st.hint}>{t('재료를 누르면 그 재료로 만든 실물과 다루는 곳이 열려요.')}</Text>}
    </View>
  );
}

export function ObjectTab() {
  const [open, setOpen] = useState({});
  const tog = (k) => setOpen({ ...open, [k]: !open[k] });
  return (
    <View>
      {OBJECT_TREE.map((top) => (
        <Folder key={top.name} title={top.name} count={top.count} open={!!open[top.name]} onToggle={() => tog(top.name)}>
          {top.subs.map((sub) => {
            const k = top.name + '|' + sub.name;
            const leaves = sub.leaves.filter((l) => l.name !== '-');
            const flat = sub.leaves.find((l) => l.name === '-');
            return (
              <Folder key={k} depth={1} title={sub.name} count={sub.count} open={!!open[k]} onToggle={() => tog(k)}>
                {flat ? <View style={{ marginLeft: 28 }}><Photos items={flat.items} />{flat.items.slice(0, 12).map((it) => <ItemRow key={it[4]} it={it} />)}</View> : null}
                {leaves.map((l) => {
                  const kk = k + '|' + l.name;
                  return (
                    <Folder key={kk} depth={2} title={l.name} count={l.count} open={!!open[kk]} onToggle={() => tog(kk)}>
                      <View style={{ marginLeft: 42 }}>
                        <Photos items={l.items} />
                        {l.items.map((it) => <ItemRow key={it[4]} it={it} />)}
                      </View>
                    </Folder>
                  );
                })}
              </Folder>
            );
          })}
        </Folder>
      ))}
    </View>
  );
}

export function ShopTab() {
  const [open, setOpen] = useState({});
  const by = useMemo(() => {
    const m = {};
    SHOPS.forEach((s) => (m[s[1]] = m[s[1]] || []).push(s));
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, []);
  return (
    <View>
      {by.map(([kind, list]) => (
        <Folder key={kind} title={kind} count={list.length} open={!!open[kind]} onToggle={() => setOpen({ ...open, [kind]: !open[kind] })}>
          {list.map((s, i) => (
            <View key={s[0] + i} style={[st.shop, { marginLeft: 28 }]}>
              <Text style={st.shopName}>{s[0]}</Text>
              <Text style={st.rowMeta}>{[s[2], s[3]].filter(Boolean).join(' · ')}</Text>
              {s[4] ? <Text style={st.link} onPress={() => Linking.openURL('https://' + s[4]).catch(() => {})}>{s[4]}</Text> : null}
            </View>
          ))}
        </Folder>
      ))}
    </View>
  );
}

// 결과 화면에서 바로 재료를 바꿔 입혀 보는 띠 — 바탕 한 줄, 무늬 한 줄. 바꾸면 위의 3D가 그 재료로 다시 만들어진다.
const ALL_MATS = GROUPS.flatMap((g) => g.items);
export function MaterialStrip() {
  const nav = useNavigation();
  const { materials, setMaterials } = useJourney();
  const cur = materials || { base: null, accent: null };
  const base = cur.base ? MATERIAL_BY_ID[cur.base] : null;
  const row = (role) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.stripRow}>
      {role === 'base' && !allowResin() ? null : <Pressable style={[st.stripChip, !cur[role] && st.stripChipOn]} onPress={() => { play('tap'); setMaterials({ ...cur, [role]: null }); }}>
        <View style={[st.stripNone]} />
        <Text style={st.stripTxt} numberOfLines={1}>{role === 'base' ? t('출력용 수지') : t('없음')}</Text>
      </Pressable>}
      {ALL_MATS.map((m) => (
        <Pressable key={m.id} style={[st.stripChip, cur[role] === m.id && st.stripChipOn]} onPress={() => { play('stamp'); setMaterials({ ...cur, [role]: m.id }); }}>
          <Swatch look={m.look} size={30} />
          <Text style={st.stripTxt} numberOfLines={1}>{matName(m.id, m.name)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
  return (
    <View style={st.strip}>
      <Text style={st.stripHead}>{t('재료 바꿔 입혀 보기')}</Text>
      <Text style={st.stripLab}>{t('바탕')}</Text>
      {row('base')}
      {base ? (<><Text style={st.stripLab}>{t('무늬')}</Text>{row('accent')}</>) : null}
      {base ? (
        <View style={{ marginTop: 6 }}>
          <Text style={st.note}>{base.note}</Text>
          <Photos items={base.samples} />
          <Pressable onPress={() => { play('tap'); nav.navigate('Archive', { view: 'mat', leaf: base.id }); }}>
            <Text style={st.link}>{t('{m} 실물 {n}점 · 만드는 곳 보기 ›', { m: matName(base.id, base.name), n: base.count.toLocaleString() })}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={st.note}>{t('지금은 업체가 바로 출력하는 풀컬러 수지 모양이에요. 재료를 고르면 그 재료와 기법(상감·나전·자수…)으로 바뀌어요.')}</Text>
      )}
    </View>
  );
}

export default function MaterialScreen({ navigation, route }) {
  const pick = route && route.params && route.params.mode === 'pick';
  const params = (route && route.params) || {};
  const then = params.then || 'Home';
  const first = !!params.first;
  const { materials, setMaterials } = useJourney();
  // 처음이면 '떠오르는 것'에서 고른 답으로 재료를 먼저 권한다
  const suggested = useMemo(() => allowedSuggest(suggestMaterials(params.suggest), MATERIAL_BY_ID), [params.suggest]);
  const [choice, setChoice] = useState(() => (materials && materials.base ? materials : suggested));
  const finish = (v) => { setMaterials(v); if (first) navigation.replace(then, params.thenParams || {}); else navigation.navigate(then, params.thenParams || {}); };
  const [tab, setTab] = useState('mat');
  const [goHint, setGoHint] = useState('');
  const tabs = pick ? [['mat', t('재료')]] : [['mat', t('재료')], ['obj', t('물건 갈래')], ['shop', t('만드는 곳')]];
  const base = choice.base ? MATERIAL_BY_ID[choice.base] : null;
  const accent = choice.accent ? MATERIAL_BY_ID[choice.accent] : null;
  return (
    <SafeAreaView style={st.safe}>
      <ScreenHeader title={pick ? '재료 고르기' : '소재 목록'} sub={pick ? t('놀이를 시작하기 전에 실제 전통 재료를 골라요') : t('문화유산 {a} · 박물관 소장품 {b} · 만드는 곳 {c}', { a: (CATALOG_STATS.wd + CATALOG_STATS.kowiki).toLocaleString(), b: CATALOG_STATS.em.toLocaleString(), c: CATALOG_STATS.shops.toLocaleString() })} onBack={() => navigation.goBack()} />
      {pick ? (
        <View style={st.choiceBar}>
          <View style={st.choiceCell}>
            <Text style={st.choiceLab}>{t('바탕')}</Text>
            {base ? <Swatch look={base.look} size={26} /> : null}
            <Text style={st.choiceName} numberOfLines={1}>{base ? matName(base.id, base.name) : t('고르지 않음')}</Text>
          </View>
          <View style={st.choiceCell}>
            <Text style={st.choiceLab}>{t('무늬')}</Text>
            {accent ? <Swatch look={accent.look} size={26} /> : null}
            <Text style={st.choiceName} numberOfLines={1}>{accent ? matName(accent.id, accent.name) : t('고르지 않음')}</Text>
          </View>
          {/* 막지 않는다: 바탕을 안 골랐으면 추천 재료로 바로 시작하고, 추천도 없으면 무엇을 고르면 되는지 알려 준다 */}
          <Pressable style={[st.go, !base && st.goOff]} onPress={() => {
            if (base) { play('stamp'); finish(choice); return; }
            if (suggested && suggested.base) { play('stamp'); finish(suggested); return; }
            play('tap'); setGoHint(t('아래에서 바탕 재료를 하나 골라 주세요.'));
          }}>
            <Text style={st.goTxt}>{t('이 재료로 놀기')}</Text>
          </Pressable>
          {goHint && !base ? <Text style={st.choiceLab}>{goHint}</Text> : null}
        </View>
      ) : null}
      <ScrollView contentContainerStyle={st.wrap}>
        {pick && suggested.base && !(materials && materials.base) ? (
          <Text style={st.suggest}>{t('떠올린 것에 맞춰 먼저 골라 두었어요. 마음에 안 들면 바꿔도 돼요.')}</Text>
        ) : null}
        {pick && first && allowResin() ? (
          <Pressable onPress={() => { play('tap'); finish({ base: null, accent: null }); }} hitSlop={8}>
            <Text style={st.skip}>{t('나중에 고를게요 ›')}</Text>
          </Pressable>
        ) : null}
        <Text style={st.intro}>
          {pick
            ? t('고른 재료가 결과물의 실제 재질이 돼요. 바탕은 몸체, 무늬는 놀이로 생긴 무늬에 쓰여요. 예: 바탕 옻칠 + 무늬 자개 = 나전칠기.')
            : t('잇결의 결과물은 실제 전통 재료와 실물 유물에서 출발해요. 갈래를 열어 들어가 보세요. 사진은 공공누리 제1유형·CC0 등 자유 이용이 허락된 것만 실었어요.')}
        </Text>
        {tabs.length > 1 ? (
          <View style={st.tabs}>
            {tabs.map(([id, label]) => (
              <Pressable key={id} style={[st.tab, tab === id && st.tabOn]} onPress={() => { play('tap'); setTab(id); }}>
                <Text style={[st.tabTxt, tab === id && st.tabTxtOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {tab === 'mat' ? <MaterialTab pick={pick} choice={choice} setChoice={setChoice} /> : tab === 'obj' ? <ObjectTab /> : <ShopTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { padding: 18, paddingTop: 6, paddingBottom: 80, maxWidth: 940, width: '100%', alignSelf: 'center' },
  intro: { fontSize: 12.5, color: colors.muted, lineHeight: 19, marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: colors.ink },
  tabOn: { backgroundColor: colors.ink },
  tabTxt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  tabTxtOn: { color: colors.paper },
  folder: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  caret: { width: 14, color: colors.muted, fontSize: 13 },
  folderTxt: { flex: 1, fontSize: 15, color: colors.ink, fontFamily: fonts.serifBold },
  folderTxtSub: { fontSize: 13.5, fontFamily: fonts.serif },
  count: { fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'] },
  leaf: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 22, paddingRight: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  leafOn: { backgroundColor: colors.paper },
  leafTxt: { flex: 1, fontSize: 14, color: colors.ink },
  leafTxtOn: { fontWeight: '800' },
  shotBox: { width: 108, height: 108, borderRadius: 12, backgroundColor: '#f6f3ec', alignItems: 'center', justifyContent: 'center' },
  shot: { width: 104, height: 104 },
  shotCap: { fontSize: 11, color: colors.muted, marginTop: 4 },
  role: { fontSize: 11, color: '#fff', backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 9, overflow: 'hidden' },
  detail: { paddingLeft: 22, paddingVertical: 10, gap: 4 },
  detailHead: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 6 },
  h2: { fontSize: 19, color: colors.ink, fontFamily: fonts.serifHeavy },
  note: { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  h3: { fontSize: 12.5, color: colors.muted, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  pickRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  pickBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1.5, borderColor: colors.accent },
  pickBtnOn: { backgroundColor: colors.accent },
  pickTxt: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  pickTxtOn: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gridName: { fontSize: 11, color: colors.ink, marginTop: 3, lineHeight: 14 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  rowImg: { width: 46, height: 46, borderRadius: 4, backgroundColor: '#fff' },
  rowImgEmpty: { backgroundColor: colors.border, opacity: 0.4 },
  rowName: { fontSize: 13.5, color: colors.ink, fontFamily: fonts.serifBold },
  rowMeta: { fontSize: 11.5, color: colors.muted },
  tagRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  tag: { fontSize: 10.5, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, overflow: 'hidden' },
  tagFree: { color: colors.accentDeep || colors.accent, borderWidth: 1, borderColor: colors.border },
  tagUn: { color: '#fff', backgroundColor: colors.accent },
  shop: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  shopName: { fontSize: 13.5, color: colors.ink, fontWeight: '700' },
  shopKind: { fontSize: 11, color: colors.muted, fontWeight: '400' },
  link: { fontSize: 11.5, color: colors.accent },
  suggest: { fontSize: 12.5, color: colors.accent, fontWeight: '700', marginBottom: 6 },
  skip: { fontSize: 12, color: colors.muted, textAlign: 'right', marginBottom: 6 },
  strip: { marginTop: 10, marginBottom: 4 },
  stripHead: { fontSize: 13.5, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  stripLab: { fontSize: 11, color: colors.muted, fontWeight: '800', marginTop: 4 },
  stripRow: { gap: 6, paddingVertical: 4 },
  stripChip: { alignItems: 'center', width: 64, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  stripChipOn: { borderColor: colors.accent, backgroundColor: colors.paper },
  stripNone: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.muted },
  stripTxt: { fontSize: 10.5, color: colors.ink, marginTop: 3, maxWidth: 60, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.muted, marginTop: 12, textAlign: 'center' },
  choiceBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, maxWidth: 940, width: '100%', alignSelf: 'center', flexWrap: 'wrap' },
  choiceCell: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  choiceLab: { fontSize: 11, color: colors.muted, fontWeight: '800' },
  choiceName: { fontSize: 13, color: colors.ink, fontFamily: fonts.serifBold, maxWidth: 120 },
  go: { marginLeft: 'auto', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 4, backgroundColor: colors.ink, borderBottomWidth: 3, borderBottomColor: '#000' },
  goOff: { opacity: 0.35 },
  goTxt: { color: colors.paper, fontWeight: '800', fontSize: 13 },
});
