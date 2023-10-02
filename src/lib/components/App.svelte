<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { World } from "@threlte/rapier";
  // import { Text } from '@threlte/extras';
  import Scene from "./Scene.svelte";
  import { death, lives } from "$lib/store";
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

{#if $lives !== 0}
  <dialog class:deathMenu={$death}>
    <p>You died!</p>
    <p>You will respawn in {counter}</p>
  </dialog>
{/if}

<Canvas
  rendererParameters={{
    // precision: 'highp',
    // antialias: false,
    // logarithmicDepthBuffer: true,
    powerPreference: "high-performance",
  }}
>
  <!-- <T.DirectionalLight position={[0, 10, 10]} castShadow /> -->
  <!-- <Reaper currentActionKey={"Reaper_Move"} /> -->
  <World>
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
    @apply rounded-md flex flex-col items-center justify-center
    bg-red-600 w-[60%] lg:w-[20%] h-[10%] select-none opacity-80 z-[1];
  }
</style>
