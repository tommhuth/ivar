import { State, useStore } from "../data/store"
import GameStats from "./GameStats"
import Intro from "./Intro"
import SuccessMessage from "./SuccessMessage"

export default function UI() {
    let state = useStore(i => i.state)
    let panning = useStore(i => i.panning)
    let aiming = useStore(i => i.aiming)

    return (
        <> 
            <Intro />
            <GameStats />
            <SuccessMessage />
            
            {state === State.PLAYING && !aiming && <button className={"panner " + (panning ? "panner--active" : "")} />}
        </>
    )
}