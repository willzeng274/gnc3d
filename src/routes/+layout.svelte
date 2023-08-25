
<script lang="ts" context="module">
  import { page } from "$app/stores";
</script>

<svelte:head>
    <meta name="description" content={$page.url.hostname === "iamdefinitelylearning.vercel.app" ? 
        "I am definitely learning bro trust me" :
        "Ghost and Cakes 3D - a game made with $317 billion budget, powering your mom's credit card since 2018 BC"
    } />
</svelte:head>

<slot />
