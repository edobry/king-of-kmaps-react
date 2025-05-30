import { Fragment, useCallback, useMemo } from 'react';
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, getWinner, type Player, type GameState, makeCellId } from '../domain/game';
import { getCell } from '../domain/game';
import { useUpdater } from './utils/state';
import api from './api';
import { getAdjacencies } from '../domain/adjacency';
import { isSelected } from '../domain/grid';

const getPlayerName = (game: GameState, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

function GameView({ game: initialGame, newGame }: { game: GameState, newGame: () => Promise<void> }) {
    const { state: selected, setNewState: setNewSelected, makeHandler: makeSelectedHandler } = useUpdater<Map<string, Position>>(new Map());
    const { state: game, makeAsyncHandler, setNewState: setNewGame } = useUpdater(initialGame);

    const clearSelection = useCallback(() => {
        setNewSelected(new Map());
    }, [setNewSelected]);

    const makeSelection = useCallback((pos: Position) => makeSelectedHandler((prev: Map<string, Position>) => {
        if (getCell(game, pos) !== game.currentTurn) {
            return prev;
        }

        if (isSelected(selected, pos)) {
            prev.delete(makeCellId(pos));
            return prev;
        }
        
        if (selected.size !== 0 && !getAdjacencies(game.info, pos).some(adj => isSelected(selected, adj)))
            return prev;

        prev.set(makeCellId(pos), pos);

        return prev;
    }), [game, selected, makeSelectedHandler]);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if(game.phase === endPhase) {
            return undefined;
        }

        return {
            [placePhase]: (pos: Position) => makeAsyncHandler(() => api.makeMove(pos)),
            [scorePhase]: (pos: Position) => makeSelection(pos)
        }[game.phase];
    }, [game.phase, makeAsyncHandler, makeSelection]);

    const makeGroup = useCallback((async () => {
        try {
            const newGame = await api.groupSelected(Array.from(selected.values()));
            setNewGame(newGame);
        } catch (error) {
            alert((error as Error).message ?? "Unknown error");
        } finally {
            clearSelection();
        }
    }), [selected, setNewGame, clearSelection]);
    
    return (<>
        <div id="info">
            <b>Variables:</b> {game.info.vars.length} ({Object.entries(game.info.vars).reverse().map(([key, value]) =>
                `${key} = ${value.join(", ")}`).join(" | ")})<br />
            <b>Grid Size:</b> {game.info.size} ({game.info.dimensions.map(d => `2^${d}`).join(" x ")})<br />
            <br />
            {game.phase !== endPhase && (
                <>
                    <b>Current Phase:</b> {game.phase}<br />
                    <b>Current Turn:</b> {getPlayerName(game, game.currentTurn)}<br />
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
                            {getPlayerName(game, parseInt(player) as Player)}: {(game.info.size / 2) - num} / {game.info.size / 2}<br />
                        </Fragment>
                    ))}
                </>
            )}
            {[scorePhase, endPhase].includes(game.phase) && (<>
                <br />
                <b>Groups:</b>
                <br />
                {Object.entries(game.scoring.groups).map(([player, groups]) => (
                    <Fragment key={player}>
                        {getPlayerName(game, parseInt(player) as Player)}: {groups.length}<br />
                    </Fragment>
                ))}
            </>)}
            {game.phase === endPhase && Winner(game)}
        </div>
        <div id="controls">
            <button id="newGame" onClick={newGame}>New Game</button>
            {game.phase === placePhase && (
                <button id="randomizeBoard" onClick={makeAsyncHandler(() => api.randomizeBoard())}>Randomize</button>
            )}
            {game.phase === scorePhase && selected.size > 0 && (
                <button id="groupSelected" onClick={makeGroup}>Group</button>
            )}
        </div>
        <div id="board">
            {game.board.map((_, zPos) => (
                <Grid key={`grid-${zPos}`} zPos={zPos} game={game} selected={selected} cellClick={cellClick} />
            ))}
        </div>
    </>);
}

const Winner = (game: GameState) => {
    const winner = getWinner(game);
    return (
        <>
            <br />
            {winner !== undefined
                ? <b>Winner: {getPlayerName(game, winner)}</b>
                : <b>Tie game!</b>
            }
        </>
    );
}

export default GameView
