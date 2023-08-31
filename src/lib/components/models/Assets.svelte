<script>
	import { T } from "@threlte/core";
	import Barricade from "./Barricade.svelte";
	import CakeFreeze from "./cakes/CakeFreeze.svelte";
	import CakeNormal from "./cakes/CakeNormal.svelte";
	import CakePurple from "./cakes/CakePurple.svelte";
	import CakeGold from "./cakes/CakeGold.svelte";
</script>

<T.Group visible={false}>
    <Barricade />
    <CakeFreeze />
    <CakeNormal />
    <CakePurple />
    <CakeGold />
</T.Group>