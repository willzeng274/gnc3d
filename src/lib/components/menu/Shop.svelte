<script lang="ts">
	import { PUBLIC_CREATOR_HAS_WIFI } from "$env/static/public";
	import { zoomIn, zoomOut } from "$lib/animations";
	import { azure, gameConfig, mobile, pumpkins } from "$lib/store";
	import { T, useFrame } from "@threlte/core";
	import { Text } from "@threlte/extras";
	import { MeshStandardMaterial } from "three";
	import Root from "../Root.svelte";
	import Button from "$lib/ui/button.svelte";

	import { shopItems } from "$lib/constants";
	import { James, Bigvegas, Boss, Timmy } from "$lib/components/models/index";
	import Icemage from "../models/Icemage.svelte";

	export let visible: boolean;
	export let skin: number;

	let currentShopSkin = shopItems[0];
	let rotation = 0;

	useFrame((_, delta) => {
		rotation += delta;
	});
</script>

{#if visible}
	<Root>
		<dialog class="flex z-[2] bottom-1 bg-transparent text-white text-center">
            Azure owned: {$azure} <br />
            <!-- Pumpkins: {$pumpkins} -->
        </dialog>
	</Root>
{/if}

<T.Group {visible}>
	<T.DirectionalLight position={[0, 10, 10]} castShadow intensity={currentShopSkin.isUnlocked($gameConfig) ? 1 : 0.2} />
	<T.Group position.x={0} position.z={0} in={zoomIn} out={zoomOut}>
		<T.Group
			position.y={1}
			position.z={0}
			on:click={(_) =>
				currentShopSkin.isUnlocked($gameConfig) && (skin === currentShopSkin.skin ? (skin = -1) : (skin = currentShopSkin.skin))}
		>
			<T.Mesh
				material={new MeshStandardMaterial({
					color: "red",
				})}
			>
				<T.BoxGeometry args={[1, 2, 1]} />
			</T.Mesh>
		</T.Group>
		<T.Group
			position.y={!$mobile ? 1 : 2.2}
			position.x={!$mobile ? -2 : 0}
			on:click={(_) => (currentShopSkin = shopItems[Math.max(0, currentShopSkin.index - 1)])}
		>
			<T.Mesh
				material={new MeshStandardMaterial({
					color: "yellow",
				})}
			>
				<T.BoxGeometry args={$mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
			</T.Mesh>
		</T.Group>
		<T.Group
			position.y={!$mobile ? 1 : -0.5}
			position.x={!$mobile ? 2 : 0}
			position.z={!$mobile ? 0 : 1}
			on:click={(_) => (currentShopSkin = shopItems[Math.min(currentShopSkin.index + 1, shopItems.length - 1)])}
		>
			<T.Mesh
				material={new MeshStandardMaterial({
					color: "lightgreen",
				})}
			>
				<T.BoxGeometry args={$mobile ? [2, 0.3, 1] : [0.1, 2, 1]} />
			</T.Mesh>
		</T.Group>
		<T.Group rotation.y={rotation} position.y={1} position.z={1} castShadow>
			<James currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 2} />
			<Bigvegas currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 3} />
			<Boss currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 4} />
			<Timmy currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 5} />
            <Icemage currentActionKey={skin === currentShopSkin.skin ? "tpose" : "idle"} visible={currentShopSkin.skin === 6} />
		</T.Group>
		<!-- <T.Group rotation.y={rotation} position.x={4} position.y={1} position.z={0} castShadow>
            <Bigvegas currentActionKey={skin === 3 ? "tpose" : "idle"} />
        </T.Group> -->
		<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
			<T.CircleGeometry args={[2, 40]} />
			<T.MeshStandardMaterial color="white" />
		</T.Mesh>
		{#if PUBLIC_CREATOR_HAS_WIFI === "true"}
			<Text
				position.z={1.5}
				color={currentShopSkin.isUnlocked($gameConfig) ? 0x355e3b : "white"}
				text={currentShopSkin.skinText}
				fontSize={0.5}
				anchorX="50%"
				anchorY="100%"
			/>
			<Text position.z={1.7} color="#9b870c" text={currentShopSkin.perk} fontSize={0.1} anchorX="50%" anchorY="100%" />
			{#if !currentShopSkin.isUnlocked($gameConfig)}
				<Text
					position.y={-0.5}
					position.z={1.7}
					color="#ff8000"
					text={currentShopSkin.unlock}
					fontSize={0.2}
					anchorX="50%"
					anchorY="100%"
				/>
				{#if currentShopSkin.handleClick() !== null && visible}
					<Root>
						<dialog class="flex flex-col z-[2] rounded-md">
							<Button on:click={currentShopSkin.handleClick()}>BUY</Button>
						</dialog>
					</Root>
				{/if}
			{/if}
		{/if}
	</T.Group>
</T.Group>
