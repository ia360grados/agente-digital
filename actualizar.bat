@echo off
REM Agente Digital - Auto-actualizacion nocturna (Windows)
set DIR=%USERPROFILE%\agente-digital
set LOG=%DIR%\agente\actualizaciones.log
cd /d "%DIR%" || exit /b 0

for /f %%i in ('git rev-parse HEAD') do set ANTES=%%i
git pull --ff-only >> "%LOG%" 2>&1
for /f %%i in ('git rev-parse HEAD') do set DESPUES=%%i

if "%ANTES%"=="%DESPUES%" exit /b 0

echo [%date% %time%] Actualizado, reinstalando dependencias >> "%LOG%"
cd /d "%DIR%\agente"
call npm install --silent >> "%LOG%" 2>&1

REM Reiniciar el agente
taskkill /f /im node.exe /fi "WINDOWTITLE eq AgenteDigital*" >nul 2>nul
wscript "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AgenteDigital.vbs"
echo [%date% %time%] Agente reiniciado con nueva version >> "%LOG%"
