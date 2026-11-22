// 조각 도감 — 실제 유물 조각 전체. 모은 조각은 사진으로, 아직 못 모은 조각은 그림자로 보인다.
// 자리(머리·날개·바퀴…)·재료·귀한 정도로 골라 보고, 누르면 박물관 기록과 원본 페이지가 나온다.
// 「내 작품」 칸에는 작업대에서 만든 합체 작품이 쌓인다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, Image, SafeAreaView, useWindowDimensions, Modal, ScrollView, Linking, Platform, TextInput } from 'react-native';
import Text from '../ui/Text';
import WhyBox from '../ui/WhyBox';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { pieceName } from '../utils/pieceName';
import { pieceStory } from '../utils/pieceStory';
import { MEANING, MOTIF } from '../data/pieceMeaning';
import { PIECE_COLORS } from '../utils/pieceColors';
import { usePieces, giveAway, currentSeries, dailyState } from '../utils/pieceStore';
import { giftUrl } from '../utils/movieLink';
import QRCode from 'react-native-qrcode-svg';
import { PIECES, PIECE_BY_K, RARITY } from '../data/pieces';
import { SLOT_INFO, SLOT_NAMES } from '../data/frames';
import { powerTag } from '../utils/hapche';

const RARE_COLOR = ['#c8c0ae', '#e0a43a', '#c0392b'];
const POWERS = ['흙', '쇠', '돌', '옥', '나무', '천', '종이', '금', '뼈'];
// 우리 땅 지도 — 유물이 땅속에서 나온 곳(출토지)을 시·도 칸으로. 실제 위치를 어림한 칸 지도(타일 지도).
const REGIONS = [
  { id: '경기도', short: '경기', c: 1, r: 0 },
  { id: '강원도', short: '강원', c: 2, r: 0 },
  { id: '인천광역시', short: '인천', c: 0, r: 1 },
  { id: '서울특별시', short: '서울', c: 1, r: 1 },
  { id: '충청북도', short: '충북', c: 2, r: 1 },
  { id: '경상북도', short: '경북', c: 3, r: 1 },
  { id: '충청남도', short: '충남', c: 0, r: 2 },
  { id: '대전광역시', short: '대전', c: 1, r: 2 },
  { id: '대구광역시', short: '대구', c: 3, r: 2 },
  { id: '전라북도', short: '전북', c: 0, r: 3 },
  { id: '경상남도', short: '경남', c: 2, r: 3 },
  { id: '울산광역시', short: '울산', c: 3, r: 3 },
  { id: '광주광역시', short: '광주', c: 0, r: 4 },
  { id: '전라남도', short: '전남', c: 1, r: 4 },
  { id: '부산광역시', short: '부산', c: 3, r: 4 },
  { id: '제주도', short: '제주', c: 0, r: 5 },
];
const regionOf = (p) => (p.from ? p.from.split(' - ')[0].replace('제주특별자치도', '제주도') : '');

