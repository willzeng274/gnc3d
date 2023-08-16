<script lang="ts">
  import type { RigidBody as RapierRigidBody, Collider as RapierCollider } from '@dimforge/rapier3d-compat'
  import { T, useFrame } from '@threlte/core'
  import { RigidBody, CollisionGroups, Collider, useRapier } from '@threlte/rapier'
  // import { onDestroy } from 'svelte'
  import CakeGen from './CakeGen.svelte'
  import { PerspectiveCamera, Vector3, CapsuleGeometry, Euler, MeshBasicMaterial, MeshStandardMaterial, Mesh, Group } from 'three'
  // import PointerLockControls from './PointerLockControls.svelte'
  import Controller from './ThirdPersonControls.svelte'
  // import Xbot from './models/Xbot.svelte'
	import Ybot from './models/Ybot.svelte';
	import type { lerp } from 'three/src/math/MathUtils';
  // import SceneBackup from './Scene_backup.svelte';
  const { rapier, world } = useRapier();
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
  let model: THREE.Group = new Group()
  let ground = false;
  let capsule: THREE.Group
  let capRef: THREE.Group
  let collider: RapierCollider
  let currentActionKey: any = 'idle'
  $: if (capsule) {
    capRef = capsule
  }
  const t = new Vector3()
  let characterController = world.createCharacterController(0.01);
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
  //   if (collider) {
  //     console.log(colliderObjects.get(collider.handle))
  //     console.log(model)
  //     colliderObjects.get(collider.handle)?.attach(model)
  //   }
  // }
  $: {
    if (!ground) {
      currentActionKey = 'fall'
    } else if (!(right || left || forward || backward)) {
      currentActionKey = 'idle'
    } else {
      currentActionKey = 'walk'
    }
  }
  useFrame(() => {
    if (!rigidBody || !capsule) return
    // get direction
    // const velVec = t.fromArray([0, 0, backward - forward])
    const multi = 1;
    const velVec = t.fromArray([(right - left) * multi, 0, (backward - forward) * multi])
    // sort rotate and multiply by speed
    velVec.applyEuler(cam.rotation).multiplyScalar(speed)
    // velVec.applyEuler(new Euler().copy(capsule.rotation)).multiplyScalar(speed)
    // don't override falling velocity
    const linVel = rigidBody.linvel()
    t.y = linVel.y
    // finally set the velocities and wake up the body
    rigidBody.setLinvel(t, true)
    // when body position changes update position prop for camera
    const pos = rigidBody.translation()
    // const translation = rigidBoddy
    position = [pos.x, pos.y, pos.z]
    // characterController.computeColliderMovement(
    //   collider,
    //   {
    //     x: rigidBody.translation
    //   }
    // )
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
    switch (e.key) {
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
      default:
        break
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    switch (e.key) {
      case 's':
        backward = 0
        break
      case 'w':
        forward = 0
        break
      case 'a':
        left = 0
        break
      case 'd':
        right = 0
        break
      case ' ':
        if (!ground) break;
        const livVel = rigidBody.linvel()
        livVel.y = 5;
        // livVel.y = 100;
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
<!-- <dialog class="d">{t.y} and {jump}</dialog> -->
<CakeGen />
<T.Group position.y={0.9}>
  <T.PerspectiveCamera
    makeDefault
    fov={90}
    bind:ref={cam}
    position.x={position[0]}
    position.y={position[1]}
    position.z={position[2]}
    on:create={({ ref }) => {
      ref.lookAt(new Vector3(0, 2, 0))
    }}
  >
    <Controller bind:object={capRef} />
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
    <CollisionGroups groups={[0]}>
      <Collider
        bind:collider
        shape={'capsule'}
        args={[height / 2 - radius, radius]}
        on:collisionenter={e => e.targetRigidBody || (ground = true)}
        on:collisionexit={e => e.targetRigidBody || (ground = false)}
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
  /* .d {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
  } */
</style>
