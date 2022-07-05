import { DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { RollListener, rollListeners } from './RollDispatcher'
import {
    concatSGListeners,
    singleGameDispatcher,
    SingleGameListeners,
} from './SingleGameDispatcher'
import { SGInPlay, SGOpening, SGState, SGToRoll } from './SingleGameState'
import { concat0, concat1 } from './utils/concat'

export type SingleGameEventHandlers = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
    onEndGame: (sgState: SGState, sgResult: SGResult, eog: EOGStatus) => void
}

export type SingleGameEventHandlersExtensible = SingleGameEventHandlers & {
    addListeners: (
        sgListeners: Partial<SingleGameListeners>
    ) => SingleGameEventHandlersExtensible
}
export function singleGameEventHandlers(
    rollListener: RollListener = rollListeners(),
    listeners: Partial<SingleGameListeners>
): SingleGameEventHandlersExtensible {
    const sgHandlers = buildSGEventHandlers(rollListener, listeners)
    const addListeners = (toAdd: Partial<SingleGameListeners>) => {
        return singleGameEventHandlers(
            rollListener,
            concatSGListeners(listeners, toAdd)
        )
    }
    return {
        ...sgHandlers,
        addListeners,
    }
}

function buildSGEventHandlers(
    rollListener: RollListener = rollListeners(),
    listeners: Partial<SingleGameListeners>
): SingleGameEventHandlers {
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
        onEndGame: (sgState: SGState, sgResult: SGResult, eog: EOGStatus) => {
            const result = singleGameDispatcher.doEndOfGame(
                sgState,
                sgResult,
                eog
            )
            result(listeners)
        },
    }
}

export function concatSGHandlers(
    base: Partial<SingleGameEventHandlers>,
    ...handlers: Partial<SingleGameEventHandlers>[]
): Partial<SingleGameEventHandlers> {
    return handlers.reduce(
        (
            prev: Partial<SingleGameEventHandlers>,
            cur: Partial<SingleGameEventHandlers>
        ): Partial<SingleGameEventHandlers> => {
            return {
                onStartGame: concat0(prev?.onStartGame, cur?.onStartGame),
                onCommit: concat1(prev?.onCommit, cur?.onCommit),
                onRoll: concat1(prev?.onRoll, cur?.onRoll),
                onRollOpening: concat1(prev?.onRollOpening, cur?.onRollOpening),
            }
        },
        base
    )
}
