<script lang="ts">
    import { gameConfig, gameEnd, highScore, host, hostWin, score, socket } from "$lib/store";
    import type {
        Barricade,
        Cake,
        CakeGenItem,
        ConnectedPlayer,
    } from "$lib/types";
    import { T } from "@threlte/core";
    import { CollisionGroups, Debug } from "@threlte/rapier";
    import {
        CakeGen,
        Particle,
        ParticleBar,
        Player,
        Player2,
    } from "$lib/components";
    import {
        Blackhole,
        Door,
        Ground,
        House,
        Walls,
        Woman,
    } from "$lib/rapier/world";
    import {  death} from "$lib/store";
    import InGameUi from "./InGameUi.svelte";
    import Root from "$lib/components/Root.svelte";
    import TextInput from "$lib/ui/textInput.svelte";
    import Button from "$lib/ui/button.svelte";
    import { createEventDispatcher } from "svelte";
    export let chatActive: boolean;
    export let logs: string[];
    export let players: ConnectedPlayer[];
    export let playerCount: number;
    export let realSeed: number;
    export let skin: number;
    export let own_id: number | null;
    export let username: string;
    export let hostCakes: CakeGenItem[];
    export let cakes: Cake[];
    export let barricades: Barricade[];
    export let spectator: boolean;
    export let cakeFinity: boolean;
    let message: string;
    const dispatch = createEventDispatcher<{
        exit: null;
        message: string;
    }>();

    $: {
        if ($score > 200 && $socket === null && !cakeFinity) {
            $gameConfig.vegasUnlocked = true;
        }
        if ($score > $highScore && $socket === null && !cakeFinity) {
            highScore.set($score);
        }
        // why would u have a high score of above a million
        if ($score > 1e6 || $highScore > 1e6) {
            highScore.set(0);
            score.set(0);
            alert("Bro is exploiting! Your scores are reset");
        }
    }
</script>

<!-- InGame Ui handled here -->
<InGameUi
    {playerCount}
    on:exit
/>

<T.DirectionalLight castShadow position={[8, 20, -3]} />

{#if $gameConfig.debugMode}
    <Debug />
{/if}

<!-- <T.GridHelper args={[50]} position.y={0.01} /> -->

<CollisionGroups groups={[0, 15]}>
    <Ground seed={realSeed} enableShaders={$gameConfig.shader} />
</CollisionGroups>

<!-- Collision group is handled inside player -->
<Player
    bind:spectator
    {cakeFinity}
    {username}
    {chatActive}
    skin={skin === -1 ? 0 : skin}
    on:tpress={(_) => (chatActive = true)}
/>

<CollisionGroups groups={[0]}>
    <House />
    <Door />
    {#if $socket !== null}
        {#if $host}
            <CakeGen host bind:items={hostCakes} />
        {:else}
            {#each cakes as cake (cake.id)}
                <!-- the touch param is completely useless for a non-host -->
                <Particle
                    id={cake.id}
                    position={cake.position}
                    rotation={cake.rotation}
                    type={cake.type}
                    touch={0}
                    host={$host}
                    dynamic={cake.dynamic}
                />
            {/each}
        {/if}
        {#each barricades as barricade (barricade.id)}
            <ParticleBar
                id={barricade.id}
                position={barricade.position}
                rotation={barricade.rotation}
                owner={barricade.owner === own_id}
                dynamic={barricade.dynamic}
            />
        {/each}
    {:else}
        <CakeGen {cakeFinity} />
        <Woman {skin} />
        <!-- at least 1 woman from above -->
        {#each { length: $gameConfig.womenCount - 1 } as _}
            <Woman
                selfPos={[
                    Math.random() * 200 - 100,
                    8,
                    Math.random() * 200 - 100,
                ]}
                {skin}
            />
        {/each}
        {#if $gameConfig.blackhole}
            <Blackhole />
        {/if}
    {/if}
    {#each players as p (p.id)}
        <Player2
            id={p.id}
            username={p.name}
            skin={p.skin}
            position={[p.x, p.y, p.z]}
            linvel={[p.linx, p.liny, p.linz]}
            animation={p.animation}
            rotation={p.rotation}
        />
    {/each}
</CollisionGroups>

<CollisionGroups memberships={[5]} filter={[0]}>
    <Walls />
</CollisionGroups>

<!-- messages -->
<Root>
    <dialog
        class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-[0] max-h-[20%] rounded-md mb-2 opacity-80"
        class:hidden={!chatActive}
    >
        <div class="w-full overflow-y-scroll mx-2 mt-2">
            {#each logs as msg}
                <p>{msg}</p>
            {/each}
        </div>
        <TextInput
            class="ml-2"
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
        >
            <Button
                class="mr-2"
                on:click={(_) => {
                    dispatch("message", message);
                    message = "";
                }}>Send message</Button
            >
        </TextInput>
        <button
            on:click={(_) => (chatActive = false)}
            class="w-full h-full border-r border-[lightgrey] rounded-md
    py-2 text-red-500
    hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
            Close
        </button>
    </dialog>
</Root>
