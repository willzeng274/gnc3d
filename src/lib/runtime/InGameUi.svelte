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

    let isMenuOpen = false;
</script>

<Root>
    <div class="menu-container">
        <input
            type="checkbox"
            class="hidden"
            id="menu-toggle"
            bind:checked={isMenuOpen}
        />

        <!-- Hamburger/Cross Icon -->
        <label for="menu-toggle" class="cursor-pointer">
            {#if isMenuOpen}
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center -rotate-45"
                />
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center opacity-0"
                />
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center rotate-45"
                />
            {:else}
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center"
                />
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center"
                />
                <div
                    class="w-6 h-1 bg-gray-600 my-1 transition-transform duration-300 transform origin-center"
                />
            {/if}
        </label>

        <!-- Menu -->
        <div
            class="fixed inset-0 bg-white flex justify-center items-center z-20 transition-opacity duration-300"
            class:hidden={!isMenuOpen}
        >
            <ul class="flex flex-col items-center">
                <li>
                    <button
                        class="py-3 px-6 border-b border-gray-300 w-full text-left"
                        on:click={() => {
                            $socket === null
                                ? dispatch("exit")
                                : $socket?.close();
                            console.log("exiting");
                        }}
                    >
                        <p class="text-gray-700">Exit Game</p>
                    </button>
                </li>

                <li>
                    <button
                        class="py-3 px-6 border-b border-gray-300 w-full text-left"
                        ><p class="text-gray-700">TEST</p>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</Root>

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
  <div class="flex flex-col lg:flex-row absolute top-4 w-[80%] lg:w-[35%] h-auto lg:h-[5%] items-center justify-center text-center">
    <div class="lg:mr-4 flex flex-col select-none top-0 bg-white border border-solid border-black z-[1] p-4 rounded-lg shadow-lg">
      {#if $socket === null}
        <p class="text-xl font-semibold text-gray-700">
          Score: {$score} | Best: {$highScore} | Azure Crystals Owned: {$azure}
        </p>
      {:else if $host}
        <p class="text-xl font-semibold text-gray-700">
          Player Progress: {$score}/{getMaxScoreByPlayerCount(playerCount)} | Azure Crystals Owned: {$azure}
        </p>
      {:else}
        <div class="overflow-hidden relative bg-gray-100 h-3 w-full rounded-lg">
          <div class="h-full transition-all duration-300 bg-gradient-to-br from-blue-500 via-transparent to-blue-500" style={`width: ${Math.floor(($score / 500) * 1000) / 10}%`}></div>
        </div>
        <p class="text-xl font-semibold text-gray-700 mt-2">
          Road to {getMaxScoreByPlayerCount(playerCount)}: {$score}/{getMaxScoreByPlayerCount(playerCount)} | Azure Crystals Owned: {$azure}
        </p>
      {/if}
    </div>
    {#if ($socket !== null && $host) || $socket === null}
      <div class="lg:ml-4 mt-4 lg:mt-0 flex flex-col select-none top-0 bg-white border border-solid border-black z-[1] p-4 rounded-lg shadow-lg">
        <p class="text-xl font-semibold text-gray-700">Frozen for: {frozen}</p>
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
    .menu-container {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 20;
    }
</style>
