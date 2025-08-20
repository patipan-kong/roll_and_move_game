@echo off
echo 🎲 Roll and Move Game - Installation Script
echo.

echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Server installation failed!
    pause
    exit /b 1
)

echo.
echo Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Client installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Installation completed successfully!
echo.
echo To start the game:
echo 1. Run start-server.bat to start the server
echo 2. Run start-client.bat to start the client
echo 3. Open http://localhost:3000 in your browser
echo.
pause
