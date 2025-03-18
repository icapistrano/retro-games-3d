import * as THREE from "three";
import { useMemo, useRef } from "react";
import { InstancedMesh, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useCharacterStore } from "../stores/characterStore";

interface GrassProps {
  count?: number;
  spacing?: number;
  bladeHeight?: number;

  minHeight?: number;
  maxHeight?: number;
}

export default function Grass({
  spacing = 0.1,
  bladeHeight = 0.8,
  minHeight = 0.4,
}: GrassProps) {
  const width = 500;
  const height = 500;

  const meshRef = useRef<InstancedMesh>(null);

  const characterPosition = useCharacterStore(
    (store) => store.characterPosition,
  );

  // Generate random positions and rotations
  const instanceData = useMemo(() => {
    const jitterAmount = spacing * 0.5; // Maximum random shift within cell

    const positions: number[] = [];
    const rotations: number[] = [];
    const heights: number[] = [];
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const xRandom = Math.random() - 0.5 * jitterAmount;
        const yRandom = Math.random() - 0.5 * jitterAmount;

        const randomHeight =
          Math.random() * (bladeHeight - minHeight) + minHeight;
        heights.push(randomHeight); // Store the random height

        const x = (col - (width - 1) / 2) * spacing + xRandom; // Center X
        const z = (row - (height - 1) / 2) * spacing + yRandom; // Center Z
        positions.push(x, randomHeight / 2, z);

        const randomRotation = Math.random() * Math.PI * 2; // Range from 0 to 2 * PI
        rotations.push(randomRotation);
      }
    }

    return {
      positions: new Float32Array(positions),
      rotations: new Float32Array(rotations),
      heights: new Float32Array(heights),
    };
  }, []);

  // Create grass blade geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.05, bladeHeight, 1, 10);
    geo.computeVertexNormals();

    geo.setAttribute(
      "instanceOffset",
      new THREE.InstancedBufferAttribute(instanceData.positions, 3),
    );

    geo.setAttribute(
      "instanceRotation",
      new THREE.InstancedBufferAttribute(instanceData.rotations, 1),
    );

    geo.setAttribute(
      "instanceHeight",
      new THREE.InstancedBufferAttribute(instanceData.heights, 1),
    );

    return geo;
  }, [instanceData]);

  const uniformsRef = useRef({
    baseBladeHeight: { value: bladeHeight },
    characterPosition: { value: new Vector3() },
    time: { value: 0 },
  });

  // Custom shader material with local tapering and gradient coloring
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      attribute vec3 instanceOffset;
      attribute float instanceRotation;
      attribute float instanceHeight;
      
      uniform float baseBladeHeight;
      uniform float time;
      uniform vec3 characterPosition;
      
      varying float vInstanceHeight;
      varying float vBladePositionY;
      
      mat3 getYRotationMatrix(float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return mat3(
              c,  0.0, s,
              0.0, 1.0, 0.0,
             -s,  0.0, c
          );
      }
      
      void main() {
          vInstanceHeight = instanceHeight;
      
          vec3 modifiedPosition = position;
      
          // Apply local height scaling
          modifiedPosition.y *= instanceHeight;
      
          // Taper to create triangle mesh
          float taper = 1.0 - modifiedPosition.y / (instanceHeight / 2.0);
          modifiedPosition.x *= taper;
          modifiedPosition.z *= taper;
      
          // Convert instance position to world space
          vec3 worldBladePos = instanceOffset;
      
          // 🏃‍♂️ Character Interaction: Compute Push Direction 🏃‍♂️
          float distToCharacter = length(worldBladePos.xz - characterPosition.xz);
          float interactionRadius = 1.0; // Radius of influence
          float pushStrength = 0.5;      // Strength of the effect
          float pushEffect = smoothstep(interactionRadius, 0.0, distToCharacter); // Smooth falloff
      
          // Compute push direction in world space (grass moves away)
          vec2 pushDirection = normalize(worldBladePos.xz - characterPosition.xz);
      
          // Convert push direction to local space using inverse rotation
          float cosRot = cos(-instanceRotation);
          float sinRot = sin(-instanceRotation);
          vec2 localPushDirection = vec2(
              cosRot * pushDirection.x - sinRot * pushDirection.y,
              sinRot * pushDirection.x + cosRot * pushDirection.y
          );
      
          // 🌿 Fix Stretching: Apply bending **only to the top**
          float bendFactor = smoothstep(0.0, 1.0, modifiedPosition.y / instanceHeight); // Gradual effect
          modifiedPosition.xz += localPushDirection * pushStrength * pushEffect * bendFactor;
      
          // 🌬️ Wind Effect
          float windSpeed = 0.4;
          float windStrength = 0.2;
          float normalizedHeight = modifiedPosition.y / baseBladeHeight;
          float smoothBend = smoothstep(0.0, 1.0, normalizedHeight);
          float bendAmount = sin(instanceHeight * time * windSpeed + instanceOffset.y * 0.5) * windStrength * smoothBend;
          modifiedPosition.z += bendAmount * 2.0;
      
          // Apply rotation using rotation matrix
          modifiedPosition = getYRotationMatrix(instanceRotation) * modifiedPosition;
      
          // Apply instance position offset
          modifiedPosition += instanceOffset;
      
          vBladePositionY = modifiedPosition.y;
      
          gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
      
      
        }
      `,
      fragmentShader: `
        uniform float baseBladeHeight;
        varying float vInstanceHeight;
        varying float vBladePositionY;

        void main() {
          // Calculate the color based on the height of the blade
          float normalizedHeight = (vBladePositionY - 0.0) / 1.0; // Change 1.0 to maxHeight if necessary

          // Define color gradients for the bottom (darker) and top (lighter) of the blade
          vec3 bottomColor = vec3(0.11, 0.2, 0.12); // Dark green at the bottom
          vec3 topColor = vec3(0.51, 0.78, 0.52); // Light green at the top
      
          // Interpolate between bottom and top colors based on the normalized y position
          vec3 color = mix(bottomColor, topColor, normalizedHeight);
      
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      uniforms: uniformsRef.current,
    });
  }, [bladeHeight]);

  useFrame(({ clock }) => {
    uniformsRef.current.time.value = clock.elapsedTime;
    uniformsRef.current.characterPosition.value.fromArray(characterPosition);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, width * height]}
      frustumCulled={false}
      // position={[0, 1, 0]}
    />
  );
}
