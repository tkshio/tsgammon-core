import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGEventHandlers, concatBGListeners } from './BGEventHandlers'
import {
    CubeGameDispatcher,
    cubeGameDispatcher,
    CubeGameListeners,
} from './CubeGameDispatcher'

import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from './CubeGameState'
import { eogEventHandlers } from './EOGEventHandlers'
import { RollListener, rollListeners } from './RollDispatcher'
import { concatSGListeners, SingleGameListeners } from './SingleGameDispatcher'
import {
    singleGameEventHandlers,
    SingleGameEventHandlers,
} from './SingleGameEventHandlers'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'

export type BGEventHandlersExtensible = BGEventHandlers & {
    addListeners: (
        toAdd: Partial<SingleGameListeners & BGListeners>
    ) => BGEventHandlersExtensible
    addBGListeners: (toAdd: Partial<BGListeners>) => BGEventHandlersExtensible
}

export function cubefulGameEventHandlers(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<SingleGameListeners & BGListeners>[]
): BGEventHandlersExtensible {
    return _cubefulGameEventHandlers(
        isCrawford,
        rollListener,
        {},
        {},
        ...listeners
    )
}
function _cubefulGameEventHandlers(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    _bgListeners: Partial<BGListeners>,
    _sgListeners: Partial<SingleGameListeners>,
    ...listeners: Partial<SingleGameListeners & BGListeners>[]
): BGEventHandlersExtensible & {
    sgListeners: Partial<SingleGameListeners>
} {
    const bgListeners = listeners.reduce(
        (prev, cur) => concatBGListeners(prev, cur),
        _bgListeners
    )

    const sgListeners = listeners.reduce(
        (prev, cur) => concatSGListeners(prev, cur),
        _sgListeners
    )

    const { onEndOfCubeGame } = eogEventHandlers(bgListeners)

    const sgEventHandlers = (cbState?: CBState) =>
        singleGameEventHandlers(
            rollListener,
            cubefulSGListener(
                sgListeners,
                isCrawford,
                cbState,
                onEndOfCubeGame,
                bgListeners
            )
        )

    const handlers = buildBGEventHandlers(
        concatBGListeners(bgListeners, {
            onTake: (bgState: { cbState: CBToRoll; sgState: SGToRoll }) => {
                handlers.onRoll(bgState)
            },
        }),
        sgEventHandlers
    )
    function addListeners(
        ...toAdd: Partial<SingleGameListeners & BGListeners>[]
    ) {
        return _cubefulGameEventHandlers(
            isCrawford,
            rollListener,
            bgListeners,
            sgListeners,
            ...toAdd
        )
    }
    function addBGListeners(toAdd: Partial<BGListeners>) {
        return _cubefulGameEventHandlers(
            isCrawford,
            rollListener,
            concatBGListeners(bgListeners, toAdd),
            sgListeners
        )
    }
    return {
        ...handlers,
        addListeners,
        addBGListeners,
        sgListeners,
    }
}

function buildCBOnlyHandler(
    dispatcher: CubeGameDispatcher,
    bgListeners: Partial<BGListeners>
): CBOnlyHandler {
    function onDouble(bgState: { cbState: CBAction; sgState: SGToRoll }) {
        const result = dispatcher.doDouble(bgState.cbState)
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
    }

    function onTake(bgState: { cbState: CBResponse; sgState: SGToRoll }) {
        const result = dispatcher.doTake(bgState.cbState)
        // 自動ロール実施
        result({
            onTake: (nextState: CBToRoll) => {
                bgListeners.onTake?.(
                    {
                        cbState: nextState,
                        sgState: bgState.sgState,
                    },
                    bgState.cbState
                )
            },
        })
    }

    function onPass(bgState: { cbState: CBResponse; sgState: SGToRoll }) {
        const result = dispatcher.doPass(bgState.cbState)
        result({
            onEndOfCubeGame: (cbEoG: CBEoG) => {
                bgListeners.onEndOfCubeGame?.({
                    cbState: cbEoG,
                    sgState: bgState.sgState,
                })
            },
        })
    }

    return { onDouble, onTake, onPass }
}
function buildBGEventHandlers(
    bgListeners: Partial<BGListeners>,
    sgEventHandlers: (cbState?: CBState) => SingleGameEventHandlers
): BGEventHandlers {
    const cbEventHandlers = buildCBOnlyHandler(cubeGameDispatcher, bgListeners)

    return {
        onRollOpening: (bgState: {
            cbState: CBOpening
            sgState: SGOpening
        }) => {
            sgEventHandlers(bgState.cbState).onRollOpening(bgState.sgState)
        },

        onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            sgEventHandlers(bgState.cbState).onCommit(bgState.sgState)
        },

        onRoll: (bgState: {
            cbState: CBToRoll | CBAction
            sgState: SGToRoll
        }) => {
            sgEventHandlers(bgState.cbState).onRoll(bgState.sgState)
        },

        onStartGame: () => {
            sgEventHandlers().onStartGame()
        },

        onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => {
            cbEventHandlers.onDouble(bgState)
        },

        onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            cbEventHandlers.onTake(bgState)
        },

        onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            cbEventHandlers.onPass(bgState)
        },
    }
}

