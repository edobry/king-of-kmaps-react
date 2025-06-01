import { useCallback, useEffect, useState } from 'react';
import GameView from './GameView';
import './App.css';
import api from './api';
import { endPhase, GameModel } from '../domain/game';
import GameStart from './GameStart';

export type AppState = {
    game?: GameModel;
    startingNewGame: boolean;
    gameStarted: boolean;
    players: string[];
    numVars: number;
}

function App() {
    const [app, setApp] = useState<AppState>({
        game: undefined,
        startingNewGame: false,
        gameStarted: false,
        players: ["Player 1", "Player 2"],
        numVars: 5,
    });

    const appUpdater = useCallback((updater: (app: AppState) => void) => {
        setApp((prev) => {
            const newApp = structuredClone(prev);
            updater(newApp);
            return newApp;
        });
    }, []);

    const setGame = useCallback((game: GameModel | undefined, started: boolean) => {
        appUpdater((prev) => {
            prev.game = game;
            prev.gameStarted = started;
        });
    }, [appUpdater]);
    
    return (<>
        <h1>King of K-Maps</h1>
        <div id="main">
            {!app.gameStarted ? (
                <div id="game-start">
                    <div id="intro">
                        This game was invented by my high school's Electronics teacher to help us learn about <a href="https://en.wikipedia.org/wiki/Karnaugh_map">Karnaugh maps</a> (a visual heuristic method for simplifying boolean expressions) through competition, and over time it grew into a cult classic and an annual school-wide tournament.
                        <br /><br />
                        Now, you too can experience <b>King of K-Maps!</b>
                        <br /><br />
                    </div>
                    <GameList app={app} appUpdater={appUpdater} setGame={setGame} onClick={async (gameId: number) => {
                        const game = await api.getGame(gameId);
                        if (game) {
                            setGame(game, true);
                        }
                    }} />
                    <div id="game-rules">
                        <h2>How to Play</h2>
                        <ol>
                            <li>The <i>number of variables</i> corresponds to the dimensionality of the boolean expression we're simplifying, and is used to calculate the board size.</li>
                            <li>The game board is a set of N grids, each of which is a 2^N grid of cells.</li>
                            <li>Each cell represents the truth value of specific state of the boolean expression (0 or 1).</li>
                            <li>The game is played in two phases. In the first (placing) phase, players take turns placing a 0 or 1 (randomly assigned), until the board is full.</li>
                            <li>In the second (scoring) phase, players take turns grouping their own cells into groups of 2^N (ie 1, 2, 4, 8, 16, etc.), until all cells are grouped.</li>
                            <li>The goal is to fully cover your cells with the fewest number of groups (the larger groups you can make, the fewer you'll need).</li>
                            <li>Once all cells have been grouped, the player with the fewest groups wins!</li>
                        </ol>
                        <h3>Resources:</h3>
                        <ul>
                            <li><a href="https://www.charlie-coleman.com/experiments/kmap/">Karnaugh Map Solver</a></li>
                            <li><a href="https://ee.usc.edu/~redekopp/ee209/slides/EE209Spiral1-5.pdf">Lecture Slides</a></li>
                        </ul>
                    </div>
                </div>
            ) : (
                <GameView game={app.game!} newGame={async () => {
                    setGame(undefined, false);
                }} />
            )}
        </div>
    </>);
}

const GameList = ({ app, appUpdater, setGame, onClick }: { app: AppState, appUpdater: (updater: (app: AppState) => void) => void, setGame: (game: GameModel | undefined, started: boolean) => void, onClick: (gameId: number) => void }) => {
    const [games, setGames] = useState<GameModel[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getGames().then(setGames);
        setLoading(false);
    }, []);

    return (
        <>
        {!app.startingNewGame ? (<>
            <div>
                <h2>Games</h2>
                {loading ? (<div>Loading...</div>) : (
                <ul>
                    {games.filter((game) => game.phase != endPhase).map((game) => (
                        <li key={game.id} onClick={() => onClick(game.id!)}>{game.id} - {game.info.numVars} variables, {game.players.join(", ")}, {game.moveCounter} moves, {game.phase} phase</li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={() => {
                appUpdater((prev) => {
                    prev.startingNewGame = true;
                });
            }}>New Game</button>
            </>
        ) : (
            <GameStart app={app} appUpdater={appUpdater} setGame={setGame} />
        )}
        </>
    );
}

export default App
