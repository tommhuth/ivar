import { stages } from "../data/stages"
import { reset, setStage, setState, State, useStore } from "../data/store"
import Arrow from "./Arrow"

import "./introx.scss"

export default function Intro() {
    let state = useStore(i => i.state)
    let stage = useStore(i => i.stage)
    let player = useStore(i => i.player)

    return (
        <header
            className="intro"
            style={{
                display: state === State.INTRO ? "flex" : "none",
            }}
            onClick={() => {
                setState(State.PLAYING)

                if (player.ballCount > 0) {
                    reset()
                }
            }}
        >
            <div className="intro__inner">

                <h1 className="intro__title">
                    Untitled  <br /> furniture  <br />  game
                </h1>

                <hr className="intro__hr" />

                <div className="intro__stage">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            let index = stages.findIndex(i => i === stage)

                            setStage(stages[index === 0 ? stages.length - 1 : index - 1])
                        }}
                    >
                        <Arrow direction="left" />
                        <span className="visually-hidden">Previous stage</span>
                    </button>

                    <strong lang="sv">{stage.title}</strong>

                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            let index = stages.findIndex(i => i === stage)

                            setStage(stages[(index + 1) % stages.length])
                        }}
                    >
                        <Arrow />
                        <span className="visually-hidden">Next stage</span>
                    </button>
                </div>
            </div>
        </header>
    )
}