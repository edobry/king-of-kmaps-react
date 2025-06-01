import { GameModel, type Position, GameModelInterface } from "../domain/game";
import express from "express";
import { NotFoundError } from "./errors";
import superjson from "superjson";
import gameDb from "./db";

const router = express.Router();

router.get("/", async (_req: express.Request, res: express.Response) => {
    const game = await gameDb.getGame();
    if (!game)
        throw new NotFoundError("game not initialized");
    
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

    await gameDb.deleteGame();
    await gameDb.setGame(gameModel);

    res.send(superjson.stringify(gameModel));
});

router.post("/random", async (req: express.Request, res: express.Response) => {
    const game = await gameDb.getGame();

    if (!game) {
        throw new Error("game not initialized");
    }

    const gameModel = game.randomizeBoard();
    await gameDb.setGame(gameModel);

    res.send(superjson.stringify(gameModel));
});

router.post("/move", async (req: express.Request, res: express.Response) => {
    const body = req.body;

    if (!body) {
        throw new Error("you must send a move");
    }

    if (!body.pos) {
        throw new Error("you must send a position");
    }

    const game = await gameDb.getGame();

    if (!game) {
        throw new Error("game not initialized");
    }

    const gameModel = game.makeMove(body.pos);
    await gameDb.setGame(gameModel);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    res.send(superjson.stringify(gameModel));
});

router.post("/group", async (req: express.Request, res: express.Response) => {
    const body = req.body;
    
    if (!body) {
        throw new Error("you must send a selection");
    }

    if (!body.selected) {
        throw new Error("you must send a selection");
    }

    const game = await gameDb.getGame();

    if (!game) {
        throw new Error("game not initialized");
    }

    const selected = body.selected as Position[];
    
    try {
        game.groupSelected(selected);
        await gameDb.setGame(game);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        res.send(superjson.stringify(game));
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

router.delete("/", async (req: express.Request, res: express.Response) => {
    await gameDb.deleteGame();
    res.sendStatus(204);
});

export default router;
