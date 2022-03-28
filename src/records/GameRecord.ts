import { PlyStateRecord } from "./PlyStateRecord";
import { Score } from "../Score";
import { PlyRecordEoG } from "./PlyRecord";


/**
 * 1ゲーム分、すなわちオープニングロールからゲームが終局するまでの記録。
 * 
 * ゲームが終局しているか進行中かを別々の型として区別するのが主な役割で、
 * 実質的には、各手番とその時点の局面とを表すPlyStateRecordの配列と、累計点を保持するに過ぎない。
 * 
 * @template T 手番に紐づけて保持される、局面を表す任意のオブジェクトの型
 */
export type GameRecord<T> = GameRecordEoG<T> | GameRecordInPlay<T>

/**
 * 終局したゲームの記録
 */
export type GameRecordEoG<T> = _GameRecord<T> & {
    eogRecord: PlyRecordEoG
    isEoG: true
}

/**
 * 進行中のゲームの記録
 */
export type GameRecordInPlay<T> = _GameRecord<T> & {
    isEoG: false
}

type _GameRecord<T> = {
    scoreBefore: Score;
    plyRecords: PlyStateRecord<T>[]
}

/**
 * 開始直後の状態のゲームの記録を生成する
 * 
 * @param scoreBefore ゲーム開始時の累計点
 * @returns 進行中のゲームの記録
 */
export function initGameRecord<T>(scoreBefore: Score): GameRecordInPlay<T> {
    return {
        scoreBefore,
        isEoG: false,
        plyRecords: [],
    }
}

/**
 * 進行中のゲームの記録に、最終結果の記録を追加して終局後のゲームの記録を生成する
 * 
 * @param curGameRecord 進行中のゲーム
 * @param eogRecord 最終結果を格納した記録
 * @returns 生成された終局後のゲームの記録
 */
export function eogGameRecord<T>(curGameRecord: GameRecordInPlay<T>, eogRecord: PlyRecordEoG): GameRecordEoG<T> {
    return {
        ...curGameRecord,
        isEoG: true,
        eogRecord
    }
}
