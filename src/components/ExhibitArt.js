// 전시 신청 작품 그림 — 유물로 만든 오늘의 물건이면 그 유물 사진, 예전 놀이 기록 작품이면 조각보.
// 유물 신청은 코드에 유물 번호가 들어 있다(R-<유물>-<물건 순번>) — 서버가 코드만 그대로 돌려줘도 그림을 다시 찾는다.
import React from 'react';
import { View, Image } from 'react-native';
import Text from '../ui/Text';
import Jogakbo from './Jogakbo';
import { PIECE_BY_K } from '../data/pieces';
import { craftIdeas } from '../utils/craft';
import { pieceName } from '../utils/pieceName';
import { t } from '../i18n';

export function relicCode(k, i) {
  return `R-${k}-${i}`;
}

export function parseRelicCode(code) {
  const m = /^R-(.+)-(\d+)$/.exec(String(code || ''));
  if (!m || !PIECE_BY_K[m[1]]) return null;
  const r = craftIdeas(m[1]);
  const c = r.crafts ? r.crafts[Number(m[2])] : null;
  return { k: m[1], p: PIECE_BY_K[m[1]], to: c ? c.to : '' };
}

export default function ExhibitArt({ entry, size = 104, caption = false, light = false }) {
  const r = entry ? parseRelicCode(entry.code) : null;
  if (r) {
    return (
      <View style={{ width: size, alignItems: 'center' }}>
        <Image source={r.p.img} style={{ width: size, height: size }} resizeMode="contain" />
        {caption ? (
          <Text style={{ fontSize: Math.max(11, size * 0.06), color: light ? '#f6e7c4' : '#2a241c', fontWeight: '700', textAlign: 'center', marginTop: 4 }} numberOfLines={2}>
            {pieceName(r.p)}{r.to ? ' → ' + t(r.to) : ''}
          </Text>
        ) : null}
      </View>
    );
  }
  return entry && entry.attempts && entry.attempts.length ? <Jogakbo attempts={entry.attempts} size={size} /> : null;
}
