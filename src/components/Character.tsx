import { Box, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { FunctionComponent, useRef } from "react";
import { Quaternion, Vector3 } from "three";

export const Character: FunctionComponent<{
  speed?: number;
  angularSpeed?: number;
}> = ({ speed = 500, angularSpeed = 100 }) => {
  const rb = useRef<RapierRigidBody>(null);
  const [, get] = useKeyboardControls();

  const moveDir = useRef(new Vector3());
  const forwardDir = useRef(new Vector3());
  const rotationQuat = useRef(new Quaternion());

  useFrame((_, delta) => {
    if (rb.current) {
      const linVel = rb.current.linvel();
      const rotation = rb.current.rotation();

      const { forward, backward, left, right } = get();

      const { x: rX, y: rY, z: rZ, w } = rotation;
      rotationQuat.current.set(rX, rY, rZ, w);
      forwardDir.current
        .set(0, 0, 1)
        .applyQuaternion(rotationQuat.current)
        .normalize();

      moveDir.current.set(0, 0, 0);

      // move
      if (forward) moveDir.current.add(forwardDir.current);
      if (backward) moveDir.current.sub(forwardDir.current);

      moveDir.current.normalize().multiplyScalar(speed * delta);
      const { x, z } = moveDir.current;
      rb.current.setLinvel({ x, y: linVel.y, z }, true);

      // rotate
      let turnVelocity = 0;
      if (left) turnVelocity += angularSpeed * delta;
      if (right) turnVelocity -= angularSpeed * delta;
      rb.current.setAngvel({ x: 0, y: turnVelocity, z: 0 }, true);
    }
  });

  return (
    <RigidBody ref={rb} type="dynamic">
      <Box>
        <axesHelper scale={2} />
      </Box>
    </RigidBody>
  );
};
