import React from 'react';
import { View, StyleSheet } from 'react-native';

// 지금 맞춰야 할 진법이 완성되면 어떤 모양이 되는지 미리 보여주는 작은 "정답 그림".
// formation.positions(0~1 비율 좌표)를 작은 박스 크기에 맞게 그대로 축소해서 점으로 찍는다.
export default function FormationPreview({ positions, color, size = 72 }) {
  const dot = Math.max(5, Math.round(size * 0.09));
  return (
    <View style={[styles.box, { width: size, height: size, borderColor: color }]}>
      {positions.map((p, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              left: p.x * size - dot / 2,
              top: p.y * size - dot / 2,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dot: { position: 'absolute' },
});
