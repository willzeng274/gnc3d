<script lang="ts">
	import { useFrame } from '@threlte/core'
	import type { Euler, Vector3 } from 'three'
	import Particle from './Particle.svelte'
	const getId = () => {
		return Math.random().toString(16).slice(2)
	}
	const getRandomPosition = (): Parameters<Vector3['set']> => {
		// return [0.5 - Math.random() * 1, 5 - Math.random() * 1 + 10, 0.5 - Math.random() * 1]
    return [500 - Math.random() * 1000, 100 + Math.random() * 100, 500 - Math.random() * 1000]
	}
	const getRandomRotation = (): Parameters<Euler['set']> => {
		return [Math.random() * 10, Math.random() * 10, Math.random() * 10]
	}
	type Body = {
		id: string
		position: Parameters<Vector3['set']>
		rotation: Parameters<Euler['set']>
    touch: boolean
	}
	let bodies: Body[] = []
	let lastBodyMounted: number = 0
	let bodyEveryMilliseconds = 5000
	// let longevityMilliseconds = 8000
	useFrame(() => {
		if (lastBodyMounted + bodyEveryMilliseconds < Date.now()) {
			const body: Body = {
				id: getId(),
				position: getRandomPosition(),
				rotation: getRandomRotation(),
        touch: false
			}
			bodies.unshift(body)
      lastBodyMounted = Date.now()
			bodies = bodies
		}
		const deleteIds: string[] = []
		bodies.forEach((body) => {
      if (body.touch) {
        deleteIds.push(body.id)
      }
		})
		if (deleteIds.length) {
			deleteIds.forEach((id) => {
				const index = bodies.findIndex((body) => body.id === id)
				if (index !== -1) bodies.splice(index, 1)
			})
			bodies = bodies
		}
	})
</script>
{#each bodies as body (body.id)}
	<Particle position={body.position} rotation={body.rotation} bind:touch={body.touch} />
{/each}
