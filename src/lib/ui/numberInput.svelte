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

    export let value: any = 0;

    export let childAtStart: boolean = true;
    export let showTopDivider: boolean = true;
</script>

{#if showTopDivider}
    <hr />
{/if}

<div class="flex flex-row gap-2">
    {#if childAtStart}
        <slot /> <input on:keypress {...$$restProps} bind:value />
    {:else}
        <input on:keypress {...$$restProps} bind:value /> <slot />
    {/if}
</div>
<hr />

<style lang="postcss">
    input[type="number"] {
        @apply px-2 focus:outline-none
               bg-gray-100;
    } 
</style>
