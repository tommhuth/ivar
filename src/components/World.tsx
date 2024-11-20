import { useThree } from "@react-three/fiber"
import { useLayoutEffect, useMemo } from "react"
import { BoxGeometry, Color } from "three"
import { ObjectType } from "../data/stages"
import { useStore } from "../data/store"
import { blue, yellow } from "../utils/materials"
import InstancedMesh from "./InstancedMesh"
import Cabinets from "./world/Cabinets"
import Chairs from "./world/Chairs"
import Plants from "./world/Plants"
import Shelves from "./world/Shelves"
import Tables from "./world/Tables"
import TableChairs from "./world/TablesChairs"

const box = new BoxGeometry(1, 1, 1, 1, 1, 1)

export default function World() {
    let { scene } = useThree()
    let stage = useStore(i => i.stage)
    let color = useMemo(() => new Color(), [])

    useLayoutEffect(() => {
        if (stage.settings.background) {
            scene.background = color.set(stage.settings.background)
        } else {
            scene.background = null
        }
    }, [stage])

    return (
        <>
            <InstancedMesh
                name={ObjectType.BOX}
                count={100}
            >
                <primitive object={box} attach="geometry" />
                <primitive object={yellow} attach="material" />
            </InstancedMesh>

            <InstancedMesh
                name={ObjectType.GROUND}
                count={25}
            >
                <primitive object={box} attach="geometry" />
                <primitive object={blue} attach="material" />
            </InstancedMesh>

            <Cabinets />
            <Chairs />
            <Plants />
            <Shelves />
            <TableChairs />
            <Tables />
        </>
    )
}