import { BGListener } from '../dispatchers/BGListener'
import { BGState } from '../dispatchers/BGState'
import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from '../dispatchers/CubeGameState'
import { SingleGameListener } from '../dispatchers/SingleGameListener'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll,
} from '../dispatchers/SingleGameState'
import { GameConf } from '../GameConf'
import {
    addPlyRecord,
    discardCurrentGame,
    eogRecord,
    MatchRecord,
    recordFinishedGame,
    trimPlyRecords,
} from './MatchRecord'
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

export function matchRecorderAsSG(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListener> {
    return {
        onAwaitRoll: (_: SGToRoll, lastState: SGInPlay) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(lastState.curPly),
                lastState
            )
        },

        onGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfGame: (sgEoG: SGEoG) => {
            const { stake, result, eogStatus } = sgEoG
            matchRecorder.recordEoG(plyRecordForEoG(stake, result, eogStatus))
        },
    }
}

export function matchRecorderAsBG(
    gameConf: GameConf,
    matchRecorder: MatchRecorder<BGState>
): Partial<BGListener> {
    return {
        onAwaitCubeAction: (
            _: { cbState: CBAction | CBToRoll; sgState: SGToRoll },
            lastState: { cbState: CBInPlay; sgState: SGInPlay }
        ) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(lastState.sgState.curPly),
                lastState
            )
        },
        onDoubled: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            lastState: CBAction
        ) => {
            const plyRecord = plyRecordForDouble(
                lastState.cubeState,
                lastState.isRed
            )
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },

        onDoubleAccepted: (
            bgState: { cbState: CBToRoll; sgState: SGToRoll },
            lastState: CBResponse
        ) => {
            const plyRecord = plyRecordForTake(lastState.isRed)
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },

        onBGGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfBGGame: (
            bgState: { cbState: CBEoG; sgState: SGState },
            lastState?: CBResponse
        ) => {
            if (lastState !== undefined) {
                const plyRecord = plyRecordForPass(
                    lastState.isRed ? SGResult.WHITEWON : SGResult.REDWON
                )
                matchRecorder.recordPly(plyRecord, {
                    cbState: lastState,
                    sgState: bgState.sgState,
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

export function buildMatchRecorder<T>(
    matchRecord: MatchRecord<T>,
    setMatchRecord: (f: (prev: MatchRecord<T>) => MatchRecord<T>) => void
): MatchRecorder<T> {
    function recordPly(plyRecord: PlyRecordInPlay, state: T) {
        setMatchRecord((prev) =>
            prev.isEoG ? prev : addPlyRecord(prev, plyRecord, state)
        )
    }

    function recordEoG(eogPlyRecord: PlyRecordEoG) {
        setMatchRecord((prev) => {
            if (prev.isEoG) {
                return prev
            }
            return eogRecord(prev, eogPlyRecord)
        })
    }

    function resetCurGame() {
        setMatchRecord((prev) =>
            prev.isEoG ? recordFinishedGame(prev) : discardCurrentGame(prev)
        )
    }

    function resumeTo(index: number): PlyStateRecord<T> {
        setMatchRecord((prev) => trimPlyRecords(prev, index))
        return matchRecord.curGameRecord.plyRecords[index]
    }

    return {
        recordEoG,
        resetCurGame,
        recordPly,
        resumeTo,
    }
}
