const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

let queue = [];

let rooms = {};

let players = {};

function createRoom(player1, player2) {

    const roomId =
        "room_" + Math.random().toString(36).substr(2, 9);

    rooms[roomId] = {
        players: [player1, player2],
        bullets: []
    };

    players[player1].room = roomId;
    players[player2].room = roomId;

    io.to(player1).emit("matchFound", roomId);
    io.to(player2).emit("matchFound", roomId);

    io.sockets.sockets.get(player1).join(roomId);
    io.sockets.sockets.get(player2).join(roomId);

    startGameLoop(roomId);
}

function startGameLoop(roomId) {

    setInterval(() => {

        const room = rooms[roomId];

        if (!room) return;

        room.bullets.forEach((bullet, index) => {

            bullet.x += Math.cos(bullet.angle) * 10;
            bullet.y += Math.sin(bullet.angle) * 10;

            room.players.forEach(id => {

                const p = players[id];

                if (!p) return;

                const dx = bullet.x - p.x;
                const dy = bullet.y - p.y;

                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 20 && bullet.owner !== id) {

                    p.hp -= 20;

                    if (p.hp <= 0) {

                        p.hp = 0;

                        io.to(roomId).emit("death", id);

                        setTimeout(() => {

                            p.hp = 100;
                            p.x = 100 + Math.random()*400;
                            p.y = 100 + Math.random()*400;

                            io.to(roomId).emit("respawn", {
                                id,
                                player: p
                            });

                        }, 3000);
                    }

                    room.bullets.splice(index, 1);
                }
            });
        });

        io.to(roomId).emit("state", {
            players,
            bullets: room.bullets
        });

    }, 1000 / 60);
}

io.on("connection", (socket) => {

    players[socket.id] = {
        x: 200,
        y: 200,
        angle: 0,
        hp: 100,
        room: null
    };

    socket.on("findMatch", () => {

        queue.push(socket.id);

        if (queue.length >= 2) {

            const p1 = queue.shift();
            const p2 = queue.shift();

            createRoom(p1, p2);
        }
    });

    socket.on("move", data => {

        const p = players[socket.id];

        if (!p) return;

        p.x = data.x;
        p.y = data.y;
        p.angle = data.angle;
    });

    socket.on("shoot", data => {

        const p = players[socket.id];

        if (!p || !p.room) return;

        rooms[p.room].bullets.push({
            x: p.x,
            y: p.y,
            angle: data.angle,
            owner: socket.id
        });
    });

    socket.on("disconnect", () => {

        delete players[socket.id];
    });
});

server.listen(process.env.PORT || 3000);
