<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import { Suspense, createTransition, interactivity, transitions, Text, HTML } from "@threlte/extras";
	import { AutoColliders, CollisionGroups, Debug } from "@threlte/rapier";
	import { BoxGeometry, MeshStandardMaterial } from "three";
	import Door from "../rapier/world/Door.svelte";
	import Player from "./Player.svelte";
	import Ground from "../rapier/world/Ground.svelte";
	import CakeGen from "./CakeGen.svelte";
	import Ybot from "./models/Ybot.svelte";
	import Woman from "$lib/rapier/world/Woman.svelte";
	import { death, freeze, playerAnimation, playerLinvel, playerPos, playerRotation, score, socket } from "$lib/store";
	import Player2 from "./Player2.svelte";
	import Fps from "./Fps.svelte";
	import { spring } from "svelte/motion";
	import Xbot from "./models/Xbot.svelte";
	import Root from "./Root.svelte";
	import { onDestroy, onMount } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { scale as SvelteScale } from "svelte/transition";
	import Particle from "./Particle.svelte";
	import Wizard from "./models/Wizard.svelte";
	import { PUBLIC_PROD, PUBLIC_CREATOR_HAS_WIFI } from "$env/static/public";
	import {
		cakeTypeAsInt,
		convertAnimationToInt,
		convertIntToAnimation,
		getNewScoreByCakeType,
		getRandomElementFromArray,
		intToCakeType,
	} from "$lib/utils";
	import type { Cake, CakeGenItem, Config, ConnectedPlayer } from "$lib/types";
	import {
		CAKES_UPDATE_EVENT,
		CAKE_COLLIDE_EVENT,
		CAKE_SPAWN_EVENT,
		DIED_OF_DEATH,
		GERMINATION_EVENT,
		IS_HOST_EVENT,
		PLAYER_LEAVE_EVENT,
		USER_DATA_EVENT,
		USER_STATE_UPDATE,
	} from "$lib/constants";

	const scaleIn = (node: Element) =>
		SvelteScale(node, {
			duration: 200,
			opacity: 0,
		});

	const scaleOut = (node: Element) =>
		SvelteScale(node, {
			duration: 200,
			opacity: 0,
		});

	export let seed: number | undefined;
	let mobile: boolean = false;
	let realSeed: number | undefined;
	let isSuspend = true;
	let menu = true;
	let sex: boolean | undefined;
	let frozen: number = 0;
	let room: string = "";
	let host: boolean = false;
	let isWizardUnlocked: boolean = false;
	let hostCakes: CakeGenItem[] = [];
	let gameConfig: Config = {
		fov: 90,
		fps: false,
		shader: true
	};
	let username: string = getRandomElementFromArray<string>([
		"Phloyer",
		"Ghoyer",
		"Plaker",
		"Cayer",
		"Gholyer",
		"Paker",
		"Plost",
		"Chost",
		"Caklayer",
	]);
	interactivity();
	const scale = spring(1);
	const scale2 = spring(1);
	let rotation = 0;
	useFrame((_, delta) => {
		rotation += delta;
	});

	// TODO: use an object instead for fast access
	let players: ConnectedPlayer[] = [];

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
			name: "Play",
		},
		{
			name: "Settings"
		},
	];
	let currentCtx = contextMenuItems[0];

	let cakes: Cake[] = [];

	// TODO: websocket frame rate, if frame rate drops below 3 then the host automatically disconnects

	function startGame(connectWs: boolean = false) {
		console.log("Starting game... Connect:", connectWs);
		if (connectWs) {
			const intv = setInterval(() => {
				if (!$socket) return;
				// probably better if these are separate events...
				$socket.send(
					new Float32Array([
						USER_STATE_UPDATE,
						$playerPos[0],
						$playerPos[1],
						$playerPos[2],
						$playerLinvel[0],
						$playerLinvel[1],
						$playerLinvel[2],
						$playerRotation[0],
						$playerRotation[1],
						$playerRotation[2],
						convertAnimationToInt($playerAnimation),
					])
				);
			}, 100);
			console.log("WS seed:", seed);
			const url = PUBLIC_PROD === "true" ? "wss://gnc3d-backend.onrender.com/" : "ws://localhost:8080";
			// const url = "192.168.0.84";
			const ws = new WebSocket(
				`${url}?username=${username}&room=${room}&sex=${sex === undefined ? "true" : sex ? "true" : "false"}&seed=${
					seed === 0 ? 1 : seed
				}`
			);
			ws.binaryType = "arraybuffer";
			ws.onmessage = (m) => {
				if (typeof m.data === "string") {
					// the only string event is username
					// because we are using byteLength for floats, sending a custom sized string is dangerous
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
					if (m.data.byteLength === 4 * 11 + 4 || m.data.byteLength === 4 * 9 + 4 || m.data.byteLength === 4 * 2 + 4) {
						// It's numeric data, for some reason JavaScript cannot modify ArrayBuffer
						// or decode a Uint8Array into Float32Array

						const arr = new Float32Array(m.data);

						// this is always true
						const ind = players.findIndex((p) => p.id === arr[1]);
						if (arr[0] === USER_STATE_UPDATE) {
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
						} else if (arr[0] === CAKE_SPAWN_EVENT) {
							// a WILD CAKE has spawned!
							if (arr[1] === 0) {
								// console.log("CAKE", arr.subarray(2));
								cakes = [
									...cakes,
									{
										id: arr[2],
										position: [arr[3], arr[4], arr[5]],
										rotation: [arr[6], arr[7], arr[8]],
										type: intToCakeType(arr[9]),
									},
								];
							}
						} else if (arr[0] === CAKE_COLLIDE_EVENT) {
							if (arr[1] === 0) {
								// this event is triggered when a cake collides with a player
								cakes = cakes.filter((c) => {
									if (c.id !== arr[2]) {
										return true;
									} else {
										score.update((sc) => getNewScoreByCakeType(sc, c.type));
										return false;
									}
								});
							}
						}
					} else {
						const arr = new Uint8Array(m.data);
						if (arr[0] === USER_DATA_EVENT) {
							// maybe have a text event specifically for name? This can bug and make f32 events bugged...
							// console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(3))));
							console.log("RECEIVED PLAYER ID", arr[1]);
							console.log("BYTE LENGTH", arr.byteLength);
							if (host) {
								// send current cakes to user (?) might cause undefined behaviours if host has connection issues
								hostCakes.forEach((cake) => {
									// spawn a cake with event type 3
									ws.send(
										new Float32Array([
											CAKES_UPDATE_EVENT, // i lost track of the event ids
											arr[1],
											cake.id,
											cake.position[0],
											cake.position[1],
											cake.position[2],
											cake.rotation[0],
											cake.rotation[1],
											cake.rotation[2],
											cakeTypeAsInt(cake.type),
										])
									);
								});
							}
							players = [
								...players,
								{
									id: arr[1],
									name: "Loading...",
									sex: Boolean(arr[2]),
									x: Math.floor(Math.random() * 10),
									y: 1.5,
									z: Math.floor(Math.random() * 10),
									linx: 0,
									liny: 1,
									linz: 0,
									animation: "tpose",
									rotation: [0, 0, 0],
								},
							];
						} else if (arr[0] === IS_HOST_EVENT) {
							realSeed = seed === 0 ? 1 : seed;
							playerPos.set([0, 10, 3]);
							host = true;
						} else if (arr[0] === DIED_OF_DEATH) {
							if (!host) death.set(true);
						} else if (arr[0] === GERMINATION_EVENT) {
							console.log("Received seed", arr[1]);
							realSeed = arr[1];
							// because host cannot receive event 42
							playerPos.set([Math.floor(Math.random() * 200) - 100, 10, Math.floor(Math.random() * 200) - 100]);
						} else if (arr[0] === PLAYER_LEAVE_EVENT) {
							console.log("Player left", arr[1]);
							players = players.filter((p) => p.id !== arr[1]);
						} else {
							console.log("Unknown event", arr[0]);
						}
					}
				}
			};
			ws.onopen = (_) => {
				console.log("WS opened.");
				socket.set(ws);
			};
			ws.onclose = (_) => {
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
				// Room now closes when host leaves
			};
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
				frozen -= 50;
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
			}, frozen + frozen / 25);
		}
	});

	const zoomOut = createTransition<THREE.Group>((ref) => {
		return {
			tick(t) {
				// t is [0,1] and needs to be converted to [0.5,1]
				t = t * 0.9;
				ref.scale.set(t, t, t);
			},
			easing: cubicOut,
			duration: 400,
		};
	});

	const zoomIn = createTransition<THREE.Group>((ref) => {
		return {
			tick(t) {
				// t is [0,1] and needs to be converted to [0.5,1]
				t = Math.min(t * 1.001, 1);
				ref.scale.set(t, t, t);
			},
			easing: cubicOut,
			duration: 400,
		};
	});

	// You can no longer unlock wizard via k3

	onMount(() => {
		(function (a) {
			if (
				/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
					a
				) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
					a.substr(0, 4)
				)
			)
				mobile = true;
		// @ts-ignore
		})(navigator.userAgent || navigator.vendor || window["opera"]);

        if ("config" in localStorage) {
			// there may be compatibility issues
            gameConfig = JSON.parse(localStorage.getItem("config")!);
        }
		// save at the end
		window.addEventListener("unload", _ => localStorage.setItem("config", JSON.stringify(gameConfig)));
	});

	onDestroy(() => {
		$socket?.close();
		socket.set(null);
	});

	transitions();
