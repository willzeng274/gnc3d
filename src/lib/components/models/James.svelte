<script lang="ts">
	import type * as THREE from "three";
	import { Group, Box3, Vector3 } from "three";
	import { T, forwardEventHandlers } from "@threlte/core";
	import { useGltf, useGltfAnimations, useSuspense } from "@threlte/extras";
	import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
	import type { Props, Events, Slots } from "@threlte/core";

	type $$Props = Props<Group> & { currentActionKey: ActionName; rotation?: [number, number, number], visible?: boolean };
	type $$Events = Events<Group>;
	type $$Slots = Slots<Group> & { fallback: {}; error: { error: any } };

	export let ref = new Group();
	export let currentActionKey: ActionName = "idle";

	const suspend = useSuspense();
	let action: ActionName = "idle";
	type ActionName = "fall" | "idle" | "jump" | "running" | "tpose" | "walk" | "dance";
	type GLTFResult = {
		nodes: {
			Mesh: THREE.SkinnedMesh;
			Mesh_1: THREE.SkinnedMesh;
			Mesh_2: THREE.SkinnedMesh;
			mixamorig9Hips: THREE.Bone;
		};
		materials: {
			Ch06_body: THREE.MeshStandardMaterial;
			Ch06_eyelashes: THREE.MeshStandardMaterial;
			Ch06_body1: THREE.MeshStandardMaterial;
		};
	};

	const gltf = suspend(useGltf<GLTFResult>("/models/james-transformed.glb", { useDraco: "/" }));
	export const { actions, mixer } = useGltfAnimations<ActionName>(gltf, ref);
	const component = forwardEventHandlers();
	$: $actions[action]?.play();
	$: $actions[currentActionKey] && transitionTo(currentActionKey, 0.2);
	function transitionTo(nextActionKey: ActionName, duration = 1) {
		// console.log("Called", nextActionKey, action)
		const currentAction = $actions[action];
		const nextAction = $actions[nextActionKey];
		if (!nextAction || currentAction === nextAction) return;
		// console.log(nextActionKey)
		// Function inspired by: https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
		nextAction.enabled = true;
		if (currentAction) {
			currentAction.crossFadeTo(nextAction, duration, true);
		}
		// Not sure why I need this but the source code does not
		nextAction.play();
		action = nextActionKey;
	}
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T
			is={SkeletonUtils.clone(gltf.scene)}
			name="Scene"
			on:create={({ ref }) => {
				// console.log(ref)
				ref.updateMatrixWorld(true);
				let completeBoundingBox = new Box3().setFromObject(ref);
				let v3 = new Vector3();
				completeBoundingBox.getSize(v3);
				ref.position.set(0, -v3.y / 2, 0);
			}}
		/>
	{:catch error}
		<slot name="error" {error} />
	{/await}
	<slot {ref} />
</T>

