import { Color, ColorRepresentation, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three"
import { Tuple3, Tuple4 } from "../types/global"

export function roundTo(value: number, decimals = 2) {
    const factor = Math.pow(10, decimals)

    return Math.round(value * factor) / factor
}

export function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num
}

// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
export function map(
    value: number,
    input: [min: number, max: number],
    output: [min: number, max: number]
) {
    return (value - input[0]) * (output[1] - output[0]) / (input[1] - input[0]) + output[0]
}

export function ndelta(delta: number) {
    return clamp(delta, 1 / 120, 1 / 30)
}

let _matrix = new Matrix4()
let _quaternion = new Quaternion()
let _position = new Vector3(0, 0, 0)
let _scale = new Vector3(1, 1, 1)
let _euler = new Euler()

interface SetMatrixAtParams {
    instance: InstancedMesh
    index: number
    position?: Tuple3
    rotation?: Tuple3 | Tuple4
    scale?: Tuple3 | number
}

export function setMatrixAt({
    instance,
    index,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
}: SetMatrixAtParams) {
    instance.setMatrixAt(
        index,
        _matrix.compose(
            _position.set(...position),
            rotation.length === 3 ? _quaternion.setFromEuler(_euler.set(...rotation)) : _quaternion.set(...rotation),
            Array.isArray(scale) ? _scale.set(...scale) : _scale.set(scale, scale, scale),
        )
    )
    instance.instanceMatrix.needsUpdate = true
    instance.computeBoundingBox()
    instance.computeBoundingSphere()
    instance.geometry.computeBoundingBox()
    instance.geometry.computeBoundingSphere()
}

export function setMatrixNullAt(instance: InstancedMesh, index: number) {
    setMatrixAt({
        instance,
        index,
        position: [0, 0, -1_000],
        scale: [1, 1, 1],
        rotation: [0, 0, 0]
    })
}

const _color = new Color()

export function setColorAt(instance: InstancedMesh, index: number, color: ColorRepresentation) {
    instance.setColorAt(index, _color.set(color))

    if (instance.instanceColor) {
        instance.instanceColor.needsUpdate = true
    }
}


export function spring(
    value: number,
    target: number,
    stiffness: number,
    damping: number,
    dt: number
): number {
    // Velocity of the spring, initialized to 0
    let velocity = 0

    // Calculate the distance from the target
    const distance = target - value

    // Calculate the spring force (Hooke's Law)
    const springForce = distance * stiffness

    // Calculate the damping force
    const dampingForce = -velocity * damping // Damping is based on velocity, not position

    // Calculate the total acceleration
    const acceleration = (springForce + dampingForce)

    // Update the velocity
    velocity += acceleration * dt

    // Update the position (value) based on the new velocity
    value += velocity * dt

    return value
}