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

    async fetchGame() {
        try {
            return superParse<GameModel>(await this.doFetch("/game", "GET"));
        } catch (error) {
            return undefined;
        }
    }

    async initGame(numVars: number, { players = [] }: GameOptions = {}) {
        return superParse<GameModel>(
            await this.doFetch("/game", "POST", {
                body: JSON.stringify({ numVars, players }),
            })
        );
    }

    async randomizeBoard() {
        return superParse<GameModel>(await this.doFetch("/game/random", "POST"));
    }

    async makeMove(pos: Position) {
        return superParse<GameModel>(
            await this.doFetch("/game/move", "POST", {
                body: JSON.stringify({ pos }),
            })
        );
    }
    
    async groupSelected(selected: Position[]) {
        return superParse<GameModel>(
            await this.doFetch("/game/group", "POST", {
                body: JSON.stringify({ selected }),
            })
        );
    }
    async resetGame() {
        this.doFetch("/game", "DELETE");
    }
}

const baseUrl = "http://localhost:3000";
export default new RemoteGameInterface(baseUrl);
