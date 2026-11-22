@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo  잇결 작업실 시제품 렌더 (RTX 그래픽카드 사용)
echo  7장면을 고화질로 찍습니다. 10~20분쯤 걸립니다.
echo  끝날 때까지 이 창을 닫지 마세요.
echo ================================================
set BL="C:\Program Files\Blender Foundation\Blender 5.3\blender.exe"
if not exist %BL% (
  echo Blender 5.3을 찾지 못했습니다. 설치 위치를 확인해 주세요.
  pause
  exit /b
)
rem 처음 한 번만: 받은 압축 파일(유물 3D 스캔·재질)을 풉니다
for %%z in (kit_tex scan_monkey scan_lotus scan_bell scan_sansu) do (
  if exist "%%z.zip" if not exist "%%z.done" (
    echo %%z 압축 푸는 중...
    tar -xf "%%z.zip" && echo done> "%%z.done"
  )
)
%BL% -b --factory-startup --python "%~dp0render.py" -- --samples 256 --res 1600 --out "%~dp0결과" > "%~dp0렌더_화면기록.txt" 2>&1
echo.
echo 끝났습니다. 결과 폴더를 엽니다.
start "" "%~dp0결과"
pause
