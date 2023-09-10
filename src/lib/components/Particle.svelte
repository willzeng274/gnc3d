<script lang="ts">
	import { score, socket } from "$lib/store";
	import { T } from "@threlte/core";
	import { RigidBody, Collider } from "@threlte/rapier";
	import type * as THREE from "three";
	import { Euler, Quaternion } from "three";
	import { Vector3 } from "three";
	import { CAKE_COLLIDE_EVENT, CAKE_FINAL_EVENT } from "$lib/constants";
	import type { cakeType } from "$lib/types";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import CakeGold from "./models/cakes/CakeGold.svelte";
	import CakeNormal from "./models/cakes/CakeNormal.svelte";
	import CakePurple from "./models/cakes/CakePurple.svelte";
	import CakeFreeze from "./models/cakes/CakeFreeze.svelte";
	// import { onDestroy } from 'svelte';
	// import { arraysSize3AreEqual } from '$lib/utils';
	// import GLTFExporter from 'three-gltf-exporter';
	// import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
	// import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
	export let position: Parameters<THREE.Vector3["set"]>;
	export let rotation: Parameters<THREE.Euler["set"]>;
	export let touch: 0 | 1 | 2;
	export let type: cakeType;
	export let host: boolean = true;
	export let id: number;
	export let dynamic: boolean = true;
	let g: THREE.Group;
	let rigidBody: RapierRigidBody | undefined;
	// const suspend = useSuspense();
	// const gltf = suspend(
	// 	useGltf<{
	// 		nodes: {
	// 			spider_cookie: Mesh;
	// 		};
	// 		materials: {
	// 			Material_MR: MeshStandardMaterial;
	// 		};
	// 	}>("/models/cake.glb")
	// );
	// const cake = derived(gltf, (gltf) => {
	// 	if (!gltf || !gltf.nodes["spider_cookie"]) return;
	// 	// console.log(gltf.nodes.spider_cookie)
	// 	var center = new Vector3();
	// 	gltf.nodes.spider_cookie.geometry.computeBoundingBox();
	// 	gltf.nodes.spider_cookie.geometry.boundingBox!.getCenter(center);
	// 	return gltf.nodes["spider_cookie"];
	// });

	// function getColorFromType(type: cakeType): number {
	// 	if (type === "frozen") {
	// 		return 0x00f2ff;
	// 	}
	// 	if (type === "gold") {
	// 		return 0xffd500;
	// 	}
	// 	if (type === "normal") {
	// 		return 0x00000;
	// 	}
	// 	if (type === "azure") {
	// 		return 0x007fff;
	// 	}
	// 	return 0xffd500;
	// }

	$: {
		if (!dynamic) {
			updateLast(position, rotation);
		}
	}
	export function updateLast(position: [number, number, number], rotation: [x: number, y: number, z: number, order?: THREE.EulerOrder | undefined]) {
		rigidBody?.setTranslation(new Vector3(position[0], position[1], position[2]), false);
		rigidBody?.setLinvel(new Vector3(0, 0, 0), false);
		const eu = new Euler(rotation[0], rotation[1], rotation[2], rotation[3]);
		const qt = new Quaternion().setFromEuler(eu);
		rigidBody?.setRotation(qt, true);
		rigidBody?.setEnabledRotations(false, false, false, true);
		// because of big vegas
		// rigidBody?.setEnabledTranslations(false, false, false, true);
		rigidBody?.enableCcd(false);
	}
	// $: !host && rigidBody?.setTranslation(new Vector3(position[0], position[1], position[2]), true);
</script>

<!-- This is for debugging during multiplayer -->
<!-- <T.Group
	position={position}
>
	<HTML>
	<h1 style="color: red;">{id}</h1>
	</HTML>
</T.Group> -->
<T.Group
	position={[position[0] * 10, position[1] * 10, position[2] * 10]}
	rotation={[rotation[0] * 10, rotation[1] * 10, rotation[2] * 10, rotation[3]]}
	scale={0.1}
	bind:ref={g}
>
	<RigidBody
		type="dynamic"
		userData={{ name: "cake" }}
		bind:rigidBody
		on:collisionenter={({ targetRigidBody }) => {
			// host can score cakes so I don't have to care about physics not syncing
			// @ts-ignore
			if (targetRigidBody?.userData?.name === "player" && ($socket == null || host)) {
				$socket?.send(new Float32Array([CAKE_COLLIDE_EVENT, id]));
				touch = 1;
				score.update((score) => score + 1);
				// TODO: fix this
			// @ts-ignore
			} else if (targetRigidBody?.userData?.name === "water") {
				// alert("TOUCHING WATER");
				touch = 2;
			// @ts-ignore
			} else if (targetRigidBody?.userData?.name === "player2" && host) {
				// man I wish I can do Uint16
				// console.log("player touched cake");
				$socket?.send(new Float32Array([CAKE_COLLIDE_EVENT, id]));
				touch = 1;
				score.update((score) => score + 1);
			}
		}}
		on:sleep={() => {
			if (!rigidBody || !host) return;
			const tl = rigidBody.translation();
			const rt = rigidBody.rotation();
			const qt = new Quaternion(rt.x, rt.y, rt.z, rt.w);
			const eu = new Euler().setFromQuaternion(qt);
			$socket?.send(new Float32Array([CAKE_FINAL_EVENT, id, tl.x, tl.y, tl.z, eu.x, eu.y, eu.z]));
		}}
	>
		<!-- <AutoColliders shape="cuboid"> -->
		<Collider shape="cuboid" args={[8, 4.8, 8]}>
			<!-- <T.Mesh castShadow geometry={$cake.geometry} material={new MeshBasicMaterial({ color: getColorFromType(type) })} /> -->
			{#if type === "gold"}
				<CakeGold />
			{:else if type === "normal"}
				<CakeNormal />
			{:else if type === "azure"}
				<CakePurple />
			{:else if type === "frozen"}
				<CakeFreeze />
			{/if}
		</Collider>
		<!-- </AutoColliders> -->
	</RigidBody>
</T.Group>