export function PieceDetail({ k, owned, count = 0, onClose, onTransform, onHapche }) {
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
            <Text style={st.detailName}>{owned ? pieceName(p) : t('아직 못 모은 유물')}</Text>
            {owned ? (
              <>
                <Text style={st.detailMeta}>{[t(RARITY[p.rare]), t(p.era), t(p.by), p.no].filter(Boolean).join(' · ')}</Text>
                <Text style={st.factHead}>{t('박물관 기록')}</Text>
                <Text style={st.fact}>
                  {t('재료')}: {t(powerTag(p.power))}
                  {p.use ? `   ·   ${t('원래 쓰임')}: ${p.use}` : ''}
                  {p.size ? `   ·   ${t('크기')}: ${p.size}cm` : ''}
                </Text>
                {p.from ? <Text style={st.fact}>{t('나온 곳')}: {p.from}</Text> : null}
                {(() => {
                  const m = MEANING[p.k];
                  if (!m) return p.desc ? <Text style={st.desc}>{p.desc}</Text> : null;
                  return (
                    <View testID="piece-meaning">
                      {m.d ? (
                        <View style={st.mBox}>
                          <Text style={st.mHead}>{m.dk === 'tr' ? t('박물관 설명 (우리말로 옮김)') : t('박물관 설명')}</Text>
                          <Text style={st.mText}>{m.d}</Text>
                          <Text style={st.mSrc}>{t('출처')}: {m.ds}</Text>
                        </View>
                      ) : null}
                      {(m.w || []).length ? (
                        <View style={[st.mBox, st.mWish]}>
                          <Text style={st.mHead}>{t('유물에 담긴 뜻')}</Text>
                          {m.w.map((id) => {
                            const f = MOTIF[id];
                            if (!f) return null;
                            return (
                              <Text key={id} style={st.mText}>
                                <Text style={{ fontWeight: '800' }}>{f.n}</Text>
                                {' — '}
                                {f.m}
                                <Text style={[st.mSrcIn, f.u ? st.mLink : null]} onPress={f.u ? () => Linking.openURL(f.u) : undefined}>
                                  {'  ' + f.s + (f.u ? ' ↗' : '')}
                                </Text>
                              </Text>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
                <View style={st.story} testID="piece-story">
                  <Text style={st.storyWho}>{t('풍이의 설명')}</Text>
                  {pieceStory(p).map((l, i) => (
                    <Text key={i} style={st.storyLine}>
                      {l}
                    </Text>
                  ))}
                </View>
                <Text style={st.lic}>{p.abroad ? t('사진: {a} · CC0(누구나 자유롭게 쓸 수 있음) · 해외에 있는 우리 유물', { a: t(p.by) }) : t('사진: {a} · 공공누리 제1유형(출처 표시)', { a: t(p.by) })}</Text>
                <View style={{ gap: 8, marginTop: 12 }}>
                  {onTransform && <SealButton label={t('이 유물로 물건 만들기')} onPress={() => onTransform(k)} />}
                  <SealButton label={t('박물관 원본 페이지 열기')} variant="paper" onPress={() => Linking.openURL(p.page)} />
                  {count > 1 && !gift ? (
                    <SealButton
                      label={t('친구와 유물 바꾸기 (답례 받기)')}
                      variant="paper"
                      onPress={() => {
                        if (giveAway(k)) setGift(giftUrl(k, '', true));
                      }}
                    />
                  ) : null}
                  {count > 1 && !gift ? (
                    <SealButton
                      label={t('겹친 유물 친구에게 선물하기 (×{n})', { n: count })}
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
                        <Text style={st.desc}>{t('이 QR이나 링크를 친구에게 보내면 이 유물이 친구 도감으로 가요.')}</Text>
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
  const [col, setCol] = useState(null);
  const [q, setQ] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [region, setRegion] = useState(null);
  const [open, setOpen] = useState(null);
  const owned = store.owned || {};
  const ownedN = Object.keys(owned).length;
  const list = useMemo(() => {
    let l = PIECES;
    if (slot) l = l.filter((p) => p.slots.includes(slot));
    if (power) l = l.filter((p) => p.power === power);
    if (col) l = l.filter((p) => p.col === col);
    const qq = q.trim().toLowerCase().replace(/\s+/g, '');
    if (qq) {
      l = l.filter((p) =>
        [p.name, p.en, p.era, p.use, p.no, p.from]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().replace(/\s+/g, '').includes(qq))
      );
    }
    if (onlyMine) l = l.filter((p) => owned[p.k]);
    if (region) l = l.filter((p) => regionOf(p) === region);
    // 모은 것 먼저, 그다음 귀한 순
    return [...l].sort((a, b) => (owned[b.k] ? 1 : 0) - (owned[a.k] ? 1 : 0) || b.rare - a.rare);
  }, [slot, power, col, q, onlyMine, region, store]);
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
      { id: 'eras', icon: '⌛', name: '시간 여행자', note: '서로 다른 시대 6곳의 조각 모으기', cur: eras.size, max: 6 },
      { id: 'powers', icon: '✦', name: '재료 장인', note: '흙·쇠·돌·옥·나무·천·종이·금·뼈 9가지 재료 모으기', cur: powers.size, max: 9 },
      { id: 'rare', icon: '★', name: '보물 사냥꾼', note: '「아주 귀함」 조각 3개 모으기', cur: veryRare, max: 3 },
      { id: 'palace', icon: '⛩', name: '궁궐 손님', note: '국립고궁박물관 조각 10개 모으기', cur: palace, max: 10 },
      { id: 'crafts', icon: '⚙', name: '물건 장인', note: '유물로 오늘의 물건 5개 만들어 담기', cur: (store.crafts || []).length, max: 5 },
      { id: 'hundred', icon: '百', name: '백 조각', note: '조각 100개 모으기', cur: mine.length, max: 100 },
      { id: 'abroad', icon: '✈', name: '먼 길 온 유물', note: '바다 건너 해외 박물관에 있는 우리 유물 조각 5개 모으기', cur: mine.filter((p) => p.abroad).length, max: 5 },
      (() => {
        const se = currentSeries();
        return { id: 'series', icon: '月', name: '이달의 시리즈', note: t('「{a}」 유물 {n}점 모으기', { a: t(se.name), n: Math.min(20, se.pool.length) }), raw: true, cur: se.pool.filter((p) => owned[p.k]).length, max: Math.min(20, se.pool.length) };
      })(),
      { id: 'scan', icon: '⌕', name: '진짜 유물 탐정', note: '박물관에서 소장품번호로 진짜 유물 3개 찾기', cur: (store.claimed || []).filter((c) => String(c).startsWith('scan:')).length, max: 3 },
      { id: 'streak', icon: '◔', name: '이어 오기', note: '오늘의 보따리를 7일 이어 받기', cur: dailyState().streak, max: 7 },
      { id: 'colors', icon: '◐', name: '빛깔 모으기', note: '초록·파랑·하양·금빛·빨강·회색·검정 7가지 빛깔 조각 모으기', cur: new Set(mine.map((p) => p.col).filter((c) => c && c !== '갈색')).size, max: 7 },
      { id: 'places', icon: '⛰', name: '나들이꾼', note: '서로 다른 고장에서 나온 조각 5곳 모으기', cur: new Set(mine.filter((p) => p.from).map((p) => p.from.split(' - ')[0])).size, max: 5 },
    ];
  }, [store]);

  const header = (
    <View>
      <ScreenHeader title={t('유물 도감')} sub={t('실제 유물 {n}점 중 {m}점을 모았어요', { n: PIECES.length, m: ownedN })} onBack={() => navigation.goBack()} />
        <WhyBox style={{ marginTop: 8 }} text={t('받은 유물을 모두 모아 보는 곳이에요. 유물을 누르면 박물관 설명과 그 유물에 담긴 뜻(출처 링크)이 나오고, 거기서 오늘 쓰는 물건으로 만들 수 있어요.')} />
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
              <Text style={[st.goalNote, done && { color: '#ffffffcc' }]} numberOfLines={3}>
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
          ['pieces', t('유물')],
          ['map', t('우리 땅 지도')],
          ['museum', t('나의 박물관 →')],
        ].map(([id, label]) => (
          <Pressable key={id} onPress={() => (id === 'museum' ? navigation.navigate('Museum') : setTab(id))} style={[st.tab, tab === id && st.tabOn]}>
            <Text style={[st.tabTxt, tab === id && st.tabTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'map' && (
        <View style={st.mapWrap} testID="region-map">
          <Text style={st.mapNote}>{t('유물이 땅속에서 나온 곳이에요. 칸을 누르면 그곳 유물만 볼 수 있어요.')}</Text>
          <View style={[st.map, { height: 6 * 74 }]}>
            {REGIONS.map((g) => {
              const all = PIECES.filter((p) => regionOf(p) === g.id);
              const mine = all.filter((p) => owned[p.k]).length;
              const heat = Math.min(1, all.length / 60);
              return (
                <Pressable
                  key={g.id}
                  accessibilityLabel={t(g.id)}
                  disabled={!all.length}
                  onPress={() => {
                    setRegion(g.id);
                    setTab('pieces');
                  }}
                  style={[st.tile, { left: g.c * 78, top: g.r * 74, backgroundColor: all.length ? `rgba(185,120,26,${0.18 + heat * 0.7})` : '#e9e6df' }]}
                >
                  <Text style={[st.tileName, heat > 0.5 && { color: '#fff' }]}>{t(g.short)}</Text>
                  <Text style={[st.tileNum, heat > 0.5 && { color: '#fff' }]}>{all.length ? `${mine}/${all.length}` : '—'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      {tab === 'pieces' && region ? (
        <Pressable onPress={() => setRegion(null)} style={[st.chip, st.chipOn, { alignSelf: 'flex-start', marginTop: 8 }]}>
          <Text style={[st.chipTxt, st.chipTxtOn]}>{t('나온 곳')}: {t(region)} ✕</Text>
        </Pressable>
      ) : null}
      {tab === 'pieces' && (
        <>
          <View style={st.searchRow}>
            <Text style={st.searchIcon}>⌕</Text>
            <TextInput
              testID="dex-search"
              value={q}
              onChangeText={setQ}
              placeholder={t('이름·시대·쓰임으로 찾기 (예: 호랑이, 신라, 연적)')}
              placeholderTextColor="#8a8178"
              style={st.searchInput}
              accessibilityLabel={t('이름으로 찾기')}
            />
            {q ? (
              <Pressable onPress={() => setQ('')} accessibilityLabel={t('지우기')} hitSlop={10}>
                <Text style={st.searchIcon}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          {q.trim() ? <Text style={st.searchCount}>{t('{n}개 찾았어요').replace('{n}', String(list.length))}</Text> : null}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
            <Text style={[st.chipTxt, { alignSelf: 'center', marginRight: 2 }]}>{t('색으로 찾기')}</Text>
            {PIECE_COLORS.map(([c, hex]) => (
              <Pressable key={c} accessibilityLabel={t(c)} onPress={() => setCol(col === c ? null : c)} style={[st.chip, col === c && st.chipOn, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: hex, borderWidth: 1, borderColor: '#00000033' }} />
                <Text style={[st.chipTxt, col === c && st.chipTxtOn]}>{t(c)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {ownedN === 0 && (
            <View style={st.empty}>
              <Text style={st.emptyTxt}>{t('아직 모은 유물이 없어요. 첫 보따리를 풀어 볼까요?')}</Text>
              <SealButton label={t('첫 보따리 받기')} onPress={() => navigation.navigate('Pack')} />
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={st.safe}>
      <FlatList
        data={tab === 'map' ? [] : list}
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
              accessibilityLabel={mine ? pieceName(p) : t('아직 못 모은 유물')}
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
            navigation.navigate('Craft', { k });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  framesNote: { fontSize: 15, color: colors.muted, marginTop: 12, lineHeight: 22 },
  framesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  frameCard: { borderRadius: 14, padding: 12, minHeight: 96, justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent', opacity: 0.78 },
  frameMade: { borderColor: '#f2c75c', opacity: 1 },
  frameKind: { fontSize: 12, color: '#ffffffaa' },
  frameName: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  frameStamp: { fontSize: 12, color: '#ffffff88', marginTop: 8 },
  frameStampOn: { color: '#f2c75c', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginHorizontal: 16, paddingHorizontal: 12, borderRadius: 22, backgroundColor: '#fffaf2', borderWidth: 1, borderColor: '#d9cbb6', gap: 8 },
  searchIcon: { fontSize: 18, color: '#6b5d4f' },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10, color: '#2a221c', outlineStyle: 'none' },
  searchCount: { marginTop: 6, marginHorizontal: 20, fontSize: 14, color: '#6b5d4f' },
  mapWrap: { marginTop: 12, alignItems: 'center', paddingBottom: 30 },
  mapNote: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 10 },
  map: { width: 4 * 78, position: 'relative' },
  tile: { position: 'absolute', width: 72, height: 68, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00000014' },
  tileName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  tileNum: { fontSize: 11, color: colors.ink },
  story: { marginTop: 10, backgroundColor: '#fbf3e2', borderRadius: 12, padding: 10, gap: 3, borderLeftWidth: 4, borderLeftColor: '#b9781a' },
  storyWho: { fontSize: 12, fontWeight: '700', color: '#b9781a' },
  storyLine: { fontSize: 14, color: '#1b2227', lineHeight: 21 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 16, paddingBottom: 60, maxWidth: 900, width: '100%', alignSelf: 'center' },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.borderSoft, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 8, backgroundColor: colors.hwang },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  goals: { gap: 8, paddingTop: 12 },
  goal: { width: 136, backgroundColor: colors.paper, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.borderSoft },
  goalDone: { backgroundColor: '#b9781a', borderColor: '#b9781a' },
  goalIc: { fontSize: 18, color: '#b9781a' },
  goalName: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 2 },
  goalNote: { fontSize: 11, lineHeight: 15, color: colors.muted, marginTop: 3, height: 45, overflow: 'hidden' },
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
  mBox: { marginTop: 10, backgroundColor: '#f4f1ea', borderRadius: 12, padding: 12, gap: 5 },
  mWish: { backgroundColor: '#eef4ee', borderLeftWidth: 4, borderLeftColor: '#3f7a52' },
  mHead: { fontSize: 13, fontWeight: '800', color: '#3b3127' },
  mText: { fontSize: 14, color: '#1b2227', lineHeight: 22 },
  mSrc: { fontSize: 11, color: colors.muted },
  mSrcIn: { fontSize: 11, color: colors.muted },
  mLink: { textDecorationLine: 'underline', color: '#3f7a52' },
  giftBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#f6f2ea', borderRadius: 12, padding: 8 },
  work: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: 14, padding: 10, marginTop: 10, borderWidth: 1, borderColor: colors.borderSoft },
  workImgs: { flexDirection: 'row', width: 120, flexWrap: 'wrap' },
  workImg: { width: 40, height: 40 },
  workTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  workMeta: { fontSize: 12, color: colors.muted, marginTop: 3 },
  del: { fontSize: 12, color: colors.accent },
});
