import { useCallback, useState } from 'react';
import './App.css';
import GameView from './GameView';
import GameStart from './GameStart';
import type { Game } from '../domain/game';
import { resetGame } from './api';

export type AppState = {
    game?: Game;
    gameStarted: boolean;
    players: string[];
    numVars: number;
}

function App() {
    const [app, setApp] = useState<AppState>({
        game: undefined,
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

    const setGame = useCallback((game: Game | undefined, started: boolean) => {
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
                    <GameStart app={app} appUpdater={appUpdater} setGame={setGame} />
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
                    await resetGame();
                    setGame(undefined, false);
                }} />
            )}
        </div>
    </>);
}

export default App
