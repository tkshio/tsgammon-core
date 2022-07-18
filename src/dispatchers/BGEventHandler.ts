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
        onStartCubeGame: concat0(bg1.onStartCubeGame, bg2.onStartCubeGame),
        onAwaitCubeAction: concat2(
            bg1.onAwaitCubeAction,
            bg2.onAwaitCubeAction
        ),
        onStartCubeAction: concat1(
            bg1.onStartCubeAction,
            bg2.onStartCubeAction
        ),
        onSkipCubeAction: concat1(bg1.onSkipCubeAction, bg2.onSkipCubeAction),
        onDouble: concat2(bg1.onDouble, bg2.onDouble),
        onTake: concat2(bg1.onTake, bg2.onTake),
        onAwaitCheckerPlay: concat1(
            bg1.onAwaitCheckerPlay,
            bg2.onAwaitCheckerPlay
        ),
        onEndOfCubeGame: concat1(bg1.onEndOfCubeGame, bg2.onEndOfCubeGame),
    }
}

export function setBGStateListener(
    defaultState: BGState,
    setBGState: (bgState: BGState) => void
): BGListener {
    return {
        onStartCubeGame: () => setBGState(defaultState),
        onAwaitCubeAction: () => {
            //
        },
        onStartCubeAction: (bgState: BGState) => setBGState(bgState),
        onAwaitCheckerPlay: (bgState: BGState) => setBGState(bgState),
        onDouble: (bgState: BGState) => setBGState(bgState),
        onTake: (bgState: BGState) => setBGState(bgState),
        onSkipCubeAction: (bgState: BGState) => setBGState(bgState),
        onEndOfCubeGame: (bgState: BGState) => setBGState(bgState),
    }
}
