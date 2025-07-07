const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable CORS to allow your frontend domain to connect
app.use(cors({
  origin: '*', // Change '*' to your frontend URL in production for security
}));

const io = new Server(server, {
  cors: {
    origin: '*', // Same here: change to your frontend URL in production
    methods: ['GET', 'POST'],
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('play', (move) => {
    console.log(`Player ${socket.id} played: ${move}`);
    // You can add your game logic here or broadcast to others
    socket.broadcast.emit('opponent-played', move);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
