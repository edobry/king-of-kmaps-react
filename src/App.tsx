import { useState } from 'react';
import './App.css'

type Unset = undefined;
type Player = 0 | 1;
type CellValue = Player | Unset;
type Board = CellValue[][];

const placePhase = "Place";
const scorePhase = "Score";

type PlacePhase = typeof placePhase;
type ScorePhase = typeof scorePhase;
type Phase = PlacePhase | ScorePhase;

type Game = {
  currentTurn: Player;
  board: Board;
  phase: Phase;
  moveCounter: number;
}

const makeBoard = (xSize: number, ySize: number, getValue: () => CellValue = () => undefined) => {
  return Array.from({ length: ySize }, () =>
    Array.from({ length: xSize }, () => getValue())
  );
}

function App() {
  const numVars = 5;
  const xVars = Math.ceil(numVars / 2);
  const yVars = numVars - xVars;

  const xSize = Math.pow(2, xVars);
  const ySize = Math.pow(2, yVars);
  
  const size = xSize * ySize;
  
  const initialGame = {
    phase: placePhase as Phase,
    currentTurn: 1 as Player,
    moveCounter: 0,
    board: makeBoard(xSize, ySize)
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
    newGame.phase = newGame.moveCounter == 32 ? scorePhase as ScorePhase : game.phase;
    
    return newGame;
  }

  const makeMove = (gridId: number, xPos: number, yPos: number) => {
    setGame((game) => {
      const xSize = game.board[0].length / 2;
      const adjustedX = (gridId * xSize) + xPos;

      if(game.board[yPos][adjustedX] !== undefined) {
        return game;
      }

      const newBoard: Board = structuredClone(game.board);
      newBoard[yPos][adjustedX] = game.currentTurn;

      return updateGame({
        ...game,
        currentTurn: game.currentTurn === 1 ? 0 : 1,
      }, newBoard);
    });
  };

  const randomizeBoard = () => {
    setGame((game) => {
      return updateGame({
        ...game,
        moveCounter: 31
      }, makeBoard(xSize, ySize, () => Math.random() < 0.5 ? 0 : 1));
    });
  }

  return (
    <>
      <h1>King of K-Maps</h1>
      <div id="info">
        Variables: {numVars} (x: {xVars}, y: {yVars})<br />
        Grid Size: {size} ({xSize} x states (2^{xVars}) * {ySize} y states (2^{yVars}))<br />
        <br />
        Current Phase: {game.phase}<br />
        Current Turn: Player {game.currentTurn}<br />
        Move Counter: {game.moveCounter}
      </div>
      <div id="debug-controls">
        <button id="resetGame" onClick={resetGame}>Reset</button>
        <button id="randomizeBoard" onClick={randomizeBoard}>Randomize</button>
      </div>
      <div id="board">
        <Grid gridId={0} game={game} cellClick={makeMove} />
        <Grid gridId={1} game={game} cellClick={makeMove} />
      </div>
    </>
  )
}

const makeBoardSlice = (game: Game, gridId: number) => {
  const xSize = game.board[0].length / 2;
  return game.board.map((row) => row.slice(gridId * xSize, (gridId + 1) * xSize));
}

function Grid({ gridId, game, cellClick }: { gridId: number, game: Game, cellClick: (gridId: number, x: number, y: number) => void }) {
  const gridBoard = makeBoardSlice(game, gridId);
  return (
    <div id={`grid-${gridId}`} className="grid">
      <div className="corner-cell"></div>
      {gridBoard[0].map((_, x) => (
        <div className="header-cell col-header" key={`grid-${gridId}-col-${x}`}>
          {x}
        </div>
      ))}
      
      {gridBoard.map((row, y) => (
        <div className="row" key={`grid-${gridId}-row-${y}`}>
          <div className="header-cell row-header">{y}</div>
          
          {row.map((cell, x) => (
            <div key={`grid-${gridId}-${x},${y}`} className="cell" onClick={() => cellClick(gridId, x, y)}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default App
