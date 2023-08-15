<script lang="ts">
  import { T } from '@threlte/core'
  import { PlaneGeometry } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import { createNoise2D } from 'simplex-noise'
  import { AutoColliders } from '@threlte/rapier'
  const geometry = new PlaneGeometry(150, 150, 200, 200)
  const noise = createNoise2D()
  const vertices = geometry.getAttribute('position').array
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]
    const y = vertices[i + 1]
    // @ts-ignore
    vertices[i + 2] = noise(x / 4, y / 4)
    // @ts-ignore
    vertices[i + 2] *= 3;
  }
  // needed for lighting
  geometry.computeVertexNormals()
</script>

<T.Group position={[0, -0.5, 0]}>
  <!-- <AutoColliders shape={'cuboid'}> -->
  <!--   <T.Mesh receiveShadow> -->
  <!--     <T.BoxGeometry args={[100, 1, 100]} /> -->
  <!--     <T.MeshStandardMaterial /> -->
  <!--   </T.Mesh> -->
  <!-- </AutoColliders> -->
  <AutoColliders shape="trimesh">
    <T.Mesh
      {geometry}
      rotation.x={DEG2RAD * -90}
    >
      <T.MeshStandardMaterial />
    </T.Mesh>
  </AutoColliders>
</T.Group>
