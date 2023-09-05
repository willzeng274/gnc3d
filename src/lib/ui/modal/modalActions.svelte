<div class="flex w-full justify-around border-t border-t-[lightgrey]" id="modal-actions">
    <slot />
</div>

<style global>
    /* Using global styles are bad but i can't find any other solution */
    #modal-actions > button:last-child {
        border-right: none;
    }
</style>
