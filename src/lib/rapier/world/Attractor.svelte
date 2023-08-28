<script lang="ts">
	import type { RigidBody } from "@dimforge/rapier3d-compat";
	import { T, useFrame } from "@threlte/core";
	import { Group, Vector3 } from "three";
	import { useRapier } from "@threlte/rapier";
	import type { Props, Events, Slots } from "@threlte/core";

	type GravityType = "static" | "linear" | "newtonian" | "reverseLinear" | "reverseQuadratic" | "sqrtNewtonian";

	type AttractorProps = Props<Group> & {
		/**
		 * The strength factor applied to the impulse affecting rigid-bodies within range. For newtonian
		 * calculations, strength is treated as m1 mass.
		 * Default: 1.0
		 */
		strength?: number;
		/**
		 * The radius for the Attractor's sphere of influence within which rigid-bodies will be affected.
		 * Default: 10.0
		 */
		range?: number;
		/**
		 * The method of calculating gravity on rigid bodies within range.
		 * 'static' = the same force (strength) is applied on bodies within range, regardless of distance
		 * 'linear' = force is calculated as strength * distance / range (force decreases the farther a body is from the attractor position)
		 * 'newtonian' = force is calculated as gravitationalConstant * mass1 * mass2 / Math.pow(distance, 2)
		 * Default: 'static'
		 */
		gravityType?: GravityType;
		/**
		 * The gravitational constant used to calculate force in newtonian calculations. Most people probably won't use this,
		 * but it provides an option for more realistic physics simulations.
		 * Default: 6.673e-11
		 */
		gravitationalConstant?: number;

        rigidBodyName?: string | undefined;
	};

	type AttractorEvents = Events<Group>;

	type AttractorSlots = Slots<Group>;

	type $$Props = AttractorProps;
	type DefaultProps = Required<$$Props>;
	type $$Events = AttractorEvents;
	type $$Slots = AttractorSlots;

	export let strength: DefaultProps["strength"] = 1;
	export let range: DefaultProps["range"] = 50;
	export let gravityType: DefaultProps["gravityType"] = "static";
	export let gravitationalConstant: DefaultProps["gravitationalConstant"] = 6.673e-11;
    export let rigidBodyName: AttractorProps["rigidBodyName"] = undefined;

	const { world, debug } = useRapier();
	const gravitySource = new Vector3();
	let obj = new Group();

	const calcForceByType = {
		static: (s: number, m2: number, r: number, d: number, G: number): number => s,
		linear: (s: number, m2: number, r: number, d: number, G: number) => s * (d / r),
		newtonian: (s: number, m2: number, r: number, d: number, G: number) => (G * s * m2) / Math.pow(d, 2),
		sqrtNewtonian: (s: number, m2: number, r: number, d: number, G: number) => (G * s * m2) / Math.sqrt(d),
        reverseLinear: (s: number, m2: number, r: number, d: number, G: number) => s * 1 / d,
		reverseQuadratic: (s: number, m2: number, r: number, d: number, G: number) => s * 1 / Math.sqrt(d),
	};

	function applyImpulseToBodiesInRange() {
		const impulseVector = new Vector3();
		obj.getWorldPosition(gravitySource);

		world.forEachRigidBody((body: RigidBody) => {
            if (!rigidBodyName || ((body.userData as any)?.name && (body.userData as any).name === rigidBodyName)) {
                const { x, y, z } = body.translation();
                const bodyV3: Vector3 = new Vector3(x, y, z);
                const distance: number = gravitySource.distanceTo(bodyV3);
                if (distance < range) {
                    let force = calcForceByType[gravityType](strength, body.mass(), range, distance, gravitationalConstant);
                    // Prevent wild forces when Attractors collide
                    force = force === Infinity ? strength : force;
                    impulseVector.subVectors(gravitySource, bodyV3).normalize().multiplyScalar(force);
                    body.applyImpulse(impulseVector, true);
                }
            }
		});
	}

	useFrame(() => {
		applyImpulseToBodiesInRange();
	});
</script>

<T let:ref is={obj} {...$$restProps}>
	<slot {ref} />

	{#if $debug}
		<T.Mesh>
			<T.SphereGeometry args={[range]} />
			<T.MeshBasicMaterial wireframe transparent opacity={0.25} />
		</T.Mesh>
	{/if}
</T>
