const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const nanoid = (...args) => import('nanoid').then(mod => mod.nanoid(...args));

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({ origin: FRONTEND_URL }));

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

const games = {}; // Store active game rooms and players

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Log all events received from this socket
  socket.onAny((event, ...args) => {
    console.log(`[${socket.id}] Event received:`, event, args);
  });

  // Player 1 creates a game
  socket.on('create-game', async () => {
    const roomCode = await nanoid(6); // Generates a short unique code like "k3l9Xz"
    games[roomCode] = [socket.id]; // Add creator to room
    // Initialize scores and moves
    games[roomCode].scores = { [socket.id]: 0 };
    games[roomCode].moves = {};
    socket.join(roomCode);
    socket.emit('game-created', roomCode);
    console.log(`Game created with code: ${roomCode}`);
  });

  // Player 2 joins a game by code
  socket.on('join-game', (roomCode) => {
    const room = games[roomCode];

    if (room && room.length === 1) {
      games[roomCode].push(socket.id);
      // Initialize score for second player
      games[roomCode].scores[socket.id] = 0;
      socket.join(roomCode);

      // Notify both players
      io.to(roomCode).emit('game-start', { roomCode });
      console.log(`Player ${socket.id} joined room: ${roomCode}`);
    } else {
      socket.emit('error-message', 'Invalid or full room code');
    }
  });

  // Player sends a move
  socket.on('play', ({ roomCode, move }) => {
    if (!games[roomCode] || !Array.isArray(games[roomCode])) return;
    // Attach moves to the game object
    if (!games[roomCode].moves) games[roomCode].moves = {};
    games[roomCode].moves[socket.id] = move;

    // If both players have played
    const players = games[roomCode].slice(0, 2); // Only first two are players
    if (
      players.length === 2 &&
      games[roomCode].moves[players[0]] &&
      games[roomCode].moves[players[1]]
    ) {
      const move1 = games[roomCode].moves[players[0]];
      const move2 = games[roomCode].moves[players[1]];
      // Determine winner
      let winner = null;
      if (move1 !== move2) {
        if (
          (move1 === 'rock' && move2 === 'scissors') ||
          (move1 === 'scissors' && move2 === 'paper') ||
          (move1 === 'paper' && move2 === 'rock')
        ) {
          winner = players[0];
        } else {
          winner = players[1];
        }
      }
      // Update scores
      if (winner) {
        games[roomCode].scores[winner] += 1;
      }
      // Send each player the opponent's move and scores
      players.forEach((playerId, idx) => {
        const opponentId = players[1 - idx];
        io.to(playerId).emit('opponent-played', {
          move: games[roomCode].moves[opponentId],
          scores: {
            you: games[roomCode].scores[playerId],
            opponent: games[roomCode].scores[opponentId]
          },
          winner: winner === null ? 'draw' : (winner === playerId ? 'you' : 'opponent')
        });
      });
      // Reset moves for next round
      games[roomCode].moves = {};
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Optional: clean up game state if you want
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
