import { useCallback, useEffect, useMemo, useRef } from "react"
import { IUniform, Line3, Vector3, WebGLProgramParametersWithUniforms } from "three"
import { glsl } from "./utils"
import random from "@huth/random"
import { Tuple2, Tuple3 } from "src/types.global"
import { addBox } from "./store"

export const useAnimationFrame = (callback: (delta: number) => void) => {
    // Use useRef for mutable variables that we want to persist
    // without triggering a re-render on their change
    const requestRef = useRef<number>()
    const previousTimeRef = useRef<number>()

    const animate = (time: number) => {
        if (previousTimeRef.current != undefined) {
            const deltaTime = time - previousTimeRef.current

            callback(deltaTime)
        }
        previousTimeRef.current = time
        requestRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(requestRef.current as number)
    }, []) // Make sure the effect runs only once
}

interface ShaderPart {
    head?: string
    main?: string
}

export interface UseShaderParams<T = Record<string, IUniform<any>>> {
    uniforms?: T
    shared?: string
    vertex?: ShaderPart
    fragment?: ShaderPart
}

export function useShader({
    uniforms: incomingUniforms = {},
    shared = "",
    vertex = {
        head: "",
        main: "",
    },
    fragment = {
        head: "",
        main: "",
    }
}: UseShaderParams) {
    let uniforms = useMemo(() => {
        return Object.entries(incomingUniforms)
            .map(([key, value]) => ({ [key]: { needsUpdate: true, ...value } }))
            .reduce((previous, current) => ({ ...previous, ...current }), {})
    }, [])
    let id = useMemo(() => random.id(), [])
    let customProgramCacheKey = useCallback(() => id, [id])
    let onBeforeCompile = useCallback((shader: WebGLProgramParametersWithUniforms) => {
        shader.uniforms = {
            ...shader.uniforms,
            ...uniforms
        }

        shader.vertexShader = shader.vertexShader.replace("#include <common>", glsl`
            #include <common>
            
            ${shared}
            ${vertex.head}  
        `)
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", glsl`
            #include <begin_vertex>
    
            ${vertex?.main}  
        `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", glsl`
            #include <common>

            ${shared}
            ${fragment?.head}  
        `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", glsl`
            #include <dithering_fragment> 

            ${fragment?.main}  
        `)
    }, [vertex?.head, vertex?.main, fragment?.head, fragment?.main])

    return {
        uniforms,
        customProgramCacheKey,
        onBeforeCompile
    }
}


interface Location {
    path: Line3
    height: number
    depth: number
}


export function usePopulateLocations(
    locations: Location[],
    rotation: Tuple3,
    sizeRange: Tuple2 = [.1, .3],
    gapRange: Tuple2 = [.05, .2],
) {
    useEffect(() => {
        let boxes: { position: Tuple3, size: Tuple3, rotation: Tuple3 }[] = []
        let _target = new Vector3()

        for (let location of locations) {
            let length = location.path.distance()
            let direction = random.pick(1, -1)
            let t = direction === 1 ? 0 : 1
            let width = random.float(...sizeRange)
            let gap = 0
            let canFit = (t: number) => {
                return direction === 1 ? t < 1 : t > 0
            }
            let remainder = (t: number) => {
                return direction === 1 ? 1 - t : t
            }

            t += random.float(0, .1) * direction

            while (canFit(t + ((width + gap) * direction))) {
                let position = location.path.at(t + (width / 2 + gap / 2) * direction, _target)

                boxes.push({
                    position: position.toArray(),
                    size: [
                        width * length,
                        random.float(location.height * .25, location.height),
                        random.float(location.depth * .5, location.depth)
                    ],
                    rotation,
                })

                t += (width + gap) * direction
                width = random.float(.1, Math.min(.35, remainder(t)))
                gap = random.float(...gapRange)
            }
        }

        addBox(boxes)
    }, [locations])
}