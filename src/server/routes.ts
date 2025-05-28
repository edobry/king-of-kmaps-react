import { makeGame, type Game } from "../domain/game";
import express from "express";

let game: Game | undefined;

const router = express.Router();

router.get("/", (_req: express.Request, res: express.Response) => {
    res.json(game);
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
    res.json(game);
});

export default router;
