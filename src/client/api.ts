import type { Game, Position } from "../domain/game";

const baseUrl = "http://localhost:3000";

const doFetch = async <T>(path: string, method: string, options?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json() as Promise<T>;
};

export const fetchGame = async () => {
    try {
        return await doFetch<Game>("/game", "GET");
    } catch {
        return undefined;
    }
};

export const initGame = async (numVars: number, { players }: { players: string[] }) =>
    doFetch<Game>("/game", "POST", { body: JSON.stringify({ numVars, players }) });

export const randomizeBoard = async () =>
    doFetch<Game>("/game/random", "POST");

export const makeMove = async (pos: Position) =>
    doFetch<Game>("/game/move", "POST", { body: JSON.stringify({ pos }) });

export const makeSelection = async (pos: Position) =>
    doFetch<Game>("/game/select", "POST", { body: JSON.stringify({ pos }) });
