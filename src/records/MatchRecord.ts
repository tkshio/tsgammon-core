import {
    matchStateEoG,
    MatchStateEoG,
    MatchStateInPlay,
    matchStateLastGame,
    matchStateNewGame,
} from '../MatchState'
import { GameConf } from '../GameConf'
import {
    gameRecordEoG,
    GameRecordEoG,
    GameRecordInPlay,
    gameRecordInPlay,
} from './GameRecord'
import { PlyRecordEoG, PlyRecordInPlay } from './PlyRecord'
import { standardConf } from '../GameConfs'

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
    matchState: MatchStateEoG
    /** 現ゲームの記録：すなわち、現在進行中、または最後に終局したゲームの記録 */
    curGameRecord: GameRecordEoG<T>
}

export function matchRecordInPlay<T>(
    conf: GameConf = standardConf,
    matchState: MatchStateInPlay
): MatchRecordInPlay<T> {
    const curGameRecord = gameRecordInPlay<T>(matchState)
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
 * 終局の記録{@link eogRecord}と現ゲームの記録のリセットとで処理を分けている。
 *
 * @param matchRecord 現在の記録
 * @returns 更新後の記録
 */
export function recordFinishedGame<T>(
    matchRecord: MatchRecordEoG<T>
): MatchRecord<T> {
    const { matchState } = matchRecord
    if (matchState.isEoM) {
        return matchRecord
    } else {
        const matchStateNext = matchStateNewGame(matchState)
        return {
            ...matchRecord,
            isEoG: false,
            matchState: matchStateNext,
            gameRecords: matchRecord.gameRecords.concat(
                matchRecord.curGameRecord
            ),
            curGameRecord: gameRecordInPlay(matchStateNext),
        }
    }
}
export function discardCurrentGame<T>(
    matchRecord: MatchRecordInPlay<T>
): MatchRecordInPlay<T> {
    return {
        ...matchRecord,
        curGameRecord: gameRecordInPlay(matchRecord.matchState),
    }
}

/**
 * 現在の記録について、任意の手番に復帰し、それ以降の手番の記録を破棄して返す
 * @param matchRecord 現在の記録
 * @param index 復帰先となる手番
 * @returns 更新後の記録
 */
export function trimPlyRecords<T>(
    matchRecord: MatchRecord<T>,
    index: number
): MatchRecordInPlay<T> {
    const idx =
        0 <= index && index < matchRecord.curGameRecord.plyRecords.length
            ? index
            : matchRecord.curGameRecord.plyRecords.length - 1

    const matchState: MatchStateInPlay = matchRecord.isEoG
        ? matchStateLastGame(matchRecord.matchState)
        : matchRecord.matchState
    return {
        ...matchRecord,
        isEoG: false,
        matchState,
        curGameRecord: {
            ...matchRecord.curGameRecord,
            plyRecords: matchRecord.curGameRecord.plyRecords.slice(0, idx),
            isEoG: false,
        },
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
export function eogRecord<T>(
    matchRecord: MatchRecordInPlay<T>,
    eogRecord: PlyRecordEoG
): MatchRecordEoG<T> {
    const matchState = matchStateEoG(
        matchRecord.matchState,
        eogRecord.stake,
        eogRecord.eogStatus
    )
    const curGameRecord = gameRecordEoG(
        matchRecord.curGameRecord,
        eogRecord,
        matchState.isEoM
    )
    return {
        ...matchRecord,
        isEoG: true,
        curGameRecord,
        matchState,
    }
}
