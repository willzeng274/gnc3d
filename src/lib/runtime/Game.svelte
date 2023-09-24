<script lang="ts">
	import CakeGen from "$lib/components/CakeGen.svelte";
	import Particle from "$lib/components/Particle.svelte";
	import ParticleBar from "$lib/components/ParticleBar.svelte";
	import Player from "$lib/components/Player.svelte";
	import Player2 from "$lib/components/Player2.svelte";
	import Root from "$lib/components/Root.svelte";
	import Blackhole from "$lib/rapier/world/Blackhole.svelte";
	import Door from "$lib/rapier/world/Door.svelte";
	import Ground from "$lib/rapier/world/Ground.svelte";
	import House from "$lib/rapier/world/House.svelte";
	import Walls from "$lib/rapier/world/Walls.svelte";
	import Woman from "$lib/rapier/world/Woman.svelte";
	import { azure, freeze, gameConfig, highScore, host, score, socket } from "$lib/store";
	import type { Barricade, Cake, CakeGenItem, ConnectedPlayer } from "$lib/types";
	import Button from "$lib/ui/button.svelte";
	import TextInput from "$lib/ui/textInput.svelte";
	import { T } from "@threlte/core";
	import { CollisionGroups, Debug } from "@threlte/rapier";
	import { createEventDispatcher } from "svelte";

    export let chatActive: boolean;
    export let logs: string[];
    export let players: ConnectedPlayer[];
    export let realSeed: number;
    export let skin: number;
    export let own_id: number | null;
    export let username: string;
    export let hostCakes: CakeGenItem[];
    export let cakes: Cake[];
    export let barricades: Barricade[];

    const dispatch = createEventDispatcher<{
        exit: null,
        message: string
    }>();

    let message: string;
    let frozen: number = 0;

	let tm: number;
    let intervalTm: number;

	freeze.subscribe((fr) => {
		if (fr) {
            const now = Date.now();
            const unfreezeTime = now + frozen + 2500;
            // unfreeze time = freezeTime + frozen + 5000
            clearInterval(intervalTm);
            intervalTm = setInterval(() => {
                frozen = unfreezeTime - Date.now();
                if (frozen <= 0) {
                    frozen = 0;
                    clearInterval(intervalTm);
                }
            }, 50);
			clearTimeout(tm);
			tm = setTimeout(() => {
				freeze.set(0);
			}, unfreezeTime - now);
		}
	});

	$: {
		if ($score > 200) {
			$gameConfig.vegasUnlocked = true;
		}
		if ($score > $highScore) {
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

<Root>
    <div class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-[5%] items-center justify-center text-center">
        <div class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] px-4">
            <p>Score: {$score} | Best: {$highScore} | Azure crystals owned: {$azure}</p>
        </div>
        <!-- Small inconvenience but it's fine! -->
        {#if ($socket !== null && $host) || $socket === null}
            <div class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] py-0 px-4"><p>Frozen for: {frozen}</p></div>
        {/if}
    </div>
    {#if $socket === null}
        <Button
            on:click={() => dispatch("exit")}
            class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit game</Button
        >
    {:else}
        <Button on:click={() => $socket?.close()} class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit Game </Button>
    {/if}
    <dialog class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-[0] max-h-[20%] rounded-md mb-2 opacity-80" class:hidden={!chatActive}>
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
            on:click={_ => {
                dispatch("message", message);
                message = "";
            }}>Send message</Button>
        </TextInput>
        <button
            on:click={_ => chatActive = false}
            class="w-full h-full border-r border-[lightgrey] rounded-md
            py-2 text-red-500
            hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
            Close
        </button>
    </dialog>
</Root>

<T.DirectionalLight castShadow position={[8, 20, -3]} />

{#if $gameConfig.debugMode}
    <Debug />
{/if}

<!-- <T.GridHelper args={[50]} position.y={0.01} /> -->

<CollisionGroups groups={[0, 15]}>
    <Ground seed={realSeed} enableShaders={$gameConfig.shader} />
</CollisionGroups>
<CollisionGroups groups={[0]}>
    <House />
    <Player {username} skin={skin === -1 ? 0 : skin} on:tpress={(_) => (chatActive = !chatActive)} />
    <Door />
    {#if $socket !== null}
        {#if host}
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
                    {host}
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
        <CakeGen />
        <Woman {skin} />
        <!-- at least 1 woman from above -->
        {#each { length: $gameConfig.womenCount - 1 } as _}
            <Woman selfPos={[Math.random() * 200 - 100, 8, Math.random() * 200 - 100]} {skin} />
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