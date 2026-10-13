import React from 'react';
import { View, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { t } from '../i18n';
import LangToggle from '../ui/LangToggle';

export default function ConsentScreen({ onAgree }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <LangToggle style={{ alignSelf: 'flex-end', marginBottom: 6 }} />
        <Text style={styles.title}>{t('시작하기 전에')}</Text>
        <Text style={styles.body}>
          {t('이 앱은 놀이 기록(어떤 놀이를 했는지, 만든 모양)만 이 기기에 남겨요. 이름이나 연락처 같은 개인 정보는 모으지 않아요.')}
        </Text>
        <Text style={styles.body}>{t('내 작품을 전시할지는 결과 화면에서 작품마다 직접 골라요. 고르지 않으면 전시되지 않아요.')}</Text>
        <Text style={styles.body}>{t('동의하시면 체험을 시작할 수 있어요.')}</Text>
        <Pressable style={styles.btn} onPress={onAgree}>
          <Text style={styles.btnText}>{t('동의하고 시작하기')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: '100%',
  },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink, marginBottom: 14 },
  body: { fontSize: 13.5, lineHeight: 21, color: colors.ink, marginBottom: 12 },
  strong: { fontWeight: '700', color: colors.accentDeep },
  btn: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
