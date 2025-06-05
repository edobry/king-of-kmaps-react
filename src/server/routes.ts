import { GameModel, localGameType, type Position } from "../domain/game";
import express from "express";
import { NotFoundError } from "./errors";
import superjson from "superjson";
import gameDb from "./db";
import { Namespace, Socket } from "socket.io";
import { GAME_NAMESPACE, GAME_JOINED_EVENT, GAME_UPDATED_EVENT, makeRoomName } from "./constants";
import { getSocketIO } from ".";

const router = express.Router();

type Routes = {
    prefix: string,
    httpRouter: express.Router,
    socketRouter: (namespace: Namespace) => void,
}   

const connectedPlayers = new Map<number, { socketId: string, playerNum: number }[]>();
const socketToGame = new Map<string, [number, number]>();

// Helper function to get game and validate it exists
const getGameOrThrow = async (gameId: number): Promise<GameModel> => {
    const game = await gameDb.getGame(gameId);
    if (!game) {
        throw new NotFoundError("game not found");
    }
    return game;
};

const defaultDelay = 0;

// Helper function to update game and send response
const updateGameAndRespond = async (
    req: express.Request,
    res: express.Response, 
    updatedGame: GameModel, 
    delay = defaultDelay
): Promise<void> => {
    await gameDb.setGame(updatedGame);
    if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    getSocketIO(req).of(GAME_NAMESPACE).to(makeRoomName(updatedGame.id!))
        .emit(GAME_UPDATED_EVENT, superjson.stringify(updatedGame));

    res.send(superjson.stringify(updatedGame));
};

router.get("/", async (req: express.Request, res: express.Response) => {
    const games = await gameDb.getGames();
    res.send(superjson.stringify(games));
});

router.get("/:gameId", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    const game = await getGameOrThrow(Number(gameId));
    res.send(superjson.stringify(game));
});

router.get("/:gameId/players", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    const game = await getGameOrThrow(Number(gameId));

    res.send(superjson.stringify(game.players));
});

router.post("/", async (req: express.Request, res: express.Response) => {
    const body = req.body;

    if (!body) {
        res.status(400).json({
            status: 400,
            message: "you must send a game configuration",
        });
        return;
    }

    if (!body.numVars) {
        res.status(400).json({
            status: 400,
            message: "numVars is required",
        });
        return;
    }

    if (typeof body.numVars !== "number") {
        res.status(400).json({
            status: 400,
            message: "numVars must be a number",
        });
        return;
    }

    const gameModel = GameModel.initGame(body.numVars, {
        players: body.players,
        phase: body.phase,
        currentTurn: body.currentTurn,
        gameType: body.gameType,
    });

    await gameDb.setGame(gameModel);

    res.send(superjson.stringify(gameModel));
});

router.post("/:gameId/random", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    const game = await getGameOrThrow(Number(gameId));
    const updatedGame = game.randomizeBoard();
    await updateGameAndRespond(req, res, updatedGame);
});

router.post("/:gameId/move", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    
    const body = req.body;

    if (!body) {
        throw new Error("you must send a move");
    }

    if (!body.pos) {
        throw new Error("you must send a position");
    }

    const game = await getGameOrThrow(Number(gameId));
    const updatedGame = game.makeMove(body.pos);
    await updateGameAndRespond(req, res, updatedGame);
});

router.post("/:gameId/group", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    
    const body = req.body;
    
    if (!body) {
        throw new Error("you must send a selection");
    }

    if (!body.selected) {
        throw new Error("you must send a selection");
    }

    const game = await getGameOrThrow(Number(gameId));
    const selected = body.selected as Position[];
    
    try {
        const updatedGame = game.groupSelected(selected);
        await updateGameAndRespond(req, res, updatedGame);
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

router.delete("/:gameId", async (req: express.Request, res: express.Response) => {
    const gameId = req.params.gameId;
    if (!gameId) {
        res.status(400).json({
            status: 400,
            message: "gameId is required",
        });
        return;
    }
    await gameDb.deleteGame(Number(gameId));
    res.sendStatus(204);
});

const joinRoom = (namespace: Namespace, socket: Socket) => async (
    { gameId, playerName }: { gameId: number; playerName: string },
    callback?: (game: string) => void
) => {
    try {
        if (!gameId) {
            throw new Error("gameId is required");
        }
        if (!playerName || playerName.length === 0) {
            throw new Error("you must send a player name");
        }

        console.log(`${socket.id}: player ${playerName} joined game ${gameId}`);

        const game = await getGameOrThrow(Number(gameId));

        if (game.players.length === 2) {
            throw new Error("game is full");
        }

        if (game.players.includes(playerName)) {
            throw new Error("player name already in use");
        }

        game.players.push(playerName);
        await gameDb.setGame(game);
        
        const playerNum = game.players.length - 1;

        connectedPlayers.set(gameId, [
            ...(connectedPlayers.get(gameId) || []),
            { socketId: socket.id, playerNum },
        ]);
        socketToGame.set(socket.id, [gameId, playerNum]);

        socket.join(makeRoomName(gameId));

        // Send acknowledgment back to the connecting client
        if (callback) {
            callback(superjson.stringify({
                game,
                playerNum,
            }));
        }

        // Broadcast to all players in the game (including the one who just joined)
        namespace
            .to(makeRoomName(gameId))
            .emit(GAME_JOINED_EVENT, superjson.stringify(game), playerName);
    } catch (error) {
        console.error(`Error in join handler: ${error}`);
        if (callback) {
            callback(
                superjson.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                })
            );
        }
    }
};

const disconnect = (namespace: Namespace, socket: Socket) => async (reason: string, description: any) => {
    console.log(`${socket.id}: player disconnected: ${reason} ${description}`);

    if (!socketToGame.has(socket.id)) return;

    const [gameId, playerNum] = socketToGame.get(socket.id)!;
    console.log(`${socket.id}: player ${playerNum} left game ${gameId}`);

    const game = await getGameOrThrow(gameId);
    game.players[playerNum] = "";
    await gameDb.setGame(game);
    
    socketToGame.delete(socket.id);
    connectedPlayers.set(
        gameId,
        (connectedPlayers.get(gameId) || []).filter(
            ({ socketId }) => socketId !== socket.id
        )
    );

    namespace.to(makeRoomName(gameId))
        .emit(GAME_UPDATED_EVENT, superjson.stringify(game));
};

const socketRouter = (namespace: Namespace) => {
    namespace.on("connection", (socket) => {
        console.log(`${socket.id}: player connected`);
        socket.on("join", joinRoom(namespace, socket));
        socket.on("disconnect", disconnect(namespace, socket));
    });
};

export default {
    prefix: GAME_NAMESPACE,
    httpRouter: router,
    socketRouter,
} as Routes;
