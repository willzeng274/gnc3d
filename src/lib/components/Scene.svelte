<script lang="ts">
  import { T, useFrame } from '@threlte/core'
  import { Suspense, createTransition, interactivity, transitions, Text, HTML } from '@threlte/extras'
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
	import { cubicOut } from 'svelte/easing';
  import { scale as SvelteScale, fade } from 'svelte/transition';
	import Particle from './Particle.svelte';
	import Wizard from './models/Wizard.svelte';

  const scaleIn = (node: Element) => SvelteScale(node, {
    duration: 200,
    opacity: 0
  });

  const scaleOut = (node: Element) => SvelteScale(node, {
    duration: 200,
    opacity: 0
  });

  export let seed: number | undefined;
  let realSeed: number | undefined;
  let isSuspend = true;
  let menu = true;
  let sex: boolean | undefined;
  let frozen: number = 0;
  let room: string = "";
  let host: boolean = false;
  let isWizardUnlocked: boolean = false;
  let username: string = "Balls eater";
  interactivity();
  const scale = spring(1);
  const scale2 = spring(1);
  let rotation = 0;
  useFrame((_, delta) => {
    rotation += delta;
  })

  interface ConnectedPlayer {
    id: number;
    name: string;
    sex: boolean;
    x: number;
    y: number;
    z: number;
    linx: number;
    liny: number;
    linz: number;
    animation: ActionName;
    rotation: [number, number, number];
  }

  // TODO: use an object instead for fast access
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
  function intToCakeType(n: number): cakeType {
    if (n === 0) return "normal";
    if (n === 1) return "frozen";
    if (n === 2) return "gold";
    // this should not be reachable
		return "gold";
	}
  function getNewScoreByCakeType(score: number, cake: cakeType): number {
    if (cake === "normal") return score+1;
		if (cake === "frozen") return score+1;
		if (cake === "gold") return (score+1)*2;
		return -1;
  }

  // const { renderer } = useThrelte();

  // renderer.setPixelRatio(window.devicePixelRatio * 0.5);

  let contextMenuItems = [
    {
      name: "Skins",
    },
    {
      name: "Seed",
    },
    {
      name: "Shop",
    },
    {
      name: "Something",
    },
    {
      name: "Play",
    },
  ];
  let currentCtx = contextMenuItems[0];

  type cakeType = 'normal' | 'frozen' | 'gold';
  interface Cake {
    id: number;
		position: [number, number, number];
		rotation: [number, number, number];
		type: cakeType;
	}

  let cakes: Cake[] = [];

  // TODO: websocket frame rate, if frame rate drops below 3 then the host automatically disconnects

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
      console.log("WS seed:", seed)
      const url = "localhost";
      // const url = "192.168.0.84";
      const ws = new WebSocket(`ws://${url}:8080?username=${username}&room=${room}&sex=${sex === undefined ? "true" : sex ? "true" : "false"}&seed=${seed === 0 ? 1 : seed}`);
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (m) => {
        if (typeof m.data === 'string') {
          const id = +m.data[0];
          const ind = players.findIndex((p) => p.id === id);
          players[ind].name = m.data.substring(1);
          return;
        }
        // const arr = new Uint8Array(m.data);
        if (m.data instanceof ArrayBuffer) {
          // console.log(m.data.byteLength);
          // console.log(m.data);
          // Rust is so cracked that it can send a dynamic array
          // ISSUE: when username is this exact length... yeah it's a bit problematic
          if (m.data.byteLength === 4 * 11 + 4 || m.data.byteLength === 4 * 9 + 4 || m.data.byteLength === 4 * 2 + 4) {
              // It's numeric data
              // console.log(m.data);
              // const a = new Uint8Array(m.data);
              // because rust currently inserts at 2nd byte
              // const id = a[1];
              // const narr = a.subarray(2);
              // const n = new ArrayBuffer(44);
              // const n = new SharedArrayBuffer(44);

              // can't fix unless manually decoding bruh...
              // this will be erroring if the username is the same byte length lol

              const arr = new Float32Array(m.data);

              // this is always true
              const ind = players.findIndex((p) => p.id === arr[1]);
              if (arr[0] === 1) {
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
              } else if (arr[0] === 3) {
                // a WILD CAKE has spawned!
                if (arr[1] === 0) {
                  // console.log("CAKE", arr.subarray(2));
                  cakes = [...cakes, {
                    id: arr[2],
                    position: [arr[3], arr[4], arr[5]],
                    rotation: [arr[6], arr[7], arr[8]],
                    type: intToCakeType(arr[9])
                  }];
                }
              } else if (arr[0] === 4) {
                if (arr[1] === 0) {
                  // console.log("Got cake", arr[2], cakes);
                  cakes = cakes.filter((c) => {
                    if (c.id !== arr[2]) {
                      return true;
                    } else {
                      score.update((sc) => getNewScoreByCakeType(sc, c.type))
                      return false;
                    }
                  });
                }
              }
          } else {
              const arr = new Uint8Array(m.data);
              if (arr[0] === 0) {
                // maybe have a text event specifically for name? This can bug and make f32 events bugged...
                // console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(3))));
                console.log("RECEIVED PLAYER ID", arr[1]);
                console.log("BYTE LENGTH", arr.byteLength);
                players = [...players, {
                  id: arr[1],
                  name: "Loading...",
                  sex: Boolean(arr[2]),
                  x: Math.floor(Math.random() * 10),
                  y: 1.5,
                  z: Math.floor(Math.random() * 10),
                  linx: 0,
                  liny: 1,
                  linz: 0,
                  animation: 'tpose',
                  rotation: [0, 0, 0]
                }];
                // send current cakes to user (?) might be weird if host has connection issues
              } else if (arr[0] === 69) {
                realSeed = seed === 0 ? 1 : seed;
                playerPos.set([0, 10, 3]);
                host = true;
              } else if (arr[0] === 2) {
                if (!host) death.set(true)
              } else if (arr[0] === 42) {
                console.log("Received seed", arr[1]);
                realSeed = arr[1];
                // because host cannot receive event 42
                playerPos.set([Math.floor(Math.random() * 200) - 100, 10, Math.floor(Math.random() * 200)-100]);
              } else if (arr[0] === 5) {
                console.log("Player left", arr[1]);
                players = players.filter((p) => p.id !== arr[1]);
              } else {
                console.log("Unknown event", arr[0]);
              }
          }
        }
      }
      ws.onopen = _ => {
        console.log("WS opened.");
        socket.set(ws);
      }
      ws.onclose = _ => {
        console.log("WS closed.");
        clearInterval(intv);
        socket.set(null);
        score.set(0);
        freeze.set(0);
        host = false;
        realSeed = undefined;
        players = [];
        menu = true;
        cakes = [];
        // maybe an indictor for whether or not the host left?
        // alert("Host left");
      }
    }
    menu = false;
    score.set(0);
    freeze.set(0);
    // set when seed is germinated
    // playerPos.set([0, 10, 3]);
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
      // console.log(frozen + (frozen/25));
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

  const zoomOut = createTransition<THREE.Group>((ref) => {
    return {
      tick(t) {
        // t is [0,1] and needs to be converted to [0.5,1]
        t = t * 0.9;
        ref.scale.set(t, t, t);
      },
      easing: cubicOut,
      duration: 400
    }
  });

  const zoomIn = createTransition<THREE.Group>((ref) => {
    return {
      tick(t) {
        // t is [0,1] and needs to be converted to [0.5,1]
        t = Math.min(t * 1.001, 1)
        ref.scale.set(t, t, t);
      },
      easing: cubicOut,
      duration: 400
    }
  });

  // You can no longer unlock wizard via k3
  // const keys = {
  //   k: false,
  //   '3': false,
  // };

  // function onKeyDown(e: KeyboardEvent) {
  //   if (e.key === 'k' || e.key === '3') keys[e.key] = true;
  //   if (keys.k && keys['3']) {
  //     isWizardUnlocked = true;
  //   }
  // }

  // window.addEventListener('keydown', onKeyDown);
  // onDestroy(() => {
  //   window.removeEventListener('keydown', onKeyDown);
  // });

  transitions();
