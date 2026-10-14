import React, { useEffect, useState } from 'react';
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
import TasteScreen from './screens/TasteScreen';
import GalleryScreen from './screens/GalleryScreen';
import BookScreen from './screens/BookScreen';
import ArchiveScreen from './screens/ArchiveScreen';
import ExhibitScreen from './screens/ExhibitScreen';
import KioskScreen from './screens/KioskScreen';
import { JourneyProvider, useJourney } from './context/JourneyContext';
import { colors, getThemeMode } from './theme';
import { loadLang, setLang } from './i18n';
import { loadVoice } from './utils/voice';
import { loadConsent, decided, sensesSupported, askConsent, startSensing, stopSensing } from './utils/senses';
import SenseLayer from './components/SenseLayer';

// 놀이 화면 → 판 이름. 이 화면에 있는 동안만 카메라·마이크(동의한 것)를 켠다.
const PLAY_SCENE = { Jinbeop: 'jinbeop', Print: 'print', Play: 'tbd', Hangul: 'hangul' };
import { LangContext } from './i18n/LangContext';
import './i18n/register';

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
const TasteH = withHanji(TasteScreen);
const GalleryH = withHanji(GalleryScreen);
const BookH = withHanji(BookScreen);
const ArchiveH = withHanji(ArchiveScreen);
const ExhibitH = withHanji(ExhibitScreen);
const KioskH = withHanji(KioskScreen);

// 처음 열면 "전통문화 하면 떠오르는 것" 질문부터, 한 번 답하거나 건너뛰었으면 바로 홈으로.
function Nav() {
  const { taste, book, carried, addSenses } = useJourney();
  const sceneRef = React.useRef(null);
  // 화면이 바뀔 때: 놀이 화면을 나가면 잰 값을 기록에 더하고, 놀이 화면에 들어가면 켠다(처음이면 먼저 묻는다)
  const onRoute = React.useCallback(
    (state) => {
      const route = state && state.routes && state.routes[state.index];
      const scene = route ? PLAY_SCENE[route.name] || null : null;
      if (scene === sceneRef.current) return;
      if (sceneRef.current) addSenses(stopSensing());
      sceneRef.current = scene;
      if (!scene || !sensesSupported()) return;
      if (!decided()) askConsent(() => sceneRef.current === scene && startSensing(scene));
      else startSensing(scene);
    },
    [addSenses]
  );
  if (taste === null || book === null) return null;
  // 처음이면 질문 → 그림책 프롤로그 → 홈. 질문만 끝낸 사람은 바로 프롤로그부터.
  // QR로 집에서 이어서 여는 사람은 질문·그림책을 건너뛰고 바로 홈(가져온 작품)으로.
  const first = carried ? 'Home' : !taste.done ? 'Taste' : !book.prologue ? 'Book' : 'Home';
  return (
    <NavigationContainer onStateChange={onRoute}>
      <Stack.Navigator initialRouteName={first} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Taste" component={TasteH} />
        <Stack.Screen name="Book" component={BookH} initialParams={{ part: 'prologue', then: 'Home' }} />
        <Stack.Screen name="Gallery" component={GalleryH} />
        <Stack.Screen name="Archive" component={ArchiveH} />
        <Stack.Screen name="Exhibit" component={ExhibitH} />
        <Stack.Screen name="Kiosk" component={KioskH} />
        <Stack.Screen name="Home" component={HomeH} />
        <Stack.Screen name="Jinbeop" component={JinbeopH} />
        <Stack.Screen name="Print" component={PrintH} />
        <Stack.Screen name="Play" component={PlayH} />
        <Stack.Screen name="Hangul" component={HangulH} />
        <Stack.Screen name="Result" component={ResultH} />
      </Stack.Navigator>
      <StatusBar style={getThemeMode() === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <SenseLayer />
    </NavigationContainer>
  );
}

// 화면 파일들은 이 파일이 불러와질 때 처음 읽힌다 — 그 전에 App.js가 테마(라이트/다크)를 정해 둔다.
// 언어를 바꾸면 key가 바뀌어 화면 트리를 새 언어로 다시 그린다(저장된 놀이 기록은 그대로).
export default function AppRoot({ agreed, onAgree }) {
  const [lang, setLangState] = useState(null);
  useEffect(() => {
    loadLang().then(setLangState);
    loadVoice();
    loadConsent();
  }, []);
  if (lang === null) return null;
  const change = (id) => setLangState(setLang(id));
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LangContext.Provider value={{ lang, change }}>
        {agreed ? (
          <JourneyProvider>
            <Nav key={lang} />
          </JourneyProvider>
        ) : (
          <Hanji key={lang}>
            <ConsentScreen onAgree={onAgree} />
          </Hanji>
        )}
      </LangContext.Provider>
    </GestureHandlerRootView>
  );
}
