<script lang="ts">
  import { afterUpdate, createEventDispatcher, onDestroy } from 'svelte'
  import { Camera, Vector2, Vector3 } from 'three'
  import type { Group } from 'three';
  import { useThrelte, useParent, useFrame } from '@threlte/core'
  export let object: Group
  export let rotateSpeed = 1.0
  // $: if (object) {
    // console.log(object)
    // object.position.y = 10
    // // Calculate the direction vector towards (0, 0, 0)
    // const target = new Vector3(0, 0, 0)
    // const direction = target.clone().sub(object.position).normalize()
    // // Extract the forward direction from the object's current rotation matrix
    // const currentDirection = new Vector3(0, 1, 0)
    // currentDirection.applyQuaternion(object.quaternion)
    // // Calculate the axis and angle to rotate the object
    // const rotationAxis = currentDirection.clone().cross(direction).normalize()
    // const rotationAngle = Math.acos(currentDirection.dot(direction))
    // // Rotate the object using rotateOnAxis()
    // object.rotateOnAxis(rotationAxis, rotationAngle)
  // }
  // export let idealOffset = { x: -0.5, y: 2, z: -3 }
  export let idealOffset = { x: 0, y: 0, z: -5 }
  let isOrbiting = false
  let pointerDown = false
  const rotateStart = new Vector2()
  const rotateEnd = new Vector2()
  const rotateDelta = new Vector2()
  const { renderer, invalidate } = useThrelte()
  const domElement = renderer.domElement
  const camera = useParent()
  const dispatch = createEventDispatcher()
  const cameraControls = {
    theta: 0,
    phi: 0,
    radius: idealOffset.z,
  };
  const isCamera = (p: any): p is Camera => {
    return p.isCamera
  }
  if (!isCamera($camera)) {
    throw new Error('Parent missing: <PointerLockControls> need to be a child of a <Camera>')
  }
  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerleave', onPointerLeave);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('wheel', onWheel);
  onDestroy(() => {
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('pointerleave', onPointerLeave);
    domElement.removeEventListener('pointerup', onPointerUp);
  })
  // This is basically update function
  useFrame(() => {
    // the object's position is bound to the prop
    if (!object || !$camera) return
    const target = new Vector3().setFromSphericalCoords(
      idealOffset.z,
      Math.PI / 2 - cameraControls.phi,
      cameraControls.theta
    );

    // Update camera position
    $camera.position.copy(target.clone().add(object.position));

    // Update camera lookAt direction
    const lookAtDirection = target.clone().normalize().add(object.position);
    $camera.lookAt(lookAtDirection);
  });
  
  function onWheel(event: WheelEvent) {
    // console.log(event.deltaY);
    idealOffset.z -= Math.floor(event.deltaY / 12);
  }
  function onPointerMove(event: PointerEvent) {
    const { x, y } = event;
    if (pointerDown && !isOrbiting) {
      // calculate distance from init down
      const distCheck =
        Math.sqrt(Math.pow(x - rotateStart.x, 2) + Math.pow(y - rotateStart.y, 2)) > 10;
      if (distCheck) {
        isOrbiting = true;
      }
    }
    if (!isOrbiting) return;
    rotateEnd.set(x, y);
    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(rotateSpeed);
    rotateStart.copy(rotateEnd);
    cameraControls.theta -= rotateDelta.x * 0.01;
    cameraControls.phi -= rotateDelta.y * 0.01;

    // Clamp phi to avoid flipping
    cameraControls.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraControls.phi));
    invalidate('PointerLockcontrols: change event');
    dispatch('change');
  }
  function onPointerDown(event: PointerEvent) {
    const { x, y } = event;
    rotateStart.set(x, y);
    pointerDown = true;
  }
  function onPointerUp() {
    rotateDelta.set(0, 0);
    pointerDown = false;
    isOrbiting = false;
  }
  function onPointerLeave() {
    rotateDelta.set(0, 0);
    pointerDown = false;
    isOrbiting = false;
  }
</script>