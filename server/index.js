// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('👤 Player connected:', socket.id);

  if (waitingPlayer) {
    const room = `room-${socket.id}-${waitingPlayer.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    io.to(room).emit('start-game', { room });
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting');
  }

  socket.on('play', ({ move, room }) => {
    socket.to(room).emit('opponent-played', move);
    socket.move = move;

    const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
    if (clients.length === 2) {
      const [p1, p2] = clients.map(id => io.sockets.sockets.get(id));
      if (p1.move && p2.move) {
        const result = determineWinner(p1.move, p2.move);
        io.to(room).emit('result', {
          p1Move: p1.move,
          p2Move: p2.move,
          winner: result
        });
        p1.move = null;
        p2.move = null;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

function determineWinner(move1, move2) {
  if (move1 === move2) return 'draw';
  if (
    (move1 === 'rock' && move2 === 'scissors') ||
    (move1 === 'scissors' && move2 === 'paper') ||
    (move1 === 'paper' && move2 === 'rock')
  ) return 'player1';
  return 'player2';
}

server.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));