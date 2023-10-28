import { azure, gameConfig, pumpkins } from "./store";
import { get } from 'svelte/store';
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
    "dance"
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
        name: "Manual",
    },
    {
        name: "Play",
    },
    {
        name: "Settings",
    },
    {
        name: "Credits"
    },
];

type ShopItem = {
    skinText: string;
    perk: string;
    unlock: string;
    skin: number;
    index: number;
    isUnlocked: (cfg: Config) => boolean;
    handleClick: (() => () => void) | (() => null);
};

export const shopItems: ShopItem[] = [
    {
        skinText: "James Skin",
        perk: "Perks: 20% speed buff",
        unlock: `Unlock by collecting the azure cake type`,
        skin: 2,
        index: 0,
        isUnlocked: (cfg: Config) => cfg.jamalUnlocked,
        handleClick: () => null
    },
    {
        skinText: "Big Vegas Skin",
        perk: "Perks: Attracts cakes <20 blocks, 15% sprint nerf, 12.5% dash nerf",
        unlock: `Unlock by getting a score of 200 in one run`,
        skin: 3,
        index: 1,
        isUnlocked: (cfg: Config) => cfg.vegasUnlocked,
        handleClick: () => null
    },
    {
        skinText: "Boss skin",
        perk: "Perks: Can dance after pressing \"e\", 10% sprint buff",
        unlock: `Unlock with 5 azure`,
        skin: 4,
        index: 2,
        isUnlocked: (cfg: Config) => cfg.bossUnlocked,
        handleClick: () => () => {
            if (get(azure) >= 5) {
                azure.update((az) => az - 5);
                gameConfig.update((cfg) => ({
                    ...cfg,
                    bossUnlocked: true
                }))
            }
        }
    },
    {
        skinText: "Timmy skin",
        perk: "Perks: Can place x8 more barricades, 10% sprint buff",
        unlock: `Unlock with 10 azure`,
        skin: 5,
        index: 3,
        isUnlocked: (cfg: Config) => cfg.timmyUnlocked,
        handleClick: () => () => {
            if (get(azure) >= 10) {
                azure.update((az) => az - 10);
                gameConfig.update((cfg) => ({
                    ...cfg,
                    timmyUnlocked: true
                }))
            }
        }
    },
    {
        skinText: "Icemage skin",
        perk: "Perks: 15% speed buff, every cake has a frozen effect",
        unlock: `Unlock with 1000 pumpkins`,
        skin: 6,
        index: 4,
        isUnlocked: (cfg: Config) => cfg.icemageUnlocked,
        handleClick: () => () => {
            // pumpkins.set(999);
            if (get(pumpkins) >= 1000) {
                pumpkins.update((p) => p - 1000);
                gameConfig.update((cfg) => ({
                    ...cfg,
                    icemageUnlocked: true
                }))
            }
        }
    }
];

export const jwk: JsonWebKey = {"alg":"A256GCM","ext":true,"k":"L3p9DoQAxqF5OCNfJkTPB2n2X5tVY_1CdJG9FoRArXE","key_ops":["encrypt","decrypt"],"kty":"oct"};

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
export const CAKE_GONE_EVENT = 11;
export const BARRICADE_SPAWN_EVENT = 12;
export const BARRICADE_FINAL_EVENT = 13;
export const BARRICADE_GONE_EVENT = 14;
export const BITCHLESS_EVENT = 15;
export const HOST_WIN_EVENT = 16;
export const GERMINATION_EVENT = 42;
export const IS_HOST_EVENT = 69;
