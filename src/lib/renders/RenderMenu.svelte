<script lang="ts">
    import { PUBLIC_CREATOR_HAS_WIFI } from "$env/static/public";
    import Assets from "$lib/components/models/Assets.svelte";
    import Bigvegas from "$lib/components/models/Bigvegas.svelte";
    import Boss from "$lib/components/models/Boss.svelte";
    import James from "$lib/components/models/James.svelte";
    import Timmy from "$lib/components/models/Timmy.svelte";
    import Xbot from "$lib/components/models/Xbot.svelte";
    import Ybot from "$lib/components/models/Ybot.svelte";
    import { contextMenuItems, shopItems } from "$lib/constants";
    import { gameConfig, playerPos,startGameBool } from "$lib/store";
    import type { MenuItems } from "$lib/types";
    import Button from "$lib/ui/button.svelte";
    import NumberInput from "$lib/ui/numberInput.svelte";
    import TextInput from "$lib/ui/textInput.svelte";
    import ToggleInput from "$lib/ui/toggleInput.svelte";
    import { T } from "@threlte/core";
    import { Suspense,Text } from "@threlte/extras";
    import Root from "$lib/components/Root.svelte"
    import { getContext } from "svelte";
    import { MeshStandardMaterial } from "three";
    // import { startGame } from "$lib/components/Scene.svelte";
    export const visible:boolean=false; 
    const menuCtx:MenuItems =  getContext('menuItems')
    let isSuspend = menuCtx.isSuspend;
    let currentCtx = menuCtx.currentCtx;
    let menu = menuCtx.menu;
    const mobile = menuCtx.mobile;
    let cam = menuCtx.cam;
    const rotation = menuCtx.rotation;
    const scale = menuCtx.scale;
    const scale2 = menuCtx.scale2;
    const zoomIn = menuCtx.zoomIn;
    const zoomOut = menuCtx.zoomOut;
    let realSeed = menuCtx.realSeed;
    let seed = menuCtx.seed;
    let tutorial = menuCtx.tutorial;
    let skin = menuCtx.skin;
    let currentShopSkin = menuCtx.currentShopSkin;
    const scaleIn = menuCtx.scaleIn;
    const scaleOut = menuCtx.scaleOut;
    let username=menuCtx.username;
    let room=menuCtx.room

</script>



