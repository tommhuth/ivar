import { stages } from "../data/stages"
import { State, useStore, setState, setStage } from "../data/store"
import Arrow from "./Arrow"

import "./SuccessMessage.scss"

export default function SuccessMessage() {
    let state = useStore(i => i.state)

    return (
        <section
            style={{
                display: state === State.GAME_OVER ? "flex" : "none",
            }}
            className="success-message"
        >
            <h2 className="success-message__title">
                Yay
            </h2>

            <p className="success-message__message">
                Well done, you knocked down all the things
            </p>
            <button
                className="success-message__okay"
                onClick={() => {
                    setState(State.INTRO)
                    setStage(stages[0])
                }}
            >
                <span className="visually-hidden">Back to menu</span>
                <Arrow direction="right" />
            </button>
        </section>
    )
}