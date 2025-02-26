import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Box3D } from "./components/Box";

function App() {
  return (
    <div className="h-screen w-full">
      <Canvas>
        <OrbitControls />
        <Box3D />
      </Canvas>
    </div>
  );
}

export default App;
