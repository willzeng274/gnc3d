<script lang="ts">
	import { score, socket } from "$lib/store";
	import { T } from "@threlte/core";
	import { HTML, useGltf, useSuspense } from "@threlte/extras";
	import { AutoColliders, RigidBody } from "@threlte/rapier";
	import type * as THREE from "three";
	import { Euler, Quaternion } from "three";
	import { derived } from "svelte/store";
	import { MeshStandardMaterial, Vector3, Mesh, MeshBasicMaterial } from "three";
	import { CAKE_COLLIDE_EVENT, CAKE_FINAL_EVENT } from "$lib/constants";
	import type { cakeType } from "$lib/types";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
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
	const suspend = useSuspense();
	const gltf = suspend(
		useGltf<{
			nodes: {
				spider_cookie: Mesh;
			};
			materials: {
				Material_MR: MeshStandardMaterial;
			};
		}>("/models/cake.glb")
	);
	const cake = derived(gltf, (gltf) => {
		if (!gltf || !gltf.nodes["spider_cookie"]) return;
		// console.log(gltf.nodes.spider_cookie)
		var center = new Vector3();
		gltf.nodes.spider_cookie.geometry.computeBoundingBox();
		gltf.nodes.spider_cookie.geometry.boundingBox!.getCenter(center);
		// console.log(center);
		// gltf.nodes.spider_cookie.geometry.center()
		// console.log()
		// console.log(gltf.nodes.spider_cookie.position)
		// gltf.nodes.spider_cookie.geometry.boundingBox!.getCenter(center);
		// console.log(center)
		// const loader = new GLTFExporter();
		// loader.parse(
		//   gltf.nodes.spider_cookie,
		//   function (gltf) {
		//     console.log(JSON.stringify(gltf));
		//   },
		//   function (error) {
		//     console.log(error);
		//   },
		// )
		return gltf.nodes["spider_cookie"];
	});

	function getColorFromType(type: cakeType): number {
		if (type === "frozen") {
			return 0x00f2ff;
		}
		if (type === "gold") {
			return 0xffd500;
		}
		if (type === "normal") {
			return 0x00000;
		}
		if (type === "azure") {
			return 0x007fff;
		}
		return 0xffd500;
	}

	// let prevPos: [number, number, number] = [0, 0, 0];
	// let lastUpdated = Date.now();
	// let ran = false;

	// $: {
	//   if ($socket && rigidBody && !ran && host) {
	//     ran = true;
	//     const inv = setInterval(() => {
	//       if (rigidBody) {
	//         const tl = rigidBody.translation();
	//         const arr: [number, number, number] = [Math.fround(tl.x), Math.fround(tl.y), Math.fround(tl.z)];
	//         // prevent Reactivity
	//         if (!arraysSize3AreEqual(prevPos, arr)) {
	//           prevPos[0] = tl.x;
	//           prevPos[1] = tl.y;
	//           prevPos[2] = tl.z;
	//           lastUpdated = Date.now();
	//         }
	//       }
	//       if (Date.now() - lastUpdated >= 1000) {
	//         $socket?.send(new Float32Array([CAKE_FINAL_EVENT, id, prevPos[0], prevPos[1], prevPos[2]]));
	//         clearInterval(inv);
	//       }
	//     }, 10);
	//     onDestroy(() => {
	//       clearInterval(inv);
	//     });
	//   }
	// }

	// $: !host && rigidBody?.setTranslation(new Vector3(position[0], position[1], position[2]), true);
</script>

{#if $cake}
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
			enabledRotations={dynamic ? undefined : [false, false, false]}
			enabledTranslations={dynamic ? undefined : [false, false, false]}
      userData={{ name: "cake" }}
      bind:rigidBody
			on:collisionenter={({ targetRigidBody }) => {
				// host can score cakes so I don't have to care about physics not syncing
				if (targetRigidBody?.userData?.name === "player" && ($socket == null || host)) {
					$socket?.send(new Float32Array([CAKE_COLLIDE_EVENT, id]));
					touch = 1;
					score.update((score) => score + 1);
					// TODO: fix this
				} else if (targetRigidBody?.userData?.name === "water") {
					// alert("TOUCHING WATER");
					touch = 2;
				} else if (targetRigidBody?.userData?.name === "player2" && host) {
					// man I wish I can do Uint16
					// console.log("player touched cake");
					$socket?.send(new Float32Array([CAKE_COLLIDE_EVENT, id]));
					touch = 1;
					score.update((score) => score + 1);
				}
			}}
			on:sleep={() => {
				if (!rigidBody) return;
				const tl = rigidBody.translation();
				const rt = rigidBody.rotation();
				const qt = new Quaternion(rt.x, rt.y, rt.z, rt.w);
				const eu = new Euler().setFromQuaternion(qt);
				$socket?.send(new Float32Array([CAKE_FINAL_EVENT, id, tl.x, tl.y, tl.z, eu.x, eu.y, eu.z]));
			}}
		>
			<AutoColliders shape="cuboid">
				<!-- $cake.material can suck my nuts -->
				<T.Mesh castShadow geometry={$cake.geometry} material={new MeshBasicMaterial({ color: getColorFromType(type) })} />
			</AutoColliders>
		</RigidBody>
	</T.Group>
{:else}
	<HTML>
		<div>HELP</div>
	</HTML>
{/if}

<!-- color picker lol -->

<!-- <style>
  body {
    color: #ffd500;
  }
</style> -->
