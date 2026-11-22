#!/bin/sh
# 소개 화면 3종(a 밤의 전시실 · b 한지와 먹 · c 놀이판) 빌드 — site/a, site/b, site/c
cd "$(dirname "$0")/.."
for v in a b c; do
  [ -f v3src/$v.html ] || continue
  mkdir -p site/$v && cp v3src/$v.html site/$v/index.html
  npx esbuild v3src/$v.js --bundle --minify --format=esm --outfile=site/$v/$v.js --log-level=warning
done
