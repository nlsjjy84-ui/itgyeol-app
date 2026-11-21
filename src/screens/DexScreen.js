// 조각 도감 — 실제 유물 조각 전체. 모은 조각은 사진으로, 아직 못 모은 조각은 그림자로 보인다.
// 자리(머리·날개·바퀴…)·재료·귀한 정도로 골라 보고, 누르면 박물관 기록과 원본 페이지가 나온다.
// 「내 작품」 칸에는 작업대에서 만든 합체 작품이 쌓인다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, Image, SafeAreaView, useWindowDimensions, Modal, ScrollView, Linking, Platform } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { pieceName } from '../utils/pieceName';
import { usePieces, removeWork, giveAway, currentSeries, dailyState } from '../utils/pieceStore';
import { giftUrl } from '../utils/movieLink';
import QRCode from 'react-native-qrcode-svg';
import { PIECES, PIECE_BY_K, RARITY } from '../data/pieces';
import { SLOT_INFO, SLOT_NAMES, FRAME_BY_ID } from '../data/frames';
import { powerTag } from '../utils/hapche';

const RARE_COLOR = ['#c8c0ae', '#e0a43a', '#c0392b'];
const POWERS = ['흙', '쇠', '돌', '옥', '나무', '천', '종이', '금', '뼈'];

