// 주문 저장소 — 이 기기에만 둔다(결제·업체 연결은 모의). 손님 화면과 업체 화면이 같은 목록을 본다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanOrders } from './orders';

const KEY = 'itgyeol_orders_v1';
let cache = null;
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(cache || []));

export async function loadOrders() {
  if (cache) return cache;
  try {
    cache = cleanOrders(JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'));
  } catch (e) {
    cache = [];
  }
  emit();
  return cache;
}

export function onOrders(fn) {
  subs.add(fn);
  if (cache) fn(cache);
  else loadOrders();
  return () => subs.delete(fn);
}

/** 주문 하나를 넣거나(같은 번호면 바꾸기) 고친다 */
export function saveOrder(order) {
  const list = (cache || []).filter((o) => o.no !== order.no);
  cache = [...list, order];
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  emit();
}
