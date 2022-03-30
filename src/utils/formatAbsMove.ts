import { AbsoluteMove } from '../AbsoluteMove'

/**
 * 駒の移動の表記方法の指定
 */
export enum MoveFormatDirection {
    /**  Whiteは開始点を0とし、増加方向に駒を進める表記。Redは24から減少方向に進む */
    ABSOLUTE = 1,

    /** ABSOLUTEを反転させ、Redの開始点を0とする表記 */
    ABSOLUTE_INV,

    /** WhiteもRedも開始点を0とし、増加方向に駒を進める表記 */
    RELATIVE_ASC,

    /**  RELATIVE_ASCを反転させ、開始点を24とする表記 */
    RELATIVE_DEC,
}

/**
 * ムーブ1つを文字列表現に変換する。
 *
 * ※連続するムーブ（e.g. 1/3 3/4 を1/3/4または1/4とまとめる機能は未実装）
 *
 * @param move 対象ムーブ
 * @param direction 表記方法
 * @returns 変換後の文字列
 */
export function formatAbsMove(
    move: AbsoluteMove,
    direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC
): string {
    return moveFormatter(direction)(move)
}

/**
 * ムーブの配列を文字列表現、またはムーブなしの表記の配列に変換する
 *
 * ※連続するムーブ（e.g. 1/3 3/4 を1/3/4または1/4とまとめる機能は未実装）
 *
 * @param move 対象ムーブ
 * @param direction 表記方法
 * @param labelNoMove ムーブがない（空配列が渡された場合）の表記
 * @returns 各ムーブを変換した文字列の配列
 */
export function formatAbsMoves(
    moves: AbsoluteMove[],
    direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC,
    labelNoMove: string = ''
): string[] {
    if (moves.length === 0) {
        return [labelNoMove]
    }

    return moves.map((move) => formatAbsMove(move, direction))
}

function moveFormatter(
    direction: MoveFormatDirection
): (move: AbsoluteMove) => string {
    const getter: (move: AbsoluteMove) => number[] = (() => {
        switch (direction) {
            case MoveFormatDirection.ABSOLUTE: {
                return (move: AbsoluteMove) => [move.fromAbs, move.toAbs]
            }
            case MoveFormatDirection.ABSOLUTE_INV: {
                return (move: AbsoluteMove) => [move.fromAbsInv, move.toAbsInv]
            }
            case MoveFormatDirection.RELATIVE_ASC: {
                return (move: AbsoluteMove) => [move.fromAsc, move.toAsc]
            }
            case MoveFormatDirection.RELATIVE_DEC: {
                return (move: AbsoluteMove) => [move.fromDec, move.toDec]
            }
        }
    })()

    return (move: AbsoluteMove) => {
        const [mFrom, mTo] = getter(move)
        const from = move.isReenter ? 'Bar' : mFrom
        const to = move.isBearOff ? 'Off' : mTo
        const hit = move.isHit ? '*' : ''
        return `${from}/${to}${hit}`
    }
}
