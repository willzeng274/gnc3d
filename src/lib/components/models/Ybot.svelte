<script lang="ts">
	import type * as THREE from "three";
	import { Group, Box3, Vector3 } from "three";
	import { T, forwardEventHandlers } from "@threlte/core";
	import { useGltf, useGltfAnimations, useSuspense } from "@threlte/extras";
	import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
	import type { Props, Events, Slots } from "@threlte/core";

	type $$Props = Props<THREE.Group> & { currentActionKey: ActionName };
	type $$Events = Events<THREE.Group>;
	type $$Slots = Slots<THREE.Group> & { fallback: {}; error: { error: any } };

	export let ref = new Group();
	export let currentActionKey: ActionName = "idle";

	const suspend = useSuspense();
	let action: ActionName = "idle";

	type ActionName = "idle" | "jump" | "running" | "tpose" | "walk" | "fall";
	type GLTFResult = {
		nodes: {
			Alpha_Joints: THREE.SkinnedMesh;
			Alpha_Surface: THREE.SkinnedMesh;
			mixamorigHips: THREE.Bone;
		};
		materials: {
			["Alpha_Joints_MAT.001"]: THREE.MeshStandardMaterial;
			["Alpha_Body_MAT.001"]: THREE.MeshStandardMaterial;
		};
	};

	const gltf = suspend(useGltf<GLTFResult>("/models/ybot-transformed.glb", { useDraco: "/" }));
	// const gltf = suspend(useGltf<GLTFResult>('/models/ybot.glb'));
	export const { actions, mixer } = useGltfAnimations<ActionName>(gltf, ref);
	// let group: THREE.Group
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
				// console.log(ref);
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
