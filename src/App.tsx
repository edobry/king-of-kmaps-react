import { useState } from 'react';
import './App.css'
import Grid from './Grid.tsx';
import { type Game, placePhase, scorePhase, makeRandomBoard, constructBoard, type Position, endPhase, getWinner, groupSelected, updateGame, makeMove, makeSelection, makeInitialGame } from './game.ts';

function App() {
    const numVars = 5;
    const { vars, dimensions, size } = constructBoard(numVars);
    
    const initialGame: Game = makeInitialGame(dimensions, size);
    
    const [game, setGame] = useState(initialGame);
    
    const resetGame = () => {
        setGame(initialGame);
    }
    
    const randomizeBoard = () => {
        setGame((game) => {
            return updateGame({
                ...game,
                moveCounter: 31
            }, makeRandomBoard(dimensions));
        });
    }
        
    const cellClick = (pos: Position) => {
        setGame((game) => {
            const newGame = structuredClone(game);
            
            return newGame.phase === placePhase
                ? makeMove(newGame, pos)
                : makeSelection(newGame, pos);
        });
    };
    
    const makeGroup = () => {
        setGame((game) => {
            const newGame = structuredClone(game);
            
            return groupSelected(newGame);
        });
    }
    
    return (
        <>
        <h1>King of K-Maps</h1>
        <div id="info">
        <b>Variables:</b> {numVars} ({Object.entries(vars).reverse().map(([key, value]) =>
            `${key} = ${value.join(", ")}`).join(" | ")})<br />
        <b>Grid Size:</b> {size} ({dimensions.map(d => `2^${d}`).join(" x ")})<br />
        <br />
        {game.phase !== endPhase && (
            <>
                <b>Current Phase:</b> {game.phase}<br />
                <b>Current Turn:</b> Player {game.currentTurn}<br />
            </>
        )}
        {game.phase === placePhase && (
            <>
                <br />
                Move Counter: {game.moveCounter}
            </>
        )}
        {game.phase === scorePhase && (
            <>
                <br />
                <b>Ungrouped</b>:<br />
                {Object.entries(game.scoring.numCellsGrouped).map(([player, num]) => (
                    <>
                    Player {player}: {(game.size / 2) - num} / {game.size / 2}<br />
                    </>
                ))}
            </>
        )}
        {[scorePhase, endPhase].includes(game.phase) && (
            <>
                <br />
                <b>Groups:</b>
                <br />
                {Object.entries(game.scoring.groups).map(([player, groups]) => (
                    <>
                    Player {player}: {groups.length}<br />
                    </>
                ))}
            </>
        )}
        {game.phase === endPhase && (
            <>
            <br />
            <b>Winner: Player {getWinner(game)}</b>
            </>
        )}
        </div>
        <div id="debug-controls">
        <button id="resetGame" onClick={resetGame}>Reset</button>
        {game.phase === placePhase && (
            <button id="randomizeBoard" onClick={randomizeBoard}>Randomize</button>
        )}
        {game.phase === scorePhase && (
            <button id="groupSelected" onClick={makeGroup}>Group</button>
        )}
        </div>
        <div id="board">
        {game.board.map((_, zPos) => (
            <Grid key={`grid-${zPos}`} zPos={zPos} game={game} cellClick={game.phase !== endPhase ? cellClick : () => {}} />
        ))}
        </div>
        </>
    )
}

export default App
