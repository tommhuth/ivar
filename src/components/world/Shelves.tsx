import { useLoader } from "@react-three/fiber"
import { Mesh } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { ObjectType } from "../../data/stages"
import { white } from "../../utils/materials"
import InstancedMesh from "../InstancedMesh"
import model from  "@assets/models/shelf1.glb"

useLoader.preload(GLTFLoader,model)

export default function Shelves() {
    let glb = useLoader(GLTFLoader, model)
    let mesh = glb?.scene.children[0] as Mesh

    return (
        <InstancedMesh
            count={10}
            name={ObjectType.SHELF}
        >
            <primitive object={mesh.geometry} attach="geometry" />
            <primitive object={white} attach="material" />
        </InstancedMesh>
    )
}