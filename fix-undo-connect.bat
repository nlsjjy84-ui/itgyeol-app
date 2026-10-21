@echo off
rem Itgyeol: undo the old apply-connect.bat files (put every tracked file back to the last commit). Nothing is pushed.
cd /d "%~dp0"
echo [1/3] files changed by the old bat:
git status --short
echo.
echo [2/3] putting them back to the last commit
git checkout -- .
if errorlevel 1 (echo RESTORE FAILED - tell Claude & pause & exit /b 1)
echo.
echo [3/3] after restore (only _apply and apply-*.bat lines are OK):
git status --short
echo.
echo DONE. Now run apply-slogan.bat
pause
