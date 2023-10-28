<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import {
		MeshStandardMaterial,
		PlaneGeometry,
		CanvasTexture,
		RepeatWrapping,
		TextureLoader,
		Vector3,
		MathUtils,
		Mesh,
		BufferGeometry,
		type NormalBufferAttributes,
		Material,
		BufferAttribute,
		ShaderMaterial,
	} from "three";
	import { DEG2RAD } from "three/src/math/MathUtils";
	import { createNoise2D } from "simplex-noise";
	import { AutoColliders, RigidBody } from "@threlte/rapier";
	import { plane, planeGeometry } from "$lib/store";
	import { height, width, x_units, y_units } from "$lib/constants";
	import alea from "alea";
	import { Quaternion, type Collider as RapierCollider } from "@dimforge/rapier3d-compat";
	import { Sky } from "three/examples/jsm/objects/Sky";
	import { Water } from "three/examples/jsm/objects/Water";
	// @ts-ignore
	import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler";
	import { useSuspense } from "@threlte/extras";
	import { onDestroy } from "svelte";
	import Obtainable from "./Obtainable.svelte";
	import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

	Mesh.prototype.raycast = acceleratedRaycast;

	export let seed: number | undefined;
	export let enableShaders: boolean = true;
	const geometry = new PlaneGeometry(width, height, x_units, y_units);
	const prng = seed ? alea(seed) : alea();
	const noise = createNoise2D(prng);
	const vertices = geometry.getAttribute("position").array;
	// console.log("Bruh");
	geometry.setAttribute("color", geometry.attributes.position.clone());
	const colors = geometry.getAttribute("color").array;
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
	let sun: Vector3, waterGeometry: PlaneGeometry, water: Water, sky: Sky;
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
					// @ts-ignore
					colors[index] = 0;
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
						// just in case it is NOT chosen
						// @ts-ignore
						vertices[index + 2] = 0;
						// @ts-ignore
						colors[index] = 0;
					} else {
						// geometry
						// textureContext.fillStyle = getColorBasedOnHeight(h);
						// textureContext.fillRect(j, i, 1, 1);
						textureContext.drawImage(offscreenCanvas, j, i, offscreenCanvas.width, offscreenCanvas.height, j, i, 1, 1);
						// @ts-ignore
						vertices[index + 2] = h - 30;
						// @ts-ignore
						colors[index] = 1;
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
						// @ts-ignore
						colors[index] = 0.5;
					} else {
						// geometry
						// textureContext.fillStyle = getColorBasedOnHeight(h);
						// textureContext.fillRect(j, i, 1, 1);
						textureContext.drawImage(offscreenCanvas, j, i, 1, 1, j, i, 1, 1);
						// @ts-ignore
						vertices[index + 2] = h - 30;
						// @ts-ignore
						colors[index] = 1;
					}
				} else {
					// geometry
					textureContext.fillStyle = getColorBasedOnHeight(h);
					textureContext.fillRect(j, i, 1, 1);
					// @ts-ignore
					vertices[index + 2] = h - 30;
					// @ts-ignore
					colors[index] = 0;
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
		colors[b.index - 3] = 0;
		// @ts-ignore
		vertices[b.index + 2] = 5;
		// @ts-ignore
		colors[b.index] = 0;
		// @ts-ignore
		vertices[b.index + 5] = 5;
		// @ts-ignore
		colors[b.index + 3] = 0;
		// @ts-ignore
		vertices[b.index - 1 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index - 3 - (x_units + 1) * 3] = 0;
		// @ts-ignore
		vertices[b.index + 2 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index - (x_units + 1) * 3] = 0;
		// @ts-ignore
		vertices[b.index + 5 - (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index + 3 - (x_units + 1) * 3] = 0;
		// @ts-ignore
		vertices[b.index - 1 + (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index - 3 + (x_units + 1) * 3] = 0;
		// @ts-ignore
		vertices[b.index + 2 + (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index + (x_units + 1) * 3] = 0;
		// @ts-ignore
		vertices[b.index + 5 + (x_units + 1) * 3] = 5;
		// @ts-ignore
		colors[b.index + 3 + (x_units + 1) * 3] = 0;
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
		geometry.boundsTree = new MeshBVH(geometry);
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
			water: enableShaders ? water : undefined,
		};
	}

	useFrame((_, dt) => {
		if (!water) return;
		water.material.uniforms["time"].value += dt;
	});

	onDestroy(() => planeGeometry.set(null));

	const suspend = useSuspense();

	let mesh: Mesh<BufferGeometry<NormalBufferAttributes>, Material | Material[]>;

	let grmesh: Mesh;

	// Time Uniform
	const startTime = (enableShaders && Date.now()) as number;

	const grassTexture = (enableShaders && new TextureLoader().load("/textures/grass.jpg")) as THREE.Texture;
	const cloudTexture = (enableShaders && new TextureLoader().load("/textures/cloud.jpg")) as THREE.Texture;
	if (enableShaders) {
		cloudTexture.wrapS = cloudTexture.wrapT = 1000;
	}

	const timeUniform = (enableShaders && { type: "f", value: 0.0 }) as {
		type: string;
		value: number;
	};

	const grassUniforms = (enableShaders && {
		textures: { value: [grassTexture, cloudTexture] },
		iTime: timeUniform,
	}) as {
		textures: {
			value: THREE.Texture[];
		};
		iTime: {
			type: string;
			value: number;
		};
	};

	useFrame(() => {
		if (!enableShaders) return;
		const elapsedTime = Date.now() - startTime;
		grassUniforms.iTime.value = elapsedTime;
	});

	const grassMaterial = (enableShaders &&
		new ShaderMaterial({
			uniforms: grassUniforms,
			vertexShader: `
				varying vec2 vUv;
varying vec2 cloudUV;

varying vec3 vColor;
uniform float iTime;

void main() {
  vUv = uv;
  cloudUV = uv;
  vColor = color;
  vec3 cpos = position;

  float waveSize = 10.0f;
  float tipDistance = 0.3f;
  float centerDistance = 0.1f;

  if (color.x > 0.6f) {
    cpos.x += sin((iTime / 500.) + (uv.x * waveSize)) * tipDistance;
  }else if (color.x > 0.0f) {
    cpos.x += sin((iTime / 500.) + (uv.x * waveSize)) * centerDistance;
  }

  float diff = position.x - cpos.x;
  cloudUV.x += iTime / 20000.;
  cloudUV.y += iTime / 10000.;

  vec4 worldPosition = vec4(cpos, 1.);
  vec4 mvPosition = projectionMatrix * modelViewMatrix * vec4(cpos, 1.0);
  gl_Position = mvPosition;
}
				`,
			fragmentShader: `
				uniform sampler2D texture1;
uniform sampler2D textures[4];

varying vec2 vUv;
varying vec2 cloudUV;
varying vec3 vColor;

void main() {
  float contrast = 1.5;
  float brightness = 0.1;
  vec3 color = texture2D(textures[0], vUv).rgb * contrast;
  color = color + vec3(brightness, brightness, brightness);
  color = mix(color, texture2D(textures[1], cloudUV).rgb, 0.4);
  gl_FragColor.rgb = color;
  gl_FragColor.a = 1.;
}
				`,
			vertexColors: true,
			side: 2,
		})) as THREE.ShaderMaterial;

	$: {
		if (mesh) {
			planeGeometry.set(mesh);

			if (!enableShaders) break $;
			const start = Date.now();

			// const newGeo = geometry.clone();
			const newGeo = new PlaneGeometry(width, height, x_units, y_units);
			newGeo.setAttribute("color", geometry.getAttribute("color").clone());
			const newMesh = new Mesh(newGeo);
			const sampler = new MeshSurfaceSampler(newMesh).setWeightAttribute("color").build();
			const position = new Vector3();
			// sampler.sample(position);
			// console.log(position);
			// let grassCube = new Mesh(new BoxGeometry(1, 1, 5));
			// grassCube.geometry.translate(0, 5, 0);
			// const gmesh = new InstancedMesh(grassCube.geometry, grassCube.material, 10000);
			newMesh.rotation.x = Math.PI * -0.5;

			// const position = new Vector3();
			// const matrix = new Matrix4();

			const allPositions: number[] = [];
			const allUvs: number[] = [];
			const allIndices: number[] = [];
			const allColors: number[] = [];

			// Sample randomly from the surface, creating an instance of the sample
			// geometry at each sample point.
			for (let i = 0; i < BLADE_COUNT; i++) {
				sampler.sample(position);
				// console.log(position);

				const MID_WIDTH = BLADE_WIDTH * 0.5;
				const TIP_OFFSET = 0.1;
				const height = BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION;

				const yaw = Math.random() * Math.PI * 2;
				const yawUnitVec = new Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
				const tipBend = Math.random() * Math.PI * 2;
				const tipBendUnitVec = new Vector3(Math.sin(tipBend), 0, -Math.cos(tipBend));

				// Find the Bottom Left, Bottom Right, Top Left, Top right, Top Center vertex positions
				const bl = new Vector3().addVectors(position, new Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * 1));
				const br = new Vector3().addVectors(position, new Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * -1));
				const tl = new Vector3().addVectors(position, new Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * 1));
				const tr = new Vector3().addVectors(position, new Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * -1));
				const tc = new Vector3().addVectors(position, new Vector3().copy(tipBendUnitVec).multiplyScalar(TIP_OFFSET));

				tl.z += height / 2;
				tr.z += height / 2;
				tc.z += height;

				// Vertex Colors
				const black = [0, 0, 0];
				const gray = [0.5, 0.5, 0.5];
				const white = [1.0, 1.0, 1.0];

				const PLANE_SIZE = 30;

				const surfaceMin = (PLANE_SIZE / 2) * -1;
				const surfaceMax = PLANE_SIZE / 2;

				const uv = [convertRange(position.x, surfaceMin, surfaceMax, 0, 1), convertRange(position.y, surfaceMin, surfaceMax, 0, 1)];

				const verts = [
					{ pos: bl.toArray(), uv: uv, color: black },
					{ pos: br.toArray(), uv: uv, color: black },
					{ pos: tr.toArray(), uv: uv, color: gray },
					{ pos: tl.toArray(), uv: uv, color: gray },
					{ pos: tc.toArray(), uv: uv, color: white },
				];

				const VERTEX_COUNT = 5;
				const vArrOffset = i * VERTEX_COUNT;

				const indices = [
					vArrOffset,
					vArrOffset + 1,
					vArrOffset + 2,
					vArrOffset + 2,
					vArrOffset + 4,
					vArrOffset + 3,
					vArrOffset + 3,
					vArrOffset,
					vArrOffset + 2,
				];

				verts.forEach((vert) => {
					allPositions.push(...vert.pos);
					allUvs.push(...vert.uv);
					allColors.push(...vert.color);
				});
				indices.forEach((indice) => allIndices.push(indice));

				// matrix.makeTranslation(position.x, position.y, position.z);

				// gmesh.setMatrixAt(i, matrix);
			}

			newGeo.setAttribute("position", new BufferAttribute(new Float32Array(allPositions), 3));
			newGeo.setAttribute("uv", new BufferAttribute(new Float32Array(allUvs), 2));
			newGeo.setAttribute("color", new BufferAttribute(new Float32Array(allColors), 3));
			newGeo.setIndex(allIndices);
			newGeo.computeVertexNormals();
			// newGeo.computeFaceNormals();

			newMesh.material = grassMaterial;

			console.log("Generated blades in ", Date.now() - start);

			grmesh = newMesh;
		}
	}

	const BLADE_COUNT = 100000;
	const BLADE_WIDTH = 0.1 * 3;
	const BLADE_HEIGHT = 0.8 * 3;
	const BLADE_HEIGHT_VARIATION = 0.6;

	function convertRange(val: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
		return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
	}
