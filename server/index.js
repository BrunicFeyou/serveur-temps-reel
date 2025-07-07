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
    socket.join(roomCode);
    socket.emit('game-created', roomCode);
    console.log(`Game created with code: ${roomCode}`);
  });

  // Player 2 joins a game by code
  socket.on('join-game', (roomCode) => {
    const room = games[roomCode];

    if (room && room.length === 1) {
      games[roomCode].push(socket.id);
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
    socket.to(roomCode).emit('opponent-played', move);
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
