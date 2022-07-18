import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGListener } from './BGListener'
import { cubeGameDispatcher } from './CubeGameDispatcher'
import { CBEoG, CBState } from './CubeGameState'
import {
    singleGameDispatcher,
    SingleGameListener,
} from './SingleGameDispatcher'
import { SGState } from './SingleGameState'
import { concat1, concat2 } from './utils/concat'

export function eogEventHandler(...listeners: Partial<BGListener>[]) {
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
        listener1: Partial<Pick<BGListener, 'onEndOfCubeGame'>>,
        listener2: Partial<Pick<BGListener, 'onEndOfCubeGame'>>
    ): Partial<Pick<BGListener, 'onEndOfCubeGame'>> {
        return {
            onEndOfCubeGame: concat1(
                listener1.onEndOfCubeGame,
                listener2.onEndOfCubeGame
            ),
        }
    }
}

export function eogEventHandlersSG(listeners: Partial<SingleGameListener>[]) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur)),
    }
    return {
        onEndOfGame: (sgState: SGState, sgResult: SGResult, eog: EOGStatus) => {
            const result = singleGameDispatcher.doEndOfGame(
                sgState,
                sgResult,
                eog
            )
            result(listener)
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<SingleGameListener, 'onEndOfGame'>>,
        listener2: Partial<Pick<SingleGameListener, 'onEndOfGame'>>
    ) {
        return {
            onEndOfGame: concat2(listener1.onEndOfGame, listener2.onEndOfGame),
        }
    }
}
