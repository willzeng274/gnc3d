<script lang="ts">
  // import { useTweakpane } from '../utils/useTweakpane'
  import { Canvas } from '@threlte/core'
  import { World } from '@threlte/rapier'
  import Scene from './Scene.svelte'
  import { score } from '$lib/store';
  // import { onMount } from 'svelte';
  // let pane, action;
  // onMount(() => {
  //   ({ pane, action } = useTweakpane());
  //   pane.addBlade({
  //     view: 'text',
  //     text: "Use the 'wasd' keys to move around",
  //     lineCount: 3
  //   })
  // })
</script>

<!-- {#if action}
  <div use:action />
{/if} -->

<dialog class="score">Score: {$score}</dialog>

<Canvas>
  <World>
    <Scene />
  </World>
</Canvas>

<style>
  .score {
    display: block;
    user-select: none;
  }
</style>
