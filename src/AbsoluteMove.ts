import { Move } from './Move'

/**
 *  指し手を表現するとともに、絶対表記を含め、様々なフォーマットでの出力に対応するインターフェース
 */
export interface AbsoluteMove {
    fromAbs: number
    toAbs: number

    fromAbsInv: number
    toAbsInv: number

    fromDec: number
    toDec: number

    fromAsc: number
    toAsc: number

    isBearOff: boolean
    isReenter: boolean
    isHit: boolean

    pip: number
}

/**
 * 相対表記のムーブの配列を、白の手番のムーブとして絶対表記のムーブの配列に変換する
 * @param moves 相対表記のムーブの配列
 * @param invertPos 座標変換関数
 * @returns
 */
export function absoluteMovesWhite(
    moves: { from: number; to: number; isHit?: boolean }[],
    invertPos?: (pos: number) => number
): AbsoluteMove[] {
    return makeMovesAbsoluteAsWhite(
        moves.map(
            (move) => ({
                ...move,
                isHit: move.isHit ?? false,
                pip: move.to - move.from,
            }),
            invertPos
        )
    )
}

/**
 * 相対表記のムーブの配列を、赤の手番のムーブとして絶対表記のムーブの配列に変換する
 * @param moves 相対表記のムーブの配列
 * @param invertPos 座標変換関数
 * @returns
 */
export function absoluteMovesRed(
    moves: { from: number; to: number; isHit?: boolean }[],
    invertPos?: (pos: number) => number
): AbsoluteMove[] {
    return makeMovesAbsoluteAsRed(
        moves.map(
            (move) => ({
                ...move,
                isHit: move.isHit ?? false,
                pip: move.to - move.from,
            }),
            invertPos
        )
    )
}

type AMove = Pick<Move, 'from' | 'to' | 'isHit' | 'pip'>
const invertPosDefault = (pos: number) => 25 - pos

/**
 * 最小限の項目からなる相対表記のムーブの配列を、白の手番のムーブとして絶対表記のムーブの配列に変換する
 * @param moves 相対表記のムーブの配列
 * @param invertPos 座標変換関数
 * @returns
 */
export function makeMovesAbsoluteAsWhite(
    moves: AMove[],
    invertPos?: (pos: number) => number
): AbsoluteMove[] {
    return moves.map((move: AMove) => makeMoveAbsoluteAsWhite(move, invertPos))
}

/**
 * 最小限の項目からなる相対表記のムーブの配列を、赤の手番のムーブとして絶対表記のムーブの配列に変換する
 * @param moves 相対表記のムーブの配列
 * @param invertPos 座標変換関数
 * @returns
 */
export function makeMovesAbsoluteAsRed(
    moves: AMove[],
    invertPos?: (pos: number) => number
): AbsoluteMove[] {
    return moves.map((move: AMove) => makeMoveAbsoluteAsRed(move, invertPos))
}

/**
 * 最小限の項目からなる相対表記のムーブを、白の手番のムーブとして絶対表記のムーブに変換する
 * @param moves 相対表記のムーブ
 * @param invertPos 座標変換関数
 * @returns
 */
export function makeMoveAbsoluteAsWhite(
    move: AMove,
    invertPos: (pos: number) => number = invertPosDefault
): AbsoluteMove {
    return makeMoveAbsolute(move, invertPos, (n) => n)
}

/**
 * 最小限の項目からなる相対表記のムーブを、赤の手番のムーブとして絶対表記のムーブに変換する
 * @param moves 相対表記のムーブ
 * @param invertPos 座標変換関数
 * @returns
 */
export function makeMoveAbsoluteAsRed(
    move: AMove,
    invertPos: (pos: number) => number = invertPosDefault
): AbsoluteMove {
    return makeMoveAbsolute(move, invertPos, invertPos)
}

function makeMoveAbsolute(
    move: AMove,
    invertPos: (pos: number) => number,
    makeAbsPos: (pos: number) => number
): AbsoluteMove {
    const fromDec = invertPos(move.from)
    const toDec = invertPos(move.to)
    const fromAbs = makeAbsPos(move.from)
    const toAbs = makeAbsPos(move.to)
    return {
        fromAbs: fromAbs,
        toAbs: toAbs,
        fromAbsInv: invertPos(fromAbs),
        toAbsInv: invertPos(toAbs),
        fromAsc: move.from,
        toAsc: move.to,
        fromDec: fromDec,
        toDec: toDec,
        pip: move.pip,
        isBearOff: toDec <= 0,
        isReenter: move.from === 0,
        isHit: move.isHit,
    }
}
