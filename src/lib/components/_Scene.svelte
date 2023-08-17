<script lang="ts">
	import { useFrame } from "@threlte/core";
	import Xbot from "./models/Xbot.svelte";
	import Ybot from "./models/Ybot.svelte";

    useFrame((_, dt) => {
        console.log(1/dt)
    })
</script>

<Xbot />
<Ybot />
