<script lang="ts">
  // import { useTweakpane } from '../utils/useTweakpane'
  import { Canvas } from '@threlte/core'
  import { World } from '@threlte/rapier'
  import Scene from './Scene.svelte'
  import { death, freeze, score } from '$lib/store';
  let counter = 0;
  let frozen = 0;
  let seed: number = 0;
  let seedMenu = true;
  // 6 because it decrements the first time
  death.subscribe((d) => d && (counter = 5));
  setInterval(() => {
    if (counter > 0) counter--;
  }, 1000);

  setInterval(() => {
    if (frozen > 0) frozen-=50;
  }, 50);

  let tm: number;

  freeze.subscribe((fr) => {
    if (fr) {
      clearTimeout(tm);
      tm = setTimeout(() => {
        freeze.set(0);
      }, 4000);
      frozen = 2500;
    }
  })
</script>

<!-- {#if action}
  <div use:action />
{/if} -->

<dialog class="score">Score: {$score}</dialog>
<dialog class="freeze">Frozen for: {frozen}</dialog>
<dialog class:seedMenu>
  Enter a map seed:
  <input type="number" bind:value={seed} />
  <button on:click={() => seedMenu = false}>Submit</button>
</dialog>

<dialog class:deathMenu={$death}>
  <p>You died!</p>
  <p>You will respawn in {counter}</p>
</dialog>

{#if !seedMenu}
<Canvas>
  <World gravity={[0, -19.62, 0]}>
    <Scene {seed} />
  </World>
</Canvas>
{/if}

<style>
  :global(canvas) {
    width: 100% !important;
    height: 100% !important;
  }

  .seedMenu {
    display: block;
  }

  .score {
    display: flex;
    position: fixed;
    top: 1px;
    user-select: none;
    opacity: 0.8;
  }

  .freeze {
    display: flex;
    position: fixed;
    top: 3em;
    user-select: none;
    opacity: 0.8;
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
  }

</style>
