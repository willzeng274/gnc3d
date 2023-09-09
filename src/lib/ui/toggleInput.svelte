<script lang="ts">
    import type {
        HTMLInputAttributes
    } from "svelte/elements";

    type $$Props =
        | {
              value?: any;
              childAtStart?: boolean | undefined;
              showTopDivider?: boolean | undefined;
          }
        | HTMLInputAttributes;
    
    type $$Events = {
        keypress: KeyboardEvent
    };

    export let checked: any = 0;

    export let childAtStart: boolean = true;
</script>

<!-- <label class="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" value="" class="sr-only peer">
    <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Toggle me</span>
</label> -->

<div class="inline-flex flex-row gap-2">
    {#if childAtStart}
        <slot />
        <label>
            <input on:keypress type="checkbox" {...$$restProps} bind:checked class="sr-only" />
            <span
                class={`border rounded-full border-gray-100 flex items-center cursor-pointer w-12 duration-200 transition-[background-color] ${checked ? 'justify-end bg-green-500' : 'justify-start bg-gray-100'}`}
            >
                <span class="rounded-full border w-6 h-6 border-gray-200 shadow bg-white" />
            </span>
        </label>
        <!-- <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> -->
    {:else}
    <label>
        <input on:keypress type="checkbox" {...$$restProps} bind:checked class="sr-only" />
            <span
                class={`border rounded-full border-gray-100 flex items-center cursor-pointer w-12 duration-200 transition-[background-color] ${checked ? 'justify-end bg-green-500' : 'justify-start bg-gray-100'}`}
            >
                <span class="rounded-full border w-6 h-6 border-gray-200 shadow bg-white" />
            </span>
        </label>
        <!-- <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div> -->
        <slot />
    {/if}
</div>

<!-- <style lang="postcss">
    input[type="number"] {
        @apply pt-1 px-2 focus:outline-none
               bg-gray-50;
    }
</style> -->