@echo off
rem Itgyeol: intro page shows the new 450 works (35 picks, one per kind, two rings) + 35 materials number
rem Run a private copy from TEMP so git checkout can never rewrite this file while it runs
if /i not "%~1"=="__run" (
  copy /y "%~f0" "%TEMP%\itgyeol-landing35.bat" >nul
  call "%TEMP%\itgyeol-landing35.bat" __run "%~dp0"
  exit /b
)
set GIT_MERGE_AUTOEDIT=no
setlocal
set DST=%~2
set SRC=%DST%_apply\itgyeol-landing35.zip
cd /d "%DST%"
echo [1/6] switch to redesign-ui
git checkout -- apply-landing35.bat 2>nul
git checkout redesign-ui
if errorlevel 1 (echo CHECKOUT FAILED - tell Claude & pause & exit /b 1)
git pull --no-rebase --no-edit origin redesign-ui
echo [2/6] applying new files (old intro work pictures are replaced)
if not exist "%SRC%" (echo ZIP NOT FOUND: %SRC% - tell Claude & pause & exit /b 1)
del /q "web-landing\img\w*.webp" 2>nul
del /q "web-landing\site\img\w*.webp" 2>nul
powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath \"%SRC%\" -DestinationPath \"%DST%\""
if errorlevel 1 (echo UNZIP FAILED & pause & exit /b 1)
echo [3/6] npm install
call npm install
echo [4/6] tests and translation check (fail = nothing is pushed)
call npm test
if errorlevel 1 (echo TESTS FAILED - nothing was pushed. Tell Claude & pause & exit /b 1)
call npm run i18n:check
if errorlevel 1 (echo TRANSLATION FILE BROKEN - nothing was pushed. Tell Claude & pause & exit /b 1)
echo [5/6] commit and push redesign-ui
copy /y "%~f0" "%DST%apply-landing35.bat" >nul
git add -A
git commit -m "feat: intro page shows the new example works (35 picks, one per kind of result, real materials) on two counter-rotating rings; adds the 35 traditional materials number" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Pc635XgYEi1EBmYTHPBfjJ"
git push origin redesign-ui
if errorlevel 1 (echo PUSH FAILED - tell Claude & pause & exit /b 1)
echo [6/6] merge into master and push
git checkout master
if errorlevel 1 (echo CHECKOUT MASTER FAILED - tell Claude & pause & exit /b 1)
git pull --no-rebase --no-edit origin master
git merge redesign-ui --no-edit -m "Merge redesign-ui into master"
if errorlevel 1 (echo MERGE FAILED - tell Claude & pause & exit /b 1)
git push origin master
if errorlevel 1 (echo PUSH MASTER FAILED - tell Claude & pause & exit /b 1)
git checkout redesign-ui
echo.
echo DONE. Intro page updates in 2-3 min: https://nlsjjy84-ui.github.io/itgyeol-app/
pause
