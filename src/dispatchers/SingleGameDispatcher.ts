import { DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { SingleGameListener } from './SingleGameListener'
import {
    resultToSGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'
import { concat0, concat1, concat2 } from './utils/concat'

export type SingleGameDispatcher = {
    doStartGame: () => (
        listener: Partial<Pick<SingleGameListener, 'onGameStarted'>>
    ) => void
    doOpeningRoll: (
        state: SGOpening,
        dices: DiceRoll
    ) => (
        listener: Partial<
            Pick<
                SingleGameListener,
                'onOpeningCheckerPlayStarted' | 'onRerollOpening'
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
        listener: Partial<Pick<SingleGameListener, 'onCheckerPlayStarted'>>
    ) => void
    doEndOfGame: (
        state: SGState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => (listeners: Partial<Pick<SingleGameListener, 'onEndOfGame'>>) => void
}

export const singleGameDispatcher = {
    doStartGame: () => {
        return (
            listener: Partial<Pick<SingleGameListener, 'onGameStarted'>>
        ) => {
            listener.onGameStarted?.()
        }
    },
    doOpeningRoll: (state: SGOpening, dices: DiceRoll) => {
        const nextState = state.doOpening(dices)
        return (
            listener: Partial<
                Pick<
                    SingleGameListener,
                    'onOpeningCheckerPlayStarted' | 'onRerollOpening'
                >
            >
        ) => {
            if (nextState.tag === 'SGInPlay') {
                listener.onOpeningCheckerPlayStarted?.(nextState)
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
            listener: Partial<Pick<SingleGameListener, 'onCheckerPlayStarted'>>
        ) => {
            listener.onCheckerPlayStarted?.(nextState)
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
                onGameStarted: concat0(prev?.onGameStarted, cur?.onGameStarted),
                onOpeningCheckerPlayStarted: concat1(
                    prev?.onOpeningCheckerPlayStarted,
                    cur?.onOpeningCheckerPlayStarted
                ),
                onCheckerPlayStarted: concat1(
                    prev?.onCheckerPlayStarted,
                    cur?.onCheckerPlayStarted
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
        onGameStarted: () => setState(defaultSGState),
        onOpeningCheckerPlayStarted: setState,
        onCheckerPlayStarted: setState,
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
