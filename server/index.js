const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

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

const waitingPlayers = [];

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  // Add new player to waiting queue
  waitingPlayers.push(socket);

  // If there are at least 2 players waiting, pair them
  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.shift();
    const player2 = waitingPlayers.shift();

    // Create a unique room for the pair
    const room = `room-${player1.id}-${player2.id}`;

    // Join both players to the room
    player1.join(room);
    player2.join(room);

    // Notify players the game can start
    io.to(room).emit('game-start', { room });

    // Setup listeners for moves within that room
    player1.on('play', (move) => {
      socket.to(room).emit('opponent-played', move);
    });
    player2.on('play', (move) => {
      socket.to(room).emit('opponent-played', move);
    });
  }

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    // Remove disconnected player from waiting queue if still there
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) waitingPlayers.splice(index, 1);
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
