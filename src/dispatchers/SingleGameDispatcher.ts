import { DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { SingleGameListener } from './SingleGameListener'
import { SGInPlay, SGOpening, SGState, SGToRoll } from './SingleGameState'
import { sgResultToSGEoG } from './utils/sgResultToSGEoG'

/**
 * SingleGameについての操作を受け付け、結果に応じてListenerを呼ぶ。
 *
 */
export type SingleGameDispatcher = {
    // ゲームを開始する
    doStartGame: () => (
        listener: Pick<SingleGameListener, 'onGameStarted'>
    ) => void

    // オープニングロールを行う
    doOpeningRoll: (
        state: SGOpening,
        dices: DiceRoll
    ) => (
        listener: Pick<
            SingleGameListener,
            'onOpeningCheckerPlayStarted' | 'onRerollOpening'
        >
    ) => void

    // チェッカープレイを確定させる
    doCommitCheckerPlay: (
        state: SGInPlay
    ) => (
        listener: Pick<
            SingleGameListener,
            'onEndOfGame' | 'onAwaitRoll' | 'onCheckerPlayCommitted'
        >
    ) => void

    // ロールを行う
    doRoll: (
        state: SGToRoll,
        dices: DiceRoll
    ) => (listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>) => void

    // 終局する
    doEndOfGame: (
        state: SGState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => (listeners: Pick<SingleGameListener, 'onEndOfGame'>) => void
}

/**
 * SingleGameDispatcherオブジェクトを生成する
 */
export const singleGameDispatcher: SingleGameDispatcher = {
    doStartGame: () => {
        return (listener: Pick<SingleGameListener, 'onGameStarted'>) => {
            listener.onGameStarted()
        }
    },
    doOpeningRoll: (state: SGOpening, dices: DiceRoll) => {
        const nextState = state.doOpening(dices)
        return (
            listener: Pick<
                SingleGameListener,
                'onOpeningCheckerPlayStarted' | 'onRerollOpening'
            >
        ) => {
            if (nextState.tag === 'SGInPlay') {
                listener.onOpeningCheckerPlayStarted(nextState)
            } else {
                listener.onRerollOpening(nextState)
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
            listener: Pick<
                SingleGameListener,
                'onEndOfGame' | 'onAwaitRoll' | 'onCheckerPlayCommitted'
            >
        ) => {
            listener.onCheckerPlayCommitted(state)
            if (nextState.tag === 'SGEoG') {
                listener.onEndOfGame(nextState)
            } else {
                listener.onAwaitRoll(nextState)
            }
        }
    },
    doRoll: (state: SGToRoll, dices: DiceRoll) => {
        const nextState = state.doRoll(dices)
        return (listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>) => {
            listener.onCheckerPlayStarted(nextState)
        }
    },
    doEndOfGame: (sgState: SGState, result: SGResult, eog: EOGStatus) => {
        const nextState = sgResultToSGEoG(sgState, result, eog)
        return (listeners: Pick<SingleGameListener, 'onEndOfGame'>) => {
            listeners.onEndOfGame(nextState)
        }
    },
}

export function setSGStateListener(
    defaultSGState: SGState,
    setState: (state: SGState) => void
): SingleGameListener {
    return {
        onGameStarted: () => setState(defaultSGState),
        onOpeningCheckerPlayStarted: setState,
        onCheckerPlayStarted: setState,
        onCheckerPlayCommitted: () => {
            //
        },
        onRerollOpening: setState,
        onAwaitRoll: setState,
        onEndOfGame: setState,
    }
}
