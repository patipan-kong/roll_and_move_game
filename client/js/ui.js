// UI Management
class UIManager {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.selectedCharacter = 'warrior';
        this.playerName = '';
        this.currentRoomId = '';
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main Menu
        document.getElementById('singlePlayerBtn').addEventListener('click', () => {
            this.startSinglePlayer();
        });

        document.getElementById('multiplayerBtn').addEventListener('click', () => {
            this.showMultiplayerLobby();
        });

        document.getElementById('howToPlayBtn').addEventListener('click', () => {
            this.showHowToPlay();
        });

        // Character Selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(card.dataset.character);
            });
        });

        // Player Name Input
        document.getElementById('playerName').addEventListener('input', (e) => {
            this.playerName = e.target.value;
        });

        // Multiplayer Lobby
        document.getElementById('hostGameBtn').addEventListener('click', () => {
            this.hostGame();
        });

        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.joinGame();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('readyBtn').addEventListener('click', () => {
            this.setReady();
        });

        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Game Controls
        document.getElementById('rollDiceBtn').addEventListener('click', () => {
            this.rollDice();
        });

        // Chat
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChat();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChat();
            }
        });

        // Tutorial
        document.getElementById('backFromTutorialBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Game Over
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('backToMenuFromGameBtn').addEventListener('click', () => {
            this.backToMenuFromGame();
        });

        // Room ID Input
        document.getElementById('roomIdInput').addEventListener('input', (e) => {
            this.currentRoomId = e.target.value;
        });
    }

    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    showMainMenu() {
        this.showScreen('mainMenu');
        game.leaveRoom();
    }

    showMultiplayerLobby() {
        if (!this.validatePlayerInput()) return;
        this.showScreen('multiplayerLobby');
    }

    showGameScreen() {
        this.showScreen('gameScreen');
        this.initializeGameScreen();
    }

    showHowToPlay() {
        this.showScreen('howToPlayScreen');
    }

    // Character Selection
    selectCharacter(character) {
        // Remove previous selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        document.querySelector(`[data-character="${character}"]`).classList.add('selected');
        this.selectedCharacter = character;
    }

    // Game Actions
    async startSinglePlayer() {
        if (!this.validatePlayerInput()) return;

        try {
            await game.joinRoom({
                name: this.playerName,
                character: this.selectedCharacter,
                singlePlayer: true
            });
            this.showGameScreen();
        } catch (error) {
            alert('Failed to start single player game: ' + error.message);
        }
    }

    async hostGame() {
        if (!this.validatePlayerInput()) return;

        try {
            const room = await game.joinRoom({
                name: this.playerName,
                character: this.selectedCharacter,
                singlePlayer: false
            });

            // Show room info
            document.getElementById('currentRoomId').textContent = room.id;
            document.getElementById('roomInfo').classList.remove('hidden');
            
            // Wait a bit for the state to be initialized, then update players list
            setTimeout(() => {
                if (game.gameState && game.gameState.players) {
                    this.updatePlayersList(game.gameState.players);
                }
            }, 100);
        } catch (error) {
            alert('Failed to host game: ' + error.message);
        }
    }

    async joinGame() {
        if (!this.validatePlayerInput()) return;
        if (!this.currentRoomId.trim()) {
            alert('Please enter a Room ID');
            return;
        }

        try {
            const room = await game.joinRoom({
                name: this.playerName,
                character: this.selectedCharacter,
                roomId: this.currentRoomId.trim()
            });

            // Show room info
            document.getElementById('currentRoomId').textContent = room.id;
            document.getElementById('roomInfo').classList.remove('hidden');
            
            // Wait a bit for the state to be initialized, then update players list
            setTimeout(() => {
                if (game.gameState && game.gameState.players) {
                    this.updatePlayersList(game.gameState.players);
                }
            }, 100);
        } catch (error) {
            alert('Failed to join game: ' + error.message);
        }
    }

    setReady() {
        game.setPlayerReady();
        document.getElementById('readyBtn').disabled = true;
        document.getElementById('readyBtn').textContent = 'Ready!';
    }

    leaveRoom() {
        game.leaveRoom();
        document.getElementById('roomInfo').classList.add('hidden');
        document.getElementById('readyBtn').disabled = false;
        document.getElementById('readyBtn').textContent = 'Ready';
        this.showMainMenu();
    }

    rollDice() {
        const button = document.getElementById('rollDiceBtn');
        button.disabled = true;
        
        // Check if it's the player's turn
        if (game.gameState && game.currentPlayer) {
            const playerIds = Array.from(game.gameState.players.keys());
            const currentPlayerId = playerIds[game.gameState.currentPlayerIndex];
            
            if (currentPlayerId === game.room.sessionId) {
                game.rollDice();
            }
        }
        
        // Re-enable button after a delay
        setTimeout(() => {
            button.disabled = false;
        }, 2000);
    }

    sendChat() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            game.sendChatMessage(message);
            input.value = '';
        }
    }

    playAgain() {
        this.hideGameOver();
        this.showMainMenu();
    }

    backToMenuFromGame() {
        this.hideGameOver();
        this.showMainMenu();
    }

    // UI Updates
    updatePlayersList(players) {
        const container = document.getElementById('playersList');
        container.innerHTML = '';

        if (!players) {
            return;
        }

        players.forEach((player, playerId) => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.isReady ? 'ready' : ''}`;
            
            playerElement.innerHTML = `
                <span class="player-character">${game.getCharacterIcon(player.character)}</span>
                <span class="player-name">${player.name}</span>
                <span class="player-status ${player.isReady ? 'ready' : ''}">${player.isReady ? 'Ready' : 'Not Ready'}</span>
            `;
            
            container.appendChild(playerElement);
        });
    }

    initializeGameScreen() {
        // Initialize board
        Board.createBoard();
        
        // Clear game log and chat
        document.getElementById('gameLog').innerHTML = '';
        document.getElementById('chatMessages').innerHTML = '';
        
        // Reset dice
        document.getElementById('dice1').textContent = '?';
        document.getElementById('dice2').textContent = '?';
        
        // Enable roll button
        document.getElementById('rollDiceBtn').disabled = false;
    }

    updateGameState(state) {
        // Update player status
        this.updatePlayersStatus(state.players);
        
        // Update turn timer
        document.getElementById('turnTimer').textContent = state.turnTimeLeft;
        
        // Update current player indicator
        const playerIds = Array.from(state.players.keys());
        if (playerIds.length > 0) {
            const currentPlayerId = playerIds[state.currentPlayerIndex];
            const currentPlayer = state.players.get(currentPlayerId);
            if (currentPlayer) {
                document.getElementById('currentPlayerName').textContent = currentPlayer.name;
            }
        }
        
        // Enable/disable roll dice button
        const isCurrentPlayer = game.room && 
                                state.players.size > 0 && 
                                playerIds[state.currentPlayerIndex] === game.room.sessionId;
        document.getElementById('rollDiceBtn').disabled = !isCurrentPlayer || !state.gameStarted;
    }

    updatePlayersStatus(players) {
        const container = document.getElementById('playersStatus');
        container.innerHTML = '';

        players.forEach((player, playerId) => {
            const isCurrentPlayer = game.room && playerId === game.room.sessionId;
            const playerElement = document.createElement('div');
            playerElement.className = `player-status-item ${isCurrentPlayer ? 'current' : ''}`;
            
            playerElement.innerHTML = `
                <span class="player-status-character">${game.getCharacterIcon(player.character)}</span>
                <div class="player-status-info">
                    <div class="player-status-name">${player.name}</div>
                    <div class="player-status-position">Position: ${player.position}/64</div>
                </div>
            `;
            
            container.appendChild(playerElement);
        });
    }

    updateCurrentTurn(playerId, playerName) {
        document.getElementById('currentPlayerName').textContent = playerName;
        
        // Enable/disable roll button based on turn
        const isMyTurn = game.room && playerId === game.room.sessionId;
        document.getElementById('rollDiceBtn').disabled = !isMyTurn;
    }

    showDiceRoll(dice1, dice2) {
        const dice1Element = document.getElementById('dice1');
        const dice2Element = document.getElementById('dice2');
        
        // Add rolling animation
        dice1Element.classList.add('rolling');
        dice2Element.classList.add('rolling');
        
        // Show random numbers during animation
        let animationCount = 0;
        const animationInterval = setInterval(() => {
            dice1Element.textContent = Math.floor(Math.random() * 6) + 1;
            dice2Element.textContent = Math.floor(Math.random() * 6) + 1;
            
            animationCount++;
            if (animationCount >= 10) {
                clearInterval(animationInterval);
                
                // Show final result
                dice1Element.textContent = dice1;
                dice2Element.textContent = dice2;
                
                // Remove animation
                setTimeout(() => {
                    dice1Element.classList.remove('rolling');
                    dice2Element.classList.remove('rolling');
                }, 500);
            }
        }, 100);
    }

    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('gameLog');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    addChatMessage(playerName, message) {
        const chatContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        messageElement.innerHTML = `
            <span class="chat-player">${playerName}:</span>
            <span class="chat-text">${this.escapeHtml(message)}</span>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showGameOver(winnerId, winnerName) {
        const modal = document.getElementById('gameOverModal');
        const message = document.getElementById('winnerMessage');
        
        const isWinner = game.room && winnerId === game.room.sessionId;
        message.textContent = isWinner ? 
            `Congratulations! You won the game!` : 
            `${winnerName} won the game!`;
        
        modal.classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('gameOverModal').classList.add('hidden');
    }

    // Validation
    validatePlayerInput() {
        const name = document.getElementById('playerName').value.trim();
        
        if (!name) {
            alert('Please enter your name');
            document.getElementById('playerName').focus();
            return false;
        }
        
        if (name.length < 2) {
            alert('Name must be at least 2 characters long');
            document.getElementById('playerName').focus();
            return false;
        }
        
        this.playerName = name;
        return true;
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global UI instance
const UI = new UIManager();
