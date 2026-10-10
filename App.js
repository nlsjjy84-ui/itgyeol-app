import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold, NanumMyeongjo_800ExtraBold } from '@expo-google-fonts/nanum-myeongjo';
import { EastSeaDokdo_400Regular } from '@expo-google-fonts/east-sea-dokdo';
import { colors, applyThemeMode, THEME_KEY } from './src/theme';

const CONSENT_KEY = 'itgyeol_consent_v1';

// 샌드박스 웹뷰(아티팩트 미리보기 등) 안에서는 localStorage 접근이 막혀
// AsyncStorage가 영원히 pending 상태로 남을 수 있어, 타임아웃을 둬서 항상 빠져나오게 함
function safeGetItem(key, timeoutMs = 1200) {
  return Promise.race([
    AsyncStorage.getItem(key).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export default function App() {
  const [agreed, setAgreed] = useState(null); // null = loading
  const [themeReady, setThemeReady] = useState(false);
  // 서체(명조·붓글씨)를 불러온다. 오래 걸리거나 실패해도 앱은 기본 글꼴로 계속 열린다.
  const [fontsLoaded, fontError] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    NanumMyeongjo_800ExtraBold,
    EastSeaDokdo_400Regular,
  });
  const [fontWait, setFontWait] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFontWait(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    // 사용자가 직접 고른 라이트/다크가 있으면 그걸 쓰고, 없으면 기기 설정을 따른다(theme.js 기본값).
    safeGetItem(THEME_KEY).then((v) => {
      if (v === 'light' || v === 'dark') applyThemeMode(v);
      if (mounted) setThemeReady(true);
    });
    safeGetItem(CONSENT_KEY).then((v) => {
      if (mounted) setAgreed(v === 'yes');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAgree = () => {
    try {
      AsyncStorage.setItem(CONSENT_KEY, 'yes').catch(() => {});
    } catch (e) {
      // 저장 실패해도 이번 세션은 계속 진행
    }
    setAgreed(true);
  };

  if (!themeReady || agreed === null || (!fontsLoaded && !fontError && fontWait)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  // 화면 파일은 테마가 정해진 다음에 처음 불러온다(그래야 모든 스타일에 선택한 색이 들어간다).
  const AppRoot = require('./src/AppRoot').default;
  return <AppRoot agreed={agreed} onAgree={handleAgree} />;
}
