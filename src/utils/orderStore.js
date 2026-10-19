// 주문 저장소 — 잇결 서버(Vercel)와 이 기기를 함께 쓴다.
// 손님 폰·굿즈숍 키오스크·업체 화면이 서로 다른 기기여도 같은 주문을 본다(보는 동안 4초마다 새로 읽음).
// 서버가 안 열리면 예전처럼 이 기기에만 저장한다(결제 번호 MOCK-).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanOrders, advance, cancel } from './orders';
import { cloud } from './cloud';
import { mergeOrders } from './sync';

const KEY = 'itgyeol_orders_v1';
const POLL_MS = 4000;
let cache = null;
let online = null; // null: 아직 모름, true: 서버와 이어짐, false: 이 기기만
const subs = new Set();
const onlineSubs = new Set();
let timer = null;
const emit = () => subs.forEach((fn) => fn(cache || []));
const setOnline = (v) => {
  if (online === v) return;
  online = v;
  onlineSubs.forEach((fn) => fn(v));
};
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(cache || [])).catch(() => {});

export async function loadOrders() {
  if (!cache) {
    try {
      cache = cleanOrders(JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'));
    } catch (e) {
      cache = [];
    }
    emit();
  }
  await refresh();
  return cache;
}

/** 서버에서 다시 읽기 — 못 보낸 주문이 있으면 먼저 다시 보낸다 */
export async function refresh() {
  try {
    for (const o of (cache || []).filter((x) => x.local)) await send(o).catch(() => {});
    const remote = await cloud.orders();
    cache = mergeOrders(cache, remote);
    setOnline(true);
    persist();
    emit();
  } catch (e) {
    setOnline(false);
  }
}

export function onOrders(fn) {
  subs.add(fn);
  if (cache) fn(cache);
  if (subs.size === 1) {
    loadOrders();
    timer = setInterval(refresh, POLL_MS);
  }
  return () => {
    subs.delete(fn);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** 서버와 이어졌는지(true/false/null) 알려 준다 */
export function onOnline(fn) {
  onlineSubs.add(fn);
  fn(online);
  return () => onlineSubs.delete(fn);
}

function put(order) {
  cache = [...(cache || []).filter((o) => o.no !== order.no), order];
  persist();
  emit();
}

async function send(o) {
  const fresh = await cloud.addOrder(o).catch(async (e) => {
    if (e.status === 409) return (await cloud.orders()).find((x) => x.no === o.no);
    throw e;
  });
  if (fresh) put(fresh);
  return fresh;
}

/** 새 주문(모의·계산대 결제) — 바로 화면에 보이고, 서버에 보낸다. 못 보내면 이 기기에 두고 다시 보낸다 */
export async function submitOrder(order) {
  put({ ...order, local: true });
  try {
    await send(order);
    setOnline(true);
  } catch (e) {
    if (e && e.status && e.status < 500) put(order);
    else setOnline(false);
  }
}

/** 결제사가 승인한 주문(서버가 이미 저장함)을 화면에 넣는다 */
export function putConfirmed(order) {
  put(order);
}

async function stepRemote(order, action, localFn) {
  const next = localFn(order);
  const nextOrder = next.order || next;
  if (next.error) return next;
  if (order.local || online === false) {
    put({ ...nextOrder, local: order.local });
    return { order: nextOrder };
  }
  put(nextOrder);
  try {
    const fresh = await cloud.stepOrder(order.no, action);
    put(fresh);
    return { order: fresh };
  } catch (e) {
    if (e && e.data && e.data.order) put(e.data.order);
    else if (!e.status) put({ ...nextOrder, local: true });
    return { error: (e && e.message) || 'FAILED' };
  }
}

/** 업체가 다음 단계로 넘긴다 */
export const advanceOrder = (order) => stepRemote(order, 'advance', (o) => advance(o));
/** 손님이 취소한다(만들기 시작 전까지만). 토스로 낸 주문은 서버가 결제사에서도 환불한다 */
export const cancelOrder = (order) => stepRemote(order, 'cancel', (o) => cancel(o));

// 예전 이름 — 이 기기 안에서만 고칠 때
export function saveOrder(order) {
  put(order);
}
