<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import { Suspense, createTransition, interactivity, transitions, Text } from "@threlte/extras";
	import { AutoColliders, CollisionGroups, Debug, RigidBody } from "@threlte/rapier";
	import { BoxGeometry, MeshStandardMaterial } from "three";
	import Door from "../rapier/world/Door.svelte";
	import Player from "./Player.svelte";
	import Ground from "../rapier/world/Ground.svelte";
	import CakeGen from "./CakeGen.svelte";
	import Ybot from "./models/Ybot.svelte";
	import Woman from "$lib/rapier/world/Woman.svelte";
	import { death, freeze, playerAnimation, playerLinvel, playerPos, playerRotation, score, socket, gameConfig, azure } from "$lib/store";
	import Player2 from "./Player2.svelte";
	import Fps from "./Fps.svelte";
	import { spring } from "svelte/motion";
	import Xbot from "./models/Xbot.svelte";
	import TextInput from "$lib/ui/textInput.svelte";
	// import * as Modals from "$lib/ui/modal";
	import Root from "./Root.svelte";
	import { onDestroy, onMount } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { scale as SvelteScale } from "svelte/transition";
	import Particle from "./Particle.svelte";
	import Tutorial from "./Tutorial.svelte";
	import James from "./models/James.svelte";
	import { PUBLIC_PROD, PUBLIC_CREATOR_HAS_WIFI } from "$env/static/public";
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
		getSkinNameByNumber,
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
		shopItems,
		jwk,
		CAKE_GONE_EVENT,
		BARRICADE_SPAWN_EVENT,
		BARRICADE_GONE_EVENT,
		BARRICADE_FINAL_EVENT,
	} from "$lib/constants";
	import House from "$lib/rapier/world/House.svelte";
	import Blackhole from "$lib/rapier/world/Blackhole.svelte";
	import Bigvegas from "./models/Bigvegas.svelte";
	import Boss from "./models/Boss.svelte";
	import Assets from "./models/Assets.svelte";
	import Timmy from "./models/Timmy.svelte";
    import NumberInput from "$lib/ui/numberInput.svelte";
	import Button from "$lib/ui/button.svelte";
	import ToggleInput from "$lib/ui/toggleInput.svelte";
	import ParticleBar from "./ParticleBar.svelte";

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
	let lobby = false;
	let tutorial = false;
	let chatActive = false;
	let skin: number = -1;
	// let skin: number = 4;
	let frozen: number = 0;
	let room: string = "";
	let host: boolean = false;
	let message: string = "";
	let logs: string[] = [];
	let hostCakes: CakeGenItem[] = [];
	let highScore: number = 0;
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

	let currentCtx = contextMenuItems[0];

	let currentShopSkin = shopItems[0];

	let cakes: Cake[] = [];

	let barricades: Barricade[] = [];

	let own_id: number | null = null;

	let lastUpdated = Date.now();

	// TODO: websocket frame rate, if frame rate drops below 3 then the host automatically disconnects
	// we'll limit to 30 fps for now
	// small issue: may not update latest frame
	let latest_frame: number[] | null = null;
	$: {
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
	setInterval(() => {
		if ($socket && Date.now() - lastUpdated >= 1000 / 20 && !lobby && !menu && latest_frame) {
			$socket.send(new Float32Array(latest_frame));
			latest_frame = null;
		}
	}, 50);

	function startGame(connectWs: boolean = false) {
		console.log("Starting game... Connect:", connectWs);
		if (connectWs) {
			lobby = true;
			// const intv = setInterval(() => {
			// 	if (!$socket || lobby) return;
			// 	// probably better if these are separate events...
			// 	$socket.send(
			// 		new Float32Array([
			// 			USER_STATE_UPDATE,
			// 			$playerPos[0],
			// 			$playerPos[1],
			// 			$playerPos[2],
			// 			$playerLinvel[0],
			// 			$playerLinvel[1],
			// 			$playerLinvel[2],
			// 			$playerRotation[0],
			// 			$playerRotation[1],
			// 			$playerRotation[2],
			// 			convertAnimationToInt($playerAnimation),
			// 		])
			// 	);
			// }, 100);
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
								host = true;
							}
							console.log(own_id);
						} else if (arr[0] === DIED_OF_DEATH) {
							console.log("DIED");
							if (!host) death.set(true);
						} else if (arr[0] === GERMINATION_EVENT) {
							console.log("Received seed", arr[1]);
							realSeed = arr[1];
							// because host cannot receive event 42
							playerPos.set([Math.floor(Math.random() * 200) - 100, 10, Math.floor(Math.random() * 200) - 100]);
						} else if (arr[0] === PLAYER_LEAVE_EVENT) {
							console.log("Player left", arr[1]);
							players = players.filter((p) => p.id !== arr[1]);
						} else if (arr[0] === START_LOBBY_EVENT) {
							lobby = false;
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
				host = false;
				realSeed = undefined;
				players = [];
				menu = true;
				// lobby = false;
				cakes = [];
				barricades = [];
				hostCakes = [];
				own_id = null;
				if (m.code === 4001) {
					alert("Room already started!");
				}
				if (m.code === 1007) {
					alert("Your query string was unexpected edited");
				}
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

	$: (async (_) => {
		const key = await importEncryptionKey(jwk);
		localStorage.setItem("zed-bra", await encrypt($azure + "", key));
	})();

	// You can no longer unlock wizard via k3

	onMount(async () => {
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
			gameConfig.update((gc) => ({ ...gc, ...JSON.parse(localStorage.getItem("config")!) }));
		}

		if ("highScore" in localStorage) {
			highScore = +localStorage.getItem("highScore")!;
		}

		const key = await importEncryptionKey(jwk);

		if ("zed-bra" in localStorage) {
			azure.set(+(await decrypt(localStorage.getItem("zed-bra")!, key)));
			console.log("AZURE", $azure);
		}
		// save at the end
		window.addEventListener("unload", async (_) => {
			localStorage.setItem("config", JSON.stringify($gameConfig));
			localStorage.setItem("highScore", "" + highScore);
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
			cam.position.set(0, z_ratio === 1 ? 2 : 0.7, mobile ? z_ratio === 1 ? 10 : 4 : z_ratio === 1 ? 6 : 2.7);
			cam.fov = 120;
			cam.lookAt(0, 0.5, 0);
			// cam.lookAt(5, 5, 0);
		}
	}

	$: {
		if ($score > 200) {
			$gameConfig.vegasUnlocked = true;
		}
		if ($score > highScore) {
			highScore = $score;
		}
		// why would u have a high score of above a million
		if ($score > 1e6 || highScore > 1e6) {
			highScore = 0;
			score.set(0);
			alert("Bro is exploiting! Your scores are reset");
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
			<!-- this to tw -->
			<p
				style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
			>
				Loading game assets...
			</p>
		</Root>
		<Assets />
		<Root>
			<section class="w-full h-full flex flex-col lg:flex-row items-center justify-end" class:hide={isSuspend}>
				<ul class="flex flex-row lg:flex-col overflow-x-scroll lg:overflow-auto h-[20%] lg:h-full items-center justify-start lg:justify-center mr-1 w-full lg:w-[15%] bg-slate-800 text-white list-none rounded-md p-1 z-[1]">
					{#each contextMenuItems as ctx}
						<li
							data-state={currentCtx == ctx ? "active" : undefined}
							class="flex flex-col items-center justify-center w-full h-[90%] lg:h-[7%] p-4 transition-[height]
								duration-500 hover:h-[100%] lg:hover:h-[10%] border border-solid border-slate-700
								first:rounded-l-[4px] last:rounded-r-[4px]
								lg:first:rounded-t-[4px] lg:last:rounded-b-[4px]"
						>
							<button class="bg-transparent border-none text-xs sm:text-lg w-full h-full text-center text-white" on:click={() => (currentCtx = ctx)}>{ctx.name}</button>
						</li>
					{/each}
				</ul>
			</section>
		</Root>

		<!-- {#if currentCtx.name === "Skins"} -->
		<T.PerspectiveCamera makeDefault bind:ref={cam} />
		<T.Group visible={currentCtx.name === "Skins"}>
			<T.DirectionalLight position={[0, 10, 10]} castShadow />
			<T.Group position.x={mobile ? -1.5 : -3} position.z={mobile ? 1.5 : 3} in={zoomIn} out={zoomOut}>
				<T.Group
					rotation.y={rotation}
					position.y={$scale}
					scale={$scale}
					on:pointerenter={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1.5)}
					on:pointerleave={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1)}
					on:click={() => {
						if (skin === 1) {
							scale.set(2.5);
							setTimeout(() => scale.set(1), 700);
							skin = -1;
						} else {
							scale.set(2);
							scale2.set(1);
							skin = 1;
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
					on:pointerenter={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1.5)}
					on:pointerleave={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1)}
					on:click={() => {
						if (skin === 0) {
							scale2.set(2.5);
							setTimeout(() => scale2.set(1), 700);
							skin = -1;
						} else {
							scale2.set(2);
							scale.set(1);
							skin = 0;
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
		</T.Group>
		<!-- {:else if currentCtx.name === "Seed"} -->
		{#if currentCtx.name === "Seed"}
			<Root>
				<dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
					<h1 class="text-xl text-center font-semibold pt-5 pb-1">Enter a map seed</h1>
					<p class="text-sm text-gray-500 px-[7%] pb-5">
						Type a number, leave it as 0 for random
						<NumberInput type="number" placeholder="Enter seed" showTopDivider={false} bind:value={seed} class="w-full"><p class="pt-1">Seed</p></NumberInput>
					</p>
				</dialog>
			</Root>
		{/if}
		<!-- {:else if currentCtx.name === "Shop"} -->
		<T.Group visible={currentCtx.name === "Shop"}>
			<T.DirectionalLight position={[0, 10, 10]} castShadow intensity={currentShopSkin.isUnlocked($gameConfig) ? 1 : 0.2} />
			<T.Group position.x={0} position.z={0} in={zoomIn} out={zoomOut}>
				<T.Group
					position.y={1}
					position.z={0}
					on:click={(_) =>
						currentShopSkin.isUnlocked($gameConfig) &&
						(skin === currentShopSkin.skin ? (skin = -1) : (skin = currentShopSkin.skin))}
				>
					<T.Mesh
						material={new MeshStandardMaterial({
							color: "red",
						})}
					>
						<T.BoxGeometry args={[1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group
					position.y={!mobile ? 1 : 2.2}
					position.x={!mobile ? -2 : 0}
					on:click={(_) => (currentShopSkin = shopItems[Math.max(0, currentShopSkin.index - 1)])}
				>
					<T.Mesh
						material={new MeshStandardMaterial({
							color: "yellow",
						})}
					>
						<T.BoxGeometry args={mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group
					position.y={!mobile ? 1 : -0.5}
					position.x={!mobile ? 2 : 0}
					position.z={!mobile ? 0 : 1}
					on:click={(_) => (currentShopSkin = shopItems[Math.min(currentShopSkin.index + 1, shopItems.length - 1)])}
				>
					<T.Mesh
						material={new MeshStandardMaterial({
							color: "lightgreen",
						})}
					>
						<T.BoxGeometry args={mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
					</T.Mesh>
				</T.Group>
				<T.Group rotation.y={rotation} position.y={1} position.z={1} castShadow>
					<James currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 2} />
					<Bigvegas currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 3} />
					<Boss currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 4} />
					<Timmy currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 5} />
				</T.Group>
				<!-- <T.Group rotation.y={rotation} position.x={4} position.y={1} position.z={0} castShadow>
					<Bigvegas currentActionKey={skin === 3 ? "tpose" : "idle"} />
				</T.Group> -->
				<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
					<T.CircleGeometry args={[2, 40]} />
					<T.MeshStandardMaterial color="white" />
				</T.Mesh>
				{#if PUBLIC_CREATOR_HAS_WIFI === "true"}
					<Text
						position.z={1.5}
						color={currentShopSkin.isUnlocked($gameConfig) ? 0x355e3b : "white"}
						text={currentShopSkin.skinText}
						fontSize={0.5}
						anchorX="50%"
						anchorY="100%"
					/>
					<Text position.z={1.7} color="#9b870c" text={currentShopSkin.perk} fontSize={0.1} anchorX="50%" anchorY="100%" />
					{#if !currentShopSkin.isUnlocked($gameConfig)}
						<Text
							position.y={-0.5}
							position.z={1.7}
							color="#ff8000"
							text={currentShopSkin.unlock}
							fontSize={0.2}
							anchorX="50%"
							anchorY="100%"
						/>
						{#if currentShopSkin.handleClick() !== null && currentCtx.name === "Shop"}
							<Root>
								<dialog class="flex flex-col z-[2] rounded-md">
									<Button on:click={currentShopSkin.handleClick()}>BUY</Button>
								</dialog>
							</Root>
						{/if}
					{/if}
				{/if}
			</T.Group>
		</T.Group>
		<!-- {:else if currentCtx.name === "Play"} -->
		{#if currentCtx.name === "Play"}
			<Root>
				<dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
					<Button
						on:click={() => {
							realSeed = seed;
							playerPos.set([0, 10, 3]);
							startGame(false);
						}} class="text-lg font-semibold">Singleplayer</Button
					>
					<Button
						on:click={() => {
							menu = false;
							tutorial = true;
						}} class="text-lg font-semibold my-2">Play tutorial</Button
					>
					<p>Multiplayer rooms</p>
					<div>
						<TextInput childAtStart={false} placeholder="Enter room ID" type="text" bind:value={room}><button
							on:click={() => {
								startGame(true);
							}}>Join room</button></TextInput>
					</div>
					
					<TextInput type="text" showTopDivider={false} bind:value={username} placeholder="Enter a username"><p>Username:</p></TextInput>
				</dialog>
			</Root>
		{:else if currentCtx.name === "Settings"}
			<Root>
				<dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
					<div class="mt-2">
						<!-- <input type="checkbox" bind:checked={$gameConfig.fps} /> -->
						<ToggleInput bind:checked={$gameConfig.fps}>
							<p class="pb-2">Enable first person on start</p>
						</ToggleInput>
					</div>
					<div class="mt-2">
						<ToggleInput bind:checked={$gameConfig.shader}>
							<p class="pb-2">Enable shaders</p>
						</ToggleInput>
					</div>
					<div class="mt-2">
						<ToggleInput bind:checked={$gameConfig.debugMode}>
							<p class="pb-2">Enable debug mode (LAG WARNING)</p>
						</ToggleInput>
					</div>
					<div class="mt-2">
						<ToggleInput bind:checked={$gameConfig.blackhole}>
							<p class="pb-2">Enable blackhole mode</p>
						</ToggleInput>
					</div>
					<div class="mt-2">
						<ToggleInput bind:checked={$gameConfig.autosprint}>
							<p class="pb-2">Enable auto sprint</p>
						</ToggleInput>
					</div>
					<div class="mt-2">
						<NumberInput type="number" bind:value={$gameConfig.womenCount} class="my-1">
							<p class="pt-1"># of women in singleplayer</p>
						</NumberInput>
					</div>
					<div class="mt-2">
						<NumberInput type="number" bind:value={$gameConfig.fov} class="my-1">
							<p class="pt-1">FOV</p>
						</NumberInput>
					</div>
					<div class="mt-2">
						<p class="-translate-y-0.5 inline-block">Soundeffect volume</p>
						<input type="range" min={0} max={1000} step={1} bind:value={$gameConfig.volume} />
						<p class="-translate-y-0.5 inline-block">{$gameConfig.volume}%</p>
					</div>
				</dialog>
			</Root>
		{:else if currentCtx.name === "Manual"}
			<Root>
				<dialog class="flex flex-col z-[2] p-4 rounded-md max-w-[80%] lg:max-w-[60%] max-h-[70%] lg:max-h-full overflow-y-scroll" in:scaleIn out:scaleOut>
					<h1 class="text-xl text-center font-semibold pt-5 pb-1">Game manual</h1>
					<p class="text-sm text-gray-500 px-[7%] pb-5">
						WASD or Joystick for movement (Hold shift to sprint, on mobile the sprint detection is automatic)
						<br />
						Pointer drag for camera rotation in Third Person (and both POVs on mobile)
						<br />
						Pointer lock for camera rotation in First Person
						<br />
						Mouse wheel or Slider for zooming in/out
						<br />
						Adjust FOV in settings
						<br />
						Press "e" to emote with applicable skins
						<br />
						Press "f" to dash
						<br />
						Press "q" to place barricades
						<br />
						Press "t" to open chat in multiplayer
						<br />
						Press "esc" to exit chat in multiplayer
						<br />
						Mobile players cannot chat
						<br />
						Press green panel in skin shop to go to next skin, yellow panel to go to previous
						<br />
						Enter a seed in the seed panel for persistent seeded terrain generation, leave at 0 for random
						<br /><br />
						Game history and lore: Ghost and cakes is a game originally created by Jerrdeh (2018) with block coding.
						The point of the game was to click on cakes that randomly spawn while a ghost chases after your cursor.
						Sir NastyPigz enhanced the block coding version in the 2019-2020 era, allowing more cake types
						and a partially working multiplayer version. A JavaScript version was also transpiled during this time.
						However, it wasn't until early 2022 that the game was completely rewritten in JavaScript and React 17,
						bootstrapped with Next.js. Although, the game was stuck in 2D and had no sign of graphical improvements.
						Now, time lapse to 2023, Sir NastyPigz have successfully studied enough Physics, Math, and Computer Science
						to bring you a 3D experience of the game! However, there were some technical difficulties with creating a
						ghost model, therefore the main threat of the game -- the ghost was replaced by the true threat of
						all of the humanity -- the woman. Now in singleplayer, there is a woman chasing after you
						for your money! If you are broke, then you can picture her as an extreme feminist. If you are
						a woman (somehow), please first slide into Sir NastyPigz's DMs (Discord: Snarkatude) and then
						picture the woman as an insane individual belonging to your (different) species.
					</p>
				</dialog>
			</Root>
		{:else if currentCtx.name === "Credits"}
			<Root>
				<dialog class="flex flex-col z-[2] p-2 rounded-md max-w-[80%] lg:max-w-[60%] max-h-[70%] lg:max-h-full overflow-y-scroll" in:scaleIn out:scaleOut>
					<h1 class="text-xl text-center font-semibold pt-5 pb-1">Credits</h1>
					<p class="text-sm text-gray-500 px-[7%] pb-5">
						All character models attributed to Adobe Creative Cloud
						<br />
						Barricade modelled by Google Poly
						<br />
						Cakes modelled by Harry Charalambous from sketchfab
						<br />
						Soundtrack attributed to ImRuscelOfficial, Lyricist and Composer is Laura Shigihara
						<br />
						Developer team:
						<a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
							NastyPigz
						</a>,
						<a data-sveltekit-preload-data="tap" href="https://github.com/Rashaad1268">
							Rush
						</a>,
						<a data-sveltekit-preload-data="tap" href="https://github.com/Rei-ath">
							Rei-ath
						</a>
						<br />
						Marketing team:
						<a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
							NastyPigz
						</a>,
						<a data-sveltekit-preload-data="tap" href="https://github.com/drapespy">
							Drapes
						</a>,
						<a data-sveltekit-preload-data="tap" href="https://github.com/jason-11x">
							Jason
						</a>
						<iframe class="w-full h-[50vh] my-4 rounded-md" title="Ghost and cakes promotion video" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.youtube.com/embed/bdM8eMEgHJI?autoplay=0&fs=0&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0">
						</iframe>
						GitHub Links:
						<br />
						<a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d">
							Frontend
						</a>
						<br />
						<a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d-backend">
							Backend
						</a> 
						<br /><br />
						Copyright (c) 2023 NastyPigz
						<br /><br />
						Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
						<br /><br />
						The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
						<br /><br />
						THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
					</p>
				</dialog>
			</Root>
		{/if}
	</Suspense>
{:else if tutorial}
	<Suspense>
		<Root slot="fallback">
			<!-- this to tw -->
			<p
				style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
			>
				Loading game assets...
			</p>
		</Root>
		<Tutorial
			on:end={() => {
				death.set(false);
				host = false;
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
	<Root>
		<dialog class="lobby p-4 rounded-md">
			<h2>LOBBY MENU</h2>
			<h3>You are {host ? "host" : "guest"}</h3>
			<h4>Players:</h4>
			<div class="player">
				<p>YOU</p>
				<div>SKIN {getSkinNameByNumber(skin)}</div>
			</div>
			{#each players as p (p.id)}
				<div class="player">
					<p style={p.id === 0 ? "color: red" : undefined}>ID {p.id} NAME {p.name}</p>
					<div>
						SKIN {getSkinNameByNumber(p.skin)}
					</div>
				</div>
			{/each}
			<h6>Player count: {players.length + 1}</h6>
			{#if host}
				<Button
					on:click={(_) => {
						$socket?.send(new Uint8Array([START_LOBBY_EVENT]));
					}}>Start game as (g)host</Button
				>
			{/if}
			<Button on:click={(_) => $socket?.close()}>{host ? "Disband" : "Leave"} lobby</Button>
		</dialog>
		<dialog class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-0 max-h-[20%] p-2 rounded-md">
			<div class="w-full overflow-y-scroll">
				{#each logs as msg}
					<p>{msg}</p>
				{/each}
			</div>
			<TextInput
				childAtStart={false}
				type="text"
				placeholder="Message"
				bind:value={message}
				on:keypress={(e) => {
					if (e.key === "Enter") {
						logs = ["YOU: " + message, ...logs];
						$socket?.send(TXT_MESSAGE_CREATE + message);
						message = "";
					}
				}}
			><Button
				on:click={(_) => {
					logs = ["YOU: " + message, ...logs];
					$socket?.send(TXT_MESSAGE_CREATE + message);
					message = "";
				}}>Send message</Button
			></TextInput>
		</dialog>
	</Root>
{:else}
	<Suspense final>
		<Root slot="fallback">
			<!-- this to tw -->
			<p
				style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
			>
				Loading game assets...
			</p>
		</Root>
		<!-- <T.Group slot="fallback">
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
		</T.Group> -->

		<Root>
			<div class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-[5%] items-center justify-center text-center">
				<div class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] px-4">
					<p>Score: {$score} | Best: {highScore} | Azure crystals owned: {$azure}</p>
				</div>
				<!-- Small inconvenience but it's fine! -->
				{#if ($socket !== null && host) || $socket === null}
					<div class="freeze"><p>Frozen for: {frozen}</p></div>
				{/if}
			</div>
			{#if $socket === null}
				<Button
					on:click={() => {
						menu = true;
						death.set(false);
						realSeed = undefined;
						tutorial = false;
						lobby = false;
					}}
					class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit game</Button
				>
			{:else}
				<Button on:click={() => $socket?.close()} class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit Game </Button>
			{/if}
			<dialog class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-[0] max-h-[20%] p-2 rounded-md" class:hidden={!chatActive}>
				<div class="w-full overflow-y-scroll">
					{#each logs as msg}
						<p>{msg}</p>
					{/each}
				</div>
				<TextInput childAtStart={false}
					type="text"
					placeholder="Message"
					bind:value={message}
					on:keypress={(e) => {
						if (e.key === "Enter") {
							logs = ["YOU: " + message, ...logs];
							$socket?.send(TXT_MESSAGE_CREATE + message);
							message = "";
						}
					}}
				><Button
					on:click={(_) => {
						logs = ["YOU: " + message, ...logs];
						$socket?.send(TXT_MESSAGE_CREATE + message);
						message = "";
					}}>Send message</Button></TextInput>
			</dialog>
		</Root>

		<T.DirectionalLight castShadow position={[8, 20, -3]} />

		{#if $gameConfig.debugMode}
			<Debug />
		{/if}

		<!-- <T.GridHelper args={[50]} position.y={0.01} /> -->

		<CollisionGroups groups={[0, 15]}>
			<Ground seed={realSeed} enableShaders={$gameConfig.shader} />
		</CollisionGroups>
		<CollisionGroups groups={[0]}>
			<House />
			<Player {username} {host} skin={skin === -1 ? 0 : skin} on:tpress={(_) => (chatActive = !chatActive)} />
			<Door />
			{#if $socket !== null}
				{#if host}
					<CakeGen host bind:items={hostCakes} />
				{:else}
					{#each cakes as cake (cake.id)}
						<!-- the touch param is completely useless for a non-host -->
						<Particle
							id={cake.id}
							position={cake.position}
							rotation={cake.rotation}
							type={cake.type}
							touch={0}
							{host}
							dynamic={cake.dynamic}
						/>
					{/each}
				{/if}
				{#each barricades as barricade (barricade.id)}
					<ParticleBar
						id={barricade.id}
						position={barricade.position}
						rotation={barricade.rotation}
						owner={barricade.owner === own_id}
						dynamic={barricade.dynamic}
					/>
				{/each}
			{:else}
				<CakeGen />
				<Woman {skin} />
				<!-- at least 1 woman from above -->
				{#each { length: $gameConfig.womenCount - 1 } as _}
					<Woman selfPos={[Math.random() * 200 - 100, 8, Math.random() * 200 - 100]} {skin} />
				{/each}
				{#if $gameConfig.blackhole}
					<Blackhole />
				{/if}
			{/if}
			{#each players as p (p.id)}
				<Player2
					id={p.id}
					username={p.name}
					skin={p.skin}
					position={[p.x, p.y, p.z]}
					linvel={[p.linx, p.liny, p.linz]}
					animation={p.animation}
					rotation={p.rotation}
				/>
			{/each}
		</CollisionGroups>
		<CollisionGroups memberships={[5]} filter={[0]}>
			<RigidBody type="fixed" userData={{ name: "structure" }}>
				<AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
					<T.Mesh
						receiveShadow
						castShadow
						position.x={0}
						position.y={4.4}
						geometry={new BoxGeometry(1.75, 3.75, 0.15)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>
					<!-- used to be 2.55 in height -->
					<T.Mesh
						receiveShadow
						castShadow
						position.x={10 + 0.7 + 0.15}
						position.y={3.125}
						geometry={new BoxGeometry(20, 6.3, 0.15)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>

					<T.Mesh
						receiveShadow
						castShadow
						position.x={-10 - 0.7 - 0.15}
						position.y={3.125}
						geometry={new BoxGeometry(20, 6.3, 0.15)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>

					<T.Mesh
						receiveShadow
						castShadow
						position.x={-20 - 0.7 - 0.15}
						position.y={3.125}
						position.z={-10}
						geometry={new BoxGeometry(0.15, 6.3, 20)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>

					<T.Mesh
						receiveShadow
						castShadow
						position.x={20 + 0.7 + 0.15}
						position.y={3.125}
						position.z={-10}
						geometry={new BoxGeometry(0.15, 6.3, 20)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>

					<T.Mesh
						receiveShadow
						castShadow
						position.x={0}
						position.y={3.125}
						position.z={-20}
						geometry={new BoxGeometry(40 + 0.7 + 0.15 * 2 + 0.15 * 4, 6.3, 0.15)}
						material={new MeshStandardMaterial({
							transparent: true,
							opacity: 0.5,
							color: 0x333333,
						})}
					/>
				</AutoColliders>
			</RigidBody>
		</CollisionGroups>
	</Suspense>
{/if}

<style lang="css">
	.hide {
		display: none !important;
	} 
	.lobby {
		display: flex;
		flex-direction: column;
		z-index: 2;
		transition: 5s;
		animation: ease-in-out 5s;
	}

	.lobby h2 {
		font-family: "Comic Sans MS";
		margin: 0;
		margin-bottom: 15%;
		text-align: center;
	}

	.lobby h3,
	.lobby h4 {
		font-family: "Comic Sans MS";
		margin: 0;
		margin-bottom: 10%;
	}

	.lobby p {
		margin: 0;
	}

	.lobby h6 {
		font-family: "Comic Sans MS";
		margin: 0;
		margin-top: 20%;
	}

	.lobby .player {
		font-family: "Comic Sans MS";
		border: 0.125em solid black;
		padding: 0.125em;
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
	

	.hidden {
		display: none;
	}
</style>
