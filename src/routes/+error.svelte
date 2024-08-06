<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="flex flex-col justify-center items-center text-center h-screen">
    <div class="flex mb-5 text-2xl">
        {$page.status}. Uh oh! This page could not be found. Search for your cakes elsewhere!
    </div>
    <img src="/cakeLie.jpg" alt="the cake is a lie">
</div>