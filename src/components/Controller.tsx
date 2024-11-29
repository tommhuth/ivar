import { Body, Box, GSSolver, Sphere as SphereShape, SplitSolver, Vec3, World } from "cannon-es"
import { ReactNode, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"
import { ObjectType } from "../data/stages"
import { addBall, setAiming, store, useStore } from "../data/store"
import { DEFAULT_GRAVITY, DEFAULT_ITERATIONS, useInstancedBody } from "../utils/cannon"
import InstancedMesh, { useInstance } from "./InstancedMesh"
import { clamp } from "../utils/utils"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { extend, invalidate, useFrame } from "@react-three/fiber"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"
import { Tuple3 } from "../types/global"
import { lerp } from "three/src/math/MathUtils.js"
import { blue } from "../utils/materials"
import { easeInQuad } from "@data/shaping"
import { useShader } from "@data/hooks"
import { glsl } from "@data/utils"

extend({ Line2, LineMaterial, LineGeometry })

interface BallProps {
    velocity: Tuple3
    position: Tuple3
    id: string
    radius?: number
}

const RADIUS = .25
const DAMPING = .14
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
    let fireThreshold = .35
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
    let pinRef = useRef<Mesh>(null)
    let pinBaseRef = useRef<Mesh>(null)
    let radialRef = useRef<Mesh>(null)
    let dotRef = useRef<Mesh>(null)
    let hideControls = useCallback(() => {
        setPositions([0, 0, 0, 0, 0, 0])
        setColors([0, 0, 0, 0, 0, 0])
        pinRef.current?.position.setComponent(1, -100)
        pinBaseRef.current?.position.setComponent(1, -100)
        radialRef.current?.position.setComponent(1, -100)
        dotRef.current?.position.setComponent(1, -100)
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
    const stripes = useShader({
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: new Vector3() },
        },
        shared: glsl`
            uniform float uTime;
            uniform vec3 uScale;
            varying vec3 vPosition;
        `,
        vertex: {
            main: glsl`
                vPosition = position;
            `
        },
        fragment: {
            main: glsl`
                // thanks chattyman 
                float stripeWidth = 0.25;  
                float speed = 1.0;  
                float stripePattern = step(0.5, mod((vPosition.z / (1. / uScale.z) + uTime * speed) / stripeWidth, 1.0)); 
              
                gl_FragColor.a = stripePattern;
            `
        }
    })

    useFrame((state, delta) => {
        if (!radialRef.current) {
            return 
        }

        stripes.uniforms.uTime.value += delta
        stripes.uniforms.uTime.needsUpdate = true

        stripes.uniforms.uScale.value.copy(radialRef.current.scale)
        stripes.uniforms.uScale.needsUpdate = true
    })

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

    useEffect(() => {
        let leave = () => {
            hideControls()
            setAiming(false)
        }

        window.document.addEventListener("pointerleave", leave)
        window.document.addEventListener("visibilitychange", leave)

        return () => {
            window.document.removeEventListener("pointerleave", leave)
            window.document.removeEventListener("visibilitychange", leave)
        }
    }, [])


    return (
        <>
            <line2
                position-y={0}
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
                    linewidth={8}
                />
            </line2>
            <group
                onPointerDown={e => {
                    let { panning } = store.getState()

                    if (panning || e.object.userData.type !== ObjectType.GROUND) {
                        return
                    }

                    pinRef.current?.position.copy(e.point)
                    pinBaseRef.current?.position.copy(e.point)
                    dotRef.current?.position.copy(e.point)
                    data.start.copy(e.point)

                    e.stopPropagation()
                    setAiming(true)
                }}
                onPointerMove={e => {
                    let { panning, aiming } = store.getState()
                    let speed = 17
                    let heightSpeed = 15
                    let minHeightSpeed = 5
                    let dragDistance = 3

                    if (panning || !aiming || e.object.userData.type !== ObjectType.GROUND || !radialRef.current) {
                        return
                    }

                    invalidate()
                    e.stopPropagation()

                    data.distance = clamp(data.start.distanceTo(e.point) / dragDistance, 0, 1)
                    data.end.copy(e.point)
                        .sub(data.start)
                        .normalize()
                        .multiplyScalar(data.distance * dragDistance)
                        .add(data.start)
                        .setComponent(1, data.start.y)
                    data.velocity.copy(data.start)
                        .sub(data.end)
                        .normalize()
                        .multiplyScalar(easeInQuad(data.distance) * speed)
                        .setComponent(1, easeInQuad(data.distance) * heightSpeed + minHeightSpeed)

                    // ui
                    targetReticleRef.current?.scale.setScalar(data.distance * 2)
                        .setComponent(1, 1)
                        .setScalar(0)
                    targetReticleRef.current?.position.copy(data.end)

                    dotRef.current?.position.copy(data.end)

                    radialRef.current?.position.copy(data.start)
                    radialRef.current?.scale.set(
                        1,
                        1,
                        data.distance * 3 + .15
                    )
                    radialRef.current.rotation.y = Math.atan2(
                        data.end.x - data.start.x,
                        data.end.z - data.start.z
                    )

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
                    hideControls()
                }}
                onPointerUp={(e) => {
                    if (e.object.userData.type === ObjectType.GROUND) {
                        e.stopPropagation()
                        setAiming(false)
                        hideControls()

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

                <mesh material={blue} ref={pinRef} castShadow receiveShadow>
                    <cylinderGeometry args={[.15, .15, 2, 16, 1]} />
                </mesh>
                <mesh material={blue} ref={pinBaseRef} castShadow receiveShadow>
                    <cylinderGeometry args={[.4, .4, .3, 16, 1]} />
                </mesh>
                <mesh ref={dotRef} castShadow receiveShadow>
                    <cylinderGeometry args={[.35, .35, .25, 16, 1]} />
                    <meshPhongMaterial emissive="#fff" emissiveIntensity={.15} color={"#fff"} />
                </mesh>

                <mesh ref={radialRef} castShadow receiveShadow>
                    <boxGeometry args={[.35, .01, 1, 1, 1, 1]} onUpdate={e => e.translate(0, 0, .5)} />
                    <meshPhongMaterial
                        onBeforeCompile={stripes.onBeforeCompile}
                        emissive="#fff"
                        emissiveIntensity={.15}
                        color={"#fff"}
                        transparent
                    />
                </mesh>

                <BallHandler />

                {children}
            </group>
        </>
    )
} 