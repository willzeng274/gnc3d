<script lang="ts">
  import { score, socket } from '$lib/store';
  import { T } from '@threlte/core'
  import { HTML, useGltf, useSuspense } from '@threlte/extras'
  import { AutoColliders, RigidBody } from '@threlte/rapier'
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
  export let host: boolean = true;
  export let id: number;
  const suspend = useSuspense();
  const gltf = suspend(useGltf<{
    nodes: {
      'spider_cookie': Mesh
    }
    materials: {
      Material_MR: MeshStandardMaterial
    }
  }>('/models/cake.glb'));
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
  <!-- This is for debugging during multiplayer -->
  <!-- <T.Group
    position={position}
  >
    <HTML>
      <h1 style="color: red;">{id}</h1>
    </HTML>
  </T.Group> -->
  <T.Group
    position={[position[0] * 10, position[1] * 10, position[2] * 10]}
    rotation={[rotation[0] * 10, rotation[1] * 10, rotation[2] * 10, rotation[3]]}
    scale={0.1}
  >
    <RigidBody type={'dynamic'} on:collisionenter={({ targetRigidBody }) => {
      // host can score cakes so I don't have to care about physics not syncing
      if (targetRigidBody?.userData?.name === "player" && ($socket == null || host)) {
        $socket?.send(new Float32Array([4, id]));
        touch = 1;
        score.update((score) => score + 1);
        // TODO: fix this
      } else if (targetRigidBody?.userData?.name === "water") {
        // alert("TOUCHING WATER");
        touch = 2;
      } else if (targetRigidBody?.userData?.name === "player2" && host) {
        // man I wish I can do Uint16
        console.log("player touched cake");
        $socket?.send(new Float32Array([4, id]));
        touch = 1;
        score.update((score) => score + 1);
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
{:else}
  <HTML>
    <div>HELP</div>
  </HTML>
{/if}

<!-- color picker lol -->

<!-- <style>
  body {
    color: #ffd500;
  }
</style> -->
