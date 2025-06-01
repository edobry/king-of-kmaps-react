import { GameModel, type Position, GameModelInterface } from "../domain/game";
import express from "express";
import { NotFoundError } from "./errors";
import superjson from "superjson";
import gameDb from "./db";

const router = express.Router();

// Helper function to get game and validate it exists
const getGameOrThrow = async (gameId: number): Promise<GameModel> => {
    const game = await gameDb.getGame(gameId);
    if (!game) {
        throw new NotFoundError("game not found");
    }
    return game;
};

// Helper function to update game and send response
const updateGameAndRespond = async (
    res: express.Response, 
    updatedGame: GameModel, 
    delay = 0
): Promise<void> => {
    await gameDb.setGame(updatedGame);
    if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
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
    await updateGameAndRespond(res, updatedGame);
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
    await updateGameAndRespond(res, updatedGame, 3000);
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
        await updateGameAndRespond(res, updatedGame, 3000);
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

export default router;
