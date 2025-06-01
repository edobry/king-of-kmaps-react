import { GameModel, makeCellId, type Position } from "../domain/game";
import { getCellClasses } from "../domain/grid";

export type CellClick = (pos: Position) => () => void;

export default function Grid({ zPos, game, selected, cellClick, isPending, fadeState }: { 
  zPos: number, 
  game: GameModel, 
  selected: Map<string, Position>, 
  cellClick?: CellClick, 
  isPending: boolean,
  fadeState?: 'hidden' | 'fade-in' | 'fade-out'
}) {
  // Calculate dynamic grid dimensions
  const numCols = game.board[zPos][0].length;
  const numRows = game.board[zPos].length;

  return (
    <div className="grid-container">
      <div 
        id={`grid-${zPos}`} 
        className="grid"
        style={{
          '--grid-cols': numCols,
          '--grid-rows': numRows
        } as React.CSSProperties}
      >
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
              const classes = ["cell", ...getCellClasses(game, selected, pos, isPending)];

              return (
                <div key={`grid-${makeCellId(pos)}`} className={classes.join(" ")} onClick={cellClick ? cellClick(pos) : undefined}>
                  {cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Loading overlay with fade effect */}
      <div className={`loading-overlay ${fadeState || ''}`}>
        Loading...
      </div>
    </div>
  )
}
