<script lang="ts">
	import type * as THREE from "three";
	import { Group, Box3, Vector3 } from "three";
	import { T, forwardEventHandlers } from "@threlte/core";
	import { useGltf, useSuspense } from "@threlte/extras";
	import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
	import type { Props, Events, Slots } from "@threlte/core";

	type $$Props = Props<Group> & { rotation?: [number, number, number]; visible?: boolean };
	type $$Events = Events<Group>;
	type $$Slots = Slots<Group> & { fallback: {}; error: { error: any } };

	export let ref = new Group();

	const suspend = useSuspense();
	type GLTFResult = {
    nodes: {
      barricade: THREE.Mesh
      
    }
    materials: {
      MetalStruss: THREE.MeshStandardMaterial
    }
  };

	const gltf = suspend(useGltf<GLTFResult>("/models/Barricade-transformed.glb", { useDraco: "/" }));

	const component = forwardEventHandlers();
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