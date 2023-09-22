<script lang="ts">
    import Tutorial from "$lib/components/Tutorial.svelte";
    import { death } from "$lib/store";
    import { Suspense, createTransition, interactivity, transitions, Text } from "@threlte/extras";
    import Root from "$lib/components/Root.svelte"
    import { getContext } from "svelte";
    import type { TutorialItems } from "$lib/types";
    export const visible:boolean=false; 
    const menuCtx:TutorialItems =  getContext('tutorialItems')
    let menu = menuCtx.menu;
    let realSeed = menuCtx.realSeed;
    let tutorial = menuCtx.tutorial;

</script>

{#if visible}
    <Suspense>
        <Root slot="fallback">
            <!-- this to tw -->
            <p
                style="text-align: center; color: white; width: 100%; font-size: 500%; font-weight: bold; font-family:'Courier New', Courier, monospace"
            >
                Loading game assets...
            </p>
        </Root>
        <Tutorial
            on:end={() => {
                death.set(false);
                realSeed = undefined;
                tutorial = false;
                menu = true;
            }}
        />
    </Suspense>
{/if}