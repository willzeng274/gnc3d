import { animations } from "./constants";
import type { cakeType, ActionName } from "./types";

export function cakeTypeAsInt(cake: string): number {
    if (cake === "normal") return 0;
    if (cake === "frozen") return 1;
    if (cake === "gold") return 2;
    if (cake === "chicken") return 3;
    return -1;
}

export function getNewScoreByCakeType(score: number, cake: cakeType): number {
    if (cake === "normal") return score + 1;
    if (cake === "frozen") return score + 1;
    if (cake === "gold") return (score + 1) * 2;
    return -1;
}

export function convertAnimationToInt(s: ActionName): number {
    // note that it will return 'jump' when not found, which is disabled rn and easy to debug
    return animations.indexOf(s);
}

export function convertIntToAnimation(n: number): ActionName {
    return animations[n];
}

export function intToCakeType(n: number): cakeType {
    if (n === 0) return "normal";
    if (n === 1) return "frozen";
    if (n === 2) return "gold";
    if (n === 3) return "chicken";
    // this should not be reachable
    return "gold";
}

export function getRandomElementFromArray<G>(array: Array<G>) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
