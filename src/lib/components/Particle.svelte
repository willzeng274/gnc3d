<script lang="ts">
  import { score } from '$lib/store';
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { AutoColliders, Collider, RigidBody } from '@threlte/rapier'
  import type { Euler } from 'three'
  import { derived } from 'svelte/store'
  import { MeshStandardMaterial, Vector3, Mesh, MeshBasicMaterial } from 'three'
  // import GLTFExporter from 'three-gltf-exporter';
  // import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
  // import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'
  type cakeType = 'normal' | 'frozen' | 'gold';
  export let position: Parameters<Vector3['set']>
  export let rotation: Parameters<Euler['set']>
  export let touch: 0 | 1 | 2;
  export let type: cakeType;
  // let rigidBody: RapierRigidBody
  // $: rigidBody && (rigidBody.userData = {
  //   ...rigidBody.userData,
  //   name: "yeetusfetus"
  // })
  const gltf = useGltf<{
    nodes: {
      'spider_cookie': Mesh
    }
    materials: {
      Material_MR: MeshStandardMaterial
    }
  }>('/models/cake.glb')
  const cake = derived(gltf, (gltf) => {
    if (!gltf || !gltf.nodes['spider_cookie']) return
    // console.log(gltf.nodes.spider_cookie)
    var center = new Vector3();
    gltf.nodes.spider_cookie.geometry.computeBoundingBox();
    gltf.nodes.spider_cookie.geometry.boundingBox!.getCenter(center);
    // console.log(center);
    // gltf.nodes.spider_cookie.geometry.center()
    // console.log()
    // console.log(gltf.nodes.spider_cookie.position)
    // gltf.nodes.spider_cookie.geometry.boundingBox!.getCenter(center); 
    // console.log(center)
    // const loader = new GLTFExporter();
    // loader.parse(
    //   gltf.nodes.spider_cookie,
    //   function (gltf) {
    //     console.log(JSON.stringify(gltf));
    //   },
    //   function (error) {
    //     console.log(error);
    //   },
    // )
    return gltf.nodes['spider_cookie']
  })
</script>

{#if $cake}
  <T.Group
    position={[position[0] * 10, position[1] * 10, position[2] * 10]}
    rotation={[rotation[0] * 10, rotation[1] * 10, rotation[2] * 10, rotation[3]]}
    scale={0.1}
  >
    <RigidBody type={'dynamic'} on:collisionenter={({ targetCollider, targetRigidBody }) => {
      if (targetRigidBody?.userData?.name === "player") {
        touch = 1;
        score.update((score) => score + 1);
      } else if (targetCollider.handle === 5e-324) {
        // alert("TOUCHING WATER");
        touch = 2;
      }
    }}>
      <AutoColliders shape='cuboid'>
        <!-- $cake.material can suck my nuts -->
        <T.Mesh
          castShadow
          geometry={$cake.geometry}
          material={type === 'frozen' ? new MeshBasicMaterial({ color: 0x00f2ff }) : type === 'gold' ? new MeshBasicMaterial({ color: 0xffd500 }) : new MeshBasicMaterial({ color: 0x00000 })}
        />
      </AutoColliders>
    </RigidBody>
  </T.Group>
{/if}

<!-- color picker lol -->

<!-- <style>
  body {
    color: #ffd500;
  }
</style> -->
