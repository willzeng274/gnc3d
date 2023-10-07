<script lang="ts">
	import type {
		RigidBody as RapierRigidBody,
		Collider as RapierCollider,
	} from "@dimforge/rapier3d-compat";
	import { T, useFrame } from "@threlte/core";
	import { RigidBody, CollisionGroups, Collider } from "@threlte/rapier";
	import { AudioListener, Audio } from "@threlte/extras";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import {
		PerspectiveCamera,
		Vector3,
		MeshBasicMaterial,
		Group,
		Euler,
		Quaternion,
		BoxGeometry,
		Raycaster,
		SphereGeometry,
	} from "three";
	import PointerLockControls from "./PointerLockControls.svelte";
	import Controller from "./ThirdPersonControls.svelte";
	import {
		playerPos,
		death,
		score,
		playerLinvel,
		playerAnimation,
		playerRotation,
		socket,
		freeze,
		gameConfig,
		azure,
		host,
		lives,
		planeGeometry,
		highScore,
	} from "$lib/store";
	import {
		Barricade,
		Bigvegas,
		Boss,
		James,
		Timmy,
		Xbot,
		Ybot,
	} from "$lib/components/models";
	import Username from "./Username.svelte";
	import Root from "./Root.svelte";
	import type { JoystickManagerOptions } from "nipplejs";
	import type { ActionName } from "$lib/types";
	import { arraysSize3AreEqual } from "$lib/utils";
	import {
		BARRICADE_SPAWN_EVENT,
		BITCHLESS_EVENT,
		DIED_OF_DEATH,
	} from "$lib/constants";
	import Fish from "$lib/rapier/world/Fish.svelte";
	export let skin: number;
	export let username: string;
	export let spectator: boolean;
	export let cakeFinity: boolean;
	let zooming: number = -1;
	let dance: boolean = false;
	let mobile: boolean = false;
	let isPLOCK = $gameConfig.fps;
	let radius = skin === 3 ? 0.6 : 0.45; // used to be 0.3
	let height = skin === 3 ? 2.1 : 2; // used to be 1.7
	const speed = 6;
	let rigidBody: RapierRigidBody | undefined;
	let lock: undefined | (() => void);
	let cam: PerspectiveCamera;
	let forward = 0;
	let backward = 0;
	let left = 0;
	let right = 0;
	let shift = 0;
	let model: THREE.Group = new Group();
	let ground = false;
	let structure = false;
	let capsule: THREE.Group;
	let capRef: THREE.Group;
	let collider: RapierCollider;
	let currentActionKey: ActionName = "idle";
	// dash momentum
	let dash: number = 0;
	let lastDash = Date.now() - 5001;
	let barricadeCd = Date.now() - 6001;

	$: if (capsule) {
		capRef = capsule;
	}

	$: {
		if ($death) {
			if ($socket === null) {
				if ($lives > 1) {
					lives.update((lives) => lives - 1);
				} else {
					score.set(0);
				}
			} else {
				if ($lives > 1) {
					lives.update((lives) => lives - 1);
				} else {
					// spectator
					$socket.send(new Uint8Array([BITCHLESS_EVENT]));
					lives.update((lives) => Math.max(0, lives - 1));
					spectator = true;
				}
			}
			setTimeout(() => {
				if (rigidBody) {
					// the player might've left by now
					rigidBody.setTranslation(
						{
							x: $host
								? 0
								: Math.floor(Math.random() * 200) - 100,
							y: 10,
							z: $host
								? 3
								: Math.floor(Math.random() * 200) - 100,
						},
						false
					);
					rigidBody.setLinvel(
						{
							x: 0,
							y: 0,
							z: 0,
						},
						true
					);
				}
				death.set(false);
			}, 5000);
		}
	}
	const t = new Vector3();

	onDestroy(() => {
		rigidBody = undefined;
	});

	$: {
		// console.log(isPLOCK);
		if (isPLOCK && lock && !mobile) {
			lock();
		}
	}

	$: {
		// it goes death > fall > run > walk > dance > idle
		if ($death) {
			currentActionKey = "tpose";
			dance = false;
		} else if (!ground && !structure) {
			currentActionKey = "fall";
			dance = false;
		} else if (
			(right || left || forward || backward) &&
			($gameConfig.autosprint ? !shift : shift)
		) {
			currentActionKey = "running";
			dance = false;
		} else if (right || left || forward || backward) {
			currentActionKey = "walk";
			dance = false;
		} else if (dance) {
			currentActionKey = "dance";
			// } else if (!(right || left || forward || backward)) {
		} else {
			currentActionKey = "idle";
			dance = false;
		}
		playerAnimation.set(currentActionKey);
		// console.log(currentActionKey)
	}

	let prevPos = 0;
	// let velY = 0;
	let camBack = false;
	let rayCounter = Date.now();
	let ballPos: [number, number] = [0, 0];
	// let prevVel = 0;
	useFrame((_, deltaTime) => {
		// console.log("FPS: ", 1 / deltaTime);
		if (fishBall) {
			const tl = fishBall.translation();
			ballPos = [tl.x, tl.z];
		}
		if (!rigidBody || !capsule || $death) return;
		if ($host && $freeze > 0) {
			const linv = rigidBody.linvel();
			linv.x = 0;
			linv.z = 0;
			rigidBody.setLinvel(linv, true);
			if (
				!arraysSize3AreEqual(
					[0, Math.fround(linv.y), 0],
					$playerLinvel
				) ||
				$socket === null
			)
				playerLinvel.set([0, Math.fround(linv.y), 0]);
			return;
		}

		// sex nerf will be an option in the lobby menu
		// const multi = sex ? (shift ? 10 : 5) : (shift ? 0.5 : 0.1);
		// Big vegas can walk normal but 15% sprint reduction
		const multi =
			(cakeFinity ? 5 : 1) * 
			(camBack ? -1 : 1) *
			(spectator ? 10 : 1) *
			(($gameConfig.autosprint ? !shift : shift)
				? skin === 2
					? 1.2
					: skin === 3
					? 0.85
					: skin === 4 || skin === 5
					? 1.1
					: 1
				: skin === 2
				? 0.6
				: 0.5);
		// const multi = shift ? 10 : 8;
		const cameraForward = new Vector3();
		const cameraRight = new Vector3();
		cam.getWorldDirection(cameraForward);
		cameraRight.crossVectors(cameraForward, new Vector3(0, 1, 0));

		// Project to 2D Plane
		cameraForward.y = 0;
		cameraRight.y = 0;

		// console.log(forward-backward, right-left);
		// Normalize
		if (dash > 0) {
			cameraForward
				.normalize()
				.multiplyScalar(dash * (skin === 3 ? 14 : 16) * (cakeFinity ? multi / 5 : multi) * speed);
			cameraRight.normalize().multiplyScalar(0);
			dash = Math.max(dash - deltaTime, 0);
		} else {
			cameraForward
				.normalize()
				.multiplyScalar((forward - backward) * multi * speed);
			cameraRight
				.normalize()
				.multiplyScalar((right - left) * multi * speed);
		}
		if (backward - forward && right - left) {
			t.x = (cameraForward.x + cameraRight.x) * 0.7;
			t.z = (cameraForward.z + cameraRight.z) * 0.7;
		} else {
			t.x = cameraForward.x + cameraRight.x;
			t.z = cameraForward.z + cameraRight.z;
		}
		// velVec.applyEuler(new Euler().copy(capsule.rotation)).multiplyScalar(speed);
		// don't override falling velocity
		const linVel = rigidBody.linvel();
		t.y = linVel.y + dash / 2;
		// finally set the velocities and wake up the body
		const pos = rigidBody.translation();
		const dt = Date.now();
		if (t.y < -10 && $planeGeometry && dt - rayCounter > 100) {
			// 10 fps cap
			rayCounter = dt;
			// prevent going through the ground
			const rayOrigin = new Vector3(pos.x, pos.y, pos.z);
			const rayDirection = new Vector3(0, 1, 0);
			const raycaster = new Raycaster(rayOrigin, rayDirection);
			const intersects = raycaster.intersectObject($planeGeometry);

			if (intersects.length > 0) {
				pos.y += intersects[0].distance + 3;
				rigidBody.setTranslation(pos, false);
				t.y = 0;
				// Ray intersects with the ground
				// console.log("Ray intersects with the ground.");
			}
		}
		if (pos.y < -100) {
			death.set(true);
			return;
		}
		// velY = (pos.y - prevPos) / deltaTime;
		// console.log((velY - prevVel) / deltaTime);
		prevPos = pos.y;

		// funny wizard man
		if (prevPos < -23 && ground) {
			// wizard was removed
		}

		rigidBody.setLinvel(t, true);

		// update linvel and pos
		const lvArr: [number, number, number] = [
			Math.fround(t.x),
			Math.fround(t.y),
			Math.fround(t.z),
		];
		const posArr: [number, number, number] = [
			Math.fround(pos.x),
			Math.fround(pos.y),
			Math.fround(pos.z),
		];
		if (!arraysSize3AreEqual(lvArr, $playerLinvel) || $socket === null)
			playerLinvel.set(lvArr);
		if (!arraysSize3AreEqual(posArr, $playerPos) || $socket === null)
			playerPos.set(posArr);

		// add isPLOCK condition here if necessary
		if (right || left || forward || backward) {
			// Calculate the angle based on linear velocities, and for some reason it is inverted by half a period
			const velAngle = Math.atan2(t.x, t.z) + Math.PI;

			// Calculate the target rotation based on the angle
			const targetRotation = new Quaternion();
			// YXZ!!! not sure if this was a typo, but if it works then I am not going to touch it.
			targetRotation.setFromEuler(new Euler(0, velAngle, 0, "YXZ"));

			// Interpolate between current rotation and target rotation (slerp)
			const maxRotationSpeed = 0.1; // Adjust the speed of rotation
			model.quaternion.slerp(targetRotation, maxRotationSpeed);
			const rotArr: [number, number, number] = [
				Math.fround(model.rotation.x),
				Math.fround(model.rotation.y),
				Math.fround(model.rotation.z),
			];
			if (
				!arraysSize3AreEqual(rotArr, $playerRotation, false) ||
				$socket === null
			)
				playerRotation.set(rotArr);
		}
	});

	const dispatch = createEventDispatcher();

	export let chatActive = false;
	let k = false;
	let y = false;

	$: {
		if (k && y) {
			azure.set(50);
			gameConfig.update((cfg) => ({
				...cfg,
				jamalUnlocked: false,
				vegasUnlocked: false,
				bossUnlocked: false,
				timmyUnlocked: false,
			}));
		}
	}

	function onClick(e: MouseEvent) {
		if (e.button !== 2 || chatActive || $socket) return;
		const cameraForward = new Vector3();
		cam.getWorldDirection(cameraForward);

		// Project to 2D Plane
		cameraForward.y = 0;
		cameraForward.normalize().multiplyScalar(50);
		bullet.resetForces(false);
		bullet.resetTorques(false);
		bullet.setLinvel(cameraForward, true);
		bullet.setTranslation(new Vector3(...$playerPos), true);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key.toLowerCase() === "escape" && chatActive) {
			dispatch("tpress");
			chatActive = false;
			backward = 0;
			forward = 0;
			left = 0;
			right = 0;
			shift = 0;
		}
		if (chatActive) return;
		if (e.key.toLowerCase() === "t") {
			dispatch("tpress");
			chatActive = true;
			backward = 0;
			forward = 0;
			left = 0;
			right = 0;
			shift = 0;
		}
		e.preventDefault();
		// console.log("Down", e.key)
		switch (e.key.toLowerCase()) {
			case "v":
				camBack = true;
				break;
			case "s":
				backward = 1;
				break;
			case "w":
				forward = 1;
				break;
			case "a":
				left = 1;
				break;
			case "d":
				right = 1;
				break;
			case "shift":
				shift = 1;
				break;
			case "q":
				if (spectator) return;
				if (Date.now() - barricadeCd >= (cakeFinity ? 250 : (skin === 5 ? 500 : 4000))) {
					spawnBarricade();
					barricadeCd = Date.now();
				}
				break;
			// case "g":
			// 	score.update((s) => s + 50);
			// 	break;
			case "k":
				k = true;
				break;
			case "y":
				y = true;
				break;
			case "g":
				if (ground || $death || !rigidBody) break;
				const position = rigidBody.translation();
				if (position.y > 20) {
					const linVel = rigidBody.linvel();
					linVel.y = -50;
					rigidBody.setLinvel(linVel, true);
				}
			case " ":
				if (!ground || $death || !rigidBody) break;
				const linVel = rigidBody.linvel();
				linVel.y = 5;
				rigidBody.setLinvel(linVel, true);
				// const tl = rigidBody.translation();
				// tl.y = 500;
				// rigidBody.setTranslation(tl, true);
				break;
			default:
				// alert(e.key)
				break;
		}
	}

	let bullet: RapierRigidBody;

	let fishBall: RapierRigidBody;

	function onKeyUp(e: KeyboardEvent) {
		if (chatActive) return;
		// console.log("Up", e.key)
		switch (e.key.toLowerCase()) {
			case "v":
				camBack = false;
				break;
			case "b":
				if ($socket) break;
				const cameraForward = new Vector3();
				cam.getWorldDirection(cameraForward);

				// Project to 2D Plane
				cameraForward.y = 0;
				cameraForward.normalize().multiplyScalar(50);
				// cameraForward.normalize().multiplyScalar(35);
				bullet.resetForces(false);
				bullet.resetTorques(false);
				bullet.setLinvel(cameraForward, false);
				bullet.setTranslation(new Vector3(...$playerPos), false);
				bullet.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, false);
				bullet.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 }, true);
				break;
			case "m":
				if ($socket) break;
				const cf = new Vector3();
				cam.getWorldDirection(cf);

				// Project to 2D Plane
				cf.y = 0;
				cf.normalize().multiplyScalar(25);
				// cameraForward.normalize().multiplyScalar(35);
				fishBall.resetForces(false);
				fishBall.resetTorques(false);
				fishBall.setLinvel(cf, false);
				fishBall.setEnabledTranslations(true, true, true, false);
				fishBall.setTranslation(new Vector3($playerPos[0], $playerPos[1] + 2, $playerPos[2]), false);
				fishBall.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, false);
				fishBall.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 }, true);
				break;
			case "s":
				backward = 0;
				break;
			case "w":
				// console.log("FORWARD = 0")
				forward = 0;
				break;
			case "a":
				left = 0;
				break;
			case "d":
				right = 0;
				break;
			case "e":
				if (skin === 4) {
					dance = true;
				}
				break;
			case "f":
				if (Date.now() - lastDash > (cakeFinity ? 50 : 5000)) {
					lastDash = Date.now();
					dash = 1;
				}
				break;
			case "shift":
				shift = 0;
				break;
			case "k":
				k = false;
				// score.update(sc => sc + 5);
				highScore.set(0);
				break;
			case "y":
				y = false;
				break;
			default:
				break;
		}
	}

	onMount(async () => {
		// right click messes up everything
		document.addEventListener("contextmenu", (e) => e.preventDefault());
		// @ts-ignore
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
		if (!mobile) return;
		const nipplejs = (await import("nipplejs")).default;
		const options: JoystickManagerOptions = {
			zone: document.getElementById("joystickWrapper1") ?? undefined,
			size: 120,
			multitouch: true,
			maxNumberOfNipples: 2,
			mode: "static",
			restJoystick: true,
			shape: "circle",
			// position: { top: 20, left: 20 },
			position: { top: "60px", left: "60px" },
			dynamicPage: true,
		};

		const joyManager = nipplejs.create(options);

		function customMulti(n: number) {
			return (
				1 / ((Math.abs(n) - 2) ** 2 + 2.3 * (Math.abs(n) - 2)) + 1.756
			);
		}

		// @ts-ignore
		joyManager["0"].on("move", function (_, data) {
			const fwd = data.vector.y;
			const turn = data.vector.x;
			// console.log(fwd, turn);
			if (fwd > 0) {
				forward = Math.min(customMulti(fwd) * 1.5, 1.5);
				backward = 0;
			} else if (fwd < 0) {
				forward = 0;
				backward = Math.min(customMulti(fwd) * 1.5, 1.5);
			}

			if (turn > 0) {
				left = 0;
				right = Math.min(customMulti(turn) * 1.5, 1.5);
			} else if (turn < 0) {
				left = Math.min(customMulti(turn) * 1.5, 1.5);
				right = 0;
			}
			// console.log(forward - backward, right - left);
			if (Math.sqrt(fwd ** 2 + turn ** 2) > 0.9) {
				shift = 1;
			} else {
				shift = 0;
			}
		});

		// @ts-ignore
		joyManager["0"].on("end", function (_) {
			backward = 0;
			forward = 0;
			left = 0;
			right = 0;
		});
	});

	interface Barricade {
		position: [number, number, number];
		rotation: [number, number, number];
		id: number;
	}

	let barricades: Barricade[] = [];
	let barricadeIndex: number = 0;

	function spawnBarricade() {
		if (!rigidBody) return;
		const tl = rigidBody.translation();
		const linvel = rigidBody.linvel();
		const velAngle = Math.atan2(t.x, t.z) + Math.PI;
		const eu = new Euler(0, velAngle, 0, "YXZ");
		const id = barricadeIndex++;
		const newBr: Barricade = {
			position: [
				tl.x -
					(Math.round(linvel.x) === 0
						? Math.random() * 2 - 1
						: Math.sign(linvel.x)),
				tl.y,
				tl.z -
					(Math.round(linvel.z) === 0
						? Math.random() * 2 - 1
						: Math.sign(linvel.z)),
			],
			rotation: [eu.x, eu.y, eu.z],
			id,
		};
		if ($socket === null) {
			barricades = [...barricades, newBr];
			setTimeout(() => {
				barricades = barricades.filter((b) => b.id !== id);
			}, 3000);
		} else {
			$socket.send(
				new Float32Array([
					BARRICADE_SPAWN_EVENT,
					...newBr.position,
					...newBr.rotation,
				])
			);
			// gone is implemented on barricade receive
		}
	}
