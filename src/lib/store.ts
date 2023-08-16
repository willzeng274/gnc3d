import { writable } from 'svelte/store';
// import type { PlaneGeometry } from 'three';

export const score = writable<number>(0);
export const plane = writable<ArrayLike<number> | null>(null);
