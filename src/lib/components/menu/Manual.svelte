<script lang="ts">
	import { scaleIn, scaleOut } from "$lib/animations";
	import Root from "../Root.svelte";

    export let visible: boolean;
</script>

{#if visible}
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
{/if}