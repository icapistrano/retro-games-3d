import {
  Environment,
  KeyboardControls,
  OrbitControls,
  PerspectiveCamera,
  Sky,
  SpotLight,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Character } from "./components/Character";
import { Map } from "./components/Map";
import { Physics } from "@react-three/rapier";
import { ThirdPersonCamera } from "./components/ThirdPersonCamera";
import Grass from "./components/Grass";
import { Color } from "three";
import { Soldier } from "./components/Soldier";

function App() {
  return (
    <div className="h-screen w-full">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
        ]}
      >
        <Canvas
          shadows
          onCreated={(state) => {
            // Set the scene background to black
            state.scene.background = new Color(0x000000);
          }}
        >
          <ambientLight intensity={0.4} />
          <Grass />
          <PerspectiveCamera makeDefault position={[-7, 7, -7]} />
          <ThirdPersonCamera />
          <OrbitControls zoomToCursor />
          <Physics debug>
            <Map />
            <Character />
            <Soldier position={[0, 1, 10]} />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
