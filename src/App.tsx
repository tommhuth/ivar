import { cameraDirection } from "./components/Camera"
import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { VSMShadowMap } from "three"
import Config from "./Config"
import UI from "./ui/UI"
import Ivar from "./Ivar"
import { tunnel } from "./tunnel" 

export default function App() {
    return (
        <>
            <UI />
            <tunnel.Out />

            <Canvas
                gl={{
                    antialias: true,
                    depth: true,
                    stencil: false,
                    alpha: true,
                    powerPreference: "high-performance"
                }}
                style={{ 
                    left: 0,
                    top: 0, 
                    zIndex: 1,
                    position: "fixed",
                }}
                orthographic
                frameloop="demand"
                shadows={{
                    type: VSMShadowMap,
                }}
                camera={{
                    zoom: 30,
                    near: 0.01,
                    far: 175,
                    position: cameraDirection
                }}
                dpr={[1, window.devicePixelRatio * .75]}
            >
                <Suspense fallback={null}>
                    <Ivar />
                </Suspense>

                {Config.DEBUG && (
                    <axesHelper scale={6} position={[0, .1, 0]} />
                )}
            </Canvas>
        </>
    )
}