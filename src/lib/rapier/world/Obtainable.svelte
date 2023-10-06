<script lang="ts">
	import { Collider } from "@threlte/rapier";
    import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
	import { T, useFrame } from "@threlte/core";
	import { Mesh, MeshBasicMaterial, SphereGeometry } from "three";
	import { CSG } from "three-csg-ts";
	import { score } from "$lib/store";

    let playerRigid: RapierRigidBody;
    let inside: boolean = false;
    useFrame((_, dt) => {
        if (inside && playerRigid) {
            const v = playerRigid.linvel();
            const p = playerRigid.translation();
            // v.x = -v.x;
            // v.y = 100;
            // v.z = -v.z;
            playerRigid.setTranslation({
                x: p.x - Math.sign(v.x) * Math.abs(v.x) * dt * 2,
                y: p.y - v.y * 0.1,
                z: p.z - Math.sign(v.z) * Math.abs(v.z) * dt * 2
            }, false);
            playerRigid.setLinvel({
                x: -v.x,
                y: 0,
                z: -v.z
            }, true);
        }
    });

    const a = new Mesh(new SphereGeometry(10));
    const b = new Mesh(new SphereGeometry(8));
    // a.updateMatrix();
    // b.updateMatrix();
</script>

<T.Group position={[-100, 2, 200]}>
    <T is={CSG.subtract(a, b)} material={new MeshBasicMaterial({ color: 0x00000, opacity: 0.5, transparent: true })} />
    <Collider
        shape="ball"
        args={[10]}
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
    />
    <T.Group position={[0, -2, 0]}>
        <T.Mesh geometry={new SphereGeometry(2)} material={new MeshBasicMaterial({ color: 0xFFD700 })} />
        <Collider
            shape="ball"
            args={[2]}
            on:collisionenter={({ targetRigidBody }) => {
                // @ts-ignore
                if (targetRigidBody?.userData?.name === 'player') {
                    score.update(score => score+1);
                    alert("Damn");
                }
            }}
        >
        </Collider>
    </T.Group>
</T.Group>