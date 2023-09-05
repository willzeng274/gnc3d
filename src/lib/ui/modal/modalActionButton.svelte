<script lang="ts">
    export let isDestructive: boolean = false;
  </script>
  
  <button
    on:click
    {...$$restProps}
    class="w-full h-full border-r border-[lightgrey] py-2
                         {isDestructive ? 'text-red-500' : 'text-blue-500'}
                         hover:bg-gray-100 active:bg-gray-200 transition-colors"
  >
    <slot />
  </button>
  