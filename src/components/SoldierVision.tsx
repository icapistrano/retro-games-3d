import { useFrame } from "@react-three/fiber";
import { FunctionComponent, useMemo, useRef, useState } from "react";
import {
  Vector3,
  Mesh,
  Group,
  SpotLight as SpotLightType,
  Object3D,
} from "three";
import { SpotLight, Line, Box } from "@react-three/drei";
import { SoldierBehaviour } from "./Soldier";

const up = new Vector3(0, 1, 0);

export const SoldierVision: FunctionComponent<{
  fov: number;
  detectionRange: number;
  soldier: Mesh | Group | null;
  characterPosition: Vector3;
  amplitude?: number;
  oscillationSpeed?: number;
  behaviour: SoldierBehaviour;
  setIsDetected: (isDetected: boolean) => void;
}> = ({
  fov,
  detectionRange,
  soldier,
  characterPosition,
  amplitude = 1,
  oscillationSpeed = 0.7,
  behaviour,
  setIsDetected,
}) => {
  const [fovColor, setFovColor] = useState("blue");
  const origin: [number, number, number] = [0, 0, 0];
  const halfAngle = fov / 2;

  // Generate the segment of the circle for the FOV
  const points = useMemo(() => {
    const numPoints = 32;
    const circlePoints: [number, number, number][] = [];
    const angleStep = (fov / numPoints) * (Math.PI / 180); // Convert to radians

    for (let i = -halfAngle; i <= halfAngle; i += angleStep) {
      const x = detectionRange * Math.sin(i);
      const z = detectionRange * Math.cos(i);
      circlePoints.push([x, 0, z]);
    }

    return circlePoints;
  }, [fov, detectionRange]);

  const xAxis = useRef(new Vector3());
  const lookAtPos = useRef(new Vector3());
  const soldierDir = useRef(new Vector3());
  const coneRef = useRef<Group>(null);

  const soldierPosition = useRef(new Vector3());

  const boxRef = useRef<Mesh>(null);
  const updateSoldierVision = (elapsedTime: number) => {
    if (!soldier || !coneRef.current) return;

    soldierPosition.current.copy(soldier.position);

    soldier.getWorldDirection(soldierDir.current);
    lookAtPos.current.copy(soldier.position).add(soldierDir.current);

    if (behaviour === SoldierBehaviour.Patrol) {
      // Get soldier's right direction (X-axis in local space)
      xAxis.current.crossVectors(soldierDir.current, up).normalize();

      // Compute oscillation offset along the right direction
      const oscillationOffset = xAxis.current.multiplyScalar(
        Math.sin(elapsedTime * oscillationSpeed) * amplitude,
      );

      lookAtPos.current.add(oscillationOffset).multiplyScalar(1.5);
    }

    coneRef.current.position.copy(soldier.position);
    coneRef.current.lookAt(lookAtPos.current);
  };

  const coneDir = useRef(new Vector3());
  const lookAtDir = useRef(new Vector3());
  const detectPlayer = () => {
    if (!soldier || !coneRef.current) return false;

    // check if within distance
    const distance = soldier.position.distanceTo(characterPosition);
    if (distance > detectionRange) {
      return false;
    }

    coneDir.current.subVectors(lookAtPos.current, soldier.position);
    lookAtDir.current.subVectors(characterPosition, soldier.position);

    const radians = coneDir.current.angleTo(lookAtDir.current);

    return radians <= fov / 2;
  };

  const obj = useRef(new Object3D());
  const spotLightRef = useRef<SpotLightType>(null);

  useFrame((root) => {
    updateSoldierVision(root.clock.elapsedTime);
    const isPlayerDetected = detectPlayer();

    setIsDetected(isPlayerDetected);
    setFovColor(isPlayerDetected ? "red" : "blue");

    // update spotlight
    if (spotLightRef.current) {
      spotLightRef.current.position.copy(soldierPosition.current);
      spotLightRef.current.target.position.copy(lookAtPos.current); // Ensure the spotlight targets the same direction
    }
  });

  return (
    <group>
      <SpotLight
        ref={spotLightRef}
        target={obj.current}
        distance={detectionRange}
        intensity={20}
        decay={0}
        angle={fov / 2}
      />
      <group ref={coneRef} position={[0, 1, 0]} visible={false}>
        <Line points={points} color={fovColor} lineWidth={5} />
        <Line
          points={[
            origin,
            [
              Math.sin(-halfAngle) * detectionRange,
              0,
              Math.cos(-halfAngle) * detectionRange,
            ],
          ]}
          color={fovColor}
          lineWidth={5}
        />
        <Line
          points={[
            origin,
            [
              Math.sin(halfAngle) * detectionRange,
              0,
              Math.cos(halfAngle) * detectionRange,
            ],
          ]}
          color={fovColor}
          lineWidth={5}
        />
      </group>
    </group>
  );
};
