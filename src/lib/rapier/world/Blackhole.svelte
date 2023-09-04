<script lang="ts">
    import { T } from "@threlte/core";
    import Attractor from "./Attractor.svelte";
	import { CylinderGeometry, MeshBasicMaterial } from "three";
</script>

<Attractor
    range={200}
    strength={400}
    gravityType="reverseLinear"
    rigidBodyName="player"
/>

<T.Mesh
    geometry={new CylinderGeometry(10, 10, 1)}
    material={new MeshBasicMaterial({ color: 'black' })}
/>