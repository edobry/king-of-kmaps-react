export const GAME_NAMESPACE = "game";
export const GAME_JOIN_EVENT = "join";
export const GAME_JOINED_EVENT = "game:joined";
export const GAME_UPDATED_EVENT = "game:updated";

export const makeRoomName = (gameId: number) => `game-${gameId}`;
