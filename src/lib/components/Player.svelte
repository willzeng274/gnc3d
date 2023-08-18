<script lang="ts">
  import type { RigidBody as RapierRigidBody, Collider as RapierCollider } from '@dimforge/rapier3d-compat'
  import { T, useFrame } from '@threlte/core'
  import { RigidBody, CollisionGroups, Collider, useRapier } from '@threlte/rapier'
  // import { onDestroy } from 'svelte'
  import { PerspectiveCamera, Vector3, CapsuleGeometry, MeshBasicMaterial, Group, Euler, Quaternion, Matrix4 } from 'three';
  // import { OrbitControls as ObC } from 'three/examples/jsm/controls/OrbitControls';
  // import PointerLockControls from './PointerLockControls.svelte'
  import Controller from './ThirdPersonControls.svelte'
  import { playerPos, death, score, playerLinvel, playerAnimation, playerRotation } from '$lib/store';
  // import Xbot from './models/Xbot.svelte'
	import Ybot from './models/Ybot.svelte';
	// import { HTML } from '@threlte/extras';
	// import { plane } from '$lib/store';
	// import { width, x_units, y_units, height as mapHeight } from '$lib/constants';
  // import SceneBackup from './Scene_backup.svelte';
  // const { world } = useRapier();
  // export let position: [x: number, y: number, z: number];
  let radius = 0.45 // used to be 0.3
  let height = 2 // used to be 1.7
  export let speed = 6
  let rigidBody: RapierRigidBody
  // let lock: () => void
  let cam: PerspectiveCamera
  let forward = 0
  let backward = 0
  let left = 0
  let right = 0
  let shift = 0
  let model: THREE.Group = new Group()
  let ground = false;
  let capsule: THREE.Group
  let capRef: THREE.Group
  let collider: RapierCollider
  let currentActionKey: any = 'idle'
  // let death = false;
  $: if (capsule) {
    capRef = capsule
  }
  $: {
    if ($death) {
      score.set(0);
      setTimeout(() => {
        rigidBody.setTranslation({
          x: 0,
          y: 10,
          z: 3
        }, false);
        rigidBody.setLinvel({
          x: 0,
          y: 0,
          z: 0
        }, true);
        death.set(false);
      }, 5000)
    }
  }
  const t = new Vector3();
  // let characterController = world.createCharacterController(0.01);
  // characterController.enableAutostep(1, 0.01, true);
  // characterController.enableSnapToGround(0.5);
  // const lockControls = () => lock()
  // const { renderer } = useThrelte()
  // renderer.domElement.addEventListener('click', lockControls)
  // onDestroy(() => {
  //   renderer.domElement.removeEventListener('click', lockControls)
  // })
  $: rigidBody && (rigidBody.userData = {
    ...rigidBody.userData as object,
    name: "player"
  });

  // $: {
  //   console.log(position)
  //   if ($plane) {
  //     const realX = Math.round((Math.round(position[0] + (width / 2))/(width / x_units))) * 3;
	// 		// 201 * 3 for every z coordinate cycle
	// 		const realZ = (Math.round((mapHeight - Math.round(position[2] + (mapHeight / 2)))/(mapHeight / y_units))) * 3 * (y_units + 1);
	// 		const vertices = $plane;
  //     console.log(vertices[realX + realZ], vertices[realX + realZ + 2], vertices[realX + realZ + 1]);
  //   }
  // }
  
  $: {
    if ($death) {
      currentActionKey = 'tpose'
    } else if (!ground) {
      currentActionKey = 'fall'
    } else if (!(right || left || forward || backward)) {
      currentActionKey = 'idle'
    } else if (shift) {
      currentActionKey = 'running'
    } else {
      currentActionKey = 'walk'
    }
    playerAnimation.set(currentActionKey);
    // console.log(currentActionKey)
  }
  let prevPos = 0;
  let velY = 0;
  // let prevVel = 0;
  useFrame((_, deltaTime) => {
    // console.log("FPS: ", 1 / deltaTime);
    if (!rigidBody || !capsule || $death) return
    // get direction
    // const velVec = t.fromArray([0, 0, backward - forward])
    const multi = shift ? 1 : 0.5;
    // const multi = shift ? 10 : 8;
    // console.log(forward)
    // const velVec = t.fromArray([(right - left) * multi, 0, (backward - forward) * multi]);
    // const velVec = t.fromArray([0, 0, 0]);
    // sort rotate and multiply by speed
    // console.log("Before: ", velVec);
    // velVec.applyEuler(cam.rotation).multiplyScalar(speed);
    const cameraForward = new Vector3();
    const cameraRight = new Vector3();
    cam.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraForward, new Vector3(0, 1, 0));

    // Step 2: Project to 2D Plane
    cameraForward.y = 0;
    cameraRight.y = 0;

    // Step 3: Normalize
    cameraForward.normalize().multiplyScalar(-(backward - forward) * multi * speed);
    cameraRight.normalize().multiplyScalar((right - left) * multi * speed);
    if ((backward - forward) && (right - left)) {
      t.x = (cameraForward.x + cameraRight.x) * 0.7;
      t.z = (cameraForward.z + cameraRight.z) * 0.7;
    } else {
      t.x = cameraForward.x + cameraRight.x;
      t.z = cameraForward.z + cameraRight.z;
    }
    // velVec.applyEuler(new Euler().copy(capsule.rotation)).multiplyScalar(speed)
    // don't override falling velocity
    const linVel = rigidBody.linvel()
    t.y = linVel.y;
    // t.y = 1;
    // finally set the velocities and wake up the body
    const pos = rigidBody.translation();
    velY = (pos.y - prevPos) / deltaTime;
    // console.log((velY - prevVel) / deltaTime);
    prevPos = pos.y;
    // prevVel = velY;
    // weird behaviour with sensors? Idk how I fixed it
    // characterController.computeColliderMovement(
    //   collider,
    //   {
    //     // 30 frames apparently...
    //     x: t.x * deltaTime,
    //     y: t.y * deltaTime,
    //     z: t.z * deltaTime
    //   },
    //   undefined,
    //   15
    // );
    // let correctedMovement = characterController.computedMovement();
    // t.x = correctedMovement.x / deltaTime;
    // t.y = correctedMovement.y / deltaTime;
    // t.z = correctedMovement.z / deltaTime;
    // console.log(correctedMovement)
    // console.log(pos.y)
    // alert(pos.y + "\n" + t.y + "\n" + correctedMovement.y)
    rigidBody.setLinvel(t, true)
    // rigidBody.setLinvel(t, true)
    // when body position changes update position prop for camera
    playerLinvel.set([t.x, t.y, t.z]);
    playerPos.set([pos.x, pos.y, pos.z]);

    if (right || left || forward || backward) {
      // Calculate the angle based on linear velocities, and for some reason it is inverted by half a period
      const velAngle = Math.atan2(t.x, t.z) + Math.PI;

      // Calculate the target rotation based on the angle
      const targetRotation = new Quaternion();
      // YXZ!!! not sure if this was a typo, but if it works then I am not going to touch it.
      targetRotation.setFromEuler(new Euler(0, velAngle, 0, 'YXZ'));

      // Interpolate between current rotation and target rotation (slerp)
      const maxRotationSpeed = 0.1; // Adjust the speed of rotation
      model.quaternion.slerp(targetRotation, maxRotationSpeed);
      playerRotation.set([model.rotation.x, model.rotation.y, model.rotation.z]);
    }
  });
  function onKeyDown(e: KeyboardEvent) {
    // console.log("Down", e.key)
    switch (e.key.toLowerCase()) {
      case 's':
        backward = 1
        break
      case 'w':
        forward = 1
        break
      case 'a':
        left = 1
        break
      case 'd':
        right = 1
        break
      case 'shift':
        shift = 1
        break
      default:
        // alert(e.key)
        break
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    // console.log("Up", e.key)
    switch (e.key.toLowerCase()) {
      case 's':
        backward = 0
        break
      case 'w':
        // console.log("FORWARD = 0")
        forward = 0
        break
      case 'a':
        left = 0
        break
      case 'd':
        right = 0
        break
      case 'shift':
        shift = 0
        break
      case ' ':
        if (!ground || $death) break;
        const livVel = rigidBody.linvel()
        livVel.y = 5;
        // livVel.y = 30;
        rigidBody.setLinvel(livVel, true) 
        // const tl = rigidBody.translation();
        // tl.y += 50;
        // rigidBody.setTranslation(tl, true);
        break
      default:
        break
    }
  }
</script>
<svelte:window
  on:keydown|preventDefault={onKeyDown}
  on:keyup={onKeyUp}
/>

<!-- {#if $death}
  <HTML
    pointerEvents="none"
    position.x={$playerPos[0]}
    position.y={$playerPos[1]}
    position.z={$playerPos[2]}
  >
    {#key $death}
      <dialog
        class="display"
      >
        You died!
      </dialog>
    {/key}
  </HTML>
{/if} -->

<T.Group 
  position.y={0.9}
>
  <T.PerspectiveCamera
    makeDefault
    fov={120}
    bind:ref={cam}
  >
    <Controller bind:object={capRef} />
    <!-- <PointerLockControls bind:lock /> -->
  </T.PerspectiveCamera>
</T.Group>
<T.Group
  bind:ref={capsule}
  position={$playerPos}
  rotation.y={Math.PI}
>
  <RigidBody 
    bind:rigidBody
    enabledRotations={[false, false, false]}
  >
    <CollisionGroups groups={[0, 5]}>
      <!-- ground has e.targetCollider.handle = 0 -->
      <Collider
        bind:collider
        shape={'capsule'}
        friction={0}
        restitution={0.1}
        args={[height / 2 - radius, radius]}
        on:collisionenter={e => {
          if (e.targetRigidBody) {
            return;
          }
          console.log(e.targetCollider.handle);
          if (e.targetCollider.handle === 0) {
            ground = true;
            // console.log("GROUND NOW")
            if (velY < -10) {
              // alert("hmm");
              // console.log(velY)
              // This won't work if the character fell from > 3000 N of forces
              const v = rigidBody.linvel();
              const t = rigidBody.translation();
              rigidBody.setTranslation({ x: t.x, y: $playerPos[1] + 0.1, z: t.z }, false);
              rigidBody.setLinvel({ x: v.x, y: -(velY / 2), z: v.z }, true);
              // rigidBody.setTranslation(, true);
            }
          }
          // console.log(e.targetCollider.handle, e.targetCollider.handle === 5e-324)
          if (e.targetCollider.handle === 5e-324) death.set(true)
        }}
        on:collisionexit={e => (e.targetRigidBody || e.targetCollider.handle !== 0) || [(ground = false), rigidBody.resetForces(true)/* console.log */]}
      />
      <Ybot bind:currentActionKey bind:ref={model}>
        <svelte:fragment slot="fallback">
          <T.Mesh 
            geometry={new CapsuleGeometry(0.3, 1.8 - 0.3 * 2)}
            material={new MeshBasicMaterial({ color: 0xff0000 })}
          />
        </svelte:fragment>
      </Ybot>
    </CollisionGroups>
    <CollisionGroups groups={[15]}>
      <T.Group position={[0, -height / 2 + radius, 0]}>
        <Collider
          sensor
          shape={'ball'}
          args={[radius * 1.2]}
        />
      </T.Group>
    </CollisionGroups>
  </RigidBody>
</T.Group>