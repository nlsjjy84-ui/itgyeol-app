// 큰 자막 — 어린아이·어르신이 영상 자막을 크게 볼 수 있게(화면 설정, 이 기기에만 저장)
import { useEffect, useState } from 'react';

const KEY = 'itgyeol_bigsubs';
let big = false;
try {
  big = typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
} catch (e) {
  big = false;
}
const subs = new Set();
export const subScale = () => (big ? 1.45 : 1);
export function setBigSubs(v) {
  big = !!v;
  try {
    localStorage.setItem(KEY, big ? '1' : '0');
  } catch (e) {}
  subs.forEach((fn) => fn(big));
}
export function useBigSubs() {
  const [v, setV] = useState(big);
  useEffect(() => {
    subs.add(setV);
    return () => subs.delete(setV);
  }, []);
  return v;
}
