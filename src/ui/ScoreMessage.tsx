import { Camera, useFrame, useThree } from "@react-three/fiber"
import { Vec3 } from "cannon-es"
import { useMemo, useRef } from "react"
import { Tuple2, Tuple3 } from "src/types.global"
import { Vector2, Vector3 } from "three"
import { tunnel } from "../tunnel"

import "./ScoreMessage.scss"
import { clamp } from "../utils/utils"

let _vec3 = new Vector3()

function worldToScreen(position: Tuple3, camera: Camera): Tuple2 {
    // thanks chattyman
    // Project the position into NDC
    let ndc = _vec3.set(...position).project(camera)

    // Convert NDC to screen coordinates
    const screenX = (ndc.x + 1) / 2 * window.innerWidth
    const screenY = (1 - ndc.y) / 2 * window.innerHeight // Flip y-axis for screen space

    return [screenX, screenY]
}


function useWorldToScreen(position: Vector3 | Vec3) {
    let screenPosition = useMemo(() => new Vector2(), [])
    let { camera } = useThree()

    useFrame(() => {
        screenPosition.set(...worldToScreen(position.toArray(), camera))
    })

    return screenPosition
}

export default function ScoreMessage({ id, position, score = 100 }: { id: string | number; score?: number; position: Vec3 | Vector3 }) {
    let screenPosition = useWorldToScreen(position)
    let messageRef = useRef<HTMLDivElement>(null)

    useFrame(() => {
        messageRef.current?.style.setProperty("--x", clamp(screenPosition.x, 0, window.innerWidth).toFixed(1) + "px")
        messageRef.current?.style.setProperty("--y", clamp(screenPosition.y, 0, window.innerHeight).toFixed(1) + "px")
    })

    return (
        <tunnel.In>
            <div
                ref={messageRef}
                className="score-message"
                key={id}
            >
                {Math.sign(score) === 1 ? "+" : "−"}{Math.abs(score)}
            </div>
        </tunnel.In>
    )
}