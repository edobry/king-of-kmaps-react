import { type GameType, localGameType, onlineGameType } from "../domain/game";

export const GameTypeSelect = ({
    gameType,
    setGameType,
}: {
    gameType: GameType;
    setGameType: (gameType: GameType) => void;
}) => {
    return (
        <div id="game-type">
            <label
                htmlFor="game-type-local"
                className={`game-type-select ${
                    gameType === localGameType ? "selected" : ""
                }`}
            >
                <input
                    type="radio"
                    name="game-type"
                    id="game-type-local"
                    value={localGameType}
                    checked={gameType === localGameType}
                    onChange={() => setGameType(localGameType)}
                />
                Local
            </label>
            <label
                htmlFor="game-type-online"
                className={`game-type-select ${
                    gameType === onlineGameType ? "selected" : ""
                }`}
            >
                <input
                    type="radio"
                    name="game-type"
                    id="game-type-online"
                    value={onlineGameType}
                    checked={gameType === onlineGameType}
                    onChange={() => setGameType(onlineGameType)}
                />
                Online
            </label>
        </div>
    );
};
