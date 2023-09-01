<script lang="ts">
  import { Canvas } from '@threlte/core';
  import { World } from '@threlte/rapier';
  // import { Text } from '@threlte/extras';
  import Scene from './Scene.svelte';
  import { death } from '$lib/store';
	// import { GLTF } from '@threlte/extras';
	// import { DirectionalLight } from 'three';
	// import Reaper from './models/Reaper.svelte';

  let counter = 0;
  let seed: number = 0;

  // 6 because it decrements the first time
  death.subscribe((d) => d && [(counter = 5), countDeath()]);
  
  function countDeath() {
    const deathInv = setInterval(() => {
      if (counter > 0) {
        counter--;
      } else {
        clearInterval(deathInv);
      }
    }, 1000);
  }
</script>

<dialog class:deathMenu={$death}>
  <p>You died!</p>
  <p>You will respawn in {counter}</p>
</dialog>

<Canvas
  rendererParameters={{
    // precision: 'highp',
    // antialias: false,
    // logarithmicDepthBuffer: true,
    powerPreference: 'high-performance'
  }}
>
<!-- <T.DirectionalLight position={[0, 10, 10]} castShadow /> -->
  <!-- <Reaper currentActionKey={"Reaper_Move"} /> -->
  <World gravity={[0, -19.62, 0]}>
    <Scene {seed} />
  </World>
</Canvas>

<style lang="postcss">
  :global(canvas) {
    display: block;
    position: fixed;
    width: 100% !important;
    height: 100% !important;
    touch-action: none;
    -ms-touch-action: none;
  }

  .deathMenu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: red;
    width: 20%;
    height: 10%;
    user-select: none;
    opacity: 0.8;
    z-index: 1;
  }
</style>
