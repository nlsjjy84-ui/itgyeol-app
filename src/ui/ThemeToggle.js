import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import Text from './Text';
import { colors, getThemeMode } from '../theme';
import { toggleTheme } from '../utils/themeToggle';
import { t } from '../i18n';

// 라이트 ↔ 다크 전환 버튼. 해/달 그림을 쓴다.
export default function ThemeToggle({ style }) {
  const dark = getThemeMode() === 'dark';
  const [note, setNote] = useState('');
  async function onPress() {
    const applied = await toggleTheme();
    if (!applied) setNote(t('앱을 다시 켜면 적용돼요'));
  }
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={dark ? t('라이트 모드로 바꾸기') : t('다크 모드로 바꾸기')}
        style={styles.btn}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          {dark ? (
            <>
              <Circle cx="12" cy="12" r="4.5" fill={colors.hwang} />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <Line
                  key={a}
                  x1={12 + Math.cos((a * Math.PI) / 180) * 7.5}
                  y1={12 + Math.sin((a * Math.PI) / 180) * 7.5}
                  x2={12 + Math.cos((a * Math.PI) / 180) * 10}
                  y2={12 + Math.sin((a * Math.PI) / 180) * 10}
                  stroke={colors.hwang}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
            </>
          ) : (
            <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill={colors.cheong} />
          )}
        </Svg>
        <Text style={styles.label}>{dark ? t('라이트') : t('다크')}</Text>
      </Pressable>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  label: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
  note: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' },
});
