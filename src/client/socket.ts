import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";
import type { GameModel } from "../domain/game";

const GAME_NAMESPACE = "/game";
const GAME_JOIN_EVENT = "join";

class GameSocketClient {
    private socket: Socket | undefined;

    connect(gameId: number, playerName: string): Promise<GameModel> {
        return new Promise<GameModel>((resolve, reject) => {
            // Connect to the namespace, not to a specific game ID in the URL
            this.socket = io(`${API_BASE_URL}${GAME_NAMESPACE}`, {
                forceNew: true
            });
            
            this.socket.on("connect", () => {
                console.log("Connected to game namespace");
                this.socket?.emit(GAME_JOIN_EVENT, { gameId, playerName }, (game: GameModel) => {
                    resolve(game);
                });
            });

            this.socket.on("connect_error", (error) => {
                console.error("Socket connection error:", error);
                reject(error);
            });

            this.socket.on("disconnect", (reason) => {
                console.log("Disconnected:", reason);
            });
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = undefined;
    }
}

export default GameSocketClient;
