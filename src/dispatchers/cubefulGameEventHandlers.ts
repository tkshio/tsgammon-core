import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGEventHandlers } from './BGEventHandlers'
import { BGState } from './BGState'
import {
    concatCBListeners,
    cubeGameDispatcher,
    CubeGameListeners,
} from './CubeGameDispatcher'
import {
    buildCBEventHandlers,
    CubeGameEventHandlers,
} from './CubeGameEventHandlers'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from './CubeGameState'
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
}

export function cubefulGameEventHandlers(
    isCrawford: boolean,
    rollListener: RollListener = rollListeners(),
    cbListeners: Partial<CubeGameListeners>,
    sgListeners: Partial<SingleGameListeners>
): BGEventHandlersExtensible & {
    sgListeners: Partial<SingleGameListeners>
    cbListeners: Partial<CubeGameListeners>
} {
    const cbEventHandlers = buildCBEventHandlers(
        cubeGameDispatcher,
        cbListeners
    )
    const sgEventHandlers = (cbState?: CBState) =>
        singleGameEventHandlers(
            rollListener,
            cbState
                ? concatSGListeners(
                      cubefulSGListener(isCrawford, cbState, cbEventHandlers),
                      sgListeners
                  )
                : sgListeners
        )

    const handlers = buildBGEventHandlers(cbEventHandlers, sgEventHandlers)
    function append(toAdd: Partial<SingleGameListeners & CubeGameListeners>) {
        const addedCB = concatCBListeners(cbListeners, toAdd)
        const addedSG = concatSGListeners(sgListeners, toAdd)

        return cubefulGameEventHandlers(
            isCrawford,
            rollListener,
            addedCB,
            addedSG
        )
    }
    return { ...handlers, addListeners: append, cbListeners, sgListeners }
}

function buildBGEventHandlers(
    cbEventHandlers: CubeGameEventHandlers,
    sgEventHandlers: (cbState?: CBState) => SingleGameEventHandlers
): BGEventHandlers {
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
            cbEventHandlers.onStartCubeGame()
        },

        onDouble: (bgState: { cbState: CBAction; sgState: SGState }) => {
            cbEventHandlers.onDouble(bgState.cbState)
        },

        onTake: (bgState: { cbState: CBResponse; sgState: SGState }) => {
            cbEventHandlers.onTake(bgState.cbState)
        },

        onPass: (bgState: { cbState: CBResponse; sgState: SGState }) => {
            cbEventHandlers.onPass(bgState.cbState)
        },

        onEndGame: (bgState: BGState, result: SGResult, eog: EOGStatus) => {
            cbEventHandlers.onEndOfCubeGame(bgState.cbState, result, eog)
        },
    }
}

function cubefulSGListener(
    skipCubeAction: boolean,
    state: CBState,
    eventHandlers: CubeGameEventHandlers
): Partial<SingleGameListeners> {
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                eventHandlers.onStartOpeningCheckerPlay(state, sgInPlay.isRed)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                eventHandlers.onStartCubeAction(state, skipCubeAction)
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                eventHandlers.onStartCheckerPlay(state)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            eventHandlers.onEndOfCubeGame(state, sgEoG.result, sgEoG.eogStatus)
        },
    }
}
