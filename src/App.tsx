import './App.css'

function App() {
  const numVars = 5;
  const xVars = Math.ceil(numVars / 2);
  const yVars = numVars - xVars;

  const xSize = Math.pow(2, xVars);
  const ySize = Math.pow(2, yVars);
  
  const size = xSize * ySize;
  
  return (
    <>
      <h1>King of K-Maps</h1>
      <div id="info">
        Variables: {numVars} (x: {xVars}, y: {yVars})<br />
        Grid Size: {size} ({xSize} x bits (2^{xVars}) * {ySize} y bits (2^{yVars}))
      </div>
      <div id="board">
        <Grid xSize={xSize/2} ySize={ySize} />
        <Grid xSize={xSize/2} ySize={ySize} />
      </div>
    </>
  )
}

function Grid({ xSize, ySize }: { xSize: number, ySize: number }) {
  return (
    <div className="grid" style={{ 
      gridTemplateColumns: `auto repeat(${xSize}, 1fr)`,
      gridTemplateRows: `auto repeat(${ySize}, 1fr)`
    }}>
      {/* Empty corner cell */}
      <div className="corner-cell"></div>
      
      {/* Column headers */}
      {Array.from({ length: xSize }, (_, x) => (
        <div className="header-cell col-header" key={`col-${x}`}>
          {x}
        </div>
      ))}
      
      {/* Rows with row headers and cells */}
      {Array.from({ length: ySize }, (_, y) => (
        <>
          {/* Row header */}
          <div className="header-cell row-header" key={`row-${y}`}>
            {y}
          </div>
          
          {/* Row cells */}
          {Array.from({ length: xSize }, (_, x) => (
            <div key={`${x},${y}`} className="cell"></div>
          ))}
        </>
      ))}
    </div>
  )
}

export default App
