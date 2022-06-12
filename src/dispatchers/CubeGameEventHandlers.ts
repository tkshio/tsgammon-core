import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import {
    CubeGameListeners,
    CubeGameDispatcher,
    setCBStateListener,
    concatCBListeners,
} from './CubeGameDispatcher'
import {
    CBResponse,
    CBAction,
    CBOpening,
    CBToRoll,
    CBInPlay,
    CBState,
} from './CubeGameState'
import {
    EventHandlerAddOn,
    EventHandlerBuilder,
    wrap,
} from './EventHandlerBuilder'
import { concat0, concat1, concat2, concat3 } from './utils/concat'

export type CubeGameEventHandlers = {
    onStartCubeGame: () => void

    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void
    onStartCubeAction: (cbState: CBInPlay) => void
    onSkipCubeAction: (cbState: CBAction) => void
    onEndOfCubeGame: (
        cbState: CBState,
        result: SGResult,
        eogStatus: EOGStatus
    ) => void
}

export type CubeGameEventHandlerAddOn = EventHandlerAddOn<
    CubeGameEventHandlers,
    CubeGameListeners
>

export function buildCBEventHandlers(
    cbDispatcher: CubeGameDispatcher,
    defaultCBState: CBState,
    setCBState: (cbState: CBState) => void,
    ...addOns: {
        eventHandlers: Partial<CubeGameEventHandlers>
        listeners: Partial<CubeGameListeners>
    }[]
): { handlers: CubeGameEventHandlers } {
    const cbListeners: CubeGameListeners = setCBStateListener(
        defaultCBState,
        (state: CBState) => setCBState(state)
    )
    const builder = cbEventHandlersBuilder(cbDispatcher)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatCBEventHandlers, concatCBListeners)
    )

    return finalBuilder.build(cbListeners)
}

export function cbEventHandlersBuilder(
    dispatcher: CubeGameDispatcher
): EventHandlerBuilder<CubeGameEventHandlers, CubeGameListeners> {
    return builder

    function builder(addOn: CubeGameEventHandlerAddOn): {
        handlers: CubeGameEventHandlers
    } {
        const { eventHandlers, listeners } = addOn
        const base: CubeGameEventHandlers = {
            onStartCubeGame,
            onDouble,
            onTake,
            onPass,
            onSkipCubeAction,
            onStartCubeAction,
            onStartOpeningCheckerPlay,
            onStartCheckerPlay,
            onEndOfCubeGame,
        }
        return {
            handlers: concatCBEventHandlers(
                eventHandlers,
                base
            ) as CubeGameEventHandlers,
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

        function onStartCubeAction(state: CBInPlay): void {
            const result = dispatcher.doStartCubeAction(state)
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

        function onEndOfCubeGame(
            state: CBState,
            sgResult: SGResult,
            eogStatus: EOGStatus
        ) {
            const result = dispatcher.doEndOfCubeGame(
                state,
                sgResult,
                eogStatus
            )
            result(listeners)
        }
    }
}

export function concatCBEventHandlers(
    base: Partial<CubeGameEventHandlers>,
    ...handlers: Partial<CubeGameEventHandlers>[]
): Partial<CubeGameEventHandlers> {
    return handlers.reduce(
        (
            prev: Partial<CubeGameEventHandlers>,
            cur: Partial<CubeGameEventHandlers>
        ): Partial<CubeGameEventHandlers> => {
            return {
                onStartCubeGame: concat0(
                    prev?.onStartCubeGame,
                    cur?.onStartCubeGame
                ),
                onDouble: concat1(prev?.onDouble, cur?.onDouble),
                onTake: concat1(prev?.onTake, cur?.onTake),
                onPass: concat1(prev?.onPass, cur?.onPass),
                onStartCubeAction: concat1(
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
                onEndOfCubeGame: concat3(
                    prev?.onEndOfCubeGame,
                    cur?.onEndOfCubeGame
                ),
            }
        },
        base
    )
}
