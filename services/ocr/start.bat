@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM Prefer Windows Python launcher, then python, then python3
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && set "PY=python3"

if not defined PY (
  echo [ERROR] 未找到 Python。请先安装 Python 3.10/3.11，并勾选 "Add python.exe to PATH"。
  echo 安装后新开 CMD，执行: python --version
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating venv with: %PY%
  %PY% -m venv .venv
  if errorlevel 1 (
    echo [ERROR] 创建虚拟环境失败。请确认已安装 Python 且路径无中文/特殊权限问题。
    pause
    exit /b 1
  )
  if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] .venv 创建后仍找不到 Scripts\python.exe
    pause
    exit /b 1
  )
  echo Installing dependencies ^(首次较慢^)...
  ".venv\Scripts\python.exe" -m pip install -U pip
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] pip install 失败
    pause
    exit /b 1
  )
)

echo Starting OCR on http://127.0.0.1:9100 ...
".venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 9100
pause
