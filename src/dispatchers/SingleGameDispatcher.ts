import { DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import {
    resultToSGEoG,
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'
import { concat0, concat1, concat2 } from './utils/concat'

export type SingleGameDispatcher = {
    doStartGame: () => (
        listener: Partial<Pick<SingleGameListener, 'onStartGame'>>
    ) => void
    doOpeningRoll: (
        state: SGOpening,
        dices: DiceRoll
    ) => (
        listener: Partial<
            Pick<
                SingleGameListener,
                'onStartOpeningCheckerPlay' | 'onRerollOpening'
            >
        >
    ) => void
    doCommitCheckerPlay: (
        state: SGInPlay
    ) => (
        listener: Partial<
            Pick<SingleGameListener, 'onEndOfGame' | 'onAwaitRoll'>
        >
    ) => void
    doRoll: (
        state: SGToRoll,
        dices: DiceRoll
    ) => (
        listener: Partial<Pick<SingleGameListener, 'onStartCheckerPlay'>>
    ) => void
    doEndOfGame: (
        state: SGState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => (listeners: Partial<Pick<SingleGameListener, 'onEndOfGame'>>) => void
}

export type SingleGameListener = {
    onStartGame: () => void
    onStartOpeningCheckerPlay: (nextState: SGInPlay) => void
    onStartCheckerPlay: (nextState: SGInPlay) => void
    onRerollOpening: (nextState: SGOpening) => void
    onAwaitRoll: (nextState: SGToRoll, lastState: SGInPlay) => void
    onEndOfGame: (nextState: SGEoG, lastState?: SGInPlay) => void
}

export const singleGameDispatcher = {
    doStartGame: () => {
        return (listener: Partial<Pick<SingleGameListener, 'onStartGame'>>) => {
            listener.onStartGame?.()
        }
    },
    doOpeningRoll: (state: SGOpening, dices: DiceRoll) => {
        const nextState = state.doOpening(dices)
        return (
            listener: Partial<
                Pick<
                    SingleGameListener,
                    'onStartOpeningCheckerPlay' | 'onRerollOpening'
                >
            >
        ) => {
            if (nextState.tag === 'SGInPlay') {
                listener.onStartOpeningCheckerPlay?.(nextState)
            } else {
                listener.onRerollOpening?.(nextState)
            }
        }
    },
    doCommitCheckerPlay: (state: SGInPlay) => {
        const revertTo = state.revertTo
        const nextState = state.doCheckerPlayCommit(
            state.boardStateNode,
            revertTo
        )
        return (
            listener: Partial<
                Pick<SingleGameListener, 'onEndOfGame' | 'onAwaitRoll'>
            >
        ) => {
            if (nextState.tag === 'SGEoG') {
                listener.onEndOfGame?.(nextState, state)
            } else {
                listener.onAwaitRoll?.(nextState, state)
            }
        }
    },
    doRoll: (state: SGToRoll, dices: DiceRoll) => {
        const nextState = state.doRoll(dices)
        return (
            listener: Partial<Pick<SingleGameListener, 'onStartCheckerPlay'>>
        ) => {
            listener.onStartCheckerPlay?.(nextState)
        }
    },
    doEndOfGame: (sgState: SGState, result: SGResult, eog: EOGStatus) => {
        const nextState = resultToSGEoG(sgState, result, eog)
        return (
            listeners: Partial<Pick<SingleGameListener, 'onEndOfGame'>>
        ) => {
            listeners.onEndOfGame?.(nextState)
        }
    },
}

export function concatSGListeners(
    base: Partial<SingleGameListener>,
    ...listners: Partial<SingleGameListener>[]
): Partial<SingleGameListener> {
    return listners.reduce(
        (
            prev: Partial<SingleGameListener>,
            cur: Partial<SingleGameListener>
        ) => {
            return {
                onStartGame: concat0(prev?.onStartGame, cur?.onStartGame),
                onStartOpeningCheckerPlay: concat1(
                    prev?.onStartOpeningCheckerPlay,
                    cur?.onStartOpeningCheckerPlay
                ),
                onStartCheckerPlay: concat1(
                    prev?.onStartCheckerPlay,
                    cur?.onStartCheckerPlay
                ),
                onRerollOpening: concat1(
                    prev?.onRerollOpening,
                    cur?.onRerollOpening
                ),
                onAwaitRoll: concat2(prev?.onAwaitRoll, cur?.onAwaitRoll),
                onEndOfGame: concat1(prev?.onEndOfGame, cur?.onEndOfGame),
            }
        },
        base
    )
}
export function setSGStateListener(
    defaultSGState: SGState,
    setState: (state: SGState) => void
): SingleGameListener {
    return {
        onStartGame: () => setState(defaultSGState),
        onStartOpeningCheckerPlay: setState,
        onStartCheckerPlay: setState,
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
