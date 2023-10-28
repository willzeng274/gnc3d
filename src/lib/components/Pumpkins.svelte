<script lang="ts">
	import { useFrame } from '@threlte/core'
	import type { Euler, Vector3 } from 'three'
	import { plane, pumpkins } from '$lib/store';
	import { height, width, x_units, y_units } from '$lib/constants';
	import ParticlePump from './ParticlePump.svelte';

	let counter = 0;
	const getId = () => {
		return counter++;
	}
	const getRandomPosition = (): Parameters<Vector3['set']> => {
		const x = (Math.min(x_units, y_units) / 1) / 2 - Math.random() *  Math.min(x_units, y_units) / 1;
		const z = (Math.min(x_units, y_units) / 1) / 2 - Math.random() * Math.min(x_units, y_units) / 1;
		if ($plane) {

			const realX = Math.round((Math.round(x + (width / 2))/(width / x_units))) * 3;
			// 201 * 3 for every z coordinate cycle
			const realZ = (Math.round((height - Math.round(z + (height / 2)))/(height / y_units))) * 3 * (y_units + 1);
			// const vertices = $plane.getAttribute('position').array;
			const vertices = $plane;
			// margin of error = 1
			if (vertices[realX + realZ + 2] === undefined) {
				return getRandomPosition();
			}
			if (vertices[realX + realZ + 2] < 0) {
				// console.log(realX / 3, realZ / 603, "Height: ", vertices[realX + realZ + 2])
				return getRandomPosition();
			}
		}
    	return [x, 1, z]
	}

	const getRandomRotation = (): Parameters<Euler['set']> => {
		return [Math.random() * 10, Math.random() * 10, Math.random() * 10]
	}

	interface Pumpkin {
		id: number;
		position: [number, number, number];
		rotation: [x: number, y: number, z: number, order?: THREE.EulerOrder | undefined];
		touch: 0 | 1 | 2;
	}

	export let items: Pumpkin[] = [];
	let lastBodyMounted: number = 0;
	let bodyEveryMilliseconds = 10000;

	useFrame(() => {
		if (lastBodyMounted + bodyEveryMilliseconds < Date.now()) {
			const id = getId();
			const position = getRandomPosition();
			const rotation = getRandomRotation();
			items = [{
				id,
				position,
				rotation,
        		touch: 0,
			}, ...items]
			lastBodyMounted = Date.now();
		}
		items = items.reduce((prev, curr) => {
			if (curr.touch === 1) {
				pumpkins.update(p => p+1);
				return prev;
			}
			if (curr.touch === 2) {
				// console.log("Me when water");
				const id = getId();
				const pos = getRandomPosition();
				// since svelte uses id as key we must generate a new one in order for the old one to update
				// some computation costs can be saved by not generating a new rotation
				return [...prev, {
					id,
					position: pos,
					rotation: curr.rotation,
					touch: 0,
				}];
			}
			return [...prev, curr]
		}, [] as Pumpkin[])
	})
</script>
{#each items as item (item.id)}
	<ParticlePump position={item.position} rotation={item.rotation} bind:touch={item.touch} />
{/each}
