import express from 'express';
import { createServer } from 'http';
import socketIo from 'socket.io';

const app = express();
const server = createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('message', (message) => {
    console.log('Message received:', message);
    io.emit('message', message); // Broadcast the message to all clients
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
}); 

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});