import { BGEventHandler, concatBGListeners } from './BGEventHandler'
import { BGListener } from './BGListener'
import { cubeGameDispatcher } from './CubeGameDispatcher'

import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from './CubeGameState'
import { eogEventHandler } from './EOGEventHandlers'
import { RollListener, rollListener, withRL } from './RollDispatcher'
import { singleGameDispatcher } from './SingleGameDispatcher'
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type BGEventHandlersExtensible = BGEventHandler & {
    addListener: (toAdd: Partial<BGListener>) => BGEventHandlersExtensible
}

export function buildBGEventHandler(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rListener: RollListener = rollListener(),
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    return buildBGEventHandler_rec(skipCubeAction, rListener, {}, ...listeners)
}
function buildBGEventHandler_rec(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rListener: RollListener = rollListener(),
    _bgListeners: Partial<BGListener>,
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    const bgListeners = listeners.reduce(
        (prev, cur) => concatBGListeners(prev, cur),
        _bgListeners
    )

    const handlers = _buildBGEventHandler(
        skipCubeAction,
        rListener,
        bgListeners
    )

    function addListeners(...toAdd: Partial<BGListener>[]) {
        return buildBGEventHandler_rec(
            skipCubeAction,
            rListener,
            bgListeners,
            ...toAdd
        )
    }

    return {
        ...handlers,
        addListener: addListeners,
    }
}

function _buildBGEventHandler(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rollListener: RollListener,
    bgListeners: Partial<BGListener>
): BGEventHandler {
    const { onEndOfBGGame: onEndOfCubeGame } = eogEventHandler(bgListeners)
    const sgDispatcher = withRL(singleGameDispatcher, rollListener)

    const bgHandler = {
        onRollOpening: (bgState: {
            cbState: CBOpening
            sgState: SGOpening
        }) => {
            const sgResult = sgDispatcher.doOpeningRoll(bgState.sgState)
            sgResult({
                // オープニングロールがあった：手番を設定してInPlay状態に遷移
                onOpeningCheckerPlayStarted: (nextSGState: SGInPlay) => {
                    const cbResult =
                        cubeGameDispatcher.doStartOpeningCheckerPlay(
                            bgState.cbState,
                            nextSGState.isRed
                        )
                    cbResult({
                        onAwaitCheckerPlay: (nextCBState: CBInPlay) => {
                            bgListeners.onAwaitCheckerPlay?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
                onRerollOpening: (nextSGState: SGOpening) => {
                    bgListeners.onBGOpeningRerolled?.({
                        cbState: bgState.cbState,
                        sgState: nextSGState,
                    })
                },
            })
        },

        onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const sgResult = sgDispatcher.doCommitCheckerPlay(bgState.sgState)
            sgResult({
                // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
                onAwaitRoll: (nextSGState: SGToRoll) => {
                    const cbResult = cubeGameDispatcher.doStartCubeAction(
                        bgState.cbState,
                        skipCubeAction
                    )
                    cbResult({
                        onAwaitCubeAction: (
                            nextCBState: CBAction | CBToRoll
                        ) => {
                            bgListeners.onAwaitCubeAction?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                        onCubeActionStarted: (nextCBState: CBAction) => {
                            bgListeners.onCubeActionStarted?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                        onCubeActionSkipped: (nextCBState: CBToRoll) => {
                            bgListeners.onCubeActionSkipped?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
                onCheckerPlayCommitted: (committedState: SGInPlay) => {
                    bgListeners.onCommitted?.({
                        cbState: bgState.cbState,
                        sgState: committedState,
                    })
                },
                onEndOfGame: (nextSGState: SGEoG) => {
                    // ゲームが終了した：キューブを加味したスコアを算出
                    onEndOfCubeGame(
                        { cbState: bgState.cbState, sgState: nextSGState },
                        nextSGState.result,
                        nextSGState.eogStatus
                    )
                },
            })
        },

        onRoll: (bgState: {
            cbState: CBToRoll | CBAction
            sgState: SGToRoll
        }) => {
            const sgResult = sgDispatcher.doRoll(bgState.sgState)
            sgResult({
                // ロールがあった：InPlay状態に遷移
                onCheckerPlayStarted: (nextSGState: SGInPlay) => {
                    const cbResult = cubeGameDispatcher.doStartCheckerPlay(
                        bgState.cbState
                    )
                    cbResult({
                        onAwaitCheckerPlay: (nextCBState: CBInPlay) => {
                            bgListeners.onAwaitCheckerPlay?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
            })
        },

        onStartGame: () => {
            const sgResult = sgDispatcher.doStartGame()
            sgResult({
                onGameStarted: () => {
                    const cbResult = cubeGameDispatcher.doStartCubeGame()
                    cbResult({
                        onCubeGameStarted: () => {
                            bgListeners.onBGGameStarted?.()
                        },
                    })
                },
            })
        },

        onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doDouble(bgState.cbState)
            // キューブレスポンスにCBとSGの両方の情報を渡すため、bgListenersを呼ぶ
            result({
                onDoubled: (nextState: CBResponse) => {
                    bgListeners.onDoubled?.(
                        {
                            cbState: nextState,
                            sgState: bgState.sgState,
                        },
                        bgState.cbState
                    )
                },
            })
        },

        onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doTake(bgState.cbState)
            result({
                onDoubleAccepted: (nextState: CBToRoll) => {
                    bgListeners.onDoubleAccepted?.(
                        {
                            cbState: nextState,
                            sgState: bgState.sgState,
                        },
                        bgState.cbState
                    )
                    // Take後は自動ロール
                    bgHandler.onRoll({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
                onPassed: (_: CBResponse, isRedWon: boolean) => {
                    bgListeners.onPassed?.(bgState, isRedWon)
                },
            })
        },

        onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doPass(bgState.cbState)
            result({
                onEndOfCubeGame: (cbEoG: CBEoG) => {
                    bgListeners.onEndOfBGGame?.({
                        cbState: cbEoG,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    return bgHandler
}
