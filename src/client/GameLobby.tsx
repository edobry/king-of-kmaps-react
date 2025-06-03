import { Link, useLoaderData, useNavigate } from "react-router";
import { GameModel, localGameType, onlineGameType, type GameType } from "../domain/game";
import { Suspense, use, useState } from "react";
import { GameTypeSelect } from "./GameTypeSelect";

export const GameLobby = () => {
    const [gameType, setGameType] = useState<GameType>(localGameType);

    return (
        <div id="lobby">
            <h2>Games</h2>
            <GameTypeSelect gameType={gameType} setGameType={setGameType} />
            <Link className="nav-link" to="/game/new">
                New Game
            </Link>
            <br />
            <br />
            <Suspense fallback={<GameLoadingList />}>
                <GameList gameType={gameType} />
            </Suspense>
        </div>
    );
};

export const GameList = ({ gameType }: { gameType: GameType }) => {
    const { pGames } = useLoaderData<{ pGames: Promise<GameModel[]> }>();
    const games = use(pGames);

    const joinableGames = games
        .filter((game) => {
            if (gameType === localGameType) {
                return game.gameType === localGameType;
            }

            return game.gameType === onlineGameType && game.players.length < 2;
        })
        .sort((a, b) => a.id! - b.id!);

    return (
        <div id="game-list">
            {joinableGames.map((game) => (
                <GameCard key={game.id} game={game} />
            ))}
        </div>
    );
};

export const GameCard = ({ game }: { game: GameModel }) => {
    const navigate = useNavigate();

    return (
        <div
            className="game-card"
            key={game.id}
            onClick={() => navigate(`/game/${game.id}`)}
        >
            <h3>Game #{game.id}</h3>
            <div>[{game.players.join(" | ")}]</div>
            <div>
                {game.info.numVars} variables, {game.moveCounter} moves,{" "}
                {game.phase} phase
            </div>
        </div>
    );
};

export const GameLoadingList = () => {
    return (
        <div id="game-list">
            {Array(3).fill(0).map((_, i) => (
                <div className="game-card" key={`loading-${i}`}>
                    <h3>Loading...</h3>
                </div>
            ))}
        </div>
    );
};
