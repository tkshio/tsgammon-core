import { BGState } from './BGState'
import { BGListeners } from './cubefulGameEventHandlers'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from './CubeGameState'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'
import { SGInPlay, SGOpening, SGToRoll } from './SingleGameState'
import { concat1, concat2 } from './utils/concat'

export type BGEventHandlers = {
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

export function asSGEventHandlers(
    cbState: CBState,
    handlers: Partial<BGEventHandlers>
): SingleGameEventHandlers {
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
    bg1: Partial<BGListeners>,
    bg2: Partial<BGListeners>
) {
    return {
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
    defaultState: CBState,
    setCBState: (cbState: CBState) => void
): BGListeners {
    return {
        onStartCubeGame: () => setCBState(defaultState),
        onStartCubeAction: (bgState: BGState) => setCBState(bgState.cbState),
        onAwaitCheckerPlay: (bgState: BGState) => setCBState(bgState.cbState),
        onDouble: (bgState: BGState) => setCBState(bgState.cbState),
        onTake: (bgState: BGState) => setCBState(bgState.cbState),
        onSkipCubeAction: (bgState: BGState) => setCBState(bgState.cbState),
        onEndOfCubeGame: (bgState: BGState) => setCBState(bgState.cbState),
    }
}
