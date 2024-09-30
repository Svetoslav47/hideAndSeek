"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        credentials: false
    },
    transports: ['polling', 'websocket']
});
app.use(express_1.default.json());
const port = process.env.PORT || 3001;
const pendingGames = [];
const startedGames = [];
function hash(s) {
    return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0).toString(16);
}
function joinGame(socket, gameID, playerName, longitude, latitude, password) {
    let player = null;
    let joinedGame = null;
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
    if (game.hasGameStarted) {
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
    };
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
    const { game: joinedGame, player, success: joinGameSuccess } = joinGame(socket, gameID, playerName, parseFloat(longitude), parseFloat(latitude), password);
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
    });
    socket.on("disconnect", () => {
        if ((player === null || player === void 0 ? void 0 : player.playerID) && joinedGame.gameID) {
            let game = pendingGames.find((game) => game.gameID === joinedGame.gameID);
            if (game) {
                game.players = game.players.filter((gamePlayer) => gamePlayer.playerID !== (player === null || player === void 0 ? void 0 : player.playerID));
                io.to(joinedGame.gameID).emit("playerLeft", { playerName: player.playerName });
            }
            console.log(`[server]: Player ${player.playerName} left game ${joinedGame.gameID}`);
            game = startedGames.find((game) => game.gameID === joinedGame.gameID);
            if (game) {
                game.players = game.players.filter((gamePlayer) => gamePlayer.playerID !== (player === null || player === void 0 ? void 0 : player.playerID));
                io.to(joinedGame.gameID).emit("playerLeft", { playerName: player.playerName });
            }
        }
    });
});
app.post("/createGame", (req, res) => {
    console.log("[server]: Create Game");
    const { gameName, isGamePrivate, password, playerName, longitude: longitudeRaw, latitude: latitudeRaw, circleRadius: circleRadiusRaw, gameTime, } = req.body;
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
    const game = {
        gameID,
        gameName,
        isGamePrivate,
        password,
        gameAdmin: playerId,
        centerLongitude: longitude,
        centerLatitude: latitude,
        circleRadius,
        initialTime: gameTime,
        timePassed: 0,
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
        hasGameStarted: false
    };
    pendingGames.push(game);
    res.json({ gameID });
});
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
const gameLoop = setInterval(() => {
    for (const game of startedGames) {
        game.timePassed += 1;
        io.to(game.gameID).emit("timeUpdate", { time: game.initialTime - game.timePassed });
        console.log(game.gameID, game.timePassed);
    }
}, 1000);