</script>

{#if $socket === null}
	<CollisionGroups groups={[6, 15]}>
		<T.Group>
			<RigidBody
				type="dynamic"
				bind:rigidBody={bullet}
				on:collisionenter={({ targetRigidBody }) => {
					// @ts-ignore
					// if (targetRigidBody?.userData.name === "water") {
					// 	const lv = bullet.linvel();
					// 	lv.x = Math.sign(lv.x) * Math.log(Math.abs(lv.x)) / Math.log(2);
					// 	lv.y = 0;
					// 	lv.z = Math.sign(lv.z) * Math.log(Math.abs(lv.z)) / Math.log(2);
					// 	bullet.setLinvel(lv, true);
					// }
				}}
			>
				<Collider shape="cuboid" args={[1 / 2, 1 / 2, 1 / 2]} mass={25} restitution={0} friction={1}>
					<T.Mesh
						geometry={new BoxGeometry(1 / 2, 1 / 2, 1 / 2)}
						material={new MeshBasicMaterial({ color: "gray" })}
					/>
				</Collider>
			</RigidBody>
		</T.Group>
	</CollisionGroups>

	<CollisionGroups groups={[6, 15, 9]}>
		<T.Group position={[0, 0, 0]}>
			<RigidBody
				type="dynamic"
				bind:rigidBody={fishBall}
				enabledTranslations={[false, false, false]}
				on:collisionenter={({ targetRigidBody }) => {
					// @ts-ignore
					if (targetRigidBody?.userData.name === "water") {
						const lv = fishBall.linvel();
						lv.x = Math.sign(lv.x) * Math.log(Math.abs(lv.x)) / Math.log(2);
						lv.y = 0;
						lv.z = Math.sign(lv.z) * Math.log(Math.abs(lv.z)) / Math.log(2);
						fishBall.setLinvel(lv, true);
					// @ts-ignore
					} else if (targetRigidBody?.userData.name === "ground") {
						fishBall.setEnabledTranslations(false, false, false, true);
						fishBall.setTranslation({ x: 0, y: 0, z: 0}, true);
						fishBall.setLinvel({ x: 0, y: 0, z: 0 }, true);
					}
				}}
				userData={{
					name: "fishBall"
				}}
			>
				<Collider shape="cuboid" args={[1/2, 1/2, 1/2]} mass={50} restitution={0} friction={1}>
					<T.Mesh
						geometry={new SphereGeometry(1/4)}
						material={new MeshBasicMaterial({ color: "white" })}
					/>
				</Collider>
			</RigidBody>
		</T.Group>
	</CollisionGroups>
{/if}

<Fish {ballPos} />

<Root>
	<h1 class="lives">
		<svg
			height="50%"
			width="50%"
			version="1.1"
			id="Layer_1"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 512 512"
			xml:space="preserve"
		>
			<path
				style="fill:#FF6647;"
				d="M474.655,74.503C449.169,45.72,413.943,29.87,375.467,29.87c-30.225,0-58.5,12.299-81.767,35.566
c-15.522,15.523-28.33,35.26-37.699,57.931c-9.371-22.671-22.177-42.407-37.699-57.931c-23.267-23.267-51.542-35.566-81.767-35.566
c-38.477,0-73.702,15.851-99.188,44.634C13.612,101.305,0,137.911,0,174.936c0,44.458,13.452,88.335,39.981,130.418
c21.009,33.324,50.227,65.585,86.845,95.889c62.046,51.348,123.114,78.995,125.683,80.146c2.203,0.988,4.779,0.988,6.981,0
c2.57-1.151,63.637-28.798,125.683-80.146c36.618-30.304,65.836-62.565,86.845-95.889C498.548,263.271,512,219.394,512,174.936
C512,137.911,498.388,101.305,474.655,74.503z"
			/>
			<path
				style="fill:#E35336;"
				d="M160.959,401.243c-36.618-30.304-65.836-62.565-86.845-95.889
c-26.529-42.083-39.981-85.961-39.981-130.418c0-37.025,13.612-73.631,37.345-100.433c21.44-24.213,49.775-39.271,81.138-43.443
c-5.286-0.786-10.653-1.189-16.082-1.189c-38.477,0-73.702,15.851-99.188,44.634C13.612,101.305,0,137.911,0,174.936
c0,44.458,13.452,88.335,39.981,130.418c21.009,33.324,50.227,65.585,86.845,95.889c62.046,51.348,123.114,78.995,125.683,80.146
c2.203,0.988,4.779,0.988,6.981,0c0.689-0.308,5.586-2.524,13.577-6.588C251.254,463.709,206.371,438.825,160.959,401.243z"
			/>
		</svg>
		<p class="text-shadow">
			{#if !$host}
				x{$lives}
			{:else}
				Infinity
			{/if}
		</p>
	</h1>
</Root>

{#if $lives === 0}
	<Root>
		<dialog class="spectate">YOU ARE NOW SPECTATING</dialog>
	</Root>
{/if}

{#each barricades as barricade (barricade.id)}
	<T.Group position={barricade.position} rotation={barricade.rotation}>
		<RigidBody type="dynamic">
			<Collider shape="cuboid" args={[2, 1, 1 / 3]} mass={100}>
				<Barricade />
			</Collider>
		</RigidBody>
	</T.Group>
{/each}

{#if mobile}
	<Root>
		<!-- rip firefox users, they will not get vertical input range -->
		<input
			type="range"
			min="0"
			max="100"
			bind:value={zooming}
			class="slider noSelect"
		/>
		<div id="mobileInterface" class="noSelect">
			<div id="joystickWrapper1" />
			<div id="joystickWrapper2">
				<button
					id="jumpButton"
					on:click={() => {
						if (!ground || $death || !rigidBody) return;
						const livVel = rigidBody.linvel();
						livVel.y = 5;
						rigidBody.setLinvel(livVel, true);
					}}
				/>
			</div>
			<div id="joystickWrapper3">
				<button
					id="dashButton"
					style={Date.now() - lastDash < (cakeFinity ? 50 : 5000)
						? `background-color: black`
						: undefined}
					on:click={() => {
						if (Date.now() - lastDash > (cakeFinity ? 50 : 5000)) {
							lastDash = Date.now();
							dash = 1;
							setTimeout(() => {
								lastDash = Date.now() - 6000;
							}, 5000);
						}
					}}
				/>
			</div>
			<div id="joystickWrapper4">
				<!-- no indicator for barricades -->
				<button
					id="barricadeButton"
					on:click={() => {
						if (
							Date.now() - barricadeCd >=
							(cakeFinity ? 250 : (skin === 5 ? 500 : 4000))
						) {
							spawnBarricade();
							barricadeCd = Date.now();
						}
					}}
				/>
			</div>
		</div>
	</Root>
{/if}

<svelte:window
	on:keydown={onKeyDown}
	on:keyup={onKeyUp}
	on:mousedown={onClick}
/>

<T.PerspectiveCamera makeDefault fov={$gameConfig.fov} bind:ref={cam}>
	{#if isPLOCK}
		<PointerLockControls
			bind:lock
			bind:object={capRef}
			bind:plock={isPLOCK}
			{zooming}
			{camBack}
		/>
	{:else}
		<Controller
			bind:object={capRef}
			bind:plock={isPLOCK}
			{zooming}
			{chatActive}
			{camBack}
		/>
	{/if}
	<AudioListener />
</T.PerspectiveCamera>

<Audio src="/audio/ocean.mp3" autoplay loop volume={$gameConfig.volume / 100} />
<Audio
	src="/audio/zen_garden.mp3"
	autoplay
	loop
	volume={$gameConfig.volume / 100}
/>

<CollisionGroups groups={spectator ? [15] : [0, 5]}>
	<T.Group bind:ref={capsule} position={$playerPos} rotation.y={Math.PI}>
		<Username
			{username}
			ypos={$playerPos[1]}
			color={$host ? "red" : "white"}
		/>
		<RigidBody
			bind:rigidBody
			enabledRotations={[false, false, false]}
			userData={{ name: "player" }}
		>
			<Collider
				bind:collider
				shape={"capsule"}
				friction={0}
				restitution={0.1}
				args={[height / 2 - radius, radius]}
				on:collisionenter={(e) => {
					// if (e.targetRigidBody) {
					//   return;
					// }
					// console.log(e.targetCollider.handle);
					if (e.targetRigidBody) {
						// @ts-ignore
						if (e.targetRigidBody.userData?.name === "ground") {
							ground = true;
							// console.log("GROUND NOW")
							// if (velY < -10 && rigidBody) {
							// 	// alert("hmm");
							// 	// console.log(velY)
							// 	// This won't work if the character fell from > 3000 N of forces
							// 	const v = rigidBody.linvel();
							// 	const t = rigidBody.translation();
							// 	rigidBody.setTranslation(
							// 		{ x: t.x, y: $playerPos[1] + 0.1, z: t.z },
							// 		false
							// 	);
							// 	rigidBody.setLinvel(
							// 		{ x: v.x, y: -(Math.sqrt(velY)), z: v.z },
							// 		true
							// 	);
							// 	// rigidBody.setTranslation(, true);
							// }
						}
						// @ts-ignore
						if (e.targetRigidBody.userData?.name === "structure") {
							structure = true;
						}
						// @ts-ignore
						if (e.targetRigidBody.userData?.name === "cake") {
							// this will kinda patch the big vegas flying bug in multiplayer
							// although it's only going to increase the normal force
							rigidBody?.applyImpulse(
								new Vector3(0, -10, 0),
								true
							);
						}
						if ($host) {
							if (
							// @ts-ignore
								e.targetRigidBody.userData?.name ===
									"player2" &&
							// @ts-ignore
								!e.targetRigidBody.userData?.death
							) {
								// @ts-ignore
								e.targetRigidBody.userData.death = true;
								$socket?.send(
									new Uint8Array([
										DIED_OF_DEATH,
										// @ts-ignore
										e.targetRigidBody.userData?.id,
									])
								);
								setTimeout(() => {
									// @ts-ignore
									e.targetRigidBody.userData.death = false;
									// 1000ms ping margin of error
								}, 6000);
							}
							// host cannot die to water
							return;
						}
						// @ts-ignore
						if (e.targetRigidBody.userData?.name === "water")
							death.set(true);
					}
				}}
				on:collisionexit={(e) => {
					if (
						e.targetRigidBody &&
						// @ts-ignore
						e.targetRigidBody.userData?.name === "ground" &&
						rigidBody
					) {
						ground = false;
						rigidBody.resetForces(false);
					}
					// @ts-ignore
					if (e.targetRigidBody.userData?.name === "structure") {
						structure = false;
						rigidBody?.resetForces(false);
					}
					// (e.targetRigidBody || e.targetCollider.handle !== 0) || [(ground = false), rigidBody.resetForces(true)/* console.log */]
				}}
			/>
			<T.Group visible={!isPLOCK}>
				{#if skin === 0}
					<Ybot bind:currentActionKey bind:ref={model} />
				{:else if skin === 1}
					<Xbot bind:currentActionKey bind:ref={model} />
				{:else if skin === 2}
					<James bind:currentActionKey bind:ref={model} />
				{:else if skin === 3}
					<Bigvegas bind:currentActionKey bind:ref={model} />
				{:else if skin === 4}
					<Boss bind:currentActionKey bind:ref={model} />
				{:else if skin === 5}
					<Timmy bind:currentActionKey bind:ref={model} />
				{/if}
			</T.Group>
			<CollisionGroups groups={[15]}>
				<T.Group position={[0, -height / 2 + radius, 0]}>
					<Collider sensor shape={"ball"} args={[radius * 1.2]} />
				</T.Group>
			</CollisionGroups>
		</RigidBody>
	</T.Group>
</CollisionGroups>

<style>
	:global(*) {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.slider {
		position: fixed;
		right: 6px;
		top: 36px;
		touch-action: manipulation;
		z-index: 12;
		height: 25%;
		width: 5%;
		-webkit-appearance: slider-vertical;
		appearance: slider-vertical;
		writing-mode: bt-lr;
	}

	.slider::-webkit-slider-thumb {
		width: 32px;
		height: 32px;
	}

	#mobileInterface {
		position: fixed;
		width: 100%;
		height: 120px;
		/* background-color: #000000; */
		pointer-events: none;
		z-index: 11;
		/* top: auto; */
		bottom: 60px;
		left: 60px;
		touch-action: manipulation;
	}

	#joystickWrapper1 {
		pointer-events: auto;
		display: block;
		position: absolute;
		bottom: 0;
		left: 0;
		background-color: transparent;
		width: 120px;
		height: 120px;
		z-index: 12;
		touch-action: manipulation;
		/* background-color: rgba(red, 0.2); */
	}

	#joystickWrapper2 {
		pointer-events: auto;
		display: block;
		position: absolute;
		bottom: 0;
		right: 120px;
		/* background-color: #000000; */
		width: 120px;
		height: 120px;
		z-index: 12;
		touch-action: manipulation;
	}

	#joystickWrapper3 {
		pointer-events: auto;
		display: flex;
		align-items: center;
		position: absolute;
		bottom: 0;
		right: 60px;
		/* background-color: #000000; */
		width: 60px;
		height: 120px;
		z-index: 12;
		touch-action: manipulation;
	}

	#joystickWrapper4 {
		pointer-events: auto;
		display: flex;
		align-items: center;
		position: absolute;
		bottom: -80px;
		right: 142px;
		/* background-color: #000000; */
		width: 60px;
		height: 120px;
		z-index: 12;
		touch-action: manipulation;
	}

	#jumpButton {
		position: absolute;
		right: 15px;
		top: 15px;
		width: 90px;
		height: 90px;
		border-radius: 50%;
		background-color: white;
		opacity: 0.5;
		touch-action: manipulation;
		display: flex;
		justify-content: center;
		align-items: center;
		pointer-events: auto;
	}

	#dashButton {
		position: absolute;
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background-color: white;
		opacity: 0.5;
		touch-action: manipulation;
		display: flex;
		justify-content: center;
		align-items: center;
		pointer-events: auto;
	}

	#barricadeButton {
		position: absolute;
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background-color: white;
		opacity: 0.5;
		touch-action: manipulation;
		display: flex;
		justify-content: center;
		align-items: center;
		pointer-events: auto;
	}

	.noSelect {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.lives {
		/* background-color: white; */
		/* opacity: 0.5; */
		width: 4em;
		margin-top: 1.5em;
		display: flex;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
	}

	.text-shadow {
		text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
	}

	.spectate {
        background-color: white;
        width: 100%;
        margin: 0;
        padding: .25em;
        display: block;
        position: absolute;
        bottom: 0;
        text-align: center;
        z-index: 1;
    }
</style>
