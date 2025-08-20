#!/bin/bash

echo "🎮 Starting Roll and Move Game Server..."
echo

cd server
echo "Server starting on http://localhost:2567"
echo "Monitor available at http://localhost:2567/colyseus"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start
