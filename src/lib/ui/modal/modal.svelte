<script lang="ts">
    export let isOpen: boolean = false;
    export let closeOnOutsideClick: boolean = true;
  
    let dialog: HTMLDialogElement | undefined;
    let dialogContent: HTMLDivElement | undefined;
  
    function handleClick(event: MouseEvent) {
      // First check that the dialog content does not contiain the click
      if (!dialogContent?.contains(event.target as HTMLElement)) {
        // Then check if the dialog is open AND if closeOnOutsideClick is true
        if (isOpen && closeOnOutsideClick) {
          // Then check if the dialog overlay was clicked
          /* We need this extra statement because without this
             it'll also close button that was supposed to open the dialog in the first place */
          if (dialog?.contains(event.target as HTMLElement)) {
            isOpen = false;
          }
        }
      }
    }
  
    function closeDialog() {
      const closeAnimation = dialog?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
      });
  
      closeAnimation?.addEventListener("finish", () => dialog?.close());
      closeAnimation?.addEventListener("cancel", () => dialog?.close());
    }
  
    $: {
      if (isOpen) {
        dialog?.showModal();
        dialog?.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 200,
        });
      } else {
        closeDialog();
      }
    }
  </script>
  
  <svelte:window on:click={handleClick} />
  
  <dialog
    bind:this={dialog}
    class:open={isOpen}
    on:cancel|preventDefault={() => (isOpen = false)}
    {...$$restProps}
  >
    <!-- Have an inner div so outside clicks can be detected -->
    <div bind:this={dialogContent}>
      <slot />
    </div>
  </dialog>
  
  <style lang="postcss">
    dialog {
      @apply p-0 opacity-0 rounded-lg -translate-y-3
        transition-all duration-200 ease-in-out
        left-0 right-0 top-0 bottom-0 mt-auto mb-auto ml-auto mr-auto absolute;
    }
  
    dialog > div {
      /* @apply m-2; */
    }
  
    dialog.open {
      @apply opacity-100 translate-y-0;
    }
  
    dialog::backdrop {
      @apply bg-gray-500 opacity-0
                  transition-opacity duration-200;
    }
    dialog.open::backdrop {
      @apply opacity-40;
    }
  </style>
  