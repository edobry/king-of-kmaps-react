import { useState } from 'react';
import './App.css'
import Grid from './Grid.tsx';
import { type Game, placePhase, scorePhase, type Phase, type ScorePhase, type Player, type Board, makeCellId, makeBoard, makeRandomBoard, constructBoard } from './game.ts';

function App() {
  const numVars = 5;
  const { zVars, yVars, xVars, zSize, ySize, xSize, size } = constructBoard(numVars);
  
  const initialGame: Game = {
    phase: placePhase as Phase,
    currentTurn: 1 as Player,
    moveCounter: 0,
    board: makeBoard(zSize, ySize, xSize)
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
    newGame.phase = newGame.moveCounter == size ? scorePhase as ScorePhase : game.phase;
    
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

  const makeMove = (game: Game, zPos: number, yPos: number, xPos: number) => {
      if(game.board[zPos][yPos][xPos] !== undefined) {
        return game;
      }

      const newBoard: Board = structuredClone(game.board);
      newBoard[zPos][yPos][xPos] = game.currentTurn;

      game.currentTurn = game.currentTurn === 1 ? 0 : 1

      return updateGame(game, newBoard);
  }

  const makeSelection = (game: Game, zPos: number, yPos: number, xPos: number) => {
      game.scoring = game.scoring ? structuredClone(game.scoring) : {
        selected: new Set()
      };

      if(game.board[zPos][yPos][xPos] !== game.currentTurn) {
        return game;
      }

      const cellId = makeCellId(zPos, yPos, xPos);

      if(game.scoring.selected.has(cellId)) {
        game.scoring.selected.delete(cellId);
      } else {
        if(game.scoring.selected.size != 0 && !(
          game.scoring.selected.has(makeCellId(zPos + 1, yPos, xPos)) ||
          game.scoring.selected.has(makeCellId(zPos - 1, yPos, xPos)) ||
          game.scoring.selected.has(makeCellId(zPos, yPos + 1, xPos)) ||
          game.scoring.selected.has(makeCellId(zPos, yPos - 1, xPos)) ||
          game.scoring.selected.has(makeCellId(zPos, yPos, xPos + 1)) ||
          game.scoring.selected.has(makeCellId(zPos, yPos, xPos - 1))
        )) {
          return game;
        }

        game.scoring.selected.add(cellId);
      }

      return game;
  }

  const cellClick = (zPos: number, yPos: number, xPos: number) => {
    setGame((game) => {
      const newGame = structuredClone(game);

      return newGame.phase === placePhase
        ? makeMove(newGame, zPos, yPos, xPos)
        : makeSelection(newGame, zPos, yPos, xPos);
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
