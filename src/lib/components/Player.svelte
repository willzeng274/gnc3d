<script lang="ts">
  import type { RigidBody as RapierRigidBody, Collider as RapierCollider } from '@dimforge/rapier3d-compat';
  import { T, useFrame } from '@threlte/core';
  import { RigidBody, CollisionGroups, Collider } from '@threlte/rapier';
  import { AudioListener, Audio } from '@threlte/extras';
  import { onDestroy } from 'svelte';
  import { PerspectiveCamera, Vector3, CapsuleGeometry, MeshBasicMaterial, Group, Euler, Quaternion } from 'three';
  // import { OrbitControls as ObC } from 'three/examples/jsm/controls/OrbitControls';
  import PointerLockControls from './PointerLockControls.svelte';
  import Controller from './ThirdPersonControls.svelte';
  import { playerPos, death, score, playerLinvel, playerAnimation, playerRotation, socket, freeze } from '$lib/store';
  // import Xbot from './models/Xbot.svelte'
	import Ybot from './models/Ybot.svelte';
  import Xbot from './models/Xbot.svelte';
	import Wizard from './models/Wizard.svelte';
  import Username from './Username.svelte';
	// import { HTML } from '@threlte/extras';
	// import { plane } from '$lib/store';
	// import { width, x_units, y_units, height as mapHeight } from '$lib/constants';
  // import SceneBackup from './Scene_backup.svelte';
  // const { world } = useRapier();
  export let sex: boolean;
  export let host: boolean;
  export let isWizardUnlocked: boolean;
  export let username: string;
  let isPLOCK = false;
  // export let position: [x: number, y: number, z: number];
  let radius = 0.45 // used to be 0.3
  let height = 2 // used to be 1.7
  export let speed = 6
  let rigidBody: RapierRigidBody | undefined;
  let lock: undefined | (() => void);
  let cam: PerspectiveCamera;
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
        if (rigidBody) {
          // the player might've left by now
          rigidBody.setTranslation({
            x: host ? 0 : Math.floor(Math.random() * 200) - 100,
            y: 10,
            z: host ? 3 : Math.floor(Math.random() * 200) - 100
          }, false);
          rigidBody.setLinvel({
            x: 0,
            y: 0,
            z: 0
          }, true);
        }
        death.set(false);
      }, 5000)
    }
  }
  const t = new Vector3();
  // let characterController = world.createCharacterController(0.01);
  // characterController.enableAutostep(1, 0.01, true);
  // characterController.enableSnapToGround(0.5);
  // const lockControls = () => lock();
  // const { renderer } = useThrelte();
  // renderer.domElement.addEventListener('click', lockControls)
  onDestroy(() => {
    rigidBody = undefined;
  })
  $: {
    console.log(isPLOCK);
    if (isPLOCK && lock) {
      lock();
    }
  }

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
      currentActionKey = 'tpose';
    } else if (!ground) {
      currentActionKey = 'fall';
    } else if (!(right || left || forward || backward)) {
      currentActionKey = 'idle';
    } else if (shift) {
      currentActionKey = 'running'
    } else {
      currentActionKey = 'walk';
    }
    playerAnimation.set(currentActionKey);
    // console.log(currentActionKey)
  }
  let prevPos = 0;
  let velY = 0;
  // let prevVel = 0;
  useFrame((_, deltaTime) => {
    // console.log("FPS: ", 1 / deltaTime);
    if (!rigidBody || !capsule || $death) return;
    if (host && $freeze > 0) {
      const linv = rigidBody.linvel();
      linv.x = 0;
      linv.z = 0;
      rigidBody.setLinvel(linv, true);
      playerLinvel.set([0, linv.y, 0])
      return;
    }
    // sex nerf will be an option in the lobby menu
    // const multi = sex ? (shift ? 10 : 5) : (shift ? 0.5 : 0.1);
    const multi = shift ? 1 : 0.5;
    // const multi = shift ? 10 : 8;
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
    // t.y = 0;
    // t.y = 1;
    // finally set the velocities and wake up the body
    const pos = rigidBody.translation();
    velY = (pos.y - prevPos) / deltaTime;
    // console.log((velY - prevVel) / deltaTime);
    prevPos = pos.y;

    if (prevPos < -23 && ground) {
      isWizardUnlocked = true;
    }
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

    // add isPLOCK condition here if necessary
    if ((right || left || forward || backward)) {
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
        if (!ground || $death || !rigidBody) break;
        const livVel = rigidBody.linvel()
        livVel.y = 5;
        // livVel.y = 30;
        rigidBody.setLinvel(livVel, true) 
        // const tl = rigidBody.translation();
        // tl.y = 500;
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

<T.PerspectiveCamera
  makeDefault
  fov={120}
  bind:ref={cam}
>
  {#if isPLOCK}
    <PointerLockControls bind:lock bind:object={capRef} bind:plock={isPLOCK} />
  {:else}
    <Controller bind:object={capRef} bind:plock={isPLOCK} />
  {/if}
  <AudioListener />
</T.PerspectiveCamera>

<Audio src={'/audio/ocean.mp3'} autoplay loop volume={0.2} />

<T.Group
  bind:ref={capsule}
  position={$playerPos}
  rotation.y={Math.PI}
>
  <Username {username} ypos={$playerPos[1]} />
  <RigidBody 
    bind:rigidBody
    enabledRotations={[false, false, false]}
    userData={{ name: "player" }}
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
          // if (e.targetRigidBody) {
          //   return;
          // }
          // console.log(e.targetCollider.handle);
          if (e.targetRigidBody) {
            // @ts-ignore
            if (e.targetRigidBody.userData?.name === "ground") {
              ground = true;
              // console.log("GROUND NOW")
              if (velY < -10 && rigidBody) {
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
            if (host) {
              // @ts-ignore
              if (e.targetRigidBody.userData?.name === "player2") {
                // @ts-ignore
                $socket?.send(new Uint8Array([2, e.targetRigidBody.userData?.id]));
              }
              // host cannot die to water
              return;
            }
            // @ts-ignore
            if (e.targetRigidBody.userData?.name === "water") death.set(true);
          }
        }}
        on:collisionexit={e => {
          // @ts-ignore
          if (e.targetRigidBody && e.targetRigidBody.userData?.name === "ground" && rigidBody) {
            ground = false;
            rigidBody.resetForces(false);
          }
          // (e.targetRigidBody || e.targetCollider.handle !== 0) || [(ground = false), rigidBody.resetForces(true)/* console.log */]
        }}
      />
      {#if !isPLOCK}
        {#if isWizardUnlocked}
          <Wizard bind:ref={model} />
        {:else if sex}
          <Ybot bind:currentActionKey bind:ref={model}>
            <svelte:fragment slot="fallback">
              <T.Mesh 
                geometry={new CapsuleGeometry(0.3, 1.8 - 0.3 * 2)}
                material={new MeshBasicMaterial({ color: 0xff0000 })}
              />
            </svelte:fragment>
          </Ybot>
        {:else}
          <Xbot bind:currentActionKey bind:ref={model}>
            <svelte:fragment slot="fallback">
              <T.Mesh 
                geometry={new CapsuleGeometry(0.3, 1.8 - 0.3 * 2)}
                material={new MeshBasicMaterial({ color: 0xff0000 })}
              />
            </svelte:fragment>
          </Xbot>
        {/if}
      {:else}
          <T.Mesh
            geometry={new CapsuleGeometry(0.3, 1.8 - 0.3 * 2)}
            material={new MeshBasicMaterial({ transparent: true, opacity: 0 })}
          />
      {/if}
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