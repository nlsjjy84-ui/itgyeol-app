import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// 스페이스바·화살표 키·엔터·문자 키(Z/X) 중 아무거나로도 조작할 수 있게 한다(웹에서만 동작).
// 고전 오락실 게임이 흔히 액션 버튼을 Z/X에 두는 것과 같은 방식 — 화살표만 쓰는 게 아니라
// 문자 키보드도 같이 활용해보자는 피드백을 반영.
const TAP_CODES = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'KeyZ', 'KeyX'];

// 좌/우 조준·이동에 화살표 키와 함께 쓸 수 있는 문자 키(왼쪽 손 WASD식 — A=왼쪽, D=오른쪽).
function isLeftCode(code) {
  return code === 'ArrowLeft' || code === 'KeyA';
}
function isRightCode(code) {
  return code === 'ArrowRight' || code === 'KeyD';
}

// 연타형·타이밍형 놀이용 — 키를 누를 때마다(길게 눌러도 한 번만) onTap 호출
export function useTapKey(onTap, enabled = true) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return;
    const handler = (e) => {
      if (!TAP_CODES.includes(e.code)) return;
      if (e.repeat) return;
      e.preventDefault();
      onTap();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTap, enabled]);
}

// 힘조절형 놀이용 — 키를 누르고 있는 동안 onDown, 뗄 때 onUp 호출
export function useHoldKey(onDown, onUp, enabled = true) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return;
    const down = (e) => {
      if (!TAP_CODES.includes(e.code)) return;
      if (e.repeat) return;
      e.preventDefault();
      onDown();
    };
    const up = (e) => {
      if (!TAP_CODES.includes(e.code)) return;
      e.preventDefault();
      onUp();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [onDown, onUp, enabled]);
}

// 육상 달리기 게임(육상 100m 등 고전 올림픽 게임) 방식 — 왼쪽/오른쪽 화살표를 "번갈아" 눌러야
// 인정된다. 같은 키를 연달아 누르면(한쪽 발로만 뛰는 셈) 무시된다 — 실제 두 다리를 번갈아
// 움직이거나 줄다리기에서 양손을 번갈아 당기는 동작과 같은 원리. onTap('L'|'R')로 호출된다.
export function useAlternateKey(onTap, enabled = true) {
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const lastRef = useRef(null);

  useEffect(() => {
    lastRef.current = null;
  }, [enabled]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return;
    const handler = (e) => {
      let side = null;
      if (isLeftCode(e.code)) side = 'L';
      else if (isRightCode(e.code)) side = 'R';
      else return;
      if (e.repeat) return;
      e.preventDefault();
      if (side === lastRef.current) return; // 같은 쪽 연타는 인정 안 됨
      lastRef.current = side;
      onTapRef.current(side);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);

  // 마우스/터치로 같은 번갈아치기를 할 때도 lastRef를 같이 갱신해서
  // 키보드와 마우스를 섞어 눌러도(예: 왼쪽은 클릭, 오른쪽은 화살표 키) 규칙이 일관되게 적용된다.
  const registerManual = (side) => {
    if (side === lastRef.current) return false;
    lastRef.current = side;
    onTapRef.current(side);
    return true;
  };

  return registerManual;
}

// 조준형 놀이용 — 화살표 키를 누르고 있는 동안 일정 간격으로 onLeft/onRight를 반복 호출한다.
// (비석치기·투호·자치기처럼 좌우로 목표를 조준해야 하는 놀이에 사용)
export function useArrowHold(onLeft, onRight, enabled = true) {
  const onLeftRef = useRef(onLeft);
  const onRightRef = useRef(onRight);
  onLeftRef.current = onLeft;
  onRightRef.current = onRight;

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') return;
    const active = new Set();
    const id = setInterval(() => {
      if ([...active].some(isLeftCode)) onLeftRef.current();
      if ([...active].some(isRightCode)) onRightRef.current();
    }, 30);
    const down = (e) => {
      if (!isLeftCode(e.code) && !isRightCode(e.code)) return;
      e.preventDefault();
      active.add(e.code);
    };
    const up = (e) => {
      if (!isLeftCode(e.code) && !isRightCode(e.code)) return;
      active.delete(e.code);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      active.clear();
    };
  }, [enabled]);
}
