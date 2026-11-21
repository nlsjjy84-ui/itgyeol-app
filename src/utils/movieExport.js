// 폰 앱: 영상 파일 저장은 웹(박물관 키오스크·브라우저)에서 한다. 앱에서는 화면 녹화나 웹 링크로 안내한다.
export function canExport() {
  return false;
}
export async function exportMovie() {
  return { ok: false, reason: 'native' };
}
export function downloadBlob() {}
export function drawFrame() {}
export function srtOf(tl) {
  return tl.subs.map((s, i) => `${i + 1}\n${s.text}\n`).join('\n');
}
