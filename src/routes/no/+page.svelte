<script lang="ts">
    import nograde from '$lib/assets/nograde.jpeg';
    import { onMount } from "svelte";

    onMount(() => {
        window.addEventListener("click", () => {
            document.getElementById("v").muted = false;
            document.getElementById("v").play();
        });
    });
</script>

<img alt="No grades?" src={nograde} />

<video muted autoplay loop hidden id="v">
    <source src="/audio/siren.mp3" type="audio/mp3">
</video>

<style>
    :global(body) {
        margin: 0;
        width: 100%;
        height: 100%;
        user-select: none;
        overflow: hidden;
    }

    :global(html) {
        width: 100%;
        height: 100%;
    }

    img {
        width: 100%;
        height: 100%;
    }
</style>