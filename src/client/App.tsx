import { Outlet } from 'react-router';

import './App.css';

export type AppState = {
    gameStarted: boolean;
    players: string[];
    numVars: number;
}

function App() {
    return (<>
        <h1>King of K-Maps</h1>
        <div id="main">
            <Outlet />
        </div>
    </>);
}

export default App
