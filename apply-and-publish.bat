@echo off
rem Run a private copy from TEMP so git checkout can never rewrite this file while it runs
if /i not "%~1"=="__run" (
  copy /y "%~f0" "%TEMP%\itgyeol-apply.bat" >nul
  call "%TEMP%\itgyeol-apply.bat" __run "%~dp0"
  exit /b
)
set GIT_MERGE_AUTOEDIT=no
setlocal
set DST=%~2
set SRC=%DST%_apply\itgyeol-tests.zip
cd /d "%DST%"
echo [1/6] switch to redesign-ui
rem Drop local edits to this bat (the running copy is in TEMP) so checkout is never blocked
git checkout -- apply-and-publish.bat 2>nul
git checkout redesign-ui
if errorlevel 1 (echo CHECKOUT FAILED - tell Claude & pause & exit /b 1)
echo [2/6] applying new files
if exist "%SRC%" powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath \"%SRC%\" -DestinationPath \"%DST%\""
if errorlevel 1 (echo UNZIP FAILED & pause & exit /b 1)
echo [3/6] npm install
call npm install
echo [3b] tests and translation check (fail = nothing is pushed). Browser tests run on GitHub before deploy.
call npm test
if errorlevel 1 (echo TESTS FAILED - nothing was pushed. Tell Claude & pause & exit /b 1)
call npm run i18n:check
if errorlevel 1 (echo TRANSLATION FILE BROKEN - nothing was pushed. Tell Claude & pause & exit /b 1)
echo [4/6] commit and push redesign-ui
rem Save the newest bat into the repo so every branch has the same copy
copy /y "%~f0" "%DST%apply-and-publish.bat" >nul
git add -A
git commit -m "test: 34 browser tests (start, 6 boards, 12 folk games, dancheong played to the end, result lines, 4 languages, order and exhibit across devices against the real server code, offline) run before every deploy; fix six-board texts (home, tour, story, 1/6 and n/6 counters, epilogue for 5-6 boards) and the play patch description" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Pc635XgYEi1EBmYTHPBfjJ"
git push origin redesign-ui
if errorlevel 1 (echo PUSH FAILED - tell Claude & pause & exit /b 1)
echo [5/6] merge into master and push
git checkout master
if errorlevel 1 (echo CHECKOUT MASTER FAILED - tell Claude & pause & exit /b 1)
git pull --no-rebase --no-edit origin master
if errorlevel 1 (echo PULL MASTER FAILED - tell Claude & pause & exit /b 1)
git merge redesign-ui --no-edit -m "Merge redesign-ui into master"
if errorlevel 1 (echo MERGE FAILED - tell Claude & pause & exit /b 1)
git push origin master
if errorlevel 1 (echo PUSH MASTER FAILED - tell Claude & pause & exit /b 1)
echo [6/6] back to redesign-ui
git checkout redesign-ui
echo.
echo DONE. Site updates in 2-3 min: https://nlsjjy84-ui.github.io/itgyeol-app/
pause
