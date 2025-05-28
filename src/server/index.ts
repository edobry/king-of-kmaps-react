import express from "express";
import { NotFoundError } from "./errors";
import gameRouter from "./routes";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/game", gameRouter);

app.use((_: express.Request, res: express.Response) => {
    throw new NotFoundError("invalid route");
});

const jsonErrorHandler = (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof NotFoundError) {
        res.status(404);
    } else {
        res.status(500);
    }

    res.json({ 
        status: res.statusCode,
        message: err.message,
    });
};

app.use(jsonErrorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
