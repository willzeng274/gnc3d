<script lang="ts">
    import {
        START_LOBBY_EVENT,
        TXT_MESSAGE_CREATE,
    } from "$lib/constants";
    import { socket } from "$lib/store";
    import Button from "$lib/ui/button.svelte";
    import TextInput from "$lib/ui/textInput.svelte";
    import { getSkinNameByNumber } from "$lib/utils";
    import Root from "$lib/components/Root.svelte";
    import type { LobbyItems } from "$lib/types";
    import { getContext } from "svelte";
    export const visible:boolean=false; 
    let lobbyCtx:LobbyItems =  getContext('lobbyItems')
    let skin = lobbyCtx.skin;
    let host = lobbyCtx.host;
    let players = lobbyCtx.players;
    let logs = lobbyCtx.logs;
    let message = lobbyCtx.message;
</script>

<Root>
    <dialog class="lobby p-4 rounded-md">
        <h2>LOBBY lobby</h2>
        <h3>You are {host ? "host" : "guest"}</h3>
        <h4>Players:</h4>
        <div class="player">
            <p>YOU</p>
            <div>SKIN {getSkinNameByNumber(skin)}</div>
        </div>
        {#each players as p (p.id)}
            <div class="player">
                <p style={p.id === 0 ? "color: red" : undefined}>
                    ID {p.id} NAME {p.name}
                </p>
                <div>
                    SKIN {getSkinNameByNumber(p.skin)}
                </div>
            </div>
        {/each}
        <h6>Player count: {players.length + 1}</h6>
        {#if host}
            <Button
                on:click={(_) => {
                    $socket?.send(new Uint8Array([START_LOBBY_EVENT]));
                }}>Start game as (g)host</Button
            >
        {/if}
        <Button on:click={(_) => $socket?.close()}
            >{host ? "Disband" : "Leave"} lobby</Button
        >
    </dialog>
    <dialog
        class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-0 max-h-[20%] p-2 rounded-md"
    >
        <div class="w-full overflow-y-scroll">
            {#each logs as msg}
                <p>{msg}</p>
            {/each}
        </div>
        <TextInput
            childAtStart={false}
            type="text"
            placeholder="Message"
            bind:value={message}
            on:keypress={(e) => {
                if (e.key === "Enter") {
                    logs = ["YOU: " + message, ...logs];
                    $socket?.send(TXT_MESSAGE_CREATE + message);
                    message = "";
                }
            }}
            ><Button
                on:click={(_) => {
                    logs = ["YOU: " + message, ...logs];
                    $socket?.send(TXT_MESSAGE_CREATE + message);
                    message = "";
                }}>Send message</Button
            ></TextInput
        >
    </dialog>
</Root>

<style lang="css">
    .lobby {
        display: flex;
        flex-direction: column;
        z-index: 2;
        transition: 5s;
        animation: ease-in-out 5s;
    }

    .lobby h2 {
        font-family: "Comic Sans MS";
        margin: 0;
        margin-bottom: 15%;
        text-align: center;
    }

    .lobby h3,
    .lobby h4 {
        font-family: "Comic Sans MS";
        margin: 0;
        margin-bottom: 10%;
    }

    .lobby p {
        margin: 0;
    }

    .lobby h6 {
        font-family: "Comic Sans MS";
        margin: 0;
        margin-top: 20%;
    }

    .lobby .player {
        font-family: "Comic Sans MS";
        border: 0.125em solid black;
        padding: 0.125em;
    }
</style>
