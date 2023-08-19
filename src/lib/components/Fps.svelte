<script lang="ts">
	import { useFrame } from "@threlte/core";
	import Root from "./Root.svelte";
    // frame rate testing
    
    let fps = 0;
    useFrame((_, dt) => {
        fps = Math.floor(1/dt);
    });
</script>

<Root>
    <h1 class="fps">FPS: {fps}</h1>
</Root>

<style>
    .fps {
        background-color: white;
        opacity: 0.5;
        width: 4em;
        margin: 0;
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1;
    }
</style>