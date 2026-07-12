@echo off
REM ============================================================
REM  AGENTE DIGITAL - Instalador para Windows (doble clic)
REM  El cliente solo hace doble clic y acepta lo que salga.
REM ============================================================
setlocal enabledelayedexpansion
title Agente Digital - Instalacion
color 0A
cls
echo ==================================================
echo.
echo      AGENTE DIGITAL - Instalacion automatica
echo.
echo   Esta ventana instala tu empleado digital.
echo   Solo tendras que:
echo    - aceptar si Windows pide permiso
echo    - iniciar sesion en Claude en el navegador
echo    - escanear un codigo QR con el movil del agente
echo.
echo   Duracion: 15-25 minutos. NO cierres esta ventana.
echo.
echo ==================================================
pause

set REPO_URL=https://github.com/TU_USUARIO/agente-digital.git
set DEST=%USERPROFILE%\agente-digital

REM ---------- 1. Git ----------
echo.
echo [1/7] Instalando Git...
where git >nul 2>nul || winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
echo   OK

REM ---------- 2. Node ----------
echo.
echo [2/7] Instalando el motor (Node.js)...
where node >nul 2>nul || winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
REM refrescar PATH de esta sesion
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\Git\cmd;%APPDATA%\npm;%PATH%"
echo   OK

REM ---------- 3. Claude Code ----------
echo.
echo [3/7] Instalando la inteligencia (Claude Code)...
where claude >nul 2>nul || call npm install -g @anthropic-ai/claude-code
echo   OK

REM ---------- 4. El agente ----------
echo.
echo [4/7] Descargando tu Agente Digital...
if exist "%DEST%\.git" (git -C "%DEST%" pull --ff-only) else (git clone %REPO_URL% "%DEST%")
cd /d "%DEST%\agente"
call npm install --silent
echo   OK

REM ---------- 5. Login de Claude ----------
echo.
echo [5/7] Conecta tu cuenta de Claude:
echo    1. Se abrira Claude: inicia sesion en el navegador con TU cuenta
echo    2. Cuando Claude te deje escribir, teclea  /exit  y pulsa INTRO
pause
call claude
echo   OK

REM ---------- 6. Configuracion ----------
echo.
echo [6/7] Configura tu negocio (6 preguntas):
node wizard.mjs

REM ---------- 7. Vincular WhatsApp por QR ----------
echo.
echo [7/7] Coge el MOVIL DEL AGENTE (numero nuevo, WhatsApp ya activo).
echo   En ese movil: WhatsApp - Ajustes - Dispositivos vinculados - Vincular.
echo   Y escanea el codigo que va a aparecer aqui:
pause
node lector.mjs --vincular

REM ---------- 8. Autoarranque + anti-suspension ----------
echo.
echo Configurando arranque automatico...
set VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AgenteDigital.vbs
> "%VBS%" echo CreateObject("Wscript.Shell").Run "cmd /c cd /d %DEST%\agente && node lector.mjs", 0, False
powercfg /change standby-timeout-ac 0 >nul 2>nul
powercfg /change hibernate-timeout-ac 0 >nul 2>nul
start "" wscript "%VBS%"

REM Auto-actualizacion nocturna (4:30)
schtasks /create /f /tn "AgenteDigitalActualizar" /sc daily /st 04:30 /tr "\"%DEST%\actualizar.bat\"" >nul 2>nul

cls
echo ==================================================
echo.
echo    INSTALACION COMPLETADA
echo.
echo    Tu agente ya trabaja en segundo plano y
echo    arrancara solo aunque reinicies el ordenador.
echo.
echo    PRUEBALO: desde tu movil personal, escribe por
echo    WhatsApp al numero del agente:  Hola, quien eres?
echo.
echo ==================================================
pause
