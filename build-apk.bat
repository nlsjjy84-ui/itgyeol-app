@echo off
rem Itgyeol: build an Android install file (APK) in the Expo cloud. Run AFTER apply-connect.bat has finished.
rem You need a free Expo account (https://expo.dev/signup). Login is typed by you in this window.
set GIT_MERGE_AUTOEDIT=no
cd /d "%~dp0"
git checkout redesign-ui
if errorlevel 1 (echo CHECKOUT FAILED - tell Claude & pause & exit /b 1)
git pull --no-rebase --no-edit origin redesign-ui
echo.
echo [1/3] Expo login check (if asked, type your Expo email/username and password)
call npx --yes eas-cli@25.2.0 whoami >nul 2>&1
if errorlevel 1 call npx --yes eas-cli@25.2.0 login
if errorlevel 1 (echo LOGIN FAILED - tell Claude & pause & exit /b 1)
echo.
echo [2/3] Connect this app to your Expo account (first time only - answer Y if asked)
call npx --yes eas-cli@25.2.0 init
if errorlevel 1 (echo INIT FAILED - tell Claude & pause & exit /b 1)
git add app.json
git diff --cached --quiet || git commit -m "chore: link Expo project for Android builds" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01Pc635XgYEi1EBmYTHPBfjJ"
git push origin redesign-ui
echo.
echo [3/3] Building the APK in the Expo cloud (usually 10-30 min, free plan may wait in a queue)
echo      If asked "Generate a new Android Keystore?" press Y and Enter.
call npx --yes eas-cli@25.2.0 build -p android --profile preview
if errorlevel 1 (echo BUILD FAILED - copy the red lines to Claude & pause & exit /b 1)
echo.
echo DONE. Open the link above (or expo.dev - Builds) on your phone to download and install the APK.
pause
