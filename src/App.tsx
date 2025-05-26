import { useState } from 'react';
import './App.css'
import Grid from './Grid.tsx';
import { type Game, placePhase, scorePhase, type Phase, type ScorePhase, type Player, type Board, makeCellId, makeBoard, makeRandomBoard, constructBoard, isSelected, type Position, getAdjacencies } from './game.ts';
import { nextCell } from './grid.ts';

function App() {
  const numVars = 5;
  const { zVars, yVars, xVars, zSize, ySize, xSize, size } = constructBoard(numVars);
  
  const initialGame: Game = {
    dimensions: [zSize, ySize, xSize],
    phase: placePhase as Phase,
    currentTurn: 1 as Player,
    moveCounter: 0,
    board: makeBoard(zSize, ySize, xSize),
    scoring: {
        selected: new Set()
    }
  };

  const [game, setGame] = useState(initialGame);

  const resetGame = () => {
    setGame(initialGame);
  }

  const updateGame = (game: Game, board: Board) => {
    const newGame: Game = {
      ...game,
      board,
    };
    
    newGame.moveCounter = game.moveCounter + 1;
    if(newGame.moveCounter === size) {
      newGame.phase = scorePhase as ScorePhase;
    }
    
    return newGame;
  }


  const randomizeBoard = () => {
    setGame((game) => {
      return updateGame({
        ...game,
        moveCounter: 31
      }, makeRandomBoard(zSize, ySize, xSize));
    });
  }

  const makeMove = (game: Game, ...pos: Position) => {
      if(game.board[pos[0]][pos[1]][pos[2]] !== undefined) {
        return game;
      }

      const newBoard: Board = structuredClone(game.board);
      newBoard[pos[0]][pos[1]][pos[2]] = game.currentTurn;

      game.currentTurn = game.currentTurn === 1 ? 0 : 1

      return updateGame(game, newBoard);
  }

  const makeSelection = (game: Game, ...pos: Position) => {
      if(game.board[pos[0]][pos[1]][pos[2]] !== game.currentTurn) {
        return game;
      }

      game.scoring = structuredClone(game.scoring);

      if(isSelected(game, ...pos)) {
        game.scoring.selected.delete(makeCellId(...pos));
      } else {
        if(game.scoring.selected.size !== 0) {
          const adjacencies = getAdjacencies(game, pos);

          if(!adjacencies.some(adjacency => isSelected(game, ...adjacency))) {
            return game;
          }
        }

        game.scoring.selected.add(makeCellId(...pos));
      }

      return game;
  }

  const cellClick = (...pos: Position) => {
    setGame((game) => {
      const newGame = structuredClone(game);

      return newGame.phase === placePhase
        ? makeMove(newGame, ...pos)
        : makeSelection(newGame, ...pos);
    });
  };

  return (
    <>
      <h1>King of K-Maps</h1>
      <div id="info">
        Variables: {numVars} (x = {xVars.join(", ")} | y = {yVars.join(", ")} | z = {zVars.join(", ")})<br />
        Grid Size: {size} ({xSize} x states (2^{xVars.length}) * {ySize} y states (2^{yVars.length}) * {zSize} z states (2^{zVars.length}))<br />
        <br />
        Current Phase: {game.phase}<br />
        Current Turn: Player {game.currentTurn}<br />
        {game.phase === placePhase ? `Move Counter: ${game.moveCounter}` : ""}
      </div>
      <div id="debug-controls">
        <button id="resetGame" onClick={resetGame}>Reset</button>
        {game.phase === placePhase && (
          <button id="randomizeBoard" onClick={randomizeBoard}>Randomize</button>
        )}
      </div>
      <div id="board">
        {game.board.map((_, zPos) => (
          <Grid key={`grid-${zPos}`} zPos={zPos} game={game} cellClick={cellClick} />
        ))}
      </div>
    </>
  )
}

export default App
