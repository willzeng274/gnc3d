<script lang="ts">
	import { socket } from "$lib/store";
	import { T } from "@threlte/core";
	import { RigidBody, Collider } from "@threlte/rapier";
	import type * as THREE from "three";
	import { Euler, Quaternion } from "three";
	import { Vector3 } from "three";
	import { BARRICADE_FINAL_EVENT } from "$lib/constants";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import { Barricade } from "$lib/components/models";
	export let position: Parameters<THREE.Vector3["set"]>;
	export let rotation: Parameters<THREE.Euler["set"]>;
	export let owner: boolean = true;
	export let id: number;
	export let dynamic: boolean = true;
	let g: THREE.Group;
	let rigidBody: RapierRigidBody | undefined;

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
		rigidBody?.enableCcd(false);
	}
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
	position={[position[0], position[1], position[2]]}
	rotation={[rotation[0], rotation[1], rotation[2], rotation[3]]}
	bind:ref={g}
>
	<RigidBody
		type="dynamic"
		bind:rigidBody
		on:sleep={() => {
			if (!rigidBody || !owner) return;
			const tl = rigidBody.translation();
			const rt = rigidBody.rotation();
			const qt = new Quaternion(rt.x, rt.y, rt.z, rt.w);
			const eu = new Euler().setFromQuaternion(qt);
			$socket?.send(new Float32Array([BARRICADE_FINAL_EVENT, id, tl.x, tl.y, tl.z, eu.x, eu.y, eu.z]));
		}}
	>
        <Collider shape="cuboid" args={[2, 1, 1/3]} mass={100}>
            <Barricade />
        </Collider>
	</RigidBody>
</T.Group>