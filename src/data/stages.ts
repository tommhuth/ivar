import random from "@huth/random"
import { Tuple3 } from "../types/global"

export interface BaseObject {
    type: ObjectType
    id: string
    position: Tuple3
    rotation: Tuple3
}

export enum ObjectType {
    SHELF = "shelf",
    TABLE = "table",
    GROUND = "ground",
    PLANT = "plant",
    TABLE_CHAIR = "table-chair",
    CABINET = "cabinet",
    CHAIR = "chair",
    BOX = "box"
}

export interface Shelf extends BaseObject {
    type: ObjectType.SHELF
}

export interface Chair extends BaseObject {
    type: ObjectType.CHAIR
}

export interface Cabinet extends BaseObject {
    type: ObjectType.CABINET
}

export interface Plant extends BaseObject {
    type: ObjectType.PLANT
}

export interface Table extends BaseObject {
    type: ObjectType.TABLE
}

export interface TableChair extends BaseObject {
    type: ObjectType.TABLE_CHAIR
}

export interface Ground {
    position: Tuple3;
    size: Tuple3;
    id: string
}

export type StageObjects = TableChair | Table | Plant | Cabinet | Chair | Shelf

export interface Stage {
    objects: StageObjects[]
    title: string
    id: string;
    ground: Ground[]
    settings: {
        center: Tuple3
        boundingRadius: number
        cameraStart: Tuple3
        exitY?: number
        background?: string
    }
}


export const stages: Stage[] = [
    {
        title: "Söderhamn",
        id: random.id(),
        settings: {
            center: [4, 0, 5],
            cameraStart: [14, 0, 5],
            boundingRadius: 50,
            background: "rgb(12, 62, 203)"
        },
        ground: [
            { 
                id: random.id(),
                position: [0, -25, 0],
                size: [100, 50, 100]
            },
            { 
                id: random.id(),
                position: [5, .5, 0],
                size: [20, 1, 21]
            }
        ],
        objects: [
            {
                id: random.id(),
                type: ObjectType.CABINET,
                position: [9, 1, 7],
                rotation: [0, 0, 0]
            },
            {
                id: random.id(),
                type: ObjectType.CHAIR,
                position: [0, 1, -3],
                rotation: [0, 1.5, 0]
            },
            {
                id: random.id(),
                type: ObjectType.PLANT,
                position: [4.5, 1, 7],
                rotation: [0, 1, 0],
            },
            {
                id: random.id(),
                type: ObjectType.TABLE,
                position: [7, 1, -2],
                rotation: [0, .5, 0]
            },
            {
                id: random.id(),
                position: [7, 1, -6],
                type: ObjectType.TABLE_CHAIR,
                rotation: [0, -Math.PI, 0]
            },
            {
                id: random.id(),
                position: [0, 1, 4],
                type: ObjectType.SHELF,
                rotation: [0, Math.PI / 2, 0]
            },
        ]
    },
    {
        title: "Stockholm",
        id: random.id(),
        settings: {
            center: [2, 0, 6],
            cameraStart: [-10, 0, 3],
            boundingRadius: 50, 
            background: "rgb(12, 62, 203)"
        },
        ground: [
            { 
                id: random.id(),
                position: [0, -25, 0],
                size: [100, 50, 100]
            },
            { 
                id: random.id(),
                position: [5, 2, 10],
                size: [10, 4, 6]
            },
            { 
                id: random.id(),
                position: [5, 1, 5],
                size: [5, 2, 5]
            },
        ],
        objects: [
            {
                id: random.id(),
                type: ObjectType.PLANT,
                position: [5, 2, 5],
                rotation: [0, .2, 0],
            },
            {
                id: random.id(),
                position: [3, 0, -2],
                type: ObjectType.TABLE_CHAIR,
                rotation: [0, .15, 0]
            },
            {
                id: random.id(),
                position: [6, 0, 0],
                type: ObjectType.TABLE_CHAIR,
                rotation: [0, -2.15, 0]
            },
            {
                id: random.id(),
                position: [0, 0, 3],
                type: ObjectType.SHELF,
                rotation: [0, -Math.PI / 2, 0]
            },
            {
                id: random.id(),
                position: [5, 4, 10],
                type: ObjectType.SHELF,
                rotation: [0, .1, 0]
            },
        ]
    },
    {
        title: "Kungsbacka",
        id: random.id(),
        settings: {
            center: [0, 0, 15],
            cameraStart: [0, 0, 22],
            boundingRadius: 60, 
            exitY: -2,
        },
        ground: [
            {
                id: random.id(),
                position: [0, -50, -10],
                size: [10, 100, 30]
            },
            {
                id: random.id(),
                position: [0, -50, 11],
                size: [10, 100, 4]
            },
            {
                id: random.id(),
                position: [0, -50, 19],
                size: [10, 100, 4]
            },
        ],
        objects: [
            {
                id: random.id(),
                type: ObjectType.SHELF,
                position: [0, 0, 3],
                rotation: [0, 0, 0],
            },
            {
                id: random.id(),
                type: ObjectType.SHELF,
                position: [0, 0, 11],
                rotation: [0, 0, 0],
            },
            {
                id: random.id(),
                type: ObjectType.PLANT,
                position: [-1, 0, 19],
                rotation: [0, 0, 0],
            },
            {
                id: random.id(),
                type: ObjectType.CHAIR,
                position: [3, 0, 19],
                rotation: [0, 1.85, 0],
            },
        ]
    },
    {
        title: "Äpplarö",
        id: random.id(),
        settings: {
            center: [5, 0, 0],
            cameraStart: [5, 0, -10],
            boundingRadius: 50, 
            background: "rgb(12,62,203)"
        },
        ground: [
            ...new Array(6).fill(null).map((i, index, list) => {
                let stepDepth = 3
                let depth = index === list.length - 1 ? 100 : stepDepth
                let height = 1

                return {
                    id: random.id(),
                    position: [
                        0,
                        index * height / 2,
                        index * stepDepth / 2 + 8 + depth / 2
                    ] as Tuple3,
                    size: [100, height, depth] as Tuple3
                }
            }),
            {
                id: random.id(),
                position: [0, -5, 0] as Tuple3,
                size: [100, 10, 16] as Tuple3,
            },
            ...new Array(16).fill(null).map((i, index, list) => {
                let stepDepth = 3
                let depth = index === list.length - 1 ? 100 : stepDepth
                let height = 1

                return {
                    id: random.id(),
                    position: [
                        0,
                        -index * height / 2 - height,
                        -index * stepDepth / 2 - 8
                    ] as Tuple3,
                    size: [100, height, depth] as Tuple3,
                }
            }),
        ],
        objects: [
            {
                id: random.id(),
                type: ObjectType.SHELF,
                position: [-5, 0, 0],
                rotation: [0, Math.PI / 2, 0],
            },
            {
                id: random.id(),
                type: ObjectType.SHELF,
                position: [7, 0, 0],
                rotation: [0, 0, 0],
            },
            {
                id: random.id(),
                type: ObjectType.CHAIR,
                position: [0, 0, 0],
                rotation: [0, -Math.PI + .3, 0],
            },
        ]
    },
]