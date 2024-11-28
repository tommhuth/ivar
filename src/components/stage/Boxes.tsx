import { Vec3, Box as BoxShape, Quaternion } from "cannon-es"
import { useEffect, useMemo, useState } from "react"
import { score, useStore } from "../../data/store"
import { Body, CollisionEvent, useInstancedBody } from "../../utils/cannon"
import { setMatrixAt } from "../../utils/utils"
import { useInstance } from "../InstancedMesh"
import random from "@huth/random"
import animate from "@huth/animate"
import { invalidate, useFrame } from "@react-three/fiber"
import { ObjectType } from "../../data/stages"
import { easeOutElastic, easeOutQuart } from "../../utils/easing"
import { Tuple3 } from "../../types/global" 
import ScoreMessage from "../../ui/ScoreMessage"

interface BoxProps {
    size: Tuple3
    rotation: Tuple3
    position: Tuple3
    index: number
    dead: boolean
    id: string
} 

function Box({
    size = [1, 1, 1],
    dead,
    id,
    index: boxIndex,
    rotation = [0, 0, 0],
    position = [0, 0, 0]
}: BoxProps) {
    let [index, instance] = useInstance(ObjectType.BOX)
    let [ready, setReady] = useState(false)
    let definition = useMemo(() => {
        return new BoxShape(new Vec3(size[0] / 2, size[1] / 2, size[2] / 2))
    }, [])
    let startPosition = useMemo(() => [
        position[0],
        position[1] + size[1] / 2 + .35,
        position[2]
    ] as Tuple3, position)
    let [body] = useInstancedBody({
        definition,
        position: startPosition,
        mass: size[0] * size[1] * size[2],
        rotation,
        instance,
        scale: size,
        index,
        ready: ready && !dead,
        userData: { type: ObjectType.BOX, isDead: false }
    })
    let stage = useStore(i => i.stage)

    useEffect(() => {
        if (!dead) {
            let onCollide = (e: CollisionEvent) => {
                let target = [e.target, e.body].find(i => i.userData.type === ObjectType.GROUND)

                if (target && !body.userData.isDead) {
                    body.userData.isDead = true
                    score(id)
                }
            }

            body.addEventListener(Body.COLLIDE_EVENT_NAME, onCollide)

            return () => {
                body.removeEventListener(Body.COLLIDE_EVENT_NAME, onCollide)
            }
        }
    }, [dead])

    useEffect(() => {
        if (dead && typeof index === "number") {
            const targetY = random.integer(4, 6)
            const rot = new Quaternion().setFromEuler(0, 0, 0)

            return animate({
                from: {
                    y: 0,
                    scale: 1,
                    rx: body.quaternion.x,
                    ry: body.quaternion.y,
                    rz: body.quaternion.z,
                    rw: body.quaternion.w
                },
                to: { y: targetY, scale: 0, rx: rot.x, ry: rot.y, rz: rot.z, rw: rot.w },
                duration: 900,
                render({ y, scale, rx, ry, rz, rw }) {
                    invalidate()
                    setMatrixAt({
                        instance,
                        index: index as number,
                        position: [
                            body.position.x,
                            body.position.y + easeOutQuart(y / targetY) * targetY,
                            body.position.z
                        ],
                        scale: size.map(i => i * easeOutElastic(scale / 1)) as Tuple3,
                        rotation: [rx, ry, rz, rw]
                    })
                },
            })
        }
    }, [dead])

    useFrame(() => {
        if (stage.settings.exitY && body.position.y < stage.settings.exitY && !dead) {
            score(id)
        }
    })

    useEffect(() => {
        if (index && instance) {
            return animate({
                from: 0,
                to: 1,
                easing: easeOutElastic,
                duration: 800,
                delay: boxIndex * 75,
                end() {
                    setReady(true)
                },
                render(scale) {
                    setMatrixAt({
                        instance,
                        index: index as number,
                        position: startPosition,
                        rotation,
                        scale: size.map(i => i * scale) as Tuple3
                    })
                }
            })
        }
    }, [index, instance])


    if (!dead) {
        return null
    }

    return (
        <ScoreMessage id={body.id} position={body.position} />
    )
}

export default function Boxes() {
    let boxes = useStore(i => i.boxes)

    return (
        <>
            {boxes.map((i, index) => {
                return <Box key={i.id} {...i} index={index} />
            })}
        </>
    )
}