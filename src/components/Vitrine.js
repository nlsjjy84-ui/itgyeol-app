// 박물관 진열장 한 칸 — 어두운 벽, 위에서 떨어지는 조명, 받침대 위 유물, 아래 이름표.
import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import Text from '../ui/Text';
import { t } from '../i18n';
import { pieceName } from '../utils/pieceName';

export default function Vitrine({ p, size = 160, line, onPress, testID }) {
  const img = size * 0.62;
  return (
    <Pressable onPress={onPress} style={[st.wrap, { width: size }]} testID={testID} accessibilityLabel={pieceName(p)}>
      <View style={[st.case, { height: size }]}>
        {/* 위에서 떨어지는 빛 — 옅은 원을 여러 겹 겹쳐 부드럽게 번지게 */}
        {[1.3, 1.15, 1.0, 0.86, 0.72, 0.58, 0.45].map((f, i) => (
          <View key={i} style={[st.glow, { width: size * f, height: size * f, borderRadius: size, top: -size * f * 0.42, opacity: 0.055 }]} />
        ))}
        <View style={[st.floor, { width: size * 0.9, bottom: 12 }]} />
        <Image source={p.img} style={{ width: img, height: img, marginBottom: 12 }} resizeMode="contain" />
        <View style={[st.shadow, { width: img * 0.62, bottom: 11 }]} />
        <View style={[st.plinth, { width: size * 0.82 }]} />
      </View>
      <View style={st.label}>
        <Text style={st.name} numberOfLines={2}>{pieceName(p)}</Text>
        <Text style={st.meta} numberOfLines={1}>{[t(p.era), t(p.by)].filter(Boolean).join(' · ')}</Text>
        {line ? <Text style={st.line} numberOfLines={3}>{line}</Text> : null}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 0 },
  case: { backgroundColor: '#1d1915', borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  floor: { position: 'absolute', height: 18, borderRadius: 40, backgroundColor: 'rgba(255,233,194,0.10)' },
  glow: { position: 'absolute', backgroundColor: '#ffe9c2', alignSelf: 'center' },
  shadow: { position: 'absolute', height: 7, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
  plinth: { position: 'absolute', bottom: 0, height: 12, backgroundColor: '#e9e1d2', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  label: { backgroundColor: '#f7f2e8', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 9, gap: 2, borderWidth: 1, borderTopWidth: 0, borderColor: '#e3d9c6' },
  name: { fontSize: 13, fontWeight: '800', color: '#1d1915' },
  meta: { fontSize: 11, color: '#7a6f60' },
  line: { fontSize: 12, color: '#3b3127', lineHeight: 17, marginTop: 2 },
});
