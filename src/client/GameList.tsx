import { useEffect } from "react";
import { Link } from "react-router";
import { endPhase, GameModel } from "../domain/game";
import { useState } from "react";
import api from "./api";

export const GameList = () => {
    const [games, setGames] = useState<GameModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getGames().then(setGames);
        setLoading(false);
    }, []);

    return (
        <div id="lobby">
            <h2>Games</h2>
            <Link className="nav-link" to="/game/new">New Game</Link>
            <br />
            <br />
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="game-list">
                    {games
                        .filter((game) => game.phase != endPhase)
                        .sort((a, b) => a.id! - b.id!)
                        .map((game) => (
                            <Link key={game.id} to={`/game/${game.id}`}>
                                <h3>Game #{game.id}</h3>
                                <div>[{game.players.join(" | ")}]</div>
                                <div>
                                    {game.info.numVars} variables,{" "}
                                    {game.moveCounter} moves, {game.phase} phase
                                </div>
                            </Link>
                        ))}
                </div>
            )}
        </div>
    );
};
