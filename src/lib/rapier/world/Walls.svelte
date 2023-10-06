<script lang="ts">
	// import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import { T } from "@threlte/core";
	import { AutoColliders, Collider, RigidBody } from "@threlte/rapier";
	import { BoxGeometry, MeshStandardMaterial } from "three";

    // let playerRigid: RapierRigidBody;
    // let inside: boolean = false;
    // $: {
    //     if (inside && playerRigid) {
    //         const v = playerRigid.linvel();
    //         const p = playerRigid.translation();
    //         playerRigid.setTranslation({
    //             x: p.x - v.x / 2,
    //             y: p.y + 0.5,
    //             z: p.z - v.z / 2
    //         }, false);
    //         playerRigid.setLinvel({
    //             x: -v.x,
    //             y: v.y,
    //             z: -v.z
    //         }, true);
    //     }
    // }
</script>

<RigidBody type="fixed" userData={{ name: "structure" }}>
    <!-- <Collider
        shape="ball"
        args={[5]}
        sensor
        on:sensorenter={({ targetRigidBody }) => {
            // @ts-ignore
            if (targetRigidBody?.userData?.name === 'player') {
                playerRigid = targetRigidBody;
                inside = true;
            }
        }}
        on:sensorexit={({ targetRigidBody }) => {
            // @ts-ignore
            if (targetRigidBody?.userData?.name === 'player') {
                inside = false;
            }
        }}
    /> -->
    <AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
        <T.Mesh
            receiveShadow
            castShadow
            position.x={0}
            position.y={4.4}
            geometry={new BoxGeometry(1.75, 3.75, 0.15)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />
        <!-- used to be 2.55 in height -->
        <T.Mesh
            receiveShadow
            castShadow
            position.x={10 + 0.7 + 0.15}
            position.y={3.125}
            geometry={new BoxGeometry(20, 6.3, 0.15)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />

        <T.Mesh
            receiveShadow
            castShadow
            position.x={-10 - 0.7 - 0.15}
            position.y={3.125}
            geometry={new BoxGeometry(20, 6.3, 0.15)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />

        <T.Mesh
            receiveShadow
            castShadow
            position.x={-20 - 0.7 - 0.15}
            position.y={3.125}
            position.z={-10}
            geometry={new BoxGeometry(0.15, 6.3, 20)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />

        <T.Mesh
            receiveShadow
            castShadow
            position.x={20 + 0.7 + 0.15}
            position.y={3.125}
            position.z={-10}
            geometry={new BoxGeometry(0.15, 6.3, 20)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />

        <T.Mesh
            receiveShadow
            castShadow
            position.x={0}
            position.y={3.125}
            position.z={-20}
            geometry={new BoxGeometry(40 + 0.7 + 0.15 * 2 + 0.15 * 4, 6.3, 0.15)}
            material={new MeshStandardMaterial({
                transparent: true,
                opacity: 0.5,
                color: 0x333333,
            })}
        />
    </AutoColliders>
</RigidBody>