import { makeCellId, type Game, type Position } from "../domain/game";
import { getCellClasses } from "../domain/grid";

export type CellClick = (pos: Position) => () => void;

export default function Grid({ zPos, game, selected, cellClick }: { zPos: number, game: Game, selected: Map<string, Position>, cellClick?: CellClick }) {
  return (
    <div id={`grid-${zPos}`} className="grid">
      <div className="corner-cell"></div>
      {game.board[zPos][0].map((_, xPos) => (
        <div className="header-cell col-header" key={`grid-${zPos}-col-${xPos}`}>
          {xPos}
        </div>
      ))}
      
      {game.board[zPos].map((row, yPos) => (
        <div className="row" key={`grid-${zPos}-row-${yPos}`}>
          <div className="header-cell row-header">{yPos}</div>
          
          {row.map((cell, xPos) => {
            const pos = [zPos, yPos, xPos] as Position;
            const classes = ["cell", ...getCellClasses(game, selected, pos)];

            return (
              <div key={`grid-${makeCellId(pos)}`} className={classes.join(" ")} onClick={cellClick ? cellClick(pos) : undefined}>
                {cell}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  )
}
