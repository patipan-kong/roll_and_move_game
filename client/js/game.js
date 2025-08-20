// Game state and networking
class Game {
    constructor() {
        this.client = new Colyseus.Client('ws://localhost:2567');
        this.room = null;
        this.currentPlayer = null;
        this.gameState = null;
        this.isConnected = false;
        
        this.setupConnectionListeners();
    }

    setupConnectionListeners() {
        // Update connection status
        this.updateConnectionStatus('connecting');
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('statusText');
        const statusContainer = document.getElementById('connectionStatus');
        
        statusContainer.className = `connection-status ${status}`;
        
        switch(status) {
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                break;
            case 'connected':
                statusElement.textContent = 'Connected';
                this.isConnected = true;
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                this.isConnected = false;
                break;
        }
    }

    async joinRoom(options = {}) {
        try {
            this.showLoading(true);
            
            if (options.roomId) {
                // Join existing room
                this.room = await this.client.joinById(options.roomId, {
                    name: options.name,
                    character: options.character,
                    singlePlayer: false
                });
            } else if (options.singlePlayer) {
                // Create single player room
                this.room = await this.client.create('game_room', {
                    name: options.name,
                    character: options.character,
                    singlePlayer: true
                });
            } else {
                // Create multiplayer room
                this.room = await this.client.create('game_room', {
                    name: options.name,
                    character: options.character,
                    singlePlayer: false
                });
            }

            this.setupRoomListeners();
            this.updateConnectionStatus('connected');
            this.showLoading(false);
            
            return this.room;
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.showLoading(false);
            this.updateConnectionStatus('disconnected');
            throw error;
        }
    }

    setupRoomListeners() {
        if (!this.room) return;

        // Room state changes
        this.room.onStateChange((state) => {
            this.gameState = state;
            this.handleStateChange(state);
        });

        // Player joins
        this.room.state.players.onAdd = (player, key) => {
            console.log(`Player ${player.name} joined`);
            this.handlePlayerJoin(player, key);
        };

        // Player leaves
        this.room.state.players.onRemove = (player, key) => {
            console.log(`Player ${player.name} left`);
            this.handlePlayerLeave(player, key);
        };

        // Messages from server
        this.room.onMessage('game_started', (message) => {
            this.handleGameStart(message);
        });

        this.room.onMessage('dice_rolled', (message) => {
            this.handleDiceRoll(message);
        });

        this.room.onMessage('next_turn', (message) => {
            this.handleNextTurn(message);
        });

        this.room.onMessage('game_ended', (message) => {
            this.handleGameEnd(message);
        });

        this.room.onMessage('chat', (message) => {
            this.handleChatMessage(message);
        });

        // Connection events
        this.room.onLeave((code) => {
            console.log('Left room with code:', code);
            this.updateConnectionStatus('disconnected');
        });

        this.room.onError((code, message) => {
            console.error('Room error:', code, message);
            this.updateConnectionStatus('disconnected');
        });
    }

    handleStateChange(state) {
        // Update UI based on state changes
        if (UI.currentScreen === 'multiplayerLobby') {
            UI.updatePlayersList(state.players);
        } else if (UI.currentScreen === 'gameScreen') {
            UI.updateGameState(state);
            Board.updateBoard(state);
        }
    }

    handlePlayerJoin(player, key) {
        if (key === this.room.sessionId) {
            this.currentPlayer = player;
        }
        
        if (UI.currentScreen === 'multiplayerLobby' && this.gameState && this.gameState.players) {
            UI.updatePlayersList(this.gameState.players);
        }
    }

    handlePlayerLeave(player, key) {
        if (UI.currentScreen === 'multiplayerLobby' && this.gameState && this.gameState.players) {
            UI.updatePlayersList(this.gameState.players);
        }
    }

    handleGameStart(message) {
        console.log('Game started:', message);
        UI.showGameScreen();
        UI.addLogEntry('Game started! Let the race begin!', 'game');
    }

    handleDiceRoll(message) {
        console.log('Dice rolled:', message);
        
        // Show dice animation
        UI.showDiceRoll(message.dice1, message.dice2);
        
        // Add to game log
        UI.addLogEntry(
            `${message.playerName} rolled ${message.dice1} + ${message.dice2} = ${message.total}`,
            'dice'
        );
        
        // Update board after animation
        setTimeout(() => {
            Board.updateBoard(this.gameState);
            
            if (message.newPosition >= 64) {
                UI.addLogEntry(`${message.playerName} reached the finish!`, 'win');
            } else {
                UI.addLogEntry(`${message.playerName} moved to square ${message.newPosition}`, 'move');
            }
        }, 1000);
    }

    handleNextTurn(message) {
        console.log('Next turn:', message);
        UI.updateCurrentTurn(message.currentPlayerId, message.currentPlayerName);
        UI.addLogEntry(`It's ${message.currentPlayerName}'s turn`, 'turn');
    }

    handleGameEnd(message) {
        console.log('Game ended:', message);
        UI.showGameOver(message.winner, message.winnerName);
    }

    handleChatMessage(message) {
        UI.addChatMessage(message.playerName, message.message);
    }

    // Game actions
    rollDice() {
        if (this.room && this.gameState && this.gameState.gameStarted) {
            this.room.send('roll_dice');
        }
    }

    sendChatMessage(message) {
        if (this.room && message.trim()) {
            this.room.send('chat', { text: message });
        }
    }

    setPlayerReady() {
        if (this.room) {
            this.room.send('ready');
        }
    }

    leaveRoom() {
        if (this.room) {
            this.room.leave();
            this.room = null;
            this.currentPlayer = null;
            this.gameState = null;
        }
        this.updateConnectionStatus('disconnected');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Character info
    getCharacterIcon(character) {
        const icons = {
            warrior: '⚔️',
            mage: '🧙‍♂️',
            rogue: '🗡️',
            archer: '🏹'
        };
        return icons[character] || '👤';
    }

    getCharacterName(character) {
        const names = {
            warrior: 'Warrior',
            mage: 'Mage',
            rogue: 'Rogue',
            archer: 'Archer'
        };
        return names[character] || 'Player';
    }
}

// Global game instance
const game = new Game();
