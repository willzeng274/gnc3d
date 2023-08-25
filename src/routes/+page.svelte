
<script lang="ts" context="module">
  import { page } from "$app/stores";
</script>

<script lang="ts">
  import App from '$lib/components/App.svelte';
</script>

<svelte:head>
  {#if $page.url.hostname === "iamdefinitelylearning.vercel.app"}
    <meta name="description" content="I am definitely learning bro trust me" />
  {:else}
    <meta name="description" content="Ghost and Cakes 3D - a game made with $317 billion budget, powering your mom's credit card since 2018 BC" />
  {/if}
</svelte:head>

<div id="root">
  <App />
</div>

<style>
  :global(body) {
    margin: 0;
    width: 100%;
    height: 100%;
    user-select: none;
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
    position: fixed;
    top: 0;
    left: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
