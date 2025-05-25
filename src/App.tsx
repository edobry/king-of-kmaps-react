import { useState } from 'react';
import './App.css'

type Unset = undefined;
type Player = 0 | 1;
type CellValue = Player | Unset;
type Board = CellValue[][][];

const placePhase = "Place";
const scorePhase = "Score";

type PlacePhase = typeof placePhase;
type ScorePhase = typeof scorePhase;
type Phase = PlacePhase | ScorePhase;

type ScoringState = {
  selected: Set<string>;
}

type Game = {
  currentTurn: Player;
  board: Board;
  phase: Phase;
  moveCounter: number;
  scoring?: ScoringState;
}

const makeBoard = (numGrids: number, xSize: number, ySize: number, getValue: () => CellValue = () => undefined) => {
  return Array.from({ length: numGrids }, () =>
    Array.from({ length: ySize }, () =>
      Array.from({ length: xSize }, () => getValue())
    )
  );
}

const makeCellId = (gridId: number, xPos: number, yPos: number) => `${gridId},${xPos},${yPos}`;

function App() {
  const numVars = 5;
  // TODO: Make this dynamic
  const numGrids = 2;
  const xVars = Math.ceil(numVars / 2);
  const yVars = numVars - xVars;

  const xSize = Math.pow(2, xVars) / 2;
  const ySize = Math.pow(2, yVars);
  
  const size = xSize * ySize;
  
  const initialGame: Game = {
    phase: placePhase as Phase,
    currentTurn: 1 as Player,
    moveCounter: 0,
    board: makeBoard(numGrids, xSize, ySize)
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


  const randomizeBoard = () => {
    setGame((game) => {
      return updateGame({
        ...game,
        moveCounter: 31
      }, makeBoard(numGrids, xSize, ySize, () => Math.random() < 0.5 ? 0 : 1));
    });
  }

  const makeMove = (game: Game, gridId: number, xPos: number, yPos: number) => {
      if(game.board[gridId][yPos][xPos] !== undefined) {
        return game;
      }

      const newBoard: Board = structuredClone(game.board);
      newBoard[gridId][yPos][xPos] = game.currentTurn;

      game.currentTurn = game.currentTurn === 1 ? 0 : 1

      return updateGame(game, newBoard);
  }

  const makeSelection = (game: Game, gridId: number, xPos: number, yPos: number) => {
      game.scoring = game.scoring ? structuredClone(game.scoring) : {
        selected: new Set()
      };

      if(game.board[gridId][yPos][xPos] !== game.currentTurn) {
        return game;
      }

      if(game.scoring.selected.has(makeCellId(gridId, xPos, yPos))) {
        game.scoring.selected.delete(makeCellId(gridId, xPos, yPos));
      } else {
        game.scoring.selected.add(makeCellId(gridId, xPos, yPos));
      }

      return game;
  }

  const cellClick = (gridId: number, xPos: number, yPos: number) => {
    setGame((game) => {
      const newGame = structuredClone(game);

      return newGame.phase === placePhase
        ? makeMove(newGame, gridId, xPos, yPos)
        : makeSelection(newGame, gridId, xPos, yPos);
    });
  };

  return (
    <>
      <h1>King of K-Maps</h1>
      <div id="info">
        Variables: {numVars} (x: {xVars}, y: {yVars})<br />
        Grid Size: {size} ({xSize} x states (2^{xVars}) * {ySize} y states (2^{yVars}))<br />
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
        {game.board.map((_, gridId) => (
          <Grid key={`grid-${gridId}`} gridId={gridId} game={game} cellClick={cellClick} />
        ))}
      </div>
    </>
  )
}

function Grid({ gridId, game, cellClick }: { gridId: number, game: Game, cellClick: (gridId: number, x: number, y: number) => void }) {
  return (
    <div id={`grid-${gridId}`} className="grid">
      <div className="corner-cell"></div>
      {game.board[gridId][0].map((_, x) => (
        <div className="header-cell col-header" key={`grid-${gridId}-col-${x}`}>
          {x}
        </div>
      ))}
      
      {game.board[gridId].map((row, y) => (
        <div className="row" key={`grid-${gridId}-row-${y}`}>
          <div className="header-cell row-header">{y}</div>
          
          {row.map((cell, x) => {
            const isSelected = game.scoring?.selected.has(makeCellId(gridId, x, y));
            const className = `cell ${isSelected ? "selected" : ""} ${game.phase === scorePhase && cell === game.currentTurn ? "owned" : ""}`;

            return (
              <div key={`grid-${gridId}-${x},${y}`} className={className} onClick={() => cellClick(gridId, x, y)}>
                {cell}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  )
}

export default App
