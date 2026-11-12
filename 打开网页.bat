@echo off
chcp 65001 >nul
title 我们的故事 · 3D 照片墙
cd /d "%~dp0"

echo.
echo   ============================================
echo      我们的故事 · 3D 照片墙
echo   ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    set "PY=python"
    goto :run
)

where py >nul 2>nul
if %errorlevel%==0 (
    set "PY=py"
    goto :run
)

echo   [!] 没有找到 Python。
echo.
echo   你仍然可以直接双击 index.html 打开，
echo   只是背景音乐可能不会自动加载。
echo.
echo   想正常听音乐的话：
echo     1. 安装 Python（https://www.python.org/downloads/）
echo     2. 再双击本文件
echo.
pause
start "" "index.html"
exit /b 0

:run
echo   正在启动本地服务器...
echo   浏览器会自动打开，看完直接关掉这个黑窗口即可。
echo.

start "" "http://localhost:8000/index.html"
%PY% -m http.server 8000
