import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from './Text';
import { colors, fonts } from '../theme';
import { play } from '../utils/sound';
import { t as i18nT } from '../i18n';

// 판 안의 놀이 고르기 — 예전에는 옆으로 밀어야 보이는 한 줄이라 12개 중 4개만 보였다.
// 이제 바둑판처럼 한눈에 다 보이고, 놀이를 시작하면 한 줄로 접혀 놀이 마당이 위로 올라온다.
// items: [{ key, tag, name }]
export default function GamePicker({ items, active, onPick, collapsed, onExpand, cols = 3, accent }) {
  const [w, setW] = useState(0);
  const gap = 8;
  const tileW = w ? Math.floor((w - gap * (cols - 1)) / cols) : undefined;
  const on = accent || colors.accent;
  const cur = items[active] || items[0];

  if (collapsed) {
    return (
      <View style={st.bar}>
        <View style={[st.seal, { backgroundColor: on }]}>
          <Text style={st.sealText} numberOfLines={1}>{i18nT('지금')}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {cur.tag ? <Text style={st.barTag} numberOfLines={1}>{i18nT(cur.tag)}</Text> : null}
          <Text style={st.barName} numberOfLines={1}>{i18nT(cur.name)}</Text>
        </View>
        <Pressable
          onPress={() => { play('tap'); onExpand && onExpand(); }}
          hitSlop={8}
          style={({ pressed }) => [st.change, pressed && { opacity: 0.7 }]}
        >
          <Text style={st.changeText}>{i18nT('다른 놀이 고르기')} ▾</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={st.grid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {items.map((g, i) => {
        const sel = i === active;
        return (
          <Pressable
            key={g.key}
            onPress={() => { play('tap'); onPick(i); }}
            style={({ pressed }) => [
              st.tile,
              tileW ? { width: tileW } : { flexBasis: `${Math.floor(100 / cols) - 3}%` },
              sel && { backgroundColor: on, borderColor: on },
              pressed && { transform: [{ translateY: 1 }] },
            ]}
          >
            {g.tag ? (
              <Text style={[st.tag, sel && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                {i18nT(g.tag)}
              </Text>
            ) : null}
            <Text style={[st.name, sel && { color: '#fff' }]} numberOfLines={2}>
              {i18nT(g.name)}
            </Text>
            {sel ? <View style={st.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignSelf: 'stretch' },
  tile: {
    minHeight: 58,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
  tag: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  name: { fontSize: 14, color: colors.ink, fontFamily: fonts.serifBold, textAlign: 'center', lineHeight: 18 },
  dot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 1, backgroundColor: '#fff' },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.paper,
    marginBottom: 10,
  },
  seal: { borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },
  sealText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  barTag: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 1 },
  barName: { fontSize: 15, color: colors.ink, fontFamily: fonts.serifBold },
  change: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 3, borderWidth: 1, borderColor: colors.ink },
  changeText: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
});
