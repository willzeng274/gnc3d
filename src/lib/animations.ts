import { createTransition } from "@threlte/extras";
import { cubicOut } from "svelte/easing";
import { scale as SvelteScale } from "svelte/transition";

export const zoomOut = createTransition<THREE.Group>((ref) => {
    return {
        tick(t) {
            // t is [0,1] and needs to be converted to [0.5,1]
            t = t * 0.9;
            ref.scale.set(t, t, t);
        },
        easing: cubicOut,
        duration: 400,
    };
});

export const zoomIn = createTransition<THREE.Group>((ref) => {
    return {
        tick(t) {
            // t is [0,1] and needs to be converted to [0.5,1]
            t = Math.min(t * 1.001, 1);
            ref.scale.set(t, t, t);
        },
        easing: cubicOut,
        duration: 400,
    };
});

export const scaleIn = (node: Element) =>
    SvelteScale(node, {
        duration: 200,
        opacity: 0,
    });

export const scaleOut = (node: Element) =>
    SvelteScale(node, {
        duration: 200,
        opacity: 0,
    });