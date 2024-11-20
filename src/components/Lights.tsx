import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useLayoutEffect, useRef } from "react"
import { DirectionalLight, Vector3 } from "three"
import Config from "../Config"
import { roundTo } from "../utils/utils"
import { cameraDirection } from "./Camera"
import { store } from "../data/store"

const LIGHT_DIRECTION = new Vector3(1, .5, .4).normalize()

export default function Lights() {
    let { viewport, camera, scene } = useThree()
    let lightRef = useRef<DirectionalLight>(null)
    let updateShadowFrustum = useCallback((light: DirectionalLight) => {
        let buffer = 4
        let width = Math.max(viewport.width, 30) 

        light.target.position.copy(LIGHT_DIRECTION)

        // left - right
        light.shadow.camera.near = -width * .5 - buffer
        light.shadow.camera.far = width * .5 + buffer

        // top - bottom
        light.shadow.camera.left = -viewport.height * .5 - buffer
        light.shadow.camera.right = viewport.height * 1 + buffer

        // bottom left - top right diag
        light.shadow.camera.top = 15 + buffer
        light.shadow.camera.bottom = -15 - buffer

        light.shadow.camera.updateProjectionMatrix()
    }, [viewport])
    let updateShadowCameraPosition = useCallback((light: DirectionalLight) => {
        let x = camera.position.x - cameraDirection.x
        let z = camera.position.z - cameraDirection.z

        light.position.x = roundTo(x, 0)
        light.position.z = roundTo(z, 0)

        light.target.position.x = light.position.x - LIGHT_DIRECTION.x
        light.target.position.z = light.position.z - LIGHT_DIRECTION.z
    }, [camera])

    useLayoutEffect(() => {
        if (lightRef.current) {
            scene.add(lightRef.current.target)
        }
    }, [])

    useLayoutEffect(() => {
        let resize = () => {
            if (lightRef.current) {
                updateShadowFrustum(lightRef.current)
                updateShadowCameraPosition(lightRef.current)
            }
        }

        window.addEventListener("resize", resize)
        resize()

        return () => {
            window.removeEventListener("resize", resize) 
        } 
    }, [])

    useLayoutEffect(() => {
        if (lightRef.current) {
            updateShadowCameraPosition(lightRef.current)
        }
    }, [updateShadowCameraPosition])

    useFrame(() => {
        let { panning } = store.getState()

        if (panning && lightRef.current) {
            updateShadowCameraPosition(lightRef.current)
        }
    }) 

    return (
        <>
            {Config.DEBUG && ( 
                <axesHelper position={[0, 3, 0]} scale={5} /> 
            )} 

            <directionalLight
                position={[
                    -LIGHT_DIRECTION.x,
                    LIGHT_DIRECTION.y * .25,
                    -LIGHT_DIRECTION.z
                ]}
                intensity={.7}
                color={"white"}
            />

            <directionalLight
                color={"#fff"}
                intensity={1.5}
                castShadow
                onUpdate={updateShadowFrustum}
                ref={lightRef} 
                shadow-radius={2.25}
                shadow-mapSize={[512, 512]}
                shadow-bias={-0.003}
            />

            <ambientLight intensity={.4} color="#fff" />
        </>
    )
}