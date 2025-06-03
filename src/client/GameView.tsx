import React, { useCallback, useMemo, Fragment } from "react";
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, type Player, GameModel, makeCellId, isValidMove, positionsEqual, localGameType } from '../domain/game';
import { getAdjacencies } from '../domain/adjacency';
import { isSelected } from '../domain/grid';
import { useOptimisticAction } from '../util/useOptimisticAction';
import { useFadeLoading } from '../util/useFadeLoading';
import api from "./api";
import { Link, useLoaderData } from "react-router";

const getPlayerName = (game: GameModel, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

const GameControls = ({
    game,
    selectedCount,
    onRandomizeBoard,
    onMakeGroup,
    isPending = false,
}: {
    game: GameModel;
    selectedCount: number;
    onRandomizeBoard: () => void;
    onMakeGroup: () => void;
    isPending?: boolean;
}) => (
    <div id="controls">
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

function GameView() {
    const { game: initialGame } = useLoaderData<{ game: GameModel }>();

    const [game, setGame] = React.useState(initialGame);

    const gameStarted = game.gameType === localGameType && game.players.length === 2;

    const { selected, clearSelection, toggleSelection } = useSelection();
    const { executeAction, isPending } = useOptimisticAction(setGame, () => game);
    const { isVisible, fadeState } = useFadeLoading(isPending);

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
    }, [game, toggleSelection]);

    const handleMove = useCallback((pos: Position) => () => {
        executeAction(
            () => game.makeMove(pos),
            () => {
                if (!game.id) throw new Error("Game ID not available");
                return api.makeMove(game.id, pos);
            },
            () => isValidMove(game, pos)
        );
    }, [game, executeAction]);

    const handleRandomizeBoard = useCallback(() => {
        executeAction(
            () => game.randomizeBoard(),
            () => {
                if (!game.id) throw new Error("Game ID not available");
                return api.randomizeBoard(game.id);
            },
            () => game.phase === placePhase
        );
    }, [game, executeAction]);

    const makeGroup = useCallback(() => {
        if (selected.length === 0) return;
        
        executeAction(
            () => game.groupSelected(selected),
            () => {
                if (!game.id) throw new Error("Game ID not available");
                return api.groupSelected(game.id, selected);
            }
        );
        
        clearSelection();
    }, [game, executeAction, clearSelection, selected]);

    // Convert selected array to Map for Grid component
    const selectedMap = useMemo(() => {
        const map = new Map<string, Position>();
        selected.forEach(pos => {
            map.set(makeCellId(pos), pos);
        });
        return map;
    }, [selected]);

    // Determine cell click handler based on game phase
    const cellClick = useMemo<CellClick | undefined>(() => {
        if (game.phase === endPhase || isPending) return undefined;
        
        if (game.phase === placePhase) return handleMove;
        if (game.phase === scorePhase) return (pos: Position) => () => makeSelection(pos);
        
        return undefined;
    }, [game.phase, isPending, handleMove, makeSelection]);

    return (
        <>
            <div id="home-link">
                <Link className="nav-link" to="/">
                    {"<"} Home
                </Link>
            </div>

            {!gameStarted && (
                <>
                    <div id="waiting">Waiting for other player to join...</div>
                </>
            )}
            {gameStarted && (
                <>
                    <GameInfo game={game} isPending={isPending} />
                    <GameControls
                        game={game}
                        selectedCount={selected.length}
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
                                isPending={isVisible}
                                fadeState={fadeState}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

export default GameView;
