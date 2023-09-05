import { animations } from "./constants";
import { azure } from "./store";
import type { cakeType, ActionName } from "./types";

export function getSkinNameByNumber(skinId: number): string {
    if (skinId === 0) {
        return "default male";
    }
    if (skinId === 1) {
        return "default female";
    }
    if (skinId === 2) {
        return "James";
    }
    if (skinId === 3) {
        return "Big vegas";
    }
    if (skinId === 4) {
        return "Boss";
    }
    if (skinId === 5) {
        return "Timmy";
    }
    return "default";
}

export function cakeTypeAsInt(cake: cakeType): number {
    if (cake === "normal") return 0;
    if (cake === "frozen") return 1;
    if (cake === "gold") return 2;
    if (cake === "azure") return 3;
    return -1;
}

export function getNewScoreByCakeType(score: number, cake: cakeType): number {
    if (cake === "normal") return score + 1;
    if (cake === "frozen") return score + 1;
    if (cake === "gold") return (score + 1) * 2;
    if (cake === "azure") {
        azure.update((az) => az+1);
        return score + 1;
    }
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
    if (n === 3) return "azure";
    // this should not be reachable
    return "gold";
}

export function getRandomElementFromArray<G>(array: Array<G>) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export function arraysSize3AreEqual(arr1: [number, number, number], arr2: [number, number, number], roundY: boolean = true): boolean {
    // only 4 digit representation is enough but for some reason Y is weird so we only keep 2 decimal places
    return Math.round(arr1[0] * 1e4) / 1e4 === Math.round(arr2[0] * 1e4) / 1e4 &&
        Math.round(arr1[1] * (roundY ? 1e2 : 1e4)) / (roundY ? 1e2 : 1e4) === Math.round(arr2[1] * (roundY ? 1e2 : 1e4)) / (roundY ? 1e2 : 1e4) &&
        Math.round(arr1[2] * 1e4) / 1e4 === Math.round(arr2[2] * 1e4) / 1e4;
}

export async function encrypt(message: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12) }, key, data);
    return arrayBufferToBase64(encryptedData);
}
  

export async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
    const encryptedData = base64ToArrayBuffer(encrypted);
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(12) }, key, encryptedData);
    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decryptedData);
    return decryptedMessage;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
    const binary = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode(...binary));
    return base64;
}

export function base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function importEncryptionKey(exportedKey: JsonWebKey): Promise<CryptoKey> {
    const importedKey = await crypto.subtle.importKey("jwk", exportedKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    return importedKey;
}