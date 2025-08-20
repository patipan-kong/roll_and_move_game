import { Room, Client } from "colyseus";
import { GameState, Player } from "../schemas/GameSchema";

export class GameRoom extends Room<GameState> {
  maxClients = 4;
  private turnTimer: any = null;

  onCreate(options: any) {
    this.setState(new GameState());
    
    console.log("GameRoom created!", options);
    
    // Initialize the game state
    this.state.gameStarted = false;
    this.state.currentPlayerIndex = 0;
    this.state.turnTimeLeft = 0;
    
    // Set up message handlers
    this.onMessage("ready", (client: Client) => {
      this.handlePlayerReady(client);
    });
    
    this.onMessage("roll_dice", (client: Client) => {
      this.handleRollDice(client);
    });
    
    this.onMessage("chat", (client: Client, message: any) => {
      this.broadcast("chat", {
        playerId: client.sessionId,
        playerName: this.state.players.get(client.sessionId)?.name,
        message: message.text
      });
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // Create new player
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.character = options.character || "warrior";
    player.position = 0;
    player.isReady = false;

    this.state.players.set(client.sessionId, player);

    // Auto-start game if single player mode
    if (options.singlePlayer) {
      this.state.isSinglePlayer = true;
      this.startGame();
    }

    // Check if we can start multiplayer game
    if (!this.state.isSinglePlayer && this.state.players.size >= 2) {
      this.checkAllPlayersReady();
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // Remove player from game
    this.state.players.delete(client.sessionId);

    // If game was in progress and player left, handle accordingly
    if (this.state.gameStarted && this.state.players.size === 0) {
      // All players left, reset game
      this.state.gameStarted = false;
    } else if (this.state.gameStarted && this.state.players.size > 0) {
      // Adjust current player index if needed
      if (this.state.currentPlayerIndex >= this.state.players.size) {
        this.state.currentPlayerIndex = 0;
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  private handlePlayerReady(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isReady = true;
      this.checkAllPlayersReady();
    }
  }

  private checkAllPlayersReady() {
    const allReady = Array.from(this.state.players.values()).every((player: Player) => player.isReady);
    
    if (allReady && this.state.players.size >= 2 && !this.state.gameStarted) {
      this.startGame();
    }
  }

  private startGame() {
    this.state.gameStarted = true;
    this.state.currentPlayerIndex = 0;
    this.state.turnTimeLeft = 30; // 30 seconds per turn
    
    console.log("Game started!");
    this.broadcast("game_started", { message: "Game has started!" });
    
    this.startTurnTimer();
  }

  private handleRollDice(client: Client) {
    // Check if it's the player's turn
    const playerIds = Array.from(this.state.players.keys());
    const currentPlayerId = playerIds[this.state.currentPlayerIndex];
    
    if (client.sessionId !== currentPlayerId) {
      return; // Not this player's turn
    }

    if (!this.state.gameStarted) {
      return; // Game not started
    }

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Roll two dice
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;

    // Update player position
    const newPosition = Math.min(player.position + total, 64);
    player.position = newPosition;

    // Broadcast dice roll result
    this.broadcast("dice_rolled", {
      playerId: client.sessionId,
      playerName: player.name,
      dice1,
      dice2,
      total,
      newPosition
    });

    // Check for win condition
    if (newPosition >= 64) {
      this.state.winner = client.sessionId;
      this.state.gameStarted = false;
      this.broadcast("game_ended", {
        winner: client.sessionId,
        winnerName: player.name
      });
      return;
    }

    // Move to next player's turn
    this.nextTurn();
  }

  private nextTurn() {
    const playerCount = this.state.players.size;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % playerCount;
    this.state.turnTimeLeft = 30;
    
    const playerIds = Array.from(this.state.players.keys());
    const nextPlayerId = playerIds[this.state.currentPlayerIndex];
    
    this.broadcast("next_turn", {
      currentPlayerId: nextPlayerId,
      currentPlayerName: this.state.players.get(nextPlayerId)?.name
    });
    
    this.startTurnTimer();
  }

  private startTurnTimer() {
    // Clear any existing timer
    if (this.turnTimer) {
      this.turnTimer.clear();
      this.turnTimer = null;
    }

    // Start countdown timer
    this.turnTimer = this.clock.setInterval(() => {
      this.state.turnTimeLeft--;
      
      if (this.state.turnTimeLeft <= 0) {
        // Time's up, move to next player
        if (this.turnTimer) {
          this.turnTimer.clear();
          this.turnTimer = null;
        }
        this.nextTurn();
      }
    }, 1000);
  }
}
