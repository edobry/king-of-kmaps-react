import { useState } from 'react';
import './App.css'

type Unset = undefined;
type Player = 0 | 1;
type CellValue = Player | Unset;
type Board = CellValue[][];
type Game = {
  currentTurn: Player;
  board: Board;
}

function App() {
  const numVars = 5;
  const xVars = Math.ceil(numVars / 2);
  const yVars = numVars - xVars;

  const xSize = Math.pow(2, xVars);
  const ySize = Math.pow(2, yVars);
  
  const size = xSize * ySize;

  const board: Board = Array.from({ length: ySize }, () =>
    Array.from({ length: xSize }, () => undefined)
  );
  
  const [game, setGame] = useState({
    currentTurn: 1 as Player,
    board
  });

  const makeMove = (gridId: number, xPos: number, yPos: number) => {
    const xSize = game.board[0].length / 2;
    const adjustedX = (gridId * xSize) + xPos;

    const newBoard: Board = game.board.map((row, y) =>
      row.map((cell, x) =>
        x === adjustedX && y === yPos ? game.currentTurn : cell
      )
    );

    setGame((game) => ({
      ...game,
      currentTurn: game.currentTurn === 1 ? 0 : 1,
      board: newBoard
    }));
  };

  return (
    <>
      <h1>King of K-Maps</h1>
      <div id="info">
        Variables: {numVars} (x: {xVars}, y: {yVars})<br />
        Grid Size: {size} ({xSize} x bits (2^{xVars}) * {ySize} y bits (2^{yVars}))
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
