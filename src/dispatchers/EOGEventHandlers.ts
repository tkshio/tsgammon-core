import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGListeners } from './cubefulGameEventHandlers'
import { cubeGameDispatcher } from './CubeGameDispatcher'
import { CBEoG, CBState } from './CubeGameState'
import {
    singleGameDispatcher,
    SingleGameListeners,
} from './SingleGameDispatcher'
import { SGState } from './SingleGameState'
import { concat1, concat2 } from './utils/concat'

export function eogEventHandlers(
    /* SingleGameListenersは無視されるだけだが、引数を渡す側では混在している場合が多いので */
    ...listeners: Partial<BGListeners & SingleGameListeners>[]
) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur), {}),
    }
    return {
        onEndOfCubeGame: (
            bgState: { cbState: CBState; sgState: SGState },
            sgResult: SGResult,
            eog: EOGStatus
        ) => {
            const result = cubeGameDispatcher.doEndOfCubeGame(
                bgState.cbState,
                sgResult,
                eog
            )
            result({
                onEndOfCubeGame: (nextState: CBEoG) => {
                    listener.onEndOfCubeGame?.({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<BGListeners, 'onEndOfCubeGame'>>,
        listener2: Partial<Pick<BGListeners, 'onEndOfCubeGame'>>
    ): Partial<Pick<BGListeners, 'onEndOfCubeGame'>> {
        return {
            onEndOfCubeGame: concat1(
                listener1.onEndOfCubeGame,
                listener2.onEndOfCubeGame
            ),
        }
    }
}

export function eogEventHandlersSG(listeners: Partial<SingleGameListeners>[]) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur)),
    }
    return {
        onEndOfCubeGame: (
            sgState: SGState,
            sgResult: SGResult,
            eog: EOGStatus
        ) => {
            const result = singleGameDispatcher.doEndOfGame(
                sgState,
                sgResult,
                eog
            )
            result(listener)
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<SingleGameListeners, 'onEndOfGame'>>,
        listener2: Partial<Pick<SingleGameListeners, 'onEndOfGame'>>
    ) {
        return {
            onEndOfGame: concat2(listener1.onEndOfGame, listener2.onEndOfGame),
        }
    }
}
