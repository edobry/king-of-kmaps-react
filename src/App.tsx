import { Fragment, useMemo } from 'react';
import './App.css'
import Grid, { type CellClick } from './Grid.tsx';
import { type Game, placePhase, scorePhase, constructBoard, type Position, endPhase, getWinner, groupSelected, makeMove, makeSelection, makeInitialGame, randomizeBoard } from './game.ts';
import { useUpdater } from './utils/state.ts';

function App() {
    const numVars = 5;
    const { vars, dimensions, size } = constructBoard(numVars);
    
    const initialGame: Game = makeInitialGame(dimensions, size);
    
    const { state: game, onClick, reset: resetGame } = useUpdater(initialGame);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if(game.phase === endPhase) {
            return undefined;
        }

        const handler = {
            [placePhase]: makeMove,
            [scorePhase]: makeSelection
        }[game.phase];

        return (pos: Position) => onClick(handler(pos));
    }, [game.phase, onClick]);
    
    return (<>
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
                    <Fragment key={player}>
                        Player {player}: {(game.size / 2) - num} / {game.size / 2}<br />
                    </Fragment>
                ))}
            </>
        )}
        {[scorePhase, endPhase].includes(game.phase) && (
            <>
                <br />
                <b>Groups:</b>
                <br />
                {Object.entries(game.scoring.groups).map(([player, groups]) => (
                    <Fragment key={player}>
                        Player {player}: {groups.length}<br />
                    </Fragment>
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
            <button id="randomizeBoard" onClick={onClick(randomizeBoard)}>Randomize</button>
        )}
        {game.phase === scorePhase && (
            <button id="groupSelected" onClick={onClick(groupSelected)}>Group</button>
        )}
        </div>
        <div id="board">
        {game.board.map((_, zPos) => (
            <Grid key={`grid-${zPos}`} zPos={zPos} game={game} cellClick={cellClick} />
        ))}
        </div>
    </>);
}

export default App
