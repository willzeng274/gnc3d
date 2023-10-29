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

<Root>
    <label class="justify-center items-center">
        <input type="checkbox" class="hidden" />
        <span
            class="menu absolute right-[-100px] top-[-100px] z-[100] w-[200px] h-[200px] transition-[0.5s] duration-[ease-in-out] shadow-[0_0_0_0_#fff,0_0_0_0_#fff] cursor-pointer rounded-[50%_50%_50%_50%]"
        >
            <span
                class="hamburger absolute w-[30px] h-0.5 block origin-center transition-[0.5s] duration-[ease-in-out] left-[50px] top-[135px]"
            />
        </span>
        <ul
            class="z-[200] absolute -translate-x-2/4 -translate-y-2/4 opacity-0 transition-[0.25s] duration-[0s] ease-[ease-in-out] left-2/4 top-2/4 space-y-4"
        >
            <li
                class="flex rounded-lg bg-[#157386] hover:bg-[#0b333b] justify-center items-center text-center p-2.5 border-b border-gray-300"
            >
                <button
                    class="px-4 py-2 text-grey"
                    on:click={() => {
                        $socket === null ? dispatch("exit") : $socket?.close();
                        console.warn("exiting");
                    }}
                >
                    Exit Game
                </button>
            </li>

            <li
                class="flex rounded-lg bg-[#157386] hover:bg-[#0b333b] justify-center items-center text-center p-2.5 border-b border-gray-300"
            >
                <button class="px-4 py-2 text-grey"> TEST </button>
            </li>
        </ul>
    </label>
</Root>

{#if $gameEnd}
    <Root>
        <div
            class="hidden fixed w-full h-full bg-[rgba(0,0,0,0.7)] z-[1] flex justify-center items-center left-0 top-0"
        >
            <div
                class="bg-[#1e1e1e] shadow-[0_0_10px_rgba(0,0,0,0.3)] text-center text-[white] p-5 rounded-[10px]"
            >
                {#if $hostWin && $host}
                    <p class="text-[green]">"VICTORY! The cake was a lie"</p>
                {:else if !$hostWin && $host}
                    <p class="text-[green]">"DEFEAT. The cake was a lie"</p>
                {:else if !$hostWin && !$host}
                    <p class="text-[green]">
                        "VICTORY! Cake Crusaders Prevail!"
                    </p>
                {:else}
                    <p class="text-[green]">"DEFEAT. Cakemania Victory"</p>
                {/if}
                <p>Game closing in 10s...</p>
            </div>
        </div>
    </Root>
{/if}

<Root>
    <div
        class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-auto lg:h-[5%] items-center justify-center text-center"
    >
        <div
            class="lg:mr-4 flex flex-col select-none top-0 bg-white border border-solid border-black z-[1] p-4 rounded-lg shadow-lg"
        >
            {#if $socket === null}
                <p class="text-xl font-semibold text-gray-700">
                    Score: {$score} | Best: {$highScore} | Azure Crystals Owned:
                    {$azure}
                </p>
            {:else if $host}
                <p class="text-xl font-semibold text-gray-700">
                    Player Progress: {$score}/{getMaxScoreByPlayerCount(
                        playerCount
                    )} | Azure Crystals Owned: {$azure}
                </p>
            {:else}
                <div
                    class="overflow-hidden relative bg-gray-100 h-3 w-full rounded-lg"
                >
                    <div
                        class="h-full transition-all duration-300 bg-gradient-to-br from-blue-500 via-transparent to-blue-500"
                        style={`width: ${
                            Math.floor(($score / 500) * 1000) / 10
                        }%`}
                    />
                </div>
                <p class="text-xl font-semibold text-gray-700 mt-2">
                    Road to {getMaxScoreByPlayerCount(playerCount)}: {$score}/{getMaxScoreByPlayerCount(
                        playerCount
                    )} | Azure Crystals Owned: {$azure}
                </p>
            {/if}
        </div>
        {#if ($socket !== null && $host) || $socket === null}
            <div
                class="lg:ml-4 mt-4 lg:mt-0 flex flex-col select-none top-0 bg-white border border-solid border-black z-[1] p-4 rounded-lg shadow-lg"
            >
                <p class="text-xl font-semibold text-gray-700">
                    Frozen for: {frozen}
                </p>
            </div>
        {/if}
    </div>
</Root>

<style lang="css">
    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }
    label .menu {
        background: #fff;
        -webkit-transition: 0.5s ease-in-out;
    }
    label ul {
        -webkit-transition: 1s ease-in-out;
    }
    label .hamburger {
        background: #69d2e7;
        -webkit-transform-origin: center;
        transform-origin: center;
        -webkit-transition: 0.5s ease-in-out;
        transition: 0.5s ease-in-out;
    }

    label .hamburger:after,
    label .hamburger:before {
        -webkit-transition: 0.5s ease-in-out;
        transition: 0.5s ease-in-out;
        content: "";
        position: absolute;
        display: block;
        width: 100%;
        height: 100%;
        background: #69d2e7;
    }

    label .hamburger:before {
        top: -10px;
    }

    label .hamburger:after {
        bottom: -10px;
    }

    label input:checked + .menu {
        box-shadow: 0 0 0 100vw #fff, 0 0 0 100vh #fff;
        border-radius: 0;
    }

    label input:checked + .menu .hamburger {
        -webkit-transform: rotate(45deg);
        transform: rotate(45deg);
    }

    label input:checked + .menu .hamburger:after {
        -webkit-transform: rotate(90deg);
        transform: rotate(90deg);
        bottom: 0;
    }

    label input:checked + .menu .hamburger:before {
        -webkit-transform: rotate(90deg);
        transform: rotate(90deg);
        top: 0;
    }

    label input:checked + .menu + ul {
        opacity: 1;
    }
</style>
