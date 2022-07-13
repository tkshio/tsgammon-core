import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { cubeGameDispatcher, CubeGameListeners } from './CubeGameDispatcher'
import { CBState } from './CubeGameState'
import {
    singleGameDispatcher,
    SingleGameListeners,
} from './SingleGameDispatcher'
import { SGState } from './SingleGameState'
import { concat2 } from './utils/concat'

export function eogEventHandlers(
    listeners: Partial<CubeGameListeners & SingleGameListeners>[]
) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur), {}),
    }
    return {
        onEndOfCubeGame: (
            cbState: CBState,
            sgResult: SGResult,
            eog: EOGStatus
        ) => {
            const result = cubeGameDispatcher.doEndOfCubeGame(
                cbState,
                sgResult,
                eog
            )
            result(listener)
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>,
        listener2: Partial<Pick<CubeGameListeners, 'onEndOfCubeGame'>>
    ) {
        return {
            onEndOfCubeGame: concat2(
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
