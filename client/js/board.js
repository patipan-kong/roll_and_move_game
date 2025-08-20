// Board Management
class BoardManager {
    constructor() {
        this.boardSize = 8; // 8x8 grid for 64 squares
        this.squareSize = 50; // Size of each square in pixels
        this.playerTokens = new Map(); // Store player token elements
        
        this.spiralPath = this.generateSpiralPath();
    }

    // Generate the spiral path coordinates for 64 squares
    generateSpiralPath() {
        const path = [];
        const size = this.boardSize;
        
        // Start from bottom-left corner (0, 7)
        let x = 0, y = size - 1;
        let dx = 1, dy = 0; // Start moving right
        
        for (let i = 0; i < 64; i++) {
            path.push({ x, y, position: i });
            
            // Calculate next position
            let nextX = x + dx;
            let nextY = y + dy;
            
            // Check if we need to turn
            let shouldTurn = false;
            
            if (dx === 1) { // Moving right
                if (nextX >= size || path.some(p => p.x === nextX && p.y === nextY)) {
                    shouldTurn = true;
                }
            } else if (dx === -1) { // Moving left
                if (nextX < 0 || path.some(p => p.x === nextX && p.y === nextY)) {
                    shouldTurn = true;
                }
            } else if (dy === -1) { // Moving up
                if (nextY < 0 || path.some(p => p.x === nextX && p.y === nextY)) {
                    shouldTurn = true;
                }
            } else if (dy === 1) { // Moving down
                if (nextY >= size || path.some(p => p.x === nextX && p.y === nextY)) {
                    shouldTurn = true;
                }
            }
            
            if (shouldTurn) {
                // Turn clockwise
                if (dx === 1 && dy === 0) { // Right -> Up
                    dx = 0; dy = -1;
                } else if (dx === 0 && dy === -1) { // Up -> Left
                    dx = -1; dy = 0;
                } else if (dx === -1 && dy === 0) { // Left -> Down
                    dx = 0; dy = 1;
                } else if (dx === 0 && dy === 1) { // Down -> Right
                    dx = 1; dy = 0;
                }
            }
            
            // Move to next position
            x += dx;
            y += dy;
        }
        
        return path;
    }

    createBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
        
        // Set board dimensions
        const boardWidth = this.boardSize * this.squareSize;
        const boardHeight = this.boardSize * this.squareSize;
        boardElement.style.width = boardWidth + 'px';
        boardElement.style.height = boardHeight + 'px';
        
