import { Fragment, useCallback, useMemo, useOptimistic, useTransition } from 'react';
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, type Player, GameModel, makeCellId } from '../domain/game';
import { useUpdater, useFadeLoading } from './utils/state';
import api from './api';
import { getAdjacencies } from '../domain/adjacency';
import { isSelected } from '../domain/grid';

const getPlayerName = (game: GameModel, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

function GameView({ game: initialGame, newGame }: { game: GameModel, newGame: () => Promise<void> }) {
    const { state: selected, setNewState: setNewSelected, makeHandler: makeSelectedHandler } = useUpdater<Map<string, Position>>(new Map());
    const { state: game, setNewState: setNewGame } = useUpdater(initialGame);

    const [isPending, startTransition] = useTransition();
    const { isVisible: showLoading, opacity: loadingOpacity } = useFadeLoading(isPending);
    
    const [optimisticGame, setOptimisticGame] = useOptimistic(
        game, 
        (currentGame: GameModel, action: { type: 'move' | 'group', pos?: Position, selected?: Position[] }) => {
            const newGame = new GameModel(currentGame.toRecord());
            
            switch (action.type) {
                case 'move':
                    return newGame.makeMove(action.pos!);
                case 'group':
                    return newGame.groupSelected(action.selected!);
                default:
                    return currentGame;
            }
        }
    );

    const clearSelection = useCallback(() => {
        setNewSelected(new Map());
    }, [setNewSelected]);

    const makeSelection = useCallback((pos: Position) => makeSelectedHandler((prev: Map<string, Position>) => {
        if (optimisticGame.getCell(pos) !== optimisticGame.currentTurn) {
            return prev;
        }

        if (isSelected(selected, pos)) {
            prev.delete(makeCellId(pos));
            return prev;
        }
        
        if (selected.size !== 0 && !getAdjacencies(optimisticGame.info, pos).some(adj => isSelected(selected, adj)))
            return prev;

        prev.set(makeCellId(pos), pos);

        return prev;
    }), [optimisticGame, selected, makeSelectedHandler]);

    const handleMove = useCallback((pos: Position) => async () => {
        startTransition(async () => {
            setOptimisticGame({ type: 'move', pos });
        
            const newGame = await api.makeMove(pos);
            setNewGame(newGame);
        });
    }, [setOptimisticGame, setNewGame]);

    const handleRandomizeBoard = useCallback(async () => {
        try {
            const newGame = await api.randomizeBoard();
            setNewGame(newGame);
        } catch (error) {
            alert((error as Error).message ?? "Unknown error");
        }
    }, [setNewGame]);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if(optimisticGame.phase === endPhase || isPending) {
            return undefined;
        }

        return {
            [placePhase]: handleMove,
            [scorePhase]: (pos: Position) => makeSelection(pos)
        }[optimisticGame.phase];
    }, [optimisticGame.phase, handleMove, makeSelection, isPending]);

    const makeGroup = useCallback((async () => {
        try {
            startTransition(async () => {
                setOptimisticGame({ type: 'group', selected: Array.from(selected.values()) });

                const newGame = await api.groupSelected(Array.from(selected.values()));
                setNewGame(newGame);
            });
        } catch (error) {
            alert((error as Error).message ?? "Unknown error");
        } finally {
            clearSelection();
        }
    }), [selected, setNewGame, clearSelection, setOptimisticGame]);
    
    return (<>
        <GameInfo game={optimisticGame} isPending={showLoading} />
        <div id="controls">
            <button id="newGame" onClick={newGame}>New Game</button>
            {optimisticGame.phase === placePhase && (
                <button id="randomizeBoard" onClick={handleRandomizeBoard}>Randomize</button>
            )}
            {optimisticGame.phase === scorePhase && selected.size > 0 && (
                <button id="groupSelected" onClick={makeGroup}>Group</button>
            )}
        </div>
        <div id="board">
            {optimisticGame.board.map((_, zPos) => (
                <Grid 
                    key={`grid-${zPos}`} 
                    zPos={zPos} 
                    game={optimisticGame} 
                    selected={selected} 
                    cellClick={cellClick} 
                    isPending={showLoading}
                    loadingOpacity={loadingOpacity}
                />
            ))}
        </div>
    </>);
}

const GameInfo = ({game, isPending}: {game: GameModel, isPending: boolean}) => {
    return (<div id="info">
        <b>Variables:</b> {game.info.numVars} ({Object.entries(game.info.vars).reverse().map(([key, value]) =>
            `${key} = ${value.join(", ")}`).join(" | ")})<br />
        <b>Grid Size:</b> {game.info.size} ({game.info.dimensions.map(d => `2^${d}`).join(" x ")})<br />
        <br />
        {game.phase !== endPhase && (
            <>
                <b>Current Phase:</b> {game.phase}<br />
                <b>Current Turn:</b> {isPending ? "Waiting..." : getPlayerName(game, game.currentTurn)}<br />
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
    </div>);
}



const Winner = (game: GameModel) => {
    const winner = game.getWinner();
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
