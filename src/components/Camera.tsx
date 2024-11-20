import { invalidate, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo } from "react"
import { setPanning, State, store, useStore } from "../data/store"
import { clamp, ndelta } from "../utils/utils"
import { Vector3 } from "three" 
import useAnimationFrame from "use-animation-frame"
import { damp } from "three/src/math/MathUtils.js"

export const cameraDirection = new Vector3(20, 20, -20)

export default function Camera() {
    const { camera } = useThree()
    const state = useStore(i => i.state)
    const stage = useStore(i => i.stage)
    const panning = useStore(i => i.panning)
    const targetPosition = useMemo(() => new Vector3(), [])

    useEffect(() => {
        document.body.style.cursor = panning ? "grabbing" : ""
    }, [panning])

    useLayoutEffect(() => {
        camera.position.copy(cameraDirection)
        targetPosition.copy(cameraDirection)
        camera.lookAt(0, 0, 0)
    }, [camera])

    useLayoutEffect(() => {
        let onResize = () => {
            let zoom = clamp((window.innerWidth - 450) / 600, 0, 1)

            camera.zoom = zoom * 25 + 32
            camera.updateProjectionMatrix()
        }

        window.addEventListener("resize", onResize)
        onResize()

        return () => {
            window.removeEventListener("resize", onResize)
        }
    }, [camera])

    useEffect(() => {
        if (state !== State.PLAYING) {
            return
        }

        let panPossible = false
        let start = new Vector3()
        let previousDirection = new Vector3()
        let direction = new Vector3()
        let destroy = () => {
            panPossible = false
            setPanning(false)
        }
        let initalize = (clientX: number, clientY: number) => {
            setPanning(true)
            start.set(clientX, 0, clientY)
            previousDirection.copy(start)
        }
        let updateTargetPosition = (clientX: number, clientY: number, scale: number) => {
            direction.set(clientX, 0, clientY)
                .sub(previousDirection)
                .applyQuaternion(camera.quaternion)

            previousDirection.set(clientX, 0, clientY)

            targetPosition.x += direction.x * -scale
            targetPosition.z += direction.z * -scale
        }
        let contextmenu = (e: Event) => {
            e.preventDefault()
            panPossible = true
        }
        let keydown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                panPossible = true
            }
        }
        let mousemove = ({ clientX, clientY, pointerType }: PointerEvent) => {
            let { panning } = store.getState()
            let scale = pointerType === "mouse" ? .025 : .065

            if (panning) {
                updateTargetPosition(clientX, clientY, scale)
            }
        }
        let mousedown = ({ clientX, clientY, target, button }: PointerEvent) => {
            if ((target as Element).classList.contains("panner") || panPossible || button === 2) {
                setPanning(true)
                initalize(clientX, clientY)
            }
        }

        window.addEventListener("pointerdown", mousedown)
        window.addEventListener("pointermove", mousemove)
        window.addEventListener("pointerup", destroy)
        window.addEventListener("pointercancel", destroy)
        window.addEventListener("contextmenu", contextmenu)
        window.addEventListener("keydown", keydown)
        window.addEventListener("keyup", destroy)

        return () => {
            window.removeEventListener("pointerdown", mousedown)
            window.removeEventListener("pointermove", mousemove)
            window.removeEventListener("pointerup", destroy)
            window.removeEventListener("pointercancel", destroy)
            window.removeEventListener("contextmenu", contextmenu)
            window.removeEventListener("keydown", keydown)
            window.removeEventListener("keyup", destroy)
        }
    }, [state])

    useEffect(() => {
        let { cameraStart, center } = stage.settings

        camera.position
            .setComponent(0, cameraStart[0] + cameraDirection.x)
            .setComponent(2, cameraStart[2] + cameraDirection.z)
        targetPosition
            .setComponent(0, center[0] + cameraDirection.x)
            .setComponent(2, center[2] + cameraDirection.z)
    }, [stage])

    useAnimationFrame(({ delta }) => {
        let lambda = panning ? 5.5 : 1.5
        let { boundingRadius } = stage.settings

        if (camera.position.length() > boundingRadius && !panning) {
            targetPosition.copy(camera.position)
                .normalize()
                .multiplyScalar(boundingRadius * .5)
        }

        camera.position.x = damp(camera.position.x, targetPosition.x, lambda, ndelta(delta))
        camera.position.z = damp(camera.position.z, targetPosition.z, lambda, ndelta(delta))

        if (camera.position.distanceTo(targetPosition) > .01) {
            invalidate()
        }
    })

    return null
}