import { Box, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { FunctionComponent, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { useCharacterStore } from "../stores/characterStore";
import { Animation, Avatar } from "./Avatar";

export const Character: FunctionComponent<{
  runningSpeed?: number;
  walkingSpeed?: number;
  angularSpeed?: number;
}> = ({ runningSpeed = 150, walkingSpeed = 100, angularSpeed = 200 }) => {
  const [animation, setAnimation] = useState<Animation>("Idle");

  const setCharacterPosition = useCharacterStore(
    (state) => state.setCharacterPosition,
  );

  const setCharacterRotation = useCharacterStore(
    (state) => state.setCharacterRotation,
  );

  const rb = useRef<RapierRigidBody>(null);
  const [, get] = useKeyboardControls();

  const moveDir = useRef(new Vector3());
  const forwardDir = useRef(new Vector3());
  const leftDir = useRef(new Vector3());
  const rotationQuat = useRef(new Quaternion());

  useFrame((_, delta) => {
    if (rb.current) {
      const prevRotation = rb.current.rotation();

      const { forward, backward, left, right } = get();

      const { x: rX, y: rY, z: rZ, w } = prevRotation;
      rotationQuat.current.set(rX, rY, rZ, w);
      forwardDir.current
        .set(0, 0, 1)
        .applyQuaternion(rotationQuat.current)
        .normalize();

      leftDir.current
        .set(1, 0, 0)
        .applyQuaternion(rotationQuat.current)
        .normalize();

      moveDir.current.set(0, 0, 0);
      let turnVelocity = 0;

      if (forward || backward) {
        setAnimation("Running");

        if (forward) moveDir.current.add(forwardDir.current);
        if (backward) moveDir.current.sub(forwardDir.current);
        moveDir.current.normalize().multiplyScalar(runningSpeed * delta);

        if (left) turnVelocity += angularSpeed * delta;
        if (right) turnVelocity -= angularSpeed * delta;
      } else if (left) {
        setAnimation("WalkingLeft");
        moveDir.current.add(leftDir.current);
      } else if (right) {
        setAnimation("WalkingRight");
        moveDir.current.sub(leftDir.current);
      } else {
        setAnimation("Idle");
      }

      const { x, y, z } = moveDir.current;
      rb.current.setLinvel({ x, y, z }, true);
      setCharacterPosition([x, y, z]);

      rb.current.setAngvel({ x: 0, y: turnVelocity, z: 0 }, true);
      const rotation = rb.current.rotation();
      setCharacterRotation([rotation.x, rotation.y, rotation.z, rotation.w]);
    }
  });

  return (
    <RigidBody
      ref={rb}
      position={[0, 1, 0]}
      colliders={false}
      enabledRotations={[false, true, false]} // Lock rotation on X and Z
    >
      <Avatar animation={animation} />
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
    </RigidBody>
  );
};
