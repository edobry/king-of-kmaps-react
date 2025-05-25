import { type Game } from "./game";
import { getCellClasses } from "./grid";

export default function Grid({ gridId, game, cellClick }: { gridId: number, game: Game, cellClick: (gridId: number, x: number, y: number) => void }) {
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
            const classes = ["cell", ...getCellClasses(game, cell, gridId, x, y)];

            return (
              <div key={`grid-${gridId}-${x},${y}`} className={classes.join(" ")} onClick={() => cellClick(gridId, x, y)}>
                {cell}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  )
}
