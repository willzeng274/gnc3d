

<script lang="ts">
  import App from '$lib/components/App.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ''; // for most browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

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
