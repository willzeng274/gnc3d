<script lang="ts">
  import { T, useFrame } from '@threlte/core'
  import { interactivity } from '@threlte/extras'
  import { AutoColliders, CollisionGroups, Debug } from '@threlte/rapier'
  // import { spring } from 'svelte/motion'
  import { BoxGeometry, MeshStandardMaterial } from 'three'
  import Door from '../rapier/world/Door.svelte'
  import Player from './Player.svelte'
  import Ground from '../rapier/world/Ground.svelte'
  import CakeGen from './CakeGen.svelte'
	import Ybot from './models/Ybot.svelte';
	import Woman from '$lib/rapier/world/Woman.svelte';
	// import { onMount } from 'svelte';
	import { death, freeze, playerAnimation, playerLinvel, playerPos, playerRotation, score, socket } from '$lib/store';
	import Player2 from './Player2.svelte';
	import Fps from './Fps.svelte';
  import { spring } from 'svelte/motion';
	import Xbot from './models/Xbot.svelte';
	import Root from './Root.svelte';
	import { onDestroy } from 'svelte';
  // import { createTransition } from '@threlte/extras'
  // import { cubicOut } from 'svelte/easing';

  export let seed: number;
  let menu = true;
  let sex: boolean | undefined;
  let frozen: number = 0;
  let room: string = "";
  let host: boolean = false;
  interactivity();
  const scale = spring(1);
  const scale2 = spring(1);
  let rotation = 0;
  useFrame((_, delta) => {
    rotation += delta;
  })

  interface ConnectedPlayer {
    id: number,
    name: string,
    x: number,
    y: number,
    z: number,
    linx: number,
    liny: number,
    linz: number,
    animation: ActionName,
    rotation: [number, number, number]
  }

  let players: ConnectedPlayer[] = [];

  // let socket: WebSocket | null = null;

  type ActionName = "idle" | "jump" | "running" | "tpose" | "walk" | "fall";
  
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

  // const { renderer } = useThrelte();

  // renderer.setPixelRatio(window.devicePixelRatio * 0.5);

  let contextMenuItems = [
    {
      name: "Skins",
      hover: false
    },
    {
      name: "Seed",
      hover: false
    },
    {
      name: "Shop",
      hover: false
    },
    {
      name: "Something",
      hover: false
    },
    {
      name: "Play",
      hover: false
    },
  ];
  let currentCtx = contextMenuItems[0];

  function startGame(connectWs: boolean = false) {
    console.log("Starting game... Connect:", connectWs);
    if (connectWs) {
      const intv = setInterval(() => {
        if (!$socket) return;
        // probably better if these are separate events...
        $socket.send(new Float32Array([
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
      }, 100);
      const ws = new WebSocket(`ws://localhost:8080?username=${"balls_placeholder"}&room=${room}&sex=${sex === undefined ? "true" : sex ? "true" : "false"}&seed=${seed}`);
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
          // console.log(data.rotation);
          return;
        }
        // const arr = new Uint8Array(m.data);
        // console.log(m);
        if (m.data instanceof ArrayBuffer) {
          // console.log(m.data.byteLength);
          // console.log(m.data);
          // Rust is so cracked that it can send a dynamic array
          if (m.data.byteLength === 48) {
              // It's numeric data
              // console.log(m.data);
              // const a = new Uint8Array(m.data);
              // because rust currently inserts at 2nd byte
              // const id = a[1];
              // const narr = a.subarray(2);
              // const n = new ArrayBuffer(44);
              // const n = new SharedArrayBuffer(44);

              // can't fix unless manually decoding bruh...

              const arr = new Float32Array(m.data);
              // .from(new Uint8Array([a[0], ...narr]));
              // console.log([...arr]);
              if (arr[0] === 1) {
                const ind = players.findIndex((p) => p.id === arr[1]);
                // console.log("Received event from player", ind, arr[1]);
                // just update ind = -1 which is the last player if not found loool
                players[ind].x = arr[2];
                players[ind].y = arr[3];
                players[ind].z = arr[4];
                players[ind].linx = arr[5];
                players[ind].liny = arr[6];
                players[ind].linz = arr[7];
                players[ind].rotation = [arr[8], arr[9], arr[10]];
                players[ind].animation = convertIntToAnimation(arr[11]);
              }
          } else {
              const arr = new Uint8Array(m.data);
              if (arr[0] === 0) {
                console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(2))));
                console.log("RECEIVED PLAYER ID", arr[1]);
                players = [...players, {
                  id: arr[1],
                  name: decodeURIComponent(new TextDecoder().decode(arr.subarray(2))),
                  x: Math.floor(Math.random() * 10),
                  y: 1.5,
                  z: Math.floor(Math.random() * 10),
                  linx: 0,
                  liny: 1,
                  linz: 0,
                  animation: 'tpose',
                  rotation: [0, 0, 0]
                }];
              } else if (arr[0] === 69) {
                host = true;
              } else if (arr[0] === 2) {
                if (!host) death.set(true)
              }
          }
        }
      }
      ws.onopen = _ => {
        console.log("WS opened.")
        socket.set(ws);
      }
      ws.onclose = _ => {
        console.log("WS closed.");
        clearInterval(intv);
        socket.set(null);
      }
    }
    menu = false;
    score.set(0);
    freeze.set(0);
    playerPos.set([0, 10, 3]);
  }

  function countFrozen() {
    const frozenInv = setInterval(() => {
      if (frozen > 0) {
        frozen-=50;
      } else {
        clearInterval(frozenInv);
      }
    }, 50);
  }

  let tm: number;

  freeze.subscribe((fr) => {
    // console.log("NEW FREEZE", fr);
    if (fr) {
      if (frozen <= 0) countFrozen();
      frozen += 2500;
      console.log(frozen + (frozen/25));
      clearTimeout(tm);
      tm = setTimeout(() => {
        // console.log("OK FREEZE");
        freeze.set(0);
      }, frozen+(frozen/25));
    }
  });

  onDestroy(() => {
    $socket?.close();
    socket.set(null);
  });
