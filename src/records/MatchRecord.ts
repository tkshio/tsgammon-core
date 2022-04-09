import { GameConf, standardConf } from '../GameConf'
import { score, Score } from '../Score'
import {
    eogGameRecord,
    GameRecord,
    GameRecordEoG,
    initGameRecord,
} from './GameRecord'
import { PlyRecordEoG, PlyRecordInPlay } from './PlyRecord'

/**
 * マッチ全体の記録
 * @template T 手番に紐づけて保持される、局面を表す任意のオブジェクトの型
 */
export type MatchRecord<T> = {
    /** ルールなど、ゲームの設定 */
    conf: GameConf
    /** 現ゲームの記録：すなわち、現在進行中、または最後に終局したゲームの記録 */
    curGameRecord: GameRecord<T>
    /** すでに終局したゲームの記録 */
    gameRecords: GameRecordEoG<T>[]
    /** 現時点の累計点 */
    score: Score
    /** マッチポイント数、0の場合は無制限 */
    matchLength: number
}

export function matchRecord<T>(conf: GameConf = standardConf): MatchRecord<T> {
    return {
        conf,
        gameRecords: [],
        score: score(),
        matchLength: 0,
        curGameRecord: initGameRecord(score()),
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
    matchRecord: MatchRecord<T>,
    plyRecord: PlyRecordInPlay,
    state: T
): MatchRecord<T> {
    return {
        ...matchRecord,
        score: matchRecord.curGameRecord.scoreBefore,
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
    matchRecord: MatchRecord<T>
): MatchRecord<T> {
    if (matchRecord.curGameRecord.isEoG) {
        return {
            ...matchRecord,
            gameRecords: matchRecord.gameRecords.concat(
                matchRecord.curGameRecord
            ),
            curGameRecord: initGameRecord(matchRecord.score),
        }
    } else {
        return {
            ...matchRecord,
            curGameRecord: initGameRecord(matchRecord.score),
        }
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
): MatchRecord<T> {
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
 * @param eogRecord 終局の記録
 * @returns 更新後の記録
 */
export function setEoGRecord<T>(
    matchRecord: MatchRecord<T>,
    eogRecord: PlyRecordEoG
): MatchRecord<T> {
    if (matchRecord.curGameRecord.isEoG) {
        return matchRecord
    }

    const curGameRecord = eogGameRecord(matchRecord.curGameRecord, eogRecord)
    return {
        ...matchRecord,
        score: matchRecord.score.add(eogRecord.stake),
        curGameRecord,
    }
}
