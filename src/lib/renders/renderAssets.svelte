<script lang="ts">
    import CakeGen from "$lib/components/CakeGen.svelte";
    import Particle from "$lib/components/Particle.svelte";
    import ParticleBar from "$lib/components/ParticleBar.svelte";
    import Player from "$lib/components/Player.svelte";
    import Player2 from "$lib/components/Player2.svelte";
    import { TXT_MESSAGE_CREATE } from "$lib/constants";
    import Blackhole from "$lib/rapier/world/Blackhole.svelte";
    import Door from "$lib/rapier/world/Door.svelte";
    import Ground from "$lib/rapier/world/Ground.svelte";
    import House from "$lib/rapier/world/House.svelte";
    import Woman from "$lib/rapier/world/Woman.svelte";
    import { score, azure, socket, gameConfig, death } from "$lib/store";
    import Button from "$lib/ui/button.svelte";
    import TextInput from "$lib/ui/textInput.svelte";
    import { T } from "@threlte/core";
    import { Suspense } from "@threlte/extras";
    import { Debug, CollisionGroups, AutoColliders,RigidBody } from "@threlte/rapier";
    import { BoxGeometry, MeshStandardMaterial } from "three";
    import Root from "$lib/components/Root.svelte";
    import type { AssetItems } from "$lib/types";
    import { getContext } from "svelte";
    export const visible:boolean=false; 
    const assetsCtx:AssetItems =  getContext('menuItems')
    let highScore= assetsCtx.highScore;
    let host= assetsCtx.host;
    let frozen= assetsCtx.frozen;
    let tutorial= assetsCtx.tutorial;
    let lobby= assetsCtx.lobby;
    let realSeed= assetsCtx.realSeed;
    let logs= assetsCtx.logs;
    let message= assetsCtx.message;
    let username= assetsCtx.username;
    let skin= assetsCtx.skin;
    let hostCakes= assetsCtx.hostCakes;
    let cakes= assetsCtx.cakes;
    let barricades= assetsCtx.barricades
    let chatActive= assetsCtx.chatActive;
    let menu= assetsCtx.menu;
    let own_id= assetsCtx.own_id
    let players = assetsCtx.players
</script>

<Suspense final>
    <Root slot="fallback">
        <!-- this to tw -->
        <p
            style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
        >
            Loading game assets...
        </p>
    </Root>
    <!-- <T.Group slot="fallback">
        <T.PerspectiveCamera
            position={[0, 0, 0]}
            on:create={({ ref }) => {
                ref.lookAt(0, 0, 0);
            }}
        />
        <T.DirectionalLight position={[0, 10, 10]} castShadow />
        <T.Group position={[0, 0, 0]}>
            <HTML>
                <p
                    style="margin-left: -12em; margin-top: -1em; text-align: center; color: white; width: 24em; font-size: 5em; font-weight: bold; font-family:'Courier New', Courier, monospace"
                >
                    Loading game assets...
                </p>
            </HTML>
        </T.Group>
    </T.Group> -->

    <Root>
        <div class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-[5%] items-center justify-center text-center">
            <div class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] px-4">
                <p>Score: {$score} | Best: {highScore} | Azure crystals owned: {$azure}</p>
            </div>
            <!-- Small inconvenience but it's fine! -->
            {#if ($socket !== null && host) || $socket === null}
                <div class="freeze"><p>Frozen for: {frozen}</p></div>
            {/if}
        </div>
        {#if $socket === null}
            <Button
                on:click={() => {
                    menu = true;
                    death.set(false);
                    realSeed = undefined;
                    tutorial = false;
                    lobby = false;
                }}
                class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit game</Button
            >
        {:else}
            <Button on:click={() => $socket?.close()} class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]">Exit Game </Button>
        {/if}
        <dialog class="flex flex-col z-[2] duration-[5s] ease-in-out bottom-[0] max-h-[20%] p-2 rounded-md" class:hidden={!chatActive}>
            <div class="w-full overflow-y-scroll">
                {#each logs as msg}
                    <p>{msg}</p>
                {/each}
            </div>
            <TextInput childAtStart={false}
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
                }}>Send message</Button></TextInput>
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
        <Player {username} {host} skin={skin === -1 ? 0 : skin} on:tpress={(_) => (chatActive = !chatActive)} />
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
        <RigidBody type="fixed" userData={{ name: "structure" }}>
            <AutoColliders shape={"cuboid"} friction={0.15} restitution={0.1}>
                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={0}
                    position.y={4.4}
                    geometry={new BoxGeometry(1.75, 3.75, 0.15)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />
                <!-- used to be 2.55 in height -->
                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={10 + 0.7 + 0.15}
                    position.y={3.125}
                    geometry={new BoxGeometry(20, 6.3, 0.15)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />

                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={-10 - 0.7 - 0.15}
                    position.y={3.125}
                    geometry={new BoxGeometry(20, 6.3, 0.15)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />

                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={-20 - 0.7 - 0.15}
                    position.y={3.125}
                    position.z={-10}
                    geometry={new BoxGeometry(0.15, 6.3, 20)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />

                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={20 + 0.7 + 0.15}
                    position.y={3.125}
                    position.z={-10}
                    geometry={new BoxGeometry(0.15, 6.3, 20)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />

                <T.Mesh
                    receiveShadow
                    castShadow
                    position.x={0}
                    position.y={3.125}
                    position.z={-20}
                    geometry={new BoxGeometry(40 + 0.7 + 0.15 * 2 + 0.15 * 4, 6.3, 0.15)}
                    material={new MeshStandardMaterial({
                        transparent: true,
                        opacity: 0.5,
                        color: 0x333333,
                    })}
                />
            </AutoColliders>
        </RigidBody>
    </CollisionGroups>
</Suspense>

<style lang="css">

	.freeze {
		display: flex;
		flex-direction: column;
		user-select: none;
		opacity: 0.8;
		top: 0;
		background-color: white;
		border: solid 1px black;
		z-index: 1;
		padding: 0 1em;
	}
	

	.hidden {
		display: none;
	}
</style>
