<script lang="ts">
	import { useFrame } from '@threlte/core'
	import type { Euler, Vector3 } from 'three'
	import Particle from './Particle.svelte'
	import { plane } from '$lib/store';
	import { height, width, x_units, y_units } from '$lib/constants';
	const getId = () => {
		return Math.random().toString(16).slice(2)
	}
	const getRandomPosition = (): Parameters<Vector3['set']> => {
		// return [0.5 - Math.random() * 1, 5 - Math.random() * 1 + 10, 0.5 - Math.random() * 1]
		// console.log("Called")
		// const x = (width / 2) - Math.random() * width;
		// const z = (height / 2) - Math.random() * height;
		const x = (Math.min(x_units, y_units) / 2.67) / 2 - Math.random() *  Math.min(x_units, y_units) / 2.67;
		const z = (Math.min(x_units, y_units) / 2.67) / 2 - Math.random() * Math.min(x_units, y_units) / 2.67
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
				return getRandomPosition()
			}
			if (vertices[realX + realZ + 2] < 0) {
				// console.log(realX / 3, realZ / 603, "Height: ", vertices[realX + realZ + 2])
				return getRandomPosition()
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
	type Body = {
		id: string
		position: Parameters<Vector3['set']>
		rotation: Parameters<Euler['set']>
    	touch: 0 | 1 | 2
	}
	let bodies: Body[] = []
	let lastBodyMounted: number = 0
	let bodyEveryMilliseconds = 10000
	// let longevityMilliseconds = 8000
	useFrame(() => {
		if (lastBodyMounted + bodyEveryMilliseconds < Date.now()) {
			bodies = [{
				id: getId(),
				position: getRandomPosition(),
				rotation: getRandomRotation(),
        		touch: 0
			}, ...bodies]
			lastBodyMounted = Date.now()
			// console.log(bodies.length)
		}
		// map first to increase performance? I think both will end up with similar performance
		// if (bodies.length > 2) {
		bodies = bodies.reduce((prev, curr) => {
			if (curr.touch === 1) {
				return prev;
			}
			if (curr.touch === 2) {
				// console.log("Me when water")
				// since svelte uses id as key we must generate a new one in order for the old one to update
				// some computation costs can be saved by not generation a new rotation
				return [...prev, {
					id: getId(),
					position: getRandomPosition(),
					rotation: curr.rotation,
					touch: 0
				}];
			}
			return [...prev, curr]
		}, [] as Body[])
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
{#each bodies as body (body.id)}
	<Particle position={body.position} rotation={body.rotation} bind:touch={body.touch} />
{/each}
