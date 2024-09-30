import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

dotenv.config();

const app: Express = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: false
  },
  transports: ['polling', 'websocket']
});

app.use(express.json())

const port = process.env.PORT || 3001;

type Player = {
  playerID: string;
  playerName: string;
  longitude: number;
  latitude: number;
  isSeeker: boolean;
};

type Game = {
  gameID: string;
  gameName: string;
  isGamePrivate: boolean;
  password: string;
  gameAdmin: string; // playerID
  centerLongitude: number;
  centerLatitude: number;
  circleRadius: number;
  players: Player[];
  seekers: string[];

  timeUntilStart: number;
  timeUntilEnd: number;
};

const pendingGames: Game[] = [];
const startedGames: Game[] = [];


function hash(s: string): string {
  return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString(16);
}

function joinGame(socket: Socket, gameID: string, playerName: string, longitude: number, latitude: number, password: string) {
  let player = null;
  let joinedGame = null as Game | null;

  let game = pendingGames.find((game) => game.gameID === gameID);
  if (!game) {
    game = startedGames.find((game) => game.gameID === gameID);
  }
  if (!game) {
    socket.emit("joinGameError", { error: "Game not found" });
    return {
      success: false
    };
  }

  if (game.isGamePrivate && game.password !== password) {
    socket.emit("joinGameError", { error: "Incorrect password" });
    return {
      success: false
    };
  }

  const playerID = hash(playerName + gameID);
  player = {
    playerID,
    playerName,
    longitude,
    latitude,
    isSeeker: false
  };

  if (!(game.players.find((p) => p.playerID === playerID))) {
    game.players.push(player);
  }

  if(game.timeUntilStart === 0) {
    socket.emit("joinGameError", { error: "Game has already started" });
    return {
      success: false
    };
  }

  joinedGame = game;
  socket.join(joinedGame.gameID);
  io.to(joinedGame.gameID).emit("playerJoined", { playerName, longitude, latitude });
  socket.emit("gameJoined", { game: joinedGame, player });
  
  return {
    game: joinedGame,
    player,
    success: true
  }
}

io.on("connection", (socket) => {
  const gameID = Array.isArray(socket.handshake.query.gameID) ? socket.handshake.query.gameID[0] : socket.handshake.query.gameID;
  const playerName = Array.isArray(socket.handshake.query.playerName) ? socket.handshake.query.playerName[0] : socket.handshake.query.playerName;
  const longitude = Array.isArray(socket.handshake.query.longitude) ? socket.handshake.query.longitude[0] : socket.handshake.query.longitude;
  const latitude = Array.isArray(socket.handshake.query.latitude) ? socket.handshake.query.latitude[0] : socket.handshake.query.latitude;
  const password = Array.isArray(socket.handshake.query.password) ? socket.handshake.query.password[0] : socket.handshake.query.password || "";

  if (!gameID || !playerName || !longitude || !latitude) {
    socket.emit("joinGameError", { error: "Missing required fields" });
    return;
  }

  const { game : joinedGame, player, success:joinGameSuccess } = joinGame(socket, gameID, playerName, parseFloat(longitude), parseFloat(latitude), password);
  if (!joinGameSuccess || !joinedGame || !player) {
    return;
  }

  console.log(`[server]: Player ${playerName} joined game ${gameID}`);
  

  socket.on("startGame", () => {
    if (joinedGame.gameAdmin !== player.playerID) {
      socket.emit("startGameError", { error: "Only the game admin can start the game" });
      return;
    }

    if (joinedGame) {
      startedGames.push(joinedGame);
      pendingGames.splice(pendingGames.indexOf(joinedGame), 1);
      io.to(joinedGame.gameID).emit("gameStarted");
    }
  });


  socket.on("updateLocation", (data) => {
    if (!player) {
      return;
    }

    player.longitude = data.longitude;
    player.latitude = data.latitude;
    console.log(`[server]: Player ${player.playerName} updated location to ${data.longitude}, ${data.latitude}`);

    io.to(joinedGame.gameID).emit("playerLocationUpdate", { playerID: player.playerID, longitude: player.longitude, latitude: player.latitude });
  } );

  socket.on("disconnect", () => {
    if (player?.playerID && joinedGame.gameID) {
      let game = pendingGames.find((game) => game.gameID === joinedGame.gameID);
      if (game) {
        game.players = game.players.filter((gamePlayer) => gamePlayer.playerID !== player?.playerID);
        io.to(joinedGame.gameID).emit("playerLeft", { playerName: player.playerName });
      }

      console.log(`[server]: Player ${player.playerName} left game ${joinedGame.gameID}`);

      game = startedGames.find((game) => game.gameID === joinedGame.gameID);
      if (game) {
        game.players = game.players.filter((gamePlayer) => gamePlayer.playerID !== player?.playerID);
        io.to(joinedGame.gameID).emit("playerLeft", { playerName: player.playerName });
      }
    }
  });
});

app.post("/createGame", (req: Request, res: Response) => {
  console.log("[server]: Create Game");
  const {
    gameName,
    isGamePrivate,
    password,
    playerName,
    longitude: longitudeRaw,
    latitude: latitudeRaw,
    circleRadius: circleRadiusRaw,
    gameLength,
    timeUntilStart
  } = req.body;

  if (!gameName || !playerName || !longitudeRaw || !latitudeRaw || !circleRadiusRaw) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (isGamePrivate && !password) {
    res.status(400).json({ error: "Missing password" });
    return;
  }

  if (!gameLength) {
    res.status(400).json({ error: "Missing game time" });
    return;
  }

  const longitude = parseFloat(longitudeRaw);
  const latitude = parseFloat(latitudeRaw);
  const circleRadius = parseFloat(circleRadiusRaw);
  const gameID = hash(gameName + longitude + latitude + circleRadius);


  for (const game of pendingGames) {
    if (game.gameID === gameID) {
      res.status(400).json({ error: "Game already exists" });
      return;
    }
  }

  for (const game of startedGames) {
    if (game.gameID === gameID) {
      res.status(400).json({ error: "Game already exists" });
      return;
    }
  }

  const playerId = hash(playerName + gameID);

  const game: Game = {
    gameID,
    gameName,
    isGamePrivate,
    password,
    gameAdmin: playerId,
    centerLongitude:longitude,
    centerLatitude:latitude,
    circleRadius,
    seekers: [],
    players: [
      {
        playerID: playerId,
        playerName,
        longitude: longitudeRaw,
        latitude: latitudeRaw,
        isSeeker: false
      }
    ],
    timeUntilStart,
    timeUntilEnd: timeUntilStart + gameLength
  };

  pendingGames.push(game);

  res.json({ gameID });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

const gameLoop = setInterval(() => {
  for (const game of pendingGames) {
    game.timeUntilStart -= 1;
    console.log(`[server]: Game ${game.gameID} starts in ${game.timeUntilStart} seconds`);
    io.to(game.gameID).emit("timeUpdate", {game: game});
  }
}, 1000);