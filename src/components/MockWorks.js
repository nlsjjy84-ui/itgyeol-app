import React from 'react';
import { View, StyleSheet, Pressable, Image, Modal, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { MOCK_IMAGES } from '../data/mockWorks';
import { TASTE_KEYWORDS } from '../data/taste';
import { t } from '../i18n';
import { CATALOG } from './obj3d/catalog';
import { GAME_NAMES, SCENE_NAMES } from '../data/taste';
import { traitText } from '../utils/shapeDna';
import { describeShape } from '../utils/shapeStory';

// 글자는 렌더할 때 지금 언어로 만든다(예시 자료에는 물건·놀이 id와 횟수만 있다).
const kwLabel = (id) => (TASTE_KEYWORDS.find((k) => k.id === id) || {}).label || '';
function findItem(itemId) {
  for (const g of CATALOG) for (const it of g.items) if (it.id === itemId) return it;
  return null;
}
export function workTitle(w) {
  const it = findItem(w.item);
  if (!it) return w.title;
  const v = it.variants.find((x) => x.id === w.variant);
  return it.variants.length > 1 && v ? `${it.label} · ${v.label}` : it.label;
}
function workPlays(w) {
  if (!w.raw) return w.plays;
  return [
    ...w.raw.g.map(([id, n]) => t('{name} {n}번', { name: GAME_NAMES[id], n })),
    ...w.raw.s.map(([id, n]) => t('{name} {n}번', { name: t(SCENE_NAMES[id]), n })),
  ];
}
function workTraits(w) {
  // 놀이가 모양을 빚은 예시: 무엇이 어디가 됐는지(3D와 같은 계산)
  const it = findItem(w.item);
  if (w.a && it && it.shaped) {
    const attempts = w.a.map(([sceneId, formationId]) => ({ sceneId, formationId }));
    const byGame = Object.fromEntries((w.raw && w.raw.g) || []);
    return describeShape(w.item, attempts, { byGame, byScene: {} });
  }
  if (!w.raw) return w.traits || [];
  return [...w.raw.g.map(([id, n]) => traitText('g', id, n)), ...w.raw.s.map(([id, n]) => traitText('s', id, n))].filter(Boolean);
}

// 예시 작품 한 장 — 가상 기록으로 만든 모양이다. 실제 사람의 작품처럼 보이지 않게 "예시"라고 늘 적는다.
export function MockCard({ work, size = 104, onPress }) {
  return (
    <Pressable style={[st.card, { width: size }]} onPress={() => onPress && onPress(work)}>
      <View style={[st.thumb, { width: size, height: size }]}>
        <Image source={MOCK_IMAGES[work.id]} style={{ width: size - 8, height: size - 8 }} resizeMode="contain" />
      </View>
      <Text style={st.title} numberOfLines={1}>{workTitle(work)}</Text>
      <Text style={st.sub} numberOfLines={1}>{t('예시')} · {kwLabel(work.main)}</Text>
    </Pressable>
  );
}

export function MockDetail({ work, onClose }) {
  if (!work) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ gap: 8 }}>
            <View style={st.big}>
              <Image source={MOCK_IMAGES[work.id]} style={{ width: 230, height: 230 }} resizeMode="contain" />
            </View>
            <Text style={st.h}>{workTitle(work)}</Text>
            <Text style={st.badge}>{t('예시 작품 · 가상의 놀이 기록으로 빚은 모양이에요')} · #{work.code}</Text>
            <Text style={st.sec}>{t('이 모양이 나온 기록')}</Text>
            <Text style={st.body}>{workPlays(work).join(' · ')}</Text>
            {workTraits(work).length ? (
              <View style={{ gap: 2 }}>
                {workTraits(work).slice(0, 7).map((x) => (
                  <Text key={x} style={st.trait}>· {x}</Text>
                ))}
              </View>
            ) : null}
            <Text style={st.sec}>{t('닿아 있는 이야기')}</Text>
            <View style={st.tagRow}>
              {work.tags.slice(0, 8).map((x) => (
                <View key={x} style={[st.tag, x === work.main && st.tagMain]}>
                  <Text style={[st.tagTxt, x === work.main && { color: '#fff' }]}>{kwLabel(x)}</Text>
                </View>
              ))}
            </View>
            <Text style={st.note}>{t('내 작품은 내가 한 놀이의 흔적으로만 모양이 정해져요. 예시는 그저 이런 모양도 나올 수 있다는 구경거리예요.')}</Text>
            <Pressable style={st.close} onPress={onClose}>
              <Text style={st.closeTxt}>{t('닫기')}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  card: { alignItems: 'center', gap: 2 },
  thumb: { borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 12, fontWeight: '700', color: colors.ink, maxWidth: '100%' },
  sub: { fontSize: 10.5, color: colors.muted, maxWidth: '100%' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.paper, borderRadius: 20, padding: 18, width: '100%', maxWidth: 420, maxHeight: '88%', borderWidth: 1, borderColor: colors.border },
  big: { alignItems: 'center', borderRadius: 16, backgroundColor: colors.bg, paddingVertical: 8 },
  h: { fontSize: 18, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  badge: { fontSize: 11.5, color: colors.muted, textAlign: 'center' },
  sec: { fontSize: 12.5, fontWeight: '800', color: colors.accentDeep, marginTop: 4 },
  body: { fontSize: 13, color: colors.ink, lineHeight: 20 },
  trait: { fontSize: 12.5, color: colors.ink, lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 4 },
  tagMain: { backgroundColor: colors.accent, borderColor: colors.accent },
  tagTxt: { fontSize: 11.5, color: colors.ink },
  note: { fontSize: 11.5, color: colors.muted, lineHeight: 17, marginTop: 4 },
  close: { marginTop: 6, backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  closeTxt: { color: colors.onNight, fontWeight: '800' },
});
