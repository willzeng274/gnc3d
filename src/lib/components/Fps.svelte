<script lang="ts">
	import { useFrame } from "@threlte/core";
	import Xbot from "./models/Xbot.svelte";
	import Ybot from "./models/Ybot.svelte";

    // frame rate testing
    
    useFrame((_, dt) => {
        console.log(1/dt)
    })
</script>

<Xbot />
<Ybot />
