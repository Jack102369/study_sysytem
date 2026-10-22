@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM 默认用本目录 .venv（服务器常无无 D: 盘）
REM 若存在 D:\tools，可改用 ASCII 路径以规避部分 DLL 问题：
set "VENV=%~dp0.venv"
if exist "D:\" (
  if not exist "D:\tools" mkdir "D:\tools" 2>nul
  if exist "D:\tools" set "VENV=D:\tools\ocr-formula-venv"
)

set "PY="
where py >nul 2>nul && set "PY=py -3.10"
if not defined PY where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && set "PY=python3"

if not defined PY (
  echo [ERROR] 未找到 Python。请安装 Python 3.10/3.11 并加入 PATH。
  pause
  exit /b 1
)

if not exist "%VENV%\Scripts\python.exe" (
  echo Creating venv at %VENV% ...
  %PY% -m venv "%VENV%"
  if errorlevel 1 (
    echo [ERROR] 创建虚拟环境失败
    pause
    exit /b 1
  )
  if not exist "%VENV%\Scripts\python.exe" (
    echo [ERROR] venv 创建后找不到 python.exe
    pause
    exit /b 1
  )
  echo Installing dependencies ^(首次较慢^)...
  "%VENV%\Scripts\python.exe" -m pip install -U pip
  "%VENV%\Scripts\python.exe" -m pip install -r "%~dp0requirements.txt"
  if errorlevel 1 (
    echo [ERROR] pip install 失败
    pause
    exit /b 1
  )
)

echo Starting Formula OCR on http://127.0.0.1:9101 ...
echo Using venv: %VENV%
"%VENV%\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 9101
pause
