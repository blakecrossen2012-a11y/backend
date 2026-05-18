const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = 3000;

// Store players
const players = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create player
  players[socket.id] = {
    x: Math.random() * 600,
    y: Math.random() * 400,
    color: randomColor()
  };

  // Send current players to new user
  socket.emit('currentPlayers', players);

  // Tell others about new player
  socket.broadcast.emit('newPlayer', {
    id: socket.id,
    player: players[socket.id]
  });

  // Player movement
  socket.on('move', (data) => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;

    io.emit('playerMoved', {
      id: socket.id,
      player: players[socket.id]
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);

    delete players[socket.id];

    io.emit('playerDisconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function randomColor() {
  const colors = [
    '#ff4d4d',
    '#4dff4d',
    '#4d4dff',
    '#ffff4d',
    '#ff4dff',
    '#4dffff'
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
