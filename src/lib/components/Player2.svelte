<script lang="ts">
	import { T } from "@threlte/core";
	// import type * as THREE from "three";
	import { CollisionGroups, Collider, RigidBody } from "@threlte/rapier";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";

	import Username from "./Username.svelte";
	import { Bigvegas, Boss, James, Timmy, Xbot, Ybot } from "$lib/components/models/index";
	import type { ActionName } from "$lib/types";

	let radius = 0.45; // used to be 0.3
	let height = 2; // used to be 1.7
	export let position: [number, number, number];
	export let linvel: [number, number, number];
	export let animation: ActionName;
	export let rotation: [number, number, number];
	export let id: number;
	export let skin: number;
	export let username: string;
	let rigidBody: RapierRigidBody;
	$: {
		if (rigidBody) {
			// console.log("linvel", linvel[0], linvel[2]);
			rigidBody.setTranslation(
				{
					x: position[0],
					y: Math.round(position[1] * 10) / 10,
					z: position[2],
				},
				false
			);
			rigidBody.setLinvel(
				{
					x: linvel[0],
					y: linvel[1],
					z: linvel[2],
				},
				true
			);
		}
	}
</script>

<T.Group {position}>
	<Username ypos={position[1]} {username} color={id === 0 ? "red" : undefined} />
	<!-- enable rotations for funny ragdoll -->
	<RigidBody bind:rigidBody enabledRotations={[false, false, false]} userData={{ id, name: "player2" }}>
		<!-- <CollisionGroups memberships={[15]} filter={[0, 7]}> -->
		<CollisionGroups groups={[0, 5]}>
			<Collider
				shape={"capsule"}
				friction={0}
				restitution={0.1}
				args={[height / 2 - radius, radius]}
				on:collisionenter={({ targetRigidBody }) => {
					// @ts-ignore
					if (targetRigidBody?.userData?.name === "player") {
						// send ws event
						// death.set(true);
						// console.log("Adding force NOW!")
						// const v = targetRigidBody.linvel();
						// targetRigidBody.addForce({ x: -Math.sign(v.x) * 2000, y: 2000, z: -Math.sign(v.z)  * 2000}, true);
						// targetRigidBody.addForce({ x: 0, y: 2000, z: 0}, true);
						// targetRigidBody.applyImpulse({ x: 0, y: 2000, z: 0 }, true);
					}
				}}
				on:collisionexit={({ targetRigidBody }) => {
					// @ts-ignore
					if (targetRigidBody?.userData?.name === "player") {
						// targetRigidBody.resetForces(true);
					}
				}}
			/>
			{#if skin === 0}
				<Ybot currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{:else if skin === 1}
				<Xbot currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{:else if skin === 2}
				<James currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{:else if skin === 3}
				<Bigvegas currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{:else if skin === 4}
				<Boss currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{:else if skin === 5}
				<Timmy currentActionKey={animation} rotation={[rotation[0], rotation[1] + Math.PI, rotation[2]]} />
			{/if}
			<CollisionGroups groups={[15]}>
				<T.Group position={[0, -height / 2 + radius, 0]}>
					<Collider sensor shape={"ball"} args={[radius * 1.2]} />
				</T.Group>
			</CollisionGroups>
		</CollisionGroups>
	</RigidBody>
</T.Group>
