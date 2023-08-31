<script lang="ts">
	import { useFrame } from '@threlte/core'
	import type { Euler, Vector3 } from 'three'
	import Particle from './Particle.svelte'
	import { freeze, plane, score, socket, gameConfig, azure } from '$lib/store';
	import { CAKE_GONE_EVENT, CAKE_SPAWN_EVENT, height, width, x_units, y_units } from '$lib/constants';
	import type { CakeGenItem } from '$lib/types';
	import { cakeTypeAsInt } from '$lib/utils';
	// import { HTML } from '@threlte/extras';
	let counter = 0;
	const getId = () => {
		return counter++;
	}
	export let host = false;
	const getRandomPosition = (): Parameters<Vector3['set']> => {
		// return [0.5 - Math.random() * 1, 5 - Math.random() * 1 + 10, 0.5 - Math.random() * 1]
		// console.log("Called")
		// const x = (width / 2) - Math.random() * width;
		// const z = (height / 2) - Math.random() * height;
		const x = (Math.min(x_units, y_units) / 1) / 2 - Math.random() *  Math.min(x_units, y_units) / 1;
		const z = (Math.min(x_units, y_units) / 1) / 2 - Math.random() * Math.min(x_units, y_units) / 1;
		if ($plane) {
			// -150 to 150 with x
			// 150 to -150 with y
			// 300 px split into 200 units
			// it takes 200 steps to go from -150 to 150 in intervals of 1.5
			// let's say coordinate is 60, 30...
			// that means x went from -150 to 60... which is 0 to 210, taking (210/1.5) steps which is 140
			// now let's say z (which is actually y)
			// z went from 150 to 30... which is 300 to 180, taking (120/1.5) steps which is 80 (experimentally tested)
			// when z = 1, index = 603, 604, 605
			// when z = 2, index = 1206, 1207, 1208
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
			// vertices[i*3 + 1] = realZ;
			// console.log(vertices)
			// console.log("Yes: ", vertices[realX + realZ], vertices[realX + realZ + 1], vertices[realX + realZ + 2])
			// console.log("No: ", x, z, "eh")
			// console.log(vertices[realZ*3], vertices[realZ*3 + 1], vertices[realZ*3 + 2])
		}
		// console.log(x, z)
    	return [x, 1, z]
	}

	const getRandomRotation = (): Parameters<Euler['set']> => {
		return [Math.random() * 10, Math.random() * 10, Math.random() * 10]
	}

	export let items: CakeGenItem[] = [];
	let lastBodyMounted: number = 0;
	let bodyEveryMilliseconds = 10000;
	// let bodyEveryMilliseconds = 200;

	// let longevityMilliseconds = 8000
	useFrame(() => {
		if (lastBodyMounted + bodyEveryMilliseconds < Date.now()) {
			const id = getId();
			const position = getRandomPosition();
			const rotation = getRandomRotation();
			const type = Math.random() > 0.5 ? 'normal' : (Math.random() > 0.3 ? (Math.random() > 0.1 ? 'frozen' : 'azure' ) : 'gold');
			// const type = 'azure';
			items = [{
				id,
				position,
				rotation,
        		touch: 0,
				type
			}, ...items]
			lastBodyMounted = Date.now();
			if (host) {
				// console.log("New cake at ", ...position);
				// Euler's order is default
				// bytesize = 4 + 3*4 + 3*4 + 4 = 8 * 4
				const arr = new Float32Array([CAKE_SPAWN_EVENT, id, ...position, rotation[0], rotation[1], rotation[2], cakeTypeAsInt(type)]);
				$socket?.send(arr);
			}
			// console.log(bodies.length)
		}
		// map first to increase performance? I think both will end up with similar performance
		// if (bodies.length > 2) {
		items = items.reduce((prev, curr) => {
			if (curr.touch === 1) {
				if (curr.type === 'frozen') {
					freeze.update((f) => f + 1);
				} else if (curr.type === 'gold') {
					score.update((s) => s+9);
				} else if (curr.type === 'azure') {
					gameConfig.update((gc) => ({...gc, jamalUnlocked: true}));
					azure.update((az) => az+1);
				}
				return prev;
			}
			if (curr.touch === 2) {
				// console.log("Me when water");
				const id = getId();
				const pos = getRandomPosition();
				const arr = new Float32Array([CAKE_SPAWN_EVENT, id, ...pos, curr.rotation[0], curr.rotation[1], curr.rotation[2], cakeTypeAsInt(curr.type)]);
				$socket?.send(arr);
				$socket?.send(new Float32Array([CAKE_GONE_EVENT, curr.id]));
				// since svelte uses id as key we must generate a new one in order for the old one to update
				// some computation costs can be saved by not generating a new rotation
				return [...prev, {
					id,
					position: pos,
					rotation: curr.rotation,
					touch: 0,
					type: curr.type
				}];
			}
			return [...prev, curr]
		}, [] as CakeGenItem[])
		// } else {
		// 	if (bodies[0].touch === 1) {
		// 		bodies = [];
		// 	} else if (bodies[0].touch === 2) {
		// 		bodies = [{
		// 			id: bodies[0].id,
		// 			position: getRandomPosition(),
		// 			rotation: getRandomRotation(),
		// 			touch: 0
		// 		}]
		// 	}
		// }

		// bodies = bodies.map((body) => {
		// 	if (body.touch === 2) {
		// 		alert("Imagine touching water")
		// 		return {
		// 			id: body.id,
		// 			touch: 0 as 0 | 1 | 2, // wtf is wrong with typescript
		// 			position: getRandomPosition(),
		// 			rotation: getRandomRotation()
		// 		}
		// 	}
		// 	return body
		// }).filter((body) => {
		// 	if (body.touch === 1 || body.touch === 2) {
		// 		return false;
		// 	}
		// 	return true;
		// });
	})
</script>
{#each items as item (item.id)}
	<Particle id={item.id} position={item.position} rotation={item.rotation} bind:touch={item.touch} type={item.type} />
{/each}

<!-- <style>
	.frozen {
		color: #00f2ff;
		font-weight: bold;
		text-align: center;
		/* left: -25; */
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		color: rgb(255, 255, 255);
		border-radius: 0.375rem;
		position: absolute;
		transform: translateX(-50%) translateY(-50%);
	}
</style> -->
