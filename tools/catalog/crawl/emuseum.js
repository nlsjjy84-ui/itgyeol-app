// e뮤지엄(https://www.emuseum.go.kr)을 연 탭의 콘솔에 붙여 넣는다.
// 1) 씨앗 검색어로 소장품을 찾고 2) 소장품마다 상세(시대·분류·재질·크기·공공누리 유형·설명·연관단어)를 읽은 뒤
// 3) 많이 나온 연관단어와 박물관 분류 이름으로 다시 찾는 것을 3번 더 한다(아는 것만 모으지 않고 이어서 넓힌다).
// 단계가 끝날 때마다 itgyeol_emuseum_r0.json ~ r3.json 을 저장한다. 진행은 콘솔의 window.__st 로 본다.
window.__em = {}; window.__st = { round: 0, kw: 0, det: 0 }; window.__searched = new Set(); window.__tagCount = {};
(async () => {
  const SEED = ['장구', '소고', '꽹과리', '징', '가야금', '거문고', '해금', '아쟁', '대금', '피리', '태평소', '단소', '퉁소', '생황', '편종', '편경', '좌고', '양금', '비파', '나발', '운라', '법고', '나전', '청자', '백자', '분청사기', '옹기', '유기', '방짜', '매듭', '노리개', '비녀', '떨잠', '뒤꽂이', '가락지', '자수', '보자기', '조각보', '한지', '부채', '갓', '탈', '화각', '반닫이', '소반', '장석', '은입사', '금관', '단청', '막새', '벼루', '먹', '붓', '연적', '인장', '목판', '금속활자', '족두리', '화관', '댕기', '당의', '원삼', '활옷', '저고리', '두루마기', '버선', '꽃신', '주머니', '향낭', '경대', '참빗', '빗접', '장도', '등잔', '화로', '떡살', '다식판', '윷', '투호', '팽이', '연', '범종', '불상', '석탑', '기와', '토우', '토기', '칠기', '짚', '장승', '민화', '책가도', '병풍', '달항아리', '매병', '향로', '망건', '탕건', '정자관', '사모', '익선관', '패랭이', '삿갓', '전립', '흑립', '관자', '담뱃대', '안경', '표주박', '첩지', '곤룡포', '적의', '단령', '흉배', '도포', '철릭', '장옷', '쓰개치마', '치마', '배자', '마고자', '짚신', '나막신', '태사혜', '당혜', '쟁기', '써레', '따비', '호미', '낫', '도리깨', '키', '멍석', '맷돌', '절구', '물레', '베틀', '지게', '소쿠리', '두레박', '풍구', '활', '화살', '편전', '환도', '창', '신기전', '총통', '비격진천뢰', '조총', '갑옷', '투구', '방패', '거북선', '판옥선', '군기', '깃발', '어보', '교지', '호패', '마패', '해시계', '측우기', '혼천의', '대동여지도', '청사초롱', '가마', '분첩', '분항아리', '연지', '기름병', '동경', '향갑', '귀걸이', '팔찌', '단추', '장신구'];
  const parse = (h) => new DOMParser().parseFromString(h, 'text/html');
  async function search(kw, pages) {
    __searched.add(kw);
    for (let p = 1; p <= pages; p++) {
      try {
        const d = parse(await (await fetch('/headerSearch?keyword=' + encodeURIComponent(kw) + '&rows=36&pageNum=' + p)).text());
        const its = [...d.querySelectorAll('div.item')].filter((x) => x.querySelector('img[src^="/IMG/"]'));
        if (!its.length) break;
        for (const it of its) {
          const id = ((it.querySelector('a[onclick*="fnMaker"]')?.getAttribute('onclick') || '').match(/'(PS\d{20,})'/) || [])[1];
          if (!id) continue;
          const lis = [...it.querySelectorAll('.text li')].map((l) => l.innerText.trim());
          if (!__em[id]) __em[id] = { id, t: it.querySelector('.title')?.innerText.trim(), mu: lis[0] || '', no: lis[1] || '', img: it.querySelector('img').getAttribute('src'), kw: [] };
          if (!__em[id].kw.includes(kw)) __em[id].kw.push(kw);
        }
        if (its.length < 36) break;
      } catch (e) { /* 한 쪽 실패는 건너뛴다 */ }
    }
  }
  async function detail(id) {
    try {
      const d = parse(await (await fetch('/detail?relicId=' + id)).text());
      const txt = d.body.innerText.replace(/\s+/g, ' ');
      const g = (a, b) => { const i = txt.indexOf(a); if (i < 0) return ''; const s = txt.slice(i + a.length); const j = b.map((x) => s.indexOf(x)).filter((x) => x >= 0); return s.slice(0, Math.min(...j, 160)).trim(); };
      const e = __em[id];
      e.era = g('국적/시대', ['분류', '재질']); e.cls = g('분류', ['재질', '작가', '크기']); e.mat = g('재질', ['작가', '크기', '소장품번호']); e.size = g('크기', ['소장품번호', '지정구분']); e.des = g('지정구분', ['소장품번호', ' 제 ']).slice(0, 30);
      const k = txt.match(/제 ?(\d)유형/); e.kogl = k ? k[1] : '';
      e.full = [...d.querySelectorAll('img')].map((x) => x.getAttribute('src')).find((s) => s && s.startsWith('/IMG/')) || '';
      const ds = txt.indexOf('소장품설명'); e.desc = ds >= 0 ? txt.slice(ds + 5, ds + 260) : '';
      const ti = txt.indexOf('연관단어'); const end = txt.indexOf('유사한 소장품', ti);
      const tg = ti >= 0 ? txt.slice(ti + 4, end > 0 ? end : ti + 200) : '';
      e.tags = [...new Set((tg.match(/#\s*[^#\s][^#]*/g) || []).map((s) => s.replace(/#\s*/, '').replace(/(재질|국적|용도).*$/, '').trim()).filter((s) => s && s.length <= 12))];
      e.tags.forEach((t) => (__tagCount[t] = (__tagCount[t] || 0) + 1));
      // 박물관 분류 이름(의생활 › 관모 › 입 …)도 다음 검색어 후보로
      (e.cls || '').split(' - ').slice(1).forEach((x) => { x = x.trim(); if (x && x.length <= 10 && !/기타|^\d/.test(x)) __tagCount[x] = Math.max(__tagCount[x] || 0, 2); });
    } catch (err) { /* 건너뜀 */ }
    __st.det++;
  }
  const save = (name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ items: Object.values(__em), searched: [...__searched], tags: __tagCount })], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); };
  let queue = [...new Set(SEED)];
  const pagesBy = [3, 2, 1, 1];
  for (let round = 0; round < 4 && queue.length; round++) {
    __st.round = round; __st.kw = 0;
    for (const kw of queue) { await search(kw, pagesBy[round]); __st.kw++; }
    const todo = Object.values(__em).filter((e) => e.era === undefined).map((e) => e.id);
    __st.det = 0;
    for (let i = 0; i < todo.length; i += 6) await Promise.all(todo.slice(i, i + 6).map(detail));
    save('itgyeol_emuseum_r' + round + '.json');
    queue = Object.entries(__tagCount).filter(([t, c]) => c >= 2 && !__searched.has(t) && !/^\d/.test(t)).sort((a, b) => b[1] - a[1]).map((x) => x[0]).slice(0, 600);
    if (Object.keys(__em).length > 40000) break;
  }
  console.log('끝', Object.keys(__em).length);
})();
