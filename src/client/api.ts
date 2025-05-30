import { type Game, type Position } from "../domain/game";
import { type ApiError } from "../server/errors";
import superjson from "superjson";

const baseUrl = "http://localhost:3000";

const doFetch = async (path: string, method: string, options?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });
    if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.message);
    }
    return response.text() as Promise<string>;
};


export const superParse = <T>(rawGame: string): T => {
    const obj = superjson.parse<T>(rawGame);
    return obj;
};


export const fetchGame = async () => {
    try {
        return superParse<Game>(await doFetch("/game", "GET"));
    } catch {
        return undefined;
    }
};

export const initGame = async (numVars: number, { players }: { players: string[] }) =>
    superParse<Game>(await doFetch("/game", "POST", { body: JSON.stringify({ numVars, players }) }));

export const randomizeBoard = async () =>
    superParse<Game>(await doFetch("/game/random", "POST"));

export const makeMove = async (pos: Position) =>
    superParse<Game>(await doFetch("/game/move", "POST", { body: JSON.stringify({ pos }) }));

export const groupSelected = async (selected: Position[]) =>
    superParse<Game>(await doFetch("/game/group", "POST", { body: JSON.stringify({ selected }) }));

export const resetGame = async () =>
    doFetch("/game", "DELETE");
