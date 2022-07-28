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
        onCheckerPlayCommitted: (committedState: SGInPlay) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                committedState
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
        onPassed: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            isRedWon: boolean
        ) => {
            const plyRecord = plyRecordForPass(
                isRedWon ? SGResult.REDWON : SGResult.WHITEWON
            )
            matchRecorder.recordPly(plyRecord, bgState)
        },
        onBGGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onCommitted: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const committedState = bgState.sgState
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                bgState
            )
        },
        onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => {
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
