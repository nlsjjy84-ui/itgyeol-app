@echo off
setlocal
echo [1/4] Copy only the server folder (outside git)
set "SRC=%~dp0tools\itgyeol-gift"
set "TMPD=%TEMP%\itgyeol-gift-deploy"
if not exist "%SRC%\api\pay.js" (echo SERVER FOLDER NOT FOUND - run apply-connect.bat first & pause & exit /b 1)
if exist "%TMPD%" rmdir /s /q "%TMPD%"
mkdir "%TMPD%\api"
copy /y "%SRC%\api\*.js" "%TMPD%\api\" >nul
copy /y "%SRC%\package.json" "%TMPD%\" >nul
copy /y "%SRC%\package-lock.json" "%TMPD%\" >nul
copy /y "%SRC%\vercel.json" "%TMPD%\" >nul
cd /d "%TMPD%"

echo.
echo [2/4] Link to the itgyeol-gift project
call npx --yes vercel@64.2.0 link --yes --project itgyeol-gift
if errorlevel 1 (echo LINK FAILED - tell Claude & pause & exit /b 1)
call npx --yes vercel@64.2.0 env ls production

echo.
echo [3/4] Deploy the server only
call npx --yes vercel@64.2.0 deploy --prod --yes
if errorlevel 1 (echo DEPLOY FAILED - tell Claude & pause & exit /b 1)

echo.
echo [4/4] Check
curl -s https://itgyeol-gift.vercel.app/api/orders
echo.
curl -s https://itgyeol-gift.vercel.app/api/pay
echo.
echo.
echo DONE. Send Claude a screenshot of this window.
pause