</script>

<Fps />

{#if menu}
  <Root>
    <section class="contextmenu">
      <ul>
        <!-- <li>Skins</li>
        <li>Seed</li>
        <li>Shop</li>
        <li>Something</li>
        <li>Play</li> -->
        {#each contextMenuItems as ctx}
          <li><button on:click={() => currentCtx = ctx}>{ctx.name}</button></li>
        {/each}
      </ul>
    </section>
  </Root>

  {#if currentCtx.name === "Skins"}
    <T.PerspectiveCamera
      makeDefault
      position={[10, 10, 10]}
      on:create={({ ref }) => {
        ref.lookAt(0, 1, 0)
      }}
    />
    <T.DirectionalLight position={[0, 10, 10]} castShadow />
    <T.Group
      position.x={-3}
      position.z={3}
    >
      <T.Group
        rotation.y={rotation}
        position.y={$scale}
        scale={$scale}
        on:pointerenter={() => $scale !== 2.5 && scale.set(sex === false ? 2 : 1.5)}
        on:pointerleave={() => $scale !== 2.5 && scale.set(sex === false ? 2 : 1)}
        on:click={() => {
          if (sex === false) {
            scale.set(2.5);
            setTimeout(() => scale.set(1), 700);
            sex = undefined;
          } else {
            scale.set(2);
            scale2.set(1);
            sex = false;
          }
        }}
      >
        <T.Mesh
          material={new MeshStandardMaterial({
            transparent: true,
            opacity: 0
          })}
        >
          <T.BoxGeometry args={[1, 2, 1]} />
        </T.Mesh>
      </T.Group>
      <T.Group
        rotation.y={rotation}
        position.y={$scale}
        scale={$scale}
        castShadow
      >
        <Xbot currentActionKey={$scale === 1 ? "idle" : $scale === 2.5 ? "fall" : "tpose"}>
          <svelte:fragment slot="fallback">
            <T.Mesh
              rotation.y={rotation}
              position.y={1}
              scale={$scale}
              on:pointerenter={() => scale.set(1.5)}
              on:pointerleave={() => scale.set(1)}
              castShadow
            >
              <T.BoxGeometry args={[1, 2, 1]} />
              <T.MeshStandardMaterial color="hotpink" />
            </T.Mesh>
          </svelte:fragment>
        </Xbot>
      </T.Group>
      <T.Mesh rotation.x={-Math.PI/2} receiveShadow>
        <T.CircleGeometry args={[2, 40]}/>
        <T.MeshStandardMaterial color="white" />
      </T.Mesh>
    </T.Group>

    <T.Group
      position.x={3}
      position.z={-3}
    >
      <T.Group
        rotation.y={rotation}
        position.y={$scale2}
        scale={$scale2}
        on:pointerenter={() => $scale2 !== 2.5 && scale2.set(sex === true ? 2 : 1.5)}
        on:pointerleave={() => $scale2 !== 2.5 && scale2.set(sex === true ? 2 : 1)}
        on:click={() => {
          if (sex) {
            scale2.set(2.5);
            setTimeout(() => scale2.set(1), 700);
            sex = undefined;
          } else {
            scale2.set(2);
            scale.set(1);
            sex = true;
          }
        }}
      >
        <T.Mesh
          material={new MeshStandardMaterial({
            transparent: true,
            opacity: 0
          })}
        >
          <T.BoxGeometry args={[1, 2, 1]} />
        </T.Mesh>
      </T.Group>
      <T.Group
        rotation.y={rotation}
        position.y={$scale2}
        scale={$scale2}
        castShadow
      >
        <Ybot currentActionKey={$scale2 === 1 ? "idle" : $scale2 === 2.5 ? "fall" : "tpose"}>
          <svelte:fragment slot="fallback">
            <T.Mesh
              rotation.y={rotation}
              position.y={1}
              scale={$scale2}
              on:pointerenter={() => scale2.set(1.5)}
              on:pointerleave={() => scale2.set(1)}
              castShadow
            >
              <T.BoxGeometry args={[1, 2, 1]} />
              <T.MeshStandardMaterial color="hotpink" />
            </T.Mesh>
          </svelte:fragment>
        </Ybot>
      </T.Group>
      <T.Mesh rotation.x={-Math.PI/2} receiveShadow>
        <T.CircleGeometry args={[2, 40]}/>
        <T.MeshStandardMaterial color="white" />
      </T.Mesh>
    </T.Group>
  {:else if currentCtx.name === "Seed"}
    <Root>
      <dialog class="seedMenu">
        Enter a map seed: (0 means random)
        <input type="number" bind:value={seed} />
      </dialog>
    </Root>
  {:else if currentCtx.name === "Play"}
    <Root>
      <dialog class="playMenu">
        <button on:click={() => {
          startGame(false);
        }}>Singleplayer</button>
        <!-- <button on:click={() => {
          startGame(true);
        }}>Multiplayer</button> -->
        <div>
          <input type="text" bind:value={room} /><button on:click={() => {
            startGame(true);
          }}>Join room</button>
        </div>
      </dialog>
    </Root>
  {/if}
{:else}

{#if $socket === null}
    {console.log("socket be null")}
    <Root>
      <dialog class="score">Score: {$score}</dialog>
      <dialog class="freeze">Frozen for: {frozen}</dialog>
      <button on:click={() => menu = true} class="quitbtn">Exit game</button>
    </Root>
{/if}

<T.DirectionalLight
  castShadow
  position={[8, 20, -3]}
/>

<!-- <Debug /> -->

<T.GridHelper
  args={[50]}
  position.y={0.01}
/>

<CollisionGroups groups={[0, 15]}>
  <Ground {seed} />
</CollisionGroups>
<CollisionGroups groups={[0]}>
  <Player {host} sex={sex === undefined ? true : sex} />
  <Door />
  {#if $socket !== null}
    {#if host}
      <CakeGen />
    {/if}
  {:else}
    <CakeGen />
    <Woman />
  {/if}
  {#each players as p}
    <Player2 id={p.id} position={[p.x, p.y, p.z]} linvel={[p.linx, p.liny, p.linz]} animation={p.animation} rotation={p.rotation} />
  {/each}
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
{/if}

<style lang="css">
  .contextmenu {
    /* background-color: white; */
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  .contextmenu ul {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: .25em;
    width: 10%;
    height: 100%;
    color: white;
    list-style: none;
    /* dumb canvas */
    z-index: 1;
  }

  .contextmenu ul li {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 90%;
    height: 2%;
    padding: 1em;
    border: solid 1px red;
    transition: .5s;
  }

  .contextmenu ul li:hover {
    height: 10%;
  }

  .seedMenu {
    display: block;
    z-index: 2;
  }

  .playMenu {
    display: flex;
    flex-direction: column;
    z-index: 2;
  }

  .score {
    display: flex;
    position: fixed;
    top: 1px;
    user-select: none;
    opacity: 0.8;
    z-index: 1;
  }

  .freeze {
    display: flex;
    position: fixed;
    top: 3.2em;
    user-select: none;
    opacity: 0.8;
    z-index: 1;
  }

  .quitbtn {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1;
  }
</style>