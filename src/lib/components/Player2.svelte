<script lang="ts">
    import { T } from "@threlte/core";
    import { CollisionGroups, Collider, RigidBody } from "@threlte/rapier";
    import Xbot from './models/Xbot.svelte';
    import { MeshBasicMaterial, CapsuleGeometry } from "three";
    // import type { Group } from "three";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import Ybot from "./models/Ybot.svelte";
    // import { death, freeze, playerPos } from "$lib/store";

    export let position: [number, number, number];
    let rigidBody: RapierRigidBody;
    $: {
        if (rigidBody) {
            rigidBody.setTranslation({
                x: position[0],
                y: Math.round(position[1] * 10) / 10,
                z: position[2]
            }, false);
            rigidBody.setLinvel({
                x: 0,
                y: 1,
                z: 0
            }, true);
        }
    }
</script>

<T.Group {position} rotate={[0, Math.PI, 0]}>
    <!-- enable rotations for funny ragdoll -->
    <RigidBody
        bind:rigidBody
        enabledRotations={[false, false, false]}
    >
        <CollisionGroups memberships={[15]} filter={[0, 7]}>
            <Collider
                shape={'capsule'}
                args={[0.5, 0.3]}
                on:collisionenter={({ targetRigidBody }) => {
                    // @ts-ignore
                    if (targetRigidBody?.userData?.name === 'player') {
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
                    if (targetRigidBody?.userData?.name === 'player') {
                        // targetRigidBody.resetForces(true);
                    }
                }}
            />
            <Ybot currentActionKey="idle">
                <svelte:fragment slot="fallback">
                    <T.Mesh 
                        geometry={new CapsuleGeometry(0.3, 1.8 - 0.3 * 2)}
                        material={new MeshBasicMaterial({ color: 0xff0000 })}
                    />
                </svelte:fragment>
            </Ybot>
        </CollisionGroups>
    </RigidBody>
</T.Group>