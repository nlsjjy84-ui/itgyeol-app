// 자유 합체 — 틀 없이 내 조각을 끌어다 놓고, 돌리고, 키워서 나만의 모양을 만든다(키트배싱).
// 다 만들면 그대로 합체 영상이 된다: 가장 큰 조각이 먼저 자리 잡고, 가장 위 조각이 마지막에 머리처럼 내려온다.
import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable, PanResponder, ScrollView } from 'react-native';
import Text from '../ui/Text';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { PIECE_BY_K } from '../data/pieces';

function Item({ it, k, selected, onSelect, onMove }) {
  const start = useRef({ x: 0, y: 0 });
  const live = useRef(it);
  live.current = it;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = { x: live.current.x, y: live.current.y };
        onSelect(live.current.id);
      },
      onPanResponderMove: (_, g) => onMove(live.current.id, start.current.x + g.dx / k, start.current.y + g.dy / k),
      onPanResponderRelease: () => play('clank'),
    })
  ).current;
  const p = PIECE_BY_K[it.k];
  const ar = p.ar || 1;
  const long = Math.max(ar, 1);
  const h = (it.w / long) * k;
  const w = h * ar;
  return (
    <View
      {...pan.panHandlers}
      style={{
        position: 'absolute',
        left: it.x * k - w / 2,
        top: it.y * k - h / 2,
        width: w,
        height: h,
        zIndex: it.z,
        transform: [{ rotate: `${it.rot}deg` }, { scaleX: it.flip ? -1 : 1 }],
        borderWidth: selected ? 2 : 0,
        borderColor: '#f0c45a',
        borderStyle: 'dashed',
        cursor: 'grab',
      }}
    >
      <Image source={p.img} style={{ width: '100%', height: '100%' }} resizeMode="stretch" pointerEvents="none" />
    </View>
  );
}

export default function FreeBuilder({ ownedKeys, size, onDone }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const k = size / 1000;
  const nextId = useRef(1);
  const add = (key) => {
    if (items.length >= 16) return;
    play('fly');
    const id = nextId.current++;
    const z = items.length + 1;
    setItems([...items, { id, k: key, x: 500 + ((id * 67) % 200) - 100, y: 500 + ((id * 41) % 200) - 100, w: 260, rot: 0, flip: false, z }]);
    setSel(id);
  };
  const upd = (id, f) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...f(it) } : it)));
  const move = (id, x, y) => upd(id, () => ({ x: Math.max(40, Math.min(960, x)), y: Math.max(40, Math.min(960, y)) }));
  const cur = items.find((it) => it.id === sel);
  const ctl = [
    ['＋', t('크게'), () => upd(sel, (it) => ({ w: Math.min(700, it.w * 1.15) }))],
    ['－', t('작게'), () => upd(sel, (it) => ({ w: Math.max(70, it.w / 1.15) }))],
    ['↺', t('왼쪽으로'), () => upd(sel, (it) => ({ rot: it.rot - 15 }))],
    ['↻', t('오른쪽으로'), () => upd(sel, (it) => ({ rot: it.rot + 15 }))],
    ['⇋', t('뒤집기'), () => upd(sel, (it) => ({ flip: !it.flip }))],
    ['▲', t('앞으로'), () => upd(sel, () => ({ z: Math.max(...items.map((x) => x.z)) + 1 }))],
    ['⧉', t('하나 더'), () => cur && setItems([...items, { ...cur, id: nextId.current++, x: 1000 - cur.x, flip: !cur.flip, z: cur.z }])],
    ['✕', t('빼기'), () => {
      setItems(items.filter((it) => it.id !== sel));
      setSel(null);
    }],
  ];
  return (
    <View>
      <Text style={st.lead}>{t('아래에서 조각을 눌러 무대에 올리고, 끌어서 자리를 잡아요. 누른 조각은 키우고 돌리고 뒤집을 수 있어요.')}</Text>
      <Pressable onPress={() => setSel(null)} style={[st.stage, { width: size, height: size }]}>
        {Array.from({ length: 9 }, (_, i) => (
          <View key={i} style={[st.grid, { top: (i + 1) * (size / 10) }]} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <View key={'v' + i} style={[st.gridV, { left: (i + 1) * (size / 10) }]} />
        ))}
        {items.map((it) => (
          <Item key={it.id} it={it} k={k} selected={it.id === sel} onSelect={setSel} onMove={move} />
        ))}
        {!items.length && (
          <View style={st.emptyBox} pointerEvents="none">
            <Text style={st.emptyTxt}>{t('조각을 올려 보세요')}</Text>
          </View>
        )}
      </Pressable>
      {cur ? (
        <View style={st.ctlRow}>
          {ctl.map(([ic, label, fn]) => (
            <Pressable key={label} onPress={() => { play('tap'); fn(); }} style={st.ctl} accessibilityLabel={label}>
              <Text style={st.ctlIc}>{ic}</Text>
              <Text style={st.ctlTxt}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={st.h}>{t('내 조각 {n}개 — 눌러서 올리기', { n: ownedKeys.length })}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tray}>
        {ownedKeys.map((key, i) => (
          <Pressable key={key} testID={'tray-' + i} accessibilityLabel={PIECE_BY_K[key].name} onPress={() => add(key)} style={st.trayItem}>
            <Image source={PIECE_BY_K[key].img} style={st.trayImg} resizeMode="contain" />
            <Text style={st.trayName} numberOfLines={1}>
              {PIECE_BY_K[key].name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ gap: 10, marginTop: 12 }}>
        <SealButton label={t('합체!')} sound="drum" disabled={items.length < 2} onPress={() => onDone(items.map(({ k: key, x, y, w, rot, flip, z }) => ({ k: key, x, y, w, rot, flip, z })))} />
        {items.length < 2 ? <Text style={st.note}>{t('조각을 두 개 이상 올리면 합체할 수 있어요')}</Text> : null}
        {items.length ? <SealButton label={t('모두 내리기')} variant="paper" onPress={() => { setItems([]); setSel(null); }} /> : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  lead: { fontSize: 14, color: colors.ink, lineHeight: 20, marginBottom: 8 },
  stage: { alignSelf: 'center', backgroundColor: '#22303a', borderRadius: 16, overflow: 'hidden' },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#ffffff12' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#ffffff12' },
  emptyBox: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: '#ffffff88', fontSize: 15 },
  ctlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' },
  ctl: { width: 64, alignItems: 'center', paddingVertical: 6, borderRadius: 10, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.borderSoft },
  ctlIc: { fontSize: 18, color: colors.ink },
  ctlTxt: { fontSize: 10, color: colors.muted },
  h: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12 },
  tray: { gap: 8, paddingVertical: 8 },
  trayItem: { width: 84, alignItems: 'center', backgroundColor: colors.paper, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: colors.borderSoft },
  trayImg: { width: 70, height: 70 },
  trayName: { fontSize: 10, color: colors.ink },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
