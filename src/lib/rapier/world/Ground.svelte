<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import { MeshStandardMaterial, PlaneGeometry, CanvasTexture, RepeatWrapping, TextureLoader, Vector3, MathUtils, Mesh, BufferGeometry, type NormalBufferAttributes, Material } from "three";
	import { DEG2RAD } from "three/src/math/MathUtils";
	import { createNoise2D } from "simplex-noise";
	import { AutoColliders, RigidBody } from "@threlte/rapier";
	import { plane, planeGeometry } from "$lib/store";
	import { height, width, x_units, y_units } from "$lib/constants";
	import alea from "alea";
	import { Quaternion, type Collider as RapierCollider } from "@dimforge/rapier3d-compat";
	import { Sky } from "three/examples/jsm/objects/Sky";
	import { Water } from "three/examples/jsm/objects/Water";
	import { useSuspense } from "@threlte/extras";
	import { onDestroy } from "svelte";
	import Obtainable from "./Obtainable.svelte";
	// @ts-ignore
	// import Martini from '@mapbox/martini';
	export let seed: number | undefined;
	export let enableShaders: boolean = true;
	const geometry = new PlaneGeometry(width, height, x_units, y_units);
	const prng = seed ? alea(seed) : alea();
	const noise = createNoise2D(prng);
	const vertices = geometry.getAttribute("position").array;
	console.log("Length: ", vertices.length);

	const textureCanvas = document.createElement("canvas");
	textureCanvas.width = x_units;
	textureCanvas.height = y_units;
	const textureContext = textureCanvas.getContext("2d")!;
	let collider: RapierCollider;

	$: {
		if (collider) {
			console.log("C", collider.handle);
			const rotationOffset = new Quaternion(0, Math.sin(Math.PI / 2 / 2), 0, Math.cos(Math.PI / 2 / 2));
			collider.setRotation(rotationOffset);
		}
	}

	// const textureImageData = textureContext.createImageData(100, 100);
	// const textureData = textureImageData.data;

	function generateRandomGreenShade() {
		const redValue = Math.floor(Math.random() * 51); // Low red value
		const greenValue = Math.floor(Math.random() * 206) + 50; // Vary green value between 50 and 255
		const blueValue = Math.floor(Math.random() * 51); // Low blue value

		return `rgb(${redValue}, ${greenValue}, ${blueValue})`;
	}

	async function loadTexture(): Promise<THREE.Texture> {
		return new Promise((resolve, reject) => {
			new TextureLoader().load(
				"/textures/grass_texture.jpeg",
				(texture) => {
					resolve(texture);
				},
				undefined,
				(error) => {
					reject(error);
				}
			);
		});
	}

	function getColorBasedOnHeight(h: number) {
		if (h === 30) {
			// return `rgb(0, 255, 0)`
			return generateRandomGreenShade();
		} else {
			// alert(h)
			return `rgb(${String(160 + (h - 30) * 8)}, ${String(90 + (h - 30) * 5)}, 0)`;
			// return `rgb(255, 255, 255)`
		}
	}

	let index = 0;
	let buildings: {
		i: number;
		j: number;
		index: number;
	}[] = [];
	let heights: number[] = [];
	let sun: Vector3, waterGeometry: PlaneGeometry, water: Water, sky: Sky
	// note that 200 is the 3rd and 4th parameter of PlaneGeometry

	async function loadGround(): Promise<any> {
		const imageTexture = await loadTexture();
		let offscreenCanvas = document.createElement("canvas");
		offscreenCanvas.width = imageTexture.image.width;
		offscreenCanvas.height = imageTexture.image.height;
		let offscreenContext = offscreenCanvas.getContext("2d")!;
		offscreenContext.drawImage(imageTexture.image, 0, 0);
		for (let i = 0; i <= x_units; i++) {
			for (let j = 0; j <= y_units; j++) {
				// const index = (i * ((width * height) + 1) + j) * 3;
				const x = (i / x_units - 0.5) * x_units;
				const y = (j / y_units - 0.5) * y_units;

				// Calculate distance from center
				const distanceFromCenter = Math.sqrt(x * x + y * y);

				// Apply noise to vertices based on distance from center
				// const noiseValue = noise4(x * 5, y * 5, 0.1, 0.1) * 10;

				// Apply noise for height
				const heightNoise = noise(x / 16, y / 16) * 5 + noise(x / 4, y / 4) * 2;
				// Apply noise for irregular shape
				const shapeNoise = noise(x / 32, y / 32);
				const islandRadius = Math.min(x_units, y_units) / 2.67 - shapeNoise * ((Math.min(x_units, y_units) / 20) * 3); // Vary the island radius
				// make sure it is within a specific radius
				const canHaveBuilding = islandRadius < Math.min(x_units, y_units) / 2.7 && islandRadius > 5;

				const minHeight = -20;
				const maxHeight = 30;
				const h = Math.max(minHeight, Math.min(maxHeight, heightNoise + islandRadius - distanceFromCenter));
				// const h = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));

				// Update the vertex position
				if (h <= 5) {
					// ISSUE: For some reason quadruples the load time when set as "undefined"???

					// fill with dark blue if no shaders, light blue if shaders
					// light blue makes more sense with shaders because it looks like ice
					textureContext.fillStyle = enableShaders ? `rgb(79, 129, 236)` : `rgb(0, 8, 61)`;
					textureContext.fillRect(j, i, 1, 1);
					// @ts-ignore
					vertices[index + 2] = -25;
				} else if (h === 30 && canHaveBuilding) {
					const rng = noise(x, y);
					// alert(rng);
					const hasBuilding = rng > 0.01 && rng < 0.015;
					if (hasBuilding) {
						buildings.push({
							i,
							j,
							index,
						});
						// set all around to be the same height
					} else {
						// geometry
						// textureContext.fillStyle = getColorBasedOnHeight(h);
						// textureContext.fillRect(j, i, 1, 1);
						textureContext.drawImage(
							offscreenCanvas,
							j, i,
							offscreenCanvas.width, offscreenCanvas.height,
							j, i,
							1, 1
						);
						// @ts-ignore
						vertices[index + 2] = h - 30;
					}
				} else if (h === 30) {
					const rng = noise(x, y);
					// alert(rng);
					const hasBuilding = rng > 0.1 && rng < 0.2;
					if (hasBuilding) {
						textureContext.fillStyle = `rgb(0, 110, 90)`;
						textureContext.fillRect(j, i, 1, 1);
						// set all around to be the same height
						// @ts-ignore
						vertices[index + 2] = 2;
					} else {
						// geometry
						// textureContext.fillStyle = getColorBasedOnHeight(h);
						// textureContext.fillRect(j, i, 1, 1);
						textureContext.drawImage(
							offscreenCanvas,
							j, i,
							1, 1,
							j, i,
							1, 1
						);
  					// @ts-ignore
						vertices[index + 2] = h - 30;
					}
				} else {
					// geometry
					textureContext.fillStyle = getColorBasedOnHeight(h);
					textureContext.fillRect(j, i, 1, 1);
					// @ts-ignore
					vertices[index + 2] = h - 30;
				}
				heights.push(vertices[index + 2]);
				index += 3;
			}
		}
		// 69420 will decide where to place building
		const ind = Math.floor(((noise(69420, 69420) + 1) / 2) * buildings.length);
		console.log("Choosing from:", buildings.length, "Got:", ind);
		if (buildings.length === 0) {
			// this can happen to the seed lmao
		}
		let b = buildings[ind];
		// @ts-ignore
		vertices[b.index - 1] = 5;
		// @ts-ignore
		vertices[b.index + 2] = 5;
		// @ts-ignore
		vertices[b.index + 5] = 5;
		// @ts-ignore
		vertices[b.index - 1 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		vertices[b.index + 2 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		vertices[b.index + 5 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		vertices[b.index - 1 + (x_units + 1) * 3] = 5;
		// @ts-ignore
		vertices[b.index + 2 + (x_units + 1) * 3] = 5;
		// @ts-ignore
		vertices[b.index + 5 + (x_units + 1) * 3] = 5;
		textureContext.fillStyle = `rgb(0, 0, 255)`;
		textureContext.fillRect(b.j - 1, b.i - 1, 1, 1);
		textureContext.fillRect(b.j - 1, b.i, 1, 1);
		textureContext.fillRect(b.j - 1, b.i + 1, 1, 1);
		textureContext.fillRect(b.j - 1, b.i - 2, 1, 1);
		textureContext.fillRect(b.j, b.i - 1, 1, 1);
		textureContext.fillRect(b.j, b.i, 1, 1);
		textureContext.fillRect(b.j, b.i + 1, 1, 1);
		textureContext.fillRect(b.j, b.i - 2, 1, 1);
		textureContext.fillRect(b.j + 1, b.i - 1, 1, 1);
		textureContext.fillRect(b.j + 1, b.i, 1, 1);
		textureContext.fillRect(b.j + 1, b.i + 1, 1, 1);
		textureContext.fillRect(b.j + 1, b.i - 2, 1, 1);
		textureContext.fillRect(b.j - 2, b.i - 1, 1, 1);
		textureContext.fillRect(b.j - 2, b.i, 1, 1);
		textureContext.fillRect(b.j - 2, b.i + 1, 1, 1);
		textureContext.fillRect(b.j - 2, b.i - 2, 1, 1);

		// Create Texture from canvas
		const texture = new CanvasTexture(textureCanvas);
		// console.log(texture);

		// needed for lighting
		geometry.computeVertexNormals();
		plane.set([...(vertices as number[])]);

		if (enableShaders) {
			sun = new Vector3();

			// Water

			waterGeometry = new PlaneGeometry(width, height);

			water = new Water(waterGeometry, {
				textureWidth: 512,
				textureHeight: 512,
				waterNormals: new TextureLoader().load("textures/waternormals.jpg", function (texture) {
					texture.wrapS = texture.wrapT = RepeatWrapping;
				}),
				sunDirection: new Vector3(),
				sunColor: 0xffffff,
				waterColor: 0x001e0f,
				distortionScale: 3.7,
				fog: true,
			});

			water.rotation.x = -Math.PI / 2;

			sky = new Sky();
			sky.scale.setScalar(10000);

			const parameters = {
				elevation: 2,
				azimuth: 180,
			};

			const phi = MathUtils.degToRad(90 - parameters.elevation);
			const theta = MathUtils.degToRad(parameters.azimuth);

			sun.setFromSphericalCoords(1, phi, theta);

			sky.material.uniforms["sunPosition"].value.copy(sun);
			water.material.uniforms["sunDirection"].value.copy(sun).normalize();

			const skyUniforms = sky.material.uniforms;

			skyUniforms["turbidity"].value = 10;
			skyUniforms["rayleigh"].value = 2;
			skyUniforms["mieCoefficient"].value = 0.005;
			skyUniforms["mieDirectionalG"].value = 0.8;
		}
		// console.log(texture, sky, water)

		planeGeometry.set(mesh);

		return {
			texture,
			// @ts-ignore
			sky: enableShaders ? sky : undefined,
			// @ts-ignore
			water: enableShaders ? water : undefined
		};
	}

	useFrame((_, dt) => {
		if (!water) return;
		water.material.uniforms["time"].value += dt;
	});

	onDestroy(() => planeGeometry.set(null));

	const suspend = useSuspense();

	let mesh: Mesh<BufferGeometry<NormalBufferAttributes>, Material | Material[]>;

	$: {
		if (mesh) {
			planeGeometry.set(mesh);
		}
	}
</script>

<!-- <T.Mesh
  receiveShadow
  {geometry}
  material={new MeshStandardMaterial({ map: texture })}
  rotation.x={DEG2RAD * -90}
>
  <T.MeshStandardMaterial />
</T.Mesh> -->
<!-- used to have a -0.5 offset, but it didn't look pretty -->
{#await suspend(loadGround())}
<!-- loading -->
{:then { sky, water, texture}}
<T.Group position={[0, -0.01, 0]}>
	<RigidBody type={"fixed"} userData={{ name: "ground" }}>
		<AutoColliders shape="trimesh">
			<!-- <Collider
          shape="heightfield"
          args={[x_units, y_units, fl, new Vector3(-100, 1, 100)]}
          bind:collider
          on:collisionenter={(e) => console.log("Height works", e)}
        > -->
			<T.Mesh bind:ref={mesh} receiveShadow {geometry} material={new MeshStandardMaterial({ map: texture, side: 2 })} rotation.x={DEG2RAD * -90} />
			<!-- </Collider> -->
		</AutoColliders>
	</RigidBody>
</T.Group>

{#if enableShaders}
	<T is={sky} />

	<T is={water} position.y={-10} />
{/if}

<T.Group position={[0, -10, 0]}>
	<RigidBody type="fixed" userData={{ name: "water" }}>
		<!-- nothing shall move on water -->
		<AutoColliders shape={"cuboid"} friction={1} restitution={0}>
			<T.Mesh receiveShadow material={new MeshStandardMaterial({ color: 0x4f81ec, opacity: enableShaders ? 0 : 0.2, transparent: true })}>
				<T.BoxGeometry args={[width, 1, height]} />
				<!-- <T.MeshStandardMaterial /> -->
			</T.Mesh>
		</AutoColliders>
	</RigidBody>
</T.Group>
{/await}

<Obtainable />