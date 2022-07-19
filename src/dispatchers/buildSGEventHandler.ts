import { DiceRoll } from '../Dices'
import { RollListener, rollListeners } from './RollDispatcher'
import { concatSGListeners, singleGameDispatcher } from './SingleGameDispatcher'
import { SingleGameListener } from './SingleGameListener'
import { SGOpening, SGToRoll } from './SingleGameState'
import {
    SingleGameEventHandlerExtensible,
    SingleGameEventHandler,
} from './SingleGameEventHandler'

export function buildSGEventHandler(
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<SingleGameListener>[]
): SingleGameEventHandlerExtensible {
    return buildSGEventHandler_rec(rollListener, {}, ...listeners)
}

function buildSGEventHandler_rec(
    rollListener: RollListener,
    sgListener: Partial<SingleGameListener>,
    ...listeners: Partial<SingleGameListener>[]
): SingleGameEventHandlerExtensible {
    const listener = listeners.reduce(
        (prev, cur) => concatSGListeners(prev, cur),
        sgListener
    )
    const addListeners = (...toAdd: Partial<SingleGameListener>[]) => {
        return buildSGEventHandler_rec(rollListener, listener, ...toAdd)
    }
    return {
        ..._buildSGEventHandler(rollListener, listener),
        addListeners,
    }
}

function _buildSGEventHandler(
    rollListener: RollListener,
    listeners: Partial<SingleGameListener>
): SingleGameEventHandler {
    return {
        onStartGame: () => {
            const result = singleGameDispatcher.doStartGame()
            result(listeners)
        },
        onCommit: (state) => {
            const result = singleGameDispatcher.doCommitCheckerPlay(state)
            result(listeners)
        },
        onRoll: (sgState: SGToRoll) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                const result = singleGameDispatcher.doRoll(sgState, dices)
                result(listeners)
            }),
        onRollOpening: (sgState: SGOpening) =>
            rollListener.onRollRequest((dices: DiceRoll) => {
                const result = singleGameDispatcher.doOpeningRoll(
                    sgState,
                    dices
                )
                result(listeners)
            }),
    }
}
