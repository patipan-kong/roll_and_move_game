#!/bin/bash

echo "🎲 Roll and Move Game - Installation Script"
echo

echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Server installation failed!"
    exit 1
fi

echo
echo "Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Client installation failed!"
    exit 1
fi

echo
echo "✅ Installation completed successfully!"
echo
echo "To start the game:"
echo "1. Run ./start-server.sh to start the server"
echo "2. Run ./start-client.sh to start the client"
echo "3. Open http://localhost:3000 in your browser"
echo
