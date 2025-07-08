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

const games = {}; 

io.on('connection', (socket) => {

  socket.on('create-game', async () => {
    const roomCode = await nanoid(6);
    games[roomCode] = [socket.id];

    games[roomCode].scores = { [socket.id]: 0 };
    games[roomCode].moves = {};
    socket.join(roomCode);
    socket.emit('game-created', roomCode);
  });

  socket.on('join-game', (roomCode) => {
    const room = games[roomCode];

    if (room && room.length === 1) {
      games[roomCode].push(socket.id);
      games[roomCode].scores[socket.id] = 0;
      socket.join(roomCode);

      io.to(roomCode).emit('game-start', { roomCode });
    } else {
      socket.emit('error-message', 'Invalid or full room code');
    }
  });

  socket.on('play', ({ roomCode, move }) => {
    if (!games[roomCode] || !Array.isArray(games[roomCode])) return;
    if (!games[roomCode].moves) games[roomCode].moves = {};
    games[roomCode].moves[socket.id] = move;

    const players = games[roomCode].slice(0, 2);
    if (
      players.length === 2 &&
      games[roomCode].moves[players[0]] &&
      games[roomCode].moves[players[1]]
    ) {
      const move1 = games[roomCode].moves[players[0]];
      const move2 = games[roomCode].moves[players[1]];

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
      
      if (winner) {
        games[roomCode].scores[winner] += 1;
      }

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

      games[roomCode].moves = {};
    }
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
