import { Fragment, useCallback, useMemo } from 'react';
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, type Player, GameModel, makeCellId, isValidMove, isValidGroupSelection } from '../domain/game';
import { useUpdater, useOptimisticAction, useSelection } from './utils/state';
import api from './api';
import { getAdjacencies } from '../domain/adjacency';
import { isSelected } from '../domain/grid';

type GameAction = 
    | { type: 'move', pos: Position }
    | { type: 'group', selected: Position[] };

// Type-safe action creators
const createMoveAction = (pos: Position): GameAction => ({ type: 'move', pos });
const createGroupAction = (selected: Position[]): GameAction => ({ type: 'group', selected });

// Validation helpers
const isAlreadyGrouped = (game: GameModel, selected: Position[]): boolean => {
    return selected.every(pos => game.scoring.cellsToPlayerGroup.has(makeCellId(pos)));
};

const isValidGroupAction = (game: GameModel, selected: Position[]): boolean => {
    if (selected.length === 0) return false;
    if (selected.some(pos => game.getCell(pos) !== game.currentTurn)) return false;
    return true;
};

const gameActionReducer = (currentGame: GameModel, action: GameAction): GameModel => {
    try {
        switch (action.type) {
            case 'move': {
                return currentGame.clone().makeMove(action.pos);
            }
            case 'group': {
                // Check if all selected cells are already grouped (action already applied)
                if (isAlreadyGrouped(currentGame, action.selected)) {
                    return currentGame;
                }
                
                // Validate the group action
                if (!isValidGroupAction(currentGame, action.selected)) {
                    return currentGame;
                }
                
                // Clone then mutate - clean and obvious!
                return currentGame.clone().groupSelected(action.selected);
            }
            default:
                return currentGame;
        }
    } catch {
        return currentGame;
    }
};

const getPlayerName = (game: GameModel, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

const GameControls = ({ 
    game, 
    selected, 
    onNewGame, 
    onRandomizeBoard, 
    onMakeGroup 
}: {
    game: GameModel;
    selected: Map<string, Position>;
    onNewGame: () => Promise<void>;
    onRandomizeBoard: () => void;
    onMakeGroup: () => void;
}) => (
    <div id="controls">
        <button id="newGame" onClick={onNewGame}>New Game</button>
        {game.phase === placePhase && (
            <button id="randomizeBoard" onClick={onRandomizeBoard}>Randomize</button>
        )}
        {game.phase === scorePhase && (
            <button 
                id="groupSelected" 
                onClick={onMakeGroup}
                disabled={selected.size === 0}
            >
                Group
            </button>
        )}
    </div>
);

const GameInfo = ({
    optimisticGame, 
    isPending
}: {
    optimisticGame: GameModel;
    isPending: boolean;
}) => {
    return (<div id="info">
        <b>Variables:</b> {optimisticGame.info.numVars} ({Object.entries(optimisticGame.info.vars).reverse().map(([key, value]) =>
            `${key} = ${value.join(", ")}`).join(" | ")})<br />
        <b>Grid Size:</b> {optimisticGame.info.size} ({optimisticGame.info.dimensions.map(d => `2^${d}`).join(" x ")})<br />
        <br />
        {optimisticGame.phase !== endPhase && (
            <>
                <b>Current Phase:</b> {optimisticGame.phase}<br />
                <b>Current Turn:</b> {isPending ? "Waiting..." : getPlayerName(optimisticGame, optimisticGame.currentTurn)}<br />
            </>
        )}
        {optimisticGame.phase === placePhase && (
            <>
                <br />
                Move Counter: {optimisticGame.moveCounter}
            </>
        )}
        {optimisticGame.phase === scorePhase && (
            <>
                <br />
                <b>Ungrouped</b>:<br />
                {Object.entries(optimisticGame.scoring.numCellsGrouped).map(([player, num]) => {
                    const ungrouped = (optimisticGame.info.size / 2) - num;
                    return (
                        <Fragment key={player}>
                            {getPlayerName(optimisticGame, parseInt(player) as Player)}: {ungrouped} / {optimisticGame.info.size / 2}<br />
                        </Fragment>
                    );
                })}
            </>
        )}
        {[scorePhase, endPhase].includes(optimisticGame.phase) && (<>
            <br />
            <b>Groups:</b>
            <br />
            {Object.entries(optimisticGame.scoring.groups).map(([player, groups]) => {
                return (
                    <Fragment key={player}>
                        {getPlayerName(optimisticGame, parseInt(player) as Player)}: {groups.length}<br />
                    </Fragment>
                );
            })}
        </>)}
        {optimisticGame.phase === endPhase && Winner(optimisticGame)}
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

function GameView({ game: initialGame, newGame }: { game: GameModel, newGame: () => Promise<void> }) {
    const { state: game, setNewState: setNewGame } = useUpdater(initialGame);
    const { selected, clearSelection, toggleSelection } = useSelection();
    
    const {
        optimisticState: optimisticGame,
        executeAction,
        isPending,
        showLoading,
        loadingOpacity
    } = useOptimisticAction(game, gameActionReducer);

    const makeSelection = useCallback((pos: Position) => {
        return toggleSelection(pos, optimisticGame, isSelected, makeCellId, getAdjacencies);
    }, [toggleSelection, optimisticGame]);

    const handleMove = useCallback((pos: Position) => () => {
        executeAction(
            createMoveAction(pos),
            () => api.makeMove(pos),
            setNewGame,
            () => isValidMove(optimisticGame, pos)
        );
    }, [executeAction, optimisticGame, setNewGame]);

    const handleRandomizeBoard = useCallback(async () => {
        try {
            const newGame = await api.randomizeBoard();
            setNewGame(newGame);
        } catch (error) {
            alert((error as Error).message ?? "Unknown error");
        }
    }, [setNewGame]);

    const makeGroup = useCallback(() => {
        // Prevent concurrent group operations
        if (isPending) {
            return;
        }
        
        const selectedPositions = Array.from(selected.values());
        
        executeAction(
            createGroupAction(selectedPositions),
            () => api.groupSelected(selectedPositions),
            setNewGame,
            () => isValidGroupSelection(optimisticGame, selectedPositions),
            () => clearSelection() // Clear selection on validation failure
        );
        
        clearSelection(); // Always clear selection after grouping
    }, [executeAction, selected, optimisticGame, setNewGame, clearSelection, isPending]);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if(optimisticGame.phase === endPhase || isPending) {
            return undefined;
        }

        return {
            [placePhase]: handleMove,
            [scorePhase]: (pos: Position) => makeSelection(pos)
        }[optimisticGame.phase];
    }, [optimisticGame.phase, handleMove, makeSelection, isPending]);
    
    return (<>
        <GameInfo 
            optimisticGame={optimisticGame}
            isPending={showLoading}
        />
        <GameControls 
            game={optimisticGame}
            selected={selected}
            onNewGame={newGame}
            onRandomizeBoard={handleRandomizeBoard}
            onMakeGroup={makeGroup}
        />
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

export default GameView
