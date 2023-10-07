<script lang="ts">
	import type * as THREE from "three";
	import { Box3, Group, Vector3 } from "three";
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
			Geo_Salmon: THREE.Mesh;
		};
		materials: {
			lambert2SG: THREE.MeshStandardMaterial;
		};
	};

	const gltf = suspend(useGltf<GLTFResult>("/models/Fish-transformed.glb", { useDraco: "/" }));

	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component} scale={0.05}>
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
