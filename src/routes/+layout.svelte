<script lang="ts">
	import { page } from "$app/stores";
	import "../app.css";
	// console.log($page.url.hostname === "iamdefinitelylearning.vercel.app");
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	
	inject({ mode: dev ? 'development' : 'production' });
</script>

<svelte:head>
	<meta
		name="description"
		content={$page.url.hostname === "iamdefinitelylearning.vercel.app"
			? "I am definitely learning bro trust me"
			: "Ghost and Cakes 3D - a game made with $317 billion budget, powering your mom's credit card since 2018 BC"}
	/>
	<title
		>{$page.url.hostname === "iamdefinitelylearning.vercel.app"
			? "I AM LEARNING TRUST!1!"
			: "GNC3D - Powering your mom's credit card since 2018 BC"}</title
	>
</svelte:head>

<slot />
