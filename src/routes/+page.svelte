
<script lang="ts">
  import App from '$lib/components/App.svelte';
	import Scene from '$lib/components/_Scene.svelte';
	import { Canvas } from '@threlte/core';
	import { World } from '@threlte/rapier';
  // import App from '$lib/components/_App.svelte';
</script>

<div>
  <App />
  <!-- <Canvas>
    <World>
      <Scene />
    </World>
  </Canvas> -->
</div>

<style>
  :global(body) {
    margin: 0;
    width: 100%;
    height: 100%
  }

  :global(html) {
    width: 100%;
    height: 100%;
  }

  div {
    width: 100%;
    height: 100%;
    background: rgb(13, 19, 32);
    background: linear-gradient(180deg, rgba(13, 19, 32, 1) 0%, rgba(8, 12, 21, 1) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
