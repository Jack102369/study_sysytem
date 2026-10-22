@echo off
REM ============================================================
REM 服务器首次：创建电子宠物 + 高一化学全部表结构（空表）
REM 用法：
REM   1. 把整个 db 目录拷到服务器
REM   2. 改下面 USER / PASS / DB
REM   3. 双击或在 cmd 中运行本 bat
REM 前提：服务器已有 users 表（主系统已建库）
REM ============================================================
chcp 65001 >nul
setlocal

set MYSQL=mysql
set HOST=127.0.0.1
set PORT=3306
set USER=study_user
set PASS=请改成服务器密码
set DB=study_system

cd /d "%~dp0"

echo [1/9] pet_assistant
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_pet_assistant.sql
if errorlevel 1 goto fail

echo [2/9] chemistry_phase1
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_phase1.sql
if errorlevel 1 goto fail

echo [3/9] chemistry_phase2
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_phase2.sql
if errorlevel 1 goto fail

echo [4/9] chemistry_train_phase1
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_train_phase1.sql
if errorlevel 1 goto fail

echo [5/9] chemistry_train_answer_type
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_train_answer_type.sql
if errorlevel 1 goto fail

echo [6/9] chemistry_daily_review
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_daily_review.sql
if errorlevel 1 goto fail

echo [7/9] chemistry_advanced_session_kind_comment
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_advanced_session_kind_comment.sql
if errorlevel 1 goto fail

echo [8/9] chemistry_wrong_question_phase1
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_wrong_question_phase1.sql
if errorlevel 1 goto fail

echo [9/9] chemistry_wrong_question_phase2
%MYSQL% -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 < migrate_chemistry_wrong_question_phase2.sql
if errorlevel 1 goto fail

echo.
echo === 表结构完成。接下来导入 chem_content_sync.sql 灌化学数据 ===
echo 命令示例：
echo mysql -h%HOST% -P%PORT% -u%USER% -p%PASS% %DB% --default-character-set=utf8mb4 ^< chem_content_sync.sql
echo.
pause
exit /b 0

:fail
echo.
echo !!! 失败，请检查上面报错（密码/库名/是否已有 users 表）
pause
exit /b 1
