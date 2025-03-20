import { Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { FunctionComponent } from "react";

export const Map: FunctionComponent = () => {
  return (
    <RigidBody type="fixed">
      <Box args={[50, 0.1, 50]} receiveShadow>
        <meshStandardMaterial
          color="#3f3030"
          transparent
          opacity={1}

          // roughness={0}
        />
      </Box>
    </RigidBody>
  );
};
