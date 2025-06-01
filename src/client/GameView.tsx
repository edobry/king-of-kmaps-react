import React, { useCallback, useMemo, Fragment } from "react";
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, type Player, GameModel, makeCellId, isValidMove, isValidGroupSelection, positionsEqual } from '../domain/game';
import { getAdjacencies } from '../domain/adjacency';
import { isSelected } from '../domain/grid';
import api from "./api";

const getPlayerName = (game: GameModel, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

const GameControls = ({ 
    game, 
    selectedCount,
    onNewGame, 
    onRandomizeBoard, 
    onMakeGroup,
    isPending = false
}: {
    game: GameModel;
    selectedCount: number;
    onNewGame: () => Promise<void>;
    onRandomizeBoard: () => void;
    onMakeGroup: () => void;
    isPending?: boolean;
}) => (
    <div id="controls">
        <button id="newGame" onClick={onNewGame}>New Game</button>
        {game.phase === placePhase && (
            <button 
                id="randomizeBoard" 
                onClick={onRandomizeBoard}
                disabled={isPending}
            >
                Randomize
            </button>
        )}
        {game.phase === scorePhase && (
            <button 
                id="groupSelected" 
                onClick={onMakeGroup}
                disabled={selectedCount === 0 || isPending}
            >
                Group
            </button>
        )}
    </div>
);

const GameInfo = ({
    game, 
    isPending = false
}: {
    game: GameModel;
    isPending?: boolean;
}) => (
    <div id="info">
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
                {Object.entries(game.scoring.numCellsGrouped).map(([player, num]) => {
                    const ungrouped = (game.info.size / 2) - num;
                    return (
                        <Fragment key={player}>
                            {getPlayerName(game, parseInt(player) as Player)}: {ungrouped} / {game.info.size / 2}<br />
                        </Fragment>
                    );
                })}
            </>
        )}
        
        {[scorePhase, endPhase].includes(game.phase) && (
            <>
                <br />
                <b>Groups:</b><br />
                {Object.entries(game.scoring.groups).map(([player, groups]) => (
                    <Fragment key={player}>
                        {getPlayerName(game, parseInt(player) as Player)}: {groups.length}<br />
                    </Fragment>
                ))}
            </>
        )}
        
        {game.phase === endPhase && <Winner game={game} />}
    </div>
);

const Winner = ({ game }: { game: GameModel }) => {
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
};

// Simple hook for selection state
const useSelection = () => {
    const [selected, setSelected] = React.useState<Position[]>([]);

    const clearSelection = useCallback(() => {
        setSelected([]);
    }, []);

    const toggleSelection = useCallback((pos: Position, game: GameModel) => {
        setSelected(currentSelected => {
            const selectedMap = new Map<string, Position>();
            currentSelected.forEach(p => selectedMap.set(makeCellId(p), p));

            const isCurrentlySelected = isSelected(selectedMap, pos);

            if (isCurrentlySelected) {
                // Deselect the cell
                return currentSelected.filter(p => !positionsEqual(p, pos));
            } else {
                // Select the cell - check adjacency if we already have selections
                if (currentSelected.length > 0) {
                    const adjacencies = getAdjacencies(game.info, pos);
                    const isAdjacentToSelection = adjacencies.some(adj => 
                        isSelected(selectedMap, adj)
                    );
                    
                    if (!isAdjacentToSelection) {
                        return currentSelected; // Not adjacent, can't select
                    }
                }
                
                return [...currentSelected, pos];
            }
        });
    }, []);

    return { selected, clearSelection, toggleSelection };
};

// Hook for optimistic actions with immediate UI updates
const useOptimisticAction = (setNewGame: (game: GameModel) => void) => {
    const [isPending, setIsPending] = React.useState(false);

    const executeAction = useCallback(async (
        action: () => GameModel,
        apiCall: () => Promise<GameModel>,
        validation?: () => boolean
    ) => {
        if (validation && !validation()) {
            return;
        }

        try {
            setIsPending(true);
            
            // Apply optimistic update immediately
            const optimisticResult = action();
            setNewGame(optimisticResult);
            
            // Then make server call and reconcile
            const serverResult = await apiCall();
            setNewGame(serverResult);
        } catch (error) {
            console.error("Action failed:", error);
            alert((error as Error).message || "Action failed");
            
            // On error, we could rollback to previous state here if needed
            // For now, server will maintain authoritative state
        } finally {
            setIsPending(false);
        }
    }, [setNewGame]);

    return { executeAction, isPending };
};

function GameView({ game: initialGame, newGame }: { game: GameModel, newGame: () => Promise<void> }) {
    const [game, setGame] = React.useState(initialGame);
    const { selected, clearSelection, toggleSelection } = useSelection();
    const { executeAction, isPending } = useOptimisticAction(setGame);

    // Update local game state when prop changes
    React.useEffect(() => {
        setGame(initialGame);
    }, [initialGame]);

    const makeSelection = useCallback((pos: Position) => {
        // Only allow selection in score phase for owned cells that aren't grouped
        if (game.phase !== scorePhase) return;
        if (game.getCell(pos) !== game.currentTurn) return;
        if (game.scoring.cellsToPlayerGroup.has(makeCellId(pos))) return;

        toggleSelection(pos, game);
    }, [toggleSelection, game]);

    const handleMove = useCallback((pos: Position) => () => {
        executeAction(
            () => game.makeMove(pos),
            () => api.makeMove(pos),
            () => isValidMove(game, pos)
        );
    }, [executeAction, game]);

    const handleRandomizeBoard = useCallback(() => {
        executeAction(
            () => game.randomizeBoard(),
            () => api.randomizeBoard(),
            () => game.phase === placePhase
        );
    }, [executeAction, game]);

    const makeGroup = useCallback(() => {
        if (selected.length === 0) return;
        
        executeAction(
            () => game.groupSelected(selected),
            () => api.groupSelected(selected),
            () => isValidGroupSelection(game, selected)
        );
        
        clearSelection();
    }, [executeAction, selected, game, clearSelection]);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if (game.phase === endPhase || isPending) {
            return undefined;
        }

        return {
            [placePhase]: handleMove,
            [scorePhase]: (pos: Position) => () => makeSelection(pos)
        }[game.phase];
    }, [game.phase, handleMove, makeSelection, isPending]);

    // Convert selected array to Map for Grid component
    const selectedMap = new Map<string, Position>();
    selected.forEach(pos => {
        selectedMap.set(makeCellId(pos), pos);
    });

    return (
        <>
            <GameInfo
                game={game}
                isPending={isPending}
            />
            <GameControls
                game={game}
                selectedCount={selected.length}
                onNewGame={newGame}
                onRandomizeBoard={handleRandomizeBoard}
                onMakeGroup={makeGroup}
                isPending={isPending}
            />
            <div id="board">
                {game.board.map((_, zPos) => (
                    <Grid
                        key={`grid-${zPos}`}
                        zPos={zPos}
                        game={game}
                        selected={selectedMap}
                        cellClick={cellClick}
                        isPending={isPending}
                    />
                ))}
            </div>
        </>
    );
}

export default GameView;