type InternalCBHandler = {
    onStartCubeGame: () => {
        accept: (...listeners: Partial<CubeGameListeners>[]) => void
    }
    onStartOpeningCheckerPlay: (
        state: CBOpening,
        isRed: boolean
    ) => { accept: (...listeners: Partial<CubeGameListeners>[]) => void }

    onStartCheckerPlay: (state: CBToRoll | CBAction) => {
        accept: (...listeners: Partial<CubeGameListeners>[]) => void
    }
    onStartCubeAction: (
        state: CBInPlay,
        skipCubeAction: boolean
    ) => {
        accept: (...listeners: Partial<CubeGameListeners>[]) => void
    }
}

type CBOnlyHandler = {
    onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => void
    onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
    onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
}

// BGEventHandlerの結果として呼ばれる処理（すなわち、
// BGEventHandlerに処理を追加するためのインターフェース）
export type BGListeners = {
    onStartCubeGame: () => void
    onStartCubeAction: (bgState: {
        cbState: CBAction
        sgState: SGToRoll
    }) => void
    onSkipCubeAction: (bgState: {
        cbState: CBToRoll
        sgState: SGToRoll
    }) => void
    onDouble: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        lastState: CBAction
    ) => void
    onTake: (
        bgState: { cbState: CBToRoll; sgState: SGToRoll },
        lastState: CBResponse
    ) => void
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void
    onEndOfCubeGame: (bgState: { cbState: CBEoG; sgState: SGState }) => void
}

function cubefulSGListener(
    sgListener: Partial<SingleGameListeners>,
    skipCubeAction: boolean,
    state: CBState | undefined,
    onEndOfCubeGame: (
        bgState: { cbState: CBInPlay; sgState: SGEoG },
        sgResult: SGResult,
        eogStatus: EOGStatus
    ) => void,

    bgListeners: Partial<BGListeners>
): Partial<SingleGameListeners> {
    return concatSGListeners(
        sgListener,
        appendCBListeners(skipCubeAction, state, onEndOfCubeGame, bgListeners)
    )
}

function appendCBListeners(
    skipCubeAction: boolean,
    state: CBState | undefined,
    onEndOfCubeGame: (
        state: { cbState: CBInPlay; sgState: SGEoG },
        sgResult: SGResult,
        eogStatus: EOGStatus
    ) => void,
    bgListeners: Partial<BGListeners>
) {
    const cbHandlers: InternalCBHandler = buildInternalCBHandlers()
    if (state === undefined) {
        return {
            onStartGame: () => {
                cbHandlers.onStartCubeGame().accept({
                    onStartCubeGame: () => {
                        bgListeners.onStartCubeGame?.()
                    },
                })
            },
        }
    }
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                cbHandlers
                    .onStartOpeningCheckerPlay(state, sgInPlay.isRed)
                    .accept({
                        onAwaitCheckerPlay: (nextState: CBInPlay) => {
                            bgListeners.onAwaitCheckerPlay?.({
                                cbState: nextState,
                                sgState: sgInPlay,
                            })
                        },
                    })
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                cbHandlers.onStartCubeAction(state, skipCubeAction).accept({
                    onStartCubeAction: (nextState: CBAction) => {
                        bgListeners.onStartCubeAction?.({
                            cbState: nextState,
                            sgState: sgToRoll,
                        })
                    },
                    onSkipCubeAction: (nextState: CBToRoll) => {
                        bgListeners.onSkipCubeAction?.({
                            cbState: nextState,
                            sgState: sgToRoll,
                        })
                    },
                })
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                cbHandlers.onStartCheckerPlay(state).accept({
                    onAwaitCheckerPlay: (nextState: CBInPlay) => {
                        bgListeners.onAwaitCheckerPlay?.({
                            cbState: nextState,
                            sgState: sgInPlay,
                        })
                    },
                })
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            if (state.tag === 'CBInPlay') {
                onEndOfCubeGame(
                    { cbState: state, sgState: sgEoG },
                    sgEoG.result,
                    sgEoG.eogStatus
                )
            } else {
                console.warn('Unexpected state', state, sgEoG)
            }
        },
    }
}

function buildInternalCBHandlers(): InternalCBHandler {
    const dispatcher: CubeGameDispatcher = cubeGameDispatcher

    function onStartCubeGame() {
        return {
            accept: (...listeners: Partial<CubeGameListeners>[]) => {
                const result = dispatcher.doStartCubeGame()
                listeners.forEach(result)
            },
        }
    }
    function onStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
        return {
            accept: (...listeners: Partial<CubeGameListeners>[]) => {
                const result = dispatcher.doStartOpeningCheckerPlay(
                    state,
                    isRed
                )
                listeners.forEach(result)
            },
        }
    }

    function onStartCheckerPlay(state: CBToRoll | CBAction) {
        return {
            accept: (...listeners: Partial<CubeGameListeners>[]) => {
                const result = dispatcher.doStartCheckerPlay(state)
                listeners.forEach(result)
            },
        }
    }

    function onStartCubeAction(state: CBInPlay, skipCubeAction: boolean) {
        return {
            accept: (...listeners: Partial<CubeGameListeners>[]) => {
                const result = dispatcher.doStartCubeAction(
                    state,
                    skipCubeAction
                )
                listeners.forEach(result)
            },
        }
    }

    return {
        onStartCubeGame,
        onStartOpeningCheckerPlay,
        onStartCheckerPlay,
        onStartCubeAction,
    }
}
