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
import { concat0, concat1, concat2 } from './utils/concat'

export type CubeGameDispatcher = {
    doStartCubeGame: () => (
        listener: Partial<Pick<CubeGameListener, 'onStartCubeGame'>>
    ) => void
    // キューブアクション固有のU.I.から能動的に使用する操作
    doDouble: (
        state: CBAction
    ) => (listeners: Partial<Pick<CubeGameListener, 'onDouble'>>) => void
    doSkipCubeAction: (
        state: CBAction
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onSkipCubeAction'>>
    ) => void
    doTake: (
        state: CBResponse
    ) => (listeners: Partial<Pick<CubeGameListener, 'onTake'>>) => void
    doPass: (
        state: CBResponse
    ) => (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => void

    // ゲームの進行状況に対応して受動的に使用される操作
    doStartCubeAction: (
        state: CBInPlay,
        skipCubeAction: boolean
    ) => (
        listeners: Partial<
            Pick<
                CubeGameListener,
                'onStartCubeAction' | 'onSkipCubeAction' | 'onAwaitCubeAction'
            >
        >
    ) => void
    doStartOpeningCheckerPlay: (
        state: CBOpening,
        isRed: boolean
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => void
    doStartCheckerPlay: (
        state: CBAction | CBToRoll
    ) => (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => void
    doEndOfCubeGame: (
        state: CBState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => void
}

export type CubeGameListener = {
    onStartCubeGame: () => void

    onAwaitCubeAction: (nextState: CBAction | CBToRoll) => void
    onStartCubeAction: (nextState: CBAction) => void
    onSkipCubeAction: (nextState: CBToRoll) => void
    onAwaitCheckerPlay: (nextState: CBInPlay) => void

    onDouble: (nextState: CBResponse, lastState: CBAction) => void
    onTake: (nextState: CBToRoll, lastState: CBResponse) => void
    onEndOfCubeGame: (nextState: CBEoG, lastState?: CBResponse) => void
}

export function concatCBListeners(
    base: Partial<CubeGameListener>,
    ...listeners: Partial<CubeGameListener>[]
): Partial<CubeGameListener> {
    return listeners.reduce(
        (prev: Partial<CubeGameListener>, cur: Partial<CubeGameListener>) => {
            return {
                onStartCubeGame: concat0(
                    prev?.onStartCubeGame,
                    cur?.onStartCubeGame
                ),
                onAwaitCubeAction: concat1(
                    prev?.onAwaitCubeAction,
                    cur?.onAwaitCubeAction
                ),
                onStartCubeAction: concat1(
                    prev?.onStartCubeAction,
                    cur?.onStartCubeAction
                ),
                onAwaitCheckerPlay: concat1(
                    prev?.onAwaitCheckerPlay,
                    cur?.onAwaitCheckerPlay
                ),
                onDouble: concat2(prev?.onDouble, cur?.onDouble),
                onTake: concat2(prev?.onTake, cur?.onTake),
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
): CubeGameListener {
    return {
        onStartCubeGame: () => setCBState(defaultState),
        onAwaitCubeAction: () => {
            //
        },
        onStartCubeAction: setCBState,
        onAwaitCheckerPlay: setCBState,
        onDouble: setCBState,
        onTake: setCBState,
        onSkipCubeAction: setCBState,
        onEndOfCubeGame: setCBState,
    }
}

export const cubeGameDispatcher: CubeGameDispatcher = {
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
    return (listeners: Partial<Pick<CubeGameListener, 'onStartCubeGame'>>) => {
        listeners.onStartCubeGame?.()
    }
}
function doDouble(state: CBAction) {
    const nextState: CBResponse = state.doDouble()
    return (listeners: Partial<Pick<CubeGameListener, 'onDouble'>>) => {
        listeners.onDouble?.(nextState, state)
    }
}

function doSkipCubeAction(state: CBAction) {
    const nextState = state.doSkipCubeAction()
    return (listeners: Partial<Pick<CubeGameListener, 'onSkipCubeAction'>>) => {
        listeners.onSkipCubeAction?.(nextState)
    }
}

function doTake(state: CBResponse) {
    const nextState: CBToRoll = state.doTake()
    return (listeners: Partial<Pick<CubeGameListener, 'onTake'>>) => {
        listeners.onTake?.(nextState, state)
    }
}

function doPass(state: CBResponse) {
    const nextState: CBEoG = state.doPass()
    return (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => {
        listeners.onEndOfCubeGame?.(nextState, state)
    }
}

function doStartCubeAction(state: CBInPlay, skipCubeAction: boolean) {
    const nextState: CBAction | CBToRoll =
        state.doStartCubeAction(skipCubeAction)
    return (
        listeners: Partial<
            Pick<
                CubeGameListener,
                'onStartCubeAction' | 'onSkipCubeAction' | 'onAwaitCubeAction'
            >
        >
    ) => {
        listeners.onAwaitCubeAction?.(nextState)
        if (nextState.tag === 'CBAction') {
            listeners.onStartCubeAction?.(nextState)
        } else {
            listeners.onSkipCubeAction?.(nextState)
        }
    }
}

function doStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
    const nextState: CBInPlay = isRed
        ? state.doStartCheckerPlayRed()
        : state.doStartCheckerPlayWhite()
    return (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => {
        listeners.onAwaitCheckerPlay?.(nextState)
    }
}

function doStartCheckerPlay(state: CBAction | CBToRoll) {
    const nextState: CBInPlay = state.doStartCheckerPlay()
    return (
        listeners: Partial<Pick<CubeGameListener, 'onAwaitCheckerPlay'>>
    ) => {
        listeners.onAwaitCheckerPlay?.(nextState)
    }
}

function doEndOfCubeGame(
    state: CBState,
    sgResult: SGResult,
    eogStatus: EOGStatus
) {
    const nextState: CBEoG = resultToCBEoG(state.cubeState, sgResult, eogStatus)
    return (listeners: Partial<Pick<CubeGameListener, 'onEndOfCubeGame'>>) => {
        listeners.onEndOfCubeGame?.(nextState)
    }
}
