import { useCallback, useState } from "react";

import api from "./api";
import { useNavigate } from "react-router";
import { localGameType, type GameType } from "../domain/game";

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

export default function NewGame({ gameType, cancelStartingGame }: { gameType: GameType, cancelStartingGame: () => void }) {
    const navigate = useNavigate();

    const [numVars, setNumVars] = useState(5);

    const [players, setPlayers] = useState<string[]>(gameType === localGameType ? ["", ""] : []);

    const startGame = useCallback(async () => {
        const gameData = await api.initGame(numVars, {
            players: players,
            gameType: gameType,
        });
        navigate(`/game/${gameData.id}`);
    }, [numVars, players, gameType, navigate]);

    const setPlayer = useCallback(
        (index: number): ChangeHandler =>
            (e) => {
                setPlayers(prev => {
                    const newPlayers = [...prev];
                    newPlayers[index] = e.target.value.trim();
                    return newPlayers;
                });
            },
        []
    );

    return (
        <>
            <button className="nav-link" onClick={cancelStartingGame}>
                {"<"} Continue Game
            </button>
            <div id="game-inputs">
                <br />
                <b>Number of Variables:</b>{" "}
                <input
                    type="number"
                    min={1}
                    max={6}
                    value={numVars}
                    onChange={(e) => setNumVars(parseInt(e.target.value))}
                />
                {gameType === localGameType && (
                    <div id="player-select">
                        <b>Players:</b>
                        {Array.from({ length: 2 }, (_, index) => (
                        <input
                            type="text"
                            key={index}
                            onChange={setPlayer(index)}
                            placeholder={`Player ${index + 1}`}
                            defaultValue={players[index] ?? ""}
                            />
                        ))}
                    </div>
                )}
                <button className="nav-link" onClick={startGame}>Start Game</button>
            </div>
        </>
    );
}
