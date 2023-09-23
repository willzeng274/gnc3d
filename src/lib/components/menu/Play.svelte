<script lang="ts">
	import { scaleIn, scaleOut } from "$lib/animations";
	import Button from "$lib/ui/button.svelte";
	import TextInput from "$lib/ui/textInput.svelte";
	import { createEventDispatcher } from "svelte";
	import Root from "../Root.svelte";

    export let username: string;
    export let room: string;
    export let visible: boolean;

    const dispatch = createEventDispatcher();
</script>

{#if visible}
<Root>
    <dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
        <Button
            on:click={() => dispatch("singleplayer")} class="text-lg font-semibold">Singleplayer</Button
        >
        <Button
            on:click={() => dispatch("tutorial")} class="text-lg font-semibold my-2">Play tutorial</Button
        >
        <p>Multiplayer rooms</p>
        <div>
            <TextInput childAtStart={false} placeholder="Enter room ID" type="text" bind:value={room}><button
                on:click={() => dispatch("multiplayer")}>Join room</button></TextInput>
        </div>
        
        <TextInput type="text" showTopDivider={false} bind:value={username} placeholder="Enter a username"><p>Username:</p></TextInput>
    </dialog>
</Root>
{/if}