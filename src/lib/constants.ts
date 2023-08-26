import type { ActionName } from "./types";

// world generation
export const width = 1000;
export const height = 1000;
export const x_units = 225;
export const y_units = 225;

// scene
export const animations: ActionName[] = [
    "idle",
    "tpose",
    "running",
    "fall",
    "walk",
    "jump",
];

// ws events
export const USER_DATA_EVENT = 0;
export const USER_STATE_UPDATE = 1;
export const DIED_OF_DEATH = 2;
export const CAKE_SPAWN_EVENT = 3;
export const CAKE_COLLIDE_EVENT = 4;
export const PLAYER_LEAVE_EVENT = 5;
export const CAKES_UPDATE_EVENT = 6;
export const GERMINATION_EVENT = 42;
export const IS_HOST_EVENT = 69;
export const START_LOBBY_EVENT = 7;
