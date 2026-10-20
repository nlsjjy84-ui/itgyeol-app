// 카카오맵(https://map.kakao.com)을 연 탭의 콘솔에 붙여 넣는다 → 끝나면 itgyeol_shops2.json 저장
// 검색어를 늘리려면 QS에 더한다. 한 검색어당 최대 5쪽(약 75곳)까지 읽는다.
(async () => {
  const QS = ['서울 국악사', '종로 국악사', '국악사', '국악기 제작', '국악기 공방', '국악기', '장구 제작', '북 제작 국악', '가야금 공방', '가야금 제작', '거문고 공방', '해금 공방', '대금 공방', '피리 제작', '아쟁', '태평소', '꽹과리', '징 제작', '단소', '국악기 수리', '고씨공방', '한양국악사', '방짜유기', '유기 공방', '종로 한복', '광장시장 한복', '한복 맞춤 서울', '개량한복', '종로 개량한복', '생활한복', '무용복', '한국무용 의상', '한국무용복', '창작무용 의상', '전통의상', '종로 전통의상', '국악 공연복', '무대의상 한복', '미스터리 한복', '나전칠기', '나전칠기 공방', '매듭 공방', '전통자수', '한지 공방', '전통 목가구', '소목장', '갓 공방', '전통 부채', '부채 공방', '탈 공방', '하회탈', '민화 공방', '전통공예', '청자 공방', '백자 공방', '분청사기', '옹기', '전통 장신구', '노리개', '옥가락지', '비녀', '단청', '전통 활', '국궁 제작', '궁시장', '전통 칼', '장도', '전통 농기구', '대장간', '짚풀공예', '죽공예', '화각', '전각', '전통 문방구', '붓 제작', '먹 제작', '벼루', '전통 연', '팽이 공방', '전통 등', '한지 등', '전통 가마', '거북선 모형', '전통 배 모형', '전통 깃발', '깃발 제작'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const acc = {};
  const grab = (q) => {
    for (const li of document.querySelectorAll('#info\\.search\\.place\\.list > li')) {
      const g = (s) => li.querySelector(s)?.innerText?.trim() || '';
      const name = li.querySelector('.link_name')?.title || g('.link_name');
      const addr = g('[data-id="address"]');
      const key = name + '|' + addr;
      if (!acc[key]) acc[key] = { name, cat: g('[data-id="subcategory"]'), addr, phone: g('[data-id="phone"]'), detail: li.querySelector('a[data-id="moreview"]')?.href || '', home: li.querySelector('a[data-id="homepage"]')?.href || '', q: [] };
      if (!acc[key].q.includes(q)) acc[key].q.push(q);
    }
  };
  for (const q of QS) {
    document.querySelector('#search\\.keyword\\.query').value = q;
    document.querySelector('#search\\.keyword\\.submit').click();
    await sleep(1800); grab(q);
    const more = document.querySelector('#info\\.search\\.place\\.more');
    if (more && !more.classList.contains('HIDDEN')) {
      more.click(); await sleep(1500); grab(q);
      for (let p = 2; p <= 5; p++) { const a = document.querySelector('#info\\.search\\.page\\.no' + p); if (!a || a.classList.contains('HIDDEN')) break; a.click(); await sleep(1500); grab(q); }
    }
    console.log('검색어', q, '누적', Object.keys(acc).length);
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.values(acc))], { type: 'application/json' }));
  a.download = 'itgyeol_shops2.json'; document.body.appendChild(a); a.click();
})();
