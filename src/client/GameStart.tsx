import { useCallback, useEffect, useState } from "react";

import type { AppState } from "./App";
import api from "./api";
import type { GameState } from "../domain/game";

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

export default function GameStart({
    app,
    appUpdater,
    setGame,
}: {
    app: AppState;
    appUpdater: (updater: (app: AppState) => void) => void;
    setGame: (game: GameState, started: boolean) => void;
}) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const gameData = await api.fetchGame();
            setLoading(false);
            if (gameData) {
                setGame(gameData, true);
            }
        })();
    }, [setGame]);

    const startGame = useCallback(async () => {
        const gameData = await api.initGame(app.numVars, {
            players: app.players,
        });
        setGame(gameData, true);
    }, [setGame, app.numVars, app.players]);

    const setNumVars: ChangeHandler = useCallback(
        (e) => {
            appUpdater((prev) => {
                prev.numVars = parseInt(e.target.value);
            });
        },
        [appUpdater]
    );

    const setPlayer = useCallback(
        (index: number): ChangeHandler =>
            (e) => {
                appUpdater((prev) => {
                    prev.players[index] = e.target.value;
                });
            },
        [appUpdater]
    );

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id="game-inputs">
            <b>Number of Variables:</b>{" "}
            <input
                type="number"
                min={1}
                max={6}
                value={app.numVars}
                onChange={setNumVars}
            />
            <div id="player-select">
                <b>Players:</b>
                {app.players.map((_, index) => (
                    <input
                        type="text"
                        key={index}
                        onChange={setPlayer(index)}
                        placeholder={`Player ${index + 1}`}
                    />
                ))}
            </div>
            <button onClick={startGame}>Start {app.game ? "New " : ""}Game</button>
            {app.game && (
                <button onClick={() => appUpdater((prev) => {
                    prev.gameStarted = true;
                })}>Continue Game</button>
            )}
        </div>
    );
}
