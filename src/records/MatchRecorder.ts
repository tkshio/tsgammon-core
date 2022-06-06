import { BGState } from '../dispatchers/BGState'
import { CubeGameListeners } from '../dispatchers/CubeGameDispatcher'
import { CubeGameEventHandlers } from '../dispatchers/CubeGameEventHandlers'
import { CBAction, CBResponse, CBEoG } from '../dispatchers/CubeGameState'
import { SingleGameListeners } from '../dispatchers/SingleGameDispatcher'
import { SingleGameEventHandlers } from '../dispatchers/SingleGameEventHandlers'
import { SGState, SGInPlay, SGEoG } from '../dispatchers/SingleGameState'
import { GameConf } from '../GameConf'
import {
    PlyRecordInPlay,
    PlyRecordEoG,
    plyRecordForCheckerPlay,
    plyRecordForEoG,
    plyRecordForDouble,
    plyRecordForTake,
    plyRecordForPass,
} from './PlyRecord'
import { PlyStateRecord } from './PlyStateRecord'
import { SGResult } from './SGResult'

export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => PlyStateRecord<T>
}

export function matchRecorderAsSGAddOn(matchRecorder: MatchRecorder<SGState>): {
    eventHandlers: Pick<SingleGameEventHandlers, 'onCommit' | 'onStartGame'>
    listeners: Pick<SingleGameListeners, 'onEndOfGame'>
} {
    return {
        eventHandlers: {
            onCommit: (sgState: SGInPlay) => {
                matchRecorder.recordPly(
                    plyRecordForCheckerPlay(sgState.curPly),
                    sgState
                )
            },
            onStartGame: () => {
                matchRecorder.resetCurGame()
            },
        },
        listeners: {
            onEndOfGame: (sgEoG: SGEoG) => {
                const { stake, result, eogStatus } = sgEoG
                matchRecorder.recordEoG(
                    plyRecordForEoG(stake, result, eogStatus)
                )
            },
        },
    }
}

export function matchRecorderAsCBAddOn(
    gameConf: GameConf,
    sgState: SGState,
    matchRecorder: MatchRecorder<BGState>
): {
    eventHandlers: Pick<
        CubeGameEventHandlers,
        'onDouble' | 'onTake' | 'onPass' | 'onStartCubeGame'
    >
    listeners: Pick<CubeGameListeners, 'onEndOfCubeGame'>
} {
    return {
        eventHandlers: {
            onDouble: (cbState: CBAction) => {
                const plyRecord = plyRecordForDouble(
                    cbState.cubeState,
                    cbState.isRed
                )
                matchRecorder.recordPly(plyRecord, { cbState, sgState })
            },

            onTake: (cbState: CBResponse) => {
                const plyRecord = plyRecordForTake(cbState.isRed)
                matchRecorder.recordPly(plyRecord, { cbState, sgState })
            },

            onPass: (cbState: CBResponse) => {
                const plyRecord = plyRecordForPass(
                    cbState.isRed ? SGResult.WHITEWON : SGResult.REDWON
                )
                matchRecorder.recordPly(plyRecord, { cbState, sgState })
            },
            onStartCubeGame: () => {
                matchRecorder.resetCurGame()
            },
        },
        listeners: {
            onEndOfCubeGame: (cbState: CBEoG) => {
                const { stake, eogStatus } = cbState.calcStake(gameConf)
                const plyRecordEoG = plyRecordForEoG(
                    stake,
                    cbState.result,
                    eogStatus
                )
                matchRecorder.recordEoG(plyRecordEoG)
            },
        },
    }
}
