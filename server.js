const express = require("express");
      socket.emit("roomFull");
      return;
    }

    socket.join(room);

    socket.room = room;

    rooms[room].players[socket.id] = {
      x: 700,
      y: 400,
      hp: 100,
      color: "orange"
    };

    io.to(room).emit("gameState", rooms[room]);
  });

  socket.on("move", data => {

    const room = socket.room;

    if (!room || !rooms[room]) return;

    const player = rooms[room].players[socket.id];

    if (!player) return;

    player.x = data.x;
    player.y = data.y;

    io.to(room).emit("gameState", rooms[room]);
  });

  socket.on("shoot", bullet => {

    const room = socket.room;

    if (!room) return;

    io.to(room).emit("bullet", bullet);
  });

  socket.on("disconnect", () => {

    const room = socket.room;

    if (room && rooms[room]) {

      delete rooms[room].players[socket.id];

      io.to(room).emit("gameState", rooms[room]);

      if (Object.keys(rooms[room].players).length === 0) {
        delete rooms[room];
      }
    }

    console.log("Player disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Multiplayer server running");
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});