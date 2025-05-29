import { makeGame, makeMove, makeSelection, randomizeBoard, type Game } from "../domain/game";
import express from "express";
import { NotFoundError } from "./errors";
import superjson from "superjson";

let game: Game | undefined;

const router = express.Router();

router.get("/", (_req: express.Request, res: express.Response) => {
    if (!game)
        throw new NotFoundError("game not found");

    res.send(superjson.stringify(game));
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

    game = makeGame(body.numVars, {
        players: body.players,
        phase: body.phase,
        currentTurn: body.currentTurn,
    });
    res.send(superjson.stringify(game));
});

router.post("/random", (req: express.Request, res: express.Response) => {
    if (!game) {
        throw new Error("game not initialized");
    }

    game = randomizeBoard(game);

    res.send(superjson.stringify(game));
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

    game = makeMove(body.pos)(game);

    res.send(superjson.stringify(game));
});

router.post("/select", (req: express.Request, res: express.Response) => {
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

    game = makeSelection(body.pos)(game);

    res.send(superjson.stringify(game));
});

export default router;
