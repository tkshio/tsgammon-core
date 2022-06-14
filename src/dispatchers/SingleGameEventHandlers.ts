import { DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import {
    EventHandlerAddOn,
    EventHandlerBuilder,
    wrap,
} from './EventHandlerBuilder'
import { RollListener, rollListeners } from './RollDispatcher'
import {
    concatSGListeners,
    setSGStateListener,
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners,
} from './SingleGameDispatcher'
import { SGInPlay, SGOpening, SGState, SGToRoll } from './SingleGameState'
import { concat0, concat1, concat3 } from './utils/concat'

export type SingleGameEventHandlers = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void

    onEndGame: (sgState: SGState, result: SGResult, eog: EOGStatus) => void
}

export type SGEventHandlerAddOn = EventHandlerAddOn<
    SingleGameEventHandlers,
    SingleGameListeners
>

export type SGEventHandlerBuilder = EventHandlerBuilder<
    SingleGameEventHandlers,
    SingleGameListeners
>

export function buildSGEventHandlers(
    defaultSGState: SGState,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: SGEventHandlerAddOn[]
): {
    handlers: SingleGameEventHandlers
} {
    const sgDispatcher = singleGameDispatcher()
    const builder = sgEventHandlersBuilder(sgDispatcher, rollListener)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatSGHandlers, concatSGListeners)
    )

    return finalBuilder.build(setSGStateListener(defaultSGState, setSGState))
}
export function sgEventHandlersBuilder(
    dispatcher: SingleGameDispatcher,
    rollListener: RollListener
): SGEventHandlerBuilder {
    return builder

    function builder(addOn: {
        eventHandlers: Partial<SingleGameEventHandlers>
        listeners: Partial<SingleGameListeners>
    }) {
        const { eventHandlers, listeners } = addOn
        const base: SingleGameEventHandlers = {
            onStartGame: () => {
                const result = dispatcher.doStartGame()
                result(listeners)
            },
            onCommit: (state) => {
                const result = dispatcher.doCommitCheckerPlay(state)
                result(listeners)
            },
            onRoll: (sgState: SGToRoll) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = dispatcher.doRoll(sgState, dices)
                    result(listeners)
                }),
            onRollOpening: (sgState: SGOpening) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = dispatcher.doOpeningRoll(sgState, dices)
                    result(listeners)
                }),
            onEndGame: (
                sgState: SGState,
                sgResult: SGResult,
                eog: EOGStatus
            ) => {
                const result = dispatcher.doEndOfGame(sgState, sgResult, eog)
                result(listeners)
            },
        }
        return {
            handlers: concatSGHandlers(
                eventHandlers,
                base
            ) as SingleGameEventHandlers,
            listeners,
        }
    }
}

function concatSGHandlers(
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
                onEndGame: concat3(prev?.onEndGame, cur?.onEndGame),
            }
        },
        base
    )
}