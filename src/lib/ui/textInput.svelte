<script lang="ts">
    export let value: any;

    export let childAtStart: boolean = true;
    export let showTopDivider: boolean = true;
</script>

{#if showTopDivider}
    <hr>
{/if}

<div class="flex flex-row gap-2">
    {#if childAtStart}
        <slot /> <input {...$$restProps} bind:value />
    {:else}
        <input {...$$restProps} bind:value /> <slot />
    {/if}
</div>
<hr>

<style lang="postcss">
    input[type=text] {
        @apply pt-1 px-2 focus:outline-none
               bg-gray-50;
    }
</style>
