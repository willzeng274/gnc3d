<script lang="ts">
	import { scaleIn, scaleOut } from "$lib/animations";
	import { gameConfig } from "$lib/store";
	import NumberInput from "$lib/ui/numberInput.svelte";
	import ToggleInput from "$lib/ui/toggleInput.svelte";
	import Root from "../Root.svelte";

    export let visible: boolean;
</script>

{#if visible}
<Root>
    <dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
        <div class="mt-2">
            <!-- <input type="checkbox" bind:checked={$gameConfig.fps} /> -->
            <ToggleInput bind:checked={$gameConfig.fps}>
                <p class="pb-2">Enable first person on start</p>
            </ToggleInput>
        </div>
        <div class="mt-2">
            <ToggleInput bind:checked={$gameConfig.shader}>
                <p class="pb-2">Enable shaders</p>
            </ToggleInput>
        </div>
        <div class="mt-2">
            <ToggleInput bind:checked={$gameConfig.debugMode}>
                <p class="pb-2">Enable debug mode (LAG WARNING)</p>
            </ToggleInput>
        </div>
        <div class="mt-2">
            <ToggleInput bind:checked={$gameConfig.blackhole}>
                <p class="pb-2">Enable blackhole mode</p>
            </ToggleInput>
        </div>
        <div class="mt-2">
            <ToggleInput bind:checked={$gameConfig.autosprint}>
                <p class="pb-2">Enable auto sprint</p>
            </ToggleInput>
        </div>
        <div class="mt-2">
            <NumberInput type="number" bind:value={$gameConfig.womenCount} class="my-1">
                <p class="pt-1"># of women in singleplayer</p>
            </NumberInput>
        </div>
        <div class="mt-2">
            <NumberInput type="number" bind:value={$gameConfig.fov} class="my-1">
                <p class="pt-1">FOV</p>
            </NumberInput>
        </div>
        <div class="mt-2">
            <p class="-translate-y-0.5 inline-block">Soundeffect volume</p>
            <input type="range" min={0} max={1000} step={1} bind:value={$gameConfig.volume} />
            <p class="-translate-y-0.5 inline-block">{$gameConfig.volume}%</p>
        </div>
    </dialog>
</Root>
{/if}