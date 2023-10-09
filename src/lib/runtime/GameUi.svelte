<script lang="ts">
    import { Root } from "$lib/components";
    import { socket, score, highScore, azure, host, freeze, gameEnd, hostWin } from "$lib/store";
    import Button from "$lib/ui/button.svelte";
    import { getMaxScoreByPlayerCount } from "$lib/utils";
    import { createEventDispatcher } from "svelte";
    export let playerCount: number;
    let frozen: number = 0;
    let tm: number;
    let intervalTm: number;
    const dispatch = createEventDispatcher<{
        exit: null;
        message: string;
    }>();


    freeze.subscribe((fr) => {
        if (fr) {
            const now = Date.now();
            const unfreezeTime = now + frozen + 2500;
            // unfreeze time = freezeTime + frozen + 5000
            clearInterval(intervalTm);
            intervalTm = setInterval(() => {
                frozen = unfreezeTime - Date.now();
                if (frozen <= 0) {
                    frozen = 0;
                    clearInterval(intervalTm);
                }
            }, 50);
            clearTimeout(tm);
            tm = setTimeout(() => {
                freeze.set(0);
            }, unfreezeTime - now);
        }
    });

</script>



{#if $gameEnd}
    <Root>
        <div class="overlay">
            <div class="game-end">
                    {#if $hostWin && $host}
                        <p>"VICTORY! The cake was a lie"</p>
                    {:else if !$hostWin && $host}
                        <p>"DEFEAT. The cake was a lie"</p>
                    {:else if !$hostWin && !$host}
                        <p>"VICTORY! Cake Crusaders Prevail!"</p>
                    {:else}
                        <p>"DEFEAT. Cakemania Victory"</p>
                    {/if}
                    <p>Game closing in 10s...</p>
            </div>
        </div>
    </Root>
{/if}

<Root>
    <div
        class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-[5%] items-center justify-center text-center"
    >
        <div
            class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] px-4"
        >
            {#if $socket === null}
                <p>
                    Score: {$score} | Best: {$highScore} | Azure crystals owned:
                    {$azure}
                </p>
            {:else if $host}
                <p>
                    Player progress: {$score}/{getMaxScoreByPlayerCount(playerCount)} | Azure crystals owned: {$azure}
                </p>
            {:else}
                <div class="overflow-hidden relative bg-gray-100 h-3 w-full">
                    <div
                        class="h-full transition-all duration-300 bg-gradient-to-br from-blue-500 via-transparent to-blue-500 bg-[length:1rem_1rem]"
                        style={`width: ${
                            Math.floor(($score / 500) * 1000) / 10
                        }%;`}
                    />
                </div>
                <p>
                    ROAD TO {getMaxScoreByPlayerCount(playerCount)}: {$score}/{getMaxScoreByPlayerCount(playerCount)} | Azure crystals owned: {$azure}
                </p>
            {/if}
        </div>
        <!-- Small inconvenience but it's fine! -->
        {#if ($socket !== null && $host) || $socket === null}
            <div
                class="flex flex-col select-none opacity-80 top-0 bg-white border border-solid border-black z-[1] py-0 px-4"
            >
                <p>Frozen for: {frozen}</p>
            </div>
        {/if}
    </div>
    {#if $socket === null}
        <Button
            on:click={() => dispatch("exit")}
            class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]"
            >Exit game</Button
        >
    {:else}
        <Button
            on:click={() => $socket?.close()}
            class="fixed top-0 right-0 z-[1] w-[25%] h-[10%] lg:h-[5%]"
            >Exit Game
        </Button>
    {/if}
</Root>

<style lang="css">
    .overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .game-end {
        background-color: #1e1e1e;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        text-align: center;
        padding: 20px;
        color: white;
    }

    .game-end p {
        color: green;
    }
</style>
