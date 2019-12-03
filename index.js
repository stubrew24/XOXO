const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("src"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

var rooms = 0;

io.on("connection", socket => {
  socket.on("createGame", data => {
    console.log("createGame");
    socket.join(`room-${++rooms}`);
    socket.emit("newGame", { name: data.name, room: `room-${rooms}` });
  });

  socket.on("joinGame", data => {
    console.log("joinGame");
    const room = io.nsps["/"].adapter.rooms[`${data.room}`];

    if (room && room.length === 1) {
      socket.join(data.room);
      socket.broadcast.to(data.room).emit("player1", { name: data.name });
      socket.emit("player2", { name: data.name, room: data.room });
    } else {
      socket.emit("err", { message: "Sorry, game is full." });
    }
  });

  socket.on("playTurn", data => {
    socket.broadcast.to(data.room).emit("turnPlayed", {
      position: data.position,
      room: data.room,
      player: data.player
    });
  });

  socket.on("gameEnded", data => {
    console.log("gameEnded");
    // socket.emit("gameEnd", data);
    io.in(data.room).emit("gameEnd", data);
  });

  socket.on("resetGame", data => {
    // socket.emit("newGameStarted", {});
    io.in(data.room).emit("newGameStarted", {});
  });
});

http.listen(3001, console.log("listening on 3001"));
