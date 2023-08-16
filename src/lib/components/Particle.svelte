<script
  lang="ts"
  context="module"
>
  // const geometry = new BoxGeometry(0.25, 0.25, 0.25)
  // const material = new MeshStandardMaterial()
</script>
<script lang="ts">
  import { score } from '$lib/store';
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { AutoColliders, Collider, RigidBody } from '@threlte/rapier'
  import type { Euler } from 'three'
  import { derived } from 'svelte/store'
  import { BoxGeometry, MeshStandardMaterial, Vector3, Mesh } from 'three'
  // import GLTFExporter from 'three-gltf-exporter';
  // import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
  // import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'

  export let position: Parameters<Vector3['set']>
  export let rotation: Parameters<Euler['set']>
  export let touch: boolean
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
    {position}
    {rotation}
    scale={0.1}
  >
    <RigidBody type={'dynamic'} on:collisionenter={({ targetRigidBody }) => {
      if (targetRigidBody?.userData?.name === "player") {
        touch = true;
        score.update((score) => score + 1);
      }
    }}>
      <AutoColliders shape='cuboid'>
        <T.Mesh
          castShadow
          geometry={$cake.geometry}
          material={$cake.material}
        />
      </AutoColliders>
    </RigidBody>
  </T.Group>
{/if}
