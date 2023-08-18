<script lang="ts">
  import { T, useThrelte  } from '@threlte/core'
  // import { Environment } from '@threlte/extras'
  import { AutoColliders, CollisionGroups, Debug } from '@threlte/rapier'
  // import { spring } from 'svelte/motion'
  import { BoxGeometry, MeshStandardMaterial } from 'three'
  import Door from '../rapier/world/Door.svelte'
  import Player from './Player.svelte'
  import Ground from '../rapier/world/Ground.svelte'
  import CakeGen from './CakeGen.svelte'
	import Ybot from './models/Ybot.svelte';
	import Woman from '$lib/rapier/world/Woman.svelte';
	import { onMount } from 'svelte';
	import { playerAnimation, playerLinvel, playerPos, playerRotation } from '$lib/store';
	import Player2 from './Player2.svelte';
	import Fps from './Fps.svelte';
  // let playerMesh: Mesh
  // let positionHasBeenSet = false
  export let seed: number;
  interface ConnectedPlayer {
    x: number,
    y: number,
    z: number,
    linx: number,
    liny: number,
    linz: number,
    animation: ActionName,
    name: string,
    rotation: [number, number, number]
  }
  let players: ConnectedPlayer[] = [];
  let socket: WebSocket | null = null;
  type ActionName = "idle" | "jump" | "running" | "tpose" | "walk" | "fall";
  // // let position: [number, number, number] = [0, 10, 3];
  // const smoothPlayerPosX = spring(0);
  // const smoothPlayerPosZ = spring(0);
  // const t3 = new Vector3();
  // useFrame(() => {
  //   if (!playerMesh) return
  //   playerMesh.getWorldPosition(t3)
  //   smoothPlayerPosX.set(t3.x, {
  //     hard: !positionHasBeenSet
  //   })
  //   smoothPlayerPosZ.set(t3.z, {
  //     hard: !positionHasBeenSet
  //   })
  //   if (!positionHasBeenSet) positionHasBeenSet = true
  // })
  
  // playerPos.subscribe((p) => {
  //   if (socket) {
  //     socket.send(new Uint8Array([1, Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2])]));
  //   }
  // });
  const anims: ActionName[] = [
    'idle',
    'tpose',
    'running',
    'fall',
    'walk',
    'jump'
  ];
  function convertAnimationToInt(s: ActionName): number {
    // note that it will return 'jump' when not found, which is disabled rn and easy to debug
    return anims.indexOf(s);
  }
  function convertIntToAnimation(n: number): ActionName {
    return anims[n];
  }
  const intv = setInterval(() => {
    if (!socket) return;
    // socket.send(new Uint8Array([1, Math.floor($playerPos[0]*10), Math.floor($playerPos[1]*10), Math.floor($playerPos[2]*10)]));

    // TODO: encode this as Uint8Array, and add linvel, rotation, currentActionKey, and etc
    socket.send(new Float32Array([
      1,
      $playerPos[0],
      $playerPos[1],
      $playerPos[2],
      $playerLinvel[0],
      $playerLinvel[1],
      $playerLinvel[2],
      $playerRotation[0],
      $playerRotation[1],
      $playerRotation[2],
      convertAnimationToInt($playerAnimation)
    ]));
    // socket.send(JSON.stringify({
    //   x: $playerPos[0],
    //   y: $playerPos[1],
    //   z: $playerPos[2],
    //   linx: $playerLinvel[0],
    //   liny: $playerLinvel[1],
    //   linz: $playerLinvel[2],
    //   animation: $playerAnimation,
    //   rotation: $playerRotation
    // }));
  }, 100);

  // const { renderer } = useThrelte();

  // renderer.setPixelRatio(window.devicePixelRatio * 0.5);

  onMount(() => {
    const ws = new WebSocket("ws://localhost:8080?username=balls&room=test&sex=false&seed=0");
    ws.binaryType = 'arraybuffer';
    ws.onmessage = (m) => {
      if (typeof m.data === 'string') {
        const data = JSON.parse(m.data);
        // console.log("RECEIVED POS", data);
        players[0].x = data.x;
        players[0].y = data.y;
        players[0].z = data.z;
        players[0].linx = data.linx;
        players[0].liny = data.liny;
        players[0].linz = data.linz;
        players[0].animation = data.animation;
        players[0].rotation = data.rotation;
        console.log(data.rotation);
        return;
      }
      // const arr = new Uint8Array(m.data);
      // console.log(m);
      if (m.data instanceof ArrayBuffer) {
        // 11 is size of the payload
        if (m.data.byteLength === 11 * 4) {
            // It's numeric data
            const arr = new Float32Array(m.data);
            if (arr[0] === 1) {
              players[0].x = arr[1];
              players[0].y = arr[2];
              players[0].z = arr[3];
              players[0].linx = arr[4];
              players[0].liny = arr[5];
              players[0].linz = arr[6];
              players[0].rotation = [arr[7], arr[8], arr[9]];
              players[0].animation = convertIntToAnimation(arr[10]);
            }
        } else {
            const arr = new Uint8Array(m.data);
            if (arr[0] === 0) {
              console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(1))));
              players = [...players, {
                x: Math.floor(Math.random() * 10),
                y: 1.5,
                z: Math.floor(Math.random() * 10),
                linx: 0,
                liny: 1,
                linz: 0,
                animation: 'tpose',
                rotation: [0, 0, 0],
                name: decodeURIComponent(new TextDecoder().decode(arr.subarray(1)))
              }];
            }
        }
      }
      // if (arr.at(0) === 0) {
      //   console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(1))));
      //   players = [...players, {
      //     x: Math.floor(Math.random() * 10),
      //     y: 1.5,
      //     z: Math.floor(Math.random() * 10),
      //     linx: 0,
      //     liny: 1,
      //     linz: 0,
      //     animation: 'tpose',
      //     rotation: [0, 0, 0],
      //     name: decodeURIComponent(new TextDecoder().decode(arr.subarray(1)))
      //   }];
      // } else if (arr.at(0) === 1) {
      //   console.log("RECEIVED POS", arr.subarray(1));
      //   players[0].x = arr.at(1)! / 10;
      //   players[0].y = arr.at(2)! / 10;
      //   players[0].z = arr.at(3)! / 10;
      // }
    }
    ws.onopen = _ => {
      socket = ws;
    }
    ws.onclose = _ => {
      socket = null;
      console.log("WS closed.");
      clearInterval(intv);
    }
  });
</script>
<!-- <Environment -->
<!--   path="/hdr/" -->
<!--   files="shanghai_riverside_1k.hdr" -->
<!-- /> -->
<T.DirectionalLight
  castShadow
  position={[8, 20, -3]}
/>

<!-- <Fps /> -->

<!-- <Debug /> -->

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
  {#each players as p}
    <Player2 position={[p.x, p.y, p.z]} linvel={[p.linx, p.liny, p.linz]} animation={p.animation} rotation={p.rotation} />
  {/each}
  <!-- <Woman />
  <Woman />
  <Woman /> -->
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