</script>

<Fps />

{#if menu}
<Suspense final on:load={() => isSuspend = false}>
  <Root slot="fallback">
    <p style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace">Loading game assets...</p>
  </Root>
  <!-- {console.log("CURR", currentCtx)} -->
  <Root>
    <section class="contextmenu" class:hide={isSuspend}>
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
      in={zoomIn}
      out={zoomOut}
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
          <!-- <svelte:fragment slot="fallback">
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
          </svelte:fragment> -->
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
      in={zoomIn}
      out={zoomOut}
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
          <!-- <svelte:fragment slot="fallback">
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
          </svelte:fragment> -->
        </Ybot>
      </T.Group>
      <T.Mesh rotation.x={-Math.PI/2} receiveShadow>
        <T.CircleGeometry args={[2, 40]}/>
        <T.MeshStandardMaterial color="white" />
      </T.Mesh>
    </T.Group>
  {:else if currentCtx.name === "Seed"}
    <Root>
      <dialog class="seedMenu" in:scaleIn out:scaleOut>
        Enter a map seed: (0 means random)
        <input type="number" bind:value={seed} />
      </dialog>
    </Root>
  {:else if currentCtx.name === "Shop"}
    <T.PerspectiveCamera
      makeDefault
      position={[0, 1, 3]}
      fov={120}
    />
    <T.DirectionalLight position={[0, 10, 10]} castShadow intensity={isWizardUnlocked ? 1 : 0.1} />
    <T.Group
      position.x={0}
      position.z={0}
      in={zoomIn}
      out={zoomOut}
    >
      <!-- {#if !isWizardUnlocked}
        <HTML>
          <h1 style={`color: white; margin-left: -0.84em; opacity: ${opa}`}>???</h1>
        </HTML>
      {/if} -->
      <T.Group
        position.y={.8}
      >
        <T.Mesh
          material={new MeshStandardMaterial({
            transparent: true,
            opacity: isWizardUnlocked ? 0: 0.5,
            color: 'red'
          })}
        >
          <T.BoxGeometry args={[1, 2, 1]} />
        </T.Mesh>
      </T.Group>
      <T.Group
        rotation.y={rotation}
        position.y={.8}
        castShadow
      >
        <Wizard />
      </T.Group>
      <T.Mesh rotation.x={-Math.PI/2} receiveShadow>
        <T.CircleGeometry args={[2, 40]}/>
        <T.MeshStandardMaterial color="white" />
      </T.Mesh>
      {#if !isWizardUnlocked}
        <Text
          position.z={1}
          color="white"
          text="???"
          fontSize={.5}
          anchorX="50%"
          anchorY="100%"
        />
      {/if}
    </T.Group>
  {:else if currentCtx.name === "Play"}
    <Root>
      <dialog class="playMenu" in:scaleIn out:scaleOut>
        <button on:click={() => {
          realSeed = seed;
          playerPos.set([0, 10, 3]);
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
        <input type="text" bind:value={username} placeholder="Enter a username here:" />
      </dialog>
    </Root>
  {/if}
</Suspense>
{:else}

{#if realSeed === undefined}
  <Root>
    <dialog class="germination">
      Waiting for germination...
    </dialog>
  </Root>
  <!-- {console.log("Waiting for germination")} -->
{:else}
<Suspense final>
  <T.Group slot="fallback">
    <T.PerspectiveCamera
      position={[0, 0, 0]}
      on:create={({ ref }) => {
        ref.lookAt(0, 0, 0)
      }}
    />
    <T.DirectionalLight position={[0, 10, 10]} castShadow />
    <T.Group position={[0, 0, 0]}>
      <HTML>
        <p style="margin-left: -12em; margin-top: -1em; text-align: center; color: white; width: 24em; font-size: 5em; font-weight: bold; font-family:'Courier New', Courier, monospace">Loading game assets...</p>
      </HTML>
    </T.Group>
  </T.Group>

  <Root>
    <dialog class="score">Score: {$score}</dialog>
    <!-- Small inconvenience but it's fine! -->
    {#if ($socket !== null && host) || $socket === null}
      <dialog class="freeze">Frozen for: {frozen}</dialog>
    {/if}
    {#if $socket === null}
      <button on:click={() => [menu = true, death.set(false), realSeed = undefined]} class="quitbtn">Exit game</button>
    {:else}
      <button on:click={() => $socket?.close()} class="quitbtn">Exit Game </button>
    {/if}
  </Root>

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
  <Ground seed={realSeed} />
</CollisionGroups>
<CollisionGroups groups={[0]}>
  <Player {username} {host} sex={sex === undefined ? true : sex} bind:isWizardUnlocked />
  <Door />
  {#if $socket !== null}
    {#if host}
      <CakeGen host />
    {:else}
      {#each cakes as cake (cake.id)}
        <!-- {console.log(cake.position)} -->
        <!-- the touch param is completely useless -->
        <Particle id={cake.id} position={cake.position} rotation={cake.rotation} type={cake.type} touch={0} {host} />
      {/each}
    {/if}
  {:else}
    <CakeGen />
    <Woman />
  {/if}
  {#each players as p}
    <Player2 id={p.id} username={p.name} sex={p.sex} position={[p.x, p.y, p.z]} linvel={[p.linx, p.liny, p.linz]} animation={p.animation} rotation={p.rotation} />
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
</Suspense>
{/if}
{/if}

<style lang="css">
  /* .entire {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: block;
    background-color: red;
    z-index: 999;
  } */
  .hide {
    display: none !important;
  }

  .germination {
    display: block;
    z-index: 2;
    transition: 5s;
    animation: ease-in-out 5s;
  }

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

  .contextmenu ul li button {
    background-color: transparent;
    border: none;
    width: 100%;
    height: 100%;
    text-align: center;
    color: white;
  }

  .seedMenu {
    display: block;
    z-index: 2;
    transition: 5s;
    animation: ease-in-out 5s;
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