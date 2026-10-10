import { Platform, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_KEY, getThemeMode } from '../theme';

// 라이트 ↔ 다크를 바꾸고 저장한다. 화면 색은 앱이 켜질 때 한 번에 정해지므로 다시 불러온다.
// 반환값: 바로 적용됐으면 true, 앱을 다시 켜야 적용되면 false.
export async function toggleTheme() {
  const next = getThemeMode() === 'dark' ? 'light' : 'dark';
  try {
    await AsyncStorage.setItem(THEME_KEY, next);
  } catch (e) {
    // 저장이 안 돼도 아래에서 다시 불러온다
  }
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(THEME_KEY, next);
      window.location.reload();
      return true;
    } catch (e) {
      return false;
    }
  }
  try {
    if (DevSettings && DevSettings.reload) {
      DevSettings.reload();
      return true;
    }
  } catch (e) {
    // 개발 도구가 없는 빌드
  }
  return false;
}