</script>

<Fps />

{#if menu}
	<Suspense final on:load={() => (isSuspend = false)}>
		<Root slot="fallback">
			<p
				style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
			>
				Loading game assets...
			</p>
		</Root>
		<!-- {console.log("CURR", currentCtx)} -->
		<Root>
			<section class="contextmenu" class:hide={isSuspend}>
				<ul>
					{#each contextMenuItems as ctx}
						<li>
							<button on:click={() => (currentCtx = ctx)}>{ctx.name}</button>
						</li>
					{/each}
				</ul>
			</section>
		</Root>

		{#if currentCtx.name === "Skins"}
			<T.PerspectiveCamera
				makeDefault
				position={[10, 10, 10]}
				on:create={({ ref }) => {
					ref.lookAt(0, 1, 0);
				}}
			/>
			<T.DirectionalLight position={[0, 10, 10]} castShadow />
			<T.Group position.x={mobile ? -1.5 : -3} position.z={mobile ? 1.5 : 3} in={zoomIn} out={zoomOut}>
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
							opacity: 0,
						})}
					>
						<T.BoxGeometry args={[1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group rotation.y={rotation} position.y={$scale} scale={$scale} castShadow>
					<Xbot currentActionKey={$scale === 1 ? "idle" : $scale === 2.5 ? "fall" : "tpose"} />
				</T.Group>
				<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
					<T.CircleGeometry args={[2, 40]} />
					<T.MeshStandardMaterial color="white" />
				</T.Mesh>
			</T.Group>

			<T.Group position.x={mobile ? 1.5 : 3} position.z={mobile ? -1.5 : -3} in={zoomIn} out={zoomOut}>
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
							opacity: 0,
						})}
					>
						<T.BoxGeometry args={[1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group rotation.y={rotation} position.y={$scale2} scale={$scale2} castShadow>
					<Ybot currentActionKey={$scale2 === 1 ? "idle" : $scale2 === 2.5 ? "fall" : "tpose"} />
				</T.Group>
				<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
					<T.CircleGeometry args={[2, 40]} />
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
			<T.PerspectiveCamera makeDefault position={[0, 1, 3]} fov={120} />
			<T.DirectionalLight position={[0, 10, 10]} castShadow intensity={isWizardUnlocked ? 1 : 0.1} />
			<T.Group position.x={0} position.z={0} in={zoomIn} out={zoomOut}>
				<T.Group position.y={0.8}>
					<T.Mesh
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: isWizardUnlocked ? 0 : 0.5,
							color: "red",
						})}
					>
						<T.BoxGeometry args={[1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group rotation.y={rotation} position.y={0.8} castShadow>
					<Wizard />
				</T.Group>
				<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
					<T.CircleGeometry args={[2, 40]} />
					<T.MeshStandardMaterial color="white" />
				</T.Mesh>
				{#if !isWizardUnlocked && PUBLIC_CREATOR_HAS_WIFI === "true"}
					<Text position.z={1} color="white" text="???" fontSize={0.5} anchorX="50%" anchorY="100%" />
				{/if}
			</T.Group>
		{:else if currentCtx.name === "Play"}
			<Root>
				<dialog class="playMenu" in:scaleIn out:scaleOut>
					<button
						on:click={() => {
							realSeed = seed;
							playerPos.set([0, 10, 3]);
							startGame(false);
						}}>Singleplayer</button
					>
					<div>
						<input type="text" bind:value={room} /><button
							on:click={() => {
								startGame(true);
							}}>Join room</button
						>
					</div>
					Username:
					<input type="text" bind:value={username} placeholder="Enter a username here:" />
				</dialog>
			</Root>
		{:else if currentCtx.name === "Settings"}
			<Root>
				<dialog class="settingsMenu" in:scaleIn out:scaleOut>
					<div>
						Enable first person on start
						<input type="checkbox" bind:checked={gameConfig.fps} />
					</div>
					<div>
						Enable shaders
						<input type="checkbox" bind:checked={gameConfig.shader} />
					</div>
					<div>
						FOV
						<input type="number" bind:value={gameConfig.fov} />
					</div>
				</dialog>
			</Root>
		{/if}
	</Suspense>
{:else if realSeed === undefined}
	<Root>
		<dialog class="germination">Waiting for germination...</dialog>
	</Root>
	<!-- {console.log("Waiting for germination")} -->
{:else}
	<Suspense final>
		<T.Group slot="fallback">
			<T.PerspectiveCamera
				position={[0, 0, 0]}
				on:create={({ ref }) => {
					ref.lookAt(0, 0, 0);
				}}
			/>
			<T.DirectionalLight position={[0, 10, 10]} castShadow />
			<T.Group position={[0, 0, 0]}>
				<HTML>
					<p
						style="margin-left: -12em; margin-top: -1em; text-align: center; color: white; width: 24em; font-size: 5em; font-weight: bold; font-family:'Courier New', Courier, monospace"
					>
						Loading game assets...
					</p>
				</HTML>
			</T.Group>
		</T.Group>

		<Root>
			<div class="counters">
				<div class="score"><p>Score: {$score}</p></div>
				<!-- Small inconvenience but it's fine! -->
				{#if ($socket !== null && host) || $socket === null}
					<div class="freeze"><p>Frozen for: {frozen}</p></div>
				{/if}
			</div>
			{#if $socket === null}
				<button
					on:click={() => {
						menu = true;
						death.set(false);
						realSeed = undefined;
					}}
					class="quitbtn">Exit game</button
				>
			{:else}
				<button on:click={() => $socket?.close()} class="quitbtn">Exit Game </button>
			{/if}
		</Root>

		<T.DirectionalLight castShadow position={[8, 20, -3]} />

		<!-- <Debug /> -->

		<T.GridHelper args={[50]} position.y={0.01} />

		<CollisionGroups groups={[0, 15]}>
			<Ground seed={realSeed} enableShaders={gameConfig.shader} />
		</CollisionGroups>
		<CollisionGroups groups={[0]}>
			<Player {username} {host} sex={sex === undefined ? true : sex} {gameConfig} bind:isWizardUnlocked />
			<Door />
			{#if $socket !== null}
				{#if host}
					<CakeGen host bind:items={hostCakes} />
				{:else}
					{#each cakes as cake (cake.id)}
						<!-- {console.log(cake.position)} -->
						<!-- the touch param is completely useless for a non-host -->
						<Particle id={cake.id} position={cake.position} rotation={cake.rotation} type={cake.type} touch={0} {host} />
					{/each}
				{/if}
			{:else}
				<CakeGen />
				<Woman />
			{/if}
			{#each players as p}
				<Player2
					id={p.id}
					username={p.name}
					sex={p.sex}
					position={[p.x, p.y, p.z]}
					linvel={[p.linx, p.liny, p.linz]}
					animation={p.animation}
					rotation={p.rotation}
				/>
			{/each}
		</CollisionGroups>
		<CollisionGroups memberships={[5]} filter={[0]}>
			<AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
				<!-- used to be 2.55 in height -->
				<T.Mesh
					receiveShadow
					castShadow
					position.x={30 + 0.7 + 0.15}
					position.y={1.275}
					geometry={new BoxGeometry(60, 10, 0.15)}
					material={new MeshStandardMaterial({
						transparent: true,
						opacity: 0.5,
						color: 0x333333,
					})}
				/>
				<T.Mesh
					receiveShadow
					castShadow
					position.x={-30 - 0.7 - 0.15}
					position.y={1.275}
					geometry={new BoxGeometry(60, 10, 0.15)}
					material={new MeshStandardMaterial({
						transparent: true,
						opacity: 0.5,
						color: 0x333333,
					})}
				/>
			</AutoColliders>
		</CollisionGroups>
	</Suspense>
{/if}

<style lang="css">
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
		margin-right: 0.25em;
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
		transition: 0.5s;
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
	
	.settingsMenu {
		display: flex;
		flex-direction: column;
		z-index: 2;
	}

	.settingsMenu div {
		margin-top: .5em;
	}

	.counters {
		display: flex;
		flex-direction: row;
		position: absolute;
		top: 1px;
		width: 25%;
		height: 5%;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.score {
		display: flex;
		flex-direction: column;
		user-select: none;
		opacity: 0.8;
		top: 0;
		background-color: white;
		border: solid 1px black;
		z-index: 1;
		padding: 0 1em;
	}

	.freeze {
		display: flex;
		flex-direction: column;
		user-select: none;
		opacity: 0.8;
		top: 0;
		background-color: white;
		border: solid 1px black;
		z-index: 1;
		padding: 0 1em;
	}

	.quitbtn {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1;
		width: 25%;
		height: 5%;
	}
</style>
