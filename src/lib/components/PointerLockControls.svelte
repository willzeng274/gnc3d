<script lang="ts">
	import { afterUpdate, createEventDispatcher, onDestroy } from "svelte";
	import { Euler, Camera, Group, Quaternion } from "three";
	import { useThrelte, useParent, useFrame } from "@threlte/core";
	import Root from "./Root.svelte";
	// Set to constrain the pitch of the camera
	// Range is 0 to Math.PI radians
	export let minPolarAngle = 0; // radians
	export let maxPolarAngle = Math.PI; // radians
	export let pointerSpeed = 1.0;
	export let object: Group;
	export let plock: boolean;
	export let zooming: number;
	export let camBack: boolean;
	$: {
		if (zooming !== -1) {
			zooming > 1 && (plock = false);
		}
	}
	let isLocked = false;
	const { renderer, invalidate } = useThrelte();
	const domElement = renderer.domElement;
	const camera = useParent();
	const dispatch = createEventDispatcher();
	const _euler = new Euler(0, 0, 0, "YXZ");
	const _PI_2 = Math.PI / 2;
	if (!renderer) {
		throw new Error("Threlte Context missing: Is <PointerLockControls> a child of <Canvas>?");
	}
	const isCamera = (p: any): p is Camera => {
		return p.isCamera;
	};
	if (!isCamera($camera)) {
		throw new Error("Parent missing: <PointerLockControls> need to be a child of a <Camera>");
	}
	const onChange = () => {
		invalidate("PointerLockControls: change event");
		dispatch("change");
	};
	export const lock = () => domElement.requestPointerLock();
	export const unlock = () => document.exitPointerLock();
	domElement.addEventListener("mousemove", onMouseMove);
	domElement.addEventListener("touchmove", onTouchMove);
	domElement.addEventListener("wheel", onWheel);
	domElement.addEventListener("click", lock);
	domElement.addEventListener("touchend", onTouchEnd);
	domElement.ownerDocument.addEventListener("pointerlockchange", onPointerlockChange);
	domElement.ownerDocument.addEventListener("pointerlockerror", onPointerlockError);
	onDestroy(() => {
		domElement.removeEventListener("mousemove", onMouseMove);
		domElement.removeEventListener("touchmove", onTouchMove);
		domElement.removeEventListener("wheel", onWheel);
		domElement.removeEventListener("click", lock);
		domElement.removeEventListener("touchend", onTouchEnd);
		domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerlockChange);
		domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerlockError);
	});
	function onWheel(event: WheelEvent) {
		// console.log(event.deltaY / 16);
		// console.log(idealOffset.z)
		if (Math.floor(event.deltaY / 32) > 0) {
			dispatch("unlock");
			unlock();
			isLocked = false;
			plock = false;
		}
	}
	function onMouseMove(event: MouseEvent) {
		if (!isLocked) return;
		if (!$camera) return;
		const { movementX, movementY } = event;
		_euler.setFromQuaternion($camera.quaternion);
		_euler.y -= movementX * 0.002 * pointerSpeed;
		_euler.x -= movementY * 0.002 * pointerSpeed;
		_euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));
		$camera.quaternion.setFromEuler(_euler);
		onChange();
	}
	
	let oldCam = camBack;
	afterUpdate(() => {
		const new_value = camBack;
		if (new_value != oldCam) {
			console.log("Ran");
			if (!isLocked) return;
			if (!$camera) return;
			const flipRotation = new Quaternion().setFromAxisAngle($camera.up, Math.PI);
			$camera.quaternion.multiplyQuaternions(flipRotation, $camera.quaternion);
			oldCam = new_value;
		}
	});
	function onTouchEnd(event: TouchEvent) {
		prev = null;
	}
	let prev: [number, number] | null = null;
	function onTouchMove(event: TouchEvent) {
		// console.log(event.touches)
		// event.preventDefault();
		if (!$camera) return;
		const touch = event.touches[event.touches.length - 1];
		let movementX = 0,
			movementY = 0;
		if (prev) {
			// be aware that these only store the movement of the first touch in the touches array
			movementX = touch.pageX - prev[0];
			movementY = touch.pageY - prev[1];
		}

		prev = [touch.pageX, touch.pageY];
		// console.log(movementX, movementY)
		_euler.setFromQuaternion($camera.quaternion);
		_euler.y -= movementX * 0.02 * pointerSpeed;
		_euler.x -= movementY * 0.02 * pointerSpeed;
		_euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));
		$camera.quaternion.setFromEuler(_euler);
		onChange();
	}
	useFrame(() => {
		if (!$camera) return;
		$camera.position.copy(object.position);
	});
	function onPointerlockChange() {
		if (document.pointerLockElement === domElement) {
			dispatch("lock");
			isLocked = true;
		} else {
			dispatch("unlock");
			isLocked = false;
		}
	}
	function onPointerlockError() {
		console.error("PointerLockControls: Unable to use Pointer Lock API");
	}
</script>

<Root>
	<svg
		class="flex justify-center items-center h-screen z-[5]"
		enable-background="new 0 0 50 50"
		height="50px"
		id="Layer_1"
		version="1.1"
		viewBox="0 0 50 50"
		width="50px"
		xml:space="preserve"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		><rect fill="none" height="50" width="50" />
		<line
			fill="none"
			stroke="#ffffff"
			stroke-miterlimit="10"
			stroke-width="2"
			x1="9"
			x2="41"
			y1="25"
			y2="25"
		/>
		<line fill="none" stroke="#ffffff" stroke-miterlimit="10" stroke-width="2" x1="25" x2="25" y1="9" y2="41" />
	</svg>
</Root>
