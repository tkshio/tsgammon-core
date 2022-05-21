import { BoardStateNode } from '../BoardStateNode'
import { DiceRoll } from '../Dices'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'

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
        state: SGInPlay,
        curBoardState: BoardStateNode
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
        doCommitCheckerPlay: (
            state: SGInPlay,
            curBoardState: BoardStateNode
        ) => {
            const revertTo = state.revertTo
            const nextState = state.doCheckerPlayCommit(curBoardState, revertTo)
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

export function fill(
    listeners: Partial<SingleGameListeners>
): SingleGameListeners {
    const doNothing: SingleGameListeners = {
        onStartGame: () => {
            //
        },
        onStartOpeningCheckerPlay: () => {
            //
        },
        onStartCheckerPlay: () => {
            //
        },
        onRerollOpening: () => {
            //
        },
        onAwaitRoll: () => {
            //
        },
        onEndOfGame: () => {
            //
        },
    }
    return {
        ...doNothing,
        ...listeners,
    }
}

export function concatSGListeners(
    base: Partial<SingleGameListeners>,
    ...listners: Partial<SingleGameListeners>[]
): SingleGameListeners {
    return listners.reduce(
        (prev: SingleGameListeners, cur: Partial<SingleGameListeners>) => {
            const {
                onStartGame,
                onStartOpeningCheckerPlay,
                onStartCheckerPlay,
                onRerollOpening,
                onAwaitRoll,
                onEndOfGame,
            } = cur
            return {
                onStartGame: onStartGame
                    ? () => {
                          prev.onStartGame()
                          onStartGame()
                      }
                    : prev.onStartGame,
                onStartOpeningCheckerPlay: onStartOpeningCheckerPlay
                    ? (nextState: SGInPlay) => {
                          prev.onStartOpeningCheckerPlay(nextState)
                          onStartOpeningCheckerPlay(nextState)
                      }
                    : prev.onStartOpeningCheckerPlay,
                onStartCheckerPlay: onStartCheckerPlay
                    ? (nextState: SGInPlay) => {
                          prev.onStartCheckerPlay(nextState)
                          onStartCheckerPlay(nextState)
                      }
                    : prev.onStartCheckerPlay,
                onRerollOpening: onRerollOpening
                    ? (nextState: SGOpening) => {
                          prev.onRerollOpening(nextState)
                          onRerollOpening(nextState)
                      }
                    : prev.onRerollOpening,
                onAwaitRoll: onAwaitRoll
                    ? (nextState: SGToRoll) => {
                          prev.onAwaitRoll(nextState)
                          onAwaitRoll(nextState)
                      }
                    : prev.onAwaitRoll,
                onEndOfGame: onEndOfGame
                    ? (nextState: SGEoG) => {
                          prev.onEndOfGame(nextState)
                          onEndOfGame(nextState)
                      }
                    : prev.onEndOfGame,
            }
        },
        fill(base)
    )
}

export function setSGStateListener(
    defaultState: SGOpening,
    setState: (state: SGState) => void
): SingleGameListeners {
    return {
        onStartGame: () => setState(defaultState),
        onStartOpeningCheckerPlay: setState,
        onStartCheckerPlay: setState,
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
