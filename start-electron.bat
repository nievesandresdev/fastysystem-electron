@echo off
title FastySystem Electron
cd /d "%~dp0"

REM Verificar que está compilado
if not exist "dist\main.js" (
    echo Compilando electron...
    call npm run build
    if %errorlevel% neq 0 (
        echo Error compilando electron
        pause
        exit /b 1
    )
)

REM Verificar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo Error instalando dependencias
        pause
        exit /b 1
    )
)

REM Ejecutar el script Node.js directamente (sin crear nueva ventana)
REM La salida se redirige desde el script principal
if exist "scripts\start-electron.js" (
    node scripts\start-electron.js
) else (
    npm start
)

