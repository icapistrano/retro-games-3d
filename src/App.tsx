import {
  Environment,
  KeyboardControls,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Character } from "./components/Character";
import { Map } from "./components/Map";
import { Physics } from "@react-three/rapier";
import { ThirdPersonCamera } from "./components/ThirdPersonCamera";
import Grass from "./components/Grass";

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
        <Canvas>
          <Environment preset="forest" />
          <Grass />

          {/* <PerspectiveCamera makeDefault position={[-7, 7, -7]} /> */}
          <ThirdPersonCamera />
          <OrbitControls />
          <Physics debug>
            <Map />
            <Character />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
