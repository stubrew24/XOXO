const socket = io();

// page elements
const gameBoard = document.getElementById("board");
const newGameForm = document.getElementById("newGameForm");
const joinGameForm = document.getElementById("joinGameForm");
const resetBtn = document.getElementById("resetBtn");
const infoBox = document.getElementById("info");
const opponentInfo = document.getElementById("opponentInfo");
const errorsBox = document.getElementById("errors");
const gameplayDisplayBox = document.getElementById("gameplayDisplay");

const emptyBoard = [null, null, null, null, null, null, null, null, null];

const state = {
  board: [...emptyBoard],
  player: null,
  turn: "X",
  room: null,
  gameOver: false,
  winner: null,
  opponent: false,
  moves: 0
};

const checkWinner = board => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  let winner = null;

  lines.forEach(line => {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      winner = board[a];
    }
  });

  return winner;
};

const renderBoard = board => {
  displayErrors([]);
  state.opponent
    ? gameplayDisplay(`Player ${state.turn}'s turn.`)
    : gameplayDisplay(`Waiting for opponent...`);
  gameBoard.innerText = "";
  board.map((square, index) => {
    gameBoard.appendChild(renderSquare(square, index));
  });
};

const renderSquare = (square, index) => {
  const squareEl = document.createElement("div");
  squareEl.className = "square";
  squareEl.innerText = square;
  squareEl.addEventListener("click", () => clickSquare(squareEl, index));
  return squareEl;
};

const displayErrors = errors => {
  errorsBox.innerText = "";
  errors.map(err => (errorsBox.innerHTML += `<p>${err}</p>`));
};

const gameplayDisplay = message => {
  gameplayDisplayBox.innerHTML = `<h2>${message}</h2>`;
};

// Event Listners

newGameForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.name.value) return displayErrors(["Name is required."]);
  const name = e.target.name.value;
  socket.emit("createGame", { name });
});

joinGameForm.addEventListener("submit", e => {
  e.preventDefault();
  const errs = [];
  if (!e.target.name.value) errs.push("Name is required.");
  if (!e.target.game.value) errs.push("Game ID is required.");
  if (errs.length) return displayErrors(errs);
  const name = e.target.name.value;
  const room = `room-${e.target.game.value}`;
  socket.emit("joinGame", { name, room });
});

const clickSquare = (square, index) => {
  if (square.innerText) return;
  if (state.gameOver) return;
  if (state.player !== state.turn) return;
  if (!state.opponent) return;

  state.moves++;

  state.board[index] = state.player;
  state.turn = state.turn === "X" ? "O" : "X";
  renderBoard(state.board);

  if (checkWinner(state.board))
    return socket.emit("gameEnded", {
      position: index,
      player: state.player,
      room: state.room
    });

  if (state.moves === 9) return socket.emit("draw", { room: state.room });

  return socket.emit("playTurn", {
    position: index,
    room: state.room,
    player: state.player
  });
};

resetBtn.addEventListener("click", e => {
  socket.emit("resetGame", { room: state.room });
});

// Game Actions

const startGame = () => {
  newGameForm.style.display = "none";
  joinGameForm.style.display = "none";
  gameBoard.style.display = "block";
  infoBox.innerHTML = `
    Welcome ${state.name}. 
    You are playing as ${state.player} <br /> 
    You are hosting game: ${state.room.split("-")[1]}`;
  renderBoard(state.board);
};

const joinGame = () => {
  newGameForm.style.display = "none";
  joinGameForm.style.display = "none";
  gameBoard.style.display = "block";
  infoBox.innerHTML = `
    Welcome ${state.name}. 
    You are playing as ${state.player} <br /> 
    You have joined game: ${state.room.split("-")[1]}`;
  renderBoard(state.board);
};

const gameOver = () => {
  renderBoard(state.board);
  gameplayDisplay(`Game over: ${state.winner} wins!`);
  resetBtn.style.display = "block";
};

// Socket Events

socket.on("newGame", data => {
  state.name = data.name;
  state.room = data.room;
  state.player = "X";
  startGame();
});

socket.on("gameEnd", data => {
  state.winner = data.player;
  state.gameOver = true;
  state.board[data.position] = data.player;
  gameOver();
});

socket.on("newGameStarted", data => {
  state.moves = 0;
  state.turn = state.winner || "X";
  state.board = [...emptyBoard];
  state.gameOver = false;
  state.winner = null;
  renderBoard(state.board);
  resetBtn.style.display = "none";
});

socket.on("player1", data => {
  state.opponent = true;
  renderBoard(state.board);
  opponentInfo.innerText = `${data.name} has joined the game.`;
});

socket.on("player2", data => {
  state.opponent = true;
  state.name = data.name;
  state.room = data.room;
  state.player = "O";
  joinGame();
});

socket.on("turnPlayed", data => {
  state.moves++;
  state.board[data.position] = data.player;
  state.turn = data.player === "X" ? "O" : "X";
  renderBoard(state.board);
});

socket.on("err", data => {
  displayErrors([data.message]);
});

socket.on("itsaDraw", data => {
  gameplayDisplay("Draw! Everyone's a loser!");
  resetBtn.style.display = "block";
});
