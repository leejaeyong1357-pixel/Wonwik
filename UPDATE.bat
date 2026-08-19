@echo off
chcp 65001 > nul
title SPEAKZEN (WONIK) Update
echo ===============================
echo  SPEAKZEN 업데이트 (Cloudflare 자동 재배포)
echo ===============================
echo.

cd /d "%~dp0"

echo [1/1] 원익 저장소에 푸시 중...
git push origin main
if errorlevel 1 (
    echo.
    echo X 푸시 실패. 위 메시지를 확인하세요.
    pause
    exit /b 1
)

echo.
echo ===============================
echo  완료! Cloudflare가 자동으로 재배포합니다.
echo  3~5분 후 배포 주소를 새로고침하세요.
echo ===============================
echo.
pause
