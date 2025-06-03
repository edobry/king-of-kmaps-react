import { useCallback, useState } from "react";

import api from "./api";
import { Link, useNavigate } from "react-router";
import { localGameType, onlineGameType, type GameType } from "../domain/game";

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

export default function NewGame() {
    const navigate = useNavigate();

    const [gameType, setGameType] = useState<GameType>(localGameType);
    const [numVars, setNumVars] = useState(5);

    const [players, setPlayers] = useState<string[]>([]);

    const numPlayers = gameType === localGameType ? 2 : 1;

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
                    return newPlayers.slice(0, numPlayers);
                });
            },
        [numPlayers]
    );

    return (
        <>
            <Link className="nav-link" to="/">
                {"<"} Continue Game
            </Link>
            <div id="game-inputs">
                <GameTypeSelect gameType={gameType} setGameType={setGameType} />
                <br />
                <b>Number of Variables:</b>{" "}
                <input
                    type="number"
                    min={1}
                    max={6}
                    value={numVars}
                    onChange={(e) => setNumVars(parseInt(e.target.value))}
                />
                <div id="player-select">
                    <b>{gameType === localGameType ? "Players:" : "Your Name:"}</b>
                    {Array.from({ length: numPlayers }, (_, index) => (
                        <input
                            type="text"
                            key={index}
                            onChange={setPlayer(index)}
                            placeholder={`Player ${index + 1}`}
                            defaultValue={players[index] ?? ""}
                        />
                    ))}
                </div>
                <button onClick={startGame}>Start Game</button>
            </div>
        </>
    );
}

const GameTypeSelect = ({ gameType, setGameType }: { gameType: GameType, setGameType: (gameType: GameType) => void }) => {
    return (
        <div className="game-type">
            <label htmlFor="game-type-local" className={`game-type-select ${gameType === localGameType ? "selected" : ""}`}>
                <input type="radio" name="game-type" id="game-type-local" value={localGameType} checked={gameType === localGameType} onChange={() => setGameType(localGameType)} />
                Local
            </label>
            <label htmlFor="game-type-online" className={`game-type-select ${gameType === onlineGameType ? "selected" : ""}`}>
                <input type="radio" name="game-type" id="game-type-online" value={onlineGameType} checked={gameType === onlineGameType} onChange={() => setGameType(onlineGameType)} />
                Online
            </label>
        </div>
    );
};