{#if visible}
    <Suspense final on:load={() => (isSuspend = false)}>
        <Root slot="fallback">
            <!-- this to tw -->
            <p
                style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
            >
                Loading game assets...
            </p>
        </Root>
        <Assets />
        <Root>
            <section class="w-full h-full flex flex-col lg:flex-row items-center justify-end" class:hide={isSuspend}>
                <ul class="flex flex-row lg:flex-col overflow-x-scroll lg:overflow-auto h-[20%] lg:h-full items-center justify-start lg:justify-center mr-1 w-full lg:w-[15%] bg-slate-800 text-white list-none rounded-md p-1 z-[1]">
                    {#each contextMenuItems as ctx}
                        <li
                            data-state={currentCtx == ctx ? "active" : undefined}
                            class="flex flex-col items-center justify-center w-full h-[90%] lg:h-[7%] p-4 transition-[height]
                                duration-500 hover:h-[100%] lg:hover:h-[10%] border border-solid border-slate-700
                                first:rounded-l-[4px] last:rounded-r-[4px]
                                lg:first:rounded-t-[4px] lg:last:rounded-b-[4px]"
                        >
                            <button class="bg-transparent border-none text-xs sm:text-lg w-full h-full text-center text-white" on:click={() => (currentCtx = ctx)}>{ctx.name}</button>
                        </li>
                    {/each}
                </ul>
            </section>
        </Root>
    
        <!-- {#if currentCtx.name === "Skins"} -->
        <T.PerspectiveCamera makeDefault bind:ref={cam} />
        <T.Group visible={currentCtx.name === "Skins"}>
            <T.DirectionalLight position={[0, 10, 10]} castShadow />
            <T.Group position.x={mobile ? -1.5 : -3} position.z={mobile ? 1.5 : 3} in={zoomIn} out={zoomOut}>
                <T.Group
                    rotation.y={rotation}
                    position.y={$scale}
                    scale={$scale}
                    on:pointerenter={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1.5)}
                    on:pointerleave={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1)}
                    on:click={() => {
                        if (skin === 1) {
                            scale.set(2.5);
                            setTimeout(() => scale.set(1), 700);
                            skin = -1;
                        } else {
                            scale.set(2);
                            scale2.set(1);
                            skin = 1;
                        }
                    }}
                >
                    <T.Mesh
                        material={new MeshStandardMaterial({
                            transparent: true,
                            opacity: 0,
                        })}
                    >
                        <T.BoxGeometry args={[1, 2, 1]} />
                    </T.Mesh>
                </T.Group>
                <T.Group rotation.y={rotation} position.y={$scale} scale={$scale} castShadow>
                    <Xbot currentActionKey={$scale === 1 ? "idle" : $scale === 2.5 ? "fall" : "tpose"} />
                </T.Group>
                <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
                    <T.CircleGeometry args={[2, 40]} />
                    <T.MeshStandardMaterial color="white" />
                </T.Mesh>
            </T.Group>
    
            <T.Group position.x={mobile ? 1.5 : 3} position.z={mobile ? -1.5 : -3} in={zoomIn} out={zoomOut}>
                <T.Group
                    rotation.y={rotation}
                    position.y={$scale2}
                    scale={$scale2}
                    on:pointerenter={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1.5)}
                    on:pointerleave={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1)}
                    on:click={() => {
                        if (skin === 0) {
                            scale2.set(2.5);
                            setTimeout(() => scale2.set(1), 700);
                            skin = -1;
                        } else {
                            scale2.set(2);
                            scale.set(1);
                            skin = 0;
                        }
                    }}
                >
                    <T.Mesh
                        material={new MeshStandardMaterial({
                            transparent: true,
                            opacity: 0,
                        })}
                    >
                        <T.BoxGeometry args={[1, 2, 1]} />
                    </T.Mesh>
                </T.Group>
                <T.Group rotation.y={rotation} position.y={$scale2} scale={$scale2} castShadow>
                    <Ybot currentActionKey={$scale2 === 1 ? "idle" : $scale2 === 2.5 ? "fall" : "tpose"} />
                </T.Group>
                <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
                    <T.CircleGeometry args={[2, 40]} />
                    <T.MeshStandardMaterial color="white" />
                </T.Mesh>
            </T.Group>
        </T.Group>
        <!-- {:else if currentCtx.name === "Seed"} -->
        {#if currentCtx.name === "Seed"}
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
        <!-- {:else if currentCtx.name === "Shop"} -->
        <T.Group visible={currentCtx.name === "Shop"}>
            <T.DirectionalLight position={[0, 10, 10]} castShadow intensity={currentShopSkin.isUnlocked($gameConfig) ? 1 : 0.2} />
            <T.Group position.x={0} position.z={0} in={zoomIn} out={zoomOut}>
                <T.Group
                    position.y={1}
                    position.z={0}
                    on:click={(_) =>
                        currentShopSkin.isUnlocked($gameConfig) &&
                        (skin === currentShopSkin.skin ? (skin = -1) : (skin = currentShopSkin.skin))}
                >
                    <T.Mesh
                        material={new MeshStandardMaterial({
                            color: "red",
                        })}
                    >
                        <T.BoxGeometry args={[1, 2, 1]} />
                    </T.Mesh>
                </T.Group>
                <T.Group
                    position.y={!mobile ? 1 : 2.2}
                    position.x={!mobile ? -2 : 0}
                    on:click={(_) => (currentShopSkin = shopItems[Math.max(0, currentShopSkin.index - 1)])}
                >
                    <T.Mesh
                        material={new MeshStandardMaterial({
                            color: "yellow",
                        })}
                    >
                        <T.BoxGeometry args={mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
                    </T.Mesh>
                </T.Group>
                <T.Group
                    position.y={!mobile ? 1 : -0.5}
                    position.x={!mobile ? 2 : 0}
                    position.z={!mobile ? 0 : 1}
                    on:click={(_) => (currentShopSkin = shopItems[Math.min(currentShopSkin.index + 1, shopItems.length - 1)])}
                >
                    <T.Mesh
                        material={new MeshStandardMaterial({
                            color: "lightgreen",
                        })}
                    >
                        <T.BoxGeometry args={mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
                    </T.Mesh>
                </T.Group>
                <T.Group rotation.y={rotation} position.y={1} position.z={1} castShadow>
                    <James currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 2} />
                    <Bigvegas currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 3} />
                    <Boss currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 4} />
                    <Timmy currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 5} />
                </T.Group>
                <!-- <T.Group rotation.y={rotation} position.x={4} position.y={1} position.z={0} castShadow>
                    <Bigvegas currentActionKey={skin === 3 ? "tpose" : "idle"} />
                </T.Group> -->
                <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
                    <T.CircleGeometry args={[2, 40]} />
                    <T.MeshStandardMaterial color="white" />
                </T.Mesh>
                {#if PUBLIC_CREATOR_HAS_WIFI === "true"}
                    <Text
                        position.z={1.5}
                        color={currentShopSkin.isUnlocked($gameConfig) ? 0x355e3b : "white"}
                        text={currentShopSkin.skinText}
                        fontSize={0.5}
                        anchorX="50%"
                        anchorY="100%"
                    />
                    <Text position.z={1.7} color="#9b870c" text={currentShopSkin.perk} fontSize={0.1} anchorX="50%" anchorY="100%" />
                    {#if !currentShopSkin.isUnlocked($gameConfig)}
                        <Text
                            position.y={-0.5}
                            position.z={1.7}
                            color="#ff8000"
                            text={currentShopSkin.unlock}
                            fontSize={0.2}
                            anchorX="50%"
                            anchorY="100%"
                        />
                        {#if currentShopSkin.handleClick() !== null && currentCtx.name === "Shop"}
                            <Root>
                                <dialog class="flex flex-col z-[2] rounded-md">
                                    <Button on:click={currentShopSkin.handleClick()}>BUY</Button>
                                </dialog>
                            </Root>
                        {/if}
                    {/if}
                {/if}
            </T.Group>
        </T.Group>
        <!-- {:else if currentCtx.name === "Play"} -->
        {#if currentCtx.name === "Play"}
            <Root>
                <dialog class="flex flex-col z-[2] p-4 rounded-md" in:scaleIn out:scaleOut>
                    <Button
                        on:click={() => {
                            realSeed = seed;
                            playerPos.set([0, 10, 3]);
                            startGameBool.set(false);
                        }} class="text-lg font-semibold">Singleplayer</Button
                    >
                    <Button
                        on:click={() => {
                            menu = false;
                            tutorial = true;
                        }} class="text-lg font-semibold my-2">Play tutorial</Button
                    >
                    <p>Multiplayer rooms</p>
                    <div>
                        <TextInput childAtStart={false} placeholder="Enter room ID" type="text" bind:value={room}><button
                            on:click={() => {
                                startGameBool.set(true);
                            }}>Join room</button></TextInput>
                    </div>
                    
                    <TextInput type="text" showTopDivider={false} bind:value={username} placeholder="Enter a username"><p>Username:</p></TextInput>
                </dialog>
            </Root>
        {:else if currentCtx.name === "Settings"}
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
        {:else if currentCtx.name === "Manual"}
            <Root>
                <dialog class="flex flex-col z-[2] p-4 rounded-md max-w-[80%] lg:max-w-[60%] max-h-[70%] lg:max-h-full overflow-y-scroll" in:scaleIn out:scaleOut>
                    <h1 class="text-xl text-center font-semibold pt-5 pb-1">Game manual</h1>
                    <p class="text-sm text-gray-500 px-[7%] pb-5">
                        WASD or Joystick for movement (Hold shift to sprint, on mobile the sprint detection is automatic)
                        <br />
                        Pointer drag for camera rotation in Third Person (and both POVs on mobile)
                        <br />
                        Pointer lock for camera rotation in First Person
                        <br />
                        Mouse wheel or Slider for zooming in/out
                        <br />
                        Adjust FOV in settings
                        <br />
                        Press "e" to emote with applicable skins
                        <br />
                        Press "f" to dash
                        <br />
                        Press "q" to place barricades
                        <br />
                        Press "t" to open chat in multiplayer
                        <br />
                        Press "esc" to exit chat in multiplayer
                        <br />
                        Mobile players cannot chat
                        <br />
                        Press green panel in skin shop to go to next skin, yellow panel to go to previous
                        <br />
                        Enter a seed in the seed panel for persistent seeded terrain generation, leave at 0 for random
                        <br /><br />
                        Game history and lore: Ghost and cakes is a game originally created by Jerrdeh (2018) with block coding.
                        The point of the game was to click on cakes that randomly spawn while a ghost chases after your cursor.
                        Sir NastyPigz enhanced the block coding version in the 2019-2020 era, allowing more cake types
                        and a partially working multiplayer version. A JavaScript version was also transpiled during this time.
                        However, it wasn't until early 2022 that the game was completely rewritten in JavaScript and React 17,
                        bootstrapped with Next.js. Although, the game was stuck in 2D and had no sign of graphical improvements.
                        Now, time lapse to 2023, Sir NastyPigz have successfully studied enough Physics, Math, and Computer Science
                        to bring you a 3D experience of the game! However, there were some technical difficulties with creating a
                        ghost model, therefore the main threat of the game -- the ghost was replaced by the true threat of
                        all of the humanity -- the woman. Now in singleplayer, there is a woman chasing after you
                        for your money! If you are broke, then you can picture her as an extreme feminist. If you are
                        a woman (somehow), please first slide into Sir NastyPigz's DMs (Discord: Snarkatude) and then
                        picture the woman as an insane individual belonging to your (different) species.
                    </p>
                </dialog>
            </Root>
        {:else if currentCtx.name === "Credits"}
            <Root>
                <dialog class="flex flex-col z-[2] p-2 rounded-md max-w-[80%] lg:max-w-[60%] max-h-[70%] lg:max-h-full overflow-y-scroll" in:scaleIn out:scaleOut>
                    <h1 class="text-xl text-center font-semibold pt-5 pb-1">Credits</h1>
                    <p class="text-sm text-gray-500 px-[7%] pb-5">
                        All character models attributed to Adobe Creative Cloud
                        <br />
                        Barricade modelled by Google Poly
                        <br />
                        Cakes modelled by Harry Charalambous from sketchfab
                        <br />
                        Soundtrack attributed to ImRuscelOfficial, Lyricist and Composer is Laura Shigihara
                        <br />
                        Developer team:
                        <a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
                            NastyPigz
                        </a>,
                        <a data-sveltekit-preload-data="tap" href="https://github.com/Rashaad1268">
                            Rush
                        </a>,
                        <a data-sveltekit-preload-data="tap" href="https://github.com/Rei-ath">
                            Rei-ath
                        </a>
                        <br />
                        Marketing team:
                        <a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
                            NastyPigz
                        </a>,
                        <a data-sveltekit-preload-data="tap" href="https://github.com/drapespy">
                            Drapes
                        </a>,
                        <a data-sveltekit-preload-data="tap" href="https://github.com/jason-11x">
                            Jason
                        </a>
                        <iframe class="w-full h-[50vh] my-4 rounded-md" title="Ghost and cakes promotion video" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.youtube.com/embed/bdM8eMEgHJI?autoplay=0&fs=0&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0">
                        </iframe>
                        GitHub Links:
                        <br />
                        <a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d">
                            Frontend
                        </a>
                        <br />
                        <a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d-backend">
                            Backend
                        </a> 
                        <br /><br />
                        Copyright (c) 2023 NastyPigz
                        <br /><br />
                        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                        <br /><br />
                        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                        <br /><br />
                        THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                    </p>
                </dialog>
            </Root>
        {/if}
    </Suspense>
    
{/if}

<style>
    .hide {
		display: none !important;
	} 
</style>