</script>

{#if grmesh}
	<T is={grmesh} />
{/if}

<!-- used to have a -0.5 offset, but it didn't look pretty -->
{#await suspend(loadGround())}
	<!-- loading -->
{:then { sky, water, texture }}
	<T.Group position={[0, -0.01, 0]}>
		<RigidBody type={"fixed"} userData={{ name: "ground" }}>
			<AutoColliders shape="trimesh">
				<T.Mesh
					bind:ref={mesh}
					receiveShadow
					{geometry}
					material={new MeshStandardMaterial({ map: texture, side: 2 })}
					rotation.x={DEG2RAD * -90}
				/>
			</AutoColliders>
		</RigidBody>
	</T.Group>

	{#if enableShaders}
		<T is={sky} />

		<T is={water} position.y={-9.5} />
	{/if}

	<T.Group position={[0, -10, 0]}>
		<RigidBody type="fixed" userData={{ name: "water" }}>
			<!-- nothing shall move on water -->
			<AutoColliders shape={"cuboid"}>
				<T.Mesh
					receiveShadow
					material={new MeshStandardMaterial({ color: 0x4f81ec, opacity: enableShaders ? 0 : 0.2, transparent: true })}
				>
					<T.BoxGeometry args={[width, 1, height]} />
					<!-- <T.MeshStandardMaterial /> -->
				</T.Mesh>
			</AutoColliders>
		</RigidBody>
	</T.Group>
{/await}

<Obtainable />
