const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3003;

app.use(express.static("src"));

app.get("*", (req, res, next) => {
  if (req.headers["x-forwarded-proto"] != "https")
    res.redirect("https://stubrew24-xoxo.herokuapp.com/" + req.url);
  next();
});

// app.use((req, res, next) => {
//   var schema = req.headers["x-forwarded-proto"];

//   if (schema === "https") {
//     req.connection.encrypted = true;
//   } else {
//     res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

var rooms = 0;

io.on("connection", socket => {
  socket.on("createGame", data => {
    socket.join(`room-${++rooms}`);
    socket.emit("newGame", { name: data.name, room: `room-${rooms}` });
  });

  socket.on("joinGame", data => {
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
    io.in(data.room).emit("gameEnd", data);
  });

  socket.on("resetGame", data => {
    io.in(data.room).emit("newGameStarted", {});
  });

  socket.on("draw", data => {
    io.in(data.room).emit("itsaDraw", {});
  });
});

http.listen(port, console.log("Listening on port " + port));
