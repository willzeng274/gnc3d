<script lang="ts">
	import { T } from "@threlte/core";
	import { RigidBody, Collider } from "@threlte/rapier";
	import type * as THREE from "three";
	import { Euler, Quaternion } from "three";
	import { Vector3 } from "three";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import { Pumpkin } from "$lib/components/models";
	export let position: Parameters<THREE.Vector3["set"]>;
	export let rotation: Parameters<THREE.Euler["set"]>;
	export let dynamic: boolean = true;
	let g: THREE.Group;
	let rigidBody: RapierRigidBody | undefined;
    export let touch: 0 | 1 | 2;

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

<T.Group
	position={[position[0], position[1], position[2]]}
	rotation={[rotation[0], rotation[1], rotation[2], rotation[3]]}
	bind:ref={g}
>
	<RigidBody
		type="dynamic"
		bind:rigidBody
        on:collisionenter={({ targetRigidBody }) => {
			// @ts-ignore
			if (targetRigidBody?.userData?.name === "player") {
				touch = 1;
			// @ts-ignore
			} else if (targetRigidBody?.userData?.name === "water") {
				touch = 2;
			}
		}}
	>
        <Collider shape="cuboid" args={[1.2, 2/3, 1]} mass={100}>
            <Pumpkin />
        </Collider>
	</RigidBody>
</T.Group>