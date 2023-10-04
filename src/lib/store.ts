import { writable } from 'svelte/store';
import type { Config, ActionName } from './types';
import type { Object3D } from 'three';

export const lives = writable<number>(Infinity);
export const score = writable<number>(0);
export const highScore = writable<number>(0);
export const mobile = writable<boolean>(false);
export const host = writable<boolean>(false);
export const plane = writable<ArrayLike<number> | null>(null);
export const planeGeometry = writable<Object3D | null>(null);
export const playerPos = writable<[number, number, number]>([0, 10, 3]);
export const playerLinvel = writable<[number, number, number]>([0, 0, 0]);
export const playerAnimation = writable<ActionName>("tpose");
export const playerRotation =writable<[number, number, number]>([0, 0, 0]);
export const death = writable<boolean>(false);
export const freeze = writable<number>(0);
export const azure = writable<number>(0);
export const socket = writable<WebSocket | null>(null);
export const gameConfig = writable<Config>({
    fov: 90,
    fps: false,
    shader: true,
    blackhole: false,
    autosprint: false,
    womenCount: 1,
    jamalUnlocked: false,
    vegasUnlocked: false,
    bossUnlocked: false,
    timmyUnlocked: false,
    debugMode: false,
    volume: 20
});
export const hostWin = writable<boolean>(false);
export const gameEnd = writable<boolean>(false);