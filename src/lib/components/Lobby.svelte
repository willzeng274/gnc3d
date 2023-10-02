<script lang="ts">
	import { START_LOBBY_EVENT } from "$lib/constants";
	import { host, socket } from "$lib/store";
	import Button from "$lib/ui/button.svelte";
	import TextInput from "$lib/ui/textInput.svelte";
	import { getSkinNameByNumber } from "$lib/utils";
	import { createEventDispatcher } from "svelte";
	import Root from "./Root.svelte";
	import type { ConnectedPlayer } from "$lib/types";
    
    export let skin: number;
    export let players: ConnectedPlayer[];
    export let logs: string[];

    let message: string;

    let timeout: number = 0;
    let notEnough: boolean = false;

    const dispatch = createEventDispatcher<{
        message: string
    }>();
</script>


<Root>
    <dialog class="flex flex-col z-[2] duration-[5s] ease-in-out p-4 rounded-md">
        <h2 class="font-['Comic_Sans_MS'] m-0 mb-[15%] text-center">LOBBY MENU</h2>
        <h3 class="font-['Comic_Sans_MS'] m-0 mb-[10%]">You are {$host ? "host" : "guest"}</h3>
        <h4 class="font-['Comic_Sans_MS'] m-0 mb-[10%]">Players:</h4>
        <div class="font-['Comic_Sans_MS'] border-[0.125em] border-black border-solid p-0.5">
            <p class="m-0">YOU</p>
            <div>SKIN {getSkinNameByNumber(skin)}</div>
        </div>
        {#each players as p (p.id)}
            <div class="font-['Comic_Sans_MS'] border-[0.125em] border-black border-solid p-0.5">
                <p class="m-0" style={p.id === 0 ? "color: red" : undefined}>ID {p.id} NAME {p.name}</p>
                <div>
                    SKIN {getSkinNameByNumber(p.skin)}
                </div>
            </div>
        {/each}
        <h6 class="font-['Comic_Sans_MS'] m-0 mt-[20%]">Player count: {players.length + 1}</h6>
        {#if $host}
            <Button
                on:click={_ => {
                    if (players.length > 0) {
                        $socket?.send(new Uint8Array([START_LOBBY_EVENT]));
                    } else {
                        notEnough = true;
                        clearTimeout(timeout);
                        timeout = setTimeout(() => notEnough = false, 5000);
                    }
                }}>Start game as (g)host</Button
            >
            {#if notEnough}
                <p class="text-red-400">Not enough players to start!</p>
            {/if}
        {/if}
        <Button on:click={_ => $socket?.close()}>{$host ? "Disband" : "Leave"} lobby</Button>
    </dialog>
    <dialog class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-0 max-h-[20%] p-2 rounded-md">
        <div class="w-full overflow-y-scroll">
            {#each logs as msg}
                <p class="m-0">{msg}</p>
            {/each}
        </div>
        <TextInput
            childAtStart={false}
            type="text"
            placeholder="Message"
            bind:value={message}
            on:keypress={(e) => {
                if (e.key === "Enter") {
                    dispatch("message", message);
                    message = "";
                }
            }}
        ><Button
            on:click={(_) => {
                dispatch("message", message);
                message = "";
            }}>Send message</Button
        ></TextInput>
    </dialog>
</Root>