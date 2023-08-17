<script lang="ts">
  import type * as THREE from 'three'
  import { Group, Box3, Vector3, SkinnedMesh, Skeleton } from 'three'
  import { T, forwardEventHandlers } from '@threlte/core'
  import { useGltf, useGltfAnimations } from '@threlte/extras'
  import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
	// import { Collider } from '@threlte/rapier';

  // type $$Props = Props<THREE.Group> & { currentActionKey: ActionName }
  // type $$Events = Events<THREE.Group>
  // type $$Slots = Slots<THREE.Group> & { fallback: {}; error: { error: any } }

  export let ref = new Group()	
  export let currentActionKey: ActionName = 'idle'	
  let action: ActionName = 'idle';
  type ActionName = "agree" | "headShake" | "idle" | "run" | "sad_pose" | "sneak_pose" | "walk";
  type GLTFResult = {
    nodes: {
      Beta_Joints: THREE.SkinnedMesh,
      Beta_Surface: THREE.SkinnedMesh
      mixamorigHips: THREE.Bone
    }
    materials: {
      Beta_Joints_MAT: THREE.MeshStandardMaterial,
      ['asdf1:Beta_HighLimbsGeoSG2']: THREE.MeshStandardMaterial
    }
  }
  // let curr: ThrelteGltf<GLTFResult>;
  const gltf = useGltf<GLTFResult>('/models/Xbot-transformed.glb', {"useDraco":true});
  export const { actions, mixer } = useGltfAnimations<ActionName>(gltf, ref)
  let group: THREE.Group
  // let bones: THREE.Skeleton, g1: THREE.Mesh<THREE.BufferGeometry>, g2: THREE.Mesh<THREE.BufferGeometry>, s1: THREE.Skeleton, s2: THREE.Skeleton, m1: THREE.Material, m2: THREE.Material;
  // let mesh1: THREE.SkinnedMesh, mesh2: THREE.SkinnedMesh;
	const component = forwardEventHandlers()
  $: $actions[action]?.play()
  $: $actions[currentActionKey] && transitionTo(currentActionKey, 0.2)
  // $: {
  //   if ($gltf) {
      // newCharacter.scene = SkeletonUtils.clone($gltf.)
      // bones = new Skeleton([$gltf.nodes.mixamorigHips.clone()]);
      // mesh1 = new SkinnedMesh($gltf.nodes.Beta_Joints.geometry.clone(), $gltf.materials.Beta_Joints_MAT.clone());
      // mesh2 = new SkinnedMesh($gltf.nodes.Beta_Surface.geometry.clone(), $gltf.materials['asdf1:Beta_HighLimbsGeoSG2'].clone());
      // // g1 = $gltf.nodes.Beta_Joints.geometry.clone();
      // // g2 = $gltf.nodes.Beta_Surface.geometry.clone();
      // // s1 = $gltf.nodes.Beta_Joints.skeleton.clone();
      // mesh1.add(bones.bones[0]);
      // const sk1 = $gltf.nodes.Beta_Joints.skeleton.clone();
      // for (let i = 0; i < sk1.bones.length; i++) {
      //   mesh1.add(sk1.bones[i]);
      // }
      // mesh1.bind(bones);
      // mesh2.add(bones.bones[0]);
      // const sk2 = $gltf.nodes.Beta_Surface.skeleton.clone();
      // for (let i = 0; i < sk2.bones.length; i++) {
      //   mesh1.add(sk2.bones[i]);
      // }
      // mesh2.bind(bones);
      // s2 = $gltf.nodes.Beta_Surface.skeleton.clone();
      // m1 = $gltf.materials.Beta_Joints_MAT.clone();
      // m2 = $gltf.materials['asdf1:Beta_HighLimbsGeoSG2'].clone();
      // const newBone = $gltf.nodes.mixamorigHips.clone();
      // const clonedSkinnedMesh = SkeletonUtils.clone($gltf.nodes.Beta_Joints);
      // const clonedSkinnedMesh2 = SkeletonUtils.clone($gltf.nodes.Beta_Surface);
      // const clonedSkinnedMesh = $gltf.nodes.Beta_Joints.clone();
      // const clonedSkinnedMesh2 = $gltf.nodes.Beta_Surface.clone();
      // newBone.add(clonedSkinnedMesh);
      // newBone.add(clonedSkinnedMesh2);
      // clonedSkinnedMesh.position.set(0, 0, 0);
      // clonedSkinnedMesh.rotation.set(0, 0, 0);
      // clonedSkinnedMesh2.position.set(0, 0, 0);
      // clonedSkinnedMesh2.rotation.set(0, 0, 0);
      // clonedSkinnedMesh.updateMatrixWorld(true);
      // clonedSkinnedMesh2.updateMatrixWorld(true);
      // curr = {
      //   ...$gltf,
      //   nodes: {
      //     Beta_Joints: clonedSkinnedMesh,
      //     Beta_Surface: clonedSkinnedMesh2,
      //     mixamorigHips: newBone
      //   },
      //   materials: {
      //     Beta_Joints_MAT: $gltf.materials.Beta_Joints_MAT.clone(),
      //     "asdf1:Beta_HighLimbsGeoSG2": $gltf.materials['asdf1:Beta_HighLimbsGeoSG2'].clone()
      //   },
      // };
  //   }
  // }
  // $: [transitionTo(currentActionKey, 0.2), $actions]
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
  <!-- {#if bones && mesh1 && mesh2} -->
    <T.Group name="Scene" >
      <T.Group
        name="Armature"
        rotation={[0, 0, 0,]}
        scale={0.01}
        bind:ref={group}
        on:create={({ ref }) => {
          // const newScene = SkeletonUtils.clone(gltf.scene);
          // let geoms = {}
          // let mats = {}
          // newScene.traverse(e=>e.isMesh&&(geoms[e.geometry.uuid]=e.geometry))
          // newScene.traverse(e=>e.isMesh&&(mats[e.material.uuid]=e.material))
          // let geometries = Object.values(geoms);
          // let materials = Object.values(mats);
          // newScene.traverse(e=>e.isMesh && (e.material.wireframe=!e.material.wireframe))
          // ref.add(newScene)
          // ref.add(new SkinnedMesh(geoms.Beta_Surface, mats.Beta_Surface, ));
          ref.updateMatrixWorld(true);
          let completeBoundingBox = new Box3().setFromObject(ref);
          let v3 = new Vector3();
          completeBoundingBox.getCenter(v3);
          ref.position.set(-v3.x, -v3.y, -v3.z)
        }}
      >
        <T is={gltf.nodes.mixamorigHips} />
        <T.SkinnedMesh
          name="Beta_Joints"
          geometry={gltf.nodes.Beta_Joints.geometry}
          material={gltf.materials['Beta_Joints_MAT']}
          skeleton={gltf.nodes.Beta_Joints.skeleton}
        />
        <T.SkinnedMesh 
          name="Beta_Surface"
          geometry={gltf.nodes.Beta_Surface.geometry}
          material={gltf.materials['asdf1:Beta_HighLimbsGeoSG2']}
          skeleton={gltf.nodes.Beta_Surface.skeleton} 
        />
        <!-- <T is={bones} />
        <T is={mesh1} />
        <T is={mesh2} /> -->
        <!-- <T.SkinnedMesh
          name="Beta_Joints"
          geometry={g1}
          material={m1}
          skeleton={s1}
        /> -->
        <!-- <T.SkinnedMesh 
          name="Beta_Surface"
          geometry={g2}
          material={m2}
          skeleton={s2} 
        /> -->
      </T.Group>
    </T.Group>
  <!-- {/if} -->
  {:catch error}
    <slot name="error" {error} />
  {/await}
  <slot {ref} />
</T>