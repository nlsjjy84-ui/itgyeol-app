// 언어가 바뀔 때 자료(물건 카탈로그, 떠오르는 것 선택지, 놀이 이름, 오행, 캐릭터 이름)의 글자를 바꿔 끼운다.
// 자료 파일 자체는 한국어 원본 그대로 두고, 여기서만 언어를 입힌다.
import { onLang, localizeList, L } from './index';
import { CATALOG } from '../components/obj3d/catalog';
import { TASTE_GROUPS, TASTE_KEYWORDS, GAME_NAMES, SCENE_NAMES } from '../data/taste';
import { OHANG } from '../data/formations';
import { PLAY_GAMES } from '../data/playGames';
import { WHO } from '../data/story';
import { MASCOT_NAMES } from '../components/Mascot';

const mapKo = {};
function localizeMap(obj, kind, name) {
  if (!mapKo[name]) mapKo[name] = { ...obj };
  Object.keys(obj).forEach((k) => {
    obj[k] = L(kind, k, mapKo[name][k]);
  });
}

onLang(() => {
  localizeList(CATALOG, 'group', ['label', 'intro']);
  CATALOG.forEach((g) => {
    localizeList(g.items, 'item', ['label', 'about']);
    g.items.forEach((it) => localizeList(it.variants, 'variant', ['label', 'note'], (v) => `${it.id}.${v.id}`));
  });
  localizeList(TASTE_GROUPS, 'tasteGroup', ['label']);
  TASTE_GROUPS.forEach((g) => localizeList(g.keywords, 'taste', ['label']));
  localizeList(TASTE_KEYWORDS, 'taste', ['label']);
  localizeList(OHANG, 'ohang', ['label'], (o) => o.key);
  localizeList(PLAY_GAMES, 'game', ['name']);
  localizeMap(GAME_NAMES, 'game', 'GAME_NAMES');
  localizeMap(SCENE_NAMES, 'scene', 'SCENE_NAMES');
  localizeMap(MASCOT_NAMES, 'who', 'MASCOT_NAMES');
  Object.keys(WHO).forEach((k) => {
    WHO[k].__ko = WHO[k].__ko || WHO[k].name;
    WHO[k].name = L('who', k, WHO[k].__ko);
  });
});
