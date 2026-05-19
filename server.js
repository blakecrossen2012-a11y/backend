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

app.use(express.static("public"));

let players = {};

let rooms = {};

function createRoom(name, maxPlayers = 12) {

    const roomId =
        "room_" + Math.random().toString(36).substr(2, 9);

    rooms[roomId] = {
        id: roomId,
        name,
        maxPlayers,
        players: [],
        bullets: []
    };

    return roomId;
}

createRoom("FFA Arena 1", 16);
createRoom("FFA Arena 2", 20);
createRoom("FFA Chaos", 32);

function sendLobbyList() {

    const roomList = Object.values(rooms).map(room => ({
        id: room.id,
        name: room.name,
        players: room.players.length,
        maxPlayers: room.maxPlayers
    }));

    io.emit("lobbyList", roomList);
}

io.on("connection", socket => {

    console.log("Connected:", socket.id);

    players[socket.id] = {
        x: 300,
        y: 300,
        angle: 0,
        hp: 100,
        room: null,
        kills: 0,
        deaths: 0
    };

    sendLobbyList();

});
