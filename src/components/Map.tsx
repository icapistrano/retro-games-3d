import { Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { FunctionComponent } from "react";

export const Map: FunctionComponent = () => {
  return (
    <RigidBody type="fixed">
      <Box args={[10, 0.1, 10]}>
        <meshBasicMaterial color="green" />
      </Box>
    </RigidBody>
  );
};
