@echo off
setlocal
set SRC=%~dp0_apply\itgyeol-redesign.zip
set DST=%~dp0
if not exist "%SRC%" (echo zip not found: %SRC% & pause & exit /b 1)
cd /d "%DST%"
echo [1/4] applying new files into this folder
powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath \"%SRC%\" -DestinationPath \"%DST%\""
if errorlevel 1 (echo UNZIP FAILED & pause & exit /b 1)
echo [2/4] npm install
call npm install
echo [3/4] saving to local git branch (not pushed)
echo _apply/>>.git\info\exclude
git checkout redesign-ui 2>/dev/null || git checkout -b redesign-ui
git add -A
git commit -m "Itgyeol redesign: story, theme, jogakbo, 3D, explanation"
echo [4/4] done. Now run:  npx expo start --web -c
pause
