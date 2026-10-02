import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// 포트폴리오에 실제로 그려져 있던 캐릭터 일러스트를 그대로 가져와 쓴다 —
// 손그림 SVG로 새로 만든 버전이 아니라, 잇결 포트폴리오 PPT 안에 있던
// 수채화풍 원화(풍이=망원경을 든 탐험가, 결이=보따리를 멘 아이)를 크롭한 원본.
const MASCOT_IMAGES = {
  pung: require('../../assets/characters/pung_badge.png'),
  gyeol: require('../../assets/characters/gyeol_badge.png'),
};

const RING_COLOR = {
  pung: '#3f6f8f',
  gyeol: '#c1592f',
};

export const MASCOT_NAMES = { pung: '풍이', gyeol: '결이' };

// 잇결의 안내 캐릭터 2명.
//   풍이 — 풍물·진법 담당. 바위 위에서 망원경으로 앞을 내다보는 탐험가 모습.
//   결이 — 훈민정음·인쇄 담당. 보따리를 메고 길을 나서는 아이 모습.
export default function Mascot({ which = 'pung', size = 52 }) {
  const src = MASCOT_IMAGES[which] || MASCOT_IMAGES.pung;
  const ring = RING_COLOR[which] || RING_COLOR.pung;
  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: size / 2, borderColor: ring },
      ]}
    >
      <Image
        source={src}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#f4ede0',
  },
});
