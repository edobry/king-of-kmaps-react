import { useState } from 'react';
import './App.css'
import GameView from './GameView.tsx';

type AppState = {
    gameStarted: boolean;
    players: string[];
    numVars: number;
}

function App() {
    const [app, setApp] = useState<AppState>({
        gameStarted: false,
        players: ["Player 1", "Player 2"],
        numVars: 5,
    });

    const setNumVars = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numVars = parseInt(e.target.value);
        const newApp = structuredClone(app);
        newApp.numVars = numVars;
        setApp(newApp);
    };

    const setPlayer = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const newApp = structuredClone(app);
        newApp.players[index] = e.target.value;
        setApp(newApp);
    };
    
    return (<>
        <h1>King of K-Maps</h1>
        <div id="main">
            {!app.gameStarted ? (
                <div id="game-start">
                    <b>Number of Variables:</b> <input type="number" min={1} max={6} value={app.numVars} onChange={setNumVars} />
                    
                    <div id="player-select">
                        <b>Players:</b>
                        {app.players.map((_, index ) => (
                            <input type="text" key={index} onChange={setPlayer(index)} placeholder={`Player ${index + 1}`} />
                        ))}
                    </div>
                    <button onClick={() => setApp({ ...app, gameStarted: true })}>Start Game</button>
                </div>
            ) : (
                <GameView numVars={app.numVars} players={app.players} />
            )}
        </div>
    </>);
}

export default App
