<script lang="ts">
    import { Root } from "$lib/components";
    import {
        socket,
        score,
        highScore,
        azure,
        host,
        freeze,
        gameEnd,
        hostWin,
    } from "$lib/store";
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
    <button
        id="dropdownDelayButton"
        data-dropdown-toggle="dropdownDelay"
        data-dropdown-delay="500"
        data-dropdown-trigger="hover"
        class="absolute top-0 right-0 text-white bg-#325266  focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
        > Menu <svg
            class="w-2.5 h-2.5 ml-2.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
        >
            <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 1 4 4 4-4"
            />
        </svg>
    </button>

    <!-- Dropdown menu -->
    <div
        id="dropdownDelay"
        class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700"
    >
        <ul
            class="py-2 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownDelayButton"
        >
            {#if $socket === null}
                <li>
                    <button
                        on:click={() => {
                            dispatch("exit");
                            console.log("null soket");
                        }}
                    >
                        <p>Exit Game</p>
                    </button>
                </li>
            {:else}
                <li>
                    <button
                        on:click={() => {
                            $socket?.close();
                            console.log("socket on");
                        }}
                    >
                        <p>Exit Game</p>
                    </button>
                </li>
            {/if}
            <li><button><p>TEST</p></button></li>
        </ul>
    </div>
</Root>

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
                    Player progress: {$score}/{getMaxScoreByPlayerCount(
                        playerCount
                    )} | Azure crystals owned: {$azure}
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
                    ROAD TO {getMaxScoreByPlayerCount(playerCount)}: {$score}/{getMaxScoreByPlayerCount(
                        playerCount
                    )} | Azure crystals owned: {$azure}
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
