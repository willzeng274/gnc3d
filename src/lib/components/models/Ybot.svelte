<script lang="ts">
  import type * as THREE from 'three'
  import { Group, Box3, Vector3, MeshStandardMaterial } from 'three'
  import { T, forwardEventHandlers } from '@threlte/core'
  import { useGltf, useGltfAnimations } from '@threlte/extras'
  import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'

  // type $$Props = Props<THREE.Group>
  // type $$Events = Events<THREE.Group>
  // type $$Slots = Slots<THREE.Group> & { fallback: {}; error: { error: any } }

  export let ref = new Group();
  export let currentActionKey: ActionName = 'idle';
  let action: ActionName = 'idle';

  type ActionName = "idle" | "jump" | "running" | "tpose" | "walk" | "fall";
  type GLTFResult = {
    nodes: {
      Alpha_Joints: THREE.SkinnedMesh,Alpha_Surface: THREE.SkinnedMesh
      mixamorigHips: THREE.Bone
    }
    materials: {
      ['Alpha_Joints_MAT.001']: THREE.MeshStandardMaterial,
      ['Alpha_Body_MAT.001']: THREE.MeshStandardMaterial
    }
  }

  // const gltf = useGltf<GLTFResult>('/models/ybot-transformed.glb', {"useDraco":true});
  const gltf = useGltf<GLTFResult>('/models/ybot.glb');
  export const { actions, mixer } = useGltfAnimations<ActionName>(gltf, ref)
  // let group: THREE.Group
	const component = forwardEventHandlers();
  $: $actions[action]?.play();
  $: $actions[currentActionKey] && transitionTo(currentActionKey, 0.2);
  function transitionTo(nextActionKey: ActionName, duration = 1) {
    // console.log("Called", nextActionKey, action)
    const currentAction = $actions[action]
    const nextAction = $actions[nextActionKey]
    if (!nextAction || currentAction === nextAction) return
    // console.log(nextActionKey)
    // Function inspired by: https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
    nextAction.enabled = true
    if (currentAction) {
      currentAction.crossFadeTo(nextAction, duration, true)
    }
    // Not sure why I need this but the source code does not
    nextAction.play()
    action = nextActionKey
    // currentActionKey = nextActionKey
  }
</script>

<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>
  {#await gltf}
    <slot name="fallback" />
  {:then gltf}
    <!-- {#if transparent}
      <T.Mesh
        material={new MeshStandardMaterial({
          transparent: true,
          opacity: 0
        })}
      >
        <T.BoxGeometry args={[1, 2, 1]} />
      </T.Mesh>
    {:else} -->
      <T 
        is={SkeletonUtils.clone(gltf.scene)}
        name="Scene"
        on:create={({ ref }) => {
          console.log(ref)
          ref.updateMatrixWorld(true);
          let completeBoundingBox = new Box3().setFromObject(ref);
          let v3 = new Vector3();
          completeBoundingBox.getSize(v3);
          ref.position.set(0, -v3.y / 2, 0);
          // ref.updateMatrixWorld(true);
        }}
      />
      <!-- <T.Group name="Scene" >
        <T.Group
          name="Armature"
          rotation={[Math.PI / 2, 0, 0,]}
          scale={0.01}
          bind:ref={group}
          on:create={({ ref }) => {
            console.log(ref);
            ref.updateMatrixWorld(true);
            let completeBoundingBox = new Box3().setFromObject(ref);
            let v3 = new Vector3();
            completeBoundingBox.getCenter(v3);
            ref.position.set(-v3.x, -v3.y, -v3.z)
          }}
        >
          <T is={gltf.nodes.mixamorigHips} />
          <T.SkinnedMesh name="Alpha_Joints" geometry={gltf.nodes.Alpha_Joints.geometry} material={gltf.materials['Alpha_Joints_MAT.001']} skeleton={gltf.nodes.Alpha_Joints.skeleton} />
          <T.SkinnedMesh name="Alpha_Surface" geometry={gltf.nodes.Alpha_Surface.geometry} material={gltf.materials['Alpha_Body_MAT.001']} skeleton={gltf.nodes.Alpha_Surface.skeleton} />
        </T.Group>
      </T.Group> -->
    <!-- {/if} -->
  {:catch error}
    <slot name="error" {error} />
  {/await}
  <slot {ref} />
</T>
	