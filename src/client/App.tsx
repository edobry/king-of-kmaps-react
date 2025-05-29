import React, { useCallback, useState, useEffect } from 'react';
import './App.css';
import GameView from './GameView';
import { fetchGame, initGame } from './api';
import type { Game } from '../domain/game';

type AppState = {
    game?: Game;
    gameStarted: boolean;
    players: string[];
    numVars: number;
}

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

function App() {
    const [app, setApp] = useState<AppState>({
        game: undefined,
        gameStarted: false,
        players: ["Player 1", "Player 2"],
        numVars: 5,
    });

    const appUpdater = (updater: (app: AppState) => void) => {
        const newApp = structuredClone(app);
        updater(newApp);
        setApp(newApp);
    }
    
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
                    <GameStart app={app} appUpdater={appUpdater} />
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
                <GameView game={app.game!} />
            )}
        </div>
    </>);
}

function GameStart({ app, appUpdater }: { app: AppState, appUpdater: (updater: (app: AppState) => void) => void }) {
    const [game, setGame] = useState<Game | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const gameData = await fetchGame();
            setGame(gameData);
            setLoading(false);
        })();
    }, []);

    const startGame = useCallback(async () => {
        const gameData = await initGame(app.numVars, { players: app.players }) as Game;
        appUpdater(app => {
            app.game = gameData;
            app.gameStarted = true;
        });
    }, [appUpdater, app.numVars, app.players]);

    const continueGame = useCallback(() => {
        appUpdater(app => {
            app.game = game;
            app.gameStarted = true;
        });
    }, [appUpdater, game]);

    const setNumVars: ChangeHandler = useCallback((e) => {
        appUpdater(app => {
            app.numVars = parseInt(e.target.value)
        });
    }, [appUpdater]);

    const setPlayer = useCallback((index: number): ChangeHandler => (e) => {
        appUpdater((app) => (
            app.players[index] = e.target.value
        ));
    }, [appUpdater]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id="game-inputs">
            <b>Number of Variables:</b> <input type="number" min={1} max={6} value={app.numVars} onChange={setNumVars} />
            
            <div id="player-select">
                <b>Players:</b>
                {app.players.map((_, index ) => (
                    <input type="text" key={index} onChange={setPlayer(index)} placeholder={`Player ${index + 1}`} />
                ))}
            </div>
            <button onClick={startGame}>Start {game ? "New " : ""}Game</button>
            {game && <button onClick={continueGame}>Continue Game</button>}
        </div>
    )
}

export default App
