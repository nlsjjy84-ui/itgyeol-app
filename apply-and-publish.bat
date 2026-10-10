@echo off
setlocal
set SRC=%~dp0_apply\itgyeol-redesign.zip
set DST=%~dp0
if not exist "%SRC%" (echo zip not found: %SRC% & pause & exit /b 1)
cd /d "%DST%"
echo [1/5] applying new files
powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath \"%SRC%\" -DestinationPath \"%DST%\""
if errorlevel 1 (echo UNZIP FAILED & pause & exit /b 1)
echo [2/5] npm install
call npm install
echo [3/5] commit on redesign-ui
git checkout redesign-ui
if errorlevel 1 (echo CHECKOUT FAILED & pause & exit /b 1)
git add -A
git commit -m "3D: park-ref shapes - bat norigae, dragon binyeo, ttuljam, buk lacing, fan ribs, moonjar"
echo [4/5] push redesign-ui
git push origin redesign-ui
if errorlevel 1 (echo PUSH FAILED & pause & exit /b 1)
echo [5/5] merge into master and push
git checkout master
git pull origin master
git merge redesign-ui -m "Merge redesign-ui: reference-based 3D shapes"
if errorlevel 1 (echo MERGE FAILED - tell Claude & pause & exit /b 1)
git push origin master
echo.
echo DONE. Preview: npx expo start --web -c
pause
