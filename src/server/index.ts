import express from "express";
import { type ApiError, NotFoundError } from "./errors";
import gameRoutes from "./routes";
import morganBody from "morgan-body";
import cors from "cors";
import { Server } from "socket.io";
// @ts-ignore - No types available for socket.io-logger
import socketIoLogger from "socket.io-logger";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

morganBody(app, {
    logAllReqHeader: true,
    logAllResHeader: false,
    logRequestBody: true,
    logResponseBody: false,
    prettify: true
});

app.use("/game", gameRoutes.httpRouter);

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
    } as ApiError);
};

app.use(jsonErrorHandler);

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: false
    },
});

// Socket.IO logging with socket.io-logger (morgan-like for Socket.IO)
const socketLogger = socketIoLogger({
    stream: {
        write: function(data: string) {
            // Morgan-like format: timestamp - socketId - event - data
            const logEntry = JSON.parse(data);
            const eventName = logEntry.name || 'unknown';
            const eventData = logEntry.data ? JSON.stringify(logEntry.data) : '';
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            console.log(`[${timestamp}] Socket ${logEntry.sock} -> ${eventName} ${eventData}`);
        }
    },
    format: function(socket: any, args: any[]) {
        return {
            sock: socket.id,
            name: args[0],
            data: args.slice(1),
            address: socket.handshake.address
        };
    }
});

io.use(socketLogger);

app.set("socketio", io);

const gameNamespace = io.of("/game");

gameRoutes.socketRouter(gameNamespace);

export const getSocketIO = (req: express.Request): Server => {
    return req.app.get("socketio") as Server;
};
