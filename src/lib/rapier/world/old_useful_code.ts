// @ts-ignore
const frequency = 0.005;
// @ts-ignore
const threshold = 0.2;
// @ts-ignore
const vertices = geometry.getAttribute('position').array
  
for (let i = 0; i < vertices.length; i += 3) {
    // @ts-ignore
    const x = (vertices[i] / (width*height) - 0.5) * width;
    // @ts-ignore
    const y = (vertices[i + 1] / (width*height) - 0.5) * height;

    // Calculate distance from center
    const distanceFromCenter = Math.sqrt(x * x + y * y);

    // Apply noise to vertices based on distance from center
    // @ts-ignore
    const noiseValue = noise(x * 5, y * 5) * 10;

    // Create a circular island shape
    const islandRadius = 4;
    const minHeight = -20;
    const maxHeight = 50;
    const h = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));

    // Update the vertex position
    // @ts-ignore
    vertices[i + 2] = h;
}
let index = 0;
for (let i = 0; i <= 200; i++) {
    for (let j = 0; j <= 200; j++) {
        // const index = (i * ((width * height) + 1) + j) * 3;
        const x = (i / (200) - 0.5) * 200;
        const y = (j / (200) - 0.5) * 200;

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(x * x + y * y);

        // Apply noise to vertices based on distance from center
        // @ts-ignore
        const noiseValue = noise(x * 5, y * 5) * 10;

        // Create a circular island shape
        const islandRadius = 50;
        const minHeight = -20;
        const maxHeight = 30;
        const h = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));

        // Update the vertex position
        // @ts-ignore
        vertices[index + 2] = h - 50;
        index += 3;
    }
}


// function noiseE(nx: number, ny: number) { return noise(nx, ny)*2 + 0.5; }
// function noiseM(nx: number, ny: number) { return noise2(nx, ny)/2 + 0.5; }
// const mountainThreshold = 0.6; // Adjust to control mountain frequency
// const mountainHeight = 20;    // Adjust to control mountain height
// const regularTerrainHeight = 5;
// alert(vertices.length)
// for (let i = 0; i < vertices.length; i += 3) {
//   // let x = vertices[i];
//   // let y = vertices[i + 1];
//   const x = i / planeSegments - 0.5;
//   const y = j / planeSegments - 0.5;

//   // Calculate distance from center
//   const distanceFromCenter = Math.sqrt(x * x + y * y);

//   // Apply noise to vertices based on distance from center
//   const noiseValue = simplex.noise2D(x * 5, y * 5);
//   const vertex = geometry.vertices[i * (planeSegments + 1) + j];

//   // Create a circular island shape
//   const islandRadius = 0.4;
//   const minHeight = -0.2;
//   const maxHeight = 0.3;
//   const height = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));
//   vertex.z = height;
//   @ts-ignore
//   vertices[i + 2] = a;
//   const mountains = noise(x / 50, y / 50);
//   const rocks = noise(x / 8, y / 8) * .1;
//   const mountains = noise(x / 100, y / 100);
//   const rocks = noise(x / 16, x / 16) * .1;
//   @ts-ignore
//   vertices[i+2] = (mountains + rocks) * mountainHeight;
// }