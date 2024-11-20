import { useFrame } from "@react-three/fiber"
import { useMemo, useState } from "react"
import { IUniform, Vector3, WebGLProgramParametersWithUniforms } from "three"
import { ObjectType } from "../data/stages"
import { addPenalty, store, useStore } from "../data/store"
import { Body } from "./cannon" 

interface ShaderPart {
    at?: string
    head?: string
    main?: string
}

interface UseShaderParams {
    uniforms?: Record<string, IUniform<any>>
    vertex?: ShaderPart
    fragment?: ShaderPart
}

export function useShader({
    uniforms: incomingUniforms = {},
    vertex = {
        at: "<begin_vertex>",
        head: "",
        main: "",
    },
    fragment = {
        at: "<premultiplied_alpha_fragment>",
        head: "",
        main: "",
    }
}: UseShaderParams) {
    let uniforms = useMemo(() => {
        return Object.entries(incomingUniforms)
            .map(([key, value]) => ({ [key]: { needsUpdate: false, ...value } }))
            .reduce((previous, current) => ({ ...previous, ...current }), {})
    }, [])

    return {
        uniforms,
        onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
            shader.uniforms = {
                ...shader.uniforms,
                ...uniforms
            }

            shader.vertexShader = shader.vertexShader.replace("#include <common>", /* glsl */`
                #include <common>
         
                ${vertex.head}  
            `)
            shader.vertexShader = shader.vertexShader.replace("#include " + vertex.at, /* glsl */`
                #include ${vertex.at}
        
                ${vertex?.main}  
            `)
            shader.fragmentShader = shader.fragmentShader.replace("#include <common>", /* glsl */`
                #include <common>

                ${fragment?.head}  
            `)
            shader.fragmentShader = shader.fragmentShader.replace("#include " + fragment.at, /* glsl */`
                #include ${fragment.at}

                ${fragment?.main}  
            `)
        }
    }
}

export function useStageObjects<T>(type: Omit<ObjectType, ObjectType.BOX>) {
    let objects = useStore(i => i.stage.objects)

    return useMemo(() => objects.filter((i) => i.type === type), [objects]) as T[]
}


let _directionUp = new Vector3(0, 1, 0)
let _direction = new Vector3()

export function useOrientationObserver(body: Body): boolean {
    let [dead, setDead] = useState(false)

    useFrame(() => {
        if (body && !dead) {
            let { stage } = store.getState()

            _direction.set(0, 1, 0).applyQuaternion(body.quaternion)

            if (
                _directionUp.dot(_direction) < .35
                || (stage.settings.exitY && body.position.y < stage.settings.exitY)
            ) {
                setDead(true)
                addPenalty()
            }
        }
    })

    return dead
}