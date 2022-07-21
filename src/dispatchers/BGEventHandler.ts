import { BGState } from './BGState'
import { BGListener } from './BGListener'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from './CubeGameState'
import { SingleGameEventHandler } from './SingleGameEventHandler'
import { SGInPlay, SGOpening, SGToRoll } from './SingleGameState'
import { concat0, concat1, concat2 } from './utils/concat'

export type BGEventHandler = {
    onRollOpening: (bgState: { cbState: CBOpening; sgState: SGOpening }) => void

    onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => void

    onRoll: (bgState: {
        cbState: CBToRoll | CBAction
        sgState: SGToRoll
    }) => void

    onStartGame: () => void

    onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => void
    onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
    onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
}

export function asSGEventHandler(
    cbState: CBState,
    handlers: Partial<BGEventHandler>
): SingleGameEventHandler {
    return {
        onStartGame: () => {
            handlers.onStartGame?.()
        },
        onCommit: (sgState: SGInPlay) => {
            if (cbState.tag === 'CBInPlay') {
                handlers.onCommit?.({ cbState, sgState })
            }
        },
        onRoll: (sgState: SGToRoll) => {
            if (cbState.tag === 'CBToRoll' || cbState.tag === 'CBAction') {
                handlers.onRoll?.({ cbState, sgState })
            }
        },
        onRollOpening: (sgState: SGOpening) => {
            if (cbState.tag === 'CBOpening') {
                handlers.onRollOpening?.({ cbState, sgState })
            }
        },
    }
}

export function concatBGListeners(
    bg1: Partial<BGListener>,
    bg2: Partial<BGListener>
): Partial<BGListener> {
    return {
        onBGGameStarted: concat0(bg1.onBGGameStarted, bg2.onBGGameStarted),
        onBGOpeningRerolled: concat1(
            bg1.onBGOpeningRerolled,
            bg2.onBGOpeningRerolled
        ),
        onAwaitCubeAction: concat2(
            bg1.onAwaitCubeAction,
            bg2.onAwaitCubeAction
        ),
        onCubeActionStarted: concat1(
            bg1.onCubeActionStarted,
            bg2.onCubeActionStarted
        ),
        onCubeActionSkipped: concat1(
            bg1.onCubeActionSkipped,
            bg2.onCubeActionSkipped
        ),
        onDoubled: concat2(bg1.onDoubled, bg2.onDoubled),
        onDoubleAccepted: concat2(bg1.onDoubleAccepted, bg2.onDoubleAccepted),
        onAwaitCheckerPlay: concat1(
            bg1.onAwaitCheckerPlay,
            bg2.onAwaitCheckerPlay
        ),
        onEndOfBGGame: concat1(bg1.onEndOfBGGame, bg2.onEndOfBGGame),
    }
}

export function setBGStateListener(
    defaultState: BGState,
    setBGState: (bgState: BGState) => void
): BGListener {
    return {
        onBGGameStarted: () => setBGState(defaultState),
        onBGOpeningRerolled: (bgState: BGState) => setBGState(bgState),
        onAwaitCubeAction: () => {
            //
        },
        onCubeActionStarted: (bgState: BGState) => setBGState(bgState),
        onAwaitCheckerPlay: (bgState: BGState) => setBGState(bgState),
        onDoubled: (bgState: BGState) => setBGState(bgState),
        onDoubleAccepted: (bgState: BGState) => setBGState(bgState),
        onCubeActionSkipped: (bgState: BGState) => setBGState(bgState),
        onEndOfBGGame: (bgState: BGState) => setBGState(bgState),
    }
}
