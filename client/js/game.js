// Game state and networking
class Game {
    constructor(url) {
        this.client = new Colyseus.Client(url);
        this.room = null;
        this.currentPlayer = null;
        this.gameState = null;
        this.isConnected = false;
        this.questions = []; // เก็บข้อมูลคำถาม
        
        this.loadQuestions();
        this.setupConnectionListeners();
    }

    async loadQuestions() {
        try {
            const response = await fetch('./data/question.json');
            this.questions = await response.json();
            console.log(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('Failed to load questions:', error);
        }
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

        this.room.onMessage('player_finished', (message) => {
            this.handlePlayerFinished(message);
        });

        this.room.onMessage('race_ended', (message) => {
            this.handleRaceEnd(message);
        });

        this.room.onMessage('question_result', (message) => {
            this.handleQuestionResult(message);
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
                
                // แสดงคำถามถ้าเป็นผู้เล่นปัจจุบันและตำแหน่งใหม่ 1-64
                if (message.playerId === this.room.sessionId && message.newPosition > 0 && message.newPosition <= 64) {
                    this.showQuestion(message.newPosition);
                }
            }
        }, 1000);
    }

    handlePlayerFinished(message) {
        console.log('Player finished:', message);
        UI.addLogEntry(
            `${message.playerName} finished in ${message.finishPosition}${this.getOrdinalSuffix(message.finishPosition)} place! Time: ${message.completionTime}`,
            'win'
        );
    }

    handleRaceEnd(message) {
        console.log('Race ended:', message);
        UI.showRaceResults(message.rankings);
    }

    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) {
            return "st";
        }
        if (j == 2 && k != 12) {
            return "nd";
        }
        if (j == 3 && k != 13) {
            return "rd";
        }
        return "th";
    }

    handleChatMessage(message) {
        UI.addChatMessage(message.playerName, message.message);
    }

    // Game actions
    rollDice() {
        console.log('rollDice called, room:', this.room, 'gameState:', this.gameState);
        if (this.room && this.gameState && this.gameState.gameStarted) {
            console.log('Sending roll_dice message to server');
            this.room.send('roll_dice');
        } else {
            console.log('Cannot roll dice - room:', !!this.room, 'gameState:', !!this.gameState, 'gameStarted:', this.gameState?.gameStarted);
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

    // Question handling methods
    showQuestion(position) {
        const question = this.questions.find(q => q.id === position);
        if (!question) {
            console.log(`No question found for position ${position}`);
            return;
        }

        UI.showQuestion(question);
    }

    answerQuestion(questionId, selectedAnswer) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        // ส่งคำตอบไปยังเซิร์ฟเวอร์
        this.room.send('answer_question', {
            questionId,
            selectedAnswer,
            correctAnswer: question.correct_answer
        });
    }

    handleQuestionResult(message) {
        UI.showQuestionResult(message);
    }
}

