import type { ActionName, Config } from "./types";

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

export const contextMenuItems = [
    {
        name: "Skins",
    },
    {
        name: "Seed",
    },
    {
        name: "Shop",
    },
    {
        name: "Play",
    },
    {
        name: "Settings",
    },
];

export const shopItems = [
    {
        skinText: "James Skin",
        perk: "Perks: 20% speed buff",
        unlock: `Unlock by collecting the azure cake type`,
        skin: 2,
        index: 0,
        isUnlocked: (cfg: Config) => cfg.jamalUnlocked,
    },
    {
        skinText: "Big Vegas Skin",
        perk: "Perks: Attracts cakes within 10 block radius, 15% sprint speed nerf",
        unlock: `Unlock by getting a score of 500 in one run`,
        skin: 3,
        index: 1,
        isUnlocked: (cfg: Config) => cfg.vegasUnlocked,
    }
];

// ws events
export const USER_DATA_EVENT = 0;
export const USER_STATE_UPDATE = 1;
export const DIED_OF_DEATH = 2;
export const CAKE_SPAWN_EVENT = 3;
export const CAKE_COLLIDE_EVENT = 4;
export const PLAYER_LEAVE_EVENT = 5;
export const CAKES_UPDATE_EVENT = 6;
export const START_LOBBY_EVENT = 7;
export const TXT_MESSAGE_CREATE = 8;
export const USER_NAME_EVENT = 9;
export const CAKE_FINAL_EVENT = 10;
export const GERMINATION_EVENT = 42;
export const IS_HOST_EVENT = 69;
