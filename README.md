# 🎲 Roll and Move Game
A multiplayer board game built with Colyseus and HTML5

## Play Demo 
- https://roll-and-move-game.onrender.com

## 🌟 Features
- **Character Selection**: Choose from 4 unique characters (Warrior ⚔️, Mage 🧙‍♂️, Rogue 🗡️, Archer 🏹)
- **Multiple Game Modes**: 
  - Single Player mode for practice
  - Multiplayer mode for up to 4 players
  - Host or Join existing games
- **Interactive Tutorial**: Built-in "How to Play" guide
- **Real-time Gameplay**: 
  - Real time dice rolling with two dice
  - 64-square spiral board layout
  - Race to the center to win!
- **Responsive Design**: Works on desktop and mobile devices

## 🌟 Technology Stack

### Frontend
- **Colyseus.js**: Real-time multiplayer client for seamless networking
- **HTML5/CSS3**: Responsive design with modern UI/UX
- **JavaScript (ES6+)**: Modern vanilla JavaScript with async/await

### Backend  
- **Colyseus**: Authoritative multiplayer game server
- **Node.js**: Server runtime environment
- **Express**: Web server framework
- **@colyseus/schema**: State synchronization

### Data Management
- **JSON Configuration**: Character data and game settings
- **Real-time State**: Synchronized game state across all clients

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn

### Installation

1. **Clone or download the repository**
2. **Run the installation script:**
   ```bash
   # On Windows
   install.bat
   
   # On Mac/Linux
   chmod +x install.sh && ./install.sh
   ```

### Running the Game

1. **Start the server:**
   ```bash
   # On Windows
   start-server.bat
   
   # On Mac/Linux  
   cd server && npm start
   ```

2. **Start the client (in a new terminal):**
   ```bash
   # On Windows
   start-client.bat
   
   # On Mac/Linux
   cd client && npm start
   ```

3. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```
4. **Change server url, If want to use your own server**
   ```
   from
   // const currentHostname = location.hostname;
   // const url = `ws://${currentHostname}:2567`;        
   const url = `https://roll-and-move-game-serv.onrender.com`;
   to
   const currentHostname = location.hostname;
   const url = `ws://${currentHostname}:2567`;        
   // const url = `https://roll-and-move-game-serv.onrender.com`;
   ```
## 🎮 How to Play

### Game Setup
1. Choose your character from 4 available options
2. Enter your player name
3. Select Single Player or Multiplayer mode
4. For multiplayer: Host a game or join with a Room ID

### Gameplay
- Players take turns rolling two dice
- Move your character forward by the total number rolled
- Navigate through the 64-square spiral board
- First player to reach the center (square 64) wins!

### Multiplayer Features
- Up to 4 players can play together
- Host creates a room and shares the Room ID
- Other players join using the Room ID
- Real-time synchronization of all game actions

## 🎯 Game Rules

1. **Objective**: Be the first to reach square 64 (center of the board)
2. **Movement**: Roll two dice, move forward by the total
3. **Turn Order**: Players alternate turns automatically  
4. **Winning**: First player to reach or exceed square 64 wins
5. **Board Layout**: 64 squares arranged in a clockwise spiral

## 📝 License

MIT License - Feel free to modify and distribute!
