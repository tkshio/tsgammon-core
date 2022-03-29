import { Move } from "../Move";

/**
 * ムーブ1つを文字列表現に変換する。
 * 
 * @param move 対象ムーブ
 * @returns 変換後の文字列
 */
export function formatMove(move: Move): string {
    const from = move.from === 0 ? "Bar" : move.from
    const to = move.isBearOff ? "Off" : move.to
    const hit = move.isHit ? "*" : ""
    return `${from}/${to}${hit}`
}

export function formatMoves(moves: Move[]): string[] {
    return moves.map(formatMove)
}

