import { Vec3, Box as BoxShape } from "cannon-es"
import { useMemo } from "react"
import { Euler, Line3, Matrix4, Quaternion, Vector3 } from "three"
import { ShapeDefinition, useInstancedBody } from "../../utils/cannon"
import { useInstance } from "../InstancedMesh" 
import Config from "../../Config"
import { useStageObjects } from "../../utils/hooks"
import RidgidStageObject from "../RidgidStageObject"
import { ObjectType, type Shelf } from "../../data/stages"
import { Tuple3 } from "../../types/global"
import { usePopulateLocations } from "@data/hooks"


interface ShelfProps {
    rotation: Tuple3;
    position: Tuple3;
}

function Shelf({ position = [0, 0, 0], rotation = [0, 0, 0] }: ShelfProps) {
    let depth = 2
    let height = 7
    let width = 5
    let legRadius = 0.15
    let shelfHeight = .1
    let [index, instance] = useInstance(ObjectType.SHELF)
    let definition = useMemo(() => {
        return [
            [new BoxShape(new Vec3(legRadius, height / 2, legRadius)), new Vec3(width / 2, 0, depth / 2)],
            [new BoxShape(new Vec3(legRadius, height / 2, legRadius)), new Vec3(-width / 2, 0, depth / 2)],
            [new BoxShape(new Vec3(legRadius, height / 2, legRadius)), new Vec3(-width / 2, 0, -depth / 2)],
            [new BoxShape(new Vec3(legRadius, height / 2, legRadius)), new Vec3(width / 2, 0, -depth / 2)],
            [new BoxShape(new Vec3(width / 2 + legRadius, shelfHeight, depth / 2 + legRadius)), new Vec3(0, 0, 0)],
            [new BoxShape(new Vec3(width / 2 + legRadius, shelfHeight, depth / 2 + legRadius)), new Vec3(0, -height / 3, 0)],
            [new BoxShape(new Vec3(width / 2 + legRadius, shelfHeight, depth / 2 + legRadius)), new Vec3(0, height / 3, 0)]
        ] as ShapeDefinition
    }, [])
    let locations = useMemo(() => {
        let matrix = new Matrix4().compose(
            new Vector3(position[0], position[1] + height / 2, position[2]),
            new Quaternion().setFromEuler(new Euler().set(...rotation, "XYZ")),
            new Vector3(1, 1, 1),
        )

        return [
            {
                path: new Line3(
                    new Vector3(width / 2 - legRadius, -height / 3 + shelfHeight, 0),
                    new Vector3(-width / 2 + legRadius, -height / 3 + shelfHeight, 0)
                ).applyMatrix4(matrix),
                height: height / 3 - shelfHeight - .25,
                depth: 2
            },
            {
                path: new Line3(
                    new Vector3(width / 2 - legRadius, shelfHeight, 0),
                    new Vector3(-width / 2 + legRadius, shelfHeight, 0)
                ).applyMatrix4(matrix),
                height: height / 3 - shelfHeight - .25,
                depth: 2
            },
            {
                path: new Line3(
                    new Vector3(width / 2 - legRadius, height / 3 + shelfHeight, 0),
                    new Vector3(-width / 2 + legRadius, height / 3 + shelfHeight, 0)
                ).applyMatrix4(matrix),
                height: height / 3 + 1,
                depth: 2
            }
        ]
    }, [])
    let [body] = useInstancedBody({
        definition,
        position: [position[0], position[1] + height / 2, position[2]],
        mass: 20,
        rotation,
        instance,
        index,
    })

    usePopulateLocations(locations, rotation)

    return (
        <>
            {Config.DEBUG && (
                locations.map(({ path, height, depth }, index) => {
                    let position = path.getCenter(new Vector3())

                    position.y += height / 2

                    return (
                        <mesh rotation-y={rotation[1]} position={position} key={index}>
                            <boxGeometry args={[path.distance(), height, depth, 1, 1, 1]} />
                            <meshLambertMaterial opacity={.5} transparent color="red" />
                        </mesh>
                    )
                })
            )}

            <RidgidStageObject body={body} />
        </>
    )
}

export default function Shelves() {
    let shelves = useStageObjects<Shelf>(ObjectType.SHELF)

    return (
        <>
            {shelves.map(i => {
                return <Shelf {...i} key={i.id} />
            })}
        </>
    )
}