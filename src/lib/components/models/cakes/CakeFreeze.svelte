<script lang="ts">
	import type * as THREE from "three";
	import { Group, Box3, Vector3 } from "three";
	import { T, forwardEventHandlers } from "@threlte/core";
	import { useGltf, useSuspense } from "@threlte/extras";
	import type { Props, Events, Slots } from "@threlte/core";

	type $$Props = Props<Group> & { rotation?: [number, number, number]; visible?: boolean };
	type $$Events = Events<Group>;
	type $$Slots = Slots<Group> & { fallback: {}; error: { error: any } };

	export const ref = new Group();

	type GLTFResult = {
		nodes: {
			Whole_Oceon_Blue_Cream_0: THREE.Mesh;
		};
		materials: {
			Oceon_Blue_Cream: THREE.MeshBasicMaterial;
		};
	};

  const suspend = useSuspense();

	const gltf = suspend(useGltf<GLTFResult>("/models/cake_freeze-transformed.glb", { useDraco: "/" }));

	const component = forwardEventHandlers();
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<T.Group
			scale={0.4}
			on:create={({ ref }) => {
				// console.log(ref)
				ref.updateMatrixWorld(true);
				let completeBoundingBox = new Box3().setFromObject(ref);
				let v3 = new Vector3();
				completeBoundingBox.getSize(v3);
				ref.position.set(0, -v3.y / 2, 0);
			}}
		>
			<T.Mesh
				geometry={gltf.nodes.Whole_Oceon_Blue_Cream_0.geometry}
				material={gltf.materials.Oceon_Blue_Cream}
				position={[-86, 0, 99]}
			/>
		</T.Group>
	{:catch error}
		<slot name="error" {error} />
	{/await}

	<slot {ref} />
</T>
