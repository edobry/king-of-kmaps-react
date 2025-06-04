import { type GameModel, type GameOptions, type Position } from "../domain/game";
import type { GameInterface } from "../domain/state";
import { type ApiError } from "../server/errors";
import superjson from "superjson";

export const superParse = <T>(raw: string): T => {
    const obj = superjson.parse<T>(raw);
    return obj;
};

class RemoteGameInterface implements GameInterface {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }
  
    private doFetch = async (path: string, method: string, options?: RequestInit): Promise<string> => {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        });
        if (!response.ok) {
            const error = (await response.json()) as ApiError;
            throw new Error(error.message);
        }
        return response.text();
    };

    async getGames() {
        return superParse<GameModel[]>(await this.doFetch("/game", "GET"));
    }

    async getGame(gameId: number) {
        try {
            return superParse<GameModel>(await this.doFetch(`/game/${gameId}`, "GET"));
        } catch {
            return undefined;
        }
    }

    async initGame(numVars: number, gameOptions: GameOptions = {}) {
        return superParse<GameModel>(
            await this.doFetch("/game", "POST", {
                body: JSON.stringify({ numVars, ...gameOptions }),
            })
        );
    }

    async randomizeBoard(gameId: number) {
        return superParse<GameModel>(await this.doFetch(`/game/${gameId}/random`, "POST"));
    }

    async makeMove(gameId: number, pos: Position) {
        return superParse<GameModel>(
            await this.doFetch(`/game/${gameId}/move`, "POST", {
                body: JSON.stringify({ pos }),
            })
        );
    }
    
    async groupSelected(gameId: number, selected: Position[]) {
        return superParse<GameModel>(
            await this.doFetch(`/game/${gameId}/group`, "POST", {
                body: JSON.stringify({ selected }),
            })
        );
    }
    async joinGame(gameId: number, playerName: string) {
        return superParse<{ success: boolean; game: GameModel; playerName: string }>(
            await this.doFetch(`/game/${gameId}/join`, "POST", {
                body: JSON.stringify({ name: playerName }),
            })
        );
    }

    async resetGame(gameId: number) {
        this.doFetch(`/game/${gameId}`, "DELETE");
    }
}

export const API_BASE_URL = "http://localhost:3000";
export default new RemoteGameInterface(API_BASE_URL);
