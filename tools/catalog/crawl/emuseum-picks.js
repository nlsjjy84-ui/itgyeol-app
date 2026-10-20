// emuseum.js 를 돌린 같은 탭에서 이어서 붙여 넣는다 → itgyeol_picks.json
// 공공누리 제1유형·옛 시대 소장품을 박물관 분류 갈래마다 4점씩 고르게 뽑아 사진(긴 변 320px)을 함께 저장한다.
(async () => {
  const ok = Object.values(window.__em || {}).filter((e) => e.kogl === '1' && /조선|고려|삼국|신라|백제|가야|고구려|통일신라|대한제국|발해/.test(e.era || '') && (e.full || e.img));
  const by = {};
  ok.forEach((e) => { const k = (e.cls || '').split(' - ').slice(0, 3).join(' - '); (by[k] = by[k] || []).push(e); });
  const picks = [];
  Object.values(by).sort((a, b) => a.length - b.length).forEach((v) => {
    v.sort(() => Math.random() - 0.5);
    const seen = new Set(); let n = 0;
    for (const e of v) { const t = (e.t || '').replace(/\W/g, '').slice(0, 4); if (seen.has(t)) continue; seen.add(t); picks.push(e); if (++n >= 4) break; }
  });
  const toData = (src) => new Promise((res) => { const im = new Image(); im.onload = () => { const s = Math.min(1, 320 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); try { res(c.toDataURL('image/jpeg', 0.72)); } catch (e) { res(''); } }; im.onerror = () => res(''); im.src = src; });
  const out = [];
  for (const e of picks.slice(0, 700)) { const d = await toData(e.full || e.img); if (d) out.push({ id: e.id, t: e.t, mu: e.mu, era: e.era, cls: e.cls, mat: e.mat, size: e.size, desc: e.desc, tags: e.tags, img: d }); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' })); a.download = 'itgyeol_picks.json'; document.body.appendChild(a); a.click();
  console.log('사진', out.length);
})();
