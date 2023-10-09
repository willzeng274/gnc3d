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
    <label>
        <input type="checkbox" />
        <span class="menu"> <span class="hamburger" /> </span>
        <ul class="menu-ul">
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
    </label>
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

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    label .menu {
        position: absolute;
        right: -100px;
        top: -100px;
        z-index: 100;
        width: 200px;
        height: 200px;
        background: #fff;
        border-radius: 50% 50% 50% 50%;
        -webkit-transition: 0.5s ease-in-out;
        transition: 0.5s ease-in-out;
        box-shadow: 0 0 0 0 #fff, 0 0 0 0 #fff;
        cursor: pointer;
    }

    label .hamburger {
        position: absolute;
        top: 135px;
        left: 50px;
        width: 30px;
        height: 2px;
        background: #69d2e7;
        display: block;
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

    label input {
        display: none;
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

    label ul {
        size: 50ex;
        z-index: 200;
        position: absolute;
        top: 50%;
        left: 50%;
        -webkit-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
        opacity: 0;
        -webkit-transition: 0.25s 0s ease-in-out;
        transition: 0.25s 0s ease-in-out;
    }

    label button {
        margin-bottom: 1em;
        display: inline-block;
        color: #f38630;
        text-decoration: none;
        
    }

    .menu-ul li{
        text-align: center;
        position: relative;
    }
    .menu-ul p:hover {
        color: #cfd8dc;
        /* text-colo */
    }
</style>
