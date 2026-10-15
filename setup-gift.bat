@echo off
rem Itgyeol: turn on "QR to my phone" for the surprise photos (one time only) - Vercel version
set GIT_MERGE_AUTOEDIT=no
cd /d "%~dp0"
git checkout redesign-ui
if errorlevel 1 (echo CHECKOUT FAILED - tell Claude & pause & exit /b 1)
git pull --no-rebase --no-edit origin redesign-ui
if exist tools\gift-worker git rm -r -q tools\gift-worker
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\itgyeol-gift\setup-gift.ps1"
if errorlevel 1 (echo SETUP FAILED - tell Claude & pause & exit /b 1)
call npm test
if errorlevel 1 (echo TESTS FAILED - nothing was pushed. Tell Claude & pause & exit /b 1)
git add -A src/components/SurpriseGift.js tools setup-gift.bat
git commit -m "feat: gift photo QR on (Vercel Functions + Blob, auto-delete after 24h)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Pc635XgYEi1EBmYTHPBfjJ"
git push origin redesign-ui
if errorlevel 1 (echo PUSH FAILED - tell Claude & pause & exit /b 1)
git checkout master
git pull --no-rebase --no-edit origin master
git merge redesign-ui --no-edit -m "Merge redesign-ui into master"
if errorlevel 1 (echo MERGE FAILED - tell Claude & pause & exit /b 1)
git push origin master
if errorlevel 1 (echo PUSH MASTER FAILED - tell Claude & pause & exit /b 1)
git checkout redesign-ui
echo.
echo DONE. Site updates in 2-3 min: https://nlsjjy84-ui.github.io/itgyeol-app/
pause
