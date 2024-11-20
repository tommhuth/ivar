import { Box, Vec3 } from "cannon-es"
import { useMemo } from "react"
import { ObjectType } from "../../data/stages"
import { useStore } from "../../data/store" 
import { useInstancedBody } from "../../utils/cannon"
import { useInstance } from "../InstancedMesh"
import { Tuple3 } from "../../types/global"

interface GroundProps {
    size: Tuple3;
    position: Tuple3;
}

function GroundElement({ size, position }: GroundProps) {
    const definition = useMemo(() => {
        return new Box(new Vec3(size[0] / 2, size[1] / 2, size[2] / 2))
    }, [])
    const [index, instance] = useInstance(ObjectType.GROUND)

    useInstancedBody({
        definition,
        mass: 0,
        position,
        scale: size,
        index,
        instance,
        userData: { type: ObjectType.GROUND }
    }) 

    return null
}

export default function Ground() {
    let ground = useStore(i => i.stage.ground) 

    return (
        <>
            {ground.map((i) => {
                return <GroundElement key={i.id} {...i} />
            })}
        </>
    )
}