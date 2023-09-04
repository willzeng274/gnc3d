<script lang="ts">
    import { Text } from '@threlte/extras';
	import { useThrelte } from '@threlte/core';
    // import type * as THREE from 'three';
	import type { TextMesh } from '@threlte/extras/dist/components/Text/Text.svelte';
	import { PUBLIC_CREATOR_HAS_WIFI } from '$env/static/public';

    // const direction = new Vector3();
    export let username: string;
    export let ypos: number;
    export let color: string = "white";
    let textObject: TextMesh;

    const { camera } = useThrelte();

    $: {
        const cameraPosition = camera.current.position.clone();
        cameraPosition.y = ypos + 1;
        textObject?.lookAt(cameraPosition);
    }

    // useFrame(({ camera }, delta) => {
    //     const cameraPosition = camera.current.position.clone();
    //     cameraPosition.y = ypos + 1;
    //     textObject?.lookAt(cameraPosition);
    // })
</script>

{#if PUBLIC_CREATOR_HAS_WIFI === "true"}
<Text
    text={username}
    position.y={1}
    {color}
    fontSize={.5}
    anchorX="50%"
    anchorY="100%"
    bind:ref={textObject}
/>
{/if}