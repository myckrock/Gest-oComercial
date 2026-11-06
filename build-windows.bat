@echo off
setlocal
cd /d "%~dp0"
echo Instalando dependencias...
npm install
if errorlevel 1 goto :error
echo.
echo Gerando instalador Windows...
npm run dist:win
if errorlevel 1 goto :error
echo.
echo CONCLUIDO. O instalador estara na pasta dist\
pause
exit /b 0
:error
echo.
echo ERRO durante a compilacao.
pause
exit /b 1
