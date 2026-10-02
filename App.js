import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ConsentScreen from './src/screens/ConsentScreen';
import HomeScreen from './src/screens/HomeScreen';
import JinbeopScreen from './src/screens/JinbeopScreen';
import PrintScreen from './src/screens/PrintScreen';
import PlayScreen from './src/screens/PlayScreen';
import ResultScreen from './src/screens/ResultScreen';
import { JourneyProvider } from './src/context/JourneyContext';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
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

  if (agreed === null) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {agreed ? (
        <JourneyProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Jinbeop" component={JinbeopScreen} />
              <Stack.Screen name="Print" component={PrintScreen} />
              <Stack.Screen name="Play" component={PlayScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
            </Stack.Navigator>
            <StatusBar style="dark" backgroundColor={colors.bg} />
          </NavigationContainer>
        </JourneyProvider>
      ) : (
        <ConsentScreen onAgree={handleAgree} />
      )}
    </GestureHandlerRootView>
  );
}
