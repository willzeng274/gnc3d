<script lang="ts">
	import { useFrame } from "@threlte/core";
	import { createTransition, interactivity, transitions } from "@threlte/extras";
	import { 
		death, 
		freeze, 
		playerAnimation, 
		playerLinvel, 
		playerPos, 
		playerRotation, 
		score, 
		socket, 
		gameConfig, 
		azure,
		startGameBool
		} from "$lib/store";
	import Fps from "./Fps.svelte";
	import { spring } from "svelte/motion";
	// import * as Modals from "$lib/ui/modal";
	import Root from "./Root.svelte";
	import { onDestroy, onMount, setContext } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { scale as SvelteScale } from "svelte/transition";
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
	} from "$lib/utils";
	import type { Barricade, Cake, CakeGenItem, ConnectedPlayer, LobbyItems, MenuItems, TutorialItems } from "$lib/types";
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
        type ShopItem,
	} from "$lib/constants";
	import RenderLobby from "$lib/renders/renderLobby.svelte";
	import RenderMenu from "$lib/renders/renderLobby.svelte";
	import RenderTutorial from "$lib/renders/renderTutorial.svelte";
	import RenderAssets from "$lib/renders/renderAssets.svelte";

	export const scaleIn = (node: Element) =>
		SvelteScale(node, {
			duration: 200,
			opacity: 0,
		});

	export const scaleOut = (node: Element) =>
		SvelteScale(node, {
			duration: 200,
			opacity: 0,
		});


	let seed: number | undefined;
	let mobile: boolean = false;
	let realSeed: number | undefined;
	let isSuspend = true;
	let menu = true;
	let lobby = false;
	let tutorial = false;
	let skin: number = -1;
	export // let skin: number = 4;
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
	export let players: ConnectedPlayer[] = [];

	export let currentCtx = contextMenuItems[0];

	export let currentShopSkin:ShopItem = shopItems[0];

	export let cakes: Cake[] = [];

	export let barricades: Barricade[] = [];

	export let own_id: number | null = null;

	export let lastUpdated = Date.now();

	// TODO: websocket frame rate, if frame rate drops below 3 then the host automatically disconnects
	// we'll limit to 30 fps for now
	// small issue: may not update latest frame

	const lobbyItemsObj = ():LobbyItems => {return {
		players,
		skin,
		host,
		logs,
		message
	}}
	const menuItemsObj =  ():MenuItems => {
		return {
			skin,
			isSuspend,
			currentCtx,
			mobile,
			cam,
			rotation,
			scale,
			scale2,
			zoomIn,
			zoomOut,
			realSeed,
			seed,
			menu,
			tutorial,
			currentShopSkin,
			scaleIn,
			scaleOut,
			username,
			room
		}
	}
	const tutorialItemsObj = ():TutorialItems=> {
		return {
			host,
			realSeed,
			tutorial,
			menu,
		}
	}

	export let latest_frame: number[] | null = null;
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

	let started = false;

	function startGame(connectWs: boolean = false) {
		if (started) return;
		started = true;
		console.log("Starting game... Connect:", connectWs);
		if (connectWs) {
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
								// host.subscribe()
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
				started = false;
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
	$startGameBool ? startGame(true): startGame(false);
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
			
	setContext('tutorialItems',tutorialItemsObj());
	setContext('lobbyItems',lobbyItemsObj());
	setContext('menuItems',menuItemsObj());
</script>

<Fps />

<svelte:window on:resize={() => {
	z_ratio = 2;
}} />

{#if realSeed === undefined}
	<Root>
		<dialog class="block z-[2] duration-[5s] ease-in-out">Waiting for germination...</dialog>
	</Root>
{:else}
<RenderAssets visible={true}/>
{/if}


<RenderMenu visible={menu}/>
<RenderTutorial visible={tutorial}/>
<RenderLobby visible={lobby}/>

