import type { ThrelteTransition } from "@threlte/extras";
import type { Spring } from "svelte/motion";
import type { Vector3, Euler, PerspectiveCamera, Group } from "three";
import type { ShopItem  } from "$lib/constants";
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

export interface LobbyItems {
    players: ConnectedPlayer[];
    skin: number;
    host: boolean;
    logs: string[];
    message: string;
}

export interface MenuItems {
    isSuspend: boolean;
    currentCtx: {
        name: string;
    };
    mobile: boolean;
    cam: PerspectiveCamera | undefined;
    rotation: number;
    scale: Spring<number>;
    scale2: Spring<number>;
    zoomIn: ThrelteTransition<Group>;
    zoomOut: ThrelteTransition<Group>;
    realSeed: number | undefined;
    seed: number | undefined;
    menu: boolean;
    tutorial: boolean;
    skin: number;
    currentShopSkin: ShopItem;
    scaleIn: any;
    scaleOut: any;
    username: string;
    room: string;
}

export interface TutorialItems{
    realSeed: number | undefined;
    host:boolean;
    tutorial:boolean;
    menu : boolean
}

export interface AssetItems{
    highScore: number;
    host: boolean;
    frozen: number;
    tutorial: boolean;
    lobby: boolean;
    realSeed: number | undefined;
    logs: string[];
    message: string;
    username: string;
    skin: number;
    hostCakes: CakeGenItem[];
    cakes: Cake[];
    barricades: Barricade[];
    chatActive: boolean;
    menu: boolean;
    own_id: number | null;
    players: ConnectedPlayer[];
    started: boolean;
}