import { useCallback, useState } from "react";

import api from "./api";
import { useNavigate } from "react-router";

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

export default function NewGame() {
    const navigate = useNavigate();

    const [numVars, setNumVars] = useState(5);
    const [players, setPlayers] = useState(["Player 1", "Player 2"]);

    const startGame = useCallback(async () => {
        const gameData = await api.initGame(numVars, {
            players: players,
        });
        navigate(`/game/${gameData.id}`);
    }, [numVars, players, navigate]);

    const setPlayer = useCallback(
        (index: number): ChangeHandler =>
            (e) => {
                setPlayers(prev => {
                    const newPlayers = [...prev];
                    newPlayers[index] = e.target.value;
                    return newPlayers;
                });
            },
        []
    );

    return (
        <div id="game-inputs">
            <b>Number of Variables:</b>{" "}
            <input
                type="number"
                min={1}
                max={6}
                value={numVars}
                onChange={(e) => setNumVars(parseInt(e.target.value))}
            />
            <div id="player-select">
                <b>Players:</b>
                {players.map((_, index) => (
                    <input
                        type="text"
                        key={index}
                        onChange={setPlayer(index)}
                        placeholder={`Player ${index + 1}`}
                    />
                ))}
            </div>
            <button onClick={startGame}>Start Game</button>
        </div>
    );
}
