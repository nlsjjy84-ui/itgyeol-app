import React, { useEffect, useState } from 'react';
import { View, Pressable, Image, StyleSheet, Platform } from 'react-native';
import Text from '../ui/Text';
import { t } from '../i18n';
import { colors } from '../theme';
import { play } from '../utils/sound';
import QRCode from 'react-native-qrcode-svg';
import { getMoments, clearMoments, onSensesChange } from '../utils/senses';

// 사진을 폰으로 옮길 임시 저장소(24시간 뒤 자동 삭제) 주소. 비어 있으면 "QR로 받기"는 곧 열림으로 둔다.
// 저장소: tools/itgyeol-gift (Vercel Functions + Blob, 하루 지난 사진 자동 삭제)
export const GIFT_UPLOAD_URL = 'https://itgyeol-gift.vercel.app';

async function uploadGift(uri) {
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(`${GIFT_UPLOAD_URL}/gift`, { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
  if (!res.ok) throw new Error(`upload ${res.status}`);
  const j = await res.json();
  return j.url;
}

// 깜짝 선물 — 놀이하는 동안 반응이 가장 컸던 순간의 사진(카메라를 허용한 사람만).
// 사진은 이 기기 메모리에만 있고, 이 화면을 나가면 지운다. 저장·인쇄는 사용자가 눌렀을 때만 한다.
const KIND = { smile: '웃음', surprise: '놀람', move: '큰 몸짓', wow: '감탄' };

// 사진 여러 장을 엽서 한 장(가로 1480 × 1000, 148×100mm 비율)으로 묶는다
async function compose(shots, { title, code }) {
  const W = 1480;
  const H = 1000;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#f6f1e6';
  x.fillRect(0, 0, W, H);
  // 오방색 띠 테두리
  ['#2b5f8e', '#b3322b', '#c8982b', '#fcfdfc', '#1b2227'].forEach((col, i) => {
    x.fillStyle = col;
    x.fillRect((W / 5) * i, 0, W / 5, 14);
    x.fillRect((W / 5) * i, H - 14, W / 5, 14);
  });
  const list = shots.slice(0, 4);
  const cols = list.length > 1 ? 2 : 1;
  const rows = Math.ceil(list.length / cols);
  const pad = 40;
  const top = 120;
  const cw = (W - pad * (cols + 1)) / cols;
  const ch = (H - top - 90 - pad * (rows - 1)) / rows;
  const imgs = await Promise.all(
    list.map(
      (s) =>
        new Promise((res) => {
          const im = new window.Image();
          im.onload = () => res(im);
          im.onerror = () => res(null);
          im.src = s.uri;
        })
    )
  );
  imgs.forEach((im, i) => {
    if (!im) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = pad + col * (cw + pad);
    const by = top + row * (ch + pad);
    const r = Math.min(cw / im.width, ch / im.height);
    const w = im.width * r;
    const h = im.height * r;
    x.fillStyle = '#ffffff';
    x.fillRect(bx + (cw - w) / 2 - 8, by + (ch - h) / 2 - 8, w + 16, h + 16);
    x.drawImage(im, bx + (cw - w) / 2, by + (ch - h) / 2, w, h);
    x.fillStyle = '#b3322b';
    x.font = 'bold 26px serif';
    x.fillText(t(KIND[list[i].kind] || '감탄'), bx + (cw - w) / 2 + 10, by + (ch + h) / 2 - 14);
  });
  x.fillStyle = '#1b2227';
  x.font = 'bold 48px serif';
  x.fillText(t('잇결 · 깜짝 선물'), pad, 82);
  x.font = '26px serif';
  x.fillStyle = '#5d6a70';
  const d = new Date();
  x.fillText(`${title || ''}  ·  ${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}  ·  ${code || ''}`, pad, H - 40);
  // 붉은 낙관
  x.fillStyle = '#b3322b';
  x.fillRect(W - pad - 84, 30, 84, 84);
  x.fillStyle = '#fcfdfc';
  x.font = 'bold 34px serif';
  x.fillText('잇결', W - pad - 76, 86);
  return c.toDataURL('image/jpeg', 0.92);
}

function download(uri, name) {
  const a = document.createElement('a');
  a.href = uri;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// 키오스크 프린터·폰 인쇄: 사진만 담은 보이지 않는 틀을 만들어 그 틀만 인쇄한다
function printImage(uri) {
  const f = document.createElement('iframe');
  f.style.position = 'fixed';
  f.style.width = '0';
  f.style.height = '0';
  f.style.border = '0';
  document.body.appendChild(f);
  const doc = f.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><style>@page{size:148mm 100mm;margin:0}html,body{margin:0}img{width:100%;height:auto;display:block}</style></head><body><img src="${uri}"></body></html>`);
  doc.close();
  const im = doc.querySelector('img');
  const go = () => {
    f.contentWindow.focus();
    f.contentWindow.print();
    setTimeout(() => f.remove(), 60000);
  };
  if (im.complete) go();
  else im.onload = go;
}

export default function SurpriseGift({ title, code }) {
  const [shots, setShots] = useState(getMoments());
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(null); // { url } 또는 { error }
  useEffect(() => onSensesChange(() => setShots(getMoments())), []);
  // 이 화면을 나가면 지운다(저장하지 않은 사진은 남기지 않는다)
  useEffect(() => () => clearMoments(), []);
  if (Platform.OS !== 'web' || !shots.length) return null;

  const act = async (fn) => {
    if (busy) return;
    play('tap');
    setBusy(true);
    try {
      const uri = await compose(shots, { title, code });
      fn(uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.kicker}>{t('깜짝 선물')}</Text>
      <Text style={s.title}>{t('놀이하는 동안 가장 신났던 순간 {n}장', { n: shots.length })}</Text>
      <View style={s.grid}>
        {shots.map((m) => (
          <View key={m.id} style={s.cell}>
            <Image source={{ uri: m.uri }} style={s.img} resizeMode="cover" accessibilityLabel={t(KIND[m.kind] || '감탄')} />
            <Text style={s.tag}>{t(KIND[m.kind] || '감탄')}</Text>
          </View>
        ))}
      </View>
      <Text style={s.warn}>{t('저장하지 않으면 이 화면을 나갈 때 사라져요. 사진은 이 기기에만 있고, QR로 받기를 누를 때만 임시 저장소에 24시간 맡아 둬요.')}</Text>
      <View style={s.row}>
        <Pressable accessibilityRole="button" style={[s.btn, s.primary]} onPress={() => act((u) => download(u, `itgyeol-${code || 'gift'}.jpg`))}>
          <Text style={s.primaryTxt}>{busy ? t('만드는 중…') : t('이 기기에 저장 (무료)')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={s.btn} onPress={() => act(printImage)}>
          <Text style={s.btnTxt}>{t('바로 인쇄')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[s.btn, !GIFT_UPLOAD_URL && s.btnOff]}
          onPress={() =>
            GIFT_UPLOAD_URL &&
            act(async (u) => {
              try {
                setQr({ url: await uploadGift(u) });
              } catch (e) {
                setQr({ error: true });
              }
            })
          }
        >
          <Text style={s.btnTxt}>{GIFT_UPLOAD_URL ? t('QR로 폰에 받기') : t('QR로 폰에 받기 (곧 열려요)')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={s.btn}
          onPress={() => {
            play('tap');
            setQr(null);
            clearMoments();
          }}
        >
          <Text style={s.btnTxt}>{t('사진 지우기')}</Text>
        </Pressable>
      </View>
      {qr && qr.url ? (
        <View style={s.qrBox}>
          <View style={s.qrWhite}>
            <QRCode value={qr.url} size={132} />
          </View>
          <Text style={s.qrTxt}>{t('폰 카메라로 찍으면 사진 파일을 바로 받아요. 이 사진은 QR로 받기를 누른 지금 임시 저장소에 올렸고, 24시간 뒤 자동으로 지워져요.')}</Text>
        </View>
      ) : null}
      {qr && qr.error ? <Text style={s.warn}>{t('지금은 QR을 만들 수 없어요. 이 기기에 저장하거나 인쇄해 주세요.')}</Text> : null}
      <Text style={s.sub}>{t('엽서로 받고 싶으면 아래 "가져가는 방법"에서 깜짝 사진 엽서를 골라요.')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, borderRadius: 6, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  kicker: { fontSize: 12, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 2, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31.5%', minWidth: 96, aspectRatio: 4 / 3, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.paper },
  img: { width: '100%', height: '100%' },
  tag: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, backgroundColor: colors.accent, color: '#fff', fontSize: 11, fontWeight: '700' },
  warn: { fontSize: 12.5, lineHeight: 19, color: colors.accentDeep, fontWeight: '700', marginTop: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  btnTxt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnOff: { opacity: 0.5 },
  qrBox: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 12 },
  qrWhite: { padding: 8, backgroundColor: '#ffffff', borderRadius: 4 },
  qrTxt: { flex: 1, fontSize: 12.5, lineHeight: 19, color: colors.ink },
  primaryTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: colors.muted, marginTop: 8 },
});
