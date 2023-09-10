<script lang="ts">
    import { T } from "@threlte/core";
	import { AutoColliders, Debug, RigidBody } from "@threlte/rapier";
    import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape } from "three";
    import { CSG } from "three-csg-ts";
	import HouseDoor from "./HouseDoor.svelte";

    const holeHeight: number = 9;
    const outerRadius = 4.5;
    
    const arcShape = new Shape();
    arcShape.moveTo(outerRadius * 2, outerRadius);
    arcShape.absarc(outerRadius, outerRadius, outerRadius, 0, Math.PI * 2, false);

    const geometry = new ExtrudeGeometry(arcShape, {
        depth: holeHeight,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 2
    });
    const c = new Mesh(geometry);
    geometry.center();
    geometry.rotateX(Math.PI * -.5);
    const a = new Mesh(new BoxGeometry(2, 5, 2));
    a.position.set(0, 0, 4);
    const b = new Mesh(new CylinderGeometry(5, 5, 10, 4, undefined), new MeshStandardMaterial({
        transparent: true,
        opacity: 0.9,
        color: 0x33333
    }));
    a.updateMatrix();
    b.updateMatrix();
</script>

<!-- <Debug /> -->

<T.Group position={[15, 0, 15]}>
    <RigidBody type="fixed" userData={{ name: "structure" }}>
        <AutoColliders shape="trimesh" friction={0.15} restitution={0.1}>
            <T
                is={CSG.subtract(CSG.subtract(b, a), c)}
            />
        </AutoColliders>
    </RigidBody>
    <HouseDoor />
</T.Group>
