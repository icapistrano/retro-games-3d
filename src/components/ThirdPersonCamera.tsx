import { FunctionComponent, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useCharacterStore } from "../stores/characterStore";
import { Quaternion, Vector3 } from "three";

export const ThirdPersonCamera: FunctionComponent = () => {
  const aspect = useThree((state) => state.size);
  const { characterPosition, characterRotation } = useCharacterStore();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const cameraPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());

  const characterPositionV = useRef(new Vector3());
  const characterRotationQuat = useRef(new Quaternion());

  const idealOffset = useRef(new Vector3(0, 5, -4));
  const idealLookat = useRef(new Vector3(0, 0, 2));

  const _v = useRef(new Vector3());

  useFrame((_, delta) => {
    if (!cameraRef.current) return;

    const position = characterPositionV.current.fromArray(characterPosition);
    const rotation = characterRotationQuat.current.fromArray(characterRotation);

    // lerp
    _v.current
      .copy(idealOffset.current)
      .applyQuaternion(rotation)
      .add(position);
    cameraPosition.current.lerp(_v.current, delta);
    cameraRef.current.position.copy(cameraPosition.current);

    _v.current
      .copy(idealLookat.current)
      .applyQuaternion(rotation)
      .add(position);
    cameraLookAt.current.lerp(_v.current, 0);
    cameraRef.current.lookAt(cameraLookAt.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault // Ensures this is the main camera
      fov={75} // Field of view
      aspect={aspect.width / aspect.height}
      near={0.1} // Near clipping plane
      far={1000} // Far clipping plane
    />
  );
};
