<script lang="ts">
	import { T } from "@threlte/core";
	import { Suspense, interactivity, transitions } from "@threlte/extras";
	import { death, freeze, playerAnimation, playerLinvel, playerPos, playerRotation, score, socket, gameConfig, azure, mobile, highScore, host, lives, hostWin, gameEnd } from "$lib/store";
	import { Fps, Loading, Lobby, Root, Tutorial } from "./index";
	import { onDestroy, onMount } from "svelte";
	import { PUBLIC_PROD } from "$env/static/public";
	import {
		cakeTypeAsInt,
		convertAnimationToInt,
		convertIntToAnimation,
		decrypt,
		encrypt,
		getNewScoreByCakeType,
		getRandomElementFromArray,
		intToCakeType,
		importEncryptionKey,
		getMaxScoreByPlayerCount,
	} from "$lib/utils";
	import type { Barricade, Cake, CakeGenItem, ConnectedPlayer } from "$lib/types";
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
		START_LOBBY_EVENT,
		USER_NAME_EVENT,
		TXT_MESSAGE_CREATE,
		CAKE_FINAL_EVENT,
		contextMenuItems,
		jwk,
		CAKE_GONE_EVENT,
		BARRICADE_SPAWN_EVENT,
		BARRICADE_GONE_EVENT,
		BARRICADE_FINAL_EVENT,
		BITCHLESS_EVENT,
		HOST_WIN_EVENT,
	} from "$lib/constants";
	import { Assets } from "$lib/components/models";
	import Sidebar from "./menu/Sidebar.svelte";
	import { Skins, Manual, Shop, Seed, Play, Settings, Credits } from "./menu";
	import Game from "$lib/runtime/Game.svelte";
	import { useRapier } from "@threlte/rapier";
	export let seed: number | undefined;
	let realSeed: number | undefined;
	let isSuspend = true;
	let menu = true;
	let lobby = false;
	let tutorial = false;
	let chatActive = false;
	let skin: number = -1;
	let room: string = "";
	let logs: string[] = [];
	let hostCakes: CakeGenItem[] = [];
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

	// TODO: use an object instead for fast access
	let players: ConnectedPlayer[] = [];
	let playerCount: number = 0;

	let currentCtx = contextMenuItems[0];

	let cakes: Cake[] = [];

	let barricades: Barricade[] = [];

	let own_id: number | null = null;

	let lastUpdated = Date.now();

	let spectator = false;
	
	// TODO: websocket frame rate, if frame rate drops below 3 then the host automatically disconnects
	// we'll limit to 30 fps for now
	// small issue: may not update latest frame
	const { world } = useRapier() 

	const normalGravity = ()=> { world.gravity = { x:0, y:-19.62, z:0 } } 
	const noGravity = ()=> { world.gravity = { x:0, y:-0.5, z:0 } } 
	

	let latest_frame: number[] | null = null;
	$: {
		if (spectator) break $;
		if ($socket && Date.now() - lastUpdated >= 1000 / 30 && !lobby && !menu) {
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
			lastUpdated = Date.now();
			latest_frame = null;
		} else if (Date.now() - lastUpdated < 1000 / 30) {
			latest_frame = [
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
			];
		}
	}

	// 20 frames to update latest
	const lastFrameInterval = setInterval(() => {
		if ($socket && Date.now() - lastUpdated >= 1000 / 20 && !lobby && !menu && latest_frame) {
			$socket.send(new Float32Array(latest_frame));
			latest_frame = null;
		}
	}, 50);

	$: {
		if (spectator) {
			clearInterval(lastFrameInterval);
		}
	}

	let started = false;

	function startGame(connectWs: boolean = false) {
		if (started) return;
		started = true;
		console.log("Starting game... Connect:", connectWs);
		if (connectWs) {
			lives.set(3);
			lobby = true;
			console.log("WS seed:", seed);
			const url = PUBLIC_PROD === "true" ? "wss://gnc3d-backend.onrender.com/" : "ws://localhost:8080";
			// const url = PUBLIC_PROD === "true" ? "wss://gnc3d-backend.onrender.com/" : "ws://192.168.100.235:8080";
			// const url = "192.168.0.84";
			const ws = new WebSocket(
				`${url}?username=${username}&room=${room}&skin=${skin === -1 ? 0 : skin}&seed=${seed === 0 ? 1 : seed}`
			);
			ws.binaryType = "arraybuffer";
			ws.onmessage = (m) => {
				if (typeof m.data === "string") {
					// sob... now we have to parse string events
					// because we are using byteLength for floats, sending a custom sized string is dangerous
					// all dynamic length strings must be sent at the end
					const dataBlocks = m.data.split(",");
					const eventId = +dataBlocks.shift()!;
					if (eventId === USER_NAME_EVENT) {
						const id = +dataBlocks.shift()!;
						const ind = players.findIndex((p) => p.id === id);
						// add the comma back in the player names lol
						players[ind].name = dataBlocks.join(",");
					} else if (eventId === TXT_MESSAGE_CREATE) {
						const id = +dataBlocks.shift()!;
						const ind = players.findIndex((p) => p.id === id);
						console.log("PLAYER SENT A MESSAGE", players[ind], dataBlocks.join(","));
						logs = [players[ind].name + ": " + dataBlocks.join(","), ...logs];
					}
					return;
				}
				// const arr = new Uint8Array(m.data);
				if (m.data instanceof ArrayBuffer) {
					// console.log(m.data.byteLength);
					// console.log(m.data);
					// Rust is so cracked that it can send a dynamic array
					if (
						m.data.byteLength === 4 * 11 + 4 ||
						m.data.byteLength === 4 * 9 + 4 ||
						m.data.byteLength === 4 * 2 + 4 ||
						m.data.byteLength === 4 * 8 + 4 /* or 4 * 7 + 4 * 2 barricade */
					) {
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
							// console.log("Received animation, ", convertIntToAnimation(arr[11]));
							players[ind].animation = convertIntToAnimation(arr[11]);
						} else if (arr[0] === CAKE_SPAWN_EVENT) {
							console.log("New cake");
							// console.log("cake spawn id", arr[2]);
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
										dynamic: true,
									},
								];
							}
						} else if (arr[0] === CAKE_COLLIDE_EVENT) {
							console.log("Collision");
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
						} else if (arr[0] === CAKE_GONE_EVENT) {
							if (arr[1] === 0) {
								// this event is triggered when a cake touches water or something
								cakes = cakes.filter((c) => c.id !== arr[2]);
							}
						} else if (arr[0] === CAKE_FINAL_EVENT) {
							if (arr[1] === 0) {
								// this event is triggered when a cake collides with a player
								cakes = cakes.map((c) => {
									if (c.id !== arr[2]) {
										return c;
									} else {
										// console.log("OLD C", c);
										// console.log("NEW POS", arr.subarray(3));
										return {
											...c,
											position: [arr[3], arr[4], arr[5]],
											rotation: [arr[6], arr[7], arr[8]],
											dynamic: false,
										};
									}
								});
							}
						} else if (arr[0] === BARRICADE_SPAWN_EVENT) {
							// console.log("OWNER", arr[1], "BARRICADE ID", arr[2], "ok", own_id);
							barricades = [...barricades, {
								id: arr[2],
								position: [arr[3], arr[4], arr[5]],
								rotation: [arr[6], arr[7], arr[8]],
								dynamic: true,
								owner: arr[1]
							}];
							if (arr[1] === own_id) {
								console.log("ok so deleting soon");
								setTimeout(() => {
									if (!$socket) return;
									console.log("Barricade gone");
									$socket.send(new Float32Array([BARRICADE_GONE_EVENT, arr[2]]));
								}, 3000);
							}
						} else if (arr[0] === BARRICADE_GONE_EVENT) {
							barricades = barricades.filter((br) => !(br.id === arr[2] && br.owner === arr[1]));
						} else if (arr[0] === BARRICADE_FINAL_EVENT) {
							barricades = barricades.map((br) => {
								if (!(br.id === arr[2] && br.owner === arr[1])) {
									return br;
								} else {
									return {
										...br,
										position: [arr[3], arr[4], arr[5]],
										rotation: [arr[6], arr[7], arr[8]],
										dynamic: false,
									};
								}
							});
						}
					} else {
						const arr = new Uint8Array(m.data);
						if (arr[0] === USER_DATA_EVENT) {
							// maybe have a text event specifically for name? This can bug and make f32 events bugged...
							// console.log("RECEIVED NAME", decodeURIComponent(new TextDecoder().decode(arr.subarray(3))));
							console.log("RECEIVED PLAYER ID", arr[1]);
							console.log("BYTE LENGTH", arr.byteLength);
							if ($host) {
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
									skin: arr[2],
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
							own_id = arr[1];
							if (arr[1] == 0) {
								realSeed = seed === 0 ? 1 : seed;
								playerPos.set([0, 10, 3]);
								host.set(true);
							}
							console.log(own_id);
						} else if (arr[0] === DIED_OF_DEATH) {
							console.log("DIED");
							if (!$host) death.set(true);
						} else if (arr[0] === GERMINATION_EVENT) {
							console.log("Received seed", arr[1]);
							realSeed = arr[1];
							// because host cannot receive event 42
							playerPos.set([Math.floor(Math.random() * 200) - 100, 10, Math.floor(Math.random() * 200) - 100]);
						} else if (arr[0] === PLAYER_LEAVE_EVENT) {
							console.log("Player left", arr[1]);
							players = players.filter((p) => p.id !== arr[1]);
						} else if (arr[0] === START_LOBBY_EVENT) {
							playerCount = players.length;
							lobby = false;
						} else if (arr[0] === BITCHLESS_EVENT) {
							players = players.filter((p) => p.id !== arr[1]);
						} else if (arr[0] === HOST_WIN_EVENT) {
							if (arr[1] === 0) {
								hostWin.set(true);
								gameEnd.set(true);
								// alert("The host has won!");
							}
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
			ws.onclose = (m) => {
				console.log("WS closed.");
				// clearInterval(intv);
				socket.set(null);
				score.set(0);
				freeze.set(0);
				death.set(false);
				host.set(false);
				realSeed = undefined;
				spectator = false;
				players = [];
				menu = true;
				// lobby = false;
				cakes = [];
				barricades = [];
				hostCakes = [];
				own_id = null;
				started = false;
				hostWin.set(false);
				gameEnd.set(false);
				if (m.code === 4001) {
					alert("Room already started!");
				}
				if (m.code === 1007) {
					alert("Your query string was unexpected edited");
				}
				// Room now closes when host leaves
			};
		} else {
			lives.set(1);
		}
		menu = false;
		score.set(0);
		freeze.set(0);
		// set when seed is germinated
		// playerPos.set([0, 10, 3]);
	}

	$: {
		if (!$socket || $socket.readyState !== 1 || !started || lobby) break $;
		if ($host && players.length === 0) {
			$socket.send(new Uint8Array([HOST_WIN_EVENT]));
			hostWin.set(true);
			gameEnd.set(true);
			// alert("HOST WINS!");
		} else if ($score >= getMaxScoreByPlayerCount(playerCount)) {
			hostWin.set(false);
			gameEnd.set(true);
			// alert("The people have won!");
		}
	}

	$: {
		if ($gameEnd && $host) {
			setTimeout(()=> $socket?.close(), 10000);
		}
	}

	$: (async _ => {
		const key = await importEncryptionKey(jwk);
		localStorage.setItem("zed-bra", await encrypt($azure + "", key));
	})();


	$: {
		if ($gameEnd) {
			noGravity(); 
		} else{
			normalGravity();
		} 
	}

	onMount(async () => {

		if ("config" in localStorage) {
			// there may be compatibility issues
			gameConfig.update((gc) => ({ ...gc, ...JSON.parse(localStorage.getItem("config")!) }));
		}

		if ("highScore" in localStorage) {
			highScore.set(+localStorage.getItem("highScore")!);
		}

		const key = await importEncryptionKey(jwk);

		if ("zed-bra" in localStorage) {
			azure.set(+(await decrypt(localStorage.getItem("zed-bra")!, key)));
			console.log("AZURE", $azure);
		}
		// save at the end
		window.addEventListener("unload", async (_) => {
			localStorage.setItem("config", JSON.stringify($gameConfig));
			localStorage.setItem("highScore", "" + $highScore);
		});
	});

	onDestroy(() => {
		$socket?.close();
		socket.set(null);
	});

	transitions();

	let cam: THREE.PerspectiveCamera | undefined;

	let z_ratio = 1;

	$: {
		if (!cam) break $;
		if (currentCtx.name === "Skins") {
			cam.position.set(10 / z_ratio, 10 / z_ratio, 10 / z_ratio);
			cam.fov = 90;
			cam.lookAt(0, 1, 0);
		} else if (currentCtx.name === "Shop") {
			cam.position.set(0, z_ratio === 1 ? 2 : 0.7, $mobile ? z_ratio === 1 ? 10 : 4 : z_ratio === 1 ? 6 : 2.7);
			cam.fov = 120;
			cam.lookAt(0, 0.5, 0);
			// cam.lookAt(5, 5, 0);
		}
	}
</script>

<Fps />

<svelte:window on:resize={() => {
	z_ratio = 2;
}} />

{#if menu}
	<Suspense final on:load={() => (isSuspend = false)}>
		<Root slot="fallback">
			<Loading />
		</Root>
		<Assets />
		<Sidebar {isSuspend} bind:currentCtx />

		<!-- {#if currentCtx.name === "Skins"} -->
		<T.PerspectiveCamera makeDefault bind:ref={cam} />
		<Skins visible={currentCtx.name === "Skins"} bind:skin />
		<!-- {:else if currentCtx.name === "Seed"} -->
		<Seed visible={currentCtx.name === "Seed"} bind:seed />
		<!-- {:else if currentCtx.name === "Shop"} -->
		<Shop visible={currentCtx.name === "Shop"} bind:skin />
		<!-- {:else if currentCtx.name === "Play"} -->
		<Play
			visible={currentCtx.name === "Play"}
			bind:username
			bind:room
			on:singleplayer={() => {
				realSeed = seed;
				playerPos.set([0, 10, 3]);
				startGame(false);
			}}
			on:multiplayer={() => startGame(true)}
			on:tutorial={() => {
				menu = false;
				tutorial = true;
			}}
		/>
		<!-- {:else if currentCtx.name === "Settings"} -->
		<Settings visible={currentCtx.name === "Settings"} />
		<!-- {:else if currentCtx.name === "Manual"} -->
		<Manual visible={currentCtx.name === "Manual"} />
		<!-- {:else if currentCtx.name === "Credits"} -->
		<Credits visible={currentCtx.name === "Credits"} />
		<!-- {/if} -->
	</Suspense>
{:else if tutorial}
	<Suspense>
		<Root slot="fallback">
			<Loading />
		</Root>
		<Tutorial
			on:end={() => {
				death.set(false);
				host.set(false);
				realSeed = undefined;
				tutorial = false;
				menu = true;
			}}
		/>
	</Suspense>
{:else if realSeed === undefined}
	<Root>
		<dialog class="block z-[2] duration-[5s] ease-in-out">Waiting for germination...</dialog>
	</Root>
{:else if lobby}
	<Lobby {skin} {players} {logs} on:message={(msg) => {
		logs = ["YOU: " + msg.detail, ...logs];
		$socket?.send(TXT_MESSAGE_CREATE + msg.detail);
	}} />
{:else}
	<Suspense final>
		<Root slot="fallback">
			<Loading />
		</Root>

		<Game
			bind:chatActive
			bind:hostCakes
			bind:spectator
			{logs}
			{realSeed}
			{username}
			{own_id}
			{cakes}
			{barricades}
			{skin}
			{players}
			{playerCount}
			on:exit={_ => {
                menu = true;
				hostWin.set(false)
				gameEnd.set(false)
                death.set(false);
                realSeed = undefined;
                tutorial = false;
                lobby = false;
                started = false;
            }}
			on:message={(m) => {
				logs = ["YOU: " + m.detail, ...logs];
                $socket?.send(TXT_MESSAGE_CREATE + m.detail);
			}}
		/>
	</Suspense>
{/if}
