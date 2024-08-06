<p align="center"> 
  <img src="static/favicon.ico" alt="Ghost" width="80px" height="80px">
</p>
<h1 align="center"> Ghost and Cakes 3D </h1>

Backend repository: [https://github.com/NastyPigz/gnc3d-backend](https://github.com/NastyPigz/gnc3d-backend)

# PLAY NOW: [https://ghostandcakes3d.vercel.app](https://ghostandcakes3d.vercel.app)

*Note: all the usage, demo, tutorial, lore, and promotional video can all be found on the webapp itself*

## GAME HISTORY

Ghost and cakes is a game originally created by Jerrdeh (2018) with block coding. The point of the game was to click on cakes that randomly spawn while a ghost chases after your cursor. Sir NastyPigz enhanced the block coding version in the 2019-2020 era, allowing more cake types and a partially working multiplayer version. A JavaScript version was also transpiled during this time. However, it wasn't until early 2022 that the game was completely rewritten in JavaScript and React 17 bootstrapped with Next.js. Although, the game was stuck in 2D and had no sign of graphical improvements. Now, time lapse to 2023, Sir NastyPigz have successfully studied enough Physics, Math, and Computer Science to bring you a 3D experience of the game! However, there were some technical difficulties with creating a ghost model, therefore the main threat of the game -- the ghost was replaced by the a woman. ADDITIONAL INFO: Due to several complaints, a configurable property was added to switch between a male and a female chaser. 

Now, ghost and cakes is a triple A game with over a million monthly active players.

Previous versions:
2D version made in React (2022): [https://github.com/NastyPigz/ghostandcakes](https://github.com/NastyPigz/ghostandcakes)

Jerrdeh's 2018 version: [here](https://scratch.mit.edu/projects/220491231/)

## Technologies

Frontend:
- SvelteKit + Threlte
- rapier_rs
- tailwindcss

Backend:
- tokio-tungstenite

## Setup

put this in a `.env` file in root directory

```
PUBLIC_PROD=false
PUBLIC_CREATOR_HAS_WIFI=true
```

set PUBLIC_CREATOR_HAS_WIFI to false to enable offline development

Install all deps (pnpm or bun is preferred, but you can use npm or yarn)

```
npm install
```

Run in dev mode (run `npm run expose` to expose on local network, this must be enabled if you are using vscode liveshare)

```
npm run dev
```