        // Create squares according to spiral path
        this.spiralPath.forEach((pathSquare, index) => {
            const square = document.createElement('div');
            square.className = 'board-square';
            square.dataset.position = index;
            
            // Position the square
            square.style.left = (pathSquare.x * this.squareSize) + 'px';
            square.style.top = (pathSquare.y * this.squareSize) + 'px';
            square.style.width = this.squareSize + 'px';
            square.style.height = this.squareSize + 'px';
            
            // Add square number
            square.textContent = index + 1;
            
            // Special styling for start and finish
            if (index === 0) {
                square.classList.add('start');
                square.title = 'Start';
            } else if (index === 63) {
                square.classList.add('finish');
                square.title = 'Finish';
            }
            
            boardElement.appendChild(square);
        });
    }

    updateBoard(gameState) {
        if (!gameState || !gameState.players) return;
        
        // Clear existing player tokens
        this.clearPlayerTokens();
        
        // Add player tokens for each player
        gameState.players.forEach((player, playerId) => {
            this.addPlayerToken(playerId, player);
        });
    }

    clearPlayerTokens() {
        // Remove all existing player tokens
        document.querySelectorAll('.player-token').forEach(token => {
            token.remove();
        });
        this.playerTokens.clear();
    }

    addPlayerToken(playerId, player) {
        const position = Math.min(player.position, 63); // Ensure position doesn't exceed 63
        const square = document.querySelector(`[data-position="${position}"]`);
        
        if (!square) return;
        
        // Create player token
        const token = document.createElement('div');
        token.className = `player-token ${player.character}`;
        token.dataset.playerId = playerId;
        token.textContent = game.getCharacterIcon(player.character);
        token.title = `${player.name} (${game.getCharacterName(player.character)})`;
        
        // Check if it's current player's turn
        if (game.gameState) {
            const playerIds = Array.from(game.gameState.players.keys());
            const currentPlayerId = playerIds[game.gameState.currentPlayerIndex];
            if (playerId === currentPlayerId) {
                token.classList.add('current-turn');
            }
        }
        
        // Position token within the square
        this.positionTokenInSquare(token, square, position);
        
        // Add to board
        document.getElementById('gameBoard').appendChild(token);
        this.playerTokens.set(playerId, token);
    }

    positionTokenInSquare(token, square, position) {
        // Get all existing tokens in this square
        const existingTokens = Array.from(document.querySelectorAll('.player-token'))
            .filter(t => {
                const player = game.gameState.players.get(t.dataset.playerId);
                return player && Math.min(player.position, 63) === position;
            });
        
        const tokenIndex = existingTokens.length;
        
        // Position token relative to square
        const squareRect = square.getBoundingClientRect();
        const boardRect = document.getElementById('gameBoard').getBoundingClientRect();
        
        let offsetX = 0;
        let offsetY = 0;
        
        // Arrange multiple tokens in a square
        switch (tokenIndex) {
            case 0:
                offsetX = this.squareSize / 2 - 10; // Center
                offsetY = this.squareSize / 2 - 10;
                break;
            case 1:
                offsetX = 5; // Top-left
                offsetY = 5;
                token.classList.add('offset-1');
                break;
            case 2:
                offsetX = this.squareSize - 25; // Top-right
                offsetY = 5;
                token.classList.add('offset-2');
                break;
            case 3:
                offsetX = 5; // Bottom-left
                offsetY = this.squareSize - 25;
                token.classList.add('offset-3');
                break;
            default:
                offsetX = this.squareSize - 25; // Bottom-right
                offsetY = this.squareSize - 25;
                token.classList.add('offset-4');
                break;
        }
        
        // Set position
        const pathSquare = this.spiralPath[position];
        token.style.left = (pathSquare.x * this.squareSize + offsetX) + 'px';
        token.style.top = (pathSquare.y * this.squareSize + offsetY) + 'px';
    }

    animatePlayerMovement(playerId, fromPosition, toPosition) {
        const token = this.playerTokens.get(playerId);
        if (!token) return;
        
        // Add movement animation class
        token.style.transition = 'all 0.5s ease-in-out';
        
        // Move through each position for smooth animation
        let currentPos = fromPosition;
        const moveStep = () => {
            if (currentPos < toPosition) {
                currentPos++;
                const pathSquare = this.spiralPath[Math.min(currentPos, 63)];
                token.style.left = (pathSquare.x * this.squareSize + this.squareSize / 2 - 10) + 'px';
                token.style.top = (pathSquare.y * this.squareSize + this.squareSize / 2 - 10) + 'px';
                
                setTimeout(moveStep, 100);
            } else {
                // Final positioning with other players consideration
                const finalSquare = document.querySelector(`[data-position="${Math.min(toPosition, 63)}"]`);
                if (finalSquare) {
                    this.positionTokenInSquare(token, finalSquare, Math.min(toPosition, 63));
                }
                
                // Remove transition after animation
                setTimeout(() => {
                    token.style.transition = '';
                }, 100);
            }
        };
        
        moveStep();
    }

    highlightSquare(position) {
        // Remove existing highlights
        document.querySelectorAll('.board-square.highlighted').forEach(square => {
            square.classList.remove('highlighted');
        });
        
        // Add highlight to target square
        const square = document.querySelector(`[data-position="${position}"]`);
        if (square) {
            square.classList.add('highlighted');
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
                square.classList.remove('highlighted');
            }, 2000);
        }
    }

    getSquarePosition(position) {
        const pathSquare = this.spiralPath[Math.min(position, 63)];
        return {
            x: pathSquare.x * this.squareSize,
            y: pathSquare.y * this.squareSize
        };
    }

    // Responsive board sizing
    resizeBoard() {
        const boardContainer = document.querySelector('.board-container');
        const containerWidth = boardContainer.clientWidth;
        const containerHeight = boardContainer.clientHeight;
        
        // Calculate appropriate size
        const maxSize = Math.min(containerWidth - 40, containerHeight - 40);
        const newSquareSize = Math.floor(maxSize / this.boardSize);
        
        if (newSquareSize !== this.squareSize) {
            this.squareSize = newSquareSize;
            this.createBoard();
            
            // Update existing tokens
            if (game.gameState) {
                this.updateBoard(game.gameState);
            }
        }
    }
}

// Global board instance
const Board = new BoardManager();

// Resize board on window resize
window.addEventListener('resize', () => {
    Board.resizeBoard();
});
