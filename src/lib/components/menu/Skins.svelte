<script lang="ts">
	import { T, useFrame } from "@threlte/core";
	import { spring } from "svelte/motion";
	import { MeshStandardMaterial } from "three";
	import Xbot from "../models/Xbot.svelte";
	import Ybot from "../models/Ybot.svelte";
	import { zoomIn, zoomOut } from "$lib/animations";
	import { mobile } from "$lib/store";
    const scale = spring(1);
	const scale2 = spring(1);
    export let visible: boolean;
    export let skin: number;

	let rotation = 0;
	useFrame((_, delta) => {
		rotation += delta;
	});
</script>

<T.Group {visible}>
    <T.DirectionalLight position={[0, 10, 10]} castShadow />
    <T.Group position.x={$mobile ? -1.5 : -3} position.z={$mobile ? 1.5 : 3} in={zoomIn} out={zoomOut}>
        <T.Group
            rotation.y={rotation}
            position.y={$scale}
            scale={$scale}
            on:pointerenter={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1.5)}
            on:pointerleave={() => $scale !== 2.5 && scale.set(skin === 1 ? 2 : 1)}
            on:click={() => {
                if (skin === 1) {
                    scale.set(2.5);
                    setTimeout(() => scale.set(1), 700);
                    skin = -1;
                } else {
                    scale.set(2);
                    scale2.set(1);
                    skin = 1;
                }
            }}
        >
            <T.Mesh
                material={new MeshStandardMaterial({
                    transparent: true,
                    opacity: 0,
                })}
            >
                <T.BoxGeometry args={[1, 2, 1]} />
            </T.Mesh>
        </T.Group>
        <T.Group rotation.y={rotation} position.y={$scale} scale={$scale} castShadow>
            <Xbot currentActionKey={$scale === 1 ? "idle" : $scale === 2.5 ? "fall" : "tpose"} />
        </T.Group>
        <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
            <T.CircleGeometry args={[2, 40]} />
            <T.MeshStandardMaterial color="white" />
        </T.Mesh>
    </T.Group>

    <T.Group position.x={$mobile ? 1.5 : 3} position.z={$mobile ? -1.5 : -3} in={zoomIn} out={zoomOut}>
        <T.Group
            rotation.y={rotation}
            position.y={$scale2}
            scale={$scale2}
            on:pointerenter={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1.5)}
            on:pointerleave={() => $scale2 !== 2.5 && scale2.set(skin === 0 ? 2 : 1)}
            on:click={() => {
                if (skin === 0) {
                    scale2.set(2.5);
                    setTimeout(() => scale2.set(1), 700);
                    skin = -1;
                } else {
                    scale2.set(2);
                    scale.set(1);
                    skin = 0;
                }
            }}
        >
            <T.Mesh
                material={new MeshStandardMaterial({
                    transparent: true,
                    opacity: 0,
                })}
            >
                <T.BoxGeometry args={[1, 2, 1]} />
            </T.Mesh>
        </T.Group>
        <T.Group rotation.y={rotation} position.y={$scale2} scale={$scale2} castShadow>
            <Ybot currentActionKey={$scale2 === 1 ? "idle" : $scale2 === 2.5 ? "fall" : "tpose"} />
        </T.Group>
        <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
            <T.CircleGeometry args={[2, 40]} />
            <T.MeshStandardMaterial color="white" />
        </T.Mesh>
    </T.Group>
</T.Group>