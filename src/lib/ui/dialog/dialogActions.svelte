<div {...$$props} class="flex w-full justify-around border-t border-t-[lightgrey]" id="dialog-actions">
    <slot />
</div>

<style>
    /* Using global styles are bad but i can't find any other solution */
    :global(#dialog-actions > button:last-child) {
        border-right: none;
    }
</style>
