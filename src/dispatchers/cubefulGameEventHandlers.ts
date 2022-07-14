import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGEventHandlers, concatBGListeners } from './BGEventHandlers'
import {
    concatCBListeners,
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
        toAdd: Partial<SingleGameListeners & CubeGameListeners>
    ) => BGEventHandlersExtensible
    addBGListeners: (toAdd: Partial<BGListeners>) => BGEventHandlersExtensible
}

export function cubefulGameEventHandlers(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<SingleGameListeners & CubeGameListeners>[]
): BGEventHandlersExtensible {
    return _cubefulGameEventHandlers(
        isCrawford,
        rollListener,
        {},
        {},
        {},
        ...listeners
    )
}
function _cubefulGameEventHandlers(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    bgListeners: Partial<BGListeners>,
    _sgListeners: Partial<SingleGameListeners>,
    _cbListeners: Partial<CubeGameListeners>,
    ...listeners: Partial<SingleGameListeners & CubeGameListeners>[]
): BGEventHandlersExtensible & {
    sgListeners: Partial<SingleGameListeners>
    cbListeners: Partial<CubeGameListeners>
} {
    const cbListeners = listeners.reduce(
        (prev, cur) => concatCBListeners(prev, cur),
        _cbListeners
    )

    const sgListeners = listeners.reduce(
        (prev, cur) => concatSGListeners(prev, cur),
        _sgListeners
    )

    const { onEndOfCubeGame } = eogEventHandlers(cbListeners)

    const sgEventHandlers = (cbState?: CBState) =>
        singleGameEventHandlers(
            rollListener,
            cubefulSGListener(
                sgListeners,
                isCrawford,
                cbState,
                onEndOfCubeGame,
                cbListeners,
                bgListeners
            )
        )

    const handlers = buildBGEventHandlers(
        cbListeners,
        bgListeners,
        sgEventHandlers
    )
    function append(
        ...toAdd: Partial<SingleGameListeners & CubeGameListeners>[]
    ) {
        return _cubefulGameEventHandlers(
            isCrawford,
            rollListener,
            bgListeners,
            sgListeners,
            cbListeners,
            ...toAdd
        )
    }
    function addBGListeners(toAdd: Partial<BGListeners>) {
        return _cubefulGameEventHandlers(
            isCrawford,
            rollListener,
            concatBGListeners(bgListeners, toAdd),
            sgListeners,
            cbListeners
        )
    }
    return {
        ...handlers,
        addListeners: append,
        addBGListeners,
        cbListeners,
        sgListeners,
    }
}

function buildCBOnlyHandler(
    dispatcher: CubeGameDispatcher,
    listeners: Partial<CubeGameListeners>,
    bgListeners: Partial<BGListeners>
): CBOnlyHandler {
    function onDouble(bgState: { cbState: CBAction; sgState: SGToRoll }) {
        const result = dispatcher.doDouble(bgState.cbState)
        result(listeners)
        result({
            onDouble: (nextState: CBResponse) => {
                bgListeners.onDouble?.({
                    cbState: nextState,
                    sgState: bgState.sgState,
                })
            },
        })
    }

    function onTake(state: CBResponse) {
        const result = dispatcher.doTake(state)
        result(listeners)
    }

    function onPass(state: CBResponse) {
        const result = dispatcher.doPass(state)
        result(listeners)
    }

    return { onDouble, onTake, onPass }
}
function buildBGEventHandlers(
    cbListeners: Partial<CubeGameListeners>,
    bgListeners: Partial<BGListeners>,
    sgEventHandlers: (cbState?: CBState) => SingleGameEventHandlers
): BGEventHandlers {
    const cbEventHandlers = buildCBOnlyHandler(
        cubeGameDispatcher,
        cbListeners,
        bgListeners
    )

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

        onTake: (bgState: { cbState: CBResponse; sgState: SGState }) => {
            cbEventHandlers.onTake(bgState.cbState)
        },

        onPass: (bgState: { cbState: CBResponse; sgState: SGState }) => {
            cbEventHandlers.onPass(bgState.cbState)
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
    onTake: (state: CBResponse) => void
    onPass: (state: CBResponse) => void
}

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
    onDouble: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void
    onEndOfCubeGame: (bgState: { cbState: CBEoG; sgState: SGEoG }) => void
}

function cubefulSGListener(
    sgListener: Partial<SingleGameListeners>,
    skipCubeAction: boolean,
    state: CBState | undefined,
    onEndOfCubeGame: (
        state: CBInPlay,
        sgResult: SGResult,
        eogStatus: EOGStatus
    ) => void,

    cbListeners: Partial<CubeGameListeners>,
    bgListeners: Partial<BGListeners>
): Partial<SingleGameListeners> {
    return concatSGListeners(
        sgListener,
        appendCBListeners(
            skipCubeAction,
            state,
            onEndOfCubeGame,
            cbListeners,
            bgListeners
        )
    )
}

function appendCBListeners(
    skipCubeAction: boolean,
    state: CBState | undefined,
    onEndOfCubeGame: (
        state: CBInPlay,
        sgResult: SGResult,
        eogStatus: EOGStatus
    ) => void,
    cbListeners: Partial<CubeGameListeners>,
    bgListeners: Partial<BGListeners>
) {
    const cbHandlers: InternalCBHandler = buildInternalCBHandlers()
    if (state === undefined) {
        return {
            onStartGame: () => {
                cbHandlers.onStartCubeGame().accept(cbListeners)
            },
        }
    }
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                cbHandlers
                    .onStartOpeningCheckerPlay(state, sgInPlay.isRed)
                    .accept(cbListeners, {
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
                cbHandlers
                    .onStartCubeAction(state, skipCubeAction)
                    .accept(cbListeners, {
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
                cbHandlers.onStartCheckerPlay(state).accept(cbListeners, {
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
                onEndOfCubeGame(state, sgEoG.result, sgEoG.eogStatus)
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
