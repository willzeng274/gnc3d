<script lang="ts">
	import { useFrame } from "@threlte/core";
	import Root from "./Root.svelte";
    // frame rate testing
    
    let fps = 0;
    let fpsAvg: number[] = [];
    useFrame((_, dt) => {
        // fps = Math.floor(1/dt);
        fpsAvg = [...fpsAvg, Math.floor(1/dt)];
    });
    setInterval(() => {
        fps = Math.round(fpsAvg.reduce((n, curr) => n+curr, 0) / fpsAvg.length);
        fpsAvg = [];
    }, 1000);
</script>

<Root>
    <h1 class="fps">FPS: {fps}</h1>
    {#if fps < 10}
        <h1 class="warning">WARNING: Browser extensions and other processes such as tabs may negatively impact game performance</h1>
    {/if}
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

    .warning {
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