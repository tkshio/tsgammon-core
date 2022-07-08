import { CubeGameDispatcher, CubeGameListeners } from './CubeGameDispatcher'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from './CubeGameState'
import { concat0, concat1, concat2 } from './utils/concat'

export type CubeGameEventHandlers = {
    onStartCubeGame: () => void

    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void
    onStartCubeAction: (cbState: CBInPlay, skipCubeAction: boolean) => void
    onSkipCubeAction: (cbState: CBAction) => void
}

export function buildCBEventHandlers(
    dispatcher: CubeGameDispatcher,
    listeners: Partial<CubeGameListeners>
): CubeGameEventHandlers {
    return {
        onStartCubeGame,
        onDouble,
        onTake,
        onPass,
        onSkipCubeAction,
        onStartCubeAction,
        onStartOpeningCheckerPlay,
        onStartCheckerPlay,
    }

    function onStartCubeGame() {
        const result = dispatcher.doStartCubeGame()
        result(listeners)
    }
    function onDouble(state: CBAction) {
        const result = dispatcher.doDouble(state)
        result(listeners)
    }

    function onTake(state: CBResponse) {
        const result = dispatcher.doTake(state)
        result(listeners)
    }

    function onPass(state: CBResponse) {
        const result = dispatcher.doPass(state)
        result(listeners)
    }

    function onSkipCubeAction(state: CBAction) {
        const result = dispatcher.doSkipCubeAction(state)
        result(listeners)
    }

    function onStartCubeAction(state: CBInPlay, skipCubeAction: boolean): void {
        const result = dispatcher.doStartCubeAction(state, skipCubeAction)
        result(listeners)
    }

    function onStartOpeningCheckerPlay(state: CBOpening, isRed: boolean) {
        const result = dispatcher.doStartOpeningCheckerPlay(state, isRed)
        result(listeners)
    }

    function onStartCheckerPlay(state: CBAction | CBToRoll) {
        const result = dispatcher.doStartCheckerPlay(state)
        result(listeners)
    }
}

export function concatCBEventHandlers(
    prev: Partial<CubeGameEventHandlers>,
    cur: Partial<CubeGameEventHandlers>
): Partial<CubeGameEventHandlers> {
    return {
        onStartCubeGame: concat0(prev?.onStartCubeGame, cur?.onStartCubeGame),
        onDouble: concat1(prev?.onDouble, cur?.onDouble),
        onTake: concat1(prev?.onTake, cur?.onTake),
        onPass: concat1(prev?.onPass, cur?.onPass),
        onStartCubeAction: concat2(
            prev?.onStartCubeAction,
            cur?.onStartCubeAction
        ),
        onSkipCubeAction: concat1(
            prev?.onSkipCubeAction,
            cur?.onSkipCubeAction
        ),
        onStartCheckerPlay: concat1(
            prev?.onStartCheckerPlay,
            cur?.onStartCheckerPlay
        ),
        onStartOpeningCheckerPlay: concat2(
            prev?.onStartOpeningCheckerPlay,
            cur?.onStartOpeningCheckerPlay
        ),
    }
}
