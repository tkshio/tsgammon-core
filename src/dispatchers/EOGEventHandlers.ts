import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { BGListener } from './BGListener'
import { BGState } from './BGState'
import { cubeGameDispatcher } from './CubeGameDispatcher'
import { CBEoG } from './CubeGameState'
import { singleGameDispatcher } from './SingleGameDispatcher'
import { SingleGameListener } from './SingleGameListener'
import { SGState } from './SingleGameState'
import { concat1, concat2 } from './utils/concat'

export function eogEventHandler(...listeners: Partial<BGListener>[]) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur), {}),
    }
    return {
        onEndOfBGGame: (
            bgState: BGState,
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
                    listener.onEndOfBGGame?.({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    function concatEOGListeners(
        listener1: Partial<Pick<BGListener, 'onEndOfBGGame'>>,
        listener2: Partial<Pick<BGListener, 'onEndOfBGGame'>>
    ): Partial<Pick<BGListener, 'onEndOfBGGame'>> {
        return {
            onEndOfBGGame: concat1(
                listener1.onEndOfBGGame,
                listener2.onEndOfBGGame
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
