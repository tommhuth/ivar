import { Body, Box, GSSolver, Sphere as SphereShape, SplitSolver, Vec3, World } from "cannon-es"
import { ReactNode, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"
import { ObjectType } from "../data/stages"
import { addBall, setAiming, store, useStore } from "../data/store"
import { DEFAULT_GRAVITY, DEFAULT_ITERATIONS, useInstancedBody } from "../utils/cannon"
import InstancedMesh, { useInstance } from "./InstancedMesh"
import { clamp } from "../utils/utils"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { extend, invalidate } from "@react-three/fiber"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js" 
import { Tuple3 } from "../types/global"
import { lerp } from "three/src/math/MathUtils.js"

extend({ Line2, LineMaterial, LineGeometry })

interface BallProps {
    velocity: Tuple3
    position: Tuple3
    id: string
    radius?: number
}

const RADIUS = .25
const DAMPING = .4
const MASS = 8

function Ball({
    velocity,
    position
}: BallProps) {
    let definition = useMemo(() => {
        return new SphereShape(RADIUS)
    }, [])
    let [index, instance] = useInstance("ball")

    useInstancedBody({
        definition,
        mass: MASS,
        position,
        velocity,
        scale: RADIUS,
        index,
        linearDamping: DAMPING,
        angularDamping: DAMPING,
        instance,
        userData: { type: "ball" },
    })

    return null
}

function BallHandler() {
    let balls = useStore(i => i.balls)

    return (
        <>
            <InstancedMesh
                name={"ball"}
                count={50}
            >
                <sphereGeometry args={[1, 12, 12]} />
                <meshLambertMaterial emissive={"white"} emissiveIntensity={.3} />
            </InstancedMesh>

            {balls.map(i => <Ball {...i} key={i.id} />)}
        </>
    )
}

export default function Controller({ children }: { children: ReactNode }) {
    let targetReticleRef = useRef<Mesh>(null)
    let aiming = useStore(i => i.aiming)
    let stage = useStore(i => i.stage)
    let fireThreshold = .5
    let [positions, setPositions] = useState<number[]>([])
    let [colors, setColors] = useState<number[]>([])
    let world = useMemo(() => {
        let solver = new SplitSolver(new GSSolver())

        solver.iterations = DEFAULT_ITERATIONS

        let world = new World({
            solver,
            gravity: new Vec3(...DEFAULT_GRAVITY),
        })

        world.defaultContactMaterial.restitution = .5

        for (let ground of stage.ground) {
            world.addBody(new Body({
                shape: new Box(new Vec3(...ground.size.map(i => i / 2))),
                mass: 0,
                position: new Vec3(...ground.position)
            }))
        }

        return world
    }, [stage])
    let data = useMemo(() => {
        return {
            start: new Vector3(),
            end: new Vector3(),
            velocity: new Vector3(),
            distance: 0
        }
    }, [])
    let lineGeometryRef = useRef<LineGeometry>(null)
    let lineRef = useRef<Line2>(null)
    let hidePath = useCallback(() => {
        setPositions([0, 0, 0, 0, 0, 0])
        setColors([0, 0, 0, 0, 0, 0])
    }, [])
    const calculateTrajectory = (start: Tuple3, velocity: Tuple3) => {
        let steps = 90
        let sphere = new Body({
            mass: MASS,
            shape: new SphereShape(RADIUS),
            velocity: new Vec3(...velocity),
            position: new Vec3(...start),
            angularDamping: DAMPING,
            linearDamping: DAMPING
        })
        let t = 0
        let dt = 1 / 30
        let positions: number[] = []
        let colors: number[] = []

        world.addBody(sphere)

        for (let i = 0; i < steps; i++) {
            world.step(dt)
            t += dt

            if (t > .0051 || i === 0 || i === steps - 1) {
                t = 0
                positions.push(...sphere.position.toArray())
                colors.push(
                    lerp(1, 0, (i / steps)),
                    lerp(1, 0, (i / steps)),
                    1,
                )
            }
        }

        world.removeBody(sphere)

        startTransition(() => {
            setPositions(positions)
            setColors(colors)
        })
    }

    useLayoutEffect(() => {
        if (aiming) {
            targetReticleRef.current?.position.copy(data.start)
        }

        data.distance = 0
        targetReticleRef.current?.scale.set(0, 1, 0)
    }, [aiming])

    useEffect(() => {
        if (positions.length) {
            lineGeometryRef.current?.setPositions(positions)
            lineGeometryRef.current?.setColors(colors)
        }
    }, [positions, colors])

    return (
        <>
            <BallHandler />

            <line2
                ref={lineRef}
                visible={!!positions.length && aiming}
            >
                <lineGeometry ref={lineGeometryRef} />
                <lineMaterial
                    vertexColors
                    transparent
                    dashed={false}
                    dashScale={0}
                    gapSize={0}
                    dashSize={0}
                    linewidth={15}
                />
            </line2>

            <group
                onPointerDown={e => {
                    let { panning } = store.getState()

                    if (panning || e.object.userData.type !== ObjectType.GROUND) {
                        return
                    }

                    e.stopPropagation()
                    data.start.copy(e.point)
                    setAiming(true)
                }}
                onPointerMove={e => {
                    let { panning } = store.getState()
                    let maxSpeed = 7

                    if (panning || !aiming || e.object.userData.type !== ObjectType.GROUND) {
                        return
                    }

                    invalidate()
                    e.stopPropagation()

                    data.end.copy(e.point)
                        .setComponent(1, data.start.y)
                    data.distance = data.start.distanceTo(data.end)
                    data.velocity.copy(data.start)
                        .sub(data.end)
                        .normalize()
                        .multiplyScalar(data.distance * maxSpeed)
                        .setComponent(1, clamp(Math.pow(data.distance, 3), 8, 18))

                    targetReticleRef.current?.scale.setScalar(data.distance * .25)
                        .setComponent(1, 1)
                    targetReticleRef.current?.position.copy(data.end)

                    if (data.distance > fireThreshold) {
                        startTransition(() => {
                            calculateTrajectory(
                                [data.end.x, data.end.y + RADIUS, data.end.z],
                                data.velocity.toArray()
                            )
                        })
                    } else {
                        setPositions([0, -100, 0, 0, -100, 0])
                        setColors([0, -100, 0, 0, -100, 0])
                    }
                }}
                onPointerCancel={() => {
                    setAiming(false)
                    hidePath()
                }}
                onPointerUp={(e) => {
                    setAiming(false)

                    if (e.object.userData.type === ObjectType.GROUND) {
                        e.stopPropagation()
                        hidePath()

                        if (data.distance > fireThreshold) {
                            addBall(
                                [data.end.x, data.end.y + RADIUS, data.end.z],
                                data.velocity.toArray()
                            )
                        }
                    }
                }}
            >
                <mesh
                    ref={targetReticleRef}
                    position={[0, -2, 0]}
                >
                    <cylinderGeometry args={[1, 1, .01, 32, 1]} />
                    <meshBasicMaterial
                        color={"white"}
                        opacity={1.5}
                    />
                </mesh>

                {children}
            </group>
        </>
    )
}