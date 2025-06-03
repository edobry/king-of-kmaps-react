import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router";

import App from './App'
import GameView from './GameView';
import api from './api';    
import NewGame from './NewGame';
import GameStart from './GameStart';
import { GameList } from './GameList';
import './index.css'

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            {
                path: "/",
                Component: GameStart,
                children: [
                    {
                        path: "",
                        Component: GameList,
                    },
                    {
                        path: "game/new",
                        Component: NewGame,
                    },
                ],
            },
            {
                path: "game/new",
                Component: NewGame,
            },
            {
                path: "game/:gameId",
                Component: GameView,
                loader: async ({ params }) => {
                    const gameId = params.gameId;
                    if (!gameId) throw new Error("Game ID is required");
                    const game = await api.getGame(Number(gameId));
                    return { game };
                },
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
