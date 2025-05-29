import React, { Fragment, useMemo } from 'react';
import Grid, { type CellClick } from './Grid';
import { placePhase, scorePhase, type Position, endPhase, getWinner, groupSelected, type Player, type Game } from '../domain/game';
import { useUpdater } from './utils/state';
import { makeMove, makeSelection, randomizeBoard } from './api';

const getPlayerName = (game: Game, player: Player) =>
    game.players[player]
        ? `${game.players[player]} (${player})`
        : `Player ${player}`;

function GameView({ game: initialGame }: { game: Game }) {
    const { state: game, makeHandler, makeAsyncHandler, reset: resetGame } = useUpdater(initialGame);

    const cellClick = useMemo<CellClick | undefined>(() => {
        if(game.phase === endPhase) {
            return undefined;
        }

        const handler = {
            [placePhase]: makeMove,
            [scorePhase]: makeSelection
        }[game.phase];

        return (pos: Position) => makeAsyncHandler(() => handler(pos));
    }, [game.phase, makeAsyncHandler]);
    
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
        <div id="debug-controls">
            <button id="resetGame" onClick={resetGame}>Reset</button>
            {game.phase === placePhase && (
                <button id="randomizeBoard" onClick={makeAsyncHandler(randomizeBoard)}>Randomize</button>
            )}
            {game.phase === scorePhase && (
                <button id="groupSelected" onClick={makeHandler(groupSelected)}>Group</button>
            )}
        </div>
        <div id="board">
            {game.board.map((_, zPos) => (
                <Grid key={`grid-${zPos}`} zPos={zPos} game={game} cellClick={cellClick} />
            ))}
        </div>
    </>);
}

const Winner = (game: Game) => {
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
