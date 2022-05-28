import {
    MatchStateEOG,
    matchStateInPlay,
    MatchStateInPlay,
} from '../dispatchers/MatchState'
import { GameConf, standardConf } from '../GameConf'
import {
    eogGameRecord,
    GameRecordEoG,
    GameRecordInPlay,
    initGameRecord,
} from './GameRecord'
import { PlyRecordEoG, PlyRecordInPlay } from './PlyRecord'

/**
 * マッチ全体の記録
 * @template T 手番に紐づけて保持される、局面を表す任意のオブジェクトの型
 */
export type MatchRecord<T> = MatchRecordInPlay<T> | MatchRecordEoG<T>
type _MatchRecord<T> = {
    /** ルールなど、ゲームの設定 */
    conf: GameConf
    /** すでに終局したゲームの記録 */
    gameRecords: GameRecordEoG<T>[]
}

export type MatchRecordInPlay<T> = _MatchRecord<T> & {
    isEoG: false
    matchState: MatchStateInPlay
    /** 現ゲームの記録：すなわち、現在進行中、または最後に終局したゲームの記録 */
    curGameRecord: GameRecordInPlay<T>
}
export type MatchRecordEoG<T> = _MatchRecord<T> & {
    isEoG: true
    matchState: MatchStateEOG

    /** 現ゲームの記録：すなわち、現在進行中、または最後に終局したゲームの記録 */
    curGameRecord: GameRecordEoG<T>
}

export function matchRecord<T>(
    conf: GameConf = standardConf,
    matchState: MatchStateInPlay
): MatchRecordInPlay<T> {
    const curGameRecord = initGameRecord<T>(matchState)
    return {
        isEoG: false,
        conf,
        matchState,
        gameRecords: [],
        curGameRecord,
    }
}

/**
 * 現在の記録について、一手番分の記録を追加して返す
 *
 * @param matchRecord 現在の記録
 * @param plyRecord 追加される手番の記録
 * @param state 手番に紐づけて記録される、局面の状態を示す任意のオブジェクト
 * @returns 更新後の記録
 */
export function addPlyRecord<T>(
    matchRecord: MatchRecordInPlay<T>,
    plyRecord: PlyRecordInPlay,
    state: T
): MatchRecordInPlay<T> {
    return {
        ...matchRecord,
        curGameRecord: {
            ...matchRecord.curGameRecord,
            plyRecords: matchRecord.curGameRecord.plyRecords.concat({
                plyRecord,
                state,
            }),
        },
    }
}

/**
 * 現在の記録について、現ゲームの記録をリセットして返す
 *
 * 現ゲームが終局していれば、すでに終局したゲームの記録に追加する。そうでなければ破棄する。
 *
 * ※ 現ゲームが終局しても、画面表示上は終局状態として現ゲームの記録が必要なので、
 * 終局の記録{@link setEoGRecord}と現ゲームの記録のリセットとで処理を分けている。
 *
 * @param matchRecord 現在の記録
 * @returns 更新後の記録
 */
export function recordFinishedGame<T>(
    matchRecord: MatchRecordEoG<T>
): MatchRecord<T> {
    const { matchState } = matchRecord
    if (matchRecord.matchState.isEoM) {
        return matchRecord
    } else {
        const matchStateNext = matchStateInPlay(
            matchState.matchLength,
            matchState.scoreAfter,
            matchState.stakeConf,
            matchState.isCrawfordNext
        )
        return {
            ...matchRecord,
            isEoG: false,
            matchState: matchStateNext,
            gameRecords: matchRecord.gameRecords.concat(
                matchRecord.curGameRecord
            ),
            curGameRecord: initGameRecord(matchStateNext),
        }
    }
}
export function discardCurrentGame<T>(
    matchRecord: MatchRecordInPlay<T>
): MatchRecordInPlay<T> {
    return {
        ...matchRecord,
        curGameRecord: initGameRecord(matchRecord.matchState),
    }
}

/**
 * 現在の記録について、任意の手番に復帰し、それ以降の手番の記録を破棄して返す
 * @param matchRecord 現在の記録
 * @param index 復帰先となる手番
 * @returns 更新後の記録
 */
export function trimPlyRecords<T>(
    matchRecord: MatchRecordInPlay<T>,
    index: number
): MatchRecordInPlay<T> {
    if (0 <= index && index < matchRecord.curGameRecord.plyRecords.length) {
        return {
            ...matchRecord,
            curGameRecord: {
                ...matchRecord.curGameRecord,
                plyRecords: matchRecord.curGameRecord.plyRecords.slice(
                    0,
                    index
                ),
                isEoG: false,
            },
        }
    } else {
        return matchRecord
    }
}

/**
 * 現在の記録について、現ゲームの記録に終局の記録を追加して返す
 *
 * @param matchRecord 現在の記録
 * @param eogMatchState 終局時のMatchState
 * @param eogRecord 終局の記録
 * @returns 更新後の記録
 */
export function setEoGRecord<T>(
    matchRecord: MatchRecordInPlay<T>,
    eogMatchState: MatchStateEOG,
    eogRecord: PlyRecordEoG
): MatchRecordEoG<T> {
    const curGameRecord = eogGameRecord(
        matchRecord.curGameRecord,
        eogRecord,
        eogMatchState.scoreAfter
    )
    return {
        ...matchRecord,
        isEoG: true,
        curGameRecord,
        matchState: eogMatchState,
    }
}
