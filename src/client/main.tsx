import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from "react-router";

import App from './App'
import GameView from './GameView';
import api from './api';    
import NewGame from './NewGame';
import GameStart from './GameStart';
import { GameLobby } from './GameLobby';
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
                        Component: GameLobby,
                        loader: () => ({ pGames: api.getGames() }),
                    },
                    {
                        path: "game/new",
                        Component: NewGame,
                    },
                ],
            },
            {
                path: "game/:gameId",
                Component: GameView,
                loader: async ({ params }) => {
                    const gameId = params.gameId;

                    if (!gameId)
                        return redirect("/");

                    const game = await api.getGame(Number(gameId));

                    if (!game)
                        return redirect("/");

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