export function PieceDetail({ k, owned, count = 0, onClose, onTransform }) {
  const p = PIECE_BY_K[k];
  const [gift, setGift] = React.useState(null);
  if (!p) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={st.dim} onPress={onClose}>
        <Pressable style={st.sheet} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[st.detailImgBox, { borderColor: RARE_COLOR[p.rare] }]}>
              <Image source={p.img} style={[st.detailImg, !owned && st.shadowImg]} resizeMode="contain" />
            </View>
            <Text style={st.detailName}>{owned ? pieceName(p) : t('아직 못 모은 조각')}</Text>
            {owned ? (
              <>
                <Text style={st.detailMeta}>{[t(RARITY[p.rare]), t(p.era), t(p.by), p.no].filter(Boolean).join(' · ')}</Text>
                <View style={st.rowWrap}>
                  {p.slots.map((s) => (
                    <View key={s} style={st.slotBig}>
                      <Text style={st.slotBigName}>
                        {(SLOT_INFO[s] || {}).icon} {t(s)}
                      </Text>
                      <Text style={st.slotBigSay}>{t((SLOT_INFO[s] || {}).say || '')}</Text>
                    </View>
                  ))}
                </View>
                <Text style={st.factHead}>{t('박물관 기록')}</Text>
                <Text style={st.fact}>
                  {t('재료')}: {t(powerTag(p.power))}
                  {p.use ? `   ·   ${t('원래 쓰임')}: ${p.use}` : ''}
                  {p.size ? `   ·   ${t('크기')}: ${p.size}cm` : ''}
                </Text>
                {p.from ? <Text style={st.fact}>{t('나온 곳')}: {p.from}</Text> : null}
                {!!p.desc && <Text style={st.desc}>{p.desc}</Text>}
                <Text style={st.lic}>{p.abroad ? t('사진: {a} · CC0(누구나 자유롭게 쓸 수 있음) · 해외에 있는 우리 유물', { a: t(p.by) }) : t('사진: {a} · 공공누리 제1유형(출처 표시)', { a: t(p.by) })}</Text>
                <View style={{ gap: 8, marginTop: 12 }}>
                  {onTransform && <SealButton label={t('이 조각 하나로 변형하기')} onPress={() => onTransform(k)} />}
                  <SealButton label={t('박물관 원본 페이지 열기')} variant="paper" onPress={() => Linking.openURL(p.page)} />
                  {count > 1 && !gift ? (
                    <SealButton
                      label={t('친구와 조각 바꾸기 (답례 받기)')}
                      variant="paper"
                      onPress={() => {
                        if (giveAway(k)) setGift(giftUrl(k, '', true));
                      }}
                    />
                  ) : null}
                  {count > 1 && !gift ? (
                    <SealButton
                      label={t('겹친 조각 친구에게 선물하기 (×{n})', { n: count })}
                      variant="ink"
                      onPress={() => {
                        if (giveAway(k)) setGift(giftUrl(k));
                      }}
                    />
                  ) : null}
                  {gift ? (
                    <View style={st.giftBox}>
                      <View style={{ padding: 6, backgroundColor: '#fff', borderRadius: 8 }}>
                        <QRCode value={gift} size={110} />
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={st.desc}>{t('이 QR이나 링크를 친구에게 보내면 이 조각이 친구 도감으로 가요.')}</Text>
                        {Platform.OS === 'web' ? (
                          <SealButton small variant="paper" label={t('링크 복사')} onPress={() => navigator.clipboard && navigator.clipboard.writeText(gift)} />
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <Text style={st.desc}>{t('놀이를 마치고 보따리를 풀면 만날 수 있어요. 자리: {a}', { a: p.slots.map((s) => t(s)).join(', ') })}</Text>
            )}
            <SealButton label={t('닫기')} variant="ink" onPress={onClose} style={{ marginTop: 10 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function DexScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const [tab, setTab] = useState('pieces');
  const [slot, setSlot] = useState(null);
  const [power, setPower] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [open, setOpen] = useState(null);
  const owned = store.owned || {};
  const ownedN = Object.keys(owned).length;
  const list = useMemo(() => {
    let l = PIECES;
    if (slot) l = l.filter((p) => p.slots.includes(slot));
    if (power) l = l.filter((p) => p.power === power);
    if (onlyMine) l = l.filter((p) => owned[p.k]);
    // 모은 것 먼저, 그다음 귀한 순
    return [...l].sort((a, b) => (owned[b.k] ? 1 : 0) - (owned[a.k] ? 1 : 0) || b.rare - a.rare);
  }, [slot, power, onlyMine, store]);
  const cols = width > 700 ? 6 : width > 460 ? 4 : 3;
  const cell = (Math.min(width, 900) - 32) / cols;
  const bySlot = useMemo(() => {
    const m = {};
    SLOT_NAMES.forEach((s) => (m[s] = { all: 0, mine: 0 }));
    PIECES.forEach((p) =>
      p.slots.forEach((s) => {
        if (!m[s]) return;
        m[s].all++;
        if (owned[p.k]) m[s].mine++;
      })
    );
    return m;
  }, [store]);

  // 모음 목표(배지) — 띠부씰 도감처럼, 채울수록 목표가 열린다
  const goals = useMemo(() => {
    const mine = PIECES.filter((p) => owned[p.k]);
    const slotsHave = new Set(mine.flatMap((p) => p.slots));
    const eras = new Set(mine.map((p) => p.era).filter(Boolean));
    const powers = new Set(mine.map((p) => p.power));
    const veryRare = mine.filter((p) => p.rare === 2).length;
    const palace = mine.filter((p) => p.by === '국립고궁박물관').length;
    const works = (store.works || []).length;
    return [
      { id: 'slots', icon: '◎', name: '자리 박사', note: '자리 20가지를 모두 채우기', cur: slotsHave.size, max: 20 },
      { id: 'eras', icon: '⌛', name: '시간 여행자', note: '서로 다른 시대 6곳의 조각 모으기', cur: eras.size, max: 6 },
      { id: 'powers', icon: '✦', name: '재료 장인', note: '흙·쇠·돌·옥·나무·천·종이·금·뼈 9가지 재료 모으기', cur: powers.size, max: 9 },
      { id: 'rare', icon: '★', name: '보물 사냥꾼', note: '「아주 귀함」 조각 3개 모으기', cur: veryRare, max: 3 },
      { id: 'palace', icon: '⛩', name: '궁궐 손님', note: '국립고궁박물관 조각 10개 모으기', cur: palace, max: 10 },
      { id: 'works', icon: '⚙', name: '합체 장인', note: '합체 작품 5개 만들기', cur: works, max: 5 },
      { id: 'hundred', icon: '百', name: '백 조각', note: '조각 100개 모으기', cur: mine.length, max: 100 },
      { id: 'abroad', icon: '✈', name: '먼 길 온 유물', note: '바다 건너 해외 박물관에 있는 우리 유물 조각 5개 모으기', cur: mine.filter((p) => p.abroad).length, max: 5 },
      (() => {
        const se = currentSeries();
        return { id: 'series', icon: '月', name: '이달의 시리즈', note: t('「{a}」 조각 {n}개 모으기', { a: t(se.name), n: Math.min(20, se.pool.length) }), raw: true, cur: se.pool.filter((p) => owned[p.k]).length, max: Math.min(20, se.pool.length) };
      })(),
      { id: 'scan', icon: '⌕', name: '진짜 유물 탐정', note: '박물관에서 소장품번호로 진짜 유물 3개 찾기', cur: (store.claimed || []).filter((c) => String(c).startsWith('scan:')).length, max: 3 },
      { id: 'streak', icon: '◔', name: '이어 오기', note: '오늘의 보따리를 7일 이어 받기', cur: dailyState().streak, max: 7 },
      { id: 'places', icon: '⛰', name: '나들이꾼', note: '서로 다른 고장에서 나온 조각 5곳 모으기', cur: new Set(mine.filter((p) => p.from).map((p) => p.from.split(' - ')[0])).size, max: 5 },
    ];
  }, [store]);

  const header = (
    <View>
      <ScreenHeader title={t('조각 도감')} sub={t('실제 유물 {n}점 중 {m}점을 모았어요', { n: PIECES.length, m: ownedN })} onBack={() => navigation.goBack()} />
      <View style={st.progress}>
        <View style={[st.progressFill, { width: `${(ownedN / PIECES.length) * 100}%` }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.goals}>
        {goals.map((g) => {
          const done = g.cur >= g.max;
          return (
            <View key={g.id} style={[st.goal, done && st.goalDone]}>
              <Text style={[st.goalIc, done && { color: '#fff' }]}>{g.icon}</Text>
              <Text style={[st.goalName, done && { color: '#fff' }]}>{t(g.name)}</Text>
              <Text style={[st.goalNote, done && { color: '#ffffffcc' }]} numberOfLines={2}>
                {g.raw ? g.note : t(g.note)}
              </Text>
              <View style={st.goalBar}>
                <View style={[st.goalFill, { width: `${Math.min(100, (g.cur / g.max) * 100)}%` }]} />
              </View>
              <Text style={[st.goalNum, done && { color: '#fff' }]}>{done ? t('달성!') : `${Math.min(g.cur, g.max)} / ${g.max}`}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={st.tabs}>
        {[
          ['pieces', t('조각')],
          ['works', t('내 작품 {n}', { n: (store.works || []).length })],
        ].map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[st.tab, tab === id && st.tabOn]}>
            <Text style={[st.tabTxt, tab === id && st.tabTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'pieces' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
            <Pressable onPress={() => setSlot(null)} style={[st.chip, !slot && st.chipOn]}>
              <Text style={[st.chipTxt, !slot && st.chipTxtOn]}>{t('모든 자리')}</Text>
            </Pressable>
            {SLOT_NAMES.map((s) => (
              <Pressable key={s} onPress={() => setSlot(slot === s ? null : s)} style={[st.chip, slot === s && st.chipOn]}>
                <Text style={[st.chipTxt, slot === s && st.chipTxtOn]}>
                  {SLOT_INFO[s].icon} {t(s)} {bySlot[s].mine}/{bySlot[s].all}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
            <Pressable onPress={() => setOnlyMine(!onlyMine)} style={[st.chip, onlyMine && st.chipOn]}>
              <Text style={[st.chipTxt, onlyMine && st.chipTxtOn]}>{t('모은 것만')}</Text>
            </Pressable>
            {POWERS.map((pw) => (
              <Pressable key={pw} onPress={() => setPower(power === pw ? null : pw)} style={[st.chip, power === pw && st.chipOn]}>
                <Text style={[st.chipTxt, power === pw && st.chipTxtOn]}>{t(powerTag(pw))}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {ownedN === 0 && (
            <View style={st.empty}>
              <Text style={st.emptyTxt}>{t('아직 모은 조각이 없어요. 첫 보따리를 풀어 볼까요?')}</Text>
              <SealButton label={t('첫 보따리 받기')} onPress={() => navigation.navigate('Pack')} />
            </View>
          )}
        </>
      )}
    </View>
  );

  if (tab === 'works') {
    const works = store.works || [];
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.wrap}>
          {header}
          <SealButton label={t('합체 전시관 화면 띄우기 (큰 화면·키오스크)')} variant="ink" onPress={() => navigation.navigate('HapcheWall')} style={{ marginTop: 10 }} />
          {!works.length && (
            <View style={st.empty}>
              <Text style={st.emptyTxt}>{t('아직 만든 작품이 없어요. 작업대에서 조각을 합체해 보세요.')}</Text>
              <SealButton label={t('작업대로 가기')} onPress={() => navigation.navigate('Workshop')} />
            </View>
          )}
          {works.map((w) => {
            const f = FRAME_BY_ID[w.frameId];
            const ks = [...new Set(Object.values(w.assign || {}))].slice(0, 6);
            return (
              <Pressable key={w.id} style={st.work} onPress={() => navigation.navigate('Movie', { frameId: w.frameId, assign: w.assign, layout: w.layout, seed: w.seed, scene: w.scene, saved: w.id })}>
                <View style={st.workImgs}>
                  {ks.map((k) => (PIECE_BY_K[k] ? <Image key={k} source={PIECE_BY_K[k].img} style={st.workImg} resizeMode="contain" /> : null))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.workTitle}>{w.title}</Text>
                  <Text style={st.workMeta}>
                    {f ? t(f.name) : w.frameId === 'free' ? t('자유 합체') : ''} · {new Date(w.at).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable onPress={() => removeWork(w.id)} hitSlop={8}>
                  <Text style={st.del}>{t('지우기')}</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <FlatList
        data={list}
        key={cols}
        numColumns={cols}
        keyExtractor={(p) => p.k}
        ListHeaderComponent={header}
        contentContainerStyle={st.wrap}
        initialNumToRender={24}
        windowSize={7}
        renderItem={({ item: p }) => {
          const mine = !!owned[p.k];
          return (
            <Pressable
              style={[st.cell, { width: cell, height: cell + 34 }]}
              onPress={() => {
                play('tap');
                setOpen(p.k);
              }}
              accessibilityLabel={mine ? pieceName(p) : t('아직 못 모은 조각')}
            >
              <View style={[st.cellBox, { borderColor: mine ? RARE_COLOR[p.rare] : colors.borderSoft }]}>
                <Image source={p.img} style={[{ width: cell - 22, height: cell - 22 }, !mine && st.shadowImg]} resizeMode="contain" />
                {mine && owned[p.k] > 1 && <Text style={st.dup}>×{owned[p.k]}</Text>}
                {p.only ? <Text style={st.only}>{t('궁궐 한정')}</Text> : null}
              </View>
              <Text style={st.cellName} numberOfLines={1}>
                {mine ? pieceName(p) : '？'}
              </Text>
            </Pressable>
          );
        }}
      />
      {open && (
        <PieceDetail
          k={open}
          owned={!!owned[open]}
          count={owned[open] || 0}
          onClose={() => setOpen(null)}
          onTransform={(k) => {
            setOpen(null);
            navigation.navigate('Workshop', { mode: 'transform', core: k });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 16, paddingBottom: 60, maxWidth: 900, width: '100%', alignSelf: 'center' },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.borderSoft, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 8, backgroundColor: colors.hwang },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  goals: { gap: 8, paddingTop: 12 },
  goal: { width: 128, backgroundColor: colors.paper, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.borderSoft },
  goalDone: { backgroundColor: '#b9781a', borderColor: '#b9781a' },
  goalIc: { fontSize: 18, color: '#b9781a' },
  goalName: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 2 },
  goalNote: { fontSize: 10.5, color: colors.muted, marginTop: 2, minHeight: 28 },
  goalBar: { height: 5, borderRadius: 3, backgroundColor: colors.borderSoft, marginTop: 6, overflow: 'hidden' },
  goalFill: { height: 5, backgroundColor: colors.hwang },
  goalNum: { fontSize: 11, color: colors.ink, marginTop: 3 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabTxt: { color: colors.ink, fontSize: 14 },
  tabTxtOn: { color: colors.baek, fontWeight: '700' },
  chips: { gap: 6, paddingVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt: { fontSize: 12, color: colors.ink },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  cell: { padding: 4 },
  cellBox: { flex: 1, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  shadowImg: { tintColor: '#3a3f44', opacity: 0.35 },
  cellName: { fontSize: 11, color: colors.ink, textAlign: 'center', marginTop: 3 },
  dup: { position: 'absolute', right: 5, bottom: 3, fontSize: 11, color: colors.muted },
  only: { position: 'absolute', left: 4, top: 4, fontSize: 9, color: '#fff', backgroundColor: '#7d1f1b', paddingHorizontal: 4, borderRadius: 5, overflow: 'hidden' },
  empty: { alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.paper, borderRadius: 14, marginVertical: 10 },
  emptyTxt: { color: colors.ink, fontSize: 15, textAlign: 'center' },
  dim: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.paper, borderRadius: 18, maxHeight: '92%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  detailImgBox: { borderWidth: 3, borderRadius: 16, padding: 10, backgroundColor: '#f3efe6' },
  detailImg: { width: '100%', height: 260 },
  detailName: { fontSize: 20, color: colors.ink, fontWeight: '700', marginTop: 12 },
  detailMeta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  slotBig: { backgroundColor: colors.accentSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  slotBigName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  slotBigSay: { fontSize: 11, color: colors.muted },
  factHead: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 14 },
  fact: { fontSize: 13, color: colors.ink, marginTop: 4, lineHeight: 19 },
  desc: { fontSize: 13, color: colors.ink, marginTop: 8, lineHeight: 20 },
  lic: { fontSize: 11, color: colors.muted, marginTop: 10 },
  giftBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#f6f2ea', borderRadius: 12, padding: 8 },
  work: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: 14, padding: 10, marginTop: 10, borderWidth: 1, borderColor: colors.borderSoft },
  workImgs: { flexDirection: 'row', width: 120, flexWrap: 'wrap' },
  workImg: { width: 40, height: 40 },
  workTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  workMeta: { fontSize: 12, color: colors.muted, marginTop: 3 },
  del: { fontSize: 12, color: colors.accent },
});
