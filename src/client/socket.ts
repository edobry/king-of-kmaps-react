import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";
import type { GameModel } from "../domain/game";
import { GAME_NAMESPACE, GAME_JOIN_EVENT, GAME_JOINED_EVENT, GAME_UPDATED_EVENT } from "../server/constants";
import superjson from "superjson";

class GameSocketClient {
    private socket: Socket | undefined;

    connect(gameId: number, playerName: string): Promise<{ game: GameModel, playerNum: number }> {
        return new Promise<{ game: GameModel, playerNum: number }>((resolve, reject) => {
            this.socket = io(`${API_BASE_URL}/${GAME_NAMESPACE}`, {
                // forceNew: true
            });
            
            this.socket.on("connect", () => {
                console.log("Connected to game namespace");
                this.socket?.emit(GAME_JOIN_EVENT, { gameId, playerName }, (res: string) => {
                    const response = superjson.parse(res) as { game: GameModel, playerNum: number } | { error: string };
                    if ('error' in response) {
                        reject(new Error(response.error));
                    } else {
                        const { game, playerNum } = response;
                        resolve({ game, playerNum });
                    }
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

    onJoined(callback: (game: GameModel, playerName: string) => void) {
        this.socket?.on(GAME_JOINED_EVENT, (gameData: string, playerName: string) => {
            console.log(`Received ${GAME_JOINED_EVENT} event`, gameData, playerName);
            try {
                const game = superjson.parse(gameData) as GameModel;
                callback(game, playerName);
            } catch (error) {
                console.error("Error parsing game data:", error);
            }
        });
    }

    onUpdated(callback: (game: GameModel) => void) {
        this.socket?.on(GAME_UPDATED_EVENT, (gameData: string) => {
            console.log(`Received ${GAME_UPDATED_EVENT} event`, gameData);
            try {
                const game = superjson.parse(gameData) as GameModel;
                callback(game);
            } catch (error) {
                console.error("Error parsing game data:", error);
            }
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = undefined;
    }
}

export default GameSocketClient;
