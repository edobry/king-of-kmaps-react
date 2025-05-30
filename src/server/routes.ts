import { type Position } from "../domain/game";
import express from "express";
import { NotFoundError } from "./errors";
import superjson from "superjson";
import { Game } from "../domain/state";

const game = new Game(undefined);

const router = express.Router();

router.get("/", (_req: express.Request, res: express.Response) => {
    if (!game.state)
        throw new NotFoundError("game not initialized");

    res.send(superjson.stringify(game.state));
});

router.post("/", (req: express.Request, res: express.Response) => {
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

    game.initGame(body.numVars, {
        players: body.players,
        phase: body.phase,
        currentTurn: body.currentTurn,
    });
    res.send(superjson.stringify(game.state));
});

router.post("/random", (req: express.Request, res: express.Response) => {
    if (!game) {
        throw new Error("game not initialized");
    }

    game.randomizeBoard();

    res.send(superjson.stringify(game.state));
});

router.post("/move", (req: express.Request, res: express.Response) => {
    const body = req.body;

    if (!body) {
        throw new Error("you must send a move");
    }

    if (!body.pos) {
        throw new Error("you must send a position");
    }

    if (!game) {
        throw new Error("game not initialized");
    }

    game.makeMove(body.pos);

    res.send(superjson.stringify(game.state));
});

router.post("/group", (req: express.Request, res: express.Response) => {
    const body = req.body;
    
    if (!body) {
        throw new Error("you must send a selection");
    }

    if (!body.selected) {
        throw new Error("you must send a selection");
    }

    if (!game) {
        throw new Error("game not initialized");
    }

    const selected = body.selected as Position[];
    
    try {
        game.groupSelected(selected);
        res.send(superjson.stringify(game.state));
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

router.delete("/", (req: express.Request, res: express.Response) => {
    game.resetGame();
    res.sendStatus(204);
});

export default router;
