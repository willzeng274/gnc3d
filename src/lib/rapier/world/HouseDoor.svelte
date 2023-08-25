<script lang="ts">
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import { T } from "@threlte/core";
	import { HTML } from "@threlte/extras";
	import { AutoColliders, Collider, CollisionGroups, RigidBody } from "@threlte/rapier";
	import { cubicIn, cubicOut } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import { blur } from "svelte/transition";
	import { BoxGeometry, Euler, type Group, MeshStandardMaterial, Quaternion, Vector3 } from "three";
	import { DEG2RAD } from "three/src/math/MathUtils";

    export let position: [number, number, number] = [0, 0, 0];
    // export let rotY: number = 0;
	let open = false;
	let objectsInSensor = 0;
	$: {
		if (objectsInSensor < 0) objectsInSensor = 0;
		if (objectsInSensor > 1) objectsInSensor = 1;
		open = objectsInSensor > 0;
	}

	let group: Group;
	let doorRigidBody: RapierRigidBody;

	let doorRotationClosed = 0;
	let doorRotationOpen = -105 * DEG2RAD;
	let doorRotation = tweened(doorRotationClosed);
	$: doorRotation.set(open ? doorRotationOpen : doorRotationClosed, {
		easing: open ? cubicOut : cubicIn,
	});

	const q = new Quaternion();
	const e = new Euler();

	const applyDoorRotation = (rotation: number) => {
		if (!group || !doorRigidBody) return;
		group.getWorldQuaternion(q);
		e.setFromQuaternion(q.clone());
		e.y += rotation;
        const q2 = q.clone();
		q2.setFromEuler(e);
		doorRigidBody.setNextKinematicRotation(q2);
	};

	$: if (group && doorRigidBody) applyDoorRotation($doorRotation);

    const rotation = [0, Math.PI / 2, 0];

	const [xDis, zDis] = rotation[1] === Math.PI / 2 ? [0, 0.5] : (
		rotation[1] === 3 * Math.PI / 2 ? [0, -0.5] : 
		rotation[1] === Math.PI ? [0.5, 0] :
		rotation[1] === 0 ? [-0.5, 0] : [0, 0]
	);
</script>

<T.Group bind:ref={group}>
	<!-- FRAME -->
	<AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
		<T.Group>
			<!-- SIDE FRAME A -->
			<T.Mesh
				receiveShadow
				castShadow
				position={[0.7, 1.125, 4]}
				geometry={new BoxGeometry(0.3, 2.25, 0.3)}
				material={new MeshStandardMaterial()}
			/>

			<!-- SIDE FRAME B -->
			<T.Mesh
				receiveShadow
				castShadow
				position={[-0.7, 1.125, 4]}
				geometry={new BoxGeometry(0.3, 2.25, 0.3)}
				material={new MeshStandardMaterial()}
			/>
		</T.Group>

		<!-- TOP FRAME -->
		<T.Mesh
			receiveShadow
			castShadow
			position={[0, 2.4, 4]}
			geometry={new BoxGeometry(1.4 + 0.3, 0.3, 0.3)}
			material={new MeshStandardMaterial()}
		/>
	</AutoColliders>

	<HTML transform position={[0, 3, 4]} pointerEvents="none">
		{#key open}
			<small
				in:blur={{
					amount: 15,
					duration: 300,
				}}
				out:blur={{
					amount: 15,
					duration: 300,
				}}
				class="door"
				class:closed={!open}
				class:open
			>
				{open ? "UNLOCKED" : "LOCKED"}
			</small>
		{/key}
	</HTML>

	<!-- DOOR -->
	<T.Group position={[-0.5, 1.125, 4]}>
		<RigidBody bind:rigidBody={doorRigidBody} type={"kinematicPosition"}>
			<AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
                <!-- TODO: fix rotation issue -->
				<T.Mesh
					receiveShadow
					castShadow
					position.x={0.5}
					geometry={new BoxGeometry(1, 2.25, 0.1)}
					material={new MeshStandardMaterial()}
				/>
			</AutoColliders>
		</RigidBody>
	</T.Group>

	<CollisionGroups groups={[15]}>
		<T.Group position={[0, 1.5, 4]}>
			<!-- args={[1, 1.35, 1.5]} -->
			<Collider
				shape={"cuboid"}
				args={[1, 1.35, 1.5]}
				sensor
				on:sensorenter={() => (objectsInSensor += 1)}
				on:sensorexit={() => (objectsInSensor -= 1)}
			/>
		</T.Group>
	</CollisionGroups>
</T.Group>

<style>
	.door {
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		color: rgb(255, 255, 255);
		border-radius: 0.375rem;
		position: absolute;
		transform: translateX(-50%) translateY(-50%);
	}

	.closed {
		background-color: rgb(239, 68, 68);
	}

	.open {
		background-color: rgb(34, 197, 94);
	}
</style>
