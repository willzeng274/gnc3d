import { writable } from 'svelte/store';
// import type { PlaneGeometry } from 'three';

export const score = writable<number>(0);
export const plane = writable<ArrayLike<number> | null>(null);
export const playerPos = writable<[number, number, number]>([0, 10, 3]);
export const death = writable<boolean>(false);
export const freeze = writable<number>(0);