// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎲 Roll and Move Game - Client Loaded');
    
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Set default player name if available
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        document.getElementById('playerName').value = savedName;
        UI.playerName = savedName;
    }
    
    // Set default character selection
    UI.selectCharacter('warrior');
    
    // Save player name when changed
    document.getElementById('playerName').addEventListener('input', function() {
        localStorage.setItem('playerName', this.value);
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Handle window visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle window beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Initialize responsive design
    handleResize();
    window.addEventListener('resize', handleResize);
    
    console.log('✅ Application initialized successfully');
}

function handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in inputs
    if (event.target.tagName === 'INPUT') return;
    
    switch(event.key) {
        case 'Enter':
            // Roll dice if it's the player's turn
            if (UI.currentScreen === 'gameScreen') {
                const rollButton = document.getElementById('rollDiceBtn');
                if (!rollButton.disabled) {
                    event.preventDefault();
                    UI.rollDice();
                }
            }
            break;
            
        case 'Escape':
            // Close modals or go back
            if (!document.getElementById('gameOverModal').classList.contains('hidden')) {
                UI.hideGameOver();
            } else if (UI.currentScreen === 'gameScreen') {
                if (confirm('Are you sure you want to leave the game?')) {
                    UI.showMainMenu();
                }
            }
            break;
            
        case '1':
        case '2':
        case '3':
        case '4':
            // Quick character selection on main menu
            if (UI.currentScreen === 'mainMenu') {
                const characters = ['warrior', 'mage', 'rogue', 'archer'];
                const index = parseInt(event.key) - 1;
                if (characters[index]) {
                    UI.selectCharacter(characters[index]);
                }
            }
            break;
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden - pause any animations or reduce activity
        console.log('🔌 Page hidden - reducing activity');
    } else {
        // Page is visible again - resume normal activity
        console.log('👁️ Page visible - resuming activity');
        
        // Reconnect if disconnected
        if (game.room && !game.isConnected) {
            console.log('🔄 Attempting to reconnect...');
            // The Colyseus client will handle reconnection automatically
        }
    }
}

function handleBeforeUnload(event) {
    // Warn user if they're in an active game
    if (game.room && game.gameState && game.gameState.gameStarted) {
        const message = 'You are currently in a game. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
    }
}

function handleResize() {
    // Adjust UI for different screen sizes
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust game container layout for mobile
    if (width < 1024) {
        document.body.classList.add('mobile-layout');
    } else {
        document.body.classList.remove('mobile-layout');
    }
    
    // Resize board if on game screen
    if (UI.currentScreen === 'gameScreen') {
        setTimeout(() => {
            Board.resizeBoard();
        }, 100);
    }
}

// Utility functions
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('💥 Global error:', event.error);
    
    // Show user-friendly error message
    if (event.error && event.error.message) {
        showNotification('An error occurred: ' + event.error.message, 'error');
    } else {
        showNotification('An unexpected error occurred', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('💥 Unhandled promise rejection:', event.reason);
    
    // Show user-friendly error message
    showNotification('Connection error occurred', 'error');
    
    // Prevent the default browser behavior
    event.preventDefault();
});

// Development helpers (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        max-width: 300px;
        display: none;
    `;
    document.body.appendChild(debugPanel);
    
    // Toggle debug panel with Ctrl+D
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'd') {
            event.preventDefault();
            const panel = document.getElementById('debugPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            
            if (panel.style.display === 'block') {
                updateDebugInfo();
            }
        }
    });
    
    function updateDebugInfo() {
        const panel = document.getElementById('debugPanel');
        if (panel.style.display === 'none') return;
        
        const info = {
            'Screen': UI.currentScreen,
            'Connected': game.isConnected,
            'Room ID': game.room ? game.room.id : 'None',
            'Players': game.gameState ? game.gameState.players.size : 0,
            'Game Started': game.gameState ? game.gameState.gameStarted : false,
            'Current Turn': game.gameState ? game.gameState.currentPlayerIndex : -1
        };
        
        panel.innerHTML = Object.entries(info)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
    }
    
    // Update debug info every second
    setInterval(updateDebugInfo, 1000);
    
    console.log('🔧 Development mode - Press Ctrl+D to toggle debug panel');
}

// Export for global access
window.showNotification = showNotification;
