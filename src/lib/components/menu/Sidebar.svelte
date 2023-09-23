<script lang="ts">
	import { contextMenuItems } from "$lib/constants";
	import Root from "../Root.svelte";

    interface MenuItem {
        name: string;
    }

    export let isSuspend: boolean;
    export let currentCtx: MenuItem;
</script>

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

<style>
    .hide {
		display: none !important;
	} 
</style>