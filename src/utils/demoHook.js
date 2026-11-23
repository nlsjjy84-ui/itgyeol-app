// 시연 영상 찍을 때만 쓰는 손잡이 — 주소에 ?demo=1 이 있을 때만 window.__demoWin 을 연다.
// 영상은 판을 실제로 조금 놀다가 「깬 장면」으로 넘어가 편집한다(일반 사용자는 이 주소를 쓰지 않는다).
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const on = () => Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]demo=1\b/.test(window.location.search || '') ;

export function useDemoWin(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on()) return undefined;
    window.__demoWin = () => ref.current && ref.current();
    return () => {
      if (window.__demoWin) delete window.__demoWin;
    };
  }, []);
}
