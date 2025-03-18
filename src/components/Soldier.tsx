import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Vector3, Mesh, MathUtils, Quaternion } from "three";
import { useCharacterStore } from "../stores/characterStore";
import { SoldierVision } from "./SoldierVision";

export enum SoldierBehaviour {
  Patrol = "patrol",
  Chase = "chase",
  Investigate = "investigate",
}

export const Soldier: FunctionComponent<{
  position: [number, number, number];
  fov?: number;
  detectionRange?: number;
  patrolSpeed?: number;
  chaseSpeed?: number;
  investigateTime?: number;
}> = ({
  position,
  fov = 45,
  detectionRange = 4,
  patrolSpeed = 1,
  chaseSpeed = 5,
  investigateTime = 43000,
}) => {
  const charPos = useRef(new Vector3());
  const { characterPosition } = useCharacterStore();

  const [behaviour, setBehaviour] = useState<SoldierBehaviour>(
    SoldierBehaviour.Investigate,
  );

  const soldierRef = useRef<Mesh>(null);

  const generatePoints = useCallback(
    (origin: Vector3, xOffset: number, zOffset: number) => {
      const numPoints = 120;
      const points: Vector3[] = [];
      const angleStep = (Math.PI * 2) / numPoints;
      for (let i = 0; i < numPoints; i++) {
        const x = xOffset * Math.sin(i * angleStep);
        const z = zOffset * Math.cos(i * angleStep);
        points.push(new Vector3(x, 0, z).add(origin));
      }
      return points;
    },
    [],
  );

  const path = useMemo(
    () => generatePoints(new Vector3().fromArray(position), 3, 3),
    [position],
  );

  const waypointRef = useRef(0);
  const dir = useRef(new Vector3());
  const currentQuat = useRef(new Quaternion());

  const updatePosition = (delta: number) => {
    if (!soldierRef.current) return;

    charPos.current.fromArray(characterPosition);

    if (behaviour === SoldierBehaviour.Patrol) {
      const targetPos = path[waypointRef.current];

      const direction = dir.current
        .subVectors(targetPos, soldierRef.current.position)
        .normalize();

      const moveSpeed =
        Math.max(0.01, patrolSpeed * delta) / direction.length();

      soldierRef.current.position.addScaledVector(direction, moveSpeed);
      soldierRef.current.lookAt(targetPos);

      currentQuat.current.slerp(
        soldierRef.current.quaternion,
        patrolSpeed * delta,
      );

      soldierRef.current.position.lerp(targetPos, patrolSpeed * delta);
      soldierRef.current.quaternion.copy(currentQuat.current);

      // Check if we are close enough to switch to the next waypoint
      if (soldierRef.current.position.distanceTo(targetPos) < 0.1) {
        waypointRef.current = (waypointRef.current + 1) % path.length;
      }

      return;
    }

    // check if soldier and character is close enough
    // console.log(charPos.current.distanceTo(soldierRef.current.position));

    const speed =
      behaviour === SoldierBehaviour.Chase ? chaseSpeed : patrolSpeed;

    const direction = dir.current
      .subVectors(charPos.current, soldierRef.current.position)
      .normalize();

    const velocity = direction.multiplyScalar(speed * delta);
    soldierRef.current.position.addScaledVector(velocity, 1);

    soldierRef.current.lookAt(charPos.current);
  };

  const lerp = (current: number, target: number, t: number) => {
    return current + (target - current) * t;
  };

  const fovRef = useRef(fov);
  const detectionRangeRef = useRef(detectionRange);
  const updateVision = (delta: number) => {
    const _fov = behaviour === SoldierBehaviour.Patrol ? fov : fov * 1.5;
    const _range =
      behaviour === SoldierBehaviour.Patrol
        ? detectionRange
        : detectionRange * 1.5;

    fovRef.current = lerp(fovRef.current, _fov, delta);
    detectionRangeRef.current = lerp(detectionRangeRef.current, _range, 0.5);
  };

  useEffect(() => {
    let timeoutId: number | undefined;
    if (behaviour === SoldierBehaviour.Investigate) {
      timeoutId = setTimeout(() => {
        if (behaviour === SoldierBehaviour.Investigate) {
          setBehaviour(SoldierBehaviour.Patrol);
        }
      }, investigateTime);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [behaviour]);

  useFrame((_, delta) => {
    if (!soldierRef.current) return;

    console.log(behaviour);

    charPos.current.fromArray(characterPosition);
    updatePosition(delta);
    updateVision(delta);
  });

  return (
    <group>
      {/* AVATAR */}
      <mesh ref={soldierRef} position={position} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color="red" transparent opacity={0.1} />
        <axesHelper />
      </mesh>

      {/* CONE */}
      <SoldierVision
        characterPosition={charPos.current}
        fov={MathUtils.degToRad(fovRef.current)}
        detectionRange={detectionRangeRef.current}
        soldier={soldierRef.current}
        behaviour={behaviour}
        setIsDetected={(isDetected) => {
          if (isDetected) {
            setBehaviour(SoldierBehaviour.Chase);
            return;
          }

          if (behaviour === SoldierBehaviour.Chase) {
            setBehaviour(SoldierBehaviour.Investigate);
          }
        }}
      />

      {/* DEBUGGING */}
      {path.length >= 2 && <Line points={path} />}
    </group>
  );
};
