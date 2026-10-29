// 잇결 소개 화면 빌드: src/ → site/index.html(+ site/img). 미리보기용(--preview)은 그림까지 한 파일에 넣는다.
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const preview = process.argv.includes('--preview');
const here = path.dirname(new URL(import.meta.url).pathname);
const imgDir = path.join(here, 'img');
const IMG = {};
for (const f of fs.readdirSync(imgDir)) {
  const key = f.replace(/\.[^.]+$/, '');
  if (preview) {
    const mime = f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    IMG[key] = `data:${mime};base64,${fs.readFileSync(path.join(imgDir, f)).toString('base64')}`;
  } else IMG[key] = `img/${f}`;
}
const APP = preview ? 'https://nlsjjy84-ui.github.io/itgyeol-app/' : '../';
const out = await esbuild.build({
  entryPoints: [path.join(here, 'src/main.ts')], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none',
  define: { __IMG__: JSON.stringify(IMG), __APP__: JSON.stringify(APP) },
});
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const css = fs.readFileSync(path.join(here, 'src/style.css'), 'utf8');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">';
const body = `<div id="itgyeol-landing"></div>\n<script>${js}</script>`;
if (preview) {
  const html = `<title>잇결 소개</title>\n${fonts}\n<style>body{margin:0;background:#f1f4f3}${css}</style>\n${body}\n`;
  fs.writeFileSync(path.join(here, 'preview.html'), html);
  console.log('preview.html', html.length);
} else {
  const site = path.join(here, 'site');
  fs.rmSync(site, { recursive: true, force: true });
  fs.mkdirSync(path.join(site, 'img'), { recursive: true });
  for (const f of fs.readdirSync(imgDir)) fs.copyFileSync(path.join(imgDir, f), path.join(site, 'img', f));
  fs.copyFileSync(path.join(here, 'pf-back.js'), path.join(site, 'pf-back.js')); // 포트폴리오로 돌아가기
  const html = `<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>잇결 — 놀이가 흔적이 되고, 흔적이 작품이 됩니다</title>\n<meta name="description" content="사물놀이 · 농악에서 찾은 행동 → 관계 → 흔적을 놀이로 옮긴 앱. 노는 방식대로 나만의 전통 작품이 빚어집니다.">\n<meta name="theme-color" content="#f1f4f3">\n${fonts}\n<style>html,body{margin:0;background:#f1f4f3}${css}</style>\n</head>\n<body>\n${body}\n<script src="pf-back.js" defer></script>\n</body>\n</html>\n`;
  fs.writeFileSync(path.join(site, 'index.html'), html);
  console.log('site/index.html', html.length);
}
