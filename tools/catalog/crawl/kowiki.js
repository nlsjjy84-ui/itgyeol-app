// 한국어 위키백과(https://ko.wikipedia.org)를 연 탭의 콘솔에 붙여 넣는다 → itgyeol_kowiki.json
// 무형유산(국가·시도)·악기·한복·무기·농기구·공예·장신구·탈 등 갈래(분류)를 3단계까지 따라가며 문서를 모은다.
(async () => {
  const A = async (p) => { for (let t = 0; t < 3; t++) { try { return await (await fetch('/w/api.php?format=json&formatversion=2&' + new URLSearchParams(p))).json(); } catch (e) { await new Promise((r) => setTimeout(r, 3000)); } } return {}; };
  const roots = ['한국의 악기', '대한민국의 국가무형유산', '대한민국의 무형문화재', '한복', '한국의 공예', '한국의 무기', '조선의 무기', '한국의 농기구', '한국의 민속놀이', '한국의 놀이', '한국의 장신구', '한국의 선박', '조선의 선박', '한국의 춤', '한국의 도자기', '한국의 민속', '한국의 생활용품', '한국의 가구', '한국의 모자', '한국의 신발', '조선의 관복', '한국의 화장', '한국의 종교 의식', '한국의 전통 음악', '한국의 탈', '한국의 미술', '조선의 군사', '한국의 깃발', '한국의 문양', '한국의 종이', '한국의 민화', '한국의 건축', '한국의 전통 건축', '한국의 불교 미술', '대한민국의 국보', '대한민국의 보물', '한국의 세계유산', '한국의 유네스코 인류무형문화유산'];
  const pages = {}; const seen = new Set(); const queue = roots.map((c) => ['분류:' + c, 0, c]);
  while (queue.length) {
    const [c, d, root] = queue.shift();
    if (seen.has(c)) continue; seen.add(c);
    let cont;
    do {
      const r = await A({ action: 'query', list: 'categorymembers', cmtitle: c, cmlimit: 500, cmtype: 'page|subcat', ...(cont ? { cmcontinue: cont } : {}) });
      for (const m of ((r.query || {}).categorymembers || [])) {
        if (m.ns === 14) { if (d < 3) queue.push([m.title, d + 1, root]); } else if (m.ns === 0) (pages[m.title] = pages[m.title] || new Set()).add(root + (d ? ' > ' + c.replace('분류:', '') : ''));
      }
      cont = (r.continue || {}).cmcontinue;
    } while (cont);
    if (Object.keys(pages).length > 40000) break;
  }
  for (const s of ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도']) {
    const r = await A({ action: 'parse', page: s + '의 무형문화재', prop: 'links', redirects: 1 });
    for (const l of ((r.parse || {}).links || [])) if (l.ns === 0 && l.exists && !/(특별시|광역시|도$|시$|군$|구$|목록|국가유산청|문화재청|^\d)/.test(l.title)) (pages[l.title] = pages[l.title] || new Set()).add(s + ' 무형유산');
  }
  const titles = Object.keys(pages); const out = [];
  for (let k = 0; k < titles.length; k += 50) {
    const r = await A({ action: 'query', titles: titles.slice(k, k + 50).join('|'), prop: 'pageimages|description|pageprops|extracts', piprop: 'original|name', exintro: 1, explaintext: 1, exsentences: 2, exlimit: 50, redirects: 1 });
    const q = r.query || {}; const back = {}; [...(q.redirects || []), ...(q.normalized || [])].forEach((x) => (back[x.to] = x.from));
    for (const p of (q.pages || [])) { if (p.missing) continue; const src = back[p.title] || p.title; out.push({ ko: p.title, grp: [...(pages[src] || pages[p.title] || [])], desc: p.description || '', ext: (p.extract || '').slice(0, 240), img: (p.original || {}).source || '', file: p.pageimage || '', wd: (p.pageprops || {}).wikibase_item || '' }); }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' })); a.download = 'itgyeol_kowiki.json'; document.body.appendChild(a); a.click();
  console.log('끝', out.length);
})();
