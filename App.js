import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold, NanumMyeongjo_800ExtraBold } from '@expo-google-fonts/nanum-myeongjo';
import { EastSeaDokdo_400Regular } from '@expo-google-fonts/east-sea-dokdo';
import Hanji from './src/ui/Hanji';

import ConsentScreen from './src/screens/ConsentScreen';
import HomeScreen from './src/screens/HomeScreen';
import JinbeopScreen from './src/screens/JinbeopScreen';
import PrintScreen from './src/screens/PrintScreen';
import PlayScreen from './src/screens/PlayScreen';
import ResultScreen from './src/screens/ResultScreen';
import { JourneyProvider } from './src/context/JourneyContext';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

// 모든 화면 뒤에 한지 질감 바탕을 깐다.
const withHanji = (Screen) =>
  function HanjiScreen(props) {
    return (
      <Hanji>
        <Screen {...props} />
      </Hanji>
    );
  };
const HomeH = withHanji(HomeScreen);
const JinbeopH = withHanji(JinbeopScreen);
const PrintH = withHanji(PrintScreen);
const PlayH = withHanji(PlayScreen);
const ResultH = withHanji(ResultScreen);
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

  if (agreed === null || (!fontsLoaded && !fontError && fontWait)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {agreed ? (
        <JourneyProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeH} />
              <Stack.Screen name="Jinbeop" component={JinbeopH} />
              <Stack.Screen name="Print" component={PrintH} />
              <Stack.Screen name="Play" component={PlayH} />
              <Stack.Screen name="Result" component={ResultH} />
            </Stack.Navigator>
            <StatusBar style="dark" backgroundColor={colors.bg} />
          </NavigationContainer>
        </JourneyProvider>
      ) : (
        <Hanji><ConsentScreen onAgree={handleAgree} /></Hanji>
      )}
    </GestureHandlerRootView>
  );
}
