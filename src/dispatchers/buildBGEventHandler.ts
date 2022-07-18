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
import { RollListener, rollListeners, withRL } from './RollDispatcher'
import { singleGameDispatcher } from './SingleGameDispatcher'
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type BGEventHandlersExtensible = BGEventHandler & {
    addListeners: (toAdd: Partial<BGListener>) => BGEventHandlersExtensible
}

export function buildBGEventHandler(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    return buildBGEventHandler_rec(isCrawford, rollListener, {}, ...listeners)
}
function buildBGEventHandler_rec(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    _bgListeners: Partial<BGListener>,
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    const bgListeners = listeners.reduce(
        (prev, cur) => concatBGListeners(prev, cur),
        _bgListeners
    )

    const handlers = _buildBGEventHandler(isCrawford, rollListener, bgListeners)

    function addListeners(...toAdd: Partial<BGListener>[]) {
        return buildBGEventHandler_rec(
            isCrawford,
            rollListener,
            bgListeners,
            ...toAdd
        )
    }

    return {
        ...handlers,
        addListeners,
    }
}

function _buildBGEventHandler(
    skipCubeAction: boolean,
    rollListener: RollListener,
    bgListeners: Partial<BGListener>
): BGEventHandler {
    const { onEndOfCubeGame } = eogEventHandler(bgListeners)
    const sgDispatcher = withRL(singleGameDispatcher, rollListener)

    const handler = {
        onRollOpening: (bgState: {
            cbState: CBOpening
            sgState: SGOpening
        }) => {
            const sgResult = sgDispatcher.doOpeningRoll(bgState.sgState)
            sgResult({
                // オープニングロールがあった：手番を設定してInPlay状態に遷移
                onStartOpeningCheckerPlay: (nextSGState: SGInPlay) => {
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
            })
        },

        onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const sgResult = sgDispatcher.doCommitCheckerPlay(bgState.sgState)
            sgResult({
                // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
                onAwaitRoll: (nextSGState: SGToRoll, lastState: SGInPlay) => {
                    const cbResult = cubeGameDispatcher.doStartCubeAction(
                        bgState.cbState,
                        skipCubeAction
                    )
                    cbResult({
                        onAwaitCubeAction: (
                            nextCBState: CBAction | CBToRoll
                        ) => {
                            bgListeners.onAwaitCubeAction?.(
                                { cbState: nextCBState, sgState: nextSGState },
                                { cbState: bgState.cbState, sgState: lastState }
                            )
                        },
                        onStartCubeAction: (nextCBState: CBAction) => {
                            bgListeners.onStartCubeAction?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                        onSkipCubeAction: (nextCBState: CBToRoll) => {
                            bgListeners.onSkipCubeAction?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
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
                onStartCheckerPlay: (nextSGState: SGInPlay) => {
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
                onStartGame: () => {
                    const cbResult = cubeGameDispatcher.doStartCubeGame()
                    cbResult({
                        onStartCubeGame: () => {
                            bgListeners.onStartCubeGame?.()
                        },
                    })
                },
            })
        },

        onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doDouble(bgState.cbState)
            // キューブレスポンスにCBとSGの両方の情報を渡すため、bgListenersを呼ぶ
            result({
                onDouble: (nextState: CBResponse) => {
                    bgListeners.onDouble?.(
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
                onTake: (nextState: CBToRoll) => {
                    bgListeners.onTake?.(
                        {
                            cbState: nextState,
                            sgState: bgState.sgState,
                        },
                        bgState.cbState
                    )
                    // Take後は自動ロール
                    handler.onRoll({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
            })
        },

        onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doPass(bgState.cbState)
            result({
                onEndOfCubeGame: (cbEoG: CBEoG) => {
                    bgListeners.onEndOfCubeGame?.({
                        cbState: cbEoG,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    return handler
}
