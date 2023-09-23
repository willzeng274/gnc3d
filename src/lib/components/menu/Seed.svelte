<script lang="ts">
	import { scaleIn, scaleOut } from "$lib/animations";
	import NumberInput from "$lib/ui/numberInput.svelte";
	import Root from "../Root.svelte";
    export let seed: number | undefined;
    export let visible: boolean;
</script>

{#if visible}
<Root>
    <dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
        <h1 class="text-xl text-center font-semibold pt-5 pb-1">Enter a map seed</h1>
        <p class="text-sm text-gray-500 px-[7%] pb-5">
            Type a number, leave it as 0 for random
            <NumberInput type="number" placeholder="Enter seed" showTopDivider={false} bind:value={seed} class="w-full"><p class="pt-1">Seed</p></NumberInput>
        </p>
    </dialog>
</Root>
{/if}