import { Link, useLoaderData, useNavigate } from "react-router";
import { GameModel } from "../domain/game";
import { Suspense, use } from "react";

export const GameLobby = () => {
    return (
        <div id="lobby">
            <h2>Games</h2>
            <Link className="nav-link" to="/game/new">
                New Game
            </Link>
            <br />
            <br />
            <Suspense fallback={<GameLoadingList />}>
                <GameList />
            </Suspense>
        </div>
    );
};

export const GameList = () => {
    const { pGames } = useLoaderData<{ pGames: Promise<GameModel[]> }>();
    const games = use(pGames);
    return (
        <div id="game-list">
            {games.map((game) => (
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
