import React, { useEffect, useState, Fragment, useMemo } from "react";
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, type Player, GameModel, makeCellId } from '../domain/game';
import { OptimisticStateManager, makeMove, groupSelected, randomizeBoard } from "./utils/state";
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
    onMakeGroup 
}: {
    game: GameModel;
    selectedCount: number;
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
                disabled={selectedCount === 0}
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
}) => {
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
        {[scorePhase, endPhase].includes(game.phase) && (<>
            <br />
            <b>Groups:</b>
            <br />
            {Object.entries(game.scoring.groups).map(([player, groups]) => {
                return (
                    <Fragment key={player}>
                        {getPlayerName(game, parseInt(player) as Player)}: {groups.length}<br />
                    </Fragment>
                );
            })}
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

export const GameView: React.FC = () => {
    const [stateManager] = useState(() => new OptimisticStateManager());
    const [game, setGame] = useState<GameModel | undefined>();
    const [selected, setSelected] = useState<Position[]>([]);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        // Initialize state manager with callback
        const newStateManager = new OptimisticStateManager({
            onStateChange: setGame
        });
        
        // Initialize game from server
        const initializeGame = async () => {
            try {
                let initialGame = await api.fetchGame();
                if (!initialGame) {
                    // No game exists, create a new one
                    initialGame = await api.initGame(3);
                }
                newStateManager.setGame(initialGame);
            } catch (error) {
                console.error("Failed to initialize game:", error);
                // Fallback to local game
                const fallbackGame = GameModel.initGame(3);
                newStateManager.setGame(fallbackGame);
            }
        };
        
        initializeGame();
        
        // Replace the old state manager
        Object.assign(stateManager, newStateManager);
        
    }, [stateManager]);

    // Create cellClick function based on game phase
    const cellClick: CellClick | undefined = useMemo(() => {
        if (!game || game.phase === endPhase || isPending) {
            return undefined;
        }

        return (pos: Position) => () => {
            handleCellClick(pos);
        };
    }, [game?.phase, isPending]);

    const handleCellClick = async (pos: Position) => {
        if (!game) return;

        if (game.phase === placePhase) {
            try {
                setIsPending(true);
                const moveAction = makeMove(pos);
                await stateManager.executeAction(moveAction.action, moveAction.serverCall);
            } catch (error) {
                console.error("Action failed:", error);
            } finally {
                setIsPending(false);
            }
        } else if (game.phase === scorePhase) {
            // Handle selection logic without setting pending state
            const cellValue = game.getCell(pos);
            
            // Only allow selecting cells owned by current player
            if (cellValue !== game.currentTurn) {
                return;
            }

            // Check if cell is already grouped
            if (game.scoring.cellsToPlayerGroup.has(makeCellId(pos))) {
                return;
            }

            const selectedMap = new Map<string, Position>();
            selected.forEach(p => selectedMap.set(makeCellId(p), p));

            const isCurrentlySelected = isSelected(selectedMap, pos);

            if (isCurrentlySelected) {
                // Deselect the cell
                const newSelected = selected.filter(p => 
                    !(p[0] === pos[0] && p[1] === pos[1] && p[2] === pos[2])
                );
                setSelected(newSelected);
            } else {
                // Select the cell - check adjacency if we already have selections
                if (selected.length > 0) {
                    const adjacencies = getAdjacencies(game.info, pos);
                    const isAdjacentToSelection = adjacencies.some(adj => 
                        isSelected(selectedMap, adj)
                    );
                    
                    if (!isAdjacentToSelection) {
                        return; // Not adjacent, can't select
                    }
                }
                
                setSelected([...selected, pos]);
            }
        }
    };

    const handleGroupSelection = async () => {
        if (selected.length === 0) return;
        
        try {
            setIsPending(true);
            const groupAction = groupSelected(selected);
            await stateManager.executeAction(groupAction.action, groupAction.serverCall);
            setSelected([]);
        } catch (error) {
            console.error("Group selection failed:", error);
        } finally {
            setIsPending(false);
        }
    };

    const handleRandomize = async () => {
        try {
            setIsPending(true);
            const randomAction = randomizeBoard();
            await stateManager.executeAction(randomAction.action, randomAction.serverCall);
        } catch (error) {
            console.error("Randomize failed:", error);
        } finally {
            setIsPending(false);
        }
    };

    const handleNewGame = async () => {
        try {
            setIsPending(true);
            const newGame = await api.initGame(3);
            stateManager.setGame(newGame);
            setSelected([]);
        } catch (error) {
            console.error("New game failed:", error);
        } finally {
            setIsPending(false);
        }
    };

    if (!game) {
        return <div>Loading...</div>;
    }

    // Convert selected array to Map for Grid component
    const selectedMap = new Map<string, Position>();
    selected.forEach(pos => {
        selectedMap.set(makeCellId(pos), pos);
    });

    return (
        <>
            <GameControls
                game={game}
                selectedCount={selected.length}
                onNewGame={handleNewGame}
                onRandomizeBoard={handleRandomize}
                onMakeGroup={handleGroupSelection}
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
            <GameInfo
                game={game}
                isPending={isPending}
            />
        </>
    );
};

export default GameView
