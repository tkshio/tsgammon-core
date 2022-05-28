import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
    resultToCBEoG,
} from './CubeGameState'
import { concat0, concat1 } from './utils/concat'

export type CubeGameDispatcher = {
    doStartCubeGame: () => (
        listener: Partial<Pick<CubeGameListeners, 'onStartCubeGame'>>
    ) => void
    // キューブアクション固有のU.I.から能動的に使用する操作
    doDouble: (
        state: CBAction
    ) => (listeners: Partial<Pick<CubeGameListeners, 'onDouble'>>) => void
    doSkipCubeAction: (
        state: CBAction
    ) => (
        listeners: Partial<Pick<CubeGameListeners, 'onSkipCubeAction'>>
    ) => void
    doTake: (
        state: CBResponse
    ) => (listeners: Partial<Pick<CubeGameListeners, 'onTake'>>) => void
    doPass: (
        state: CBResponse
    ) => (
        listeners: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>
    ) => void

    // ゲームの進行状況に対応して受動的に使用される操作
    doStartCubeAction: (
        state: CBInPlay
    ) => (
        listeners: Partial<
            Pick<CubeGameListeners, 'onStartCubeAction' | 'onSkipCubeAction'>
        >
    ) => void
    doStartOpeningCheckerPlay: (
        state: CBOpening,
        isRed: boolean
    ) => (
        listeners: Partial<Pick<CubeGameListeners, 'onAwaitCheckerPlay'>>
    ) => void
    doStartCheckerPlay: (
        state: CBAction | CBToRoll
    ) => (
        listeners: Partial<Pick<CubeGameListeners, 'onAwaitCheckerPlay'>>
    ) => void
    doEndOfCubeGame: (
        state: CBState,
        result: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus
    ) => (
        listeners: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>
    ) => void
}

export type CubeGameListeners = {
    onStartCubeGame: () => void

    onStartCubeAction: (nextState: CBAction) => void
    onAwaitCheckerPlay: (nextState: CBInPlay) => void
    onSkipCubeAction: (nextState: CBToRoll) => void

    onDouble: (nextState: CBResponse) => void
    onTake: (nextState: CBToRoll) => void
    onEndOfCubeGame: (nextState: CBEoG) => void
}

export function concatCBListeners(
    base: Partial<CubeGameListeners>,
    ...listeners: Partial<CubeGameListeners>[]
): Partial<CubeGameListeners> {
    return listeners.reduce(
        (prev: Partial<CubeGameListeners>, cur: Partial<CubeGameListeners>) => {
            return {
                onStartCubeGame: concat0(
                    prev?.onStartCubeGame,
                    cur?.onStartCubeGame
                ),
                onStartCubeAction: concat1(
                    prev?.onStartCubeAction,
                    cur?.onStartCubeAction
                ),
                onAwaitCheckerPlay: concat1(
                    prev?.onAwaitCheckerPlay,
                    cur?.onAwaitCheckerPlay
                ),
                onDouble: concat1(prev?.onDouble, cur?.onDouble),
                onTake: concat1(prev?.onTake, cur?.onTake),
                onSkipCubeAction: concat1(
                    prev?.onSkipCubeAction,
                    cur?.onSkipCubeAction
                ),
                onEndOfCubeGame: concat1(
                    prev?.onEndOfCubeGame,
                    cur?.onEndOfCubeGame
                ),
            }
        },
        base
    )
}

export function setCBStateListener(
    defaultState: CBState,
    setCBState: (cbState: CBState) => void
): CubeGameListeners {
    return {
        onStartCubeGame: () => setCBState(defaultState),
        onStartCubeAction: setCBState,
        onAwaitCheckerPlay: setCBState,
        onDouble: setCBState,
        onTake: setCBState,
        onSkipCubeAction: setCBState,
        onEndOfCubeGame: setCBState,
    }
}

export function cubeGameDispatcher(
    skipCubeAction: boolean
): CubeGameDispatcher {
    return {
        doStartCubeGame,
        doDouble,
        doSkipCubeAction,
        doTake,
        doPass,
        doStartCubeAction,
        doStartOpeningCheckerPlay,
        doStartCheckerPlay,
        doEndOfCubeGame,
    }

    function doStartCubeGame() {
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onStartCubeGame'>>
        ) => {
            if (listeners.onStartCubeGame) {
                listeners.onStartCubeGame()
            }
        }
    }
    function doDouble(state: CBAction) {
        const nextState: CBResponse = state.doDouble()
        return (listeners: Partial<Pick<CubeGameListeners, 'onDouble'>>) => {
            if (listeners.onDouble) {
                listeners.onDouble(nextState)
            }
        }
    }

    function doSkipCubeAction(state: CBAction) {
        const nextState = state.doSkipCubeAction()
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onSkipCubeAction'>>
        ) => {
            if (listeners.onSkipCubeAction) {
                listeners.onSkipCubeAction(nextState)
            }
        }
    }

    function doTake(state: CBResponse) {
        const nextState: CBToRoll = state.doTake()
        return (listeners: Partial<Pick<CubeGameListeners, 'onTake'>>) => {
            if (listeners.onTake) {
                listeners.onTake(nextState)
            }
        }
    }

    function doPass(state: CBResponse) {
        const nextState: CBEoG = state.doPass()
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>
        ) => {
            if (listeners.onEndOfCubeGame) {
                listeners.onEndOfCubeGame(nextState)
            }
        }
    }

    function doStartCubeAction(state: CBInPlay) {
        const nextState: CBAction | CBToRoll =
            state.doStartCubeAction(skipCubeAction)
        return (
            listeners: Partial<
                Pick<
                    CubeGameListeners,
                    'onStartCubeAction' | 'onSkipCubeAction'
                >
            >
        ) => {
            if (nextState.tag === 'CBAction') {
                if (listeners.onStartCubeAction) {
                    listeners.onStartCubeAction(nextState)
                }
            } else {
                if (listeners.onSkipCubeAction) {
                    listeners.onSkipCubeAction(nextState)
                }
            }
        }
    }

    function doStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
        const nextState: CBInPlay = isRed
            ? state.doStartCheckerPlayRed()
            : state.doStartCheckerPlayWhite()
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onAwaitCheckerPlay'>>
        ) => {
            if (listeners.onAwaitCheckerPlay) {
                listeners.onAwaitCheckerPlay(nextState)
            }
        }
    }

    function doStartCheckerPlay(state: CBAction | CBToRoll) {
        const nextState: CBInPlay = state.doStartCheckerPlay()
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onAwaitCheckerPlay'>>
        ) => {
            if (listeners.onAwaitCheckerPlay) {
                listeners.onAwaitCheckerPlay(nextState)
            }
        }
    }

    function doEndOfCubeGame(
        state: CBState,
        sgResult: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus
    ) {
        const nextState: CBEoG = resultToCBEoG(
            state.cubeState,
            sgResult,
            eogStatus
        )
        return (
            listeners: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>
        ) => {
            if (listeners.onEndOfCubeGame) {
                listeners.onEndOfCubeGame(nextState)
            }
        }
    }
}
