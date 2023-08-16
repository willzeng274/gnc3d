<script lang="ts">
  import type { RigidBody as RapierRigidBody, Collider as RapierCollider } from '@dimforge/rapier3d-compat'
  import { T, useFrame } from '@threlte/core'
  import { RigidBody, CollisionGroups, Collider, useRapier } from '@threlte/rapier'
  // import { onDestroy } from 'svelte'
  import { PerspectiveCamera, Vector3, CapsuleGeometry, MeshBasicMaterial, Group } from 'three';
  import type { OrbitControls as ObC } from 'three/examples/jsm/controls/OrbitControls';
  // import PointerLockControls from './PointerLockControls.svelte'
  // import Controller from './ThirdPersonControls.svelte'
  // import Xbot from './models/Xbot.svelte'
	import Ybot from './models/Ybot.svelte';
	import { HTML, OrbitControls } from '@threlte/extras';
	// import { plane } from '$lib/store';
	// import { width, x_units, y_units, height as mapHeight } from '$lib/constants';
  // import SceneBackup from './Scene_backup.svelte';
  const { world } = useRapier();
  export let position: [x: number, y: number, z: number] = [0, 0, 0]
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
  let capRef: ObC
  let collider: RapierCollider
  let currentActionKey: any = 'idle'
  let death = false;
  // $: if (capsule) {
  //   capRef = capsule
  // }
  $: {
    if (death) {
      setTimeout(() => {
        rigidBody.setTranslation({
          x: 0,
          y: 10,
          z: 3
        }, true);
        death = false
      }, 5000)
    }
  }
  const t = new Vector3()
  let characterController = world.createCharacterController(0.01);
  characterController.enableAutostep(0.5, 0.2, true);
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
    if (death) {
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
    // console.log(currentActionKey)
  }
  useFrame(() => {
    if (!rigidBody || !capsule || death) return
    // get direction
    // const velVec = t.fromArray([0, 0, backward - forward])
    const multi = 0.5 + shift;
    // console.log(forward)
    const velVec = t.fromArray([(right - left) * multi, 0, (backward - forward) * multi])
    // sort rotate and multiply by speed
    velVec.applyEuler(cam.rotation).multiplyScalar(speed)
    // velVec.applyEuler(new Euler().copy(capsule.rotation)).multiplyScalar(speed)
    // don't override falling velocity
    const linVel = rigidBody.linvel()
    t.y = linVel.y
    // finally set the velocities and wake up the body
    const pos = rigidBody.translation()
    // weird behaviour with sensors? Idk how I fixed it
    characterController.computeColliderMovement(
      collider,
      {
        x: t.x / 30,
        y: t.y / 30,
        z: t.z / 30
      },
      undefined,
      15
    );
    let correctedMovement = characterController.computedMovement();
    // console.log(pos.y)
    // alert(pos.y + "\n" + t.y + "\n" + correctedMovement.y)
    rigidBody.setTranslation({
      x: pos.x + correctedMovement.x,
      y: pos.y + correctedMovement.y,
      z: pos.z + correctedMovement.z
    }, true)
    // rigidBody.setLinvel(t, true)
    // when body position changes update position prop for camera
    position = [pos.x, pos.y, pos.z]
    capRef.update();
    
    if (right || left || forward || backward) {
      const tempCameraVector = new Vector3();
      const tempModelVector = new Vector3();
      const xAxis = new Vector3(1, 0, 0);
      cam.getWorldDirection(tempCameraVector);
      const cameraDirection = tempCameraVector.setY(0).normalize();
      
      // Get the X-Z plane in which player is looking to compare with camera
      model.getWorldDirection(tempModelVector);
      const playerDirection = tempModelVector.setY(0).normalize();

      // Get the angle to x-axis. z component is used to compare if the angle is clockwise or anticlockwise since angleTo returns a positive value
      const cameraAngle = cameraDirection.angleTo(xAxis) * (cameraDirection.z > 0 ? 1 : -1);
      const playerAngle = playerDirection.angleTo(xAxis) * (playerDirection.z > 0 ? 1 : -1);
      
      // Get the angle to rotate the player to face the camera. Clockwise positive
      const angleToRotate = playerAngle - cameraAngle;
      
      // Get the shortest angle from clockwise angle to ensure the player always rotates the shortest angle
      let sanitisedAngle = angleToRotate;
      if(angleToRotate > Math.PI) {
        sanitisedAngle = angleToRotate - 2 * Math.PI
      }
      if(angleToRotate < -Math.PI) {
        sanitisedAngle = angleToRotate + 2 * Math.PI
      }
      // Rotate the model by a tiny value towards the camera direction
      model.rotateY(
        Math.max(-0.15, Math.min(sanitisedAngle, 0.15))
      );
    }
  })
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
        if (!ground || death) break;
        const livVel = rigidBody.linvel()
        livVel.y = 5;
        // livVel.y = 30;
        rigidBody.setLinvel(livVel, true) 
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

{#if death}
  <HTML
    pointerEvents="none"
    position.x={position[0]}
    position.y={position[1]}
    position.z={position[2]}
  >
    {#key death}
      <dialog
        class="display"
      >
        You died!
      </dialog>
    {/key}
  </HTML>
{/if}

<T.Group 
  position.y={position[1]}
  position.x={position[0]}
  position.z={position[2]}
>
  <!-- position.x={position[0]}
    position.y={position[1]}
    position.z={position[2]}
    on:create={({ ref }) => {
      ref.lookAt(new Vector3(0, 2, 0))
    }} -->
  <T.PerspectiveCamera
    makeDefault
    fov={120}
    bind:ref={cam}
  >
    <OrbitControls
      enableZoom={true}
      target={position}
      bind:ref={capRef}
    />
    <!-- <Controller bind:object={capRef} /> -->
    <!-- <PointerLockControls bind:lock /> -->
  </T.PerspectiveCamera>
</T.Group>
<T.Group
  bind:ref={capsule}
  {position}
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
        args={[height / 2 - radius, radius]}
        on:collisionenter={e => {
          if (e.targetRigidBody) {
            return;
          }
          if (e.targetCollider.handle === 0) ground = true;
          // console.log(e.targetCollider.handle, e.targetCollider.handle === 5e-324)
          if (e.targetCollider.handle === 5e-324) death = true;
        }}
        on:collisionexit={e => (e.targetRigidBody || e.targetCollider.handle !== 0) || [(ground = false), /* console.log */]}
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

<style>
  .display {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background-color: red;
    width: 10em;
    height: 10em;
    user-select: none;
  }
</style>
