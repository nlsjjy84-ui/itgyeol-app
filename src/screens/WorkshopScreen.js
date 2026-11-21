// 작업대 — 내가 모은 조각으로 합체하거나(여러 조각 → 하나), 변형한다(조각 하나 → 새 모양).
// 틀(설계도)을 고르면 자리마다 조각이 자동으로 들어가고, 자리를 눌러 다른 조각으로 바꿀 수 있다.
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image, SafeAreaView, useWindowDimensions, Modal, FlatList } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import HapcheStage from '../components/HapcheStage';
import FreeBuilder from '../components/FreeBuilder';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { usePieces } from '../utils/pieceStore';
import { PIECE_BY_K } from '../data/pieces';
import { FRAMES, TRANSFORMS, FRAME_BY_ID, SLOT_INFO } from '../data/frames';
import { autoAssign, buildTimeline } from '../utils/hapche';

function uniqSlots(frame) {
  // 왼쪽·오른쪽처럼 같은 자리가 여럿이면 하나로 묶어 보여 준다(같은 조각을 거울처럼 함께 쓴다)
  const seen = new Set();
  return frame.slots.filter((s) => {
    if (seen.has(s.slot)) return false;
    seen.add(s.slot);
    return true;
  });
}

export default function WorkshopScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const params = route.params || {};
  const [mode, setMode] = useState(params.mode === 'transform' ? 'transform' : params.mode === 'free' ? 'free' : 'hapche');
  const [frameId, setFrameId] = useState(params.mode === 'transform' ? 'rocket' : 'guardian');
  const [assign, setAssign] = useState({});
  const [picking, setPicking] = useState(null); // 슬롯 key
  const ownedKeys = useMemo(() => (store.order || []).filter((k) => PIECE_BY_K[k]), [store]);
  const frame = FRAME_BY_ID[frameId];
  useEffect(() => {
    if (!ownedKeys.length) return;
    if (mode === 'transform') setAssign((a) => autoAssign(frameId, ownedKeys, { core: params.core && PIECE_BY_K[params.core] ? params.core : a.core }));
    else setAssign(autoAssign(frameId, ownedKeys));
  }, [frameId, ownedKeys.length, mode]);
  const tl = useMemo(() => (Object.keys(assign).length ? buildTimeline(frameId, assign, { seed: 7, scene: params.scene || '' }) : null), [frameId, assign]);
  const list = mode === 'transform' ? TRANSFORMS : FRAMES;
  const stage = Math.min(width - 32, 460);

  const setSlot = (key, k) => {
    const sp = frame.slots ? frame.slots.find((s) => s.key === key) : null;
    const next = { ...assign, [key]: k };
    // 짝 자리(왼쪽·오른쪽)는 같이 바꾼다
    if (sp) frame.slots.filter((o) => o.slot === sp.slot && o.key !== key).forEach((o) => (next[o.key] = k));
    setAssign(next);
  };

  if (!ownedKeys.length) {
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.wrap}>
          <ScreenHeader title={t('합체 작업대')} sub={t('조각이 있어야 합체할 수 있어요')} onBack={() => navigation.goBack()} />
          <View style={st.empty}>
            <Text style={st.emptyTxt}>{t('아직 모은 조각이 없어요. 첫 보따리를 풀어 볼까요?')}</Text>
            <SealButton label={t('첫 보따리 받기')} onPress={() => navigation.navigate('Pack')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const pickSpec = picking ? (mode === 'transform' ? { slot: '몸통' } : frame.slots.find((s) => s.key === picking)) : null;
  const pickList = pickSpec
    ? [...ownedKeys].sort((a, b) => {
        const pa = PIECE_BY_K[a];
        const pb = PIECE_BY_K[b];
        const sa = pa.slots[0] === pickSpec.slot ? 2 : pa.slots.includes(pickSpec.slot) ? 1 : 0;
        const sb = pb.slots[0] === pickSpec.slot ? 2 : pb.slots.includes(pickSpec.slot) ? 1 : 0;
        return sb - sa;
      })
    : [];
  const cols = width > 600 ? 5 : 3;
  const cell = (Math.min(width, 600) - 48) / cols;

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('합체 작업대')} sub={t('모은 조각 {n}개로 새 작품을 만들어요', { n: ownedKeys.length })} onBack={() => navigation.goBack()} />
        <View style={st.modeRow}>
          {[
            ['hapche', t('합체 — 여러 조각을 하나로')],
            ['transform', t('변형 — 조각 하나로 새 모양')],
            ['free', t('자유 합체 — 내 마음대로')],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => {
                play('tap');
                setMode(id);
                if (id !== 'free') setFrameId(id === 'transform' ? 'rocket' : 'guardian');
              }}
              style={[st.mode, mode === id && st.modeOn]}
            >
              <Text style={[st.modeTxt, mode === id && st.modeTxtOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {mode === 'free' ? (
          <FreeBuilder ownedKeys={ownedKeys} size={stage} onDone={(layout) => navigation.navigate('Movie', { frameId: 'free', assign: {}, layout, seed: Math.floor(Math.random() * 99999) + 1, scene: params.scene || '' })} />
        ) : (
        <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.frames}>
          {list.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => {
                play('tap');
                setFrameId(f.id);
              }}
              style={[st.frame, { backgroundColor: f.bg }, frameId === f.id && st.frameOn]}
            >
              <Text style={st.frameKind}>{t(f.kind)}</Text>
              <Text style={st.frameName}>{t(f.name)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={st.desc}>{t(frame.desc)}</Text>
        {tl && <HapcheStage tl={tl} size={stage} autoPlay={false} sound={false} showSubs={false} />}
        <Text style={st.h}>{mode === 'transform' ? t('변형할 조각') : t('자리마다 들어갈 조각 — 눌러서 바꿔요')}</Text>
        <View style={st.slots}>
          {(mode === 'transform' ? [{ key: 'core', slot: '몸통' }] : uniqSlots(frame)).map((sp) => {
            const k = assign[sp.key];
            const p = PIECE_BY_K[k];
            const twin = mode !== 'transform' && frame.slots.filter((o) => o.slot === sp.slot).length > 1;
            return (
              <Pressable key={sp.key} style={st.slot} onPress={() => setPicking(sp.key)}>
                {p ? <Image source={p.img} style={st.slotImg} resizeMode="contain" /> : <View style={st.slotImg} />}
                <View style={{ flex: 1 }}>
                  <Text style={st.slotName}>
                    {mode === 'transform' ? t('변형할 유물') : `${(SLOT_INFO[sp.slot] || {}).icon} ${t(sp.slot)}${twin ? ' ×' + frame.slots.filter((o) => o.slot === sp.slot).length : ''}`}
                  </Text>
                  <Text style={st.slotPiece} numberOfLines={1}>
                    {p ? p.name : t('비어 있음')}
                  </Text>
                </View>
                <Text style={st.change}>{t('바꾸기')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: 10, marginTop: 14 }}>
          <SealButton
            label={mode === 'transform' ? t('변형!') : t('합체!')}
            sound="drum"
            onPress={() => navigation.navigate('Movie', { frameId, assign, seed: Math.floor(Math.random() * 99999) + 1, scene: params.scene || '' })}
          />
          <SealButton label={t('자동으로 다시 채우기')} variant="paper" onPress={() => setAssign(autoAssign(frameId, [...ownedKeys].sort(() => Math.random() - 0.5)))} />
          <SealButton label={t('조각 더 받기')} variant="ink" onPress={() => navigation.navigate('Pack')} />
        </View>
        </>
        )}
      </ScrollView>
      {picking && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPicking(null)}>
          <Pressable style={st.dim} onPress={() => setPicking(null)}>
            <Pressable style={st.sheet} onPress={() => {}}>
              <Text style={st.sheetH}>{t('{a} 자리에 넣을 조각', { a: t(pickSpec.slot) })}</Text>
              <FlatList
                data={pickList}
                numColumns={cols}
                key={cols}
                keyExtractor={(k) => k}
                renderItem={({ item: k }) => {
                  const p = PIECE_BY_K[k];
                  const fit = p.slots.includes(pickSpec.slot);
                  return (
                    <Pressable
                      style={[st.pick, { width: cell, borderColor: fit ? colors.hwang : colors.borderSoft }]}
                      onPress={() => {
                        play('clank');
                        setSlot(picking, k);
                        setPicking(null);
                      }}
                    >
                      <Image source={p.img} style={{ width: cell - 16, height: cell - 16 }} resizeMode="contain" />
                      <Text style={st.pickName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {fit && <Text style={st.fit}>{t('딱 맞음')}</Text>}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 16, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mode: { flex: 1, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  modeOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  modeTxt: { fontSize: 13, color: colors.ink, textAlign: 'center' },
  modeTxtOn: { color: colors.baek, fontWeight: '700' },
  frames: { gap: 8, paddingVertical: 12 },
  frame: { width: 108, height: 70, borderRadius: 12, padding: 8, justifyContent: 'flex-end', borderWidth: 3, borderColor: 'transparent' },
  frameOn: { borderColor: '#f0c45a' },
  frameKind: { fontSize: 10, color: '#ffffffb0' },
  frameName: { fontSize: 14, color: '#fff', fontWeight: '700' },
  desc: { fontSize: 14, color: colors.ink, marginBottom: 10, lineHeight: 20 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 14, marginBottom: 6 },
  slots: { gap: 6 },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.borderSoft },
  slotImg: { width: 52, height: 52 },
  slotName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  slotPiece: { fontSize: 12, color: colors.muted, marginTop: 2 },
  change: { fontSize: 12, color: colors.accent },
  empty: { alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.paper, borderRadius: 14, marginVertical: 10 },
  emptyTxt: { color: colors.ink, fontSize: 15, textAlign: 'center' },
  dim: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: colors.paper, borderRadius: 18, maxHeight: '85%', width: '100%', maxWidth: 620, alignSelf: 'center', padding: 12 },
  sheetH: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  pick: { margin: 4, borderWidth: 2, borderRadius: 12, alignItems: 'center', padding: 4, backgroundColor: '#f6f2ea' },
  pickName: { fontSize: 11, color: colors.ink, marginTop: 2 },
  fit: { position: 'absolute', top: 4, right: 4, fontSize: 9, color: '#1b2227', backgroundColor: '#f0c45a', paddingHorizontal: 4, borderRadius: 5, overflow: 'hidden' },
});
