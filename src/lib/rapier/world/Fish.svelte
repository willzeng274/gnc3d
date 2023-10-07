<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import { Collider, CollisionGroups, RigidBody } from "@threlte/rapier";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import type * as THREE from "three";
	import { Vector3 } from "three";
	import { Fish } from "$lib/components/models";
	import { score } from "$lib/store";

	export let ballPos: [number, number, number];
	let rigidBody: RapierRigidBody;
	let fishRef: THREE.Group;
	let selfPos = [0, -8.5, 0];

	const axisY = new Vector3(0, 1, 0);

	useFrame(() => {
		if (fishRef && rigidBody && selfPos && !isNaN(ballPos[0]) && !isNaN(ballPos[2]) && !(ballPos[0] === 0 || ballPos[2] === 0)) {
			const translation = rigidBody.translation();
			// console.log("BALL", ballPos, "\nFISH", translation, selfPos);
			const a: number = ballPos[0] - selfPos[0],
				b: number = ballPos[2] - selfPos[2],
				c: number = Math.sqrt(a ** 2 + b ** 2);
			// console.log(a, b, c);
			const speed = 1 / (c === 0 ? 1 : c);

			selfPos[0] = translation.x;
			selfPos[2] = translation.z;
			rigidBody.setLinvel(
				{
					x: a * speed * 30,
					y: 0,
					z: b * speed * 30,
				},
				true
			);
			fishRef.setRotationFromAxisAngle(axisY, -(Math.atan2(b, a) - Math.PI / 2));
		} else if (ballPos[0] === 0  && ballPos[2] === 0) {
            rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
	});
</script>

<T.Group position={selfPos}>
	<RigidBody
		bind:rigidBody
		type="dynamic"
		enabledRotations={[false, false, false]}
		enabledTranslations={[true, false, true]}
		userData={{ name: "fish" }}
        on:collisionenter={({ targetRigidBody }) => {
            // @ts-ignore
            if (targetRigidBody.userData.name === "fishBall") {
                score.update(sc => sc-1);
            }
        }}
	>
        <CollisionGroups groups={[9]}>
            <Collider shape="cuboid" args={[0.2, 0.25, 0.4]}>
                <T.Group position={[0, 0.2, 0]}>
                    <Fish bind:ref={fishRef} />
                    <!-- <T.Mesh geometry={new BoxGeometry(1, 5)} material={new MeshBasicMaterial({ color: "white" })} /> -->
                </T.Group>
            </Collider>
        </CollisionGroups>
	</RigidBody>
</T.Group>
