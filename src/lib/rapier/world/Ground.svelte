<script lang="ts">
  import { T } from '@threlte/core'
  import { MeshStandardMaterial, PlaneGeometry, CanvasTexture } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import { createNoise2D } from 'simplex-noise'
  import { AutoColliders, Collider } from '@threlte/rapier'
  import { plane } from '$lib/store'
	import { height, width, x_units, y_units } from '$lib/constants';
  import alea from 'alea';
	import { Quaternion, type Collider as RapierCollider } from '@dimforge/rapier3d-compat';
  // @ts-ignore
  // import Martini from '@mapbox/martini';
  export let seed: number | undefined;
  const geometry = new PlaneGeometry(width, height, x_units, y_units);
  const prng = seed ? alea(seed) : alea();
  const noise = createNoise2D(prng);
  const vertices = geometry.getAttribute('position').array;
  console.log("Length: ", vertices.length);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = x_units;
  textureCanvas.height = y_units;
  const textureContext = textureCanvas.getContext('2d')!;
  let collider: RapierCollider;

  $: {
    if (collider) {
      console.log("C", collider.handle)
      const rotationOffset = new Quaternion(0, Math.sin(Math.PI / 2 / 2), 0, Math.cos(Math.PI / 2 / 2));
      collider.setRotation(rotationOffset);
    }
  }

  // const textureImageData = textureContext.createImageData(100, 100);
  // const textureData = textureImageData.data;

  function getRandomColor() {
    const minGreen = 0;
    const maxGreen = 100;
    const minBlue = 0;
    const maxBlue = 255;
    const minRed = 0;
    const maxRed = 100;

    const greenValue = Math.floor(Math.random() * (maxGreen - minGreen + 1)) + minGreen;
    const blueValue = Math.floor(Math.random() * (maxBlue - minBlue + 1)) + minBlue;
    const redValue = Math.floor(Math.random() * (maxRed - minRed + 1)) + minRed;

    return `rgb(${redValue}, ${greenValue}, ${blueValue})`;
  }

  function getColorBasedOnHeight(h: number) {
    if (h === 30) {
      // return `rgb(0, 255, 0)`
      return getRandomColor();
    } else {
      // alert(h)
      return `rgb(${String(160 + (h-30) * 8)}, ${String(90 + (h-30)*5)}, 0)`
      // return `rgb(255, 255, 255)`
    }
  }

  let index = 0;
  let buildings = [];
  let heights: number[] = [];
  // note that 200 is the 3rd and 4th parameter of PlaneGeometry
  for (let i = 0; i <= x_units; i++) {
    for (let j = 0; j <= y_units; j++) {
      // const index = (i * ((width * height) + 1) + j) * 3;
      const x = (i / (x_units) - 0.5) * x_units;
      const y = (j / (y_units) - 0.5) * y_units;

      // Calculate distance from center
      const distanceFromCenter = Math.sqrt(x * x + y * y);

      // Apply noise to vertices based on distance from center
      // const noiseValue = noise4(x * 5, y * 5, 0.1, 0.1) * 10;
      
     // Apply noise for height
      const heightNoise = noise(x / 16, y / 16) * 5 + 
                          noise(x / 4, y / 4) * 2;
      // Apply noise for irregular shape
      const shapeNoise = noise(x / 32, y / 32);
      const islandRadius = Math.min(x_units, y_units) / 2.67 - shapeNoise * (Math.min(x_units, y_units) / 20 * 3);  // Vary the island radius
      // make sure it is within a specific radius 
      const canHaveBuilding = islandRadius < Math.min(x_units, y_units) / 2.7 && islandRadius > 5;
      
      const minHeight = -20;
      const maxHeight = 30;
      const h = Math.max(minHeight, Math.min(maxHeight, heightNoise + islandRadius - distanceFromCenter))
      // const h = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));

      // Update the vertex position
      if (h <= 5) {
        // ISSUE: For some reason quadruples the load time when set as "undefined"???

        textureContext.fillStyle = `rgb(0, 8, 61)`;
        textureContext.fillRect(j, i, 1, 1);
        // @ts-ignore
        vertices[index + 2] = -25;
      } else if (h === 30 && canHaveBuilding) {
        const rng = noise(x, y);
        // alert(rng);
        const hasBuilding = rng > 0.01 && rng < 0.015;
        if (hasBuilding) {
          buildings.push({
            i, j, index
          });
          // set all around to be the same height
        } else {
          // geometry
          textureContext.fillStyle = getColorBasedOnHeight(h);
          textureContext.fillRect(j, i, 1, 1);
          // @ts-ignore
          vertices[index + 2] = h - 30;
        }
      } else if (h === 30) {
        const rng = noise(x, y);
        // alert(rng);
        const hasBuilding = rng > 0.1 && rng < 0.2;
        if (hasBuilding) {
          textureContext.fillStyle = `rgb(0, 110, 90)`;
          textureContext.fillRect(j, i, 1, 1);
          // set all around to be the same height
          // @ts-ignore
          vertices[index + 2] = 2;
        } else {
          // geometry
          textureContext.fillStyle = getColorBasedOnHeight(h);
          textureContext.fillRect(j, i, 1, 1);
          // @ts-ignore
          vertices[index + 2] = h - 30;
        }
      } else {
        // geometry
        textureContext.fillStyle = getColorBasedOnHeight(h);
        textureContext.fillRect(j, i, 1, 1);
        // @ts-ignore
        vertices[index + 2] = h - 30;
      }
      heights.push(vertices[index + 2]);
      index += 3;
    }
  }
  // 69420 will decide where to place building
  let b = buildings[Math.floor((noise(69420, 69420)+1)/2*buildings.length)];
  // @ts-ignore
  vertices[b.index - 1] = 5; 
  // @ts-ignore
  vertices[b.index + 2] = 5;
  // @ts-ignore
  vertices[b.index + 5] = 5;
  // @ts-ignore
  vertices[b.index - 1 - (x_units + 1) * 3] = 5;
  // @ts-ignore
  vertices[b.index + 2 - (x_units + 1) * 3] = 5;
  // @ts-ignore
  vertices[b.index + 5 - (x_units + 1) * 3] = 5;
  // @ts-ignore
  vertices[b.index - 1 + (x_units + 1) * 3] = 5;
  // @ts-ignore
  vertices[b.index + 2 + (x_units + 1) * 3] = 5;
  // @ts-ignore
  vertices[b.index + 5 + (x_units + 1) * 3] = 5;
  textureContext.fillStyle = `rgb(0, 0, 255)`;
  textureContext.fillRect(b.j-1, b.i-1, 1, 1);
  textureContext.fillRect(b.j-1, b.i, 1, 1);
  textureContext.fillRect(b.j-1, b.i+1, 1, 1);
  textureContext.fillRect(b.j-1, b.i-2, 1, 1);
  textureContext.fillRect(b.j, b.i-1, 1, 1);
  textureContext.fillRect(b.j, b.i, 1, 1);
  textureContext.fillRect(b.j, b.i+1, 1, 1);
  textureContext.fillRect(b.j, b.i-2, 1, 1);
  textureContext.fillRect(b.j+1, b.i-1, 1, 1);
  textureContext.fillRect(b.j+1, b.i, 1, 1);
  textureContext.fillRect(b.j+1, b.i+1, 1, 1);
  textureContext.fillRect(b.j+1, b.i-2, 1, 1);
  textureContext.fillRect(b.j-2, b.i-1, 1, 1);
  textureContext.fillRect(b.j-2, b.i, 1, 1);
  textureContext.fillRect(b.j-2, b.i+1, 1, 1);
  textureContext.fillRect(b.j-2, b.i-2, 1, 1);


  // const martini = new Martini(257);
  // const simplificationLevel = 8;
  // const tile = martini.createTile(heights);
  // const simplifiedVertices = martini.getVertices(simplificationLevel);
  // console.log(tile.getMesh(10));
  // const meshMartini = tile.getMesh(10);
  // const gridSize = Math.floor(Math.sqrt(meshMartini.vertices.length / 2) + 1);
  // const heightArray = new Float32Array(gridSize * gridSize);

  // Populate the 'heightArray' using the original height data
  // for (let y = 0; y < gridSize; y++) {
  //   for (let x = 0; x < gridSize; x++) {
  //     const index = y * gridSize + x;
      
  //     // Extract height data from the 'originalHeightData'
  //     const height = heights[index];
      
  //     heightArray[index] = height || 0;
  //   }
  // }

  // console.log(heights, heightArray)

  // console.log(gridSize * gridSize, heightArray.length);
  // for (let i = 0; i <= width; i++) {
  //   for (let j = 0; j <= height; j++) {
  //     const realX = Math.round((Math.round(i + (width / 2))/(width / x_units))) * 3;
	// 		const realZ = (Math.round((height - Math.round(j + (height / 2)))/(height / y_units))) * 3 * (y_units + 1);
  //     textureContext.fillStyle = getColorBasedOnHeight(vertices[realX + realZ + 2]);
  //     textureContext.fillRect(i, j, 1, 1);
  //   }
  // }

  // Put the modified pixel data into the ImageData object
  // textureContext.putImageData(textureImageData, 0, 0);

  // Create Texture from canvas
  const texture = new CanvasTexture(textureCanvas);
  console.log(texture)

  // needed for lighting
  geometry.computeVertexNormals()
  plane.set([...vertices as number[]])
</script>

<!-- used to have a -0.5 offset, but it didn't look pretty -->
<T.Group position={[0, -0.01, 0]}>
  <AutoColliders shape="trimesh">
  <!-- <Collider
    shape="heightfield"
    args={[gridSize, gridSize, heightArray, new Vector3(-1, 1, 1)]}
    bind:collider
  > -->
    <T.Mesh
      receiveShadow
      {geometry}
      material={new MeshStandardMaterial({ map: texture })}
      rotation.x={DEG2RAD * -90}
    >
      <!-- <T.MeshStandardMaterial /> -->
    </T.Mesh>
  <!-- </Collider> -->
  </AutoColliders>
</T.Group>


<T.Group position={[0, -10, 0]}>
  <AutoColliders shape={'cuboid'}>
    <T.Mesh
      receiveShadow
      material={new MeshStandardMaterial({ color: 0x4f81ec, opacity: 0.2, transparent: true })}
    >
      <T.BoxGeometry args={[width, 1, height]} />
      <!-- <T.MeshStandardMaterial /> -->
    </T.Mesh>
  </AutoColliders>
</T.Group>
