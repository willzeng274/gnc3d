import type { Vector3, Euler } from "three";

export type cakeType = "normal" | "frozen" | "gold" | "azure";
export interface Cake {
    id: number;
    position: [number, number, number];
    rotation: [number, number, number];
    type: cakeType;
    dynamic: boolean;
}

export interface Barricade {
    id: number;
    position: [number, number, number];
    rotation: [number, number, number];
    dynamic: boolean;
    owner: number;
}

export interface CakeGenItem {
    id: number,
    position: Parameters<Vector3['set']>,
    rotation: Parameters<Euler['set']>,
    touch: 0 | 1 | 2,
    type: cakeType,
}

export type ActionName = "idle" | "jump" | "running" | "tpose" | "walk" | "fall" | "dance";

export interface ConnectedPlayer {
    id: number;
    name: string;
    skin: number;
    x: number;
    y: number;
    z: number;
    linx: number;
    liny: number;
    linz: number;
    animation: ActionName;
    rotation: [number, number, number];
}

export interface Config {
    fov: number;
    volume: number;
    fps: boolean;
    shader: boolean;
    blackhole: boolean;
    autosprint: boolean;
    womenCount: number;
    jamalUnlocked: boolean;
    vegasUnlocked: boolean;
    bossUnlocked: boolean;
    timmyUnlocked: boolean;
    debugMode: boolean;
}