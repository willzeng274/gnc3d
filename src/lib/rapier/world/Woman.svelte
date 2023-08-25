<script lang="ts">
    import { T } from "@threlte/core";
    import { CollisionGroups, Collider, RigidBody } from "@threlte/rapier";
    import Xbot from '../../components/models/Xbot.svelte';
    import { Vector3 } from "three";
    import type { Group } from "three";
	import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
    import { death, freeze, playerPos, score } from "$lib/store";
	import type { ActionName } from "$lib/types";
    let inside = false;
    let rigidBody: RapierRigidBody;
    let playerRigid: RapierRigidBody;
    // export let position: [number, number, number] = [0, 10, 3];
    let xbotRef: Group;
    let currentActionKey: ActionName = 'running';
    // let selfRotate: [number, number, number] = [0, 0, 0];
    const axisY = new Vector3(0, 1, 0);
    export let selfPos: [number, number, number] = [10, 8, 10];
    freeze.subscribe((fr) => {
        // alert(fr);
        if (fr) {
            currentActionKey = 'tpose';
        } else {
            currentActionKey = 'running';
        }
    });
    $: {
        if ($playerPos && xbotRef && rigidBody && !$death) {
            // a - 2.5 and b + 3.5 if refreshed?? Idk
            const a: number = $playerPos[0] - selfPos[0], b: number = $playerPos[2] - selfPos[2], c: number = Math.sqrt(a**2 + b**2);
            console.log($score / 100);
            const speed = $freeze ? 0 : ($score / 1000 + 0.1) / c;
            // const speed = $freeze ? 0 : 0.2 / c;
            // console.log(position);
            // console.log(selfPos, "distance: ", c);
            // selfPos[0] += a*speed;
            // selfPos[2] += b*speed;
            const lv = rigidBody.linvel();
            const translation = rigidBody.translation();
            selfPos[0] = translation.x;
            selfPos[1] = translation.y;
            selfPos[2] = translation.z;
            if (translation.y < -10) {
                lv.y += 15;
            }
            rigidBody.setLinvel({
                x: a*speed * 30,
                y: lv.y,
                z: b*speed * 30
            }, true);
            // rigidBody.setLinvel({
            //     x: 0,
            //     y: 0,
            //     z: 0
            // }, false);
            // rigidBody.setTranslation({
            //     x: selfPos[0],
            //     y: 1,
            //     z: selfPos[2]
            // }, true);
            // currentActionKey = 'sad_pose';
            // Need to add 90 degrees for some reason
            xbotRef.setRotationFromAxisAngle(axisY, -(Math.atan2(b, a) - Math.PI / 2));
        } else if ($death) {
            selfPos = [10, 2, 10];
        }
    }
    $: {
        if (inside && playerRigid) {
            const v = playerRigid.linvel();
            const p = playerRigid.translation();
            // v.x = -v.x;
            // v.y = 100;
            // v.z = -v.z;
            const a: number = $playerPos[0] - selfPos[0], b: number = $playerPos[2] - selfPos[2], c: number = Math.sqrt(a**2 + b**2);
            playerRigid.setTranslation({
                x: p.x - v.x / 2 + a*($freeze ? 0 : 0.1 / c)*2,
                y: p.y + 0.5,
                z: p.z - v.z / 2 + b*($freeze ? 0 : 0.1 / c)*2
            }, false);
            playerRigid.setLinvel({
                x: -v.x,
                y: v.y,
                z: -v.z
            }, true);
        }
    }
</script>

<T.Group position={selfPos} rotate={[0, Math.PI, 0]}>
    <!-- enable rotations for funny ragdoll -->
    <RigidBody
        bind:rigidBody
        enabledRotations={[false, false, false]}
    >
        <CollisionGroups groups={[0]}>
            <Collider
                shape={'capsule'}
                args={[0.5, 0.3]}
                on:collisionenter={({ targetRigidBody }) => {
                    // @ts-ignore
                    if (targetRigidBody?.userData?.name === 'player') {
                        death.set(true);
                        // console.log("Adding force NOW!")
                        // const v = targetRigidBody.linvel();
                        // targetRigidBody.addForce({ x: -Math.sign(v.x) * 2000, y: 2000, z: -Math.sign(v.z)  * 2000}, true);
                        // targetRigidBody.addForce({ x: 0, y: 2000, z: 0}, true);
                        // targetRigidBody.applyImpulse({ x: 0, y: 2000, z: 0 }, true);
                    // @ts-ignore
                    } else if (targetRigidBody?.userData?.name === 'water') {
                        const tl = rigidBody.translation();
                        tl.y = 1;
                        rigidBody.setTranslation(tl);
                    }
                }}
                on:collisionexit={({ targetRigidBody }) => {
                    // @ts-ignore
                    if (targetRigidBody?.userData?.name === 'player') {
                        targetRigidBody.resetForces(true);
                    }
                }}
            />
            <Xbot {currentActionKey} bind:ref={xbotRef} />
            <!-- <Collider
                shape="ball"
                args={[2]}
                sensor
                on:sensorenter={({ targetRigidBody }) => {
                    // @ts-ignore
                    if (targetRigidBody?.userData?.name === 'player') {
                        // rigidBody = targetRigidBody;
                        playerRigid = targetRigidBody
                        // console.log("Adding force NOW!")
                        // console.log("TORQUE")
                        inside = true;
                        // const v = targetRigidBody.linvel();
                        // const p = targetRigidBody.translation();
                        // // v.x = -v.x;
                        // // v.y = 100;
                        // // v.z = -v.z;
                        // targetRigidBody.setTranslation({
                        //     x: p.x - v.x / 30,
                        //     y: p.y + 0.2,
                        //     z: p.z - v.z / 30
                        // }, false);
                        // targetRigidBody.setLinvel({
                        //     x: -v.x,
                        //     y: v.y,
                        //     z: -v.z
                        // }, true);
                    }
                }}
                on:sensorexit={({ targetRigidBody }) => {
                    // @ts-ignore
                    if (targetRigidBody?.userData?.name === 'player') {
                        // console.log("NO TORQUE");
                        inside = false;
                        // targetRigidBody.setLinvel({
                        //     x: 0,
                        //     y: 0,
                        //     z: 0,
                        // }, true)
                        // targetRigidBody.resetTorques(true);
                        // targetRigidBody.resetForces(true);
                    }
                }}
            /> -->
        </CollisionGroups>
    </RigidBody>
</T.Group>