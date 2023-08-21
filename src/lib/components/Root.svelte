<script lang="ts">
	import { onMount } from "svelte";

    let curr: HTMLDivElement;
    
    onMount(() => {
        // firstChild is class = "root"
        const ele = document.getElementById("root");
        if (ele && curr) {
            [...curr.children].forEach((e) => {
                ele.appendChild(e);
                ele.insertBefore(e, ele.firstChild);
            })

            // console.log("what", curr);
        }
        curr.parentElement?.removeChild(curr);
    });
</script>

<div bind:this={curr}>
    <slot />
</div>

<style>
    div {
        width: 100%;
        height: 100%;
        /* cuz of stupid canvas */
    }
</style>