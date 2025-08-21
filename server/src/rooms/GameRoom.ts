import { Room, Client } from "colyseus";
import { GameState, Player } from "../schemas/GameSchema";

const LETTERS = "0123456789";

export class GameRoom extends Room<GameState> {
  maxClients = 4;
  private turnTimer: any = null;
  LOBBY_CHANNEL = "$mylobby"

  generateRoomIdSingle(): string {
        let result = '';
        for (var i = 0; i < 4; i++) {
            result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
        }
        return result;
    }

    async generateRoomId(): Promise<string> {
        const currentIds = await this.presence.smembers(this.LOBBY_CHANNEL);
        let id;
        do {
            id = this.generateRoomIdSingle();
        } while (currentIds.includes(id));
 
        await this.presence.sadd(this.LOBBY_CHANNEL, id);
        return id;
    }

  async onCreate(options: any) {
    this.roomId = await this.generateRoomId();
    this.setState(new GameState());
    
    console.log("GameRoom created!", options);
    
    // Initialize the game state
    this.state.gameStarted = false;
    this.state.finishedPlayersCount = 0;
    this.state.raceCompleted = false;
    
    // Set up message handlers
    this.onMessage("ready", (client: Client) => {
      this.handlePlayerReady(client);
    });
    
    this.onMessage("roll_dice", (client: Client) => {
      this.handleRollDice(client);
    });

    this.onMessage("answer_question", (client: Client, message: any) => {
      this.handleAnswerQuestion(client, message);
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
    player.hasFinished = false;
    player.finishTime = 0;
    player.completionDuration = 0;
    player.formattedTime = "";
    player.finishPosition = 0;

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
    }
  }

  async onDispose() {
    this.presence.srem(this.LOBBY_CHANNEL, this.roomId);
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
    this.state.gameStartTime = Date.now();
    this.state.finishedPlayersCount = 0;
    this.state.raceCompleted = false;
    
    console.log("Real-time race started! All players can roll dice simultaneously!");
    this.broadcast("game_started", { 
      message: "Real-time race started! Everyone can roll dice now!",
      gameMode: "realtime"
    });
  }

  private handleRollDice(client: Client) {
    if (!this.state.gameStarted) {
      return; // Game not started
    }

    const player = this.state.players.get(client.sessionId);
    if (!player || player.hasFinished) {
      return; // Player not found or already finished
    }

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
      newPosition,
      position: newPosition // เพิ่มตำแหน่งปัจจุบันสำหรับแสดงคำถาม
    });

    // Check for completion
    if (newPosition >= 64 && !player.hasFinished) {
      this.handlePlayerFinish(client.sessionId, player);
    }
  }

  private handlePlayerFinish(playerId: string, player: Player) {
    // Mark player as finished
    player.hasFinished = true;
    player.finishTime = Date.now();
    player.completionDuration = Math.floor((player.finishTime - this.state.gameStartTime) / 1000);
    player.formattedTime = this.formatTime(player.completionDuration);
    
    // Set finish position
    this.state.finishedPlayersCount++;
    player.finishPosition = this.state.finishedPlayersCount;
    
    // Set first place winner
    if (this.state.finishedPlayersCount === 1) {
      this.state.winner = playerId;
    }
    
    // Broadcast player finish
    this.broadcast("player_finished", {
      playerId: playerId,
      playerName: player.name,
      finishPosition: player.finishPosition,
      completionTime: player.formattedTime,
      allFinishedPlayers: this.getFinishedPlayersRanking()
    });
    
    // Check if race should end (all players finished or only one player left)
    const totalPlayers = this.state.players.size;
    const activePlayers = totalPlayers - this.state.finishedPlayersCount;
    
    if (this.state.finishedPlayersCount >= totalPlayers || activePlayers <= 0) {
      this.endRace();
    }
  }

  private getFinishedPlayersRanking() {
    const finishedPlayers: any[] = [];
    this.state.players.forEach((player: Player, playerId: string) => {
      if (player.hasFinished) {
        finishedPlayers.push({
          playerId: playerId,
          playerName: player.name,
          character: player.character,
          finishPosition: player.finishPosition,
          completionTime: player.formattedTime,
          completionDuration: player.completionDuration,
          totalQuestions: player.totalQuestions,
          correctAnswers: player.correctAnswers
        });
      }
    });
    
    // Sort by finish position
    return finishedPlayers.sort((a, b) => a.finishPosition - b.finishPosition);
  }

  private endRace() {
    this.state.gameStarted = false;
    this.state.raceCompleted = true;
    
    const rankings = this.getFinishedPlayersRanking();
    
    this.broadcast("race_ended", {
      winner: this.state.winner,
      winnerName: this.state.players.get(this.state.winner)?.name,
      rankings: rankings,
      message: "Race completed! Here are the final results:"
    });
  }

  private handleAnswerQuestion(client: Client, message: any) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const { questionId, selectedAnswer, correctAnswer } = message;
    const isCorrect = selectedAnswer === correctAnswer;

    // อัพเดทสถิติผู้เล่น
    player.totalQuestions++;
    if (isCorrect) {
      player.correctAnswers++;
    }

    // ส่งผลลัพธ์กลับให้ผู้เล่น
    this.send(client, "question_result", {
      questionId,
      isCorrect,
      correctAnswer,
      totalQuestions: player.totalQuestions,
      correctAnswers: player.correctAnswers
    });

    console.log(`Player ${player.name} answered question ${questionId}: ${isCorrect ? 'Correct' : 'Wrong'}`);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
