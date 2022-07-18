import { BGState } from '../dispatchers/BGState'
import { BGListeners } from '../dispatchers/cubefulGameEventHandlers'
import {
    CBAction,
    CBEoG,
    CBResponse,
    CBToRoll,
} from '../dispatchers/CubeGameState'
import { SingleGameListeners } from '../dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll,
} from '../dispatchers/SingleGameState'
import { GameConf } from '../GameConf'
import {
    PlyRecordEoG,
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
    PlyRecordInPlay,
} from './PlyRecord'
import { PlyStateRecord } from './PlyStateRecord'
import { SGResult } from './SGResult'

export type MatchRecorder<T> = {
    recordPly: (plyRecord: PlyRecordInPlay, lastState: T) => void
    recordEoG: (plyRecord: PlyRecordEoG) => void
    resetCurGame: () => void
    resumeTo: (index: number) => PlyStateRecord<T>
}

export function matchRecorderAsSGAddOn(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListeners> {
    return {
        onAwaitRoll: (_: SGToRoll, lastState: SGInPlay) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(lastState.curPly),
                lastState
            )
        },

        onStartGame: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfGame: (sgEoG: SGEoG) => {
            const { stake, result, eogStatus } = sgEoG
            matchRecorder.recordEoG(plyRecordForEoG(stake, result, eogStatus))
        },
    }
}

export function matchRecorderAsCBAddOn(
    gameConf: GameConf,
    sgState: SGState,
    matchRecorder: MatchRecorder<BGState>
): Partial<BGListeners & SingleGameListeners> {
    return {
        onDouble: (
            _: { cbState: CBResponse; sgState: SGToRoll },
            lastState: CBAction
        ) => {
            const plyRecord = plyRecordForDouble(
                lastState.cubeState,
                lastState.isRed
            )
            matchRecorder.recordPly(plyRecord, { cbState: lastState, sgState })
        },

        onTake: (
            _: { cbState: CBToRoll; sgState: SGToRoll },
            lastState: CBResponse
        ) => {
            const plyRecord = plyRecordForTake(lastState.isRed)
            matchRecorder.recordPly(plyRecord, { cbState: lastState, sgState })
        },

        onStartCubeGame: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfCubeGame: (
            bgState: { cbState: CBEoG; sgState: SGState },
            lastState?: CBResponse
        ) => {
            if (lastState !== undefined) {
                const plyRecord = plyRecordForPass(
                    lastState.isRed ? SGResult.WHITEWON : SGResult.REDWON
                )
                matchRecorder.recordPly(plyRecord, {
                    cbState: lastState,
                    sgState,
                })
            }
            const { stake, eogStatus } = bgState.cbState.calcStake(gameConf)
            const plyRecordEoG = plyRecordForEoG(
                stake,
                bgState.cbState.result,
                eogStatus
            )
            matchRecorder.recordEoG(plyRecordEoG)
        },
    }
}
