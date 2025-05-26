import { type Game, type Position } from "./game";
import { getCellClasses } from "./grid.ts";

export default function Grid({ zPos, game, cellClick }: { zPos: number, game: Game, cellClick: (...pos: Position) => void }) {
  return (
    <div id={`grid-${zPos}`} className="grid">
      <div className="corner-cell"></div>
      {game.board[zPos][0].map((_, x) => (
        <div className="header-cell col-header" key={`grid-${zPos}-col-${x}`}>
          {x}
        </div>
      ))}
      
      {game.board[zPos].map((row, y) => (
        <div className="row" key={`grid-${zPos}-row-${y}`}>
          <div className="header-cell row-header">{y}</div>
          
          {row.map((cell, x) => {
            const classes = ["cell", ...getCellClasses(game, cell, zPos, y, x)];

            return (
              <div key={`grid-${zPos}-${y},${x}`} className={classes.join(" ")} onClick={() => cellClick(zPos, y, x)}>
                {cell}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  )
}
