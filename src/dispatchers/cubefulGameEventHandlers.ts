import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGEventHandlers } from './BGEventHandlers'
import { BGState } from './BGState'
import { cubeGameDispatcher, CubeGameListeners } from './CubeGameDispatcher'
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
import { EventHandlerAddOn } from './EventHandlerBuilder'
import { RollListener, rollListeners } from './RollDispatcher'
import {
    buildSGEventHandlers,
    SGEventHandlerAddOn,
    SingleGameEventHandlers,
} from './SingleGameEventHandlers'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from './SingleGameState'

export function cubefulGameEventHandlers(
    isCrawford: boolean,
    defaultState: BGState,
    setSGState: (sgState: SGState) => void,
    setCBState: (cbState: CBState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: EventHandlerAddOn<
        CubeGameEventHandlers & SingleGameEventHandlers,
        CubeGameListeners & SingleGameEventHandlers
    >[]
): {
    handlers: BGEventHandlers
} {
    const { cbState: defaultCBState, sgState: defaultSGState } = defaultState

    const { handlers: cbEventHandlers } = buildCBEventHandlers(
        cubeGameDispatcher(isCrawford),
        defaultCBState,
        setCBState,
        ...addOns
    )

    const sgEventHandlers = (cbState?: CBState) =>
        buildSGEventHandlers(
            defaultSGState,
            setSGState,
            rollListener,
            cbState
                ? cubefulSGListener(cbState, cbEventHandlers)
                : { eventHandlers: {}, listeners: {} },
            ...addOns
        ).handlers

    const handlers = {
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
    return {
        handlers,
    }
}

function cubefulSGListener(
    state: CBState,
    eventHandlers: CubeGameEventHandlers
): SGEventHandlerAddOn {
    return {
        eventHandlers: {},
        listeners: {
            // オープニングロールがあった：手番を設定してInPlay状態に遷移
            onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
                if (state.tag === 'CBOpening') {
                    eventHandlers.onStartOpeningCheckerPlay(
                        state,
                        sgInPlay.isRed
                    )
                } else {
                    console.warn('Unexpected state', state, sgInPlay)
                }
            },

            // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
            onAwaitRoll: (sgToRoll: SGToRoll) => {
                if (state.tag === 'CBInPlay') {
                    eventHandlers.onStartCubeAction(state)
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
                eventHandlers.onEndOfCubeGame(
                    state,
                    sgEoG.result,
                    sgEoG.eogStatus
                )
            },
        },
    }
}
