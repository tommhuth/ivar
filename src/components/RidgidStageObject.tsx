import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Group, Vector3 } from "three"
import { Body } from "../utils/cannon"
import { useOrientationObserver } from "../utils/hooks" 
import ScoreMessage from "../ui/ScoreMessage"

export default function RidgidStageObject({ body }: { body: Body }) {
    let ref = useRef<Group>(null)
    let dead = useOrientationObserver(body)

    useFrame(() => {
        if (ref.current && !dead) {
            ref.current.position.copy(body.position as unknown as Vector3)
        }
    })

    if (!dead) {
        return null
    }

    return (
        <ScoreMessage position={body.position} score={-750}/> 
    )  
}