import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as socketio from "socket.io";
import { join } from "path";
dotenv.config();

const app: Express = express();
app.use(express.json())

const io = new socketio.Server();

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
  gameAdmin: string;
  longitude: number;
  latitude: number;
  circleRadius: number;
  gameTime: number;
  players: Player[];
  numberOfPlayers: number;
  numberOfSeekers: number;
  seekers: string[];
  
  gameStarted?: boolean;
};

const activeGames: Game[] = [];


function hash(s: string): string {
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString(16);
}


io.on("connection", (socket) => {
  let player: Player | null = null;
  let joinedGameID: string | null = null;

  socket.on("joinGame", (data) => {
    const { gameID, playerName, longitude, latitude, password } : {
      gameID:string,
      playerName:string,
      longitude:string,
      latitude:string,
      password:string
    } = data;

    const game = activeGames.find((game) => game.gameID === gameID);
    if (!game) {
      socket.emit("joinGameError", { error: "Game not found" });
      return;
    }

    if (game.gameStarted) {
      socket.emit("joinGameError", { error: "Game already started" });
      return;
    }

    if (game.isGamePrivate) {
      if (game.password !== password) {
        socket.emit("joinGameError", { error: "Incorrect password" });
        return;
      }
    }

    const playerID = hash(playerName + gameID);
    player = {
      playerID,
      playerName,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      isSeeker: false
    };

    if (!(game.players.find((p) => p.playerID === playerID))) {
      game.players.push(player);
      game.numberOfPlayers++;
    }

    joinedGameID = gameID;

    socket.join(joinedGameID);
    io.to(joinedGameID).emit("playerJoined", { playerName, longitude, latitude });  
  });

  socket.on("disconnect", () => {
    if (player?.playerID && joinedGameID) {
      const game = activeGames.find((game) => game.gameID === joinedGameID);
      if (game) {
        game.players = game.players.filter((gamePlayer) => gamePlayer.playerID !== player?.playerID);
        game.numberOfPlayers--;
        io.to(joinedGameID).emit("playerLeft", { playerName: player.playerName });
      }
    }
  });
});

app.post("/createGame", (req: Request, res: Response) => {
  console.log("[server]: Create Game");
  const { 
    gameName, 
    isGamePrivate:isGamePrivateRaw, 
    isGamePrivate:passwordRaw, 
    playerName, 
    longitude:longitudeRaw, 
    latitude:latitudeRaw, 
    circleRadius:circleRadiusRaw 
  } = req.body;

  const isGamePrivate = isGamePrivateRaw as boolean;
  const password = passwordRaw ? passwordRaw : "";
  const longitude = parseFloat(longitudeRaw);
  const latitude = parseFloat(latitudeRaw);
  const circleRadius = parseFloat(circleRadiusRaw);
  const gameTime = 0;
  const gameID = hash(gameName + longitude + latitude + circleRadius);
  
  for (const game of activeGames) {
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
    longitude,
    latitude,
    circleRadius,
    gameTime,
    numberOfPlayers: 1,
    numberOfSeekers: 0,
    seekers: [],
    players: [
      {
        playerID: playerId,
        playerName,
        longitude: longitudeRaw,
        latitude: latitudeRaw,
        isSeeker: false
      }
    ]
  };

  activeGames.push(game);

  res.json({ gameID });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});