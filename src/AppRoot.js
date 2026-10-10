import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Hanji from './ui/Hanji';
import ConsentScreen from './screens/ConsentScreen';
import HomeScreen from './screens/HomeScreen';
import JinbeopScreen from './screens/JinbeopScreen';
import PrintScreen from './screens/PrintScreen';
import PlayScreen from './screens/PlayScreen';
import ResultScreen from './screens/ResultScreen';
import HangulScreen from './screens/HangulScreen';
import { JourneyProvider } from './context/JourneyContext';
import { colors, getThemeMode } from './theme';

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
const HangulH = withHanji(HangulScreen);

// 화면 파일들은 이 파일이 불러와질 때 처음 읽힌다 — 그 전에 App.js가 테마(라이트/다크)를 정해 둔다.
export default function AppRoot({ agreed, onAgree }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {agreed ? (
        <JourneyProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeH} />
              <Stack.Screen name="Jinbeop" component={JinbeopH} />
              <Stack.Screen name="Print" component={PrintH} />
              <Stack.Screen name="Play" component={PlayH} />
              <Stack.Screen name="Hangul" component={HangulH} />
              <Stack.Screen name="Result" component={ResultH} />
            </Stack.Navigator>
            <StatusBar style={getThemeMode() === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
          </NavigationContainer>
        </JourneyProvider>
      ) : (
        <Hanji>
          <ConsentScreen onAgree={onAgree} />
        </Hanji>
      )}
    </GestureHandlerRootView>
  );
}
