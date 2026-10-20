// 위키데이터(https://www.wikidata.org)를 연 탭의 콘솔에 붙여 넣는다 → itgyeol_wikidata.json
// 대한민국 문화유산 지정(국보·보물·사적·국가무형유산·시도 지정 등)을 가진 항목 전체 + 이름·재질·쓰임·위치·소장처·사진과 사진 이용 조건.
// (해외 서버에서는 위키데이터 질의가 분당 1번으로 막혀 있어서, 사용자 브라우저에서 돌린다)
(async () => {
  const S = async (q) => { for (let t = 0; t < 3; t++) { try { return (await (await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q))).json()).results.bindings; } catch (e) { await new Promise((r) => setTimeout(r, 5000)); } } return []; };
  const ds = await S('SELECT DISTINCT ?d WHERE { ?i wdt:P1435 ?d . ?i wdt:P17 wd:Q884 }');
  const dids = ds.map((b) => b.d.value.split('/').pop());
  const items = {};
  for (let k = 0; k < dids.length; k += 20) {
    const rows = await S('SELECT ?i ?d WHERE { VALUES ?d { ' + dids.slice(k, k + 20).map((x) => 'wd:' + x).join(' ') + ' } ?i wdt:P1435 ?d . }');
    rows.forEach((b) => { const i = b.i.value.split('/').pop(); (items[i] = items[i] || []).push(b.d.value.split('/').pop()); });
    console.log('지정 갈래', k, '/', dids.length);
  }
  const ids = Object.keys(items); const out = []; const need = new Set(dids);
  const cv = (c, p) => (c[p] || []).map((x) => x.mainsnak.datavalue && x.mainsnak.datavalue.value).filter(Boolean);
  for (let k = 0; k < ids.length; k += 50) {
    try {
      const r = await (await fetch('/w/api.php?action=wbgetentities&format=json&props=labels|claims|sitelinks&languages=ko|en&sitefilter=kowiki&ids=' + ids.slice(k, k + 50).join('|'))).json();
      for (const [i, e] of Object.entries(r.entities || {})) {
        const c = e.claims || {}, L = e.labels || {}, d = cv(c, 'P571')[0];
        const rec = { id: i, ko: (L.ko || {}).value || '', en: (L.en || {}).value || '', desig: items[i], img: cv(c, 'P18')[0] || '', cat: cv(c, 'P373')[0] || '', inst: cv(c, 'P31').map((v) => v.id), mat: cv(c, 'P186').map((v) => v.id), use: cv(c, 'P366').map((v) => v.id), loc: cv(c, 'P131').map((v) => v.id).slice(0, 1), date: d && d.time ? d.time.slice(1, 5) : '', kowiki: ((e.sitelinks || {}).kowiki || {}).title || '', coll: cv(c, 'P195').map((v) => v.id).slice(0, 1) };
        [...rec.inst, ...rec.mat, ...rec.use, ...rec.loc, ...rec.coll].forEach((x) => need.add(x));
        out.push(rec);
      }
    } catch (err) { /* 건너뜀 */ }
    if (k % 1000 === 0) console.log('항목', k, '/', ids.length);
  }
  const lab = {}; const nl = [...need];
  for (let k = 0; k < nl.length; k += 50) { try { const r = await (await fetch('/w/api.php?action=wbgetentities&format=json&props=labels&languages=ko|en&ids=' + nl.slice(k, k + 50).join('|'))).json(); for (const [i, e] of Object.entries(r.entities || {})) { const L = e.labels || {}; lab[i] = (L.ko || L.en || {}).value || i; } } catch (err) { /* 건너뜀 */ } }
  out.forEach((r) => ['inst', 'mat', 'use', 'loc', 'coll', 'desig'].forEach((f) => (r[f] = r[f].map((x) => lab[x] || x))));
  const files = [...new Set(out.map((r) => r.img).filter(Boolean))]; const lic = {};
  for (let k = 0; k < files.length; k += 50) {
    try {
      const r = await (await fetch('https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=800&iiextmetadatafilter=LicenseShortName|Artist&titles=' + files.slice(k, k + 50).map((f) => encodeURIComponent('File:' + f)).join('|'))).json();
      const norm = {}; ((r.query || {}).normalized || []).forEach((n) => (norm[n.to] = n.from));
      Object.values((r.query || {}).pages || {}).forEach((p) => { const ii = (p.imageinfo || [])[0]; if (!ii) return; const m = ii.extmetadata || {}; const t = (norm[p.title] || p.title).replace(/^File:/, ''); lic[t] = { lic: (m.LicenseShortName || {}).value || '', by: ((m.Artist || {}).value || '').replace(/<[^>]+>/g, '').trim().slice(0, 80), thumb: ii.thumburl || '' }; });
    } catch (err) { /* 건너뜀 */ }
  }
  out.forEach((r) => { if (r.img) { const x = lic[r.img] || {}; Object.assign(r, { imgLic: x.lic || '', imgBy: x.by || '', thumb: x.thumb || '' }); } });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' })); a.download = 'itgyeol_wikidata.json'; document.body.appendChild(a); a.click();
  console.log('끝', out.length);
})();
