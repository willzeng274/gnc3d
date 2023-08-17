<script lang="ts">
  import { T, useFrame } from '@threlte/core'
  // import { Environment } from '@threlte/extras'
  import { AutoColliders, CollisionGroups, Debug } from '@threlte/rapier'
  import { spring } from 'svelte/motion'
  import { BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from 'three'
  import Door from '../rapier/world/Door.svelte'
  import Player from './Player.svelte'
  import Ground from '../rapier/world/Ground.svelte'
  import CakeGen from './CakeGen.svelte'
	// import Ybot from './models/Ybot.svelte';
	import Woman from '$lib/rapier/world/Woman.svelte';
  let playerMesh: Mesh
  let positionHasBeenSet = false
  export let seed: number;
  // let position: [number, number, number] = [0, 10, 3];
  const smoothPlayerPosX = spring(0)
  const smoothPlayerPosZ = spring(0)
  const t3 = new Vector3()
  useFrame(() => {
    if (!playerMesh) return
    playerMesh.getWorldPosition(t3)
    smoothPlayerPosX.set(t3.x, {
      hard: !positionHasBeenSet
    })
    smoothPlayerPosZ.set(t3.z, {
      hard: !positionHasBeenSet
    })
    if (!positionHasBeenSet) positionHasBeenSet = true
  })
</script>
<!-- <Environment -->
<!--   path="/hdr/" -->
<!--   files="shanghai_riverside_1k.hdr" -->
<!-- /> -->
<T.DirectionalLight
  castShadow
  position={[8, 20, -3]}
/>
<Debug />
<T.GridHelper
  args={[50]}
  position.y={0.01}
/>
<CollisionGroups groups={[0, 15]}>
  <!-- <Ground seed={(function() {
    if (!window) return undefined;
    // const input = prompt("Seed");
    const input = 1;
    return input === null ? undefined : (+input || undefined);
  })()} /> -->
  <Ground {seed} />
</CollisionGroups>
<CollisionGroups groups={[0]}>
  <Player />
  <Door />
  <CakeGen />
  <Woman />
</CollisionGroups>
<CollisionGroups memberships={[5]} filter={[0]}>
  <AutoColliders shape={'cuboid'} friction={0.15} restitution={0.1}>
    <!-- used to be 2.55 in height -->
    <T.Mesh
      receiveShadow
      castShadow
      position.x={30 + 0.7 + 0.15}
      position.y={1.275}
      geometry={new BoxGeometry(60, 50, 0.15)}
      material={new MeshStandardMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0x333333
      })}
    />
    <T.Mesh
      receiveShadow
      castShadow
      position.x={-30 - 0.7 - 0.15}
      position.y={1.275}
      geometry={new BoxGeometry(60, 50, 0.15)}
      material={new MeshStandardMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0x333333
      })}
    />
  </AutoColliders>
</CollisionGroups>
