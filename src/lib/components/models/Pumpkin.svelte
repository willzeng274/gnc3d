<script lang="ts">
	import type * as THREE from "three";
	import { Group, Box3, Vector3 } from "three";
	import { T, type Props, type Events, type Slots, forwardEventHandlers } from "@threlte/core";
	import { useGltf, useSuspense } from "@threlte/extras";
	import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";

	type $$Props = Props<THREE.Group>;
	type $$Events = Events<THREE.Group>;
	type $$Slots = Slots<THREE.Group> & { fallback: {}; error: { error: any } };

	export const ref = new Group();

	const suspend = useSuspense();
	type GLTFResult = {
		nodes: {
			Cylinder047: THREE.Mesh;
			Cylinder047_1: THREE.Mesh;
		};
		materials: {
			Brown: THREE.MeshStandardMaterial;
			Orange: THREE.MeshStandardMaterial;
		};
	};

	const gltf = suspend(useGltf<GLTFResult>("/models/pumpkin-transformed.glb", { useDraco: "/" }));

	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T
			scale={1.5}
			is={SkeletonUtils.clone(gltf.scene)}
			name="Scene"
			on:create={({ ref }) => {
				// console.log(ref)
				ref.updateMatrixWorld(true);
				let completeBoundingBox = new Box3().setFromObject(ref);
				let v3 = new Vector3();
				completeBoundingBox.getSize(v3);
				// alert(v3.y)
				ref.position.set(0, -v3.y / 2, 0);
			}}
		/>
		<!-- <T.Mesh geometry={gltf.nodes.Cylinder047.geometry} material={gltf.materials.Brown} />
		<T.Mesh geometry={gltf.nodes.Cylinder047_1.geometry} material={gltf.materials.Orange} /> -->
	{:catch error}
		<slot name="error" {error} />
	{/await}

	<slot {ref} />
</T>
