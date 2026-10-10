import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import { OHANG, ohangByKey } from '../data/formations';
import { useJourney } from '../context/JourneyContext';
import { colors } from '../theme';
import { t } from '../i18n';

// [오늘의 기운 선택 기능] 예전엔 화면마다 pickTodayOhang()을 따로 불러서 같은 "오늘의
// 기운"인데 화면마다 색이 달라 보였다 — 이제 JourneyContext가 들고 있는 값 하나를
// 모든 화면이 함께 보고, 여기서 직접 눌러서 바꿀 수 있다(안 바꾸면 기기별 랜덤 기본값).
export default function OhangPicker({ style }) {
  const { ohangKey, setOhangKey } = useJourney();
  const [open, setOpen] = useState(false);
  const ohang = ohangByKey(ohangKey);

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        style={[styles.badge, { borderColor: ohang.color }]}
        onPress={() => setOpen((v) => !v)}
        hitSlop={6}
      >
        <Text style={[styles.badgeText, { color: ohang.color }]}>
          {t('오늘의 기운')} · {ohang.label} {open ? '▾' : '▸'}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.chipRow}>
          {/* [금(金)이 비활성화처럼 보이던 문제 수정] 전에는 글자·테두리 색을 그대로
              오행 색(금=회색, 수=남색)으로 칠해서, 금(#9aa0a8)처럼 옅은 색은 흰 배경과
              대비가 약해 "눌러도 안 되는 버튼"처럼 보였다 — 5개 다 똑같이 진한
              잉크색 글자로 또렷하게 보이게 하고, 그 원소의 색은 작은 동그라미(스와치)로만
              표시한다. 선택된 것만 배경을 그 색으로 채워 구분한다. */}
          {OHANG.map((o) => {
            const active = o.key === ohangKey;
            return (
              <Pressable
                key={o.key}
                style={[
                  styles.chip,
                  active ? { backgroundColor: o.color, borderColor: o.color } : styles.chipInactive,
                ]}
                onPress={() => {
                  setOhangKey(o.key);
                  setOpen(false);
                }}
              >
                <View style={[styles.swatch, { backgroundColor: o.color }]} />
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.ink }]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
    backgroundColor: colors.paper,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  chipRow: {
    position: 'absolute',
    top: 30,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: colors.paper,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    zIndex: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    width: 190,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  chipInactive: {
    borderColor: colors.borderSoft,
    backgroundColor: colors.paper,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
});
