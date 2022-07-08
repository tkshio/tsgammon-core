import { EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { CubeGameListeners, cubeGameDispatcher } from './CubeGameDispatcher'
import { CBState, CBEoG, CBResponse } from './CubeGameState'
import { SingleGameListeners } from './SingleGameDispatcher'
import { concat2 } from './utils/concat'

export function eogEventHandlers(
    listeners: Partial<SingleGameListeners & CubeGameListeners>[]
) {
    const listener = {
        ...listeners.reduce((prev, cur) => concatEOGListeners(prev, cur)),
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
}
function concatEOGListeners(
    listener1: {
        onEndOfCubeGame?: (state: CBEoG, lastState?: CBResponse) => void
    },
    listener2: {
        onEndOfCubeGame?: (state: CBEoG, lastState?: CBResponse) => void
    }
) {
    return {
        onEndOfCubeGame: concat2(
            listener1.onEndOfCubeGame,
            listener2.onEndOfCubeGame
        ),
    }
}
