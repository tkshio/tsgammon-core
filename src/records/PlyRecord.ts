import { Ply } from "../Ply";
import { SGResult } from "./SGResult";
import { CubeState } from "../CubeState";
import { Score } from "../Score";

/**
 * プレイヤーの一回の手番、または終局の記録を表す
 */
export type PlyRecord = PlyRecordInPlay | PlyRecordEoG

/**
 * 手番の記録を表す
 */
export type PlyRecordInPlay =
    {
        tag: "Commit"
        ply: Omit<Ply, 'isRed'> // 重複するisRedを除去
        isRed: boolean
    } |
    {
        tag: "Double"
        cubeValue: number
        isRed: boolean
    } |
    {
        tag: "Take" | "Pass"
        isRed: boolean
    }

/**
* 終局の記録を表す
*/
export type PlyRecordEoG = {
    tag: "EOG"
    stake: Score
    sgResult: SGResult
}

/**
 * チェッカープレイの記録を生成する
 * @param ply チェッカープレイ
 * @returns 手番の記録
 */
export function plyRecordForCheckerPlay(ply: Ply): PlyRecordInPlay {
    return {
        tag: "Commit", ply, isRed: ply.isRed
    }
}

/**
 * 終局の記録を生成する
 * 
 * @param stake 終局による得点
 * @param sgResult 勝者
 * @returns 終局の記録
 */
export function plyRecordForEoG(stake: Score, sgResult: SGResult): PlyRecordEoG {
    return {
        tag: "EOG", stake, sgResult
    }
}

/**
 * ダブルの記録を生成する
 * @param cubeState キューブの状態（ダブル前）
 * @param isRed 赤からのダブルならtrue
 * @returns ダブルの記録
 */
export function plyRecordForDouble(cubeState: CubeState, isRed: boolean): PlyRecordInPlay {
    return {
        tag: "Double", cubeValue: cubeState.doubledValue, isRed
    }
}

/**
 * テイクの記録を生成する
 * @param isRed 赤がテイクした（ダブルしたのは白）のであればtrue
 * @returns テイクの記録
 */
export function plyRecordForTake(isRed: boolean): PlyRecordInPlay {
    return {
        tag: "Take", isRed
    }
}

/**
 * パスの記録を生成する
 * @param sgResult 勝者（ダブルした側）
 * @returns パスの記録：isRedは、赤がパスした場合にtrueが設定される。
 */
export function plyRecordForPass(sgResult: SGResult.REDWON | SGResult.WHITEWON): PlyRecordInPlay {
    return {
        tag: "Pass", isRed: sgResult === SGResult.WHITEWON // 白勝ち=パスをしたのは赤
    }
}
