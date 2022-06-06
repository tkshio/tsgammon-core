import { DiceRoll } from '../Dices'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'
import { concat0, concat1 } from './utils/concat'

export type SingleGameDispatcher = {
    doStartGame: () => (
        listener: Partial<Pick<SingleGameListeners, 'onStartGame'>>
    ) => void
    doOpeningRoll: (
        state: SGOpening,
        dices: DiceRoll
    ) => (
        listener: Partial<
            Pick<
                SingleGameListeners,
                'onStartOpeningCheckerPlay' | 'onRerollOpening'
            >
        >
    ) => void
    doCommitCheckerPlay: (
        state: SGInPlay
    ) => (
        listener: Partial<
            Pick<SingleGameListeners, 'onEndOfGame' | 'onAwaitRoll'>
        >
    ) => void
    doRoll: (
        state: SGToRoll,
        dices: DiceRoll
    ) => (
        listener: Partial<Pick<SingleGameListeners, 'onStartCheckerPlay'>>
    ) => void
}

export type SingleGameListeners = {
    onStartGame: () => void
    onStartOpeningCheckerPlay: (nextState: SGInPlay) => void
    onStartCheckerPlay: (nextState: SGInPlay) => void
    onRerollOpening: (nextState: SGOpening) => void
    onAwaitRoll: (nextState: SGToRoll) => void
    onEndOfGame: (nextState: SGEoG) => void
}

export function singleGameDispatcher(): SingleGameDispatcher {
    const dispatcher = {
        doStartGame: () => {
            return (
                listener: Partial<Pick<SingleGameListeners, 'onStartGame'>>
            ) => {
                if (listener.onStartGame) {
                    listener.onStartGame()
                }
            }
        },
        doOpeningRoll: (state: SGOpening, dices: DiceRoll) => {
            const nextState = state.doOpening(dices)
            return (
                listener: Partial<
                    Pick<
                        SingleGameListeners,
                        'onStartOpeningCheckerPlay' | 'onRerollOpening'
                    >
                >
            ) => {
                if (nextState.tag === 'SGInPlay') {
                    if (listener.onStartOpeningCheckerPlay) {
                        listener.onStartOpeningCheckerPlay(nextState)
                    }
                } else {
                    if (listener.onRerollOpening) {
                        listener.onRerollOpening(nextState)
                    }
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
                    Pick<SingleGameListeners, 'onEndOfGame' | 'onAwaitRoll'>
                >
            ) => {
                if (nextState.tag === 'SGEoG') {
                    if (listener.onEndOfGame) {
                        listener.onEndOfGame(nextState)
                    }
                } else {
                    if (listener.onAwaitRoll) {
                        listener.onAwaitRoll(nextState)
                    }
                }
            }
        },
        doRoll: (state: SGToRoll, dices: DiceRoll) => {
            const nextState = state.doRoll(dices)
            return (
                listener: Partial<
                    Pick<SingleGameListeners, 'onStartCheckerPlay'>
                >
            ) => {
                if (listener.onStartCheckerPlay) {
                    listener.onStartCheckerPlay(nextState)
                }
            }
        },
    }
    return dispatcher
}

export function concatSGListeners(
    base: Partial<SingleGameListeners>,
    ...listners: Partial<SingleGameListeners>[]
): Partial<SingleGameListeners> {
    return listners.reduce(
        (
            prev: Partial<SingleGameListeners>,
            cur: Partial<SingleGameListeners>
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
                onAwaitRoll: concat1(prev?.onAwaitRoll, cur?.onAwaitRoll),
                onEndOfGame: concat1(prev?.onEndOfGame, cur?.onEndOfGame),
            }
        },
        base
    )
}
export function setSGStateListener(
    defaultSGState: SGState,
    setState: (state: SGState) => void
): SingleGameListeners {
    return {
        onStartGame: () => setState(defaultSGState),
        onStartOpeningCheckerPlay: setState,
        onStartCheckerPlay: setState,
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
