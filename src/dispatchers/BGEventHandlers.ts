import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGState } from './BGState'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from './CubeGameState'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'
import { SGInPlay, SGOpening, SGState, SGToRoll } from './SingleGameState'

export type BGEventHandlers = {
    onRollOpening: (bgState: { cbState: CBOpening; sgState: SGOpening }) => void

    onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => void

    onRoll: (bgState: {
        cbState: CBToRoll | CBAction
        sgState: SGToRoll
    }) => void

    onStartGame: () => void

    onDouble: (bgState: { cbState: CBAction; sgState: SGState }) => void
    onTake: (bgState: { cbState: CBResponse; sgState: SGState }) => void
    onPass: (bgState: { cbState: CBResponse; sgState: SGState }) => void

    onEndGame: (bgState: BGState, result: SGResult, eog: EOGStatus) => void
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
        onEndGame: (sgState: SGState, result: SGResult, eog: EOGStatus) => {
            handlers.onEndGame?.({ cbState, sgState }, result, eog)
        },
    }
}
