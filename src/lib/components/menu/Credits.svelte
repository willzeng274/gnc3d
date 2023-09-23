<script lang="ts">
	import { scaleIn, scaleOut } from "$lib/animations";
	import Root from "../Root.svelte";

    export let visible: boolean;
</script>

{#if visible}
<Root>
    <dialog class="flex flex-col z-[2] p-2 rounded-md max-w-[80%] lg:max-w-[60%] max-h-[70%] lg:max-h-full overflow-y-scroll" in:scaleIn out:scaleOut>
        <h1 class="text-xl text-center font-semibold pt-5 pb-1">Credits</h1>
        <p class="text-sm text-gray-500 px-[7%] pb-5">
            All character models attributed to Adobe Creative Cloud
            <br />
            Barricade modelled by Google Poly
            <br />
            Cakes modelled by Harry Charalambous from sketchfab
            <br />
            Soundtrack attributed to ImRuscelOfficial, Lyricist and Composer is Laura Shigihara
            <br />
            Developer team:
            <a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
                NastyPigz
            </a>,
            <a data-sveltekit-preload-data="tap" href="https://github.com/Rashaad1268">
                Rush
            </a>,
            <a data-sveltekit-preload-data="tap" href="https://github.com/Rei-ath">
                Rei-ath
            </a>
            <br />
            Marketing team:
            <a data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz">
                NastyPigz
            </a>,
            <a data-sveltekit-preload-data="tap" href="https://github.com/drapespy">
                Drapes
            </a>,
            <a data-sveltekit-preload-data="tap" href="https://github.com/jason-11x">
                Jason
            </a>
            <iframe class="w-full h-[50vh] my-4 rounded-md" title="Ghost and cakes promotion video" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.youtube.com/embed/bdM8eMEgHJI?autoplay=0&fs=0&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0">
            </iframe>
            GitHub Links:
            <br />
            <a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d">
                Frontend
            </a>
            <br />
            <a class="text-blue-600 hover:underline" data-sveltekit-preload-data="tap" href="https://github.com/NastyPigz/gnc3d-backend">
                Backend
            </a> 
            <br /><br />
            Copyright (c) 2023 NastyPigz
            <br /><br />
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
            <br /><br />
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
            <br /><br />
            THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </p>
    </dialog>
</Root>
{/if}