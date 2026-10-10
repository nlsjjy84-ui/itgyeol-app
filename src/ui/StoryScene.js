import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Text from './Text';
import Mascot from '../components/Mascot';
import { colors } from '../theme';
import { WHO, SCENES } from '../data/story';

// 포트폴리오에 그려진 장면 그림 — 미션·결과 화면 위에 깔아 이야기의 자리를 보여 준다.
const ART = {
  gate: require('../../assets/story/gate.jpg'),
  madang: require('../../assets/story/madang.jpg'),
  byeongpung: require('../../assets/story/byeongpung.jpg'),
  banner: require('../../assets/story/banner.jpg'),
  sunset: require('../../assets/story/sunset.jpg'),
  userAB: require('../../assets/story/userA_B.jpg'),
};

// 말풍선 한 줄 — 풍이는 왼쪽, 결이는 오른쪽에서 말한다.
export function Dialogue({ lines, style }) {
  return (
    <View style={[styles.dialogue, style]}>
      {lines.map((l, i) => {
        const right = l.who === 'gyeol';
        const who = WHO[l.who];
        return (
          <View key={i} style={[styles.row, right && styles.rowRight]}>
            <Mascot which={l.who} size={38} />
            <View style={[styles.bubble, right ? styles.bubbleRight : styles.bubbleLeft, { borderColor: who.color }]}>
              <Text style={[styles.name, { color: who.color }]}>{who.name}</Text>
              <Text style={styles.text}>{l.text}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// 장면 그림 + 장소 이름 (+ 첫 대사)
export default function StoryScene({ scene, art, place, lines, hideLines, style }) {
  const def = SCENES[scene] || {};
  const img = ART[art || def.art] || ART.gate;
  const where = place || def.place;
  const talk = lines || def.lines || [];
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.artBox}>
        <Image source={img} style={styles.art} resizeMode="cover" />
        {where ? (
          <View style={styles.place}>
            <Text style={styles.placeText}>{where}</Text>
          </View>
        ) : null}
      </View>
      {!hideLines && talk.length ? <Dialogue lines={talk} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  artBox: {
    width: '100%',
    aspectRatio: 836 / 470,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.borderSoft,
  },
  art: { width: '100%', height: '100%' },
  place: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(21,27,32,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  placeText: { color: '#f3efe6', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  dialogue: { gap: 8, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowRight: { flexDirection: 'row-reverse' },
  bubble: {
    flex: 1,
    borderWidth: 1.2,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: colors.paper,
  },
  bubbleLeft: { borderBottomLeftRadius: 2 },
  bubbleRight: { borderBottomRightRadius: 2 },
  name: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 1 },
  text: { fontSize: 14, color: colors.ink, lineHeight: 21 },
});
