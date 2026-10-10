@echo off
set GIT_MERGE_AUTOEDIT=no
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
git commit -m "Update from _apply zip (%DATE% %TIME%)"
echo [4/5] push redesign-ui
git push origin redesign-ui
if errorlevel 1 (echo PUSH FAILED & pause & exit /b 1)
echo [5/5] merge into master and push
git checkout master
if errorlevel 1 (echo CHECKOUT MASTER FAILED - tell Claude & pause & exit /b 1)
rem Merge GitHub master first so PR merges made on GitHub never block the push
git pull --no-rebase --no-edit origin master
if errorlevel 1 (echo PULL MASTER FAILED - tell Claude & pause & exit /b 1)
git merge redesign-ui --no-edit -m "Merge redesign-ui into master"
if errorlevel 1 (echo MERGE FAILED - tell Claude & pause & exit /b 1)
git push origin master
if errorlevel 1 (echo PUSH MASTER FAILED - tell Claude & pause & exit /b 1)
git checkout redesign-ui
echo.
echo DONE. Site updates in 2-3 min: https://nlsjjy84-ui.github.io/itgyeol-app/
pause
