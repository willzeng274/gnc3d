<script lang="ts">
	import { azure, freeze, gameConfig, highScore, host, score, socket,hostWin,gameEnd } from "$lib/store";
	import type { Barricade, Cake, CakeGenItem, ConnectedPlayer } from "$lib/types";
	import Button from "$lib/ui/button.svelte";
	import TextInput from "$lib/ui/textInput.svelte";
	import { T } from "@threlte/core";
	import { CollisionGroups, Debug } from "@threlte/rapier";
	import { createEventDispatcher } from "svelte";
    import { CakeGen, Particle, ParticleBar, Player, Player2, Root } from "$lib/components";
    import { Blackhole, Door, Ground, House, Walls, Woman } from "$lib/rapier/world";
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
    export let spectator: boolean;

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
		if ($score > 200 && $socket === null) {
			$gameConfig.vegasUnlocked = true;
		}
		if ($score > $highScore && $socket === null) {
			highScore.set($score);
		}
		// why would u have a high score of above a million
		if ($score > 1e6 || $highScore > 1e6) {
			highScore.set(0);
			score.set(0);
			alert("Bro is exploiting! Your scores are reset");
		}
	}

    // console.log($host);
</script>


{#if $gameEnd}
    <Root>
        <dialog
            class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-[0] max-h-[20%] rounded-md mb-2 "
        >
            {#if $hostWin}
                <p>HOST WON</p>
            {:else}
                <p>PPL WON</p>
            {/if}
        </dialog>
    </Root>
{/if}
<Root>
    <div class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-[5%] items-center justify-center text-center">
        <div class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] px-4">
            {#if $socket === null}
                <p>Score: {$score} | Best: {$highScore} | Azure crystals owned: {$azure}</p>
            {:else if $host}
                <p>Azure crystals owned: {$azure}</p>
            {:else}
                <div class="overflow-hidden relative bg-gray-100 h-3 w-full">
                    <div class="h-full transition-all duration-300 bg-gradient-to-br from-blue-500 via-transparent to-blue-500 bg-[length:1rem_1rem]" style={`width: ${Math.floor($score/500*1000)/10}%;`}></div>
                </div>
                <p>ROAD TO 500: {$score}/500 | Azure crystals owned: {$azure}</p>
            {/if}
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

<!-- Collision group is handled inside player -->
<Player bind:spectator {username} skin={skin === -1 ? 0 : skin} on:tpress={(_) => (chatActive = !chatActive)} />

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