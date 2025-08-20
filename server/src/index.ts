import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Enable CORS for all routes
app.use(cors());

// Create HTTP & WebSocket server
const server = createServer(app);
const gameServer = new Server({
  server,
});

// Register room handlers
gameServer.define('game_room', GameRoom);

// Serve static files from client directory in development
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static('../client'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

gameServer.listen(port);
console.log(`🎮 Roll and Move Game Server is running on http://localhost:${port}`);
console.log(`📊 Monitor: http://localhost:${port}/colyseus`);
