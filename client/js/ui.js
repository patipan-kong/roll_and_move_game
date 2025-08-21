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

        // Question Modal
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.hideQuestion();
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
        console.log('UI rollDice called');
        const button = document.getElementById('rollDiceBtn');
        button.disabled = true;
        
        // In real-time mode, anyone can roll anytime when game is started
        if (game.gameState && game.gameState.gameStarted) {
            console.log('Calling game.rollDice()');
            game.rollDice();
        } else {
            console.log('Cannot roll - gameState:', game.gameState, 'gameStarted:', game.gameState?.gameStarted);
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
        
        // Update game status for real-time mode
        // No need to track turns or timers in real-time mode
        
        // Enable roll dice button for real-time mode (all players can roll anytime)
        const rollButton = document.getElementById('rollDiceBtn');
        rollButton.disabled = !state.gameStarted;
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

    updateGameState(state) {
        // Update game UI based on state - now real-time, so everyone can roll
        const rollButton = document.getElementById('rollDiceBtn');
        rollButton.disabled = !state.gameStarted;
        
        // Update player positions if needed
        this.updatePlayersList(state.players);
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

    showGameOver(winnerId, winnerName, gameDuration, formattedTime) {
        const modal = document.getElementById('gameOverModal');
        const message = document.getElementById('winnerMessage');
        
        const isWinner = game.room && winnerId === game.room.sessionId;
        const winMessage = isWinner ? 
            `Congratulations! You won the game!` : 
            `${winnerName} won the game!`;
        
        if (formattedTime) {
            message.innerHTML = `
                ${winMessage}<br><br>
                <strong>🕒 Game Duration: ${formattedTime}</strong>
            `;
        } else {
            message.textContent = winMessage;
        }
        
        modal.classList.remove('hidden');
    }

    showRaceResults(rankings) {
        const modal = document.getElementById('gameOverModal');
        const message = document.getElementById('winnerMessage');
        
        let resultsHTML = '<h3>🏁 Race Results</h3><div class="race-results">';
        
        rankings.forEach((player, index) => {
            const position = index + 1;
            const medalEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏃‍♂️';
            const isCurrentPlayer = game.room && player.playerId === game.room.sessionId;
            const highlightClass = isCurrentPlayer ? 'current-player' : '';
            const accuracy = player.totalQuestions > 0 ? Math.round((player.correctAnswers / player.totalQuestions) * 100) : 0;
            
            resultsHTML += `
                <div class="result-row ${highlightClass}">
                    <span class="position">${medalEmoji} ${position}</span>
                    <span class="player-info">
                        ${game.getCharacterIcon(player.character)} ${player.playerName}<br>
                        <small>🎯 ${player.correctAnswers}/${player.totalQuestions} (${accuracy}%)</small>
                    </span>
                    <span class="completion-time">
                        ⏰ ${player.completionTime}<br>
                        <small>${player.completionDuration}s</small>
                    </span>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        message.innerHTML = resultsHTML;
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

    // Question methods
    showQuestion(question) {
        const modal = document.getElementById('questionModal');
        const questionText = document.getElementById('questionText');
        const questionChoices = document.getElementById('questionChoices');
        const questionResult = document.getElementById('questionResult');

        // รีเซ็ต modal
        questionResult.classList.add('hidden');
        questionChoices.innerHTML = '';

        // แสดงคำถาม
        questionText.textContent = question.question;

        // สร้างปุ่มตัวเลือก
        Object.entries(question.choice).forEach(([key, value]) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = `${key.toUpperCase()}. ${value}`;
            button.onclick = () => this.selectAnswer(question.id, key, button);
            questionChoices.appendChild(button);
        });

        modal.classList.remove('hidden');
    }

    selectAnswer(questionId, selectedAnswer, buttonElement) {
        // ปิดการใช้งานปุ่มทั้งหมด
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        });

        // เน้นปุ่มที่เลือก
        buttonElement.style.background = '#e3f2fd';
        buttonElement.style.borderColor = '#2196f3';

        // ส่งคำตอบไปยังเกม
        game.answerQuestion(questionId, selectedAnswer);
    }

    showQuestionResult(result) {
        const questionResult = document.getElementById('questionResult');
        const resultText = document.getElementById('resultText');

        const isCorrect = result.isCorrect;
        questionResult.className = `question-result ${isCorrect ? 'correct' : 'incorrect'}`;

        if (isCorrect) {
            resultText.innerHTML = `
                <div>✅ <strong>ถูกต้อง!</strong></div>
                <div>คะแนน: ${result.correctAnswers}/${result.totalQuestions}</div>
            `;
        } else {
            resultText.innerHTML = `
                <div>❌ <strong>ผิด!</strong></div>
                <div>คำตอบที่ถูกต้อง: ${result.correctAnswer.toUpperCase()}</div>
                <div>คะแนน: ${result.correctAnswers}/${result.totalQuestions}</div>
            `;
        }

        questionResult.classList.remove('hidden');
    }

    hideQuestion() {
        document.getElementById('questionModal').classList.add('hidden');
    }
}

// Global UI instance
const UI = new UIManager();
