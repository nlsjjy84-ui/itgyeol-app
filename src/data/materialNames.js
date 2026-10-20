// 재료 갈래·재료 이름의 다른 나라 말 — [en, zh, ja]
export const MATERIAL_NAMES = {
  metal: ['Metals', '金属', '金属'], clay: ['Clay & fire', '土与火', '土と火'], plant: ['Wood & plants', '木与草', '木と草'], fiber: ['Thread & cloth', '线与布', '糸と布'],
  animal: ['Animal & sea', '兽与海', '獣と海'], paint: ['Lacquer & pigment', '漆与颜料', '漆と顔料'], stone: ['Stone & jade', '石与玉', '石と玉'],
  gold: ['Gold', '金', '金'], silver: ['Silver', '银', '銀'], yugi: ['Brass (yugi)', '黄铜（鍮器）', '真鍮（鍮器）'], bronze: ['Bronze & copper', '青铜·铜', '青銅・銅'], iron: ['Iron', '铁', '鉄'], ipsa: ['Silver inlay on iron', '铁地银丝镶嵌', '鉄地銀象嵌'],
  celadon: ['Celadon', '青瓷', '青磁'], porcelain: ['White porcelain', '白瓷', '白磁'], buncheong: ['Buncheong ware', '粉青沙器', '粉青沙器'], onggi: ['Onggi', '瓮器', 'オンギ'], earthen: ['Earthenware & roof tile', '陶器·瓦', '土器・瓦'],
  paulownia: ['Paulownia wood', '梧桐木', '桐材'], wood: ['Wood (pine, zelkova…)', '木材（松、榉…）', '木材（松・欅など）'], bamboo: ['Bamboo', '竹', '竹'], straw: ['Sedge, straw & bush clover', '莞草·稻草·胡枝子', 'ワングル・藁・萩'], hanji: ['Hanji paper', '韩纸', '韓紙'],
  silk: ['Silk', '丝绸', '絹'], ramie: ['Ramie', '苎麻布', '苧麻'], hemp: ['Hemp cloth', '麻布', '麻布'], cotton: ['Cotton', '棉布', '木綿'], knot: ['Knot & embroidery thread', '绳结·刺绣线', '組紐・刺繍糸'],
  leather: ['Leather & hide', '皮革', '革'], hwagak: ['Ox horn (hwagak)', '牛角（华角）', '牛角（華角）'], najeon: ['Mother-of-pearl', '螺钿（贝壳）', '螺鈿（貝）'], horsehair: ['Horsehair', '马鬃', '馬の毛'], bone: ['Ivory & bone', '象牙·骨', '象牙・骨'], gem: ['Coral, amber & pearl', '珊瑚·琥珀·珍珠', '珊瑚・琥珀・真珠'],
  otchil: ['Ottchil lacquer', '漆', '漆'], gilt: ['Gold leaf', '金箔', '金箔'], dancheong: ['Dancheong pigments', '丹青颜料', '丹青顔料'], ink: ['Ink stick', '墨', '墨'],
  jade: ['Jade', '玉', '玉'], granite: ['Granite', '花岗岩', '花崗岩'], glass: ['Glass & beads', '玻璃·珠子', 'ガラス・玉'], inkstone: ['Inkstone', '砚石', '硯石'],
};

// '떠오르는 것'에서 고른 답 → 먼저 권하는 재료(바탕, 무늬). 고른 답이 여럿이면 앞에서부터 겹치지 않게 모은다.
export const TASTE_TO_MATERIAL = {
  hanbok: ['silk', 'gilt'], mosi: ['ramie', 'hemp'], jewel: ['silver', 'jade'], maedeup: ['silk', 'knot'], gat: ['horsehair', 'bamboo'], jeogori: ['silk', 'cotton'],
  'honrye-bok': ['silk', 'gilt'], gache: ['silk', 'gem'], beoseon: ['cotton', 'silk'], geumbak: ['silk', 'gilt'], hanok: ['wood', 'hanji'], onggi: ['onggi', null],
  kimjang: ['onggi', null], tteok: ['wood', null], furniture: ['wood', 'najeon'], hanji: ['hanji', null], seoye: ['inkstone', 'ink'], ondol: ['granite', null],
  giwa: ['earthen', null], changho: ['wood', 'hanji'], yugi: ['yugi', null], bibimbap: ['yugi', null], doenjang: ['onggi', null], tea: ['buncheong', null],
  baneul: ['cotton', 'knot'], nongak: ['leather', 'yugi'], samul: ['leather', 'paulownia'], pansori: ['bamboo', 'hanji'], arirang: ['paulownia', 'silk'],
  gagok: ['paulownia', 'silk'], talchum: ['wood', 'dancheong'], ganggang: ['cotton', 'silk'], cheoyong: ['silk', 'dancheong'], jultagi: ['hemp', null],
  kkwaenggwari: ['yugi', null], geomungo: ['paulownia', 'silk'], daegeum: ['bamboo', null], gut: ['hanji', 'silk'], sinawi: ['bamboo', 'silk'], jangdan: ['leather', 'paulownia'],
  ssireum: ['cotton', null], taekkyeon: ['cotton', null], juldarigi: ['straw', null], yut: ['wood', null], yeon: ['hanji', 'bamboo'], jeonrae: ['wood', null],
  tuho: ['bronze', 'bamboo'], neolttwigi: ['wood', null], jegi: ['hanji', 'bronze'], gonu: ['wood', 'granite'], gungsul: ['bamboo', 'hwagak'], maesanyang: ['leather', null],
  jwibul: ['iron', null], danoje: ['silk', 'hanji'], yeondeung: ['hanji', 'silk'], jongmyo: ['bronze', 'otchil'], yeongsan: ['silk', 'dancheong'], haenyeo: ['cotton', 'najeon'],
  myeongjeol: ['silk', 'gilt'], honrye: ['silk', 'otchil'], doljanchi: ['silk', 'silver'], jesa: ['otchil', 'yugi'], jangseung: ['wood', null], dongji: ['onggi', null],
  sebae: ['silk', 'knot'], bulguksa: ['granite', null], palace: ['wood', 'dancheong'], hwaseong: ['granite', null], hahoe: ['wood', 'hanji'], haeinsa: ['wood', 'ink'],
  sinra: ['gold', 'jade'], dalhang: ['porcelain', null], celadon: ['celadon', null], bronze: ['bronze', null], cheomseongdae: ['granite', 'bronze'], baekje: ['bronze', 'gold'],
  bangasayu: ['bronze', 'gold'], geobukseon: ['wood', 'iron'], seokbinggo: ['granite', null], sansa: ['wood', 'dancheong'], hangul: ['hanji', 'ink'], sillok: ['hanji', 'ink'],
  uihak: ['hanji', 'wood'], eumyang: ['otchil', 'najeon'], dancheong: ['wood', 'dancheong'], minhwa: ['hanji', 'dancheong'], byeongpung: ['silk', 'ink'], gungche: ['hanji', 'ink'],
  jikji: ['bronze', 'hanji'], taegeuk: ['silk', null],
};
export function suggestMaterials(picks) {
  for (const p of picks || []) { const s = TASTE_TO_MATERIAL[p]; if (s) return { base: s[0], accent: s[1] || null }; }
  return { base: null, accent: null };
}
