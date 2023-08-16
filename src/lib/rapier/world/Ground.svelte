<script lang="ts">
  import { T } from '@threlte/core'
  import { MeshStandardMaterial, PlaneGeometry } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import { createNoise2D } from 'simplex-noise'
  import { AutoColliders } from '@threlte/rapier'
  import { plane } from '$lib/store'
	import { height, width, x_units, y_units } from '$lib/constants';
  import alea from 'alea';
  export let seed: number | undefined;
  const geometry = new PlaneGeometry(width, height, x_units, y_units);
  const prng = seed ? alea(seed) : alea();
  const noise = createNoise2D(prng);
  const vertices = geometry.getAttribute('position').array;
  console.log("Length: ", vertices.length);

  let index = 0;
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
      const islandRadius = Math.min(x_units, y_units) / 2.67 - shapeNoise * 30;  // Vary the island radius
      // const islandRadius = (100 - shapeNoise * 30) * (1 + centralRegion)
      // Create a circular island shape
      // const islandRadius = 50;
      const minHeight = -20;
      const maxHeight = 30;
      const h = Math.max(minHeight, Math.min(maxHeight, heightNoise + islandRadius - distanceFromCenter))
      // const h = Math.max(minHeight, Math.min(maxHeight, noiseValue + islandRadius - distanceFromCenter));

      // Update the vertex position
      if (h <= 5) {
        // ISSUE: For some reason quadruples the load time when set as "undefined"???

        // @ts-ignore
        vertices[index + 2] = -25;
      } else {
        // @ts-ignore
        vertices[index + 2] = h - 30;
      }
      index += 3;
    }
  }

  // needed for lighting
  geometry.computeVertexNormals()
  plane.set([...vertices as number[]])
</script>

<!-- used to have a -0.5 offset, but it didn't look pretty -->
<T.Group position={[0, -0.01, 0]}>
  <AutoColliders shape="trimesh">
    <T.Mesh
      receiveShadow
      {geometry}
      rotation.x={DEG2RAD * -90}
    >
      <T.MeshStandardMaterial />
    </T.Mesh>
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
