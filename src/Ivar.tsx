import Camera from "./components/Camera"
import { useEffect, useState } from "react"
import Config from "./Config"
import { setState, State, useStore } from "./data/store"
import World from "./components/World"
import Controller from "./components/Controller"
import Stage from "./components/Stage"
import { CannonProvider } from "./utils/cannon"
import Lights from "./components/Lights"

export default function Ivar() {
    let id = useStore(i => i.id)
    let [fontsReady, setFontsReady] = useState(false)

    useEffect(() => {
        const initialize = async () => {
            await document.fonts.ready
            setFontsReady(true)
        }

        initialize()
    }, [])

    useEffect(() => {
        if (fontsReady) {
            setState(State.INTRO)

            let id = setTimeout(() => {
                document.body.style.backgroundImage = "linear-gradient(to bottom, rgb(255, 213, 44), rgb(255, 148, 49))"
                document.body.style.backgroundColor = "rgb(255, 123, 0)"
                document.querySelector(".loader")?.remove()
            }, 250)

            return () => clearTimeout(id)
        }
    }, [fontsReady])


    return (
        <>
            <Camera />
            <Lights />

            <CannonProvider debug={Config.DEBUG}>
                <Controller>
                    <World />
                </Controller>

                <Stage key={id} />
            </CannonProvider>
        </>
    )